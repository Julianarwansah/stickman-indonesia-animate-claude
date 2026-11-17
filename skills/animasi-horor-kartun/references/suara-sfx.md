# Suara (Supertonic 3) dan efek suara

## Suara tokoh (`templates/suara/suara.py`)
Supertonic 3 punya 10 suara bawaan. Nada dasar terukur (median F0): M1 126 Hz (pria paling tinggi), M2 87, M3 97, M4 115, M5 85 (paling berat); F1 188, F2 190 (paling ekspresif, rentang 161–259), F3 159, F4 188 (sempit), F5 159 (tenang).

Pemetaan terkunci (`TOKOH`):
| Tokoh | Suara | Nada | Tempo |
|---|---|---|---|
| narator | **M5 (dipilih user)** | 0 | 0,90 |
| jake | M1 | +1,5 st | 1,02 |
| emily | F2 | +1 st | 1,03 |
| miller | M4 | -2 st | 0,90 |
| psiko | M2 | -3,5 st | 0,85 |
| operator | F5 | 0 | 1,0 |

Emosi (`EMOSI`: nada, tempo, dB, efek): netral 0/1,0; senang +1,5/1,07/+1 dB; takut +2/1,12/vibrato 6,5 Hz **kedalaman 0,05** (0,18 terdengar seperti robot pada suara perempuan, dicoba 2026-11-17); teriak +3,5/1,18/+5 dB/kompresor; sedih -1,2/0,86/-2 dB; seram -2/0,84/lowpass; bisik -3/0,80/-5 dB/EQ tipis; marah -0,5/1,05/+3 dB.

**Anti-datar** (permintaan user "ada nadanya, tidak datar seperti AI"): tiap baris dipecah per kalimat, tiap kalimat disintesis sendiri dengan nada/tempo sendiri — tanya +0,9 st, seru +0,6 st & 1,04x, kalimat terakhir -0,7 st & 0,95x (penutup dramatis), kalimat ≤ 3 kata 0,92x + jeda 0,42 dtk, `...` 0,95x + jeda 0,5 dtk, kalimat berurutan selang-seling +0,45/-0,25 st. Lalu tiap baris: `loudnorm -19 LUFS` → dB emosi → `alimiter 0,89` (tidak pernah terpotong). Nada & tempo digeser dengan ffmpeg `rubberband` (formant dijaga). Tempo < 0,7 (batas Supertonic) disintesis di 0,7 lalu diperlambat rubberband.

Menulis untuk TTS: angka ditulis huruf ("nine-one-one", "eleven forty-seven p.m."), tanda baca untuk jeda, kalimat pendek untuk ketegangan, huruf kapital tidak dibaca lebih keras (pakai emosi `teriak`).

## Audisi (hanya tokoh baru)
`audisi_tokoh.py`: isi `CALON` (2 calon per tokoh: voice + nada + tempo) dan `BARIS` (3–4 contoh beda emosi), jalankan dengan venv_supertonic → `audisi_tokoh.mp3` (label dibacakan narator). Kirim ke user, biarkan user memilih dengan telinga, masukkan pilihan ke `TOKOH`.

## Timeline (`buat_suara.py`)
`python buat_suara.py naskah/<ep>.json <ep> [--perkiraan]`. Baris mulai 1,5 dtk sesudah awal video, berikutnya 0,35 dtk sesudah baris sebelumnya + `jeda`. Cache per baris (teks + tokoh + emosi + pengaturan) — ganti satu tokoh hanya membuat ulang barisnya. Hapus `<ep>/vo/_cache.json` kalau rantai pemrosesan suara diubah. `mulut` per frame = energi suara ternormalisasi, dipakai untuk gerak bibir.

