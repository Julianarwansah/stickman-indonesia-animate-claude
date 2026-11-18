# Animasi horor kartun (untuk agen AI apa pun)

Panduan ini berlaku untuk agen AI apa pun (Claude, Codex, Cursor, Gemini, dll.). Detail lengkap ada di `SKILL.md` dan `references/`. Baca `SKILL.md` dulu.

## Tujuan
Membuat video animasi horor kartun: tokoh kartun kepala bulat di dunia 3D malam bersalju, naskah bahasa Inggris untuk penonton Amerika. Dua format: 16:9 (YouTube panjang, -16 LUFS) dan 9:16 (Shorts/Reels/TikTok, -14 LUFS).

## Dua mode
- **Horor USA** (bahasa Inggris, Supertonic): urutan kerja di bawah.
- **Serial Indonesia** (Shorts bahasa Indonesia: PETAKA GUNUNG, KISAH NYATA NUSANTARA): baca `references/serial-indonesia.md`. Urutan wajib: suara → `kata.py` → `mix.py` → `mk_ep.sh` → stills → `render_ep.sh`. Format pilihan A/B (A = tamat, B = lanjut, tidak ditulis), CTA halus, SFX cocok adegan, tokoh dibedakan lewat aksesori saja. Suara: ElevenLabs (multi-tokoh) atau Aplikasi TTS Cepat (narator lokal) — aturan Supertonic di bawah hanya untuk mode Horor USA.

## Sebelum mulai
1. Pastikan variabel lokasi terisi (lihat `references/setup.md`): `REMO_DIR` (proyek Remotion), `SUARA_PY` (python venv Supertonic), dan `CHROME_PATH` (opsional).
2. Jangan menulis path komputer tertentu ke skrip. Gunakan variabel itu.
3. Perintah contoh memakai Windows. Di macOS/Linux ganti `\` dengan `/` dan `py -3.11` dengan `python3.11`.

## Urutan kerja
1. **Naskah** `naskah/<ep>.json`: format di `examples/ep1/ep1.json`. Tokoh baru perlu entri suara sendiri.
2. **Suara**: `$SUARA_PY templates/suara/buat_suara.py naskah/<ep>.json <ep>` menghasilkan klip per baris dan `timeline.json`.
3. **Visual**: salin `templates/remotion/horor_ep` ke `$REMO_DIR/src/videos/<ep_video>/`, tulis koreografi di `story.ts`, daftarkan komposisi di `src/Root.tsx`. Cek still dengan `npx remotion still ... --gl=angle` sebelum render.
4. **Efek suara**: tulis isyarat per episode (pola di `examples/ep1/sfx_ep1.py`), lalu `templates/suara/mix.py <ep> <isyarat>.py --lufs -14`.
5. **Render**: `templates/render_potret.py` (Shorts) atau `templates/render_ep.py` (16:9). Render per potongan 1 menit, bisa dilanjutkan. Jalankan di latar belakang dan pantau log.
6. **Cek hasil** dengan `scripts/qa_video.py` dan `scripts/lembar_kontak.py`.

## Aturan yang tidak boleh dilanggar
- **Bentuk tokoh tetap**: kepala bulat polos, badan kotak, lengan dan kaki tabung, sepatu pipih. Ganti hanya baju, warna, rambut, dan pose. Lihat `references/tokoh.md`.
- **Suara**: pakai Supertonic 3. Jangan memakai edge-tts, Kokoro, atau TTS lain. Narator M5 terkunci. Suara yang sudah dikunci tidak diaudisi ulang. Tokoh baru diaudisi dengan 2 calon, lalu user memilih.
- **Suara takut**: vibrato 0,05, bukan 0,18 (0,18 terdengar robot).
- **Sinkron**: jika durasi klip berubah, jalankan `templates/suara/samakan_durasi.py` sebelum mux. Lihat `references/suara-sfx.md`.
- **Render panjang dipecah** per menit dan aman kalau terhenti. Jangan menjalankan dua render untuk episode yang sama. Cek proses lama dulu.
- **Jangan render** bila user melarang; render hanya setelah user setuju.
- **Upload dan jadwal publikasi** hanya setelah user meminta. Jangan mengunggah otomatis.
- Fiksi orisinal. Tanpa darah, kekerasan kartun saja.

## Jebakan yang sering terjadi
Tabel lengkap ada di bagian bawah `SKILL.md`. Yang paling sering: suara perempuan terdengar robot, timeline bergeser setelah suara diubah, loudness tidak mencapai -14 LUFS, render batch mati tanpa pesan, still gagal di Node 24, dan tokoh tertutup objek di kamera.
