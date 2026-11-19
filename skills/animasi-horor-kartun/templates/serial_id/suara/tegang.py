"""MESIN KETEGANGAN — lapisan backsound/SFX mendebarkan per adegan, SEMUA dari rekaman asli CC0 (lewat rekaman.muat).

Permintaan Julian 2026-11-19: "tambahkan backsound atau sfx yang mendebarkan di beberapa adegan yang butuh".
Jangan pakai bunyi sintetis bernada (ditolak: "kaya game pixel").

Jenis adegan (dipakai di daftar `adegan` atau dibuat otomatis dari ep.ts):
  naik   : build-up sebelum reveal — riser simbal terbalik diregang, dengung rendah membesar, detak jantung makin cepat,
           napas tertahan. Paling efektif 3–6 dtk sebelum kejutan.
  kejar  : panik/dikejar — detak cepat, dentum rendah berulang (denyut), napas terengah.
  kaget  : jump scare — hening 0,5 dtk, lalu stinger + dentuman sinematik + whoosh.
  reveal : pengungkapan (bukan jump) — hening 0,35 dtk, stinger lembut + sub boom panjang.
  hening : semua lapisan dibuang kecuali room tone (ketegangan lewat sunyi).
  lega   : dengung memudar pelan sesudah kejutan (beri penonton napas).

Pakai di mix (sesudah semua cue biasa, SEBELUM narasi ditambahkan):
    import tegang
    tegang.pasang(add, L, R, SR, TOT, [
        dict(jenis='naik', dari=12.0, sampai=16.5),
        dict(jenis='kaget', dari=16.5),
        dict(jenis='lega', dari=17.0, sampai=20.0),
    ])
atau otomatis dari waktu jump/kick episode:
    tegang.pasang(add, L, R, SR, TOT, tegang.otomatis(jump=[16.5], reveal=[8.2], kejar=[(30, 34)]))
"""
import numpy as np
import rekaman as rk


def _ramp(n, a, b, p=1.0):
    return (np.linspace(a, b, n) ** p)[:, None]


def _detak_naik(dur, bpm0=60, bpm1=120):
    """detak jantung rekaman (fs-21409) dipotong per-denyut lalu dirapatkan: makin cepat menjelang kejutan"""
    SR = rk.SR
    beat = rk.muat('21409', 0.0, 0.62, lp=700, fade=0.02)
    out = np.zeros((int(dur * rk.SR) + len(beat), 2)); t = 0.0
    while t < dur:
        u = t / dur; bpm = bpm0 + (bpm1 - bpm0) * u ** 1.4
        i = int(t * SR); g = 0.55 + 0.45 * u
        out[i:i + len(beat)] += beat * g
        t += 60.0 / bpm
    return out[:int(dur * SR)]


def _riser(dur):
    """simbal terbalik (fs-240712) diregang/digeser nada supaya pas durasi, ditambah dengung gelap yang membesar"""
    SR = rk.SR
    r = rk.muat('240712', 0, None, gaung=0.3)
    semi = 12 * np.log2(max(0.25, len(r) / SR / max(0.5, dur)))       # geser kecepatan agar panjang ~ dur
    r = rk.muat('240712', 0, None, semi=float(np.clip(semi, -12, 12)), gaung=0.3)
    r = r[-int(dur * SR):] if len(r) > dur * SR else np.vstack([np.zeros((int(dur * SR) - len(r), 2)), r])
    d = rk.muat('157133', 0, dur, semi=-3, fade=0.3)[:int(dur * SR)]
    return r * 0.8 + d * _ramp(len(d), 0.0, 0.9, 2.0)


def pasang(add, L, R, SR, TOT, adegan, db=0.0):
    """tambahkan lapisan ketegangan; `add(t, x, db, pan)` = fungsi add milik mix; L/R = bus untuk ducking hening"""
    def duck(a, b, k):
        i0, i1 = int(max(0, a) * SR), int(min(TOT, b) * SR)
        if i1 > i0: L[i0:i1] *= k; R[i0:i1] *= k
    for ad in adegan:
        j, a = ad['jenis'], float(ad['dari']); b = float(ad.get('sampai', a + 3.0)); dur = max(0.5, b - a)
        if j == 'naik':
            add(a, _riser(dur), -10 + db)
            add(a, _detak_naik(dur), -9 + db)
            add(a + dur * 0.45, rk.muat('163383', 0, dur * 0.55, gaung=0.15, fade=0.3), -18 + db, -0.2)
            d = rk.muat('141139', 0, dur, fade=0.5); add(a, d * _ramp(len(d), 0.2, 1.0), -16 + db)
        elif j == 'kejar':
            add(a, _detak_naik(dur, 110, 140), -8 + db)
            th = rk.muat('149966', 0, 0.5, semi=-5, fade=0.01)
            for t in np.arange(a, b, 0.42): add(t, th, -12 + db)
            add(a, rk.muat('630011', 0, dur, fade=0.3), -16 + db)
        elif j == 'kaget':
            duck(a - 0.5, a, 0.1)
            add(a - 0.03, rk.muat('271945', 0, 3.0, semi=-2, gaung=0.35, fade=0.01), -3 + db)
            add(a - 0.03, rk.muat('648536', 0, 2.5, gaung=0.25, fade=0.01), -5 + db)
            add(a, rk.muat('521043', 0, 0.9, fade=0.02), -10 + db)
        elif j == 'reveal':
            duck(a - 0.35, a, 0.2)
            add(a, rk.muat('513330', 0, 3.0, gaung=0.4, fade=0.01), -7 + db)
            add(a, rk.muat('177242', 0, 4.0, semi=-6, lp=2500, gaung=0.5, fade=0.01), -8 + db)
        elif j == 'hening':
            duck(a, b, 0.15)
        elif j == 'lega':
            d = rk.muat('141139', 0, dur, semi=-2, fade=0.4)
            add(a, d * _ramp(len(d), 1.0, 0.0, 1.5), -20 + db)


def otomatis(jump=(), reveal=(), kejar=(), naik_dtk=4.5):
    """buat daftar adegan dari waktu kejutan: tiap jump/reveal didahului 'naik', diikuti 'lega'"""
    out = []
    for t in jump:
        out += [dict(jenis='naik', dari=max(0.2, t - naik_dtk), sampai=t - 0.5), dict(jenis='kaget', dari=t), dict(jenis='lega', dari=t + 0.6, sampai=t + 4.0)]
    for t in reveal:
        out += [dict(jenis='naik', dari=max(0.2, t - naik_dtk * 0.7), sampai=t - 0.35), dict(jenis='reveal', dari=t), dict(jenis='lega', dari=t + 0.5, sampai=t + 3.0)]
    for a, b in kejar:
        out.append(dict(jenis='kejar', dari=a, sampai=b))
    return out
