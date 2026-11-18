# Dasar efek suara yang sama untuk tiap episode PETAKA GUNUNG (dijalankan dari isyarat episode lewat exec).
END = TOTAL
JS = L.get("j01")
place("fs-245824", 0, -25, dur=END, bus=bus_amb, loop=True, fin=1.0, fout=1.5)            # angin di sela pinus
place("fs-117513", 0, -33, dur=END, bus=bus_amb, loop=True, fin=2.0, fout=1.5)            # hembusan gunung jauh
place("fs-141139", 0, -28, dur=(t0("j01") if JS else t0("p01")), loop=True, fin=2.0, fout=0.05)  # dengung tegang
place("fs-141139", t0("p01"), -26, dur=END - t0("p01"), loop=True, fin=1.0, fout=1.5)
place("fs-177242", 0.0, -10, dur=4)                                                        # judul
if JS:
    place("fs-21409", max(0, t0("j01") - 5), -16, dur=min(5, t0("j01")), loop=True, fin=0.5, fout=0.05)  # detak jantung menjelang
    place("fs-271945", t0("j01"), -3, dur=3, fin=0.0, fout=0.8)                            # JUMPSCARE
    place("fs-177242", t0("j01"), -5, dur=3, fin=0.0)
place("fs-273805", t0("p01"), -20, dur=END - t0("p01"), fin=0.3, fout=2.0)                 # kartu pilihan
place("fs-21409", t0("p01") + 0.5, -24, dur=END - t0("p01") - 0.5, loop=True, fin=1.0, fout=1.5)
