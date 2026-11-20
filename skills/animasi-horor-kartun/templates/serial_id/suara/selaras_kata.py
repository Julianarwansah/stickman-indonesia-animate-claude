"""Selaraskan waktu kata words.json ke ENERGI suara (bukan tebakan): kata yang dijadwalkan mulai di tengah hening
digeser ke awal bunyi berikutnya. Masalah nyata PD Ep19 (2026-11-20): "Utang" mulai 0,7 dtk sebelum terdengar, sehingga
caption & peristiwa animasi (event "L8:1") jatuh di hening -> "suara narator tidak sesuai animasi".

pakai:  python selaras_kata.py <projects/slug>   (membuat words_asli.json sekali sebagai cadangan, menimpa words.json)
Laporan: tiap kata yang digeser + selisihnya.
"""
import json, os, sys, shutil
import numpy as np
import soundfile as sf


def main(P, thr_db=-31.0, win=0.02):
    wp = os.path.join(P, 'words.json')
    if not os.path.exists(os.path.join(P, 'words_asli.json')):
        shutil.copy(wp, os.path.join(P, 'words_asli.json'))
    W = json.load(open(os.path.join(P, 'words_asli.json'), encoding='utf-8'))
    x, sr = sf.read(os.path.join(P, 'voice.wav'))
    x = x if x.ndim == 1 else x.mean(1)
    n = int(win * sr)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, 'same'))
    thr = 10 ** (thr_db / 20) * max(1e-6, np.percentile(np.abs(x), 99.5))
    on = rms > thr
    def bunyi(t0, t1):          # apakah ada bunyi di [t0,t1)
        a, b = int(max(0, t0) * sr), int(max(0, t1) * sr)
        return on[a:b].mean() if b > a else 0
    def onset(t0, tmax):        # awal bunyi pertama sesudah t0 (maks tmax)
        a, b = int(t0 * sr), int(min(len(x) / sr, tmax) * sr)
        idx = np.where(on[a:b])[0]
        return (a + idx[0]) / sr if len(idx) else None
    geser = []
    for i, w in enumerate(W):
        nxt = W[i + 1]['start'] if i + 1 < len(W) and W[i + 1]['line'] == w['line'] else w['end'] + 0.6
        # kasus 2: awal kata menempel di ekor kata sebelumnya, lalu ada hening >= 0,25 dtk -> kata sebenarnya mulai sesudah hening
        a0 = int(w['start'] * sr); seg = on[a0:a0 + int(0.9 * sr)]
        if len(seg):
            off = np.where(~seg)[0]
            if len(off) and off[0] < int(0.14 * sr):
                runon = np.where(seg[off[0]:])[0]
                gap = (runon[0] if len(runon) else len(seg) - off[0]) / sr
                if gap >= 0.25 and len(runon):
                    o = (a0 + off[0] + runon[0]) / sr
                    geser.append((w['line'], w['word'], round(o - w['start'], 2)))
                    w['start'] = round(o - 0.02, 3)
                    if w['end'] < w['start'] + 0.08: w['end'] = round(w['start'] + 0.12, 3)
                    continue
        if bunyi(w['start'], w['start'] + 0.08) < 0.25:            # mulai di hening
            o = onset(w['start'], min(nxt + 0.4, w['start'] + 1.2))
            if o is not None and o - w['start'] > 0.06:
                geser.append((w['line'], w['word'], round(o - w['start'], 2)))
                w['start'] = round(o - 0.02, 3)
                if w['end'] < w['start'] + 0.08: w['end'] = round(w['start'] + 0.12, 3)
    # rapikan: tiap kata berakhir sebelum kata berikutnya dalam baris yang sama, tidak tumpang tindih
    for i in range(len(W) - 1):
        if W[i + 1]['line'] == W[i]['line'] and W[i]['end'] > W[i + 1]['start']:
            W[i]['end'] = round(max(W[i]['start'] + 0.06, W[i + 1]['start'] - 0.01), 3)
    json.dump(W, open(wp, 'w'), ensure_ascii=False, indent=0)
    print(f'{len(geser)} kata digeser:')
    for g in geser: print('  baris', g[0], g[1], f'+{g[2]} dtk')


if __name__ == '__main__':
    main(sys.argv[1])
