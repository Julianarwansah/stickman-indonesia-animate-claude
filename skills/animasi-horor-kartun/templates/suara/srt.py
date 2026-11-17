"""Subtitle bahasa Inggris (SRT) untuk YouTube dari <folder_ep>/timeline.json: satu entri per baris naskah, dipecah kalau > 84 huruf.
    python srt.py <folder_ep>   ->  <folder_ep>/<ep>_en.srt
Nama pembicara (selain narator) ditulis di depan kalimatnya. Ubah NAMES kalau tokohnya berbeda.
"""
import json
import os
import sys
import textwrap

EP = os.path.abspath(sys.argv[1])
tl = json.load(open(os.path.join(EP, "timeline.json")))
NAMES = {"jake": "JAKE", "emily": "EMILY", "miller": "MR. MILLER", "psiko": "???", "operator": "911 OPERATOR"}


def ts(sec):
    ms = int(round(sec * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


out, n = [], 0
for b in tl["baris"]:
    if not b.get("text"):
        continue
    text = b["text"] if b["who"] == "narator" else f"{NAMES.get(b['who'], b['who'].upper())}: {b['text']}"
    chunks = textwrap.wrap(text, 84) if len(text) > 84 else [text]
    groups = [chunks[i:i + 2] for i in range(0, len(chunks), 2)]
    a, e = b["start"] / 30, b["end"] / 30
    total = sum(len(" ".join(g)) for g in groups)
    t = a
    for g in groups:
        d = (e - a) * len(" ".join(g)) / total
        n += 1
        out.append(f"{n}\n{ts(t)} --> {ts(t + d)}\n" + "\n".join(g) + "\n")
        t += d
p = os.path.join(EP, f"{os.path.basename(EP)}_en.srt")
open(p, "w", encoding="utf-8").write("\n".join(out))
print(p, n, "entri")
