"""Ganti SEMUA bunyi sintetis (terdengar seperti game 8-bit — keluhan Julian 19 Nov 2026) dengan REKAMAN ASLI CC0/PD.

Sumber: cache Freesound CC0 (Lots of Sounds) di serial kisah nusantara + Wikimedia Commons PD/CC0 di aplikasi tts cepat
(lihat LISENSI.md di sana). Pemakaian di mix:  import rekaman; rekaman.pasang(S, H)  — sesudah S (musik.py) & H dibuat,
sebelum cue dipanggil. Nama fungsi tetap sama, jadi cue lama tidak perlu ditulis ulang.
"""
import os, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.abspath(os.path.join(HERE, '..', '..', 'serial animasi kisah nusantara', 'animasi3d', 'suara', 'sfx_cache'))
CC0 = os.path.abspath(os.path.join(HERE, '..', '..', 'aplikasi tts cepat', 'assets', 'sfx'))
_r = np.random.default_rng(5)
_mem = {}


def _ir(sec=2.8, decay=1.9, bright=4000, seed=9):
    r = np.random.default_rng(seed); n = int(sec * SR); x = np.arange(n) / SR
    out = []
    for k in range(2):
        l = sosfilt(butter(2, bright, 'low', fs=SR, output='sos'), r.standard_normal(n)) * np.exp(-x * decay)
        l[:int((0.015 + 0.006 * k) * SR)] = 0; out.append(l / np.sqrt(np.sum(l ** 2)))
    return out


IR = _ir()


