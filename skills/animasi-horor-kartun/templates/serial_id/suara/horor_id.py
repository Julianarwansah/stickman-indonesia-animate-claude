"""Backsound & SFX horor nuansa Indonesia — SEMUA disintesis (bebas hak cipta, tanpa rekaman/lagu orang lain).

Gamelan slendro sumbang (gong ageng, kempul, saron, bonang), suling berdesah, kendang pelan, senandung sinden
samar (formant vokal 'a/u'), kentongan ronda, tokek, anjing melolong jauh, gamelan dibalik (reverse), drone.
Melodi orisinal: pola slendro turun yang tidak pernah selesai (berhenti di nada ke-4), sedikit fals (detune).

pakai di mix:  import horor_id as H;  bed = H.backsound(TOT, gong_tiap=7.5, mulai=0, tegang=[(t0,t1),...])
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
_r = np.random.default_rng(13)


def _t(n): return np.arange(n) / SR
def _lp(x, f, o=2): return sosfilt(butter(o, f, btype='low', fs=SR, output='sos'), x)
def _hp(x, f, o=2): return sosfilt(butter(o, f, btype='high', fs=SR, output='sos'), x)
def _bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], btype='band', fs=SR, output='sos'), x)
def _nz(n): return _r.standard_normal(n)
def _norm(x): return x / (np.abs(x).max() + 1e-9)


# slendro (5 nada, ±240 sen) di atas D2 ~ 73.4 Hz; fals sedikit supaya "sumbang"
_SL = [0, 231, 474, 717, 955]
def slendro(deg, base=146.8, fals=0.0):
    o, d = divmod(deg, 5)
    return base * 2 ** (o + (_SL[d] + fals) / 1200)


def _ir(sec=3.2, decay=1.6, bright=3500, seed=3):
    r = np.random.default_rng(seed); n = int(sec * SR); x = _t(n)
    l = _lp(r.standard_normal(n), bright) * np.exp(-x * decay); l[:int(0.02 * SR)] = 0
    return l / np.sqrt(np.sum(l ** 2))


_IR = _ir()
def gaung(x, amt=0.5):
    return x * (1 - amt * 0.5) + fftconvolve(x, _IR)[:len(x)] * amt


# ---------------- instrumen ----------------
def gong_ageng(dur=7.0, f0=55.0):
    """gong besar: dasar rendah berdenyut (ombak) + parsial inharmonik, peluruhan panjang"""
    n = int(dur * SR); x = _t(n)
    y = np.sin(2 * np.pi * f0 * x) * (1 + 0.45 * np.sin(2 * np.pi * 2.6 * x))          # ombak gong
    y += 0.5 * np.sin(2 * np.pi * f0 * 1.003 * x)
    for r, g, d in ((2.02, 0.35, 1.2), (2.98, 0.18, 2.0), (4.1, 0.08, 3.0), (5.6, 0.05, 4.0)):
        y += g * np.sin(2 * np.pi * f0 * r * x) * np.exp(-x * d)
    y += 0.25 * _lp(_nz(n), 300) * np.exp(-x * 30)                                     # pukulan pemukul empuk
    return _norm(y * np.exp(-x * 0.55) * np.minimum(1, x / 0.01))


def kempul(f0=98.0, dur=3.5):
    n = int(dur * SR); x = _t(n)
    y = np.sin(2 * np.pi * f0 * x) * (1 + 0.3 * np.sin(2 * np.pi * 4.1 * x)) + 0.3 * np.sin(2 * np.pi * f0 * 2.04 * x) * np.exp(-x * 1.5)
    return _norm(y * np.exp(-x * 1.1) * np.minimum(1, x / 0.008))


def saron(f, dur=1.6):
    """bilah logam: parsial 1, 2.76, 5.4 + pasangan fals berdenyut"""
    n = int(dur * SR); x = _t(n)
    y = np.sin(2 * np.pi * f * x) + 0.45 * np.sin(2 * np.pi * f * 1.012 * x)
    y += 0.4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 5) + 0.15 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 10)
    y += 0.3 * _bp(_nz(n), 2000, 6000) * np.exp(-x * 80)
    return _norm(y * np.exp(-x * 2.2) * np.minimum(1, x / 0.003))


def bonang(f, dur=2.4):
    n = int(dur * SR); x = _t(n)
    y = np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 1.009 * x) + 0.25 * np.sin(2 * np.pi * f * 3.1 * x) * np.exp(-x * 4)
    return _norm(_lp(y * np.exp(-x * 1.6) * np.minimum(1, x / 0.01), 2400))


def suling(f, dur=2.8, desah=0.5):
    """seruling bambu: sinus + napas berdesah, vibrato lambat, glissando turun di ujung"""
    n = int(dur * SR); x = _t(n)
    fq = f * (1 + 0.012 * np.sin(2 * np.pi * 5.2 * x) * np.minimum(1, x / 0.6)) * (1 - 0.06 * np.clip((x - dur * 0.7) / (dur * 0.3), 0, 1))
    ph = np.cumsum(2 * np.pi * fq / SR)
    y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    y += desah * _bp(_nz(n), f * 0.8, f * 3.5) * 0.6
    e = np.minimum(1, x / 0.35) * np.minimum(1, (dur - x) / 0.6) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * x))
    return _norm(y * e)


def kendang(keras=1.0):
    """dhung rendah: membran turun nada cepat"""
    n = int(0.6 * SR); x = _t(n)
    f = 90 + 70 * np.exp(-x * 25)
    y = np.sin(np.cumsum(2 * np.pi * f / SR)) * np.exp(-x * 7) + 0.3 * _lp(_nz(n), 900) * np.exp(-x * 60)
    return _norm(y) * keras


def sinden(f=330.0, dur=4.0, vokal='a'):
    """senandung perempuan samar tanpa kata: sumber gergaji + 3 formant, cengkok (lekuk nada) slendro"""
    n = int(dur * SR); x = _t(n)
    cg = 1 + 0.03 * np.sin(2 * np.pi * 5.5 * x) * np.minimum(1, x / 0.8) + 0.06 * np.sin(np.pi * x / dur) * np.sin(2 * np.pi * 0.4 * x)
    ph = np.cumsum(2 * np.pi * f * cg / SR)
    src = sum(np.sin(k * ph) / k for k in range(1, 18))
    F = {'a': [(800, 1150), (1150, 1400), (2800, 3100)], 'u': [(300, 450), (700, 900), (2300, 2600)]}[vokal]
    y = sum(_bp(src, lo, hi) * g for (lo, hi), g in zip(F, (1.0, 0.6, 0.25)))
    y += 0.08 * _bp(_nz(n), 1500, 5000)
    return _norm(y * np.minimum(1, x / 0.7) * np.minimum(1, (dur - x) / 1.2))


def kentongan(kali=3, jarak=0.55):
    """kentongan bambu ronda: tok-tok-tok berongga"""
    n = int((kali * jarak + 0.6) * SR); y = np.zeros(n)
    for k in range(kali):
        m = int(0.25 * SR); x = _t(m)
        h = np.sin(2 * np.pi * 620 * x) * np.exp(-x * 28) + 0.5 * np.sin(2 * np.pi * 1240 * x) * np.exp(-x * 45) + 0.4 * _bp(_nz(m), 400, 2500) * np.exp(-x * 90)
        i = int(k * jarak * SR); y[i:i + m] += h
    return _norm(y)


def tokek(kali=2):
    """'to-kek' khas malam Indonesia: dua suku, gergaji parau terfilter"""
    out = []
    for k in range(kali):
        for f0, d in ((520, 0.16), (380, 0.22)):
            n = int(d * SR); x = _t(n)
            ph = np.cumsum(2 * np.pi * (f0 * (1 - 0.25 * x / d)) / SR)
            s = sum(np.sin(j * ph) / j for j in range(1, 10)) * (1 + 0.6 * np.sin(2 * np.pi * 70 * x))
            out.append(_bp(s, 300, 2600) * np.sin(np.pi * x / d)); out.append(np.zeros(int(0.07 * SR)))
        out.append(np.zeros(int(0.6 * SR)))
    return _norm(np.concatenate(out))


def anjing_lolong(dur=3.2):
    n = int(dur * SR); x = _t(n)
    f = 480 + 220 * np.sin(np.pi * x / dur) - 120 * x / dur
    ph = np.cumsum(2 * np.pi * f / SR)
    y = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.1 * _bp(_nz(n), 600, 2000)
    return _norm(_lp(y, 2200) * np.sin(np.pi * x / dur) ** 1.4)


def gamelan_balik(f, dur=2.4):
    """saron dibalik: membengkak lalu putus (sebelum reveal)"""
    return saron(f, dur)[::-1].copy()


def drone_mistis(dur):
    n = int(dur * SR); x = _t(n)
    y = 0.5 * np.sin(2 * np.pi * 36.7 * x) + 0.35 * np.sin(2 * np.pi * 55.0 * x + 0.5 * np.sin(x * 0.3))
    y += 0.25 * np.sin(2 * np.pi * 73.9 * x) * (0.5 + 0.5 * np.sin(x * 0.17))                    # tritone samar dari 52
    y += 0.3 * _lp(_nz(n), 140) + 0.06 * _bp(_nz(n), 2500, 6000) * (0.5 + 0.5 * np.sin(x * 0.9))  # desis angin
    return _norm(y)


# ---------------- backsound utuh ----------------
def backsound(dur, gong_tiap=7.5, mulai=0.0, tegang=(), hening=()):
    """mono float array panjang dur detik.
    tegang: [(t0,t1)] bagian tegang -> kendang & saron lebih rapat; hening: [(t0,t1)] semua instrumen dibuang (sebelum kaget)."""
    n = int(dur * SR); bus = np.zeros(n)
    def put(t, y, g):
        i = int(t * SR)
        if i >= n or i < 0: return
        m = min(len(y), n - i); bus[i:i + m] += y[:m] * g
    put(0, drone_mistis(dur), 0.55)
    t = mulai + 0.3
    while t < dur - 1:                                       # gong ageng + kempul menjawab
        put(t, gong_ageng(min(7.5, dur - t)), 0.9)
        put(t + gong_tiap * 0.5, kempul(slendro(1, 98.0, 18)), 0.35)
        t += gong_tiap
    # saron: pola slendro turun yang berhenti di nada ke-4 (tak selesai), diulang dengan fals berbeda
    pola = [9, 8, 6, 5]
    t, k = mulai + 2.0, 0
    while t < dur - 1.5:
        rapat = any(a <= t < b for a, b in tegang)
        for j, d in enumerate(pola):
            put(t + j * (0.42 if rapat else 0.7), saron(slendro(d, 146.8, 25 * ((k + j) % 3 - 1))), 0.22)
        t += (3.4 if rapat else 6.0); k += 1
    # suling: frase panjang jarang
    for t0 in np.arange(mulai + 5.0, dur - 4, 13.0):
        put(t0, suling(slendro(7, 146.8, -20), 3.2), 0.16)
        put(t0 + 3.4, suling(slendro(6, 146.8, 15), 2.4), 0.13)
    # kendang pelan, rapat di bagian tegang
    t = mulai + 1.2
    while t < dur - 0.5:
        rapat = any(a <= t < b for a, b in tegang)
        put(t, kendang(0.8 if rapat else 0.5), 0.3)
        t += 0.75 if rapat else 2.6
    # sinden samar: dua kali
    for t0, f, v in ((mulai + 9.0, slendro(9, 146.8, 30), 'a'), (dur * 0.62, slendro(8, 146.8, -25), 'u')):
        if t0 < dur - 4: put(t0, sinden(f, 4.2, v), 0.14)
    bus = gaung(_lp(bus, 5000), 0.55)
    for a, b in hening:
        i0, i1 = int(max(0, a) * SR), int(min(dur, b) * SR); bus[i0:i1] *= 0.06
    x = _t(n); bus *= np.clip(x / 0.5, 0, 1) * np.clip((dur - x) / 0.4, 0, 1)
    return _norm(bus)
