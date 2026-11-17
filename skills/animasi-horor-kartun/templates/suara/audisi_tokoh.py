"""Audisi suara tokoh Horor USA: 2 calon per tokoh, tiap calon membacakan beberapa baris dengan emosi berbeda.
Hasil: audisi_tokoh.mp3 (label diucapkan narator, lalu contoh), dan audisi/tokoh_<nama>_<A|B>.wav.
Jalankan dengan venv_supertonic.
"""
import os
import subprocess
import numpy as np
import suara
from suara import Suara

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "audisi")
os.makedirs(OUT, exist_ok=True)

CALON = {
    "jake": [("A", {"voice": "M1", "st": 1.5, "speed": 1.02}), ("B", {"voice": "M3", "st": 3.0, "speed": 1.04})],
    "emily": [("A", {"voice": "F2", "st": 1.0, "speed": 1.03}), ("B", {"voice": "F1", "st": 1.5, "speed": 1.03})],
    "miller": [("A", {"voice": "M4", "st": -2.0, "speed": 0.9}), ("B", {"voice": "M3", "st": -1.5, "speed": 0.88})],
    "psiko": [("A", {"voice": "M5", "st": -4.0, "speed": 0.85}), ("B", {"voice": "M2", "st": -3.5, "speed": 0.85})],
    "operator": [("A", {"voice": "F5", "st": 0.0, "speed": 1.0}), ("B", {"voice": "F3", "st": 0.0, "speed": 1.0})],
}
BARIS = {
    "jake": [("netral", "It does not count."), ("takut", "I'm trying! There's no signal!"), ("teriak", "Run!"), ("sedih", "We thought... we thought you were the creepy one.")],
    "emily": [("senang", "And it landed! That counts!"), ("bisik", "Is he gone? Jake... is he gone?"), ("takut", "Jake, the ice... it's cracking!"), ("teriak", "Twelve minutes? Jake, we don't have twelve minutes!")],
    "miller": [("seram", "Evening, kids. Awful cold night to be walking alone."), ("marah", "In. Both of you. Now!"), ("senang", "Son, I'm eighty-one years old. I'm allowed to be a little creepy.")],
    "psiko": [("bisik", "Found you."), ("seram", "Found you.")],
    "operator": [("netral", "Nine-one-one, what is your emergency?"), ("netral", "Okay. Stay calm. Officers are on the way.")],
}
NAMA = {"jake": "Jake", "emily": "Emily", "miller": "Mister Miller", "psiko": "The Smiling Man", "operator": "The nine-one-one operator"}

S = Suara()
SR = 48000
narr = dict(suara.TOKOH["narator"])
parts = []


def load(p):
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", p, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32)


def gap(s):
    return np.zeros(int(s * SR), dtype=np.float32)


for who, cands in CALON.items():
    for tag, cfg in cands:
        suara.TOKOH["narator"] = narr
        lab = os.path.join(OUT, "_label.wav")
        S.ucap("narator", "netral", f"{NAMA[who]}. Option {tag}.", lab)
        parts += [load(lab), gap(0.5)]
        suara.TOKOH[who] = cfg
        clips = []
        for i, (emo, text) in enumerate(BARIS[who]):
            p = os.path.join(OUT, f"_{who}_{tag}_{i}.wav")
            S.ucap(who, emo, text, p)
            a = load(p)
            clips += [a, gap(0.6)]
            parts += [a, gap(0.6)]
        sample = np.concatenate(clips)
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", os.path.join(OUT, f"tokoh_{who}_{tag}.wav")],
                       input=sample.tobytes(), check=True)
        parts.append(gap(0.8))
        print(who, tag, cfg["voice"], f"{len(sample) / SR:.1f}s", flush=True)
all_ = np.concatenate(parts)
peak = np.abs(all_).max() or 1
all_ = all_ / peak * 0.89
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-codec:a", "libmp3lame", "-b:a", "160k",
                os.path.join(HERE, "audisi_tokoh.mp3")], input=all_.tobytes(), check=True)
for f in os.listdir(OUT):
    if f.startswith("_"):
        os.remove(os.path.join(OUT, f))
print("selesai", round(len(all_) / SR, 1), "s")
