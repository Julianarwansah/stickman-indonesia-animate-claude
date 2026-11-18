"""Mesin mixing v2 (serial Indonesia): suara (vo) + efek + suasana -> <ep>/mix.wav (48 kHz STEREO, -14 LUFS, puncak -1 dBTP).

    $SUARA_PY suara/mix.py <folder_ep> <isyarat_sfx.py> [--lufs -14] [--out mix.wav] [--tanpa-otomatis]

Kenapa v2 (keluhan user "sfx masih kurang"): v1 mono, ±15 efek per 55 dtk, pergantian adegan tanpa suara, tidak ada foley
(langkah, api unggun), dinamika datar (LRA 2,8) dan hanya -16 LUFS. v2:
  * STEREO: `pan` -1..1 per efek; suasana dibuat lebar (kanal kanan diambil dari bagian rekaman yang lain).
  * LAPISAN OTOMATIS (dari timeline + adegan JSON; matikan dengan `OTOMATIS = False` di isyarat atau --tanpa-otomatis):
      - whoosh lembut di setiap pergantian scene (kiri/kanan bergantian)
      - riser (cymbal terbalik) yang BERAKHIR tepat di stempel, jumpscare j01, dan kartu pilihan
      - api unggun berderak di scene yang kameranya dekat `api` di adegan
      - langkah kaki saat tokoh `jalan`/`lari` di jalur adegan
      - room tone tipis sepanjang video (tidak pernah hening mati)
  * `suasana({scene: id})`: satu lapisan suasana per scene dengan crossfade -> setiap adegan punya suara tempatnya sendiri.
  * `word(id, kata)` / `hit(...)` memakai waktu kata asli (`kata` dari kata.py) -> efek jatuh tepat di kata.
  * loop disambung dengan crossfade (tanpa klik); mastering loudnorm dua tahap linear (dinamika terjaga) + limiter -1 dBTP.

Nama yang tersedia di isyarat:
  t0(id, frac=0)  t1(id)  word(id, kata)  L  TOTAL  SR  tl  E (adegan JSON)  os  PROJ  np
  place(src, at, db, dur=None, offset=0, tempo=1, st=0, fin=0.03, fout=0.25, bus=None, loop=False, pan=0.0, wide=None)
  steps(src, at, n, gap, db, ...)     suasana({scene: src | (src, db)}, db=-26)     hit(id, kata, src, db=-12, pan=0)
  bus_amb (diturunkan saat narasi)    OTOMATIS = True | False   OTO_DB = {"whoosh": -26, "riser": -20, "api": -27, "langkah": -25, "room": -38}
src = id Lots of Sounds ("fs-348248") atau file kit CC0 ("whoosh.ogg"); diunduh sekali ke <proyek>/suara/sfx_cache/. Efek tidak disintesis.
"""
import argparse
import json
import math
import os
import subprocess
import urllib.request

import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("ep")
ap.add_argument("isyarat")
ap.add_argument("--kit", default=None)
ap.add_argument("--lufs", type=float, default=-14.0, help="-14 Shorts/Reels/TikTok (default); -16 YouTube panjang")
ap.add_argument("--out", default=None, help="nama file hasil (default <ep>/mix.wav)")
ap.add_argument("--tanpa-otomatis", action="store_true")
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
_adp = os.path.join(PROJ, "adegan", os.path.basename(EP) + ".json")
E = json.load(open(_adp, encoding="utf-8")) if os.path.exists(_adp) else {}


def t0(i, frac=0.0):
    l = L[i]
    return (l["start"] + frac * (l["end"] - l["start"])) / 30


def t1(i):
    return L[i]["end"] / 30


def word(i, w):
    """detik saat kata `w` diucapkan: dari waktu kata whisper (kata.py) bila ada, cadangan posisi huruf."""
    l = L[i]
    for k, f0, _ in l.get("kata") or []:
        if k.lower().strip(".,!?…:;\"'").startswith(w.lower()):
            return f0 / 30
    return t0(i, l["text"].lower().index(w.lower()) / len(l["text"]))


def fetch(sid):
    p = os.path.join(CACHE, f"{sid}.mp3")
    if not os.path.exists(p):
        with urllib.request.urlopen(f"https://api.lotsofsounds.com/api/v1/sounds/sample/{sid}/stream") as r:
            url = json.load(r)["data"]["stream_url"]  # tautan sementara, langsung diunduh
        urllib.request.urlretrieve(url, p)
    return p


_mem = {}


