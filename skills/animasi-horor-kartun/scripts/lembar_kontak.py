"""Lembar kontak per shot: satu gambar dari tengah tiap shot, diberi label waktu + nama scene, 30 per lembar.

Dari video jadi (cepat, pakai ffmpeg):
    python lembar_kontak.py video <timeline.json> <video.mp4> <folder_keluar>
Dari Remotion sebelum render (stills per shot; jalankan di folder proyek Remotion):
    python lembar_kontak.py stills <timeline.json> <CompositionId> <folder_keluar>
Lalu buka kontak_1.jpg, kontak_2.jpg, ... dengan Read dan periksa setiap shot.
"""
import json
import os
import subprocess
import sys
from PIL import Image, ImageDraw

mode, tl_path, src, outd = sys.argv[1:5]
os.makedirs(outd, exist_ok=True)
d = json.load(open(tl_path))
shots = []
for l in d["baris"]:
    if shots and shots[-1]["scene"] == l["scene"]:
        continue
    shots.append({"scene": l["scene"], "a": l["start"] if shots else 0})
for i, s in enumerate(shots):
    s["b"] = shots[i + 1]["a"] if i + 1 < len(shots) else d["total"]
mids = [((s["a"] + s["b"]) // 2, s["scene"]) for s in shots]

if mode == "video":
    for f, _ in mids:
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{f / 30:.3f}", "-i", src, "-frames:v", "1", "-vf", "scale=480:-2",
                        os.path.join(outd, f"s_{f}.jpg")], check=True)
else:
    env = dict(os.environ, REMOTION_TMP=os.path.abspath(".remotion_tmp"))
    subprocess.run(["node", "scripts/stills.mjs", src, os.path.join(outd, "s_"), ",".join(str(f) for f, _ in mids), "0.5"], env=env, check=True)

first = next((os.path.join(outd, f"s_{f}.jpg") for f, _ in mids if os.path.exists(os.path.join(outd, f"s_{f}.jpg"))), None)
TW, TH = (384, 216)
if first and Image.open(first).height > Image.open(first).width:
    TW, TH = (216, 384)  # video potret (Shorts/Reels/TikTok)
ims = []
for f, sc in mids:
    p = os.path.join(outd, f"s_{f}.jpg")
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB").resize((TW, TH))
    dr = ImageDraw.Draw(im)
    dr.rectangle([0, 0, TW, 20], fill=(0, 0, 0))
    dr.text((4, 3), f"{int(f / 30) // 60}:{int(f / 30) % 60:02d} f{f} {sc}", fill=(255, 255, 0))
    ims.append(im)
for k in range(0, len(ims), 30):
    part = ims[k:k + 30]
    rows = (len(part) + 5) // 6
    sheet = Image.new("RGB", (TW * 6, TH * rows))
    for i, im in enumerate(part):
        sheet.paste(im, ((i % 6) * TW, (i // 6) * TH))
    sheet.save(os.path.join(outd, f"kontak_{k // 30 + 1}.jpg"), quality=85)
print(len(ims), "shot ->", outd)
