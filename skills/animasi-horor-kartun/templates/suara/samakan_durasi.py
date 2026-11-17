"""Samakan durasi baris 'takut' yang baru dibuat dengan durasi timeline lama (yang dipakai video yang sudah dirender).
    python suara/samakan_durasi.py <folder_short> <timeline_lama.json> <naskah.json>
Klip baru dipotong/diberi hening di ujung sampai sama dengan durasi lama, supaya timing video tidak bergeser.
"""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from buat_suara import read_wav, write_wav

ep, lama_p, naskah_p = sys.argv[1], sys.argv[2], sys.argv[3]
lama = {b["id"]: b for b in json.load(open(lama_p))["baris"]}
naskah = {b["id"]: b for b in json.load(open(naskah_p, encoding="utf-8"))["baris"]}
for bid, nb in naskah.items():
    if nb.get("emo") != "takut" or not nb.get("text") or bid not in lama:
        continue
    wp = os.path.join(ep, "vo", f"{bid}.wav")
    a, sr = read_wav(wp)
    target = int(round(lama[bid]["dur"] * sr))
    if len(a) > target:
        a = a[:target].copy()
        fade = min(int(0.05 * sr), len(a))
        a[-fade:] *= np.linspace(1, 0, fade)
    elif len(a) < target:
        a = np.concatenate([a, np.zeros(target - len(a), dtype=np.float32)])
    write_wav(wp, a, sr)
    print(bid, round(len(a) / sr, 3), "dtk (target", lama[bid]["dur"], ")")
