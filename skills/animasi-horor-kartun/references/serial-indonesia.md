# Mode Serial Indonesia (Shorts/Reels 9:16, bahasa Indonesia)

Pipeline yang terbukti di **PETAKA GUNUNG** (21 episode horor fiksi, multi-tokoh, ElevenLabs) dan **KISAH NYATA NUSANTARA Ep.11–15**
(kisah nyata, narator saja, Aplikasi TTS Cepat lokal). Bentuk tokoh, dunia 3D, dan gaya toon sama dengan mode Horor USA; yang berbeda:
naskah bahasa Indonesia, mesin **data-driven** (adegan ditulis di JSON, bukan koreografi TypeScript per episode), format serial A/B,
dan caption per frasa dengan waktu kata dari suara asli.

## Susunan proyek
```
<proyek>/
  naskah/epN.json        baris naskah (lihat di bawah)
  adegan/epN.json        tokoh berkeyframe + kamera per scene + efek (contoh: examples/serial_id/*/adegan_*.json)
  suara/                 suara_*.py, kata.py, mix.py, sfx_umum.py, sfx_cache/, suara_11labs.json (bila ElevenLabs)
  epN/                   vo/, timeline.json, suara_vo.wav, sfx_epN.py, mix.wav
  mk_ep.sh, render_ep.sh, kontak.py      (dari templates/serial_id/)
  video/  sampul/  dokumen/              hasil, sampul, DESKRIPSI_EPN.md
$REMO_DIR/src/videos/<seri>_mesin/       salinan templates/remotion/serial_mesin (sekali per serial)
```
Variabel: `REMO_DIR`, `SERI` (awalan pendek, mis. `pg`/`kn`), `COMP` (awalan id Composition), `NAMA` (awalan nama file video),
`SUARA_PY` (python venv dengan numpy + faster-whisper + Pillow), `TTS_URL`/`TTS_VOICE` (TTS Cepat), `CHROME_PATH`, `KN_CONC`.

## Urutan wajib (jangan ditukar)
```
$SUARA_PY suara/suara_tts_cepat.py naskah/epN.json epN     # atau suara_elevenlabs.py (multi-tokoh)
$SUARA_PY suara/kata.py epN                                # waktu kata dari whisper -> timeline (SESUDAH suara: suara menulis ulang timeline)
$SUARA_PY suara/mix.py epN epN/sfx_epN.py --lufs -14
./mk_ep.sh N                                                # salin mesin -> <seri>_epN, daftar di <Seri>Root.tsx
npx remotion still src/<seri>-index.ts <COMP>N out/x.jpg --frame=F --gl=angle --browser-executable="$CHROME_PATH"   # cek beberapa frame
./render_ep.sh N                                            # 2 potongan + sambung + mix.wav + QA cepat
```
Render hanya setelah user setuju. Bila user bilang "jangan render", berhenti di stills (atau sebelum itu).

## Naskah (`naskah/epN.json`)
`{"judul", "baris": [{id, scene, who?, emo?, text|null, ucap?, k?, jeda?, dur?, mg?}]}`
- `who`/`emo` hanya untuk multi-tokoh (ElevenLabs). Narator saja: tidak perlu.
- `ucap` = ejaan khusus TTS (caption tetap memakai `text`), mis. angka/nama yang salah dibaca.
- `k` = kunci tokoh di adegan yang bicara (mulut bergerak).
- `mg`: `cap:Lokasi — jam` (cap lokasi), `stempel:Tempat · tahun` (stempel KISAH NYATA di akhir kisah).
- Id khusus yang dikenali mesin & sfx: `j01` (jumpscare / layar hitam), `p01` (kartu pilihan A/B), `p02` (ajakan subscribe, tombol CTA muncul), scene `hook`, `stempel`, `pilihan`.
- **Panjang**: 45–55 dtk (saran analitik YouTube). ±110–130 kata dengan narator TTS Cepat; ±1 dtk lebih panjang per baris kalau hening tidak dipotong.

