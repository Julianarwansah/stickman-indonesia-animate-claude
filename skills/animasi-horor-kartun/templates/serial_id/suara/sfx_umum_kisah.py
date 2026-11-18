# Dasar efek suara KISAH NYATA NUSANTARA (3D). Nada hormat: TANPA jumpscare.
END = TOTAL
JS = L.get("j01")
place("fs-157133", 0, -30, dur=t0("p01"), bus=bus_amb, loop=True, fin=1.5, fout=1.0)       # dengung gelap pelan
place("fs-177242", 0.0, -14, dur=4)                                                        # hantaman judul (hook)
place("fs-127196", t0("a01", 0.0) + 0.05, -20, dur=1)                                      # whoosh kotak hook
st = next(b["id"] for b in tl["baris"] if b["scene"] == "stempel")
place("fs-222517", t0(st), -16, dur=4, fout=1.5)                                           # stempel KISAH NYATA
place("fs-483449", t0("p01"), -26, dur=END - t0("p01"), loop=True, fin=1.0, fout=2.0)      # gamelan lirih di kartu
place("fs-273805", t0("p01"), -26, dur=END - t0("p01"), fin=0.5, fout=2.0)
if JS:
    place("fs-149966", t0("j01"), -14, dur=3, fin=0.0, fout=1.2)                           # dentum teredam di layar hitam