def load(src, offset=0.0, dur=None, tempo=1.0, st=0.0):
    key = (src, offset, dur, tempo, st)
    if key in _mem:
        return _mem[key].copy()
    path = os.path.join(KIT, src) if src.endswith(".ogg") else fetch(src)
    af = ["aresample=48000"]
    if abs(tempo - 1) > 0.01 or abs(st) > 0.05:
        # ffmpeg Mac tanpa rubberband: nada lewat asetrate (ikut mengubah tempo), sisanya atempo
        k = 2 ** (st / 12)
        af = ["aresample=48000", f"asetrate={48000 * k:.1f}", "aresample=48000", f"atempo={max(0.5, min(2.0, tempo / k)):.4f}"]
    cmd = ["ffmpeg", "-loglevel", "error", "-ss", str(offset)] + (["-t", str(dur * tempo)] if dur else []) + ["-i", path, "-af", ",".join(af), "-ac", "1", "-f", "f32le", "-"]
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()
    if not len(a) and offset:   # offset melewati ujung rekaman pendek: ulang dari awal
        return load(src, 0.0, dur, tempo, st)
    _mem[key] = a
    return a.copy()


def loop_to(a, n, xf=0.3):
    """ulang rekaman sampai n sampel, sambungan di-crossfade (tanpa klik)"""
    if len(a) >= n or not len(a):
        return a[:n]
    x = max(1, min(int(xf * SR), len(a) // 3))
    out = a.copy()
    ramp = np.linspace(0, 1, x, dtype=np.float32)
    while len(out) < n:
        out[-x:] = out[-x:] * (1 - ramp) + a[:x] * ramp
        out = np.concatenate([out, a[x:]])
    return out[:n]


bus_fx = np.zeros((N, 2), dtype=np.float32)
bus_amb = np.zeros((N, 2), dtype=np.float32)


def place(src, at, db, dur=None, offset=0.0, tempo=1.0, st=0.0, fin=0.03, fout=0.25, bus=None, loop=False, pan=0.0, wide=None):
    bus = bus_fx if bus is None else bus
    wide = (bus is bus_amb) if wide is None else wide
    a = load(src, offset, None if loop else dur, tempo, st)
    if loop and dur:
        a = loop_to(a, int(dur * SR))
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
    if wide:   # kanan = bagian lain rekaman yang sama (dekorelasi) -> suasana terasa lebar
        left, right = a, np.roll(a, int(0.37 * SR) % max(1, len(a)))
    else:
        th = (pan + 1) * math.pi / 4   # pan daya sama
        left, right = a * math.cos(th) * 1.414, a * math.sin(th) * 1.414
    bus[i0: i0 + len(a), 0] += left
    bus[i0: i0 + len(a), 1] += right


def steps(src, at, n, gap, db, st=0.0, tempo=1.0, dur=0.6, offset=0.0, pan=0.0):
    for k in range(n):
        place(src, at + k * gap, db, dur=dur, offset=offset + (k % 4) * 0.7, st=st, tempo=tempo, fout=0.12, pan=pan)


def hit(i, w, src, db=-12, pan=0.0, dur=3, pre=0.0):
    """aksen tepat di kata (mis. "meletus", "meninggal")"""
    place(src, max(0, word(i, w) - pre), db, dur=dur, fin=0.0, fout=1.0, pan=pan)


def scene_spans():
    out = []
    for l in tl["baris"]:
        if out and out[-1][0] == l["scene"]:
            out[-1][2] = l["end"] / 30
        else:
            out.append([l["scene"], l["start"] / 30, l["end"] / 30])
    for k in range(len(out) - 1):
        out[k][2] = out[k + 1][1]
    if out:
        out[-1][2] = TOTAL
    return out


def suasana(peta, db=-26):
    """satu lapisan suasana per scene: {"pura": "fs-423647", "letusan": ("fs-514381", -18)}; crossfade 0,8 dtk antar scene"""
    for sc, a, b in scene_spans():
        if sc not in peta:
            continue
        src, d = peta[sc] if isinstance(peta[sc], tuple) else (peta[sc], db)
        place(src, max(0, a - 0.4), d, dur=b - a + 0.8, bus=bus_amb, loop=True, fin=0.8, fout=0.8, offset=float(sum(map(ord, sc)) % 20))


ns = dict(t0=t0, t1=t1, word=word, place=place, steps=steps, hit=hit, suasana=suasana, L=L, TOTAL=TOTAL, SR=SR, bus_amb=bus_amb,
          np=np, os=os, PROJ=PROJ, tl=tl, E=E, OTOMATIS=True,
          OTO_DB={"whoosh": -26, "riser": -20, "api": -27, "langkah": -25, "room": -38})
exec(compile(open(A.isyarat, encoding="utf-8").read(), A.isyarat, "exec"), ns)


# ---------------- lapisan otomatis ----------------
def otomatis(D):
    spans = scene_spans()
    # 1. whoosh di tiap pergantian scene (bukan ke kartu pilihan / jumpscare / sesudah hook yang sudah punya hantaman judul)
    for k, (sc, a, _) in enumerate(spans[1:], 1):
        if sc in ("pilihan", "jumpscare") or spans[k - 1][0] == "hook":
            continue
        place(["fs-521043", "fs-521042"][k % 2], max(0, a - 0.35), D["whoosh"], dur=1.6, fin=0.05, fout=0.8, pan=0.45 if k % 2 else -0.45)
    # 2. riser yang berakhir tepat di momen penting
    for i in [b["id"] for b in tl["baris"] if b["scene"] == "stempel"][:1] + [x for x in ("j01", "p01") if x in L]:
        place("fs-240712", max(0, t0(i) - 2.2), D["riser"], dur=2.2, fin=0.4, fout=0.05)
    # 3. api unggun bila kamera dekat api
    api = E.get("api") or []
    pos = {k: (v["jalur"][0].get("p") or [0, 0]) for k, v in (E.get("tokoh") or {}).items() if v.get("jalur")}
    for sc, a, b in spans:
        d = (E.get("scenes") or {}).get(sc)
        if not d or not api or d.get("overlay") == "hitam":
            continue
        s = d.get("subj")
        sx, sz = (pos.get(s, [0, 0]) if isinstance(s, str) else [s[0], s[2]]) if s is not None else (0, 0)
        near = min(math.hypot(sx - x, sz - z) for x, z in api)
        if near < 10:
            place("fs-350757", a, D["api"] + (5 if near < 3 else 0), dur=b - a, bus=bus_amb, loop=True, fin=0.4, fout=0.4, offset=float(int(a * 7) % 25))
    # 4. langkah kaki saat tokoh berjalan/berlari
    tm = lambda v: v if isinstance(v, (int, float)) else (t0(v) if v in L else None)
    for key, tdef in (E.get("tokoh") or {}).items():
        ks = sorted([(tm(k["at"]), k) for k in tdef.get("jalur", []) if tm(k["at"]) is not None], key=lambda x: x[0])
        mode, vis = None, True
        for j, (t, k) in enumerate(ks):
            mode = k.get("mode", mode)
            vis = k.get("vis", vis)
            t_end = ks[j + 1][0] if j + 1 < len(ks) else TOTAL
            if mode in ("jalan", "lari") and vis and t_end - t > 0.5:
                place("fs-210866" if mode == "lari" else "fs-203178", t, D["langkah"] + (2 if mode == "lari" else 0), dur=t_end - t, loop=True,
                      fin=0.2, fout=0.3, pan=0.2 * (sum(map(ord, key)) % 3 - 1))
    # 5. room tone tipis: tidak pernah hening mati
    place("fs-144046", 0, D["room"], dur=TOTAL, bus=bus_amb, loop=True, fin=1.0, fout=1.5)


if ns["OTOMATIS"] and not A.tanpa_otomatis:
    otomatis(ns["OTO_DB"])

# ---- gabung: vo + efek + suasana (suasana turun 6 dB dan efek 2 dB saat narasi) ----
vo = np.zeros(N, dtype=np.float32)
r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", os.path.join(EP, "suara_vo.wav"), "-af", "aresample=48000", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True)
v = np.frombuffer(r.stdout, dtype=np.float32)
vo[: min(N, len(v))] = v[:N]
hop = 480
env = np.sqrt(np.convolve((vo[: len(vo) // hop * hop].reshape(-1, hop) ** 2).mean(axis=1), np.ones(25) / 25, mode="same"))
duck = np.interp(np.arange(N), np.arange(len(env)) * hop, np.clip(env / 0.02, 0, 1))[:, None]
bus_amb *= 10 ** (-6 * duck / 20)
bus_fx *= 10 ** (-2 * duck / 20)
mix = vo[:, None] + bus_fx + bus_amb
raw = os.path.join(EP, "mix_raw.f32")
mix.astype(np.float32).tofile(raw)
out = A.out if (A.out and os.path.isabs(A.out)) else os.path.join(EP, A.out or "mix.wav")
inp = ["-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw]
# mastering dua tahap: ukur dulu, lalu loudnorm linear (tidak memampatkan dinamika) + limiter -1 dBTP
m = subprocess.run(["ffmpeg", "-hide_banner"] + inp + ["-af", f"loudnorm=I={A.lufs}:TP=-1.0:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rindex("{"): m.rindex("}") + 1])
ln = (f"loudnorm=I={A.lufs}:TP=-1.0:LRA=11:linear=true:measured_I={j['input_i']}:measured_TP={j['input_tp']}:"
      f"measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y"] + inp + ["-af", ln + ",alimiter=limit=0.89:level=false,aresample=48000", "-c:a", "pcm_s16le", out], check=True)
os.remove(raw)
print(os.path.basename(out), round(TOTAL, 1), "s")