### Struktur yang berhasil (analitik YouTube)
1. **Hook ≤ 3 dtk**: kalimat paling mengejutkan dulu (scene `hook`, kotak kuning `hook` di adegan).
2. **Open loop**: janjikan jawaban yang baru dibuka di akhir ("...dan gunungnya meletus tepat di tengahnya").
3. Isi 5–7 baris pendek, satu ketegangan; angka/tahun disebut jelas (kisah nyata: min. 2 sumber, tulis di `dokumen/riset_epN.md`).
4. Kisah nyata: stempel `KISAH NYATA` + tempat & tahun. Fiksi: twist/jumpscare `j01`.
5. Kartu pilihan A/B (`p01`) lalu CTA subscribe yang dikaitkan rasa penasaran (`p02`).
   **Kartu maks 6–8 dtk** (dulu ±15 dtk = seperempat video, penonton pergi): `p01` = "Kamu pilih mana? A... X. B... Y." (tanpa "tulis A atau B di komentar"
   — tulisan itu sudah ada di kartu), `p02` satu kalimat pendek, `jeda` p02 ≤ 1,0. Mesin: adegan 3D shot sebelumnya tetap terlihat samar di balik kartu,
   kotak A/B meluncur masuk saat hurufnya disebut, bilah waktu kuning berjalan.

### Format pilihan A/B (aturan user)
- Tiap episode diakhiri kartu "APA PILIHANMU?" / "KAMU PILIH MANA?" dengan A dan B; penonton menulis A/B di komentar.
- Rahasia penulisan: **A = cerita tamat, B = cerita berlanjut**. Kartu dan narasi **tidak boleh** menyebut tamat/lanjut —
  cukup "Jawabannya... di episode berikutnya."
- Episode berikutnya dibuka dengan **animasi** hasil pilihan terbanyak ("Kebanyakan dari kalian memilih B..."), bukan teks.
- Episode boleh dibuat lebih dulu mengikuti jalur B; kalau voting dimenangkan A, episode sesudahnya dibuat ulang.
- Kisah nyata: A/B = "kalau kamu di sana, pilih mana?" (tidak mengubah sejarah).

### CTA (aturan user: "jangan alay")
- Satu ajakan halus di akhir, dikaitkan rasa penasaran: "Kisah nyata mana yang ingin kamu tahu selanjutnya? Subscribe, dan tulis di komentar."
- Tanpa "SMASH LIKE", tanpa emoji berlebihan, tanpa memohon. Tombol CTA kecil muncul saat `p02`.

## Suara
| Pilihan | Untuk | Skrip | Catatan |
|---|---|---|---|
| **Aplikasi TTS Cepat** (lokal, gratis) | narator saja, kisah nyata | `suara_tts_cepat.py` | engine Laras `:8180`, `POST /tts {text, voice, takes}` → WAV 24 kHz + header `x-wer`; voice narator `bara/netral.wav`, `takes=3` |
| **ElevenLabs** `eleven_multilingual_v2` | multi-tokoh horor | `suara_elevenlabs.py` + `elevenlabs.py` | suara terkunci di `suara/suara_11labs.json`; emosi → stability/style; `sosok` diberi gema + nada turun; kunci di `<proyek>/.env` |
- User **menolak pocket-tts** ("robot") untuk serial ini. Supertonic hanya untuk mode Inggris.
- TTS Cepat: praproses wajib `...` → `,` (di akhir → `.`), `!` → `.`, `—` → `,` (sudah di `siapkan()`).
- TTS Cepat menaruh **±1 dtk hening di awal tiap klip** → dipotong `TRIM` (silenceremove **RMS -35 dB**; -45 dB peak tidak jalan karena ada klik -39 dB). Versi olahan dicatat `VER`; ganti `VER` = olah ulang dari `vo/raw` tanpa memanggil TTS lagi.
- Nama berurutan ("Gie dan Idhan") bisa membuat engine mengulang kata → tulis ulang kalimatnya (`ucap` tidak selalu menolong).
- Cek tiap baris dengan faster-whisper (transkrip) — tetapi **minta user mendengar langsung**; transkrip bukan telinga.
- Akun ElevenLabs gratis (10.000 karakter/bulan) tidak bisa memakai suara perpustakaan (suara asli Indonesia) lewat API. Hemat kuota: cache per baris (hash teks+suara+emosi).
- **Jangan pernah menulis kunci API ke chat, log, atau file selain `.env`.** Kalau user menempel kunci di chat, sarankan ganti kunci.