def muat(sumber, off=0.0, dur=None, semi=0.0, lp=None, hp=None, gaung=0.0, balik=False, fade=0.03):
    """sumber: '271945' (cache freesound) atau nama berkas wav di CC0. semi = geser nada (ikut tempo, kesan berat/lambat)."""
    key = (sumber, round(off, 3), None if dur is None else round(dur, 3), semi, lp, hp, gaung, balik)
    if key in _mem: return _mem[key].copy()
    p = os.path.join(CACHE, f'fs-{sumber}.mp3') if sumber.isdigit() else os.path.join(CC0, sumber)
    af = []
    if semi:
        af.append(f'asetrate={int(SR * 2 ** (semi / 12))},aresample={SR}')
    cmd = ['ffmpeg', '-v', 'error', '-ss', str(off), '-i', p] + (['-af', ','.join(af)] if af else []) + ['-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).astype(np.float64)
    if dur:
        n = int(dur * SR)
        if len(x) < n: x = np.tile(x, (n // max(1, len(x)) + 1, 1))
        x = x[:n]
    if balik: x = x[::-1].copy()
    if lp: x = sosfilt(butter(2, lp, 'low', fs=SR, output='sos'), x, axis=0)
    if hp: x = sosfilt(butter(2, hp, 'high', fs=SR, output='sos'), x, axis=0)
    if gaung:
        w = np.stack([fftconvolve(x[:, k], IR[k])[:len(x) + int(1.5 * SR)] for k in range(2)], 1)
        x = np.vstack([x, np.zeros((int(1.5 * SR), 2))]) * (1 - 0.5 * gaung) + w * gaung
    f = min(len(x) // 4, int(fade * SR))
    if f > 1:
        ramp = np.linspace(0, 1, f)[:, None]; x[:f] *= ramp; x[-f:] *= ramp[::-1]
    x = x / (np.abs(x).max() + 1e-9)
    _mem[key] = x
    return x.copy()


def _pilih(lst, k=[0]):
    k[0] += 1; return lst[k[0] % len(lst)]


def pasang(S, H=None):
    z = lambda *a, **k: np.zeros(10)
    S.sting_hit = lambda base=110.0, dur=3.0: muat(_pilih(['271945', '513330', '578358']), 0, min(dur, 3.5), semi=-2 if base < 90 else 0, gaung=0.35, fade=0.01)
    S.whoosh = lambda dur=0.8, up=True: muat(_pilih(['521043', '521042']), 0, dur + 0.3, fade=0.02)
    S.reverse_swell = lambda dur=1.2: muat('240712', 0, None, gaung=0.2)[-int(dur * SR):]
    S.tuang_air = lambda dur=1.1, deras=1.0: muat('530170', 1.0 + 3 * _r.random(), dur, lp=6000, gaung=0.35, fade=0.08)
    S.kain_basah = lambda dur=0.8, peras=1.0: muat('348241', 0, dur, lp=5000, gaung=0.2)
    S.kain_gesek = lambda dur=1.2: muat('348241', 0, dur, lp=4000, gaung=0.3)
    S.musicbox = z
    S.hum_anak = lambda dur=6.0, gain=1.0: muat('tangis-bayi-kecewa-5s.wav', 0.3, min(dur, 4.6), semi=-3, lp=1800, gaung=0.8, fade=0.6) * 0.8
    S.kayu_berderit = lambda dur=1.1: muat('175205', 0.5, dur, gaung=0.3, fade=0.06)
    S.bisikan = lambda dur, keras=0.5: muat(_pilih(['680839', '193812']), 0, dur, lp=6000, gaung=0.5, fade=0.2)
    S.motif_ganjil = lambda dur=3.2, gain=1.0: muat('483449', 4.0, dur, semi=-4, lp=2200, gaung=0.6, fade=0.5)
    S.heartbeat = lambda dur, bpm=72: muat('21409', 0, dur, lp=900, fade=0.2)
    S.napas = lambda dur=1.1, takut=0.0: muat('163383', 0, dur, gaung=0.15, fade=0.1)
    S.saluran_gurah = lambda dur=2.4: muat('530170', 0.5, dur, semi=-7, lp=1500, gaung=0.3, fade=0.2)
    S.ayam = lambda: muat('222636', 0, 4.0, fade=0.5)
    S.burung = lambda dur: muat('222636', 5.0, dur, fade=0.5)
    S.kick = lambda n_=0.35: muat('149966', 0, 0.8, fade=0.01)
    S.thud_kain = lambda dur=0.7: muat('149966', 0, 1.0, semi=-3, fade=0.01)
    S.dengung_ampli = lambda dur: muat('553075', 0, dur, fade=0.5)
    S.tetes = lambda: _tetes()
    if H is not None:
        H.backsound = lambda dur, gong_tiap=7.5, mulai=0.0, tegang=(), hening=(): _bed(dur, hening)
        H.gong_ageng = lambda dur=6.0, f0=55.0: muat('177242', 0, dur, semi=-5, lp=3000, gaung=0.5, fade=0.01)
        H.kentongan = z; H.tokek = z
        H.anjing_lolong = lambda dur=3.0: muat('465697', 0, dur, lp=3000, gaung=0.6, fade=0.4)   # burung hantu jauh (rekaman)
        H.gamelan_balik = lambda f=0, dur=1.6: muat('240712', 0, None, gaung=0.2)[-int(dur * SR):]
        H.sinden = lambda f=0, dur=4.0, vokal='a': muat('tangis-bayi-5s.wav', 0.5, min(dur, 4.4), semi=-4, lp=1600, gaung=0.85, fade=0.7) * 0.7


def _tetes():
    """tetes air: klik tipis berresonansi + gaung ruang (lebih alami dari sinus murni)"""
    n = int(0.12 * SR); x = np.arange(n) / SR
    y = np.sin(2 * np.pi * (1400 - 5000 * x) * x) * np.exp(-x * 60) + 0.25 * _r.standard_normal(n) * np.exp(-x * 400)
    y = np.stack([y, y], 1)
    w = np.stack([fftconvolve(y[:, k], IR[k])[:n + int(1.2 * SR)] for k in range(2)], 1)
    y = np.vstack([y, np.zeros((int(1.2 * SR), 2))]) * 0.7 + w * 0.6
    return y / (np.abs(y).max() + 1e-9)


def _bed(dur, hening=()):
    """latar rekaman: dengung gelap + dengung rendah + gamelan asli diturunkan nadanya, sangat lirih, bergaung"""
    n = int(dur * SR)
    d1 = muat('141139', 0, dur, fade=1.0); d2 = muat('157133', 0, dur, semi=-2, fade=1.0)
    g = muat('483449', 0, dur, semi=-5, lp=1800, gaung=0.7, fade=1.5)
    y = d1[:n] * 0.55 + d2[:n] * 0.5 + g[:n] * 0.45
    for a, b in hening:
        y[int(max(0, a) * SR):int(min(dur, b) * SR)] *= 0.05
    return y / (np.abs(y).max() + 1e-9)
