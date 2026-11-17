# Dunia 3D, kamera, koreografi (`templates/remotion/horor_ep/`)

Dunia = `island.ts` (dari video raja_es repo) + `world.ts` + mesin tampilan template (tinta, lensa, grade). Satuan meter, y ke atas. Video 16:9 1920x1080, FOV vertikal 40° (horizontal ±33°).

## Peta (zona Boston = zona horor)
| Tempat | Koordinat |
|---|---|
| Tanah salju | z < 0 (kotak -320..320); tepi dermaga batu z -1..0; laut di z > 0 (y -0,6) |
| Deretan rumah Elm St. (fasad menghadap +z) | x ≈ -68, -60, -48, -39, -28, -19 (fasad z ≈ -12,7..-15); x -8, 1,8, 11,6 mundur (fasad ≈ -18); x 21,9 (rumah 9, fasad -14,9), 31,5 (-12,7), 41,3 (-15), 50,4 (-13,9), 61,9 (-14,8). Timur x > 66 kosong |
| Pintu Pak Miller | `MILLER_AT` (21,9, 0, -13,6) |
| Lampu jalan (`LAMPS`) | x 58, 46, 34, 10, -6, -30, -50 di z -11,7 (tiang + kepala menyala + genangan cahaya hangat) |
| Jalan tokoh | Jake z -10,1, Emily z -9,2, berjalan ke arah -x |
| Peti di dermaga | x -5,85 / -4,5 / -3,15 di z -3 (masing-masing ±0,6, tinggi ±1,25 dengan balok es) |
| Dermaga kayu | x 2..6, z 0..22, lantai y 0,5 (`PIER.y`) |
| Kapal tua | (10,6, -0,6, 13), menghadap -π/2, tanpa muatan |
| Kolam beku | pusat (-70, -45) r 18, es berpetak (y 0,014), balok es potongan di sekitar (-63, -42,5), lubang lama (-66,8, -42,8); dikelilingi pinus |
| Zona tropis (TX = 2000) | alun-alun pasir (TX+1,5, -4) dengan rumah krem & kelapa; pasar (TX+90, -24) — bangku kios raksasa jelek, hindari |

## Cahaya
- Preset `"day"` di folder video ini = **MALAM**: bulan biru dari belakang-kanan kamera (az 140, el 34), langit gelap, kabut biru tua 10→95 m, grade gelap + vinyet berat. Bulan purnama digambar di arah `moonAz` (derajat dari arah pandang; isi per scene supaya bulan masuk bingkai, mis. -12..+30).
- Preset `"golden"` = **FAJAR pucat** (langit peach → lavender) untuk pagi sesudah kejadian.
- Salju turun, sirene, layar hitam = lapisan 2D di `Bridge.tsx` (`snow` 0..1, `overlay`).

## Koreografi (`story.ts`)
Posisi tokoh adalah fungsi waktu per bab: `kid("J"|"E", t)`, `psiko(t)`, `miller(t)` → `{p, mode: "diri"|"jalan"|"lari"|"jatuh", phase, vis, miring}`. Waktu dikaitkan ke naskah lewat `T0("id")`/`T1("id")` (detik mulai/selesai baris) dan `bab(t)` (batas kartu bab `k1..k5`). Pola:
- berjalan: `x = x0 - v*(t - tA)`, fase = jarak/1,34 (dua langkah 0,67 m); lari 3,4 m/dtk, fase `t*1.4`.
- berhenti mengobrol saat dialog (posisi tetap), lanjut jalan sesudahnya — supaya dialog berlatar rumah.
- `vis` mematikan tokoh di bab yang bukan tempatnya.

## Kamera (`SCENES` di `story.ts`)
`ms(p, az, dist, k, {camH, lookH, dx, dz, fov, roll})`: lensa `dist` m dari titik kaki `p`, azimut `az` — **90 = lensa di -x menghadap +x** (melihat tokoh yang berjalan ke -x dari depan), 180 = lensa di +z menghadap -z (melihat fasad rumah), 270 = di +x menghadap -x, 0 = di -z menghadap +z (dari arah rumah ke laut, kapal masuk latar). `k` = faktor dolly; `push(c, rate)` = dorongan pelan (0,0012–0,004/frame). `at0(c, fn)` = posisi tokoh di awal shot (kamera diam). Kamera ikut tokoh: pakai `J(c)`/`KIDS(c)` langsung.
Field scene: `cam`, `light`, `moonAz`, `dof {cInf, focus}`, `back: ["J","E"]` (tampak belakang), `snow`, `overlay: "hitam"|"sirene"`, `pose: (c) => ({J: {...Gaya}})`.
Resep: dialog MCU `dist 2.1–2.3, camH 1.4, lookH 1.36`, cInf 12–14 fokus `eyes(p)`; lebar `dist 9–15, camH 1.5–6.5`, cInf 0–5; close-up topeng `dist 1.75, camH/lookH 1.47`; guncangan di awal shot lewat `KICK_SCENES`.

## Kamera potret (1080x1920)
FOV vertikal tetap 40°, horizontal hanya ±23°: dua tokoh yang berjauhan 0,9 m sudah memenuhi lebar pada jarak 3 m. Pakai shot bergantian (satu tokoh per shot), pindahkan tokoh lebih rapat di koreografi untuk shot berdua, naikkan `lookH` sedikit (wajah di sepertiga atas, caption di bawah). Shot lebar tetap bagus untuk deretan rumah karena tinggi bingkai bertambah.

## Efek di `cast.ts`
Genangan lampu (malam), retakan es menjalar (`crackDraw`), lubang air gelap, cipratan (`fxSplash`), riak (`fxRing`), kapak tergeletak di es (pagi). Si Psikopat tenggelam dengan menurunkan y kartunya di bawah es (es menutupi bagian bawah dengan sendirinya).

## Daftar periksa lembar kontak (setiap shot)
1. Subjek kalimat terlihat jelas, tidak terpotong tepi, tidak tertutup objek.
2. Ada latar (rumah/pinus/kapal), bukan padang salju kosong.
3. Tidak ada kartu tokoh di dalam objek (peti, rumah) atau kamera menempel objek (layar penuh warna kabur).
4. Tokoh tidak menabrak/melewati kamera di akhir shot (cek frame awal & akhir shot lari).
5. Tampak belakang dipakai kalau kamera di belakang tokoh.
6. Shot berurutan beda framing; bulan masuk bingkai di shot lebar.
Sisipan motion-graphics menutupi shot-nya, jadi kamera scene `judul`/`babN`/ponsel/911/berita tidak penting.