## Caption (perbaikan "subtitle aneh")
Dulu: jendela 5 kata yang bergeser tiap kata + waktu ditebak dari jumlah huruf + hening 1 dtk di awal klip → teks loncat dan tidak sinkron.
Sekarang (sudah di `serial_mesin/Bridge.tsx` + `kata.py`):
- `kata.py epN`: faster-whisper `small` (`word_timestamps`, `local_files_only`) per klip → `kata=[[kata, f0, f1], ...]` frame absolut. Kata naskah dipetakan ke garis waktu whisper sebanding jumlah huruf (ejaan whisper diabaikan, hanya waktunya).
- Halaman frasa **per unit makna** (`serial_mesin/caption.ts`, bisa diuji dengan `node` tanpa render):
  kata depan/sambung melekat ke kata sesudahnya (di, ke, dari, yang, makin...), "ini/itu/pun" ke kata sebelumnya, deret angka/bulan
  ("Tujuh belas Maret"), deret nama ("Eka Dasa Rudra", "Goldman Environmental Prize"), kata majemuk ("ulang tahun", "kisah nyata") tidak pernah dipisah.
  Maks 3 kata / 22 huruf per halaman, putus sesudah tanda baca; kata yang tertinggal sendirian ditemani kata terakhir halaman sebelumnya.
- **Kuning = kata kunci tetap** (angka, bulan, nama diri bukan di awal kalimat, dan daftar `kunci` di `adegan/epN.json`), bukan kata yang sedang diucapkan.
  Kata yang belum diucapkan redup (55 %), kata yang sedang diucapkan membesar 7 %.
- Garis tepi tebal (cincin bayangan 6 px) — terbaca di kabut terang. 84 px potret.
- Posisi: bawah (`paddingBottom` 22 % tinggi, di atas zona tombol aplikasi). Shot yang wajah/badan tokohnya di bawah → `"capPos": "atas"` di scene itu.
  Aturan bingkai: wajah di 15–55 % tinggi layar; 62–78 % dicadangkan untuk caption.
- Cap lokasi: huruf tebal 46 px di pita gelap, bukan huruf mesin ketik kecil.
- Uji pemotongan sebelum render: salin `caption.ts`, jalankan `node` dengan skrip kecil yang membaca `epN/timeline.json` dan mencetak halaman.
- Sorotan huruf A/B di kartu pilihan mengikuti kata "A..."/"B..." dari `kata`.
- Sampul tanpa caption: `npx remotion still ... --props='{"sampul":true}'`, lalu susun judul dengan Pillow.

## Mesin `serial_mesin` (adegan JSON)
`adegan/epN.json` → disalin jadi `ep.json` oleh `mk_ep.sh`. Kunci utama:
- `kunci` (kata yang selalu kuning di caption, mis. `["meletus", "gas"]`), `ep`, `judul`, `seri` (teks "NAMA SERIAL · EP.N"), `stempel` (default "KISAH NYATA"), `kartuJudul` ("APA|PILIHANMU?", `|` = baris baru), `kartuBawah`,
  `hook` (teks kotak kuning), `pilihan {A,B}`, `menang` (pilihan yang dijawab), `lampu` (false = matikan lampu pos), `api [[x,z]]` (api unggun), `benda` (senter).
- `tokoh.<KEY> = {rupa, suara?, bicaraWajah?, jalur: [{at: detik|"idBaris", p:[x,z], mode: diri|jalan|lari, w: wajah, vis, hadap, lihat, kiri/kanan (pose lengan), rupa, skala, miring}]}`.
- `scenes.<scene> = {subj: KEY|[x,y,z], az, dist, distTo, camH, lookH, push, fov, hand, roll, light: day|golden, snow, hide:[KEY], back:[KEY],
  overlay: hitam|kedip, capPos: atas|bawah, letusan: 0..1, gas: 0..1, dof, kick, pose, bayangan, glitch, hp (layar HP berisi foto)}`.
- **Latar Indonesia** (`serial_mesin/latar_id.ts`, aktif default):
  | Tempat | Koordinat | Isi | Kunci ep.json |
  |---|---|---|---|
  | Gunung api | `[60, -230]` (kerucut r 190 m, puncak ±90 m, tanpa kabut) | lereng beralur, kawah, asap tipis | `gunungApi: [x,z]` / `false`, `kawahMenyala: true` (kawah merah-oranye), `asapGunung: false` |
  | Pura Bali | `PURA` = `[-74, 0, -7]`, gerbang di z≈-7, halaman ke arah -z | tembok bata, candi bentar, 2 meru ijuk, pelinggih, payung tedung | — |
  | Desa | x 125–170, rumah di z≈±11 | **rumah kayu panggung** beratap genteng, teras, jendela kayu | `desa: "barat"` = rumah lama ala Amerika |
  | Sawah berundak | x 178–214, \|z\| 3–23 | petak padi/air, pematang, dangau | — |
  Gunung api terlihat dari jalur maupun desa bila kamera menghadap -z dengan `lookH` tinggi (mis. `lookH: 6–12`, `dist` besar) — pakai untuk shot pembuka dan letusan
  (`letusan: 1` + `kawahMenyala`). Jangan memakai rumah/pondok lama untuk adegan Bali/NTT; pakai pura atau desa kayu.
