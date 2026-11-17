"""Isyarat efek suara Horor USA Ep.1 (contoh). Dijalankan oleh templates/suara/mix.py:
    python mix.py <proyek>/ep1 sfx_ep1.py
Pola: suasana di bus_amb (angin, dengung), langkah dengan steps(), stinger di kata kunci dengan word(), semua dengan
id Lots of Sounds (CC0) atau kit CC0 skill sound-effects (whoosh/impact/riser .ogg). Ganti id/waktu untuk episode baru.
"""
# ---------------- suasana ----------------
place("fs-117513", 0, -27, dur=TOTAL, loop=True, fin=2.0, fout=3.0, bus=bus_amb)                         # angin musim dingin
place("fs-141139", t0("c03") - 2, -30, dur=t0("t00") - t0("c03") + 2, loop=True, fin=2, fout=1.5, bus=bus_amb)  # dengung seram (pembuka)
place("fs-141139", t0("b01"), -30, dur=t0("k5") - t0("b01"), loop=True, fin=3, fout=2, bus=bus_amb)      # dengung bab 2-4
place("fs-135433", t0("b06"), -29, dur=t1("b20") - t0("b06"), loop=True, fin=2, fout=2, bus=bus_amb)    # lapisan seram saat psikopat terlihat
place("fs-141139", t0("e11") - 1, -28, dur=TOTAL - t0("e11") + 1, loop=True, fin=2, fout=3, bus=bus_amb)  # dengung penutup
place("fs-465697", t0("c02", 0.5), -26)                                                                 # burung hantu
place("fs-164202", t0("a07"), -31, dur=12, fin=1, fout=2)                                               # coyote di kejauhan
place("fs-553075", t0("c03"), -30, dur=6, fin=0.5, fout=1)                                              # dengung lampu jalan

# ---------------- judul & bab ----------------
place("whoosh.ogg", t0("t00"), -16)
place("fs-177242", t0("t00") + 1.0, -15, dur=6, fout=2)
place("riser.ogg", t0("t00") + 2.4, -22)
for k in ["k1", "k2", "k3", "k4", "k5"]:
    place("whoosh.ogg", t0(k), -18)
    place("impact.ogg", t0(k) + 0.88, -16)

# ---------------- bab 1: berjalan ----------------
walk_a, walk_b = t0("a01"), t0("a09") - 0.6
place("fs-443015", walk_a, -25, dur=walk_b - walk_a, loop=True, fin=1, fout=0.8)                        # langkah di salju
place("fs-443015", t0("a12"), -25, dur=t0("k2") - t0("a12"), loop=True, fin=0.5, fout=0.8, offset=5)

# ---------------- bab 2: pria bertopeng ----------------
place("fs-443015", t0("b01"), -25, dur=t0("b03") - t0("b01"), loop=True, fin=0.5, fout=0.6)
place("fs-553075", t0("b01"), -27, dur=7, fin=1, fout=1.5)                                              # lampu jalan berdengung
steps("fs-348248", t0("b01", 0.7), 3, 1.05, -19, st=-5, tempo=0.8, dur=0.7)                              # "something crunched"
steps("fs-348248", t0("b02"), 6, 0.95, -18, st=-5, tempo=0.8, dur=0.7)                                    # langkah berat
place("fs-578493", t0("b02"), -27, dur=6.5, fin=0.8, fout=1.2)                                           # kapak diseret
place("fs-271945", word("b07", "white porcelain"), -15)                                                  # stinger: topeng
place("fs-553075", t0("b06"), -26, dur=t1("b08") - t0("b06"), fin=1, fout=1)
place("fs-21409", t0("b09"), -22, dur=t0("b13") - t0("b09") + 0.3, fin=1.5, fout=0.3)                     # detak jantung
steps("fs-348248", t0("b12", 0.8), 1, 0.9, -15, st=-5, tempo=0.8, dur=0.8)                                # satu langkah maju
place("impact.ogg", t0("b13"), -14)
run_a = t1("b13")
place("fs-348248", run_a, -19, dur=t1("b24") - run_a, loop=True, tempo=1.75, fin=0.2, fout=1.0)          # berlari di salju
place("fs-163383", run_a + 1, -24, dur=t1("b16") - run_a - 1, loop=True, st=2, fin=0.5, fout=0.5)         # napas terengah
place("fs-384485", t0("b17", 0.05), -17, dur=2.2)                                                         # ponsel bergetar
for frac in (0.25,):
    place("fs-328243", t0("b17", frac), -20, dur=1.2)
