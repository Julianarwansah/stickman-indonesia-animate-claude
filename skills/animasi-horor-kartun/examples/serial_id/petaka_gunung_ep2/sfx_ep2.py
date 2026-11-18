# Isyarat efek suara PETAKA GUNUNG Ep.2 (suara/mix.py). Rekaman CC0 Lots of Sounds.
END = TOTAL
place("fs-245824", 0, -25, dur=END, bus=bus_amb, loop=True, fin=1.0, fout=1.5)        # angin hutan
place("fs-117513", 0, -33, dur=END, bus=bus_amb, loop=True, fin=2.0, fout=1.5)        # hembusan gunung
place("fs-141139", 0, -28, dur=t0("j01"), loop=True, fin=2.0, fout=0.05)              # dengung tegang
place("fs-141139", t0("p01"), -26, dur=END - t0("p01"), loop=True, fin=1.0, fout=1.5)
place("fs-177242", 0.0, -10, dur=4)                                                    # judul
# lari turun + napas + langkah yang mengikuti
place("fs-630011", 0.0, -16, dur=t0("r05") + 0.4, loop=True, fout=0.4)
place("fs-163383", 0.2, -20, dur=t0("r05") + 1.5, loop=True, fout=0.8)
place("fs-571956", t0("r02") - 0.5, -22, dur=t0("r05") - t0("r02") + 0.5, loop=True, fin=0.6, fout=0.3)
place("fs-680839", t0("r02") - 0.3, -22, dur=3.2, fin=0.3, fout=1.0)                   # bisikan "tungguin"
place("fs-21409", t0("r03"), -16, dur=t0("r05") - t0("r03"), loop=True, fin=0.3, fout=0.2)
place("fs-348241", word("r05", "menangkap"), -15, dur=1.0, fin=0.0)                    # bahu ditangkap
place("fs-193812", t0("r08"), -26, dur=3, fin=0.5, fout=1.0)                           # bisik di jalur kosong
place("fs-670200", t0("r10") - 0.2, -12, dur=0.4, fin=0.0)                             # klik foto di HP
place("fs-21409", t0("r11"), -22, dur=t1("r11") - t0("r11"), loop=True, fin=0.8, fout=0.6)
place("fs-578358", word("r12", "meninggal"), -9, dur=4, fin=0.0)                       # "meninggal"
place("fs-175205", t0("r13"), -20, dur=4, fin=0.3, fout=1.0)                            # kayu pondok berderit
place("fs-410359", t0("r13") + 0.8, -18, dur=0.4, fin=0.0)
place("fs-410359", t0("r13") + 2.1, -18, dur=0.4, fin=0.0)
place("fs-271945", t0("j01"), -3, dur=3, fin=0.0, fout=0.8)                             # JUMPSCARE
place("fs-177242", t0("j01"), -5, dur=3, fin=0.0)
place("fs-273805", t0("p01"), -20, dur=END - t0("p01"), fin=0.3, fout=2.0)              # kartu pilihan
place("fs-21409", t0("p01") + 0.5, -24, dur=END - t0("p01") - 0.5, loop=True, fin=1.0, fout=1.5)
