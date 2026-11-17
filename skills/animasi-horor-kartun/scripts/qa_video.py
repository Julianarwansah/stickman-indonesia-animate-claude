"""Pengecekan otomatis video jadi: frame, durasi, layar hitam, gambar diam, keras suara.

    python qa_video.py <video.mp4> <timeline.json>

Lulus kalau: jumlah frame = timeline total, ada trek suara, keras -17..-15 LUFS, puncak <= -3.5 dBFS.
Layar hitam & gambar diam DILAPORKAN beserta scene-nya; yang wajar: scene "hitam", sisipan ponsel/911/berita berlatar
gelap, kartu judul/bab yang tertahan. Selain itu periksa dengan lembar kontak.
"""
import json
import re
import subprocess
import sys

video, tlp = sys.argv[1], sys.argv[2]
tl = json.load(open(tlp))
lines = tl["baris"]


def scene_at(sec):
    f = sec * 30 + 1  # toleransi pembulatan di batas shot
    cur = lines[0]["scene"]
    for l in lines:
        if l["start"] <= f:
            cur = l["scene"]
    return cur


ok = True
r = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-show_entries", "stream=codec_type,width,height,nb_read_packets:format=duration",
                    "-of", "json", video], capture_output=True, text=True, check=True)
info = json.loads(r.stdout)
v = next(s for s in info["streams"] if s["codec_type"] == "video")
has_a = any(s["codec_type"] == "audio" for s in info["streams"])
n = int(v["nb_read_packets"])
print(f"video {v['width']}x{v['height']}, {n} frame (timeline {tl['total']}), durasi {float(info['format']['duration']):.2f}s, suara: {'ada' if has_a else 'TIDAK ADA'}")
ok &= n == tl["total"] and has_a

r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-vf", "blackdetect=d=0.3:pix_th=0.06,freezedetect=n=0.0015:d=2.5",
                    "-an", "-f", "null", "-"], capture_output=True, text=True)
for m in re.finditer(r"black_start:([\d.]+) black_end:([\d.]+)", r.stderr):
    a, b = float(m.group(1)), float(m.group(2))
    print(f"  hitam {a:7.2f}-{b:7.2f}s  scene {scene_at(a)}")
for m in re.finditer(r"freeze_start: ([\d.]+)", r.stderr):
    a = float(m.group(1))
    print(f"  diam  {a:7.2f}s          scene {scene_at(a)}")

if has_a:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True)
    summ = r.stderr[r.stderr.rfind("Summary"):]
    I = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
    P = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))
    print(f"keras {I} LUFS, puncak {P} dBFS")
    ok &= -17 <= I <= -15 and P <= -3.5
print("LULUS" if ok else "PERLU DICEK")
