"""Serial Indonesia narator saja (contoh KISAH NYATA NUSANTARA): suara lokal Aplikasi TTS Cepat (engine Laras :8180) + timeline Remotion.

    $SUARA_PY suara/suara_tts_cepat.py naskah/ep11.json ep11

Variabel: TTS_URL (default http://127.0.0.1:8180), TTS_VOICE (wav suara rujukan; default <TTS_APP>/voices/bara/netral.wav).
Baris = {id, scene, text|null, dur?, jeda?, mg?}. Hanya narator (kisah nyata: tidak mengarang ucapan tokoh nyata).
"""
import hashlib, json, os, re, subprocess, sys, urllib.request, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
TTS = os.environ.get('TTS_URL', 'http://127.0.0.1:8180')
VOICE = os.environ.get('TTS_VOICE') or os.path.join(os.environ.get('TTS_APP', os.path.join(ROOT, '..', 'aplikasi tts cepat')), 'voices', 'bara', 'netral.wav')   # narator pria 'bara' (stabil, pilihan user)
TAKES = 3
# engine menaruh ±1 dtk hening di awal klip: potong hening awal & akhir (sisakan sedikit napas)
TRIM = 'silenceremove=start_periods=1:start_threshold=-35dB:detection=rms:window=0.05:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-35dB:detection=rms:window=0.05:start_silence=0.12,areverse,'
VER = 'trim2'
FPS, GAP, SR = 30, 0.45, 48000

def read_wav(p):
    with wave.open(p) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return (a.reshape(-1, w.getnchannels()).mean(1) if w.getnchannels() > 1 else a), w.getframerate()

def siapkan(t):
    """Praproses wajib engine: elipsis -> koma / titik, seru -> titik."""
    t = re.sub(r'(\.\.\.|…)\s*$', '.', t.strip())
    t = re.sub(r'\s*(\.\.\.|…)\s*', ', ', t)
    t = re.sub(r'!+', '.', t).replace('—', ',')
    return re.sub(r',\s*,', ',', t)

def tts(teks, out):
    req = urllib.request.Request(TTS + '/tts', json.dumps(dict(text=teks, voice=VOICE, takes=TAKES)).encode(), {'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        open(out, 'wb').write(r.read()); return r.headers.get('x-wer')

def main():
    src, ep = sys.argv[1], sys.argv[2]
    data = json.load(open(src, encoding='utf-8'))
    vo, raw = os.path.join(ep, 'vo'), os.path.join(ep, 'vo', 'raw'); os.makedirs(raw, exist_ok=True)
    cp = os.path.join(vo, '_cache.json'); cache = json.load(open(cp)) if os.path.exists(cp) else {}
    key = lambda b: hashlib.md5(json.dumps([siapkan(b.get('ucap') or b['text']), VOICE, TAKES]).encode()).hexdigest()
    todo = [b for b in data['baris'] if b.get('text') and (cache.get(b['id']) != key(b) or not os.path.exists(os.path.join(vo, b['id'] + '.wav')))]
    for b in data['baris']:
        if b.get('text') and b not in todo and cache.get(b['id'] + ':v') != VER and os.path.exists(os.path.join(raw, b['id'] + '.wav')):
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(raw, b['id'] + '.wav'), '-af', TRIM + 'loudnorm=I=-18:TP=-3,alimiter=limit=0.89',
                            '-ar', str(SR), '-ac', '1', os.path.join(vo, b['id'] + '.wav')], check=True)
            cache[b['id'] + ':v'] = VER
    json.dump(cache, open(cp, 'w'))
    for b in todo:
        r = os.path.join(raw, b['id'] + '.wav'); wer = tts(siapkan(b.get('ucap') or b['text']), r)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', r, '-af', TRIM + 'loudnorm=I=-18:TP=-3,alimiter=limit=0.89',
                        '-ar', str(SR), '-ac', '1', os.path.join(vo, b['id'] + '.wav')], check=True)
        cache[b['id']] = key(b); cache[b['id'] + ':v'] = VER; json.dump(cache, open(cp, 'w')); print(' ', b['id'], 'wer', wer, flush=True)
    lines, t, clips = [], 0.4, []
    for b in data['baris']:
        it = {k: b.get(k) for k in ('id', 'scene', 'who', 'emo', 'text', 'mg')}; it['who'] = 'narator' if b.get('text') else None
        if b.get('text'):
            a, sr = read_wav(os.path.join(vo, b['id'] + '.wav')); dur = len(a) / sr
            it.update(start=round(t * FPS), end=round((t + dur) * FPS), dur=round(dur, 3), mulut=[]); clips.append((t, a)); t += dur + GAP + b.get('jeda', 0)
        else:
            dur = b.get('dur', 1.3); it.update(start=round(t * FPS), end=round((t + dur) * FPS), dur=dur, mulut=[]); t += dur + b.get('jeda', 0)
        lines.append(it)
    total = round(t * FPS)
    json.dump(dict(fps=FPS, total=total, judul=data.get('judul'), baris=lines), open(os.path.join(ep, 'timeline.json'), 'w'), separators=(',', ':'))
    mix = np.zeros(int(total / FPS * SR) + SR, np.float32)
    for t0, a in clips: i = int(t0 * SR); mix[i:i + len(a)] += a[:len(mix) - i]
    with wave.open(os.path.join(ep, 'suara_vo.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
    print(f'selesai {ep}: {len(lines)} baris, {total / FPS:.1f} dtk')

if __name__ == '__main__':
    main()
