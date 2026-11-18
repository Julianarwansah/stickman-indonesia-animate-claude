# Isyarat efek KISAH NYATA Ep.13 (mix v2). Lapisan otomatis (whoosh antar scene, riser, api unggun, room tone) sudah jalan sendiri.
exec(open(os.path.join(PROJ, "suara", "sfx_umum.py")).read())
# 1. suasana per scene (setiap scene punya suara tempatnya)
suasana({
    "pura":        "fs-423647",            # gamelan upacara
    "pemangku":    ("fs-423647", -28),
    "letusan":     ("fs-514381", -16),      # gemuruh gunung
    "gelap":       ("fs-117610", -22),      # angin abu
    "desa_kosong": ("fs-117610", -26),
    "pura_pagi":   "fs-222636",             # pagi desa
})
# 2. aksen tepat di kata (waktu kata dari kata.py)
hit("a02", "Pura", "fs-131348", -20, pan=-0.3, dur=6)        # genta pura
place("fs-514381", t0("a03"), -24, dur=t1("a03") - t0("a03"), loop=True, fin=1.0, fout=0.3)   # gunung bergemuruh di bawah narasi
hit("a04", "puncak", "fs-177556", -9, dur=6)                  # letusan
hit("a04", "puncak", "fs-648536", -14, pan=0.2)               # hantaman sinematik
hit("a06", "meninggal", "fs-149966", -16, dur=3)              # dentum teredam
hit("a07", "dituntaskan", "fs-131348", -22, pan=0.3, dur=6)   # genta penutup
