# Tokoh (`templates/tokoh/tokoh.ts`)

Tokoh digambar dengan Canvas2D di ruang 600 x 1000 unit (telapak kaki y = 975; 1000 unit = 2,16 m di dunia 3D), lalu ditempel sebagai kartu yang selalu menghadap kamera (`cast.ts`). Garis tinta: stroke 2x tebal untuk semua bagian dulu, isi belakangan → bagian yang menyatu (lengan + tangan) punya satu garis luar. Bayangan cel dua tingkat (`cel`, `celMulti`), bayangan dingin keunguan.

## Bentuk tetap (jangan diubah — keputusan user)
Ukuran di `const U`: kepala bulat r 85 (pusat y 310), leher 27 x ±45, badan kotak 172 lebar dari y 434 ke 618, lengan tabung r 17 (l1 118, l2 110), kaki tabung r 29 sampai pergelangan y 936, sepatu oval pipih 66 x 30. Tangan bulat seperti sarung tangan + jempol. Lengan baju **pendek**, kulit lengan menyambung ke tangan.

## Pemeran Ep.1 (`Rupa`)
| Konstanta | Tokoh | Ciri |
|---|---|---|
| `JAKE` | 17 th, tokoh utama | hoodie biru batu lengan pendek (tudung + tali + saku), jins, kets putih, rambut cokelat acak, kantung mata |
| `EMILY` | 16 th, adik Jake | flanel merah kotak-kotak lengan pendek, jins gelap, rambut auburn dikuncir + ikat biru; membawa senter |
| `MILLER` | tetangga tua mencurigakan (ternyata baik) | rompi rajut cokelat di atas kemeja krem, celana abu, kacamata, botak beruban, kerut dahi |
| `PSIKO` | "The Smiling Man" (desain sendiri) | topeng porselen putih retak, senyum merah dilukis berjahit, tudung hitam, kargo zaitun, bot, kapak kartun tanpa darah |
| `HANTU` | cadangan | gaun tidur compang-camping, rambut hitam menutupi wajah kecuali satu mata |

`Rupa`: `kulit, rambut, gayaRambut ("acak"|"kuncir"|"botak"|"topeng"|"hantu"), atasan ("hoodie"|"flanel"|"rompi"|"gaun"), celana ("jins"|"kain"|"kargo"), baju, baju2, bawah, sepatu, sol, kacamata?, kantung?`.
Tokoh baru = `Rupa` baru dengan kombinasi ini (tambah gaya rambut/baju baru di `hairFront`/`hairBack`/`headBack`/`torsoDetail` kalau perlu), lalu cek dengan lembar karakter.

## Gaya (per frame)
| Kunci | Arti |
|---|---|
| `wajah` | datar, senyum, cemas, takut, kaget, teriak, seram, senang, sedih, marah, bisik (nama tak dikenal → datar) |
| `bicara` | bukaan mulut 0..1 (cast.ts mengisinya dari `timeline.json` saat tokoh itu bicara) |
| `kedip`, `lihat` [x,y], `hadap` | kelopak 0..1, arah pupil, wajah sedikit menoleh (-1..1) |
| `jalan` (fase 0..1), `langkah` (0..1), `lari` | jalan: kaki bergantian + lengan berayun; lari: lutut tinggi, badan memantul, lengan menekuk |
| `kanan`/`kiri` (`Lengan`) | `{pose, k (0..1 transisi), w (ayunan -1..1)}`; kanan = tangan kanan TOKOH (kiri layar) |
| `miring` | kepala miring (derajat) — dipakai saat si Psikopat "memiringkan kepala" |
| `belakang` | tampak belakang (rambut/tudung menutup kepala, tanpa wajah) untuk kamera di belakang tokoh |
| `sorot` | sorot senter (hanya bagus di lembar karakter; di 3D terpotong tepi kartu) |
| `light` | sudut arah cahaya di kanvas (diisi cast.ts dari matahari/bulan) |

Pose lengan: `turun`, `dadah` (melambai), `takut` (tangan di dada), `senter` (memegang senter keluar), `tunjuk`, `kapak` (kapak tergantung dekat lutut), `lari`, `telepon` (ponsel di telinga), `hp` (ponsel menyala di depan dada). Pose "takut/telepon/hp" digambar di depan badan (lengan bawah sesudah kepala).

## Cek desain cepat (tanpa Remotion)
`templates/tokoh/lembar.ts` menggambar 4 pemeran + baris ekspresi:
```
cd <proyek>/tokoh
<remotion>/node_modules/.bin/esbuild lembar.ts --bundle --format=iife --outfile=lembar.js
echo ^<html^>^<body style="margin:0"^>^<script src="lembar.js"^>^</script^>^</body^>^</html^> > lembar.html
"$CHROME_PATH" --headless=new --disable-gpu --screenshot=<abs>/lembar_tokoh.png --window-size=2400,1560 file:///<abs>/lembar.html
```
Buka PNG dengan Read. Lembar ini juga yang dikirim ke user saat mengusulkan tokoh baru.

## Jebakan
- Kalau satu tokoh di lembar tidak tergambar dan sisanya hilang: ekspresi/pose salah ketik membuat exception (kini ekspresi tak dikenal jatuh ke `datar`).
- Jempol/tangan berbayang hitam: jangan isi gabungan bentuk dengan `fill("nonzero")`; `celMulti` mengisi tiap bentuk sendiri.
- Jempol ke atas di tengah kepalan terbaca sebagai jari tengah → jempol di sisi + garis lipatan jari.
- Lengan panjang + manset membuat tangan tampak lepas (user menolak).
- Senter dipegang di pusat kepalan (`W + 20*dir(ang)`), bukan di pergelangan.

## Tokoh pendukung & latar baru (Shorts 2026-11)
- Tokoh baru punya suara sendiri: tambahkan entri di `TOKOH` (`suara.py`) dan petakan `who` di naskah (contoh `PENGGANTI` di `naskah/buat_shorts2.py`). Jangan memakai suara tokoh lain untuk tokoh baru.
- Model tokoh baru = `Rupa` baru (lihat "Cara bikin tokoh baru"). Model pendukung yang berulang (anak, warga) cukup diganti warna dan baju.
- Latar baru: buat blok sendiri di `island.ts` memakai `boxGeo`, `lam` dan `house()`; jangan menaruh objek di dalam kotak rumah yang ada. Simpan koordinat tempat di `story.ts` sebagai konstanta.
- Kamera di balik objek (tiang, kanopi): pilih sisi yang kosong. Tokoh di balik tiang menghilang di still; cek dengan still sebelum render.
- Kamera lebih dekat dari ~2,5 m ke lampu atau layar terang menjadi kabur oleh bloom. Mundurkan kamera.