- **Warna lebih hidup**: kabut overlay ×0,6 (`kabut`), vignette ×0,6 (`vignette`), kabut 3D 1,6× lebih jauh (`jarakKabut`). Naikkan ke 1 hanya untuk adegan horor yang memang harus pekat.
  Aturan komposisi: tokoh utama ≥ 1/3 tinggi layar di shot dialog; tidak ada shot tanpa tokoh/objek cerita > 2 dtk (shot kosong = gumpalan awan saja, dulu terjadi di Ep.13).
- Tempat di dunia: Pos 3 x≈62 (bidik di depan pondok z≈-3.6, bukan di dalam kotak rumah), desa/basecamp x 125–170, makam/pura x≈-55, tepi jurang x=-95, pohon mati (-90.4,-4.4).
- Layar tegak sempit (±11° horizontal): tokoh yang menyamping > 11° dari arah kamera keluar bingkai. Satu tokoh per shot atau dua rapat.
- Ekspor komponen tetap bernama `PetakaGunung` / `PG_FRAMES` (dipakai `mk_ep.sh`).

## Ciri khas tokoh (aturan user: "karakternya dibedakan agar memiliki ciri khas")
Bentuk badan **tetap** (aturan utama skill) — user menegaskan lagi (18 Nov 2026): **bentuk karakter sudah disukai dan sesuai, jangan diubah**. Pembeda hanya aksesori di `Rupa` (`serial_mesin/tokoh.ts`):
`topi: kupluk|caping|udeng|pet|ikat` (+`topiWarna`, `topiWarna2`), `sanggul`, `selendang`/`selendang2` (tenun bermotif belah ketupat + rumbai),
`ransel`, `kumis`, `jenggot`, `dasi` (+ epolet emas), `kacamata`, warna baju.
Contoh: pendaki = flanel + ransel + kacamata; pendaki 2 = kupluk merah + ransel oranye; petani = caping + kumis; ibu desa = sanggul + selendang;
pemangku Bali = udeng putih + jenggot + selendang kuning; mama NTT = sanggul/ikat kepala + tenun; pilot = topi pet + dasi + epolet.
Setiap tokoh di satu episode harus bisa dibedakan dari siluet + satu warna khas. Jangan pakai `pose: "hp"` bila tokoh tidak memegang HP (pakai `turun`).

## Pemeran per cerita (aturan user, 18 Nov 2026)
**Tiap cerita punya pemeran sendiri yang sesuai ceritanya**, kecuali **tokoh utama serial** (dikunci, dipakai lintas episode — mis. Raka & Sinta di
Petaka Gunung). Jangan memakai ulang PETANI/UMAT/MAMA2 dari episode lain untuk cerita yang berbeda. Bentuk badan tetap sama (user suka).
1. Sebelum menulis adegan, buat **lembar pemeran** di `dokumen/pemeran_epN.md`: nama/peran, umur, daerah & zaman, pakaian, aksesori, satu warna khas.
   Riset pakaian sesuai daerah & zaman (Jawa 1960-an: kemeja + peci; Bali: udeng + kamen + selendang; NTT: tenun ikat; pendaki 1969: flanel + ransel kanvas;
   pilot 1982: seragam + topi pet; penambang/SAR: helm). Kisah nyata: rupa disesuaikan dengan foto/keterangan sumber bila ada (tanpa meniru wajah).
2. Tulis di `adegan/epN.json` → `pemeran`:
   ```json
   "pemeran": {
     "KADES_1919": {"dari": "PETANI", "nama": "Pak Lurah", "topi": "peci", "baju": "#e8e2d2", "baju2": "#2a2a30", "kumis": "#14100d"},
     "PENAMBANG":  {"dari": "ANAK", "topi": "helm", "topiWarna": "#e8b81e", "topiWarna2": "#fff6c0", "baju": "#3a4a5a"}
   }
   ```
   lalu pakai `"rupa": "KADES_1919"` di `tokoh`. `dari` = rupa dasar yang disalin; field lain menimpa. Tidak perlu mengubah `tokoh.ts`.
