# Motion-graphics, render, pengecekan, paket YouTube

## Motion-graphics (`templates/motion/buat_klip.py`, mesin motion-broll)
Satu bentuk yang terus berubah (pil → kartu), pegas halus, tanpa kursor. Gaya horor: latar `#07080c`, kartu `#101117`, teks `#f2efe8`, abu `#8a8d99`, aksen merah `#c8323a`.
Fungsi untuk file spek: `judul(scene, besar, sub)`, `bab(scene, n, judul)`, `ponsel(scene, pengirim, jam, [(detik, teks, merah?)], mengetik=(a,b), getar=detik)`, `telp911(scene)`, `berita(scene, tempat_jam, judul, isi, [ticker])`; waktu: `dur(scene)`, `local(id, frac)`, `at_word(id, kata)` (gelembung muncul tepat saat narator membacanya).
Cek sebelum render: `python buat_klip.py ... --html` lalu `NODE_PATH=node_modules node engine/beats.js dist/<klip>.html work/<klip>.png 0.5 3 8` → Read PNG. Masalah yang pernah ada: gelembung terlalu sempit (pakai `width:max-content`), judul bab panjang menyentuh tepi (lebar kartu dihitung dari panjang judul — sudah).
Di video: `mg.json` (scene → file) dibaca `Bridge.tsx`; klip menutupi shot scene itu layar penuh. Scene yang muncul di beberapa shot (911) melanjutkan klip dari posisi terakhir. Cap lokasi (`"mg": "cap:Teks"` di baris) digambar Remotion sendiri (mesin ketik kiri bawah).

## Render berpotongan (`templates/render_ep.py`)
```
python render_ep.py <ep> <CompId> video/<nama>.mp4 --bagian=0      # menit pertama dulu
ffmpeg -i video/<ep>_parts/part_00.mp4 -i <ep>/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 60 video/<ep>_menit1_cek.mp4
python render_ep.py <ep> <CompId> video/<nama>.mp4                 # sisanya (lewati yang sudah ada) + sambung + suara
```
Jalankan di latar belakang. Laptop user: ±6–7 menit per potongan 1800 frame (1080p, concurrency 3); 8 menit video ≈ 55 menit. Terhenti → jalankan lagi. Menghentikan render di tengah: matikan hanya proses node yang command line-nya berisi `--frames=<a>-` (taskkill /T), bukan semua node.

## Pengecekan (wajib sebelum kirim; user meminta Claude yang mengecek)
1. `python scripts/qa_video.py video/<nama>.mp4 <ep>/timeline.json` → harus LULUS (frame = timeline, ada suara, -17..-15 LUFS, puncak ≤ -3,5 dBFS).
   Wajar: "hitam" di scene `hitam` & sisipan ponsel/911/berita (latar gelap); "diam" di kartu judul/bab tertahan, sisipan, close-up dialog dengan kamera diam (salju & mulut tetap bergerak). Hitam/diam di scene lain = cari penyebabnya.
2. `python scripts/lembar_kontak.py video <ep>/timeline.json video/<nama>.mp4 video/cek` → Read `kontak_*.jpg`, periksa tiap shot + semua sisipan muncul di tempatnya.
3. Laporkan singkat ke user: durasi, frame, keras suara, hitam/diam yang wajar, hal yang tidak bisa dicek (suara tidak bisa didengar Claude — sebutkan 2–3 titik waktu untuk didengar).

## Paket YouTube (`<ep>/youtube.txt`, pola `examples/ep1/youtube.txt`)
- 3 pilihan judul (≤ 70 huruf, pola "<Judul cerita> | Animated Horror Story", hook "He Only Follows You If You Look At Him").
- Deskripsi 2–3 kalimat pembuka tanpa membocorkan akhir + "An original animated horror story. All characters and events are fictional."
- Bab: `0:00 Cold Open` lalu waktu mulai `k1..k5` dari timeline (`start/30`).
- Hashtag **di deskripsi** (3–5; tiga pertama tampil di atas judul; > 15 diabaikan YouTube): `#horrorstory #animatedhorror #scarystories ...`. Kolom **Tags** tanpa `#`, dipisah koma. Judul tanpa hashtag.
- Subtitle: `python srt.py <ep>` → unggah sebagai English (CC).
- Kredit suara (CC0, tidak wajib tapi bukti sumber). Bagian huruf kapital ("TITLE OPTIONS", "TAGS", ...) hanya petunjuk, tidak ditempel.
- Nama kanal yang diusulkan: "Maple Hollow Stories" (semesta satu kota), alternatif "Lock Your Doors", "Porchlight Horror", "Small Town Screams". Hindari nama yang mirip film ("Elm Street").

## Paket Shorts / Reels / TikTok (format potret)
- Judul ≤ 60 huruf, kalimat hook ("He only follows you if you look at him 😱" tanpa emoji kalau ragu), `#shorts` di deskripsi YouTube.
- TikTok/IG: caption 1–2 kalimat + 3–5 hashtag (#horror #scarystory #animation #creepy #horrortok); musik/efek sudah di video.
- Keras -14 LUFS (`mix.py --lufs -14`); caption per kata sudah tertanam (penonton tanpa suara).
- Thumbnail/cover: frame close-up topeng atau wajah ketakutan, dipilih dari lembar kontak.

## Foto profil (`templates/branding/profil.ts`)
Topeng The Smiling Man di depan bulan purnama, salju, siluet pinus. Build seperti lembar karakter (esbuild → HTML → Chrome headless `--window-size=1600,1600 --hide-scrollbars`), lalu Pillow ke 1024 & 800 px. Cek dalam potongan bulat (ukuran 400/176/88/40 px): topeng harus tetap terbaca; jangan taruh detail kecil di tepi (terpotong lingkaran).

## Render Shorts (potret): proses & jebakan (2026-11)
- Jalankan batch render sebagai proses terpisah (`Start-Process` di PowerShell, jendela tersembunyi). Proses yang dimulai dari shell panggilan (`nohup`, `&`) mati saat panggilan shell selesai.
- Sebelum memulai, cek proses lama: `Get-CimInstance Win32_Process` untuk `render_short|remotion`. Dua rantai render yang menulis `_tmp_NN.mp4` yang sama merusak potongan dan membuang CPU.
- Still: `npx remotion still src/index.ts <Comp> <out.png> --frame=N --scale=0.5 --gl=angle --browser-executable=<chrome>`. `scripts/stills.mjs` gagal dengan "Webpack configuration schema" di Node 24.
- Uji 30 frame dulu (`render_potret.py <n> --frames=0-29`), lalu cek satu frame penuh sebelum batch.
- Audio saja berubah: `render_potret.py <n> --sambung` (video tetap, audio dipasang ulang).
- Mulai batch baru di belakang proses yang sudah jalan: tunggu sampai log `SEMUA SELESAI` lebih dulu.
