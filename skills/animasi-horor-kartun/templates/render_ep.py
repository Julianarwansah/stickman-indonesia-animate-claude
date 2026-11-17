"""Render final per potongan 1 menit (aman kalau terhenti: potongan lengkap dilewati), lalu sambung + pasang suara.

    python render_ep.py <folder_ep> <CompositionId> <hasil.mp4> [--remo <proyek Remotion>] [--bagian=0,1] [--sambung]

Potongan: <video>/<ep>_parts/part_NN.mp4 (tanpa suara). Tiap potongan ditulis ke file sementara dan baru diganti nama
setelah jumlah framenya cocok, jadi tidak ada potongan setengah jadi. --bagian=... merender potongan tertentu saja
(untuk cek menit pertama dulu). Hasil = video + <folder_ep>/mix.wav (AAC 192k), dipotong tepat ke panjang timeline.
"""
import argparse
import json
import os
import subprocess
import sys

ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("comp")
ap.add_argument("hasil")
ap.add_argument("--remo", default=os.environ.get("REMO_DIR", os.path.join(os.getcwd(), "kartun-3d-shorts")))
ap.add_argument("--chrome", default=os.environ.get("CHROME_PATH"))
ap.add_argument("--bagian", default=None)
ap.add_argument("--sambung", action="store_true")
ap.add_argument("--chunk", type=int, default=1800)
A = ap.parse_args()

EP = os.path.abspath(A.ep)
OUT = os.path.abspath(A.hasil)
PARTS = os.path.join(os.path.dirname(OUT), os.path.basename(EP) + "_parts")
os.makedirs(PARTS, exist_ok=True)
total = json.load(open(os.path.join(EP, "timeline.json")))["total"]
chunks = [(a, min(total, a + A.chunk) - 1) for a in range(0, total, A.chunk)]


def frames(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets",
                        "-of", "csv=p=0", p], capture_output=True, text=True)
    try:
        return int(r.stdout.strip().strip(",").split(",")[0])  # ffprobe menulis "1800," (dengan koma)
    except ValueError:
        return -1


def render(only=None):
    tmpdir = os.path.join(A.remo, ".remotion_tmp")
    env = dict(os.environ, TEMP=tmpdir, TMP=tmpdir)
    for i, (a, b) in enumerate(chunks):
        if only is not None and i not in only:
            continue
        dst = os.path.join(PARTS, f"part_{i:02d}.mp4")
        want = b - a + 1
        if os.path.exists(dst) and frames(dst) == want:
            print(f"lewati part_{i:02d} ({a}-{b}) sudah lengkap", flush=True)
            continue
        tmp = os.path.join(PARTS, f"_tmp_{i:02d}.mp4")
        print(f"render part_{i:02d} frame {a}-{b} ...", flush=True)
        r = subprocess.run(["npx", "remotion", "render", "src/index.ts", A.comp, tmp, f"--frames={a}-{b}", "--codec", "h264", "--crf", "18",
                            "--muted", "--gl", "angle", "--concurrency", "3", "--log", "error"] + (["--browser-executable", A.chrome] if A.chrome else []),
                           cwd=A.remo, env=env, shell=True)
        n = frames(tmp) if os.path.exists(tmp) else -1
        if r.returncode != 0 or n != want:
            print(f"GAGAL part_{i:02d}: kode {r.returncode}, frame {n}/{want}. Jalankan lagi untuk melanjutkan.", flush=True)
            sys.exit(1)
        os.replace(tmp, dst)
        print(f"selesai part_{i:02d}", flush=True)


def sambung():
    lst = os.path.join(PARTS, "list.txt")
    with open(lst, "w") as f:
        for i in range(len(chunks)):
            f.write(f"file 'part_{i:02d}.mp4'\n")
    silent = os.path.join(PARTS, "_video.mp4")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", silent, "-i", os.path.join(EP, "mix.wav"), "-map", "0:v:0", "-map", "1:a:0",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total / 30:.3f}", "-movflags", "+faststart", OUT], check=True)
    os.remove(silent)
    print("HASIL", OUT, flush=True)


if A.bagian is not None:
    render({int(x) for x in A.bagian.split(",")})
    sys.exit(0)
if not A.sambung:
    render()
if all(os.path.exists(os.path.join(PARTS, f"part_{i:02d}.mp4")) for i in range(len(chunks))):
    sambung()
else:
    print("belum semua potongan ada; sambung dilewati", flush=True)
