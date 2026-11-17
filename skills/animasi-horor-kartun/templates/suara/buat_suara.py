"""Buat semua suara episode + timeline.

    python buat_suara.py <naskah.json> <folder_ep>            # suara asli (Supertonic, venv_supertonic)
    python buat_suara.py <naskah.json> <folder_ep> --perkiraan # tanpa TTS: durasi diperkirakan dari jumlah kata

Hasil di <folder_ep>:
  vo/<id>.wav          satu file per baris (48 kHz mono), dilewati kalau sudah ada dan teks/tokoh/emosi sama
  timeline.json        fps, total frame, tiap baris: start/end frame, mulut per frame (0..1) untuk gerak bibir
  suara_vo.wav         semua dialog + narasi di posisinya (untuk mixing)
Aturan waktu: baris berikutnya mulai 0.35 dtk sesudah baris sebelumnya selesai, ditambah `jeda` baris itu.
Baris motion-graphics tanpa teks (`mg`, `dur`) mengambil `dur` detik.
"""
import json
import os
import sys
import hashlib
import wave
import numpy as np

FPS = 30
GAP = 0.35
SR = 48000


def read_wav(p):
    with wave.open(p, "rb") as w:
        n = w.getnframes(); sr = w.getframerate(); ch = w.getnchannels()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        a = a.reshape(-1, ch).mean(axis=1)
    return a, sr


def write_wav(p, a, sr=SR):
    a = np.clip(a, -1, 1)
    with wave.open(p, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((a * 32767).astype(np.int16).tobytes())


def mouth_env(a, sr, nframes):
    """bukaan mulut per frame 0..1 dari energi suara (dihaluskan, dengan ambang supaya diam = tertutup)"""
    hop = sr / FPS
    out = []
    for i in range(nframes):
        s = a[int(i * hop): int((i + 1) * hop)]
        out.append(float(np.sqrt(np.mean(s * s))) if len(s) else 0.0)
    e = np.array(out)
    if e.max() > 0:
        e = e / np.percentile(e[e > 0], 95)
    e = np.clip((e - 0.12) / 0.75, 0, 1)
    # sedikit naik-turun alami: rata-rata 2 frame
    e2 = np.convolve(e, [0.5, 0.5], mode="same")
    return [round(float(x), 2) for x in e2]


def main():
    src, ep = sys.argv[1], sys.argv[2]
    est = "--perkiraan" in sys.argv
    data = json.load(open(src, encoding="utf-8"))
    os.makedirs(os.path.join(ep, "vo"), exist_ok=True)
    S = None
    if not est:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from suara import Suara, TOKOH, EMOSI  # noqa
        S = Suara()
    cache_p = os.path.join(ep, "vo", "_cache.json")
    cache = json.load(open(cache_p)) if os.path.exists(cache_p) else {}
    lines, t, clips = [], 1.5, []  # 1,5 dtk pembuka: angin dari layar gelap sebelum narator bicara
    for b in data["baris"]:
        item = {"id": b["id"], "scene": b["scene"], "who": b.get("who"), "emo": b.get("emo"), "text": b.get("text"), "mg": b.get("mg")}
        if b.get("text"):
            if est:
                dur = len(b["text"].split()) / 2.3 + 0.3
                env = []
            else:
                from suara import TOKOH, EMOSI  # noqa
                key = hashlib.md5(json.dumps([b["who"], b["emo"], b["text"], TOKOH[b["who"]], EMOSI[b["emo"]]]).encode()).hexdigest()
                wp = os.path.join(ep, "vo", f"{b['id']}.wav")
                if cache.get(b["id"]) != key or not os.path.exists(wp):
                    S.ucap(b["who"], b["emo"], b["text"], wp)
                    cache[b["id"]] = key
                    print("suara", b["id"], b["who"], b["emo"], flush=True)
                a, sr = read_wav(wp)
                dur = len(a) / sr
                env = mouth_env(a, sr, int(round(dur * FPS)))
                clips.append((t, a, sr))
            item.update({"start": round(t * FPS), "end": round((t + dur) * FPS), "dur": round(dur, 3), "mulut": env})
            t += dur + GAP + b.get("jeda", 0.0)
        else:
            dur = b.get("dur", 3.0)
            item.update({"start": round(t * FPS), "end": round((t + dur) * FPS), "dur": dur, "mulut": []})
            t += dur + b.get("jeda", 0.0)
        lines.append(item)
    total = round(t * FPS) + FPS  # 1 dtk ekor
    json.dump(cache, open(cache_p, "w"))
    json.dump({"fps": FPS, "total": total, "judul": data.get("judul"), "baris": lines}, open(os.path.join(ep, "timeline.json"), "w"), separators=(",", ":"))
    if clips:
        vo = np.zeros(int(total / FPS * SR) + SR, dtype=np.float32)
        for t0, a, sr in clips:
            i = int(t0 * SR); vo[i:i + len(a)] += a[: len(vo) - i]
        write_wav(os.path.join(ep, "suara_vo.wav"), vo)
    print(f"selesai: {len(lines)} baris, total {total} frame = {total / FPS / 60:.2f} menit")


if __name__ == "__main__":
    main()
