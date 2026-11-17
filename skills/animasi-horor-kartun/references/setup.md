# Setup (sekali per komputer)

Langkah ini dijalankan sekali per komputer. Contoh perintah memakai Windows (PowerShell/cmd); di macOS/Linux ganti `\` dengan `/`, `py -3.11` dengan `python3.11`, dan `xcopy` dengan `cp -r`.

## Variabel lokasi (dibaca semua skrip)
| Variabel | Isi | Contoh |
|---|---|---|
| `REMO_DIR` | proyek Remotion (cartoon-3d-shorts) | `C:\proyek\kartun-3d-shorts` |
| `SUARA_PY` | python venv Supertonic | `C:\proyek\lab-suara\venv_supertonic\Scripts\python.exe` |
| `CHROME_PATH` | (opsional) Chrome untuk render; kosong = Chrome bawaan Remotion | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

Atur sekali di shell atau di pengaturan agen Anda. Kalau `REMO_DIR` kosong, skrip mencari `./kartun-3d-shorts` di folder kerja.

## Kebutuhan
- Node.js 24, Python 3.11 (untuk Supertonic) + Python lain untuk skrip biasa, Google Chrome (atau Chromium) untuk render.
- ffmpeg **dengan rubberband** (`ffmpeg -filters | grep rubberband`); build "full" dari winget/gyan punya. Tanpa rubberband, pergeseran nada suara & tempo efek tidak jalan.
- Pillow (`pip install pillow`) untuk lembar kontak.

## 1. Proyek Remotion (dunia 3D + kartu tokoh)
```
git clone https://github.com/ryanmhildan/cartoon-3d-shorts <REMO_DIR>
cd <REMO_DIR>
npm install            # BUKAN npm ci: lock file repo tidak sinkron
```
- Model Kenney (rumah/pinus/lampu) sudah ada di `public/bridge/kenney/`.
- Salin template: `templates/remotion/horor_ep` → `src/videos/<ep_video>/` (mis. `horor_ep2`). Di `Bridge.tsx` ganti `HororEp1`/`EP1_FRAMES` jadi nama baru.
- `src/Root.tsx` boleh dibuat minimal (repo asli mengimpor 15 video lain):
```tsx
import React from "react";
import { Composition } from "remotion";
import { HororEp2, EP2_FRAMES } from "./videos/horor_ep2/Bridge";
export const Root: React.FC = () => (<>
  <Composition id="HororEp2" component={HororEp2} durationInFrames={EP2_FRAMES} fps={30} width={1920} height={1080} />
</>);
```
- `scripts/stills.mjs` repo memakai `D:/remotion_tmp`; laptop user hanya punya C:, jadi selalu set `REMOTION_TMP=<proyek>/.remotion_tmp` (lembar_kontak.py & render_ep.py sudah melakukannya). Salinan `stills.mjs` ada di `scripts/` skill ini.
- Cek tipe: `npx tsc --noEmit -p . | grep <ep_video>`.

## 2. Motion-graphics (Barty-Bart/motion-graphics, MIT)
```
git clone https://github.com/Barty-Bart/motion-graphics C:\tmp\mg
mkdir <proyek>\motion
xcopy /E C:\tmp\mg\skills\motion-broll\engine <proyek>\motion\engine\      (juga scripts, reference, examples, templates)
xcopy /E C:\tmp\mg\skills\sound-effects <proyek>\motion\skill-sound-effects\
cd <proyek>\motion
echo {"private":true} > package.json
set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 && npm install playwright
```
Arahkan mesin ke Chrome yang terpasang (tanpa unduh Chromium) — ganti di `engine/render.js` dan `engine/beats.js`:
`chromium.launch()` → `chromium.launch({executablePath:process.env.CHROME_PATH||undefined})`.
Untuk klip potret, di `engine/beats.js` sesudah `await p.evaluate(()=>document.fonts.ready);` tambahkan
`const sz=await p.evaluate(()=>({W:document.getElementById('stage').offsetWidth,H:document.getElementById('stage').offsetHeight}));await p.setViewportSize({width:sz.W,height:sz.H});`
(`render.js` sudah menyesuaikan sendiri). Salin `templates/motion/buat_klip.py` ke `<proyek>/motion/`. Jalankan engine dengan `NODE_PATH=<proyek>/motion/node_modules`.

## 3. Suara (Supertonic 3, supertone-oss-archive/supertonic-py)
```
cd <folder lab suara>
py -3.11 -m venv venv_supertonic
venv_supertonic\Scripts\python.exe -m pip install supertonic
```
- Butuh Python 3.11 (onnxruntime belum ada untuk 3.14).
- Pemakaian pertama mengunduh model ±400 MB ke `~/.cache/supertonic3` (di koneksi user ±25 menit — jalankan di latar belakang, jangan diulang).
- Salin `templates/suara/*.py` ke `<proyek>/suara/`.

## 4. Efek suara (Lots of Sounds free sample API)
Tanpa kunci API. Cari: `GET https://api.lotsofsounds.com/api/v1/sounds/sample?q=<kata>&limit=12`. Ambil file: `GET .../sounds/sample/<id>/stream` → JSON berisi `stream_url` sementara (langsung unduh). `mix.py` melakukannya otomatis dan menyimpan ke `<proyek>/suara/sfx_cache/`.

## Struktur proyek
```
horor-usa/
  naskah/ep1.json                     naskah
  ep1/                                vo/, timeline.json, suara_vo.wav, mix.wav, ep1_en.srt, youtube.txt, sfx_ep1.py
  suara/                              suara.py, buat_suara.py, audisi_tokoh.py, mix.py, srt.py, sfx_cache/
  motion/                             engine/, node_modules/, buat_klip.py, klip_ep1.py, clips/, dist/, out/, skill-sound-effects/
  tokoh/                              tokoh.ts (sumber utama tokoh), lembar.ts
  branding/                           profil.ts, profil_*.png
  video/                              ep1_parts/part_NN.mp4, ep1_the_smiling_man.mp4
  render_ep.py
```
`tokoh/tokoh.ts` adalah sumber utama; setiap kali berubah, salin ke `src/videos/<ep_video>/tokoh.ts`.
