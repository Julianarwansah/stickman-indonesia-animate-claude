"""Serial Indonesia multi-tokoh (contoh PETAKA GUNUNG): suara ElevenLabs per tokoh + timeline + bukaan mulut untuk Remotion.

    $SUARA_PY suara/suara_elevenlabs.py naskah/ep1.json ep1

Suara tokoh dikunci di suara/suara_11labs.json: {tokoh: {voice_id, nama, speed?, stability?, style?}}. Kunci API: <proyek>/.env.

Pola dari skill animasi-horor-kartun (templates/suara/buat_suara.py), mesinnya diganti pocket-tts Indonesia
karena naskah berbahasa Indonesia. Efek per tokoh (kakek lebih berat, sosok bergema & turun nada) lewat ffmpeg.
"""
import hashlib
import json
import os
import subprocess
import sys
import wave

import numpy as np

FPS, GAP, SR = 30, 0.35, 48000
POCKET = os.environ.get('POCKET_DIR', '')   # cadangan pocket-tts (opsional; user menolaknya: terdengar robot)
VENV = os.environ.get('POCKET_PY', 'python3')
V = lambda n: os.path.join(POCKET, 'voices', f'common_voice_id_{n}.wav')
# suara per tokoh: prompt, kecepatan, filter ffmpeg sesudahnya
TOKOH = {
    'narator': (V(19961910), 0.9, 'asetrate=48000*0.97,aresample=48000,atempo=1.03'),
    'kakek':   (V(19961910), 0.85, 'asetrate=48000*0.88,aresample=48000,atempo=1.08,highpass=f=120,lowpass=f=5200'),
    'raka':    (V(22918082), 1.0, 'anull'),
    'sinta':   (V(20954552), 1.0, 'anull'),
    # suara Sinta palsu: nada turun, gema hutan, sedikit terbalik ruangnya
    'sosok':   (V(20954552), 0.8, 'asetrate=48000*0.86,aresample=48000,atempo=1.05,aecho=0.8:0.7:90|210:0.45|0.3,lowpass=f=4200,volume=1.4'),
}
GAIN = {'bisik': 0.75, 'teriak': 1.25, 'takut': 1.0, 'seram': 1.0}

# ---- ElevenLabs (dipakai kalau suara/suara_11labs.json ada): {tokoh: {voice_id, ...setelan}} ----
P11 = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'suara_11labs.json')
E11 = json.load(open(P11)) if os.path.exists(P11) else None
# emosi -> setelan ekspresi ElevenLabs (stability rendah = lebih hidup)
EMO11 = {'bisik': dict(stability=0.45, style=0.35), 'seram': dict(stability=0.45, style=0.4), 'takut': dict(stability=0.3, style=0.55),
         'teriak': dict(stability=0.25, style=0.7), 'netral': dict(stability=0.5, style=0.25)}
# efek sesudah ElevenLabs: hanya sosok yang diolah (gema hutan, nada sedikit turun); lainnya bersih
FX11 = {'sosok': 'asetrate=48000*0.92,aresample=48000,atempo=1.02,aecho=0.8:0.6:90|210:0.35|0.22,lowpass=f=5000'}


def read_wav(p):
    with wave.open(p, 'rb') as w:
        n, sr, ch = w.getnframes(), w.getframerate(), w.getnchannels()
        a = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    return (a.reshape(-1, ch).mean(axis=1) if ch > 1 else a), sr


def write_wav(p, a, sr=SR):
    with wave.open(p, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype(np.int16).tobytes())


def mouth_env(a, sr, n):
    hop = sr / FPS
    e = np.array([float(np.sqrt(np.mean(s * s))) if len(s := a[int(i * hop):int((i + 1) * hop)]) else 0.0 for i in range(n)])
    if e.max() > 0:
        e = e / np.percentile(e[e > 0], 95)
    e = np.clip((e - 0.12) / 0.75, 0, 1)
    return [round(float(x), 2) for x in np.convolve(e, [0.5, 0.5], mode='same')]


