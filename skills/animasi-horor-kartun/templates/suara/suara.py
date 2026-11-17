"""Suara tokoh Horor USA: Supertonic 3 (bahasa Inggris) + olah emosi dengan ffmpeg (rubberband, vibrato, EQ).

Tiap tokoh punya suara dasar Supertonic sendiri (M1-M5 / F1-F5) dan nada dasar sendiri (semitone). Tiap emosi
menambah: geser nada (tinggi/rendah), kecepatan bicara, keras-pelan, dan efek kecil:
  netral   0 st, 1.00x            biasa
  senang  +1.5 st, 1.07x, +1 dB   lebih tinggi dan cepat
  takut   +2 st, 1.12x, vibrato   suara gemetar
  teriak  +3.5 st, 1.18x, +5 dB   panik, keras
  sedih   -1.2 st, 0.86x, -2 dB   rendah, lambat
  seram   -2 st, 0.84x            rendah, lambat, mengancam
  bisik   -3 st, 0.80x, -5 dB     pelan, tipis (EQ potong bas)
  marah   -0.5 st, 1.05x, +3 dB   tegas, keras
Narator: tanpa reverb (aturan proyek).

Pakai (dari venv_supertonic):
    from suara import Suara
    s = Suara()
    s.ucap("jake", "takut", "Emily... run. RUN!", "out/jake_001.wav")
"""
import os
import subprocess
import tempfile
import re
import numpy as np
from supertonic import TTS

# suara dasar + nada dasar per tokoh (diisi setelah audisi; nilai awal dari pengukuran nada tiap suara bawaan)
TOKOH = {
    "narator":  {"voice": "M5", "st": 0.0, "speed": 0.90},
    "jake":     {"voice": "M1", "st": 1.5, "speed": 1.02},
    "emily":    {"voice": "F2", "st": 1.0, "speed": 1.03},
    "miller":   {"voice": "M4", "st": -2.0, "speed": 0.9},
    "psiko":    {"voice": "M2", "st": -3.5, "speed": 0.85},
    "operator": {"voice": "F5", "st": 0.0, "speed": 1.0},
}

EMOSI = {
    #          st     speed  dB   efek
    "netral": (0.0,   1.00,  0.0, ""),
    "senang": (1.5,   1.07,  1.0, ""),
    "takut":  (2.0,   1.12,  0.0, "vibrato=f=6.5:d=0.18"),
    "teriak": (3.5,   1.18,  5.0, "acompressor=threshold=-18dB:ratio=4:attack=5:release=60"),
    "sedih":  (-1.2,  0.86, -2.0, ""),
    "seram":  (-2.0,  0.84,  0.0, "lowpass=f=6500"),
    "bisik":  (-3.0,  0.80, -5.0, "highpass=f=380,lowpass=f=5200"),
    "marah":  (-0.5,  1.05,  3.0, "acompressor=threshold=-20dB:ratio=3:attack=5:release=80"),
}


class Suara:
    def __init__(self, steps: int = 12):
        self.tts = TTS(auto_download=True)
        self.sr = getattr(self.tts, "sample_rate", 44100)
        self.steps = steps
        self._styles = {}

    def _style(self, v: str):
        if v not in self._styles:
            self._styles[v] = self.tts.get_voice_style(voice_name=v)
        return self._styles[v]

    @staticmethod
    def kalimat(teks: str):
        """pecah teks per kalimat; tanda baca akhir (. ! ? ...) ikut kalimatnya"""
        parts = re.findall(r"[^.!?]+(?:\.\.\.|[.!?]+)?", teks)
        return [p.strip() for p in parts if p.strip()]

    @staticmethod
    def intonasi(sents):
        """nada (semitone) dan tempo per kalimat supaya tidak datar: tanya naik, seru naik + cepat, kalimat terakhir turun +
        melambat, kalimat sangat pendek melambat, kalimat berurutan selang-seling sedikit naik/turun. Juga jeda sesudahnya."""
        out = []
        n = len(sents)
        for i, s in enumerate(sents):
            st, sp, pause = 0.0, 1.0, 0.3
            if s.endswith("?"):
                st += 0.9
            elif s.endswith("!"):
                st += 0.6; sp *= 1.04
            if s.endswith("..."):
                sp *= 0.95; pause = 0.5
            if len(s.split()) <= 3:
                sp *= 0.92; pause = max(pause, 0.42)
            if n > 1 and i == n - 1:
                st -= 0.7; sp *= 0.95
            elif n > 1:
                st += 0.45 if i % 2 == 0 else -0.25
            out.append((st, sp, pause))
        return out

    def _piece(self, text, voice, speed, shift, d, k):
        """satu kalimat: Supertonic -> geser nada/tempo (rubberband) -> potong hening di ujung -> array 48 kHz"""
        syn = min(2.0, max(0.7, speed))  # batas Supertonic; sisa perlambatan dikerjakan rubberband (tempo)
        tempo = speed / syn
        wav, _ = self.tts.synthesize(text, voice_style=self._style(voice), total_steps=self.steps, speed=syn, silence_duration=0.2, lang="en")
        raw, outp = os.path.join(d, f"r{k}.wav"), os.path.join(d, f"p{k}.f32")
        self.tts.save_audio(np.asarray(wav, dtype=np.float32).reshape(-1), raw)
        chain = [f"rubberband=pitch={2 ** (shift / 12):.5f}:tempo={tempo:.4f}:formant=preserved"] if abs(shift) > 0.05 or abs(tempo - 1) > 0.01 else []
        chain += ["aresample=48000", "silenceremove=start_periods=1:start_threshold=-50dB", "areverse", "silenceremove=start_periods=1:start_threshold=-50dB", "areverse"]
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", raw, "-af", ",".join(chain), "-ac", "1", "-f", "f32le", outp], check=True)
        return np.fromfile(outp, dtype=np.float32)

    def ucap(self, tokoh: str, emosi: str, teks: str, out: str, extra_st: float = 0.0) -> float:
        """sintesis satu baris tokoh dengan emosi tertentu -> wav mono 48 kHz; mengembalikan durasi (detik)"""
        T = TOKOH[tokoh]
        st, sp, db, fx = EMOSI[emosi]
        sents = self.kalimat(teks)
        with tempfile.TemporaryDirectory() as d:
            pieces = []
            for k, (s, (pst, psp, pause)) in enumerate(zip(sents, self.intonasi(sents))):
                a = self._piece(s, T["voice"], T["speed"] * sp * psp, T["st"] + st + extra_st + pst, d, k)
                pieces += [a, np.zeros(int(pause * 48000), dtype=np.float32)]
            line = np.concatenate(pieces[:-1]) if len(pieces) > 1 else pieces[0]
            raw = os.path.join(d, "line.f32")
            line.astype(np.float32).tofile(raw)
            # keras tiap baris diseragamkan dulu (-19 LUFS), baru beda keras per emosi, lalu limiter (tidak pernah terpotong)
            chain = ([fx] if fx else []) + ["loudnorm=I=-19:TP=-3:LRA=11", f"volume={db}dB", "alimiter=limit=0.89:level=false", "aresample=48000"]
            os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", "48000", "-ac", "1", "-i", raw, "-af", ",".join(chain), "-ac", "1", out], check=True)
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out],
                           capture_output=True, text=True, check=True)
        return float(r.stdout.strip())