3. Field yang bisa dibedakan: `kulit`, `rambut`, `gayaRambut` (acak/kuncir/botak/hantu), `atasan` (hoodie/flanel/rompi/gaun), `celana` (jins/kain/kargo),
   `baju`, `baju2`, `bawah`, `sepatu`, `sol`, `kacamata`, `kantung`, `topi` (kupluk/caping/udeng/pet/ikat/**peci**/**helm**), `topiWarna`, `topiWarna2`,
   `sanggul`, `selendang`, `selendang2`, `ransel`, `kumis`, `jenggot`, `dasi`.
4. Cek: dalam satu episode tiap tokoh beda siluet (topi/rambut/aksesori) **dan** beda warna khas; warga latar boleh mirip satu sama lain tapi tidak mirip tokoh cerita.
5. Tokoh utama serial dikunci di `tokoh.ts` (rupa bernama) dan dicatat di `TASK.md` serial; perubahan rupa tokoh utama hanya atas permintaan user.

## Latar per cerita (aturan user)
**Latar harus sesuai tempat & zaman cerita** — jangan memakai latar yang kebetulan ada (dulu: pura Bali tampil rumah Amerika).
Tulis bagian "Latar" di lembar pemeran: tempat nyata, daerah, zaman, waktu (malam/fajar), cuaca, benda penting. Lalu pilih di `adegan/epN.json`:
| Kunci | Nilai | Untuk |
|---|---|---|
| `hutan` | `pinus` (default) / `tropis` / `gundul` | gunung Jawa berkabut / hutan dataran rendah, Mollo, desa / sesudah letusan, lereng mati |
| `tanah` | `hutan` / `abu` / `kering` | lantai hutan / abu vulkanik (Kelud, Semeru, Galunggung) / savana NTT |
| `desa` | `kayu` (default) / `barat` | desa Indonesia / hanya bila cerita memang di luar negeri |
| `gunungApi`, `kawahMenyala`, `asapGunung` | posisi / bool | gunung yang diceritakan selalu terlihat; kawah menyala saat letusan |
| scene `light` | `day` (malam) / `golden` (fajar) | sesuaikan jam kejadian |
| tempat | pura, desa kayu, sawah, makam, pos pendakian, tepi jurang, pohon mati | kamera diarahkan ke tempat yang cocok (koordinat di bawah) |
Tempat yang **belum ada** (kabin pesawat, tambang marmer, kota, pantai...): tambahkan set baru di `latar_id.ts` (pola fungsi `pura`/`sawah`),
atau tampilkan lewat layar HP/kartu/motion-graphics — **jangan mengganti dengan tempat lain yang salah**. Catat set baru di tabel latar di bawah.

## Efek suara
- Rekaman CC0 Lots of Sounds, dicari tanpa kunci: `https://api.lotsofsounds.com/api/v1/sounds/sample?q=<kata>` → id `fs-NNNN`; diunduh sekali ke `suara/sfx_cache/`.
- Dasar per serial di `sfx_umum_*.py`, dipanggil dari isyarat episode: `exec(open(os.path.join(PROJ,"suara","sfx_umum.py")).read())` (mix.py menyediakan `os`, `PROJ`, `tl`).
- **SFX harus cocok dengan adegan** (aturan user): tiap scene diberi suasana sendiri (angin puncak, jangkrik desa, mesin tambang, kabin pesawat...).
- Horor fiksi: jumpscare di `j01` (-3 dB) + detak jantung menjelang. Kisah nyata: **tanpa jumpscare**, nada hormat (dengung gelap pelan, gamelan lirih di kartu).
- Keras akhir ±-16 LUFS walau target -14: puncak dibatasi -4,5 dBTP (sama di kedua serial, diterima).

| Suasana | id | Suasana | id |
|---|---|---|---|
| angin pinus | fs-245824 | dengung tegang | fs-141139 |
| hembusan gunung | fs-117513 | hantaman judul | fs-177242 |
| detak jantung | fs-21409 | jumpscare | fs-271945 |
| kartu pilihan | fs-273805 | gamelan lirih | fs-483449 |
| dengung gelap (hormat) | fs-157133 | whoosh | fs-127196 |
| stempel | fs-222517 | dentum teredam | fs-149966 |
| angin puncak | fs-324493 | langkah di pasir/salju | fs-443015 |
| desis gas | fs-277188 | napas berat | fs-112557 |
| jangkrik malam | fs-175020 | air mengalir | fs-530170 |
| ledakan | fs-177556 | gemuruh | fs-514381 |
| banjir lahar | fs-842298 | kerumunan panik | fs-101871 |
| angin melolong | fs-117610 | gamelan | fs-423647 |
| genta pura | fs-131348 | pagi desa | fs-222636 |
| hutan | fs-121965 | mesin tambang | fs-212781 |
| kabin pesawat | fs-418385 | alarm kokpit | fs-57806 |
| radio | fs-17804 | mendarat | fs-510482 |
| lari + napas | fs-630011, fs-163383 | bisikan | fs-680839, fs-193812 |

