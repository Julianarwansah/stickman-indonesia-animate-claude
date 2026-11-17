"""Render satu Short potret (1080x1920, 30 fps) per potongan 1 menit, aman kalau terhenti, lalu pasang suara mix.wav.

    python render_short.py 1                 # render Short 1 (lewati potongan yang sudah lengkap), lalu sambung + pasang suara
    python render_short.py 1 --sambung       # hanya sambung potongan yang ada + pasang suara
    python render_short.py 1 --bagian=0,1    # render potongan tertentu saja
    python render_short.py 1 --frames=0-29   # uji cepat: render rentang frame ke file uji (tidak masuk potongan)

Komposisi Remotion: HororS<n> (kartun-3d-shorts/src/Root.tsx). Timeline: short<n>/timeline.json. Suara: short<n>/mix.wav.
Potongan: video/short<n>_parts/part_NN.mp4, ditulis ke file sementara lalu diganti nama setelah jumlah frame cocok.
Hasil: video/short<n>_potret.mp4.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REMO = os.environ.get("REMO_DIR", os.path.join(os.getcwd(), "kartun-3d-shorts"))
CHROME = os.environ.get("CHROME_PATH")
CHUNK = 1800

n = int(sys.argv[1])
PARTS = os.path.join(HERE, "video", f"short{n}_parts")
OUT = os.path.join(HERE, "video", f"short{n}_potret.mp4")
MIX = os.path.join(HERE, f"short{n}", "mix.wav")
COMP = f"HororS{n}"
os.makedirs(PARTS, exist_ok=True)

total = json.load(open(os.path.join(HERE, f"short{n}", "timeline.json")))["total"]
chunks = [(a, min(total, a + CHUNK) - 1) for a in range(0, total, CHUNK)]


def frames(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets",
                        "-of", "csv=p=0", p], capture_output=True, text=True)
    try:
        return int(r.stdout.strip().strip(",").split(",")[0])
    except ValueError:
        return -1


def remotion(a, b, dst):
    env = dict(os.environ, TEMP=os.path.join(REMO, ".remotion_tmp"), TMP=os.path.join(REMO, ".remotion_tmp"))
    return subprocess.run(["npx", "remotion", "render", "src/index.ts", COMP, dst, f"--frames={a}-{b}", "--codec", "h264", "--crf", "18",
                           "--muted", "--gl", "angle", "--concurrency", "3", "--log", "error"] + (["--browser-executable", CHROME] if CHROME else []),
                          cwd=REMO, env=env, shell=True)


def render(only=None):
    for i, (a, b) in enumerate(chunks):
        if only is not None and i not in only:
            continue
        dst = os.path.join(PARTS, f"part_{i:02d}.mp4")
        want = b - a + 1
        if os.path.exists(dst) and frames(dst) == want:
            print(f"lewati part_{i:02d} ({a}-{b}) sudah lengkap", flush=True)
            continue
        tmp = os.path.join(PARTS, f"_tmp_{i:02d}.mp4")
        print(f"render {COMP} part_{i:02d} frame {a}-{b} ...", flush=True)
        r = remotion(a, b, tmp)
        got = frames(tmp) if os.path.exists(tmp) else -1
        if r.returncode != 0 or got != want:
            print(f"GAGAL part_{i:02d}: kode {r.returncode}, frame {got}/{want}. Jalankan lagi untuk melanjutkan.", flush=True)
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
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", silent, "-i", MIX, "-map", "0:v:0", "-map", "1:a:0",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{total / 30:.3f}", "-movflags", "+faststart", OUT], check=True)
    os.remove(silent)
    print("HASIL", OUT, flush=True)


if __name__ == "__main__":
    fr = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--frames=")), None)
    if fr is not None:
        a, b = fr.split("-")
        dst = os.path.join(PARTS, f"uji_{a}_{b}.mp4")
        r = remotion(int(a), int(b), dst)
        print("kode", r.returncode, "frame", frames(dst) if os.path.exists(dst) else -1, flush=True)
        sys.exit(r.returncode)
    pick = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--bagian=")), None)
    if pick is not None:
        render({int(x) for x in pick.split(",")})
        sys.exit(0)
    if "--sambung" not in sys.argv:
        render()
    if all(os.path.exists(os.path.join(PARTS, f"part_{i:02d}.mp4")) for i in range(len(chunks))):
        sambung()
    else:
        print("belum semua potongan ada; sambung dilewati", flush=True)