## Efek suara (Lots of Sounds, CC0) — katalog yang sudah dipakai & bagus
| Id | Nama | Dipakai untuk |
|---|---|---|
| fs-117513 | Howling Winter Wind (392 dtk) | dasar suasana seluruh video (bus_amb, -27 dB) |
| fs-141139 | Low Pitched Scary Drone | dengung ketegangan per bab (-30 dB, loop) |
| fs-135433 | Creepy Horror Ambience | lapisan saat penjahat terlihat |
| fs-443015 | Walking in Snow | langkah berjalan (loop -25 dB) |
| fs-348248 | Snow Crunch Footsteps | lari (tempo 1,75); langkah berat penjahat (st -5, tempo 0,8) |
| fs-578493 | Dragging Body Concrete | kapak diseret |
| fs-553075 | Light Buzz | dengung lampu jalan |
| fs-271945 | Horror Stinger Stab | topeng terlihat, "Found you" |
| fs-513330 | Horror Stinger Reveal | penutup episode |
| fs-578358 | Dissonant Piano Sting | "Crack." |
| fs-177242 | Cinematic Impact Boom | kartu judul |
| fs-21409 | Deep Heartbeat | detak jantung saat bersembunyi |
| fs-163383 | Heavy Male Breathing | napas terengah / napas di balik topeng (st -5) |
| fs-384485 | Phone Vibrating On Table | ponsel bergetar |
| fs-328243 | Message Notification Sound | tiap gelembung pesan muncul |
| fs-339950 | Phone Dial Tones | menekan 911 |
| fs-794610 / fs-175205 | Creaky Wood Footsteps / Scary Wood Creaking | dermaga kayu |
| fs-735401 / fs-522884 | Ice Cracking Sound / Organic | es retak |
| fs-9508 | Water Splash | jatuh ke air |
| fs-173439 | Underwater Bubbles Loop | gelembung |
| fs-52906 | Police Siren Loop | sirene |
| fs-168650 | Creaky Door | pintu |
| fs-465697 / fs-164202 | Owl Hooting / Coyotes Howling | suasana malam jauh |
Kit CC0 skill sound-effects: `whoosh.ogg` (kartu), `impact.ogg` (kartu bab, "Run!"), `riser.ogg` (judul).
Cari yang lain: `curl -G https://api.lotsofsounds.com/api/v1/sounds/sample --data-urlencode "q=<kata>" --data-urlencode limit=12` (maks 12 hasil, kata kunci umum lebih berhasil: "splash" gagal, "falling into water" berhasil).

## Aturan mixing (`mix.py` + isyarat per episode)
- Efek suara harus rekaman asli (aturan skill sound-effects), tidak disintesis.
- Suasana di `bus_amb` turun 5 dB saat ada dialog; efek turun 2 dB.
- Pasang efek di kata kuncinya dengan `word(id, "kata")` atau posisi `t0(id, frac)`.
- Hasil: `loudnorm I=-16 TP=-4.5` + limiter → terukur -16,5 LUFS, puncak -4,4 dBFS di MP4 akhir.

## Sinkron setelah ubah suara (wajib)
Mengubah emosi atau efek suara mengubah durasi klip, lalu timeline dan video yang sudah dirender tidak sinkron (Short 4 bergeser 0,3 dtk). Urutan yang aman:
1. Simpan `timeline.json` lama (atau salin `<proyek_video>/timeline.json` yang dipakai Remotion).
2. Jalankan `buat_suara.py` untuk baris yang berubah.
3. `python templates/suara/samakan_durasi.py <ep> <timeline_lama.json> <naskah.json>` — memotong/memberi hening baris yang berubah sampai durasinya sama dengan yang lama.
4. Jalankan `buat_suara.py` sekali lagi, cek `total` sama dengan lama, lalu `mix.py` dan `render_potret.py <ep> --sambung` (pasang audio tanpa render ulang video).

## Loudness -14 LUFS (Shorts)
`mix.py` memakai `loudnorm TP=-1.0` dan `alimiter 0,89`. Dengan batas true peak -4,5 dBTP, hasilnya hanya -16 LUFS (tidak tercapai). Dengan -1 dBTP, mix Shorts mencapai -14,2 sampai -14,5 LUFS. Target -15 atau lebih rendah pada Shorts tidak perlu batas ini.

## Katalog id tambahan (dari `examples/ep1/sfx_ep1.py`, dipakai di Shorts 2026-11)
| Id | Bunyi | Dipakai untuk |
|---|---|---|
| fs-164202 | coyote | suara jauh di malam |
| fs-163383 | napas | bersembunyi, ngos-ngosan |
| fs-168650 | pintu berderit | pintu dibuka |
| fs-173439 | gelembung | air di bawah es |
| fs-175205 | kayu berderit | dermaga, kapal |
| fs-177242 | hentakan judul | awal video |
| fs-21409 | detak jantung | ketegangan |
| fs-271945 | stinger | penampakan topeng, kata kunci |
| fs-328243 | bunyi notifikasi ponsel | pesan masuk |
| fs-339950 | tekan tombol 9-1-1 | panggilan darurat |
| fs-384485 | ponsel bergetar | getar ponsel, telepon berdering (dua kali) |
| fs-465697 | burung hantu | malam di luar kota |
| fs-522884 | es pecah besar | retak keras |
| fs-52906 | sirene | suasana polisi |
| fs-578358 | dentuman / ketukan | ketukan pintu, ketukan es |
| fs-735401 | es retak | retak kecil |
| fs-794610 | lari di papan kayu | lari di dermaga |
| fs-9508 | cipratan air | jatuh ke air |
Id di `sfx_cache/` hanya angka. Nama didapat dari komentar `sfx_ep1.py` di repo ini; API Lots of Sounds untuk metadata butuh API key.
