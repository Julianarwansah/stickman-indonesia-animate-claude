"""Mesin mixing: suara (vo) + efek suara + suasana -> <ep>/mix.wav (48 kHz stereo, -16 LUFS, puncak sekitar -4.5 dBTP).

    python mix.py <folder_ep> <isyarat_sfx.py> [--kit <folder kit CC0>]

<isyarat_sfx.py> = daftar efek per episode (contoh: examples/ep1/sfx_ep1.py). Ia dijalankan dengan nama-nama ini tersedia:
  t0(id, frac=0)  detik mulai baris (atau posisi frac 0..1 di dalam baris)      t1(id)  detik selesai baris
  word(id, kata)  detik kira-kira saat kata itu diucapkan                        L, TOTAL, SR
  place(src, at, db, dur=None, offset=0, tempo=1, st=0, fin=0.03, fout=0.25, bus=None, loop=False)
  steps(src, at, n, gap, db, st=0, tempo=1, dur=0.6, offset=0)                   bus_amb (bus suasana, diturunkan di bawah dialog)
src = id Lots of Sounds ("fs-348248") atau nama file kit CC0 ("whoosh.ogg"). Efek tidak pernah disintesis (aturan skill
sound-effects): semuanya rekaman asli, diunduh sekali ke <proyek>/suara/sfx_cache/.
"""
import argparse
import json
import os
import subprocess
import urllib.request
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("isyarat")
ap.add_argument("--kit", default=None)
ap.add_argument("--lufs", type=float, default=-16.0, help="-16 YouTube panjang; -14 Shorts/Reels/TikTok (lebih keras di ponsel)")
A = ap.parse_args()
EP = os.path.abspath(A.ep)
PROJ = os.path.dirname(EP)
CACHE = os.path.join(PROJ, "suara", "sfx_cache")
KIT = A.kit or os.path.join(PROJ, "motion", "skill-sound-effects", "sfx", "kit")
SR = 48000
os.makedirs(CACHE, exist_ok=True)

tl = json.load(open(os.path.join(EP, "timeline.json")))
L = {l["id"]: l for l in tl["baris"]}
TOTAL = tl["total"] / 30
N = int(TOTAL * SR)


def t0(i, frac=0.0):
    l = L[i]
    return (l["start"] + frac * (l["end"] - l["start"])) / 30


def t1(i):
    return L[i]["end"] / 30


def word(i, w):
    l = L[i]
    return t0(i, l["text"].index(w) / len(l["text"]))


def fetch(sid):
    p = os.path.join(CACHE, f"{sid}.mp3")
    if not os.path.exists(p):
        with urllib.request.urlopen(f"https://api.lotsofsounds.com/api/v1/sounds/sample/{sid}/stream") as r:
            url = json.load(r)["data"]["stream_url"]  # tautan sementara, langsung diunduh
        urllib.request.urlretrieve(url, p)
    return p


def load(src, offset=0.0, dur=None, tempo=1.0, st=0.0):
    path = os.path.join(KIT, src) if src.endswith(".ogg") else fetch(src)
    af = ["aresample=48000"]
    if abs(tempo - 1) > 0.01 or abs(st) > 0.05:
        af.insert(0, f"rubberband=tempo={tempo:.4f}:pitch={2 ** (st / 12):.5f}")
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", str(offset)] + (["-t", str(dur * tempo)] if dur else []) + ["-i", path, "-af", ",".join(af), "-ac", "1", "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()


bus_fx = np.zeros(N, dtype=np.float32)
bus_amb = np.zeros(N, dtype=np.float32)


def place(src, at, db, dur=None, offset=0.0, tempo=1.0, st=0.0, fin=0.03, fout=0.25, bus=None, loop=False):
    bus = bus_fx if bus is None else bus
    a = load(src, offset, None if loop else dur, tempo, st)
    if loop and dur:
        n = int(dur * SR)
        a = np.tile(a, n // max(1, len(a)) + 1)[:n]
    if not len(a):
        return
    i0 = int(at * SR)
    if i0 >= N or i0 < 0:
        return
    a = a[: N - i0] * (10 ** (db / 20))
    nf, no = int(fin * SR), int(fout * SR)
    if nf:
        a[:nf] *= np.linspace(0, 1, min(nf, len(a)))[: len(a[:nf])]
    if no and len(a) > no:
        a[-no:] *= np.linspace(1, 0, no)
    bus[i0: i0 + len(a)] += a


def steps(src, at, n, gap, db, st=0.0, tempo=1.0, dur=0.6, offset=0.0):
    for k in range(n):
        place(src, at + k * gap, db, dur=dur, offset=offset + (k % 4) * 0.7, st=st, tempo=tempo, fout=0.12)


ns = dict(t0=t0, t1=t1, word=word, place=place, steps=steps, L=L, TOTAL=TOTAL, SR=SR, bus_amb=bus_amb, np=np)
exec(compile(open(A.isyarat, encoding="utf-8").read(), A.isyarat, "exec"), ns)

# ---- gabung: vo + efek + suasana (suasana turun 5 dB, efek 2 dB di bawah dialog) ----
vo = np.zeros(N, dtype=np.float32)
r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(EP, "suara_vo.wav"), "-af", "aresample=48000", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True)
v = np.frombuffer(r.stdout, dtype=np.float32)
vo[: min(N, len(v))] = v[:N]
hop = 480
env = np.sqrt(np.convolve((vo[: len(vo) // hop * hop].reshape(-1, hop) ** 2).mean(axis=1), np.ones(25) / 25, mode="same"))
duck = np.interp(np.arange(N), np.arange(len(env)) * hop, np.clip(env / 0.02, 0, 1))
bus_amb *= 10 ** (-5 * duck / 20)
bus_fx *= 10 ** (-2 * duck / 20)
mix = vo + bus_fx + bus_amb
raw = os.path.join(EP, "mix_raw.f32")
np.stack([mix, mix], axis=1).astype(np.float32).tofile(raw)
out = os.path.join(EP, "mix.wav")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw,
                "-af", f"loudnorm=I={A.lufs}:TP=-4.5:LRA=14,alimiter=limit=0.6:level=false,aresample=48000", "-c:a", "pcm_s16le", out], check=True)
os.remove(raw)
print("mix.wav", round(TOTAL, 1), "s")
