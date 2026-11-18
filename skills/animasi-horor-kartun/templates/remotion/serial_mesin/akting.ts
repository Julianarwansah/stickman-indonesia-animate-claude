// AKTING OTOMATIS: tokoh tidak lagi berdiri kaku satu shot penuh. Dihitung per frame dari naskah (emosi baris, waktu kata, pembicara)
// tanpa menulis apa pun di adegan JSON. Pose/wajah yang ditulis tangan di adegan (jalur `w`, `kanan`/`kiri`, scene `pose`) selalu menang.
//  - BICARA: gerak sesuai emosi — teriak/takut = tangan terangkat ketakutan + gemetar, marah = menunjuk, sedih = kepala menunduk & miring,
//            senang = melambai singkat, netral = kepala mengangguk kecil di awal tiap kata.
//  - MENDENGAR: mata & kepala menoleh ke pembicara; ikut cemas bila pembicara takut/teriak; ikut sedih saat narasi menyebut kematian/korban.
//  - KEJUT (kejutAt dari story.ts): semua tokoh tersentak — wajah kaget, tangan naik, badan melompat kecil.
//  - DIAM: napas (kepala bergoyang ±1 derajat), kedip tetap dari cast.ts.
// Matikan: `aktingOtomatis: false` di ep.json atau `akting: false` di scene.
import { LINES, E, poseOf, kejutAt, KATA_SEDIH, FPS } from "./story";
import type { Line, V3 } from "./story";
import type { Gaya, Lengan, Ekspresi } from "./tokoh";

export type Akting = { gaya: Partial<Gaya>; angkat: number; geser: number };
const qd = (v: number, step: number) => Number((Math.round(v / step) * step).toFixed(3));   // dibulatkan: cache kanvas tokoh tetap kecil
const env = (n: number, naik: number, tahan: number, turun: number) => n < 0 ? 0 : n < naik ? n / naik : n < naik + tahan ? 1 : Math.max(0, 1 - (n - naik - tahan) / turun);

const barisAt = (f: number): Line | null => { for (const l of LINES) if (l.text && f >= l.start && f < l.end + 4) return l; return null; };
const kataAt = (l: Line, f: number): { i: number; f0: number } | null => {
  const k = l.kata ?? []; let hit: { i: number; f0: number } | null = null;
  k.forEach(([, f0], i) => { if (f >= f0) hit = { i, f0 }; });
  return hit;
};

export const akting = (key: string, f: number, o: { talking: boolean; emo: string; speakerKey: string; base: Partial<Gaya>; ghost: boolean; camRight: [number, number]; scAkting?: boolean; idx: number }): Akting => {
  const out: Akting = { gaya: {}, angkat: 0, geser: 0 };
  if (E.aktingOtomatis === false || o.scAkting === false) return out;
  const t = f / FPS, b = o.base, lenganBebas = !b.kanan && !b.kiri, set = (g: Partial<Gaya>) => Object.assign(out.gaya, g);
  // napas: semua tokoh (hantu bergoyang lebih lambat & dalam)
  const napas = o.ghost ? 2.5 * Math.sin(t * 0.7 + o.idx) : 1.0 * Math.sin(t * 1.3 + o.idx * 1.7);
  let miring = (b.miring ?? 0) + napas;
  if (o.ghost) { set({ miring: qd(miring, 0.5) }); return out; }
  const l = barisAt(f), wajahBebas = !b.wajah || b.wajah === "datar";
  if (o.talking && l) {
    const n = f - l.start;
    if (o.emo === "teriak" || o.emo === "takut") {
      const k = qd(env(n, 5, 1e6, 1) * (o.emo === "teriak" ? 1 : 0.7), 0.1);
      if (lenganBebas) set({ kanan: { pose: "takut", k } as Lengan, kiri: { pose: "takut", k } as Lengan });
      out.geser = 0.012 * Math.sin(f * 2.1);                              // gemetar
    } else if (o.emo === "marah") {
      if (lenganBebas) set({ kanan: { pose: "tunjuk", k: qd(env(n, 6, 1e6, 1), 0.1) } as Lengan });
      miring += 3 * Math.sin(t * 5);
    } else if (o.emo === "sedih") {
      miring += -5; set({ lihat: [0, 0.35] });
    } else if (o.emo === "senang") {
      if (lenganBebas && n < 30) set({ kanan: { pose: "dadah", k: qd(env(n, 5, 14, 10), 0.1), ayun: qd(Math.sin(n * 0.5), 0.25) } as Lengan });
    } else {                                                              // netral/bisik/seram: angguk kecil tiap kata
      const w = kataAt(l, f); if (w) miring += 2.2 * env(f - w.f0, 2, 1, 5) * (w.i % 2 ? 1 : -1);
    }
  } else if (o.speakerKey && o.speakerKey !== key) {
    // mendengar: menoleh ke pembicara (arah layar dari vektor kanan kamera)
    const a = poseOf(key, t).p, s: V3 = poseOf(o.speakerKey, t).p;
    const side = Math.sign((s[0] - a[0]) * o.camRight[0] + (s[2] - a[2]) * o.camRight[1]) || 0;
    if (!b.lihat) set({ lihat: [0.6 * side, 0] });
    miring += 3 * side;
    if (wajahBebas && (o.emo === "teriak" || o.emo === "takut")) set({ wajah: "cemas" as Ekspresi });
  }
  // narasi menyebut kematian/korban -> pendengar ikut sedih sampai baris selesai
  if (!o.talking && l && wajahBebas && (l.kata ?? []).some(([w, f0]) => f >= f0 && KATA_SEDIH.test(w))) { set({ wajah: "sedih" as Ekspresi, lihat: [0, 0.3] }); miring -= 3; }
  // kejut: tersentak bersama
  const k = kejutAt(f);
  if (k > 0.05) {
    set({ wajah: "kaget" as Ekspresi });
    const k0 = (out.gaya.kanan as Lengan | undefined)?.pose === "takut" ? (out.gaya.kanan as Lengan).k ?? 0 : 0;   // jangan turunkan tangan yang sudah terangkat
    if (lenganBebas) set({ kanan: { pose: "takut", k: qd(Math.max(k, k0), 0.1) } as Lengan, kiri: { pose: "takut", k: qd(Math.max(k, k0), 0.1) } as Lengan });
    out.angkat = 0.07 * k;
  }
  set({ miring: qd(miring, 0.5) });
  return out;
};
