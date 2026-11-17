"""Spesifikasi klip motion-graphics Ep.1 (contoh). Dijalankan oleh templates/motion/buat_klip.py:
    cd <proyek>/motion && python buat_klip.py ../ep1 klip_ep1.py --video horor_ep1
Kunci CLIPS = kode scene di naskah (baris mg-only seperti "judul"/"bab1", atau scene shot yang harus jadi cutaway).
"""
CLIPS["judul"] = judul("judul", "THE SMILING MAN", "OF MAPLE HOLLOW")
for n, j in [(1, "THE WALK HOME"), (2, "THE MAN IN THE MASK"), (3, "THE HARBOR"), (4, "THE FROZEN POND"), (5, "THE PORCH")]:
    CLIPS[f"bab{n}"] = bab(f"bab{n}", n, j)
# pesan dari Mom: gelembung muncul saat narator membacanya (baris b17/b18)
CLIPS["hp_pesan"] = ponsel("hp_pesan", "Mom", "Today 11:38 PM", [
    (local("b17", 0.25), "Where are you two??", False),
    (at_word("b18", "The news"), "The news said a patient escaped from Ravenwood Hospital", False),
    (at_word("b18", "Do not"), "Do NOT walk home.", True),
])
# pesan dari nomor tak dikenal di akhir (baris e09), dengan titik-titik "mengetik"
CLIPS["hp_malam"] = ponsel("hp_malam", "Unknown", "Today 3:14 AM", [
    (local("e09", 0.75), "you dropped your flashlight.", False),
    (local("e09", 0.75) + 1.8, "i'll bring it back tonight :)", True),
], mengetik=(local("e09", 0.3), local("e09", 0.75) + 1.8), getar=local("e09", 0.12))
CLIPS["telp_911"] = telp911("telp_911")
CLIPS["berita"] = berita("berita", "MAPLE HOLLOW, VT · 6:12 AM", "Masked man vanishes beneath frozen pond",
                         "Police say the escaped Ravenwood patient has not been found. Residents urged to lock their doors.",
                         ["SEARCH CONTINUES", "DIVERS FIND AXE", "NO BODY RECOVERED", "RESIDENTS URGED TO LOCK DOORS"])