def main():
    src, ep = sys.argv[1], sys.argv[2]
    data = json.load(open(src, encoding='utf-8'))
    vo, raw = os.path.join(ep, 'vo'), os.path.join(ep, 'vo', 'raw')
    os.makedirs(raw, exist_ok=True)
    cache_p = os.path.join(vo, '_cache.json')
    cache = json.load(open(cache_p)) if os.path.exists(cache_p) else {}
    cfg = (lambda b: E11[b['who']]) if E11 else (lambda b: TOKOH[b['who']])
    key = lambda b: hashlib.md5(json.dumps([b['who'], b.get('emo'), b['text'], cfg(b), '11' if E11 else 'pk']).encode()).hexdigest()
    todo = [b for b in data['baris'] if b.get('text') and (cache.get(b['id']) != key(b) or not os.path.exists(os.path.join(vo, b['id'] + '.wav')))]
    if todo and E11:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from elevenlabs import ucap
        teks = [b.get('text') for b in data['baris']]
        for b in todo:
            c = E11[b['who']]; i = data['baris'].index(b)
            st = dict(EMO11.get(b.get('emo'), EMO11['netral']), **{k: v for k, v in c.items() if k in ('stability', 'style', 'similarity', 'speed')})
            mp3 = os.path.join(raw, b['id'] + '.mp3')
            ucap(c['voice_id'], b['text'], mp3, prev=next((t for t in reversed(teks[:i]) if t), None), nxt=next((t for t in teks[i + 1:] if t), None), **st)
            fl = FX11.get(b['who'], 'anull') + f",loudnorm=I=-18:TP=-3,volume={GAIN.get(b.get('emo'), 1.0)},alimiter=limit=0.89"
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-af', fl, '-ar', str(SR), '-ac', '1', os.path.join(vo, b['id'] + '.wav')], check=True)
            cache[b['id']] = key(b)
            print('suara 11labs', b['id'], b['who'], flush=True)
        json.dump(cache, open(cache_p, 'w'))
        todo = []
    if todo:
        jobs = [{'nama': b['id'], 'teks': b['text'], 'ref': TOKOH[b['who']][0], 'ref_teks': '', 'speed': TOKOH[b['who']][1],
                 'bersihkan': 0.5, 'out': os.path.join(raw, b['id'] + '.wav')} for b in todo]
        pp = os.path.join(raw, '_payload.json')
        json.dump({'config': os.path.join(POCKET, 'indonesian_6l_lokal.yaml'), 'temp': 0.3, 'eos_threshold': -6.0, 'sr': 44100, 'jobs': jobs},
                  open(pp, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        subprocess.run([VENV, os.path.join(POCKET, '_mesin_pocket.py'), pp], check=True)
        for b in todo:
            fl = TOKOH[b['who']][2] + f",loudnorm=I=-18:TP=-3,volume={GAIN.get(b.get('emo'), 1.0)},alimiter=limit=0.89"
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(raw, b['id'] + '.wav'), '-af', fl, '-ar', str(SR), '-ac', '1',
                            os.path.join(vo, b['id'] + '.wav')], check=True)
            cache[b['id']] = key(b)
            print('suara', b['id'], b['who'], flush=True)
        json.dump(cache, open(cache_p, 'w'))
    lines, t, clips = [], 0.6, []
    for b in data['baris']:
        it = {k: b.get(k) for k in ('id', 'scene', 'who', 'emo', 'text', 'mg')}
        if b.get('text'):
            a, sr = read_wav(os.path.join(vo, b['id'] + '.wav'))
            dur = len(a) / sr
            it.update(start=round(t * FPS), end=round((t + dur) * FPS), dur=round(dur, 3), mulut=mouth_env(a, sr, int(round(dur * FPS))))
            clips.append((t, a))
            t += dur + GAP + b.get('jeda', 0.0)
        else:
            dur = b.get('dur', 3.0)
            it.update(start=round(t * FPS), end=round((t + dur) * FPS), dur=dur, mulut=[])
            t += dur + b.get('jeda', 0.0)
        lines.append(it)
    total = round(t * FPS)
    json.dump({'fps': FPS, 'total': total, 'judul': data.get('judul'), 'baris': lines}, open(os.path.join(ep, 'timeline.json'), 'w'), separators=(',', ':'))
    mix = np.zeros(int(total / FPS * SR) + SR, dtype=np.float32)
    for t0, a in clips:
        i = int(t0 * SR); mix[i:i + len(a)] += a[:len(mix) - i]
    write_wav(os.path.join(ep, 'suara_vo.wav'), mix)
    print(f'selesai: {len(lines)} baris, {total} frame = {total / FPS:.1f} dtk')


if __name__ == '__main__':
    main()
