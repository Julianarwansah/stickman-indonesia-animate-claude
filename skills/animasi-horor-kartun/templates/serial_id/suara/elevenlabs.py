"""Mesin suara ElevenLabs untuk serial Indonesia (dipakai PETAKA GUNUNG).

Kunci API dibaca dari variabel lingkungan ELEVENLABS_API_KEY, atau dari file `<proyek>/.env` berisi satu baris:
    ELEVENLABS_API_KEY=xxxxxxxx
(Kunci tidak pernah ditulis ke log atau file lain.)

    python3 suara/elevenlabs.py suara          # daftar suara di akun (id, nama, label)
    python3 suara/elevenlabs.py audisi         # buat audisi/*.mp3: kalimat yang sama dengan beberapa calon suara
"""
import json
import os
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
API = 'https://api.elevenlabs.io/v1'
MODEL = 'eleven_multilingual_v2'   # mendukung bahasa Indonesia


def kunci():
    k = os.environ.get('ELEVENLABS_API_KEY')
    p = os.path.join(ROOT, '.env')
    if not k and os.path.exists(p):
        for ln in open(p, encoding='utf-8'):
            if ln.strip().startswith('ELEVENLABS_API_KEY='):
                k = ln.split('=', 1)[1].strip().strip('"\'')
    if not k:
        sys.exit('Kunci ElevenLabs belum ada: buat file <proyek>/.env berisi ELEVENLABS_API_KEY=...')
    return k


def minta(path, body=None):
    req = urllib.request.Request(API + path, data=None if body is None else json.dumps(body).encode(),
                                 headers={'xi-api-key': kunci(), 'Content-Type': 'application/json', 'Accept': '*/*'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def daftar_suara():
    return json.loads(minta('/voices'))['voices']


def ucap(voice_id, teks, out_mp3, stability=0.38, similarity=0.8, style=0.45, speed=1.0, prev=None, nxt=None):
    """Satu baris -> mp3. stability rendah = lebih ekspresif; style = intensitas gaya/emosi."""
    body = {'text': teks, 'model_id': MODEL,
            'voice_settings': {'stability': stability, 'similarity_boost': similarity, 'style': style, 'use_speaker_boost': True, 'speed': speed}}
    if prev:
        body['previous_text'] = prev
    if nxt:
        body['next_text'] = nxt
    data = minta(f'/text-to-speech/{voice_id}?output_format=mp3_44100_128', body)
    with open(out_mp3, 'wb') as f:
        f.write(data)


AUDISI = {
    'narator': 'Kalau di gunung ada yang memanggil namamu dari belakang... jangan pernah menoleh.',
    'raka': 'Sin... itu suara kamu.',
    'sinta': 'Aku di sini, Rak. Aku nggak ngomong apa-apa.',
    'kakek': 'Berangkat berdua... pulang juga harus berdua.',
}

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'suara'
    vs = daftar_suara()
    if cmd == 'suara':
        for v in vs:
            lb = v.get('labels') or {}
            print(v['voice_id'], '|', v['name'], '|', lb.get('gender', ''), lb.get('age', ''), lb.get('accent', ''), lb.get('description', ''), '|', v.get('category', ''))
    elif cmd == 'audisi':
        os.makedirs(os.path.join(ROOT, 'audisi'), exist_ok=True)
        pilih = json.load(open(os.path.join(ROOT, 'suara', 'calon_11labs.json')))
        for tokoh, ids in pilih.items():
            for vid in ids:
                nama = next((v['name'] for v in vs if v['voice_id'] == vid), vid).split()[0]
                out = os.path.join(ROOT, 'audisi', f'{tokoh}_{nama}.mp3')
                ucap(vid, AUDISI[tokoh], out)
                print('audisi', os.path.basename(out), flush=True)
