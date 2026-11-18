#!/bin/zsh
# mk_ep.sh <N...> — salin mesin serial jadi folder video per episode, pasang timeline + adegan, daftarkan semua episode.
# Taruh di <proyek>/ bersama naskah/, adegan/, ep<N>/. Variabel:
#   REMO_DIR  proyek Remotion (wajib)          SERI   awalan pendek serial, mis. pg / kn (default: sr)
#   COMP      awalan id Composition (default: Serial) -> Serial11, Serial12, ...
set -e
PROJ="${0:A:h}"; SRC="${REMO_DIR:?isi REMO_DIR}/src"; SERI=${SERI:-sr}; COMP=${COMP:-Serial}
[ -d "$SRC/videos/${SERI}_mesin" ] || { echo "salin dulu templates/remotion/serial_mesin ke $SRC/videos/${SERI}_mesin"; exit 1; }
for N in "$@"; do
  rm -rf "$SRC/videos/${SERI}_ep$N"; cp -R "$SRC/videos/${SERI}_mesin" "$SRC/videos/${SERI}_ep$N"
  cp "$PROJ/ep$N/timeline.json" "$SRC/videos/${SERI}_ep$N/timeline.json"; cp "$PROJ/adegan/ep$N.json" "$SRC/videos/${SERI}_ep$N/ep.json"
done
R="${(C)SERI}Root"
{
  echo 'import React from "react";'; echo 'import { Composition } from "remotion";'
  for d in "$SRC"/videos/${SERI}_ep*(N); do n=${d##*_ep}; echo "import * as E$n from \"./videos/${SERI}_ep$n/Bridge\";"; done
  echo "export const $R: React.FC = () => (<>"
  for d in "$SRC"/videos/${SERI}_ep*(N); do n=${d##*_ep}; echo "  <Composition id=\"$COMP$n\" component={E$n.PetakaGunung} durationInFrames={E$n.PG_FRAMES} fps={30} width={1080} height={1920} />"; done
  echo '</>);'
} > "$SRC/$R.tsx"
printf 'import { registerRoot } from "remotion";\nimport { %s } from "./%s";\nregisterRoot(%s);\n' $R $R $R > "$SRC/${SERI}-index.ts"
echo "episode siap: $*  (entry src/${SERI}-index.ts, comp $COMP<N>)"
