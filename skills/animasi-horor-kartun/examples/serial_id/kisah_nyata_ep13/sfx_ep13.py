exec(open(os.path.join(PROJ, "suara", "sfx_umum.py")).read())
place("fs-423647", t0("a02"), -24, dur=t0("a04") - t0("a02"), loop=True, fin=1.5, fout=1.0)  # gamelan upacara
place("fs-131348", t0("a02", 0.2), -20, dur=6, fout=2.0)                                   # genta
place("fs-514381", t0("a03"), -24, dur=t0("a04") - t0("a03"), loop=True, fin=1.5, fout=0.2)  # gunung bergemuruh
place("fs-177556", t0("a04"), -10, dur=6, fin=0.0, fout=2.0)                               # letusan
place("fs-514381", t0("a04"), -16, dur=t1("a05") - t0("a04"), loop=True, fin=0.2, fout=1.5)
place("fs-117610", t0("a05"), -24, dur=t1("a06") - t0("a05"), bus=bus_amb, loop=True, fin=1.0, fout=1.0)  # langit gelap
place("fs-222636", t0("a07"), -26, dur=t1("a07") - t0("a07"), bus=bus_amb, loop=True, fin=1.5, fout=1.0)  # pagi
place("fs-131348", t0("a07", 0.4), -22, dur=6, fout=2.0)
