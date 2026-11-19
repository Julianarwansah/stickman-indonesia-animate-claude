---
name: animasi-horor-kartun
description: Membuat video animasi horor kartun 3D lengkap sampai siap unggah — tokoh kartun kepala bulat (gaya stickman horor) di dunia 3D malam bersalju. Dua mode: (1) Horor USA, bahasa Inggris, Supertonic, 16:9 atau Shorts; (2) Serial Indonesia Shorts 9:16 — PETAKA GUNUNG (horor pendaki, multi-tokoh, ElevenLabs) dan KISAH NYATA NUSANTARA (kisah nyata, narator lokal Aplikasi TTS Cepat) dengan mesin adegan JSON, kartu pilihan A/B, caption per frasa sinkron (whisper), ciri khas tokoh, efek suara CC0, mixing, render berpotongan, QA, sampul dan teks unggah. Pakai setiap kali user minta episode baru serial-serial itu, animasi/video horor kartun, tokoh horor baru dengan bentuk badan sama, suara tokoh yang tidak datar, perbaikan subtitle/suara/video yang sudah dibuat, atau serial kisah nyata Indonesia bergaya animasi 3D — walau user tidak menyebut nama skill.
---

# Animasi horor kartun (pipeline Horor USA + Serial Indonesia)

**Dua mode.** (1) **Horor USA** — bahasa Inggris, Supertonic, koreografi di `story.ts` (isi file ini). (2) **Serial Indonesia** — Shorts 9:16 bahasa Indonesia, mesin data-driven `templates/remotion/serial_mesin` (adegan JSON), ElevenLabs atau Aplikasi TTS Cepat, caption sinkron whisper, format pilihan A/B. Untuk mode 2 baca **`references/serial-indonesia.md`** dulu; aturan bentuk tokoh di bawah tetap berlaku.

Skill ini membungkus pipeline yang sudah terbukti di **Horor USA Ep.1 "The Smiling Man of Maple Hollow"** (8:15, 1920x1080, YouTube, penonton AS). Semua kode ada di `templates/`, contoh lengkap Ep.1 di `examples/ep1/`. Episode baru = naskah baru + koreografi/kamera baru + isyarat efek suara baru; mesinnya tetap.

## Dua format
| Format | Untuk | Ukuran | Panjang | Keras |
|---|---|---|---|---|
| **Panjang 16:9** (default) | YouTube biasa | 1920x1080 | ±8 menit (batas iklan mid-roll) | -16 LUFS |
| **Potret 9:16** | YouTube Shorts, Instagram Reels, TikTok | 1080x1920 | 45–90 dtk (maks 3 menit Shorts/Reels) | -14 LUFS |
Pilih di `format.ts` folder video (`W`, `H`); kartu tokoh, tinta, lensa, salju, cap lokasi menyesuaikan sendiri, dan mode potret otomatis menampilkan **caption per kata** (kata aktif kuning, di atas zona tombol aplikasi). Motion-graphics: `buat_klip.py --potret`. Mixing: `mix.py --lufs -14`. Detail potret: bagian "Format potret" di bawah.