## Render & QA
- `render_ep.sh` = 2 potongan, bisa dilanjutkan; berhenti keras bila potongan tidak terbentuk. Chrome kehabisan memori (video 32 dtk padahal 56) → `KN_CONC=2`.
- QA: `ffmpeg -i video.mp4 -vf "blackdetect=d=0.5:pix_th=0.06,freezedetect=n=0.003:d=2.5" -af ebur128 -f null -` → hanya hitam yang disengaja (`j01`).
- Lembar kontak: stills per shot → `python kontak.py out/x_ out/kontak.jpg` → buka dengan Read dan periksa setiap shot.
- Jangan ubah `<Seri>Root.tsx`/folder `<seri>_epN` saat render berjalan (bundel dibuat ulang tiap potongan).

## Paket unggah
`dokumen/DESKRIPSI_EPN.md` (contoh: `examples/serial_id/kisah_nyata_ep13/DESKRIPSI_EP13.md`): judul YouTube (≤ 60 huruf + `#shorts`),
judul Reels/TikTok, deskripsi singkat, 5–7 hashtag, sumber (kisah nyata), **komentar sematan** voting A/B. Unggah malam 19.00–22.00.
Unggah/jadwal hanya bila user meminta.

## Jebakan serial Indonesia
| Gejala | Penyebab | Perbaikan |
|---|---|---|
| Nama/tanggal terbelah di caption ("UPACARA EKA" / "DASA RUDRA") | potong buta tiap 3 kata | unit makna di `caption.ts` (sudah) |
| Kuning berkedip pindah-pindah | kuning = kata aktif | kuning = kata kunci tetap (sudah) |
| Caption menutupi wajah | posisi tetap 26 % dari bawah | 22 % + `capPos: "atas"` per scene; wajah di 15–55 % tinggi |
| Kartu A/B ±15 dtk statis | naskah p01/p02 panjang + jeda 2,2 | kartu ≤ 8 dtk, adegan 3D di balik kartu (sudah) |
| Subtitle loncat & tidak sinkron | jendela kata bergeser + waktu tebakan + hening awal | `kata.py` + halaman frasa tetap + `TRIM` (sudah) |
| Sorotan selalu lebih cepat dari suara | ±1 dtk hening awal klip TTS Cepat | silenceremove RMS -35 dB (sudah) |
| Durasi 60–66 dtk padahal naskah pas | hening TTS ikut dihitung | potong hening; padatkan baris bila masih > 55 dtk |
| Engine mengulang nama | dua nama berurutan | tulis ulang kalimat |
| `connection refused` di tengah | engine TTS mati | jalankan ulang `engine/run.sh` aplikasi TTS Cepat (cache melanjutkan) |
| `NameError: os` di isyarat sfx | namespace exec mix.py | `os`, `PROJ`, `tl` sudah disediakan |
| Video jadi separuh | Chrome habis memori di potongan 2 | `KN_CONC=2 ./render_ep.sh N` |
| Caption ikut terbakar di sampul | still memakai komposisi biasa | `--props='{"sampul":true}'` |
| Tutup kamera / overlay menutupi sampul | frame salah pilih | pilih frame lain, cek still dulu |
| Python sistem tanpa PIL/numpy | venv berbeda | jalankan semua dengan `$SUARA_PY` |
| zsh memecah `for s in "11 a05"` | word-splitting zsh | pakai skrip python kecil |
| Pura/desa Bali tampil rumah Amerika, gunung tidak terlihat | dunia lama hanya punya rumah barat + siluet jauh tertelan kabut | `latar_id.ts`: pura, rumah kayu, sawah, gunung api tanpa kabut (sudah) |
| Gambar abu-abu suram | kabut + vignette pekat | `kabut`/`vignette` 0,6, `jarakKabut` 1,6 (default baru) |
| Pos 3 hilang dari bingkai | titik bidik di dalam kotak rumah | bidik di depan pondok |
| Wajah "seram"/"datar" saat bicara terlihat menyeringai | ekspresi dasar | `bicaraWajah` (sedih/cemas/takut) per tokoh |
| ffmpeg Mac tanpa rubberband | build Homebrew | `asetrate`+`atempo` (sudah) |
