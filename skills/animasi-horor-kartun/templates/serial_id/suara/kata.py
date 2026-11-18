"""kata.py <ep> — waktu kata nyata dari suara narator (faster-whisper word_timestamps) -> field `kata` di <ep>/timeline.json.

Jalankan SESUDAH suara.py (suara.py menulis ulang timeline). Kata naskah dipetakan ke garis waktu kata whisper
secara proporsional jumlah huruf (whisper bisa salah eja; yang dipakai hanya waktunya). Hasil: kata = [[teks, f0, f1], ...] frame absolut.
"""
import json, os, re, sys
from faster_whisper import WhisperModel
ep = sys.argv[1]; FPS = 30
tlp = os.path.join(ep, 'timeline.json'); tl = json.load(open(tlp))
m = WhisperModel('small', device='cpu', compute_type='int8', local_files_only=True)
norm = lambda w: re.sub(r'[^0-9a-zA-Z]', '', w)
for b in tl['baris']:
    if not b.get('text'): continue
    seg, _ = m.transcribe(os.path.join(ep, 'vo', b['id'] + '.wav'), language='id', word_timestamps=True, beam_size=3)
    ww = [(w.start, w.end, max(1, len(norm(w.word)))) for s in seg for w in s.words]
    words = b['text'].split()
    if not ww:
        ww = [(0.0, b['dur'], 1)]
    # garis waktu kumulatif whisper: titik (fraksi huruf, detik)
    tot = sum(n for _, _, n in ww); pts = [(0.0, ww[0][0])]; acc = 0
    for a, e, n in ww: pts.append((acc / tot, a)); acc += n; pts.append((acc / tot, e))
    def at(fr):
        for (f0, t0), (f1, t1) in zip(pts, pts[1:]):
            if f0 <= fr <= f1: return t0 + (t1 - t0) * ((fr - f0) / (f1 - f0) if f1 > f0 else 0)
        return pts[-1][1]
    stot = sum(max(1, len(norm(w))) for w in words); acc = 0; out = []
    for w in words:
        n = max(1, len(norm(w))); t0, t1 = at(acc / stot), at((acc + n) / stot); acc += n
        out.append([w, b['start'] + round(t0 * FPS), b['start'] + round(t1 * FPS)])
    b['kata'] = out
    print(b['id'], ' '.join(f"{w}@{f0 - b['start']}" for w, f0, _ in out)[:150], flush=True)
json.dump(tl, open(tlp, 'w'), separators=(',', ':'))