## Hasil akhir per episode
- `<proyek>/video/<ep>_<judul>.mp4` — 1920x1080 (atau 1080x1920 potret), 30 fps, H.264 + AAC 192k, keras -16 LUFS (potret -14), puncak di bawah -4 dBFS.
- `<proyek>/<ep>/<ep>_en.srt` — subtitle bahasa Inggris (diunggah sebagai CC).
- `<proyek>/<ep>/youtube.txt` — 3 pilihan judul, deskripsi, timestamp bab, hashtag (di deskripsi), tag (tanpa #), kredit suara.

## Aturan dari user (pegang ini, alasannya penting)
1. **Bentuk tokoh tetap** (ditegaskan lagi 18 Nov 2026: user suka bentuknya) (`templates/tokoh/tokoh.ts`): kepala bulat polos tanpa telinga, leher kecil panjang, badan kotak setinggi 1 kepala, lengan & kaki tabung, tangan bulat seperti sarung tangan, sepatu pipih, garis ungu tua tebal, kulit pucat, ±4,4 kepala. User menolak desain lain ("jelek", "jangan dirubah-rubah bentuknya"). Ganti hanya baju, warna, rambut, pose.
2. **Lengan menyambung ke tangan**: lengan baju pendek, kulit lengan langsung jadi tangan tanpa manset (lengan panjang + manset membuat tangan tampak terlepas).
3. **Latar = dunia 3D repo cartoon-3d-shorts** (rumah, pelabuhan, kolam beku, pinus) — "karakternya saja, latarnya tetap".
4. **Suara**: Supertonic 3 (bukan edge-tts/Kokoro). Narator **M5 terkunci**. Suara tokoh dipilih sesuai karakter dan **tidak boleh datar seperti AI** → intonasi per kalimat + emosi (lihat `references/suara-sfx.md`). Suara yang sudah dikunci tidak diaudisi ulang; tokoh baru diaudisi (2 calon, user memilih dengan telinga).
5. **Render panjang selalu dipecah** per 1 menit dan bisa dilanjutkan ("kalau prosesnya lama dibagi saja agar jika terbatal aman"). Render **menit pertama dulu**, kirim ke user, baru sisanya.
6. **Cepat jadi lebih penting dari sempurna**: satu putaran cek yang jujur, perbaiki yang jelas rusak.
7. Pesan ke user singkat, bahasa Indonesia. Isi video bahasa Inggris (penonton AS) — kecuali mode Serial Indonesia.
8. **Jangan render bila user bilang jangan** ("jangan lakukan render apapun"); cukup siapkan sampai stills/QA data. Render lama boleh dihentikan bila user minta ("kalau lama nanti saja").
9. **Serial Indonesia**: tiap episode diakhiri pilihan A/B — **hanya gimmick, tidak mengikuti komentar** (A = tamat — mis. belok kiri lalu tertabrak truk, selesai; B = lanjut — menghindari truk, selamat; **tidak pernah ditulis**). Episode berikutnya dibuka dengan DUA akibat yang dianimasikan (bukan teks): cabang A sampai tokoh mati + cap TAMAT, efek putar balik, lalu cabang B yang melanjutkan cerita (contoh: skill animasi-3d-semua-genre `examples/pemandi_jenazah_ep13/`). Suara/backsound WAJIB rekaman asli CC0 lewat `templates/serial_id/suara/rekaman.py` — bunyi sintetis bernada terdengar "kaya game pixel" (ditolak user); `horor_id.py` hanya cadangan. CTA halus ("jangan alay"), SFX cocok dengan tiap adegan, tokoh punya ciri khas lewat aksesori saja, hook ≤ 3 dtk + open loop, 45–55 dtk. Kisah nyata: hanya narator (tidak mengarang ucapan orang nyata), min. 2 sumber, tanpa jumpscare. **Pemeran & latar per cerita**: tiap cerita punya pemeran sendiri (`pemeran` di adegan JSON, lembar `dokumen/pemeran_epN.md`) kecuali tokoh utama serial yang dikunci; latar sesuai tempat & zaman (`hutan`, `tanah`, `desa`, `gunungApi`, set baru di `latar_id.ts`) — jangan memakai tempat yang salah.
10. **Tanpa bulatan kuning penanda** (ditolak user 19 Nov 2026): jangan memberi lingkaran/cincin kuning di sekitar benda atau tokoh; tunjukkan dengan push-in/zoom kamera, label, panah, atau cahaya. (`fxRing` di `horor_ep/toon.ts` = riak air tipis, bukan penanda.)
11. Kunci API (ElevenLabs dll.) hanya di `<proyek>/.env`; jangan pernah diulang di chat atau log.

## Peta skill
| File | Isi |
|---|---|
| `references/setup.md` | pasang sekali: repo Remotion, motion-graphics, Supertonic, ffmpeg, folder proyek |
| `references/tokoh.md` | API tokoh (Rupa/Gaya), pose, ekspresi, tampak belakang, bicara, cara bikin tokoh baru |
| `references/dunia-kamera.md` | peta koordinat dunia, preset malam/fajar, bulan, lampu, kamera `ms()`, koreografi, efek es/air |
| `references/suara-sfx.md` | Supertonic, suara & emosi, intonasi, timeline, katalog id efek suara, aturan mixing |
| `references/render-qa.md` | motion-graphics, render berpotongan, pengecekan, paket YouTube, foto profil |
| `templates/remotion/horor_ep/` | folder video Remotion lengkap (16:9, malam, salju, sirene, cap lokasi, sisipan mg) |
| `templates/tokoh/` | `tokoh.ts` (semua tokoh) + `lembar.ts` (lembar karakter untuk cek desain) |
| `templates/suara/` | `suara.py`, `buat_suara.py`, `audisi_tokoh.py`, `mix.py`, `srt.py` |
| `templates/motion/buat_klip.py` | judul, kartu bab, ponsel, 911, berita (mesin motion-broll) |
| `templates/render_ep.py` | render per potongan + sambung + pasang suara |
| `templates/render_potret.py` | render Shorts potret per potongan (`--frames`, `--bagian`, `--sambung`) |
| `templates/suara/samakan_durasi.py` | samakan durasi klip baru dengan timeline lama sebelum mux |
| `templates/branding/profil.ts` | foto profil kanal (topeng di depan bulan) |
| `scripts/lembar_kontak.py`, `scripts/qa_video.py` | lembar kontak per shot; pengecekan otomatis video jadi |
| `examples/ep1/` | `ep1.json` (naskah), `sfx_ep1.py` (isyarat efek suara), `klip_ep1.py` (motion-graphics), `youtube.txt` |
| `references/serial-indonesia.md` | **mode Serial Indonesia**: urutan wajib, naskah & A/B, suara (TTS Cepat / ElevenLabs), caption sinkron, skema adegan JSON, ciri khas tokoh, katalog SFX, render, unggah, jebakan |
| `templates/remotion/serial_mesin/` | mesin serial data-driven (adegan JSON, hook kuning, stempel, letusan/gas, HP berisi foto, kartu A/B + CTA, caption frasa, tokoh beraksesori) |
| `templates/serial_id/` | `suara/suara_tts_cepat.py`, `suara/suara_elevenlabs.py` + `elevenlabs.py`, `suara/kata.py` (waktu kata whisper), `suara/mix.py`, `suara/sfx_umum_horor.py`, `suara/sfx_umum_kisah.py`, `mk_ep.sh`, `render_ep.sh`, `kontak.py` |
| `templates/serial_id/sampul/` | `sampul.ts` — sampul Shorts yang memancing klik, digambar dengan tokoh yang sama (tanpa render); resep di `references/serial-indonesia.md` |
| `examples/serial_id/` | `petaka_gunung_ep2/` (horor multi-tokoh, jumpscare, A/B) dan `kisah_nyata_ep13/` (narator, letusan, stempel, deskripsi unggah) |

## Alur kerja

### 0. Setup (sekali per komputer)
Ikuti `references/setup.md`. Lokasi diatur lewat variabel lingkungan (tabel di setup.md): `REMO_DIR` (proyek Remotion), `CHROME_PATH` (opsional), dan `SUARA_PY` (python venv Supertonic). Tidak ada path komputer yang ditulis di skrip.

### 1. Naskah (`<proyek>/naskah/<ep>.json`)
Format = `examples/ep1/ep1.json`: daftar `baris` berisi `id`, `scene`, `who` (narator/jake/emily/miller/psiko/operator/null), `emo` (netral, senang, takut, teriak, sedih, seram, bisik, marah), `text`, opsional `jeda` (detik hening sesudahnya untuk aksi/suasana), `mg` (sisipan), `dur` (untuk baris tanpa teks).
- **Panjang**: Ep.1 = 97 baris, ±980 kata + jeda aksi ≈ 8,2 menit. Supertonic membaca ±17 % lebih cepat dari perkiraan `--perkiraan` (2,3 kata/dtk). Untuk 8 menit (batas iklan mid-roll YouTube) siapkan ±1000 kata.
- **Struktur yang berhasil**: cold open 3 baris → kartu judul (`scene: "judul"`, `mg`, `dur: 5`) → 5 bab, tiap bab diawali kartu (`scene: "babN"`, `dur: 3`) → ketegangan naik → twist/penutup dingin (pesan dari nomor tak dikenal, "lock your doors").
- Narator menggerakkan cerita; dialog pendek dan hidup; tanda baca (`...`, `!`, `?`) memberi intonasi. Satu baris berurutan dengan `scene` sama = satu shot.
- Fiksi orisinal: jangan menyalin tokoh/penjahat film terkenal; kekerasan kartun tanpa darah.
- Tunjukkan ringkasan naskah ke user dalam bahasa Indonesia, lalu lanjut kecuali user minta meninjau.

### 2. Suara → timeline
```
$SUARA_PY templates/suara/buat_suara.py naskah/<ep>.json <ep>
```
Hasil: `<ep>/vo/*.wav`, `<ep>/timeline.json` (frame mulai/selesai tiap baris + bukaan mulut per frame), `<ep>/suara_vo.wav`. Ada 1,5 dtk pembuka (angin) sebelum baris pertama. Cek total menit yang dicetak; kurang/lebih → ubah naskah/jeda dan jalankan lagi (baris yang sama diambil dari cache). Tokoh baru: tambahkan di `TOKOH` (`suara.py`) dan audisi dengan `audisi_tokoh.py`.

### 3. Visual (Remotion)
1. Salin `templates/remotion/horor_ep` ke `<remotion>/src/videos/<ep_video>/`, salin `<ep>/timeline.json` ke sana, ganti nama export (`HororEp1`, `EP1_FRAMES`) dan daftarkan di `src/Root.tsx` (1920x1080, 30 fps) — lihat `references/setup.md`.
2. Tulis ulang **koreografi** (`kid`, `psiko`, `miller` di `story.ts`: posisi per detik per bab, dikaitkan ke baris lewat `T0("id")`) dan **`SCENES`** (satu kamera per kode scene). Peta koordinat & resep kamera: `references/dunia-kamera.md`.
3. Wajah dasar & lengan per bab ada di `cast.ts` (`baseFace`, `armsFor`); yang bicara otomatis memakai emosi barisnya dan mulut bergerak.
4. Cek: `python scripts/lembar_kontak.py stills <timeline> <CompId> out/<ep>` di folder Remotion → buka `kontak_*.jpg` dengan Read, periksa **setiap** shot (lihat daftar periksa di `references/dunia-kamera.md`). Perbaiki → ulang sekali.

### 4. Motion-graphics
`cd <proyek>/motion && python <skill>/templates/motion/buat_klip.py ../<ep> <spek>.py --video <ep_video>` (spek contoh `examples/ep1/klip_ep1.py`). Cek dulu dengan `--html` + `node engine/beats.js` (lihat `references/render-qa.md`).

### 5. Efek suara & mixing
Tulis isyarat efek (`examples/ep1/sfx_ep1.py` sebagai pola), lalu `python templates/suara/mix.py <ep> <isyarat>.py` → `<ep>/mix.wav`. Target -16 LUFS, puncak ≈ -4,4 dBFS (sudah otomatis). Katalog id efek yang bagus: `references/suara-sfx.md`.

### 6. Render, cek, kirim
1. `python templates/render_ep.py <ep> <CompId> video/<nama>.mp4 --bagian=0` → menit pertama; pasang suara 60 dtk dan kirim file ke user.
2. User setuju → `python templates/render_ep.py <ep> <CompId> video/<nama>.mp4` (jalankan di latar belakang; ±6–7 menit per potongan di laptop user).
3. `python scripts/qa_video.py video/<nama>.mp4 <ep>/timeline.json` + `lembar_kontak.py video ...` → baca hasilnya sendiri; layar hitam/diam yang wajar ada di `references/render-qa.md`.
4. `python templates/suara/srt.py <ep>`, tulis `youtube.txt` (pola `examples/ep1/youtube.txt`), kirim video + laporan pengecekan singkat.

## Mode Serial Indonesia (ringkas — detail di `references/serial-indonesia.md`)
```
$SUARA_PY suara/suara_tts_cepat.py naskah/epN.json epN   # atau suara_elevenlabs.py
$SUARA_PY suara/kata.py epN                              # WAJIB sesudah suara (waktu kata caption)
$SUARA_PY suara/mix.py epN epN/sfx_epN.py --lufs -14
./mk_ep.sh N                                              # REMO_DIR, SERI, COMP
npx remotion still src/<seri>-index.ts <COMP>N out/x.jpg --frame=F --gl=angle   # cek
./render_ep.sh N                                          # hanya bila user setuju; KN_CONC=2 bila gagal
```
Episode baru = `naskah/epN.json` + `adegan/epN.json` + `epN/sfx_epN.py`; mesin tidak diubah. **Sampul**: `templates/serial_id/sampul/sampul.ts` (wajah besar beremosi, ancaman sebagian + lingkaran merah, teks 2–4 kata) — bukan frame video.

## Format potret (Shorts / Reels / TikTok)
- **Naskah**: 120–220 kata, satu ketegangan saja; hook di 2 detik pertama (kalimat paling seram dulu, mis. "He only follows you if you look at him."), tanpa kartu judul 5 dtk (cukup 1,5 dtk atau langsung adegan), bab dihapus atau 1 kartu; akhir menggantung → ajakan "Part 2". Bisa juga memotong episode panjang jadi 3–4 Shorts (cerita yang sama, naskah dipadatkan).
- **Video**: salin template, set `format.ts` ke `W = 1080; H = 1920`, daftarkan Composition `width={1080} height={1920}`. Bingkai lebih sempit (FOV horizontal ±23°): satu tokoh per shot atau dua tokoh rapat (≤ 1 m), MCU `dist 2.6–3.2`, lebar `dist 7–10`; jaga wajah di sepertiga atas–tengah karena caption di ±26 % dari bawah dan tombol aplikasi di kanan & bawah.
- **Motion-graphics**: `python buat_klip.py ... --potret` (ponsel memenuhi layar tegak; judul/berita diperkecil supaya muat lebar 1080).
- **Suara & mix**: sama; `python mix.py <ep> <isyarat> --lufs -14`.
- **Render**: `render_ep.py` sama (90 dtk = 2 potongan). Cek dengan `qa_video.py` (rentang keras -15..-13 untuk potret dapat diabaikan) dan `lembar_kontak.py` (otomatis tegak).
- **Unggah**: judul ≤ 60 huruf + `#shorts` di deskripsi; caption sudah di video; untuk TikTok/IG tambah 3–5 hashtag (#horror #scarystory #animation #creepy #horrortok).

## Jebakan yang sudah pernah terjadi
| Gejala | Penyebab | Perbaikan |
|---|---|---|
| Rumah hilang di banyak shot | garis pandang pemotong objek terlalu lebar (16:9) | `world.ts` `sightLines`: `tx = ty * 0.45` (sudah di template); titik `look` jangan di dalam rumah |
| Tokoh tak terlihat | kartu berdiri di dalam peti/rumah, atau kamera menempel objek | geser tokoh ke luar kotak; kamera ≥ 1 m dari objek dan lebih tinggi dari objek |
| Tokoh menabrak kamera | kamera diam, tokoh lari 3,4 m/dtk | kamera ikut mundur (`p.x - v*c.t`) |
| Latar kosong saat dialog | tokoh dimulai di luar deretan rumah (x > 62) | atur koreografi: berhenti mengobrol di depan rumah |
| Jempol hitam / tangan berlubang | `fill("nonzero")` bentuk berlawanan arah | `celMulti` isi per bentuk (sudah di template) |
| Jempol ke atas mirip jari tengah | jempol di tengah kepalan | jempol di sisi + garis jari (sudah di template) |
| Suara teriak terpotong | volume +dB sebelum limiter | `loudnorm` per baris → dB emosi → `alimiter` (sudah) |
| Supertonic menolak speed < 0.7 | batas model | sisa perlambatan lewat `rubberband tempo` (sudah) |
| Render "GAGAL" padahal lengkap | ffprobe mencetak `1800,` | parser membuang koma (sudah) |
| `--scale 1.3333` error 2559.9 px | pembulatan | pakai `1.3333333333333333` (vertikal 2K) |
| Fajar oranye menyala | preset golden template | `lights.ts` golden = fajar pucat (sudah) |
| `npm ci` gagal di repo | lock file tidak sinkron | pakai `npm install` |
| Caption potret keluar layar | kata dipisah margin, tidak bisa pindah baris | spasi sungguhan di antara kata (sudah) |
| `beats.js` potret setengah putih | viewport tetap 1920x1080 | patch viewport mengikuti `#stage` (lihat setup.md) |
| Suara perempuan terdengar robot | vibrato emosi `takut` terlalu dalam (0,18) | `vibrato=f=6.5:d=0.05` di `suara.py` (sudah) |
| Video bergeser setelah suara diubah | durasi klip berubah, timeline lama dipakai video | `samakan_durasi.py` lalu `buat_suara.py` (lihat `references/suara-sfx.md`) |
| Mix Shorts hanya -16 LUFS | true peak -4,5 dBTP membatasi `loudnorm` | `TP=-1.0` dan `alimiter=0.89` (sudah di `mix.py`) |
| Render batch hilang diam-diam | proses dimulai dari shell panggilan | `Start-Process` di PowerShell; cek proses ganda dulu |
| Still gagal "Webpack configuration schema" | `scripts/stills.mjs` di Node 24 | `npx remotion still ... --gl=angle` |
| Psikopat tidak terlihat | tiang kanopi di antara kamera dan tokoh | kamera ke sisi kosong; cek still |
| Subtitle "aneh" (loncat, tidak sinkron) | jendela 5 kata bergeser + waktu tebakan huruf | `kata.py` + halaman frasa tetap di `serial_mesin` |
| Caption memotong nama/tanggal, kuning berkedip, menutupi wajah | potong buta 3 kata, kuning = kata aktif | `caption.ts` (unit makna) + kuning kata kunci + `capPos` |
| Klip TTS Cepat diawali 1 dtk hening | bawaan engine | `TRIM` silenceremove RMS -35 dB di `suara_tts_cepat.py` |
| Render potret keluar separuh | Chrome kehabisan memori | `KN_CONC=2`; `render_ep.sh` berhenti bila potongan hilang |
| Tokoh-tokoh tampak kembar | rupa hanya beda warna | aksesori `topi`/`sanggul`/`selendang`/`ransel`/`kumis`/`jenggot`/`dasi` (serial_mesin) |
| Latar tidak cocok cerita Indonesia | dunia hanya rumah barat + pinus | `latar_id.ts` (gunung api, pura, rumah kayu, sawah) + `desa`/`gunungApi` di ep.json |
| Tokoh berdiri kaku satu shot penuh | tidak ada akting otomatis | `akting.ts`: gerak sesuai emosi, menoleh ke pembicara, tersentak + kamera punch-in/guncang/ikut pembicara |
| "Kurang serem" / benda mirip mainan di video 3D | warna hangat, sosok guntingan putih, kain/api/tangan kartun | `references/horor-seram.md` skill animasi-3d-semua-genre (grade horor, siluet, satu momen kaget) |
| Lebih banyak jebakan serial Indonesia | | tabel di `references/serial-indonesia.md` |