for w in ("The news", "Do not"):
    place("fs-328243", word("b18", w), -20, dur=1.2)
steps("fs-348248", t0("b20"), 7, 1.0, -19, st=-5, tempo=0.8, dur=0.7)

# ---------------- bab 3: pelabuhan ----------------
place("fs-348248", t0("c01h"), -19, dur=5.2, loop=True, tempo=1.75, fout=0.6)
place("fs-21409", t0("c03i") - 1, -23, dur=t0("c08h") - t0("c03i") + 1, loop=True, fin=2, fout=0.2)       # detak jantung makin dekat
txt = L["c04h"]["text"]
for k in range(3):
    place("fs-348248", t0("c04h", (k * 8 + 1) / len(txt)) - 0.08, -15, dur=0.7, offset=k * 0.7, st=-5, tempo=0.8, fout=0.15)
steps("fs-348248", t0("c05h"), 4, 1.1, -17, st=-5, tempo=0.8, dur=0.7)
place("fs-163383", t0("c06h"), -17, dur=t1("c06h") - t0("c06h") + 1.2, loop=True, st=-5, tempo=0.75, fin=0.6, fout=0.6)  # napas di balik topeng
place("fs-384485", t0("c07h", 0.55), -12, dur=2.0)
place("fs-271945", t0("c08h") - 0.15, -12)                                                                # stinger: "Found you"
place("impact.ogg", t0("c09h"), -13)
place("fs-348248", t1("c09h"), -19, dur=t1("c10h") - t1("c09h"), loop=True, tempo=1.75, fout=0.5)
place("fs-794610", t0("c10h"), -21, dur=t1("c10h") - t0("c10h"), loop=True, tempo=1.6, fout=0.5)           # lari di papan dermaga
place("fs-339950", t1("c10h") - 1.6, -22, dur=1.8, offset=3, fout=0.2)                                     # menekan 9-1-1
place("fs-175205", t0("c15h"), -18, dur=t1("c16h") - t0("c15h"), fin=0.5, fout=1.2)                        # dermaga berderit
steps("fs-794610", t0("c15h"), 6, 1.0, -18, st=-4, tempo=0.85, dur=0.8)

# ---------------- bab 4: kolam beku ----------------
place("fs-117513", t0("d01"), -29, dur=t1("d11") - t0("d01"), offset=120, fin=2, fout=2, bus=bus_amb)      # angin lebih kencang
place("fs-348248", t0("d01"), -21, dur=t0("d07") - t0("d01"), loop=True, tempo=1.5, fin=0.5, fout=0.8)
place("fs-735401", t0("d03"), -17, dur=4, offset=2, fout=1)                                                # es retak
place("fs-735401", t0("d05"), -15, dur=4.5, offset=10, fout=1)
steps("fs-348248", t0("d06"), 5, 1.0, -18, st=-6, tempo=0.8, dur=0.7)
place("fs-522884", t0("d07", 0.5), -17, dur=3, offset=4, fout=1)
place("fs-522884", t0("d08") - 0.05, -9, dur=2.2, offset=20, fin=0.01, fout=0.8)                           # "Crack."
place("fs-578358", t0("d08"), -18)
place("fs-9508", t0("d09") + 0.2 + 0.35, -9)                                                                # tercebur
place("fs-173439", t0("d09") + 0.9, -19, dur=5, loop=True, fin=0.3, fout=2.5)                              # gelembung
place("fs-173439", t0("d11"), -24, dur=4, loop=True, fin=0.3, fout=3)

# ---------------- bab 5: teras ----------------
place("fs-348248", t0("e01"), -20, dur=3, loop=True, tempo=1.75, fout=0.5)
place("fs-168650", t1("e02") - 0.2, -20, dur=3, fout=0.8)                                                  # pintu berderit
place("fs-52906", t0("e03"), -21, dur=t1("e06c") - t0("e03") + 1.5, loop=True, fin=2.5, fout=2.5)           # sirene
place("whoosh.ogg", t0("e08"), -18)
place("fs-384485", t0("e09", 0.12), -16, dur=2.2)
place("fs-328243", t0("e09", 0.75), -19, dur=1.2)
place("fs-328243", t0("e09", 0.75) + 1.8, -19, dur=1.2)
place("fs-21409", t0("e10") - 0.5, -24, dur=t1("e12") - t0("e10"), loop=True, fin=1.5, fout=2)
place("fs-513330", t0("e12") - 0.3, -15, dur=TOTAL - t0("e12") + 0.3, fin=0.05, fout=3)                     # stinger penutup
