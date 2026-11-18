#!/bin/zsh
# render_ep.sh <N> — render 2 potongan (bisa dilanjutkan bila terhenti), sambung, pasang ep<N>/mix.wav -> $OUT_DIR/<NAMA><N>.mp4
# Variabel: REMO_DIR (wajib), SERI, COMP (sama dengan mk_ep.sh), OUT_DIR (default <proyek>/video), NAMA (default "Episode"),
#           KN_CONC (concurrency Chrome, default 4; turunkan ke 2 bila potongan gagal/habis memori), CHROME_PATH.
set -e
N=$1; PROJ="${0:A:h}"; RM="${REMO_DIR:?isi REMO_DIR}"; SERI=${SERI:-sr}; COMP=${COMP:-Serial}
CH="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TOT=$(python3 -c "import json;print(json.load(open('$PROJ/ep$N/timeline.json'))['total'])"); HALF=$((TOT/2))
P="$PROJ/parts_ep$N"; mkdir -p "$P"; cd "$RM"
for part in "0-$((HALF-1)):part_00" "$HALF-$((TOT-1)):part_01"; do
  fr=${part%%:*}; nm=${part##*:}
  [ -s "$P/$nm.mp4" ] || npx remotion render src/${SERI}-index.ts $COMP$N "$P/$nm.mp4" --frames=$fr --gl=angle --concurrency=${KN_CONC:-4} --muted --log=error --crf=16 --browser-executable="$CH" 2>&1 | grep -v "Failed to load\|404" | tail -3
done
for nm in part_00 part_01; do [ -s "$P/$nm.mp4" ] || { echo "GAGAL: $nm tidak terbentuk (coba KN_CONC=2)"; exit 1; }; done
printf "file '%s'\nfile '%s'\n" "$P/part_00.mp4" "$P/part_01.mp4" > "$P/list.txt"
OUT="${OUT_DIR:-$PROJ/video}/${NAMA:-Episode}$N.mp4"; mkdir -p "${OUT:h}"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$P/list.txt" -i "$PROJ/ep$N/mix.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,nb_frames,duration -of compact "$OUT"
# QA cepat: layar hitam/macet + keras
ffmpeg -hide_banner -i "$OUT" -vf "blackdetect=d=0.5:pix_th=0.06,freezedetect=n=0.003:d=2.5" -af ebur128 -f null - 2>&1 | grep -E "black_start|freeze_start|I:" | tail -6
