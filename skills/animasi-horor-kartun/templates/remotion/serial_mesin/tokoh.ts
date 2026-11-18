// TOKOH HOROR USA v1 (tema: remaja dikejar psikopat). Bentuk badan SAMA dengan tokoh yang sudah disetujui user (kepala bulat polos, leher kecil
// panjang, badan kotak, lengan & kaki tabung, tangan bulat seperti sarung tangan, sepatu pipih, garis ungu tua tebal,
// kulit pucat; ±4,4 kepala). Yang diperbagus: bayangan cel dua tingkat, detail pakaian (hoodie bertali + saku,
// flanel kotak-kotak, rompi rajut + kemeja, gaun compang-camping), rambut per tokoh, ekspresi horor (cemas, takut, kaget,
// teriak, seram), kantung mata, kacamata, keringat, pose tangan (dadah, takut, senter, tunjuk).
// Ruang gambar 600 x 1000 unit, telapak kaki di y = 975 (cocok dengan kartu BODY di pipeline kartun-3d-shorts:
// 1000 unit = 2,16 m). Tidak bergantung pada file lain.

import EP_TOKOH from "./ep.json";
export const TINTA = "#2b1631";
type P2 = [number, number];
type C3 = [number, number, number];
const LW = 5.5;

// ---------------- warna ----------------
const hx = (c: string): C3 => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r: number, g: number, b: number) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
export const mul = (c: string, m: C3) => { const [r, g, b] = hx(c); return toHex(r * m[0], g * m[1], b * m[2]); };
export const mix = (a: string, b: string, t: number) => { const A = hx(a), B = hx(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
/** bayangan dingin ala horor: lebih gelap dan sedikit ke ungu-biru */
const shd = (c: string, k = 0.74) => mix(mul(c, [k, k * 0.98, k * 1.06]), "#2a2440", 0.12);

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp2 = (a: P2, b: P2, t: number): P2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ease = (u: number) => { const x = clamp(u, 0, 1); return x * x * (3 - 2 * x); };

// ---------------- tipe ----------------
export type Ekspresi = "datar" | "senyum" | "cemas" | "takut" | "kaget" | "teriak" | "seram" | "senang" | "sedih" | "marah" | "bisik";
export type PoseLengan = "turun" | "dadah" | "takut" | "senter" | "tunjuk" | "kapak" | "lari" | "telepon" | "hp";
export type Lengan = { pose: PoseLengan; k?: number; w?: number; ayun?: number };
export type Gaya = {
  jalan?: number; langkah?: number;
  /** lari: langkah tinggi, badan memantul, lengan menekuk mengayun (pakai bersama `jalan` sebagai fase) */
  lari?: boolean;
  wajah: Ekspresi; kedip?: number; lihat?: [number, number]; hadap?: number;
  /** kanan = tangan kanan TOKOH (kiri layar); kiri = tangan kiri tokoh (kanan layar) */
  kanan?: Lengan; kiri?: Lengan;
  /** sudut kanvas arah datangnya cahaya */
  light?: number;
  /** gambar sorot senter (lembar karakter; di dunia 3D sorotnya dibuat terpisah) */
  sorot?: boolean;
  /** bukaan mulut saat bicara 0..1 (dari energi suara per frame); kosong = mulut ekspresi biasa */
  bicara?: number;
  /** kepala miring (derajat, + = ke kanan layar) */
  miring?: number;
  /** tampak belakang (kamera di belakang tokoh): tanpa wajah, rambut/tudung menutup kepala */
  belakang?: boolean;
};
export type Rupa = {
  nama: string;
  kulit: string; rambut: string; gayaRambut: "acak" | "kuncir" | "botak" | "hantu" | "topeng";
  atasan: "hoodie" | "flanel" | "rompi" | "gaun"; celana?: "jins" | "kain" | "kargo";
  baju: string; baju2: string; bawah: string; sepatu: string; sol: string;
  kacamata?: boolean; kantung?: boolean;
  /** ciri khas (seri Kisah Nyata): penutup kepala, sanggul, selendang tenun, ransel, kumis/jenggot, dasi pilot */
  topi?: "kupluk" | "caping" | "udeng" | "pet" | "ikat" | "peci" | "helm"; topiWarna?: string; topiWarna2?: string;
  sanggul?: boolean; selendang?: string; selendang2?: string; ransel?: string;
  kumis?: string; jenggot?: string; dasi?: string;
};

const PUCAT = "#e4e9ee";
/** Jake, 17 th, tokoh utama: hoodie biru batu, jins, kets putih, rambut cokelat acak, kantung mata (kurang tidur) */
export const JAKE: Rupa = { nama: "Jake", celana: "jins", kulit: PUCAT, rambut: "#4a3426", gayaRambut: "acak", atasan: "hoodie", baju: "#46566e", baju2: "#d9dde3", bawah: "#3a5a8f", sepatu: "#e8ecef", sol: "#2a2a33", kantung: true };
/** Emily, 16 th, adik Jake: kemeja flanel merah kotak-kotak, jins gelap, rambut auburn dikuncir */
export const EMILY: Rupa = { nama: "Emily", celana: "jins", kulit: PUCAT, rambut: "#8a4f2c", gayaRambut: "kuncir", atasan: "flanel", baju: "#b8433a", baju2: "#5e1f1d", bawah: "#2e4570", sepatu: "#e8ecef", sol: "#5e1f1d" };
/** Pak Miller, tetangga tua yang mencurigakan: rompi rajut cokelat di atas kemeja krem lengan pendek, celana abu,
 *  kacamata, botak beruban */
export const MILLER: Rupa = { nama: "Pak Miller", celana: "kain", kulit: "#e8e5df", rambut: "#b7b8c0", gayaRambut: "botak", atasan: "rompi", baju: "#7a6248", baju2: "#ece5d4", bawah: "#4f5361", sepatu: "#3b2a20", sol: "#1f1612", kacamata: true, kantung: true };
/** si Hantu: gaun tidur putih kusam compang-camping, rambut hitam panjang menutupi wajah, kaki telanjang */
export const HANTU: Rupa = { nama: "Hantu", kulit: "#cfd9df", rambut: "#0e0c12", gayaRambut: "hantu", atasan: "gaun", baju: "#e2e1da", baju2: "#b9b8b2", bawah: "#e2e1da", sepatu: "#cfd9df", sol: "#cfd9df" };
/** si Psikopat (desain sendiri): topeng porselen putih retak dengan senyum merah dilukis, tudung hoodie hitam
 *  dinaikkan, celana kargo zaitun gelap, sepatu bot, membawa kapak */
export const PSIKO: Rupa = { nama: "Psikopat", kulit: "#f1efe8", rambut: "#1d1c22", gayaRambut: "topeng", atasan: "hoodie", celana: "kargo", baju: "#2a2930", baju2: "#8c8a92", bawah: "#3c3e33", sepatu: "#2a211b", sol: "#141010" };
export const PEMERAN = [JAKE, EMILY, MILLER, PSIKO];
// ---- PETAKA GUNUNG ----
/** Raka, pendaki: jaket hoodie hijau zaitun, celana kargo, rambut hitam acak, kulit sawo matang */
export const RAKA: Rupa = { nama: "Raka", celana: "kargo", kulit: "#e0b892", rambut: "#1c1714", gayaRambut: "acak", atasan: "hoodie", baju: "#4f5e3a", baju2: "#c9c2a8", bawah: "#3b3a33", sepatu: "#5a4632", sol: "#1e1812", kantung: true };
/** Sinta, pendaki: kemeja flanel merah marun, celana jins gelap, rambut hitam dikuncir, bawa senter */
export const SINTA: Rupa = { nama: "Sinta", celana: "jins", kulit: "#e9c4a0", rambut: "#16110f", gayaRambut: "kuncir", atasan: "flanel", baju: "#8e2f35", baju2: "#3d1418", bawah: "#2a3550", sepatu: "#6a5642", sol: "#231a14" };
/** "Sinta" yang ikut turun: sama persis, tapi kulit pucat kebiruan dan kantung mata gelap */
export const SINTA_PALSU: Rupa = { ...SINTA, nama: "Sinta?", kulit: "#c3ccd0", kantung: true };
/** Kakek penjaga pos: rompi cokelat lusuh, kemeja krem, celana kain, botak beruban, kacamata */
/** Bang Jaka, relawan SAR: rompi oranye di atas kaus abu, celana kargo, rambut hitam acak */
export const JAKA: Rupa = { nama: "Jaka", celana: "kargo", kulit: "#d4a77f", rambut: "#141110", gayaRambut: "acak", atasan: "rompi", baju: "#e2621b", baju2: "#4b525c", bawah: "#2f3530", sepatu: "#3a2c20", sol: "#15100c" };
/** Mbah Darmi, juru kunci gunung: kebaya lurik cokelat, kain jarik gelap, rambut putih disanggul (kuncir) */
export const MBAH: Rupa = { nama: "Mbah Darmi", celana: "kain", kulit: "#c99e7a", rambut: "#e2e0dc", gayaRambut: "kuncir", atasan: "rompi", baju: "#6b3d2a", baju2: "#cfb48a", bawah: "#3a2a22", sepatu: "#2a1e16", sol: "#120c08", kantung: true };
export const KAKEK: Rupa = { nama: "Kakek", celana: "kain", kulit: "#d9b896", rambut: "#c9c9cc", gayaRambut: "botak", atasan: "rompi", baju: "#5c4a38", baju2: "#ddd3bc", bawah: "#3f3b36", sepatu: "#2e231b", sol: "#17110c", kacamata: true, kantung: true };

// ukuran (unit desain) — sama dengan tokoh yang sudah disetujui
const U = { r: 85, hc: 310, neckW: 13.5, shY: 434, tw: 86, tBot: 618, shX: 70, l1: 118, l2: 110, rA: 17, hipY: 640, hipX: 32, ankY: 936, legR: 29 };

// ---------------- geometri ----------------
const ellPts = (cx: number, cy: number, rx: number, ry: number, n = 40, a0 = 0, a1 = Math.PI * 2): P2[] => {
  const o: P2[] = [];
  for (let i = 0; i < n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return o;
};
const arcPts = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 16): P2[] => {
  const o: P2[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return o;
};
const rotPts = (pts: P2[], a: number, c: P2): P2[] => pts.map(([x, y]) => [c[0] + (x - c[0]) * Math.cos(a) - (y - c[1]) * Math.sin(a), c[1] + (x - c[0]) * Math.sin(a) + (y - c[1]) * Math.cos(a)]);
const supPts = (cx: number, cy: number, rx: number, ry: number, nn: number, n = 40): P2[] => {
  const o: P2[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = 2 / nn;
    o.push([cx + rx * Math.sign(c) * Math.abs(c) ** e, cy + ry * Math.sign(s) * Math.abs(s) ** e]);
  }
  return o;
};
const capsule = (a: P2, b: P2, ra: number, rb: number, n = 12): P2[] => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), o: P2[] = [];
  for (let i = 0; i <= n; i++) { const t = ang - Math.PI / 2 + (Math.PI * i) / n; o.push([b[0] + rb * Math.cos(t), b[1] + rb * Math.sin(t)]); }
  for (let i = 0; i <= n; i++) { const t = ang + Math.PI / 2 + (Math.PI * i) / n; o.push([a[0] + ra * Math.cos(t), a[1] + ra * Math.sin(t)]); }
  return o;
};
const tube = (a: P2, b: P2, ra: number, rb: number, n = 12): P2[] => {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang), ny = Math.cos(ang), o: P2[] = [];
  o.push([b[0] + nx * rb, b[1] + ny * rb], [b[0] - nx * rb, b[1] - ny * rb]);
  for (let i = 0; i <= n; i++) { const t = ang - Math.PI / 2 - (Math.PI * i) / n; o.push([a[0] + ra * Math.cos(t), a[1] + ra * Math.sin(t)]); }
  return o;
};
const rbox = (cx: number, y0: number, y1: number, wTop: number, wBot: number, rTop: number, rBot: number): P2[] => {
  const o: P2[] = [], q = 6;
  const corner = (x: number, y: number, r: number, a0: number) => { for (let i = 0; i <= q; i++) { const a = a0 + (Math.PI / 2) * (i / q); o.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } };
  corner(cx + wTop - rTop, y0 + rTop, rTop, -Math.PI / 2);
  corner(cx + wBot - rBot, y1 - rBot, rBot, 0);
  corner(cx - wBot + rBot, y1 - rBot, rBot, Math.PI / 2);
  corner(cx - wTop + rTop, y0 + rTop, rTop, Math.PI);
  return o;
};
const smoothC = (pts: P2[], k = 6): P2[] => {
  const n = pts.length, o: P2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const f = (d: 0 | 1) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3);
      o.push([f(0), f(1)]);
    }
  }
  return o;
};
const ik = (S: P2, W: P2, l1: number, l2: number, pref: P2): P2 => {
  const dx = W[0] - S[0], dy = W[1] - S[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1, l1 + l2 - 0.5);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), th = Math.atan2(dy, dx);
  const e1: P2 = [S[0] + l1 * Math.cos(th + A), S[1] + l1 * Math.sin(th + A)], e2: P2 = [S[0] + l1 * Math.cos(th - A), S[1] + l1 * Math.sin(th - A)];
  const m: P2 = [(S[0] + W[0]) / 2, (S[1] + W[1]) / 2];
  const sc = (e: P2) => (e[0] - m[0]) * pref[0] + (e[1] - m[1]) * pref[1];
  return sc(e1) >= sc(e2) ? e1 : e2;
};

// ---------------- kuas ----------------
type G2 = CanvasRenderingContext2D;
const trace = (g: G2, pts: P2[], close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };
const ink = (g: G2, parts: P2[][], lw = LW) => { g.lineJoin = "round"; g.lineCap = "round"; g.strokeStyle = TINTA; g.lineWidth = lw * 2; for (const p of parts) { trace(g, p); g.stroke(); } };
const fill = (g: G2, pts: P2[], style: string | CanvasGradient) => { trace(g, pts); g.fillStyle = style; g.fill(); };
const line = (g: G2, pts: P2[], w: number, col = TINTA) => { g.lineJoin = "round"; g.lineCap = "round"; trace(g, pts, false); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
const dot = (g: G2, x: number, y: number, r: number, col: string) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = col; g.fill(); };
const outline = (g: G2, pts: P2[], w: number) => { trace(g, pts); g.strokeStyle = TINTA; g.lineWidth = w; g.lineJoin = "round"; g.stroke(); };
/** cel shading dua tingkat: isi warna bayangan, lalu salinan bentuk yang digeser ke arah cahaya diisi warna dasar
 *  (terpotong oleh bentuk aslinya) -> bulan sabit bayangan di sisi yang menjauhi cahaya */
const cel = (g: G2, pts: P2[], base: string, light: number, off: number, dark = shd(base)) => {
  fill(g, pts, dark);
  g.save(); trace(g, pts); g.clip();
  g.translate(Math.cos(light) * off, Math.sin(light) * off); fill(g, pts, base);
  g.restore();
};
/** cel shading untuk beberapa bentuk yang menyatu (lengan atas + lengan bawah + tangan): satu bayangan tanpa sambungan */
const celMulti = (g: G2, parts: P2[][], base: string, light: number, off: number) => {
  // tiap bentuk diisi sendiri (bentuk yang arah urutan titiknya berlawanan tidak saling melubangi)
  const dark = shd(base);
  for (const p of parts) fill(g, p, dark);
  for (const p of parts) {
    g.save(); trace(g, p); g.clip(); g.translate(Math.cos(light) * off, Math.sin(light) * off);
    for (const q of parts) fill(g, q, base);
    g.restore();
  }
};
const part = (g: G2, pts: P2[], base: string, light: number, off: number, lw = LW) => { ink(g, [pts], lw); cel(g, pts, base, light, off); };
/** gambar sesuatu terpotong oleh bentuk */
const within = (g: G2, pts: P2[], fn: () => void) => { g.save(); trace(g, pts); g.clip(); fn(); g.restore(); };

// ---------------- tangan bulat ----------------
type HandPose = "santai" | "buka" | "kepal" | "tunjuk";
/** tangan di pergelangan W, menunjuk ke sudut `ang`, jempol di sisi ts */
const handParts = (W: P2, ang: number, pose: HandPose, ts: number): { parts: P2[][]; lines: P2[][] } => {
  const phi = ang + Math.PI / 2, c = Math.cos(phi), s = Math.sin(phi);
  const T = (x: number, y: number): P2 => [W[0] + x * ts * c - y * s, W[1] + x * ts * s + y * c];
  const TL = (pts: P2[]) => pts.map(([x, y]) => T(x, y));
  const cap = (a: P2, b: P2, ra: number, rb: number) => capsule(T(...a), T(...b), ra, rb, 8);
  if (pose === "santai") return { parts: [TL(ellPts(0, -24, 20, 26, 32)), cap([12, -14], [17, -27], 7.5, 6.5)], lines: [] };
  if (pose === "buka") return { parts: [TL(ellPts(0, -27, 21, 28, 32)), cap([12, -12], [30, -26], 8, 7)], lines: [] };
  const fist = { parts: [TL(supPts(0, -20, 21, 19, 3, 32)), cap([13, -8], [2, -22], 7.5, 6.5)], lines: [-12, -4].map((x) => TL([[x, -37], [x, -29]])) };
  if (pose === "kepal") return fist;
  return { parts: [...fist.parts, cap([9, -34], [9, -64], 7, 6)], lines: fist.lines }; // tunjuk: telunjuk keluar
};

type ArmG = { S: P2; E: P2; W: P2; ang: number; pose: HandPose; front: boolean; ts: number; senter: boolean; kapak: boolean; hp: PoseLengan | null };
const armGeom = (s: number, L: Lengan | undefined): ArmG => {
  const spec: Lengan = L ?? { pose: "turun" };
  const S: P2 = [300 + s * U.shX, U.shY + 22];
  const sw = spec.ayun ?? 0, k = spec.pose === "turun" ? 0 : ease(spec.k ?? 1), w = spec.w ?? 0;
  const Wd: P2 = [300 + s * (U.shX + 20) - s * 6 * Math.max(0, sw), S[1] + U.l1 + U.l2 - 1 - 8 * Math.abs(sw)];
  let W = Wd, l2 = U.l2, pref: P2 = [s, 0.3];
  switch (spec.pose) {
    case "dadah": W = lerp2(Wd, [300 + s * (U.shX + 86 + 12 * w), U.shY - 112 + 6 * Math.abs(w)], k); pref = [s * 0.8, 0.6]; break;
    case "takut": W = lerp2(Wd, [300 + s * (U.shX - 22) + 4 * w, U.shY + 66], k); l2 = lerp(U.l2, U.l2 * 0.45, k); pref = [s, 0.2]; break;
    case "senter": W = lerp2(Wd, [300 + s * (U.shX + 52), U.shY + 118], k); l2 = lerp(U.l2, U.l2 * 0.7, k); pref = [s, 0.5]; break;
    case "tunjuk": W = lerp2(Wd, [300 + s * (U.shX + 205), U.shY + 40], k); pref = [s * 0.2, 1]; break;
    case "kapak": W = lerp2(Wd, [300 + s * (U.shX + 26), S[1] + U.l1 + U.l2 - 6], k); break;
    case "telepon": W = lerp2(Wd, [300 + s * 70, U.hc + 46], k); pref = [s, 0.6]; break;
    case "hp": W = lerp2(Wd, [300 + s * (U.shX - 34), U.shY + 104], k); l2 = lerp(U.l2, U.l2 * 0.5, k); pref = [s, 0.15]; break;
    case "lari": { const u = (w + 1) / 2; W = [300 + s * (U.shX + 16 - 26 * u), U.shY + 168 - 92 * u]; l2 = U.l2 * 0.62; pref = [s, 0.45]; break; }
  }
  const E = ik(S, W, U.l1, l2, pref);
  let ang = Math.atan2(W[1] - E[1], W[0] - E[0]), pose: HandPose = "santai";
  if (spec.pose === "dadah" && k > 0.3) { ang += k * (0.3 * w + s * 0.15); pose = "buka"; }
  if (spec.pose === "takut" && k > 0.4) { ang = -Math.PI / 2 - s * 0.35; pose = "buka"; }
  if (spec.pose === "senter" && k > 0.4) { ang = Math.PI / 2 - s * 0.5; pose = "kepal"; }
  if (spec.pose === "tunjuk" && k > 0.4) pose = "tunjuk";
  if (spec.pose === "telepon" && k > 0.4) { ang = -Math.PI / 2 - s * 0.25; pose = "kepal"; }
  if (spec.pose === "hp" && k > 0.4) { ang = -Math.PI / 2 + s * 0.3; pose = "kepal"; }
  if (spec.pose === "kapak" && k > 0.4) { ang = Math.PI / 2 - s * 0.12; pose = "kepal"; }
  if (spec.pose === "lari") { ang = Math.atan2(W[1] - E[1], W[0] - E[0]) - s * 0.4; pose = "kepal"; }
  const phi = ang + Math.PI / 2, vx = Math.cos(phi), vy = Math.sin(phi);
  const ts = Math.abs(vx) > 0.3 ? (vx * (300 - W[0]) >= 0 ? 1 : -1) : vy <= 0 ? 1 : -1;
  const front = (spec.pose === "takut" || spec.pose === "telepon" || spec.pose === "hp") && k > 0.05;
  return { S, E, W, ang, pose, front, ts, senter: spec.pose === "senter" && k > 0.4, kapak: spec.pose === "kapak" && k > 0.4, hp: (spec.pose === "telepon" || spec.pose === "hp") && k > 0.4 ? spec.pose : null };
};

/** lengan seperti video "Tokoh Baru": lengan baju pendek, lengan kulit menyambung langsung ke tangan bulat (satu garis
 *  luar, satu bayangan). layer: "atas" = lengan atas + lengan baju, "bawah" = lengan bawah + tangan (pose di depan badan) */
const drawArm = (g: G2, R: Rupa, A: ArmG, light: number, layer: "semua" | "atas" | "bawah", G: Gaya) => {
  const skin = R.kulit, gaun = R.atasan === "gaun";
  const hand = handParts(A.W, A.ang, A.pose, A.ts);
  const upper = capsule(A.S, A.E, U.rA, U.rA - 0.5), fore = capsule(A.E, A.W, U.rA - 0.5, U.rA - 1.5);
  const slCol = R.atasan === "rompi" ? R.baju2 : R.baju;
  const sl = tube(A.S, lerp2(A.S, A.E, gaun ? 0.8 : 0.55), U.rA + 6, U.rA + 5);
  const slDraw = () => {
    cel(g, sl, slCol, light, 5);
    if (R.atasan === "flanel") within(g, sl, () => { g.globalAlpha = 0.45; line(g, [lerp2(A.S, A.E, 0.2), lerp2(A.S, A.E, 0.2)].map(([x, y], i) => [x + (i ? 40 : -40), y] as P2), 8, R.baju2); g.globalAlpha = 1; });
    outline(g, sl, LW * 0.9);
  };
  const lines = () => { for (const l of hand.lines) line(g, l, 3.2, mix(TINTA, skin, 0.3)); };
  const behind = () => { if (A.senter) senter(g, A, G.sorot ?? false, "belakang"); if (A.kapak) kapak(g, A); };
  const front = () => { if (A.senter) senter(g, A, false, "depan"); if (A.hp) ponsel(g, A); };
  if (layer === "semua") {
    behind();
    ink(g, [upper, fore, sl, ...hand.parts]);
    celMulti(g, [upper, fore, ...hand.parts], skin, light, 4); lines();
    slDraw(); front();
  } else if (layer === "atas") {
    ink(g, [upper, sl]); cel(g, upper, skin, light, 4); slDraw();
  } else {
    behind();
    ink(g, [fore, ...hand.parts]); celMulti(g, [fore, ...hand.parts], skin, light, 4); lines(); front();
  }
};

/** ponsel di kepalan: "telepon" menempel di telinga, "hp" di depan dada dengan layar menyala */
const ponsel = (g: G2, A: ArmG) => {
  const fc: P2 = [A.W[0] + 22 * Math.cos(A.ang), A.W[1] + 22 * Math.sin(A.ang)];
  const s = A.W[0] > 300 ? 1 : -1;
  if (A.hp === "telepon") {
    const ph = rotPts(rbox(fc[0] - s * 16, fc[1] - 44, fc[1] + 20, 11, 11, 5, 5), s * 0.2, fc);
    ink(g, [ph], 4); fill(g, ph, "#23232b");
    return;
  }
  const ph = rbox(fc[0], fc[1] - 58, fc[1] + 6, 20, 20, 6, 6), scr = rbox(fc[0], fc[1] - 52, fc[1], 15, 15, 3, 3);
  ink(g, [ph], 4); fill(g, ph, "#23232b"); fill(g, scr, "#bfe3ff");
  g.save(); g.globalAlpha = 0.5; fill(g, rbox(fc[0], fc[1] - 46, fc[1] - 38, 11, 11, 3, 3), "#ffffff"); g.restore();
};

/** kapak digenggam di tangan yang menggantung, kepala kapak di dekat lutut (kartun, tanpa darah) */
const kapak = (g: G2, A: ArmG) => {
  const s = A.W[0] > 300 ? 1 : -1, fc: P2 = [A.W[0] + 20 * Math.cos(A.ang), A.W[1] + 20 * Math.sin(A.ang)];
  const top: P2 = [fc[0] - s * 4, fc[1] - 34], bot: P2 = [fc[0] + s * 26, fc[1] + 196];
  const handle = capsule(top, bot, 7.5, 8.5);
  const d = Math.hypot(bot[0] - top[0], bot[1] - top[1]), ux = (bot[0] - top[0]) / d, uy = (bot[1] - top[1]) / d, nx = -uy * s, ny = ux * s;
  const at = (a: number, b: number): P2 => [bot[0] - ux * a + nx * b, bot[1] - uy * a + ny * b];
  const head = smoothC([at(48, -10), at(54, 30), at(64, 58), at(30, 66), at(-4, 58), at(8, 28), at(4, -10)], 3);
  ink(g, [head, handle]);
  cel(g, handle, "#8a5a34", -2.3, 3);
  cel(g, head, "#9aa3ad", -2.3, 5);
  line(g, [at(58, 56), at(28, 63), at(0, 56)], 3.2, "#e6ecf2");
};

/** senter di kepalan (mengarah keluar, sedikit ke bawah); sorot kuning lembut bila diminta */
const senter = (g: G2, A: ArmG, sorot: boolean, lapis: "belakang" | "depan") => {
  const s = A.W[0] > 300 ? 1 : -1, dir: P2 = [s * Math.cos(0.32), Math.sin(0.32)];
  const fc: P2 = [A.W[0] + 20 * Math.cos(A.ang), A.W[1] + 20 * Math.sin(A.ang)];
  const c0: P2 = [fc[0] - dir[0] * 34, fc[1] - dir[1] * 34], c1: P2 = [fc[0] + dir[0] * 44, fc[1] + dir[1] * 44];
  if (lapis === "belakang") {
    if (sorot) {
      const L = 430, sp = 0.3, a = Math.atan2(dir[1], dir[0]);
      const beam: P2[] = [[c1[0] - dir[1] * 12 * s, c1[1] + dir[0] * 12 * s], [c1[0] + Math.cos(a - sp) * L, c1[1] + Math.sin(a - sp) * L], [c1[0] + Math.cos(a + sp) * L, c1[1] + Math.sin(a + sp) * L], [c1[0] + dir[1] * 12 * s, c1[1] - dir[0] * 12 * s]];
      const gr = g.createRadialGradient(c1[0], c1[1], 5, c1[0], c1[1], L);
      gr.addColorStop(0, "rgba(255,240,170,0.75)"); gr.addColorStop(1, "rgba(255,240,170,0)");
      fill(g, beam, gr);
    }
    const body = capsule(c0, c1, 9, 10.5);
    ink(g, [body]); cel(g, body, "#3a3b45", -2.3, 3);
    return;
  }
  const head = capsule([c1[0] - dir[0] * 4, c1[1] - dir[1] * 4], [c1[0] + dir[0] * 6, c1[1] + dir[1] * 6], 14, 14);
  ink(g, [head]); fill(g, head, "#4a4b55");
  const lens = rotPts(ellPts(c1[0] + dir[0] * 8, c1[1] + dir[1] * 8, 4, 12, 20), Math.atan2(dir[1], dir[0]), [c1[0] + dir[0] * 8, c1[1] + dir[1] * 8]);
  fill(g, lens, "#fff3b0"); outline(g, lens, 2.5);
};

// ---------------- wajah ----------------
type Face = { eye: number; pupil: number; brow: [number, number]; mouth: "garis" | "senyum" | "gelombang" | "takut" | "O" | "teriak" | "seringai" | "cemberut"; lid: number; keringat: boolean; kantung: boolean };
const FACE: Record<Ekspresi, Face> = {
  datar: { eye: 1, pupil: 0.48, brow: [0, 0], mouth: "garis", lid: 0, keringat: false, kantung: false },
  senyum: { eye: 1, pupil: 0.48, brow: [-2, -1], mouth: "senyum", lid: 0, keringat: false, kantung: false },
  cemas: { eye: 1.05, pupil: 0.42, brow: [-7, 2], mouth: "gelombang", lid: 0, keringat: true, kantung: true },
  takut: { eye: 1.25, pupil: 0.3, brow: [-10, 0], mouth: "takut", lid: 0, keringat: true, kantung: true },
  kaget: { eye: 1.45, pupil: 0.22, brow: [-14, -12], mouth: "O", lid: 0, keringat: false, kantung: false },
  teriak: { eye: 1.3, pupil: 0.2, brow: [-12, -4], mouth: "teriak", lid: 0, keringat: true, kantung: false },
  seram: { eye: 1, pupil: 0.4, brow: [4, -5], mouth: "seringai", lid: 0.42, keringat: false, kantung: true },
  // nama yang sama dengan emosi suara (suara.py)
  senang: { eye: 1.05, pupil: 0.5, brow: [-4, -3], mouth: "senyum", lid: 0, keringat: false, kantung: false },
  sedih: { eye: 0.95, pupil: 0.46, brow: [-8, 4], mouth: "cemberut", lid: 0.25, keringat: false, kantung: true },
  marah: { eye: 0.95, pupil: 0.4, brow: [7, -4], mouth: "garis", lid: 0.15, keringat: false, kantung: false },
  bisik: { eye: 1.1, pupil: 0.36, brow: [-7, 1], mouth: "gelombang", lid: 0, keringat: true, kantung: true },
};

const face = (g: G2, cx: number, cy: number, R: Rupa, G: Gaya) => {
  const r = U.r, F = FACE[G.wajah] ?? FACE.datar, look = G.lihat ?? [0, 0], lid = Math.max(F.lid, G.kedip ?? 0);
  const ex = 0.3 * r, ey = cy + 0.1 * r, erx = 0.13 * r * F.eye, ery = 0.155 * r * F.eye, skin = R.kulit;
  const hantu = R.gayaRambut === "hantu";
  if (R.gayaRambut === "topeng") { topeng(g, cx, cy, look); return; }
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (hantu) { // mata hantu: hitam pekat, pupil putih kecil, lingkar gelap
      dot(g, x, ey, erx * 1.6, mix(skin, "#3a3550", 0.55));
      const sc = ellPts(x, ey, erx * 1.05, ery * 1.05, 28); fill(g, sc, "#0a080c");
      dot(g, x + look[0] * 3, ey + 1, erx * 0.22, "#f4f4f4");
      continue;
    }
    if (F.kantung || R.kantung) line(g, arcPts(x, ey + ery * 0.55, erx * 0.95, ery * 0.6, Math.PI * 0.2, Math.PI * 0.8, 10), 2.8, shd(skin, 0.68));
    if (lid >= 0.95) { line(g, arcPts(x, ey - 1, erx, ery * 0.25, Math.PI * 0.1, Math.PI * 0.9, 12), 4); }
    else {
      const sc = ellPts(x, ey, erx, ery, 28);
      fill(g, sc, "#ffffff");
      within(g, sc, () => {
        dot(g, x + look[0] * erx * 0.4, ey + 1 + look[1] * ery * 0.3, erx * F.pupil, "#141016");
        if (lid > 0) { const yl = ey - ery + 2 * ery * lid; g.fillStyle = shd(skin, 0.92); g.fillRect(x - erx - 2, ey - ery - 2, 2 * erx + 4, yl - (ey - ery) + 2); line(g, [[x - erx, yl], [x + erx, yl]], 3.2); }
      });
      outline(g, sc, 3.4);
    }
    const [bi, bo] = F.brow, by = ey - ery - 11;
    line(g, [[x - s * 0.12 * r, by + bi], [x, by - 3 + (bi + bo) / 2], [x + s * 0.12 * r, by + bo]], 4.2);
  }
  if (hantu) return; // mulut hantu tertutup rambut
  const mx = cx + 2 * (G.hadap ?? 0), my = cy + 0.48 * r;
  if (G.bicara !== undefined && G.bicara > 0.06) { // mulut bergerak mengikuti suara
    const b = clamp(G.bicara, 0, 1), wide = F.mouth === "senyum" || F.mouth === "seringai" ? 17 : 13;
    if (F.mouth === "takut" || F.mouth === "cemberut" || F.mouth === "gelombang" || F.mouth === "O") { // PETAKA GUNUNG: bicara ketakutan = mulut oval, bukan senyum
      const o = ellPts(mx, my + 2, 8 + 3 * b, 4 + 13 * b, 24);
      fill(g, o, "#3d1220"); outline(g, o, 3.6);
      return;
    }
    const rx = wide + 4 * b, ry = 3 + (F.mouth === "teriak" ? 24 : 17) * b, top = my - 6;
    const sh: P2[] = [[mx - rx, top], [mx + rx, top]];
    for (let i = 1; i < 16; i++) { const a = (Math.PI * i) / 16; sh.push([mx + rx * Math.cos(a), top + ry * Math.sin(a)]); }
    fill(g, sh, "#3d1220");
    within(g, sh, () => { if (ry > 9) dot(g, mx + 1, top + ry + 6, rx * 0.7, "#c8606c"); if (F.mouth === "senyum" || F.mouth === "garis") { g.fillStyle = "#f4f1ea"; g.fillRect(mx - rx, top - 1, 2 * rx, 5); } });
    outline(g, sh, 3.6);
    return;
  }
  const mouthShape = (rx: number, ry: number, top: number, wavy = false): P2[] => {
    const sh: P2[] = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; sh.push([mx - rx + 2 * rx * t, top + (wavy ? 2.2 * Math.sin(t * Math.PI * 4) : 0)]); }
    for (let i = 1; i < 16; i++) { const a = (Math.PI * i) / 16; sh.push([mx + rx * Math.cos(a), top + ry * Math.sin(a)]); }
    return sh;
  };
  const dark = (sh: P2[], tongue = true) => { fill(g, sh, "#3d1220"); if (tongue) within(g, sh, () => dot(g, mx + 1, sh[0][1] + 40, 26, "#c8606c")); outline(g, sh, 3.6); };
  switch (F.mouth) {
    case "garis": line(g, [[mx - 11, my - 4], [mx + 11, my - 5]], 4); break;
    case "cemberut": line(g, arcPts(mx, my + 2, 13, 7, Math.PI * 1.15, Math.PI * 1.85, 12), 4); break;
    case "senyum": line(g, arcPts(mx, my - 9, 15, 9, Math.PI * 0.15, Math.PI * 0.85, 12), 4); break;
    case "gelombang": { const p: P2[] = []; for (let i = 0; i <= 12; i++) p.push([mx - 14 + i * 2.3, my - 4 + 2.4 * Math.sin(i * 1.4)]); line(g, p, 3.8); break; }
    case "takut": dark(mouthShape(14, 9, my - 6, true), false); break;
    case "O": { const o = ellPts(mx, my, 9, 13, 24); dark(o, false); break; }
    case "teriak": { const o = ellPts(mx, my + 2, 15, 22, 28); fill(g, o, "#3d1220"); within(g, o, () => { dot(g, mx, my + 26, 14, "#c8606c"); g.fillStyle = "#f4f1ea"; g.fillRect(mx - 16, my - 22, 32, 8); }); outline(g, o, 3.8); break; }
    case "seringai": {
      const sh: P2[] = [...arcPts(mx, my - 14, 26, 8, Math.PI * 0.05, Math.PI * 0.95, 14).reverse(), ...arcPts(mx, my - 14, 24, 16, Math.PI * 0.1, Math.PI * 0.9, 14)];
      fill(g, sh, "#f1ede2"); for (const t of [-14, -5, 4, 13]) line(g, [[mx + t, my - 8], [mx + t, my + 1]], 2.2, mix(TINTA, "#ffffff", 0.35));
      outline(g, sh, 3.6);
      for (const s of [-1, 1]) line(g, arcPts(mx + s * 30, my - 14, 6, 8, s < 0 ? Math.PI * 0.6 : -Math.PI * 0.6, s < 0 ? Math.PI * 1.2 : 0, 6), 3, shd(skin, 0.6));
      break;
    }
  }
  if (F.keringat) { // tetes keringat dingin
    const x = cx - 0.8 * r, y = cy - 0.4 * r, drop: P2[] = [[x, y - 14], [x + 7, y + 1], ...arcPts(x, y + 2, 7, 7, 0, Math.PI, 8), [x - 7, y + 1]];
    fill(g, drop, "#9fd4f0"); outline(g, drop, 2.8); dot(g, x - 2, y + 1, 2, "#ffffff");
  }
};

/** topeng porselen: retakan, lubang mata hitam dengan kilat kecil, senyum merah dilukis */
const topeng = (g: G2, cx: number, cy: number, look: [number, number]) => {
  const r = U.r, ey = cy + 0.06 * r;
  for (const s of [-1, 1]) {
    const hole = smoothC([[cx + s * 0.14 * r, ey], [cx + s * 0.3 * r, ey - 0.12 * r], [cx + s * 0.46 * r, ey - 0.02 * r], [cx + s * 0.3 * r, ey + 0.08 * r]], 4);
    fill(g, hole, "#0b090d"); outline(g, hole, 3);
    dot(g, cx + s * 0.3 * r + look[0] * 4, ey - 0.02 * r, 2.6, "#f0f0f0");
    line(g, [[cx + s * 0.16 * r, ey - 0.2 * r], [cx + s * 0.44 * r, ey - 0.16 * r]], 3, "#9a968c");
  }
  const sm = arcPts(cx, cy + 0.2 * r, 0.42 * r, 0.3 * r, Math.PI * 0.12, Math.PI * 0.88, 18);
  line(g, sm, 6, "#a82a2e");
  for (let i = 2; i < 17; i += 3) { const [x, y] = sm[i]; line(g, [[x, y - 6], [x, y + 6]], 2.4, "#6e1a1d"); }
  line(g, [[cx - 0.62 * r, cy - 0.6 * r], [cx - 0.42 * r, cy - 0.34 * r], [cx - 0.48 * r, cy - 0.12 * r], [cx - 0.3 * r, cy + 0.02 * r]], 2.6, "#5b5650");
  line(g, [[cx - 0.42 * r, cy - 0.34 * r], [cx - 0.22 * r, cy - 0.42 * r]], 2.2, "#5b5650");
  line(g, [[cx + 0.5 * r, cy + 0.5 * r], [cx + 0.38 * r, cy + 0.66 * r], [cx + 0.46 * r, cy + 0.8 * r]], 2.2, "#5b5650");
};

const glasses = (g: G2, cx: number, cy: number) => {
  const r = U.r, ey = cy + 0.1 * r;
  for (const s of [-1, 1]) {
    const c: P2 = [cx + s * 0.3 * r, ey], lens = ellPts(c[0], c[1], 0.2 * r, 0.18 * r, 28);
    g.save(); g.globalAlpha = 0.28; fill(g, lens, "#cfe8ff"); g.restore();
    line(g, [[c[0] - 0.1 * r, c[1] - 0.06 * r], [c[0] - 0.02 * r, c[1] - 0.12 * r]], 3, "rgba(255,255,255,0.85)");
    outline(g, lens, 3.6);
    line(g, [[c[0] + s * 0.2 * r, c[1] - 0.03 * r], [c[0] + s * 0.4 * r, c[1] - 0.08 * r]], 3.4);
  }
  line(g, arcPts(cx, ey - 0.06 * r, 0.1 * r, 0.05 * r, Math.PI * 1.1, Math.PI * 1.9, 8), 3.4);
};

// ---------------- rambut ----------------
/** rambut di belakang kepala & badan (digambar sebelum badan) */
const hairBack = (g: G2, R: Rupa, light: number) => {
  const cx = 300, cy = U.hc, r = U.r;
  if (R.gayaRambut === "kuncir" && R.sanggul) {
    const back = smoothC([[cx - 0.98 * r, cy - 0.4 * r], [cx - 0.96 * r, cy + 0.4 * r], [cx - 0.6 * r, cy + 0.62 * r], [cx + 0.6 * r, cy + 0.62 * r], [cx + 0.96 * r, cy + 0.4 * r], [cx + 0.98 * r, cy - 0.4 * r], [cx, cy - 1.0 * r]], 5);
    const bun = ellPts(cx, cy - 1.02 * r, 0.42 * r, 0.34 * r, 28);
    ink(g, [back, bun]); cel(g, back, R.rambut, light, 10); cel(g, bun, R.rambut, light, 8);
    line(g, arcPts(cx, cy - 1.02 * r, 0.26 * r, 0.18 * r, Math.PI * 1.1, Math.PI * 1.9, 10), 2.6, shd(R.rambut, 0.62));
  } else if (R.gayaRambut === "kuncir") {
    const back = smoothC([[cx - 0.98 * r, cy - 0.4 * r], [cx - 0.98 * r, cy + 0.6 * r], [cx - 0.7 * r, cy + 1.02 * r], [cx + 0.7 * r, cy + 1.02 * r], [cx + 0.98 * r, cy + 0.6 * r], [cx + 0.98 * r, cy - 0.4 * r], [cx, cy - 1.0 * r]], 5);
    const tail = capsule([cx + 0.78 * r, cy - 0.62 * r], [cx + 1.22 * r, cy + 1.05 * r], 0.24 * r, 0.1 * r);
    ink(g, [back, tail]); cel(g, back, R.rambut, light, 10); cel(g, tail, R.rambut, light, 8);
    for (const t of [0.35, 0.6]) { const a = lerp2([cx + 0.82 * r, cy - 0.5 * r], [cx + 1.18 * r, cy + 0.95 * r], t); line(g, [[a[0] - 8, a[1] - 6], [a[0] + 2, a[1] + 14]], 2.6, shd(R.rambut, 0.62)); }
  } else if (R.gayaRambut === "topeng") { // tudung hoodie di belakang kepala, jatuh ke pundak
    const back = smoothC([[cx - 1.24 * r, cy - 0.1 * r], [cx - 1.2 * r, cy + 0.9 * r], [cx - U.tw + 4, U.shY + 20], [cx + U.tw - 4, U.shY + 20], [cx + 1.2 * r, cy + 0.9 * r], [cx + 1.24 * r, cy - 0.1 * r], [cx + 0.8 * r, cy - 1.18 * r], [cx, cy - 1.32 * r], [cx - 0.8 * r, cy - 1.18 * r]], 5);
    part(g, back, R.rambut, light, 10);
  } else if (R.gayaRambut === "hantu") {
    const back = smoothC([[cx - 1.06 * r, cy - 0.5 * r], [cx - 1.18 * r, cy + 1.4 * r], [cx - 1.14 * r, U.tBot - 40], [cx - 0.8 * r, U.tBot + 10], [cx - 0.4 * r, U.tBot - 18], [cx, U.tBot + 14], [cx + 0.42 * r, U.tBot - 14], [cx + 0.82 * r, U.tBot + 8], [cx + 1.16 * r, U.tBot - 44], [cx + 1.18 * r, cy + 1.4 * r], [cx + 1.06 * r, cy - 0.5 * r], [cx, cy - 1.08 * r]], 4);
    part(g, back, R.rambut, light, 10);
  }
};

/** rambut di atas kepala / di depan wajah (sesudah kepala) */
const hairFront = (g: G2, R: Rupa, light: number, fx: number) => {
  const cx = 300, cy = U.hc, r = U.r;
  const cap = (pts: P2[]) => { const p = smoothC(pts, 3); part(g, p, R.rambut, light, 9); return p; };
  const topArc = (r0: number, a0 = 0.98, a1 = 2.02, bump = 0): P2[] => {
    const o: P2[] = [];
    for (let i = 0; i <= 22; i++) { const a = Math.PI * (a0 + (a1 - a0) * (i / 22)), rr = r * (r0 + bump * (i % 2 ? 0.05 : 0)); o.push([cx + rr * Math.cos(a), cy - 2 + rr * 1.01 * Math.sin(a)]); }
    return o;
  };
  if (R.gayaRambut === "acak") {
    const p = cap([...topArc(1.05, 0.98, 2.02, 1), [cx + 0.97 * r, cy - 0.04 * r], [cx + 0.74 * r, cy - 0.3 * r], [cx + 0.46 * r, cy - 0.42 * r], [cx + 0.3 * r, cy - 0.3 * r],
      [cx + 0.1 * r, cy - 0.46 * r], [cx - 0.16 * r, cy - 0.32 * r], [cx - 0.36 * r, cy - 0.46 * r], [cx - 0.66 * r, cy - 0.3 * r], [cx - 0.98 * r, cy - 0.02 * r]].map(([x, y]) => [x + fx * 0.2, y] as P2));
    line(g, [[cx - 0.05 * r, cy - 1.02 * r], [cx + 0.08 * r, cy - 1.22 * r], [cx + 0.18 * r, cy - 1.08 * r]], 6, R.rambut); // jambul berdiri
    line(g, [[cx - 0.5 * r, cy - 0.8 * r], [cx - 0.2 * r, cy - 0.92 * r]], 4.5, mix(R.rambut, "#ffffff", 0.2));
    void p;
  } else if (R.gayaRambut === "kuncir") {
    cap([...topArc(1.05), [cx + 0.98 * r, cy + 0.32 * r], [cx + 0.86 * r, cy + 0.36 * r], [cx + 0.8 * r, cy - 0.12 * r], [cx + 0.5 * r, cy - 0.34 * r], [cx + 0.1 * r, cy - 0.5 * r],
      [cx - 0.36 * r, cy - 0.46 * r], [cx - 0.72 * r, cy - 0.22 * r], [cx - 0.82 * r, cy + 0.36 * r], [cx - 0.98 * r, cy + 0.32 * r]].map(([x, y]) => [x + fx * 0.2, y] as P2));
    if (!R.sanggul) { dot(g, cx + 0.86 * r, cy - 0.66 * r, 0.11 * r, "#2f6f8f"); outline(g, ellPts(cx + 0.86 * r, cy - 0.66 * r, 0.11 * r, 0.11 * r, 16), 3.2); } // ikat rambut
    line(g, [[cx - 0.48 * r, cy - 0.82 * r], [cx - 0.16 * r, cy - 0.94 * r]], 4.5, mix(R.rambut, "#ffffff", 0.25));
  } else if (R.gayaRambut === "botak") {
    for (const s of [-1, 1]) {
      const tuft = smoothC([[cx + s * 0.86 * r, cy - 0.42 * r], [cx + s * 1.08 * r, cy - 0.3 * r], [cx + s * 1.1 * r, cy - 0.02 * r], [cx + s * 1.04 * r, cy + 0.24 * r], [cx + s * 0.9 * r, cy + 0.12 * r], [cx + s * 0.94 * r, cy - 0.12 * r]], 4);
      part(g, tuft, R.rambut, light, 5, 4.5);
    }
    line(g, [[cx - 0.4 * r, cy - 0.78 * r], [cx - 0.12 * r, cy - 0.9 * r]], 6, "rgba(255,255,255,0.75)"); // kilap botak
    for (const k of [0, 1, 2]) line(g, arcPts(cx, cy - 0.38 * r - k * 0.1 * r, 0.26 * r - k * 0.03 * r, 0.05 * r, Math.PI * 1.15, Math.PI * 1.85, 8), 2.6, shd(R.kulit, 0.62)); // kerut dahi
  } else if (R.gayaRambut === "topeng") { // pinggiran tudung di sekeliling topeng
    const outer = arcPts(cx, cy + 0.02 * r, 1.22 * r, 1.27 * r, Math.PI * 0.78, Math.PI * 2.22, 30);
    const inner = arcPts(cx, cy + 0.06 * r, 0.93 * r, 0.98 * r, Math.PI * 0.8, Math.PI * 2.2, 30).reverse();
    const rim = [...outer, [cx + 0.86 * r, cy + 1.0 * r] as P2, ...inner, [cx - 0.86 * r, cy + 1.0 * r] as P2];
    part(g, rim, R.rambut, light, 8);
    line(g, arcPts(cx, cy + 0.06 * r, 0.96 * r, 1.01 * r, Math.PI * 0.85, Math.PI * 2.15, 26), 7, "#0d0c10");
    line(g, arcPts(cx, cy - 0.1 * r, 1.08 * r, 1.12 * r, Math.PI * 1.3, Math.PI * 1.6, 8), 3, mix(R.rambut, "#ffffff", 0.18));
  } else { // hantu: tirai rambut menutupi wajah, hanya celah di mata kanan layar
    const top = topArc(1.07, 0.96, 2.04);
    const left = smoothC([[cx - 1.07 * r, cy - 0.2 * r], [cx - 1.0 * r, cy + 1.25 * r], [cx - 0.7 * r, cy + 1.55 * r], [cx - 0.42 * r, cy + 1.32 * r], [cx - 0.12 * r, cy + 1.62 * r], [cx + 0.14 * r, cy + 1.3 * r], [cx + 0.16 * r, cy - 0.2 * r], [cx, cy - 0.7 * r]], 4);
    const right = smoothC([[cx + 0.5 * r, cy - 0.3 * r], [cx + 0.48 * r, cy + 1.3 * r], [cx + 0.72 * r, cy + 1.58 * r], [cx + 0.98 * r, cy + 1.3 * r], [cx + 1.07 * r, cy - 0.2 * r], [cx + 0.8 * r, cy - 0.7 * r]], 4);
    const crown = smoothC([...top, [cx + 0.9 * r, cy - 0.3 * r], [cx + 0.34 * r, cy - 0.48 * r], [cx - 0.9 * r, cy - 0.3 * r]], 3);
    ink(g, [crown, left, right]);
    for (const p of [crown, left, right]) cel(g, p, R.rambut, light, 7);
    for (const x of [-0.7, -0.35, 0.75]) line(g, [[cx + x * r, cy - 0.2 * r], [cx + (x + 0.05) * r, cy + 1.1 * r]], 2.4, "#2a2633");
  }
};


// ---------------- ciri khas: penutup kepala & wajah ----------------
const topiDepan = (g: G2, R: Rupa, light: number, fx: number) => {
  if (!R.topi) return;
  const cx = 300 + fx * 0.2, cy = U.hc, r = U.r, c1 = R.topiWarna ?? "#a8322c", c2 = R.topiWarna2 ?? mix(c1, "#ffffff", 0.35);
  if (R.topi === "kupluk") {
    const dome = smoothC([...arcPts(cx, cy - 0.38 * r, 1.08 * r, 0.86 * r, Math.PI, Math.PI * 2, 20), [cx + 1.1 * r, cy - 0.3 * r], [cx - 1.1 * r, cy - 0.3 * r]], 3);
    part(g, dome, c1, light, 9);
    within(g, dome, () => { for (let x = -0.9; x <= 0.9; x += 0.3) line(g, [[cx + x * r, cy - 1.2 * r], [cx + x * 0.92 * r, cy - 0.5 * r]], 2.4, shd(c1, 0.8)); });
    const band = rbox(cx, cy - 0.62 * r, cy - 0.28 * r, 1.12 * r, 1.12 * r, 10, 10);
    part(g, band, shd(c1, 0.9), light, 5);
    within(g, band, () => { for (let x = -1.1; x <= 1.1; x += 0.16) line(g, [[cx + x * r, cy - 0.62 * r], [cx + x * r, cy - 0.28 * r]], 2, shd(c1, 0.7)); });
    const pom = ellPts(cx, cy - 1.3 * r, 0.24 * r, 0.22 * r, 20); part(g, pom, c2, light, 5, 4);
  } else if (R.topi === "caping") {
    const cone = smoothC([[cx - 1.95 * r, cy - 0.42 * r], [cx - 0.5 * r, cy - 1.12 * r], [cx, cy - 1.42 * r], [cx + 0.5 * r, cy - 1.12 * r], [cx + 1.95 * r, cy - 0.42 * r], [cx + 1.6 * r, cy - 0.3 * r], [cx, cy - 0.46 * r], [cx - 1.6 * r, cy - 0.3 * r]], 3);
    part(g, cone, c1, light, 10);
    within(g, cone, () => { for (const t of [-0.8, -0.5, -0.2, 0.1, 0.4, 0.7]) line(g, [[cx, cy - 1.42 * r], [cx + t * 2.4 * r, cy - 0.3 * r]], 2.2, shd(c1, 0.72)); for (const k of [0.3, 0.6]) line(g, arcPts(cx, cy - 1.42 * r, 1.95 * r * k, 1.0 * r * k, Math.PI * 0.12, Math.PI * 0.88, 14), 2, shd(c1, 0.72)); });
    line(g, [[cx - 0.86 * r, cy - 0.36 * r], [cx - 0.7 * r, cy + 0.9 * r]], 2.2, shd(c1, 0.55)); // tali
  } else if (R.topi === "udeng") {
    const band = smoothC([...arcPts(cx, cy - 0.1 * r, 1.07 * r, 0.62 * r, Math.PI * 1.02, Math.PI * 1.98, 18), ...arcPts(cx, cy + 0.02 * r, 1.04 * r, 0.42 * r, Math.PI * 1.98, Math.PI * 1.02, 18)], 2);
    part(g, band, c1, light, 6);
    const peak: P2[] = smoothC([[cx - 0.34 * r, cy - 0.62 * r], [cx - 0.08 * r, cy - 1.12 * r], [cx + 0.1 * r, cy - 1.22 * r], [cx + 0.2 * r, cy - 1.0 * r], [cx + 0.3 * r, cy - 0.62 * r]], 3);
    part(g, peak, c1, light, 5, 4);
    within(g, band, () => { for (let x = -1; x <= 1; x += 0.25) line(g, [[cx + x * r, cy - 0.75 * r], [cx + (x + 0.18) * r, cy - 0.35 * r]], 2, c2); });
  } else if (R.topi === "pet") {
    const crown = smoothC([[cx - 1.16 * r, cy - 0.62 * r], [cx - 1.28 * r, cy - 1.12 * r], [cx - 0.6 * r, cy - 1.34 * r], [cx + 0.6 * r, cy - 1.34 * r], [cx + 1.28 * r, cy - 1.12 * r], [cx + 1.16 * r, cy - 0.62 * r]], 3);
    part(g, crown, c1, light, 9);
    const band = rbox(cx, cy - 0.8 * r, cy - 0.56 * r, 1.12 * r, 1.1 * r, 6, 4); part(g, band, shd(c1, 0.6), light, 3, 4);
    line(g, [[cx - 1.0 * r, cy - 0.69 * r], [cx + 1.0 * r, cy - 0.69 * r]], 3.4, c2);
    const visor = smoothC([[cx - 0.98 * r, cy - 0.58 * r], [cx, cy - 0.34 * r], [cx + 0.98 * r, cy - 0.58 * r], [cx, cy - 0.5 * r]], 3); part(g, visor, "#111318", light, 3, 4);
    const badge = ellPts(cx, cy - 0.98 * r, 0.2 * r, 0.16 * r, 16); part(g, badge, c2, light, 3, 3);
    for (const s2 of [-1, 1]) line(g, [[cx + s2 * 0.22 * r, cy - 0.98 * r], [cx + s2 * 0.42 * r, cy - 1.04 * r]], 3, c2);
  } else if (R.topi === "peci") {   // peci/songkok hitam beludru
    const crown = smoothC([[cx - 0.98 * r, cy - 0.5 * r], [cx - 0.92 * r, cy - 1.02 * r], [cx, cy - 1.1 * r], [cx + 0.92 * r, cy - 1.02 * r], [cx + 0.98 * r, cy - 0.5 * r], [cx, cy - 0.42 * r]], 3);
    part(g, crown, R.topiWarna ?? "#17151c", light, 7);
    line(g, [[cx - 0.94 * r, cy - 0.62 * r], [cx + 0.94 * r, cy - 0.62 * r]], 2.2, R.topiWarna2 ?? "#34303c");
  } else if (R.topi === "helm") {   // helm proyek/tambang/SAR dengan lampu kecil
    const dome = smoothC([...arcPts(cx, cy - 0.42 * r, 1.12 * r, 0.98 * r, Math.PI, Math.PI * 2, 20), [cx + 1.12 * r, cy - 0.42 * r]], 3);
    part(g, dome, R.topiWarna ?? "#e8b81e", light, 9);
    line(g, [[cx, cy - 1.38 * r], [cx, cy - 0.5 * r]], 5, shd(R.topiWarna ?? "#e8b81e", 0.8));
    const brim = smoothC([[cx - 1.38 * r, cy - 0.44 * r], [cx, cy - 0.3 * r], [cx + 1.38 * r, cy - 0.44 * r], [cx, cy - 0.56 * r]], 3); part(g, brim, shd(R.topiWarna ?? "#e8b81e", 0.85), light, 3, 4);
    if (R.topiWarna2) { const lamp = ellPts(cx, cy - 0.86 * r, 0.2 * r, 0.16 * r, 16); part(g, lamp, R.topiWarna2, light, 3, 3); }
  } else if (R.topi === "ikat") {
    const band = smoothC([...arcPts(cx, cy - 0.12 * r, 1.07 * r, 0.6 * r, Math.PI * 1.04, Math.PI * 1.96, 18), ...arcPts(cx, cy - 0.02 * r, 1.05 * r, 0.44 * r, Math.PI * 1.96, Math.PI * 1.04, 18)], 2);
    part(g, band, c1, light, 5);
    within(g, band, () => { for (let x = -1; x <= 1; x += 0.2) { line(g, [[cx + x * r, cy - 0.66 * r], [cx + (x + 0.1) * r, cy - 0.5 * r], [cx + x * r, cy - 0.36 * r]], 2.4, c2); } });
  }
};
const topiBelakang = (g: G2, R: Rupa, light: number) => {
  if (!R.topi) return;
  const G0: Gaya = { wajah: "datar" };
  topiDepan(g, R, light, 0); void G0;
};
const wajahCiri = (g: G2, R: Rupa, light: number, fx: number) => {
  const cx = 300 + fx, cy = U.hc, r = U.r;
  if (R.jenggot) {
    const b = smoothC([[cx - 0.62 * r, cy + 0.42 * r], [cx - 0.4 * r, cy + 0.72 * r], [cx - 0.22 * r, cy + 1.12 * r], [cx, cy + 1.26 * r], [cx + 0.22 * r, cy + 1.12 * r], [cx + 0.4 * r, cy + 0.72 * r], [cx + 0.62 * r, cy + 0.42 * r], [cx + 0.3 * r, cy + 0.82 * r], [cx, cy + 0.88 * r], [cx - 0.3 * r, cy + 0.82 * r]], 3);
    part(g, b, R.jenggot, light, 5, 4);
  }
  if (R.kumis) {
    for (const s2 of [-1, 1]) { const m = smoothC([[cx + s2 * 0.04 * r, cy + 0.48 * r], [cx + s2 * 0.3 * r, cy + 0.44 * r], [cx + s2 * 0.42 * r, cy + 0.58 * r], [cx + s2 * 0.24 * r, cy + 0.56 * r], [cx + s2 * 0.04 * r, cy + 0.58 * r]], 3); part(g, m, R.kumis, light, 3, 3.4); }
  }
};
// ---------------- ciri khas: badan ----------------
const badanCiri = (g: G2, R: Rupa, light: number, belakang: boolean) => {
  const y0 = U.shY, y1 = U.tBot;
  if (R.ransel) {
    if (belakang) {
      const pack = rbox(300, y0 + 6, y1 - 6, U.tw - 14, U.tw - 6, 26, 14); part(g, pack, R.ransel, light, 10);
      const pk = rbox(300, y1 - 110, y1 - 24, 52, 56, 12, 12); part(g, pk, shd(R.ransel, 0.88), light, 4, 4);
      line(g, [[300 - 60, y0 + 70], [300 + 60, y0 + 70]], 3, shd(R.ransel, 0.6));
    } else {
      for (const s2 of [-1, 1]) { const st = smoothC([[300 + s2 * 50, y0 - 2], [300 + s2 * 72, y0 - 2], [300 + s2 * 66, y0 + 176], [300 + s2 * 46, y0 + 176]], 2); part(g, st, R.ransel, light, 4, 3.6); dot(g, 300 + s2 * 58, y0 + 120, 5, "#c9c2b0"); }
      line(g, [[300 - 54, y0 + 92], [300 + 54, y0 + 92]], 6, shd(R.ransel, 0.7));
    }
  }
  if (R.dasi && !belakang) {
    const tie = smoothC([[300 - 9, y0 + 14], [300 + 9, y0 + 14], [300 + 14, y0 + 96], [300, y0 + 116], [300 - 14, y0 + 96]], 2); part(g, tie, R.dasi, light, 3, 3.4);
    for (const s2 of [-1, 1]) { line(g, [[300 + s2 * (U.tw - 34), y0 + 4], [300 + s2 * (U.tw - 4), y0 + 14]], 9, "#d8b44a"); line(g, [[300 + s2 * (U.tw - 34), y0 + 4], [300 + s2 * (U.tw - 4), y0 + 14]], 2.4, TINTA); }
  }
  if (R.selendang) {
    const c1 = R.selendang, c2 = R.selendang2 ?? "#e8d27a";
    const sash = smoothC([[300 + U.tw - 6, y0 - 2], [300 + U.tw - 46, y0 - 6], [300 - U.tw + 4, y1 - 40], [300 - U.tw + 8, y1 + 6]], 2);
    part(g, sash, c1, light, 6, 4);
    within(g, sash, () => {
      for (let t = 0.04; t < 1; t += 0.12) { const a = lerp2([300 + U.tw - 26, y0], [300 - U.tw + 6, y1 - 16], t); const d: P2[] = [[a[0], a[1] - 9], [a[0] + 9, a[1]], [a[0], a[1] + 9], [a[0] - 9, a[1]]]; fill(g, d, c2); }
      line(g, [[300 + U.tw - 46, y0 + 6], [300 - U.tw + 4, y1 - 30]], 2.4, c2); line(g, [[300 + U.tw - 8, y0 + 8], [300 - U.tw + 10, y1 - 2]], 2.4, c2);
    });
    for (let i = 0; i < 5; i++) line(g, [[300 - U.tw + 6 + i * 6, y1 + 2], [300 - U.tw + 4 + i * 6, y1 + 22]], 2.4, c1); // rumbai
  }
};

// ---------------- kepala ----------------
/** putar gambar di sekitar pangkal leher (kepala miring) */
const tilt = (g: G2, G: Gaya, fn: () => void) => {
  if (!G.miring) { fn(); return; }
  const px = 300, py = U.hc + 0.95 * U.r;
  g.save(); g.translate(px, py); g.rotate((G.miring * Math.PI) / 180); g.translate(-px, -py); fn(); g.restore();
};

/** kepala dari belakang: kulit kepala tertutup rambut / tudung, tanpa wajah */
const headBack = (g: G2, R: Rupa, light: number) => {
  const cx = 300, cy = U.hc, r = U.r;
  part(g, ellPts(cx, cy, r * 1.01, r, 64), R.kulit, light, 13);
  if (R.gayaRambut === "botak") {
    const band = smoothC([[cx - 1.04 * r, cy - 0.25 * r], [cx - 0.8 * r, cy + 0.15 * r], [cx, cy + 0.32 * r], [cx + 0.8 * r, cy + 0.15 * r], [cx + 1.04 * r, cy - 0.25 * r],
      [cx + 0.98 * r, cy + 0.5 * r], [cx, cy + 0.72 * r], [cx - 0.98 * r, cy + 0.5 * r]], 4);
    part(g, band, R.rambut, light, 5, 4.5);
    line(g, [[cx - 0.3 * r, cy - 0.7 * r], [cx + 0.05 * r, cy - 0.82 * r]], 6, "rgba(255,255,255,0.6)");
    return;
  }
  if (R.gayaRambut === "topeng") {
    const hood = ellPts(cx, cy - 0.04 * r, 1.22 * r, 1.27 * r, 48);
    part(g, hood, R.rambut, light, 10);
    line(g, [[cx, cy - 1.15 * r], [cx, cy + 0.9 * r]], 3, "#0d0c10");
    return;
  }
  const bot = R.gayaRambut === "acak" ? 0.62 : 0.78;
  const hair: P2[] = [];
  for (let i = 0; i <= 30; i++) { const a = Math.PI * (0.9 + 1.2 * (i / 30)); hair.push([cx + r * 1.05 * Math.cos(a), cy - 2 + r * 1.06 * Math.sin(a)]); }
  for (let i = 0; i <= 8; i++) { const x = cx + r * (0.98 - 1.96 * (i / 8)); hair.push([x, cy + bot * r + (i % 2 ? -10 : 6)]); }
  part(g, smoothC(hair, 3), R.rambut, light, 10);
  if (R.gayaRambut === "kuncir" && R.sanggul) {
    const bun = ellPts(cx, cy + 0.05 * r, 0.44 * r, 0.38 * r, 28); part(g, bun, shd(R.rambut, 0.9), light, 8);
    line(g, arcPts(cx, cy + 0.05 * r, 0.28 * r, 0.22 * r, Math.PI * 0.2, Math.PI * 1.2, 10), 2.6, shd(R.rambut, 0.6));
  } else if (R.gayaRambut === "kuncir") {
    const tail = capsule([cx, cy + 0.2 * r], [cx + 0.06 * r, cy + 1.55 * r], 0.24 * r, 0.1 * r);
    ink(g, [tail]); cel(g, tail, R.rambut, light, 8);
    dot(g, cx, cy + 0.12 * r, 0.12 * r, "#2f6f8f"); outline(g, ellPts(cx, cy + 0.12 * r, 0.12 * r, 0.12 * r, 16), 3);
  }
  line(g, [[cx - 0.4 * r, cy - 0.75 * r], [cx - 0.05 * r, cy - 0.88 * r]], 4.5, mix(R.rambut, "#ffffff", 0.2));
};

const head = (g: G2, R: Rupa, G: Gaya, light: number) => {
  if (G.belakang) { tilt(g, G, () => { headBack(g, R, light); topiBelakang(g, R, light); }); return; }
  tilt(g, G, () => headFront(g, R, G, light));
};
const headFront = (g: G2, R: Rupa, G: Gaya, light: number) => {
  const cx = 300, cy = U.hc, r = U.r, fx = 9 * (G.hadap ?? 0);
  const hp = ellPts(cx, cy, r * 1.01, r, 64);
  part(g, hp, R.kulit, light, 13);
  if (R.gayaRambut === "hantu" || R.gayaRambut === "topeng") { face(g, cx + fx, cy, R, G); hairFront(g, R, light, fx); return; }
  hairFront(g, R, light, fx);
  face(g, cx + fx, cy, R, G);
  wajahCiri(g, R, light, fx);
  if (R.kacamata) glasses(g, cx + fx, cy);
  topiDepan(g, R, light, fx);
};

// ---------------- badan ----------------
const torsoDetail = (g: G2, R: Rupa, shirt: P2[], light: number) => {
  const y0 = U.shY, y1 = U.tBot;
  if (R.atasan === "hoodie") {
    within(g, shirt, () => {
      const pocket = smoothC([[300 - 52, y1 - 78], [300 + 52, y1 - 78], [300 + 64, y1 - 16], [300 - 64, y1 - 16]], 3);
      fill(g, pocket, shd(R.baju, 0.9)); outline(g, pocket, 3.4);
      g.fillStyle = shd(R.baju, 0.82); g.fillRect(150, y1 - 14, 300, 14); line(g, [[150, y1 - 14], [450, y1 - 14]], 3);
    });
  } else if (R.atasan === "flanel") {
    within(g, shirt, () => {
      g.globalAlpha = 0.45; g.fillStyle = R.baju2;
      for (let x = 300 - 102; x < 400; x += 34) g.fillRect(x, y0 - 10, 11, 260);
      for (let y = y0 + 10; y < y1; y += 34) g.fillRect(150, y, 300, 9);
      g.globalAlpha = 0.25; g.fillStyle = "#f4e3c2";
      for (let x = 300 - 85; x < 400; x += 34) g.fillRect(x, y0 - 10, 3, 260);
      g.globalAlpha = 1;
      line(g, [[300, y0 + 26], [300, y1]], 3, shd(R.baju, 0.6));
      for (let i = 0; i < 4; i++) dot(g, 306, y0 + 46 + i * 36, 4, "#f2ece0");
      for (const s of [-1, 1]) { // saku dada
        const pk: P2[] = [[300 + s * 26, y0 + 46], [300 + s * 62, y0 + 46], [300 + s * 60, y0 + 84], [300 + s * 44, y0 + 90], [300 + s * 28, y0 + 84]];
        outline(g, pk, 3);
      }
    });
    for (const s of [-1, 1]) { // kerah
      const col: P2[] = [[300, y0 + 22], [300 + s * 34, y0 - 4], [300 + s * 38, y0 + 26]];
      ink(g, [col], 3.4); fill(g, col, shd(R.baju, 0.92));
    }
  } else if (R.atasan === "rompi") {
    const v: P2[] = [[300 - 30, y0], [300 + 30, y0], [300, y0 + 120]];
    within(g, shirt, () => { fill(g, v, R.baju2); g.fillStyle = shd(R.baju, 0.85); g.fillRect(150, y1 - 16, 300, 16); line(g, [[150, y1 - 16], [450, y1 - 16]], 3); });
    for (const s of [-1, 1]) line(g, [[300 + s * 30, y0], [300 + s * 3, y0 + 120], [300 + s * 3, y1]], 3.6);
    for (const s of [-1, 1]) { const col: P2[] = [[300 + s * 6, y0 + 22], [300 + s * 28, y0 + 2], [300 + s * 30, y0 + 30]]; ink(g, [col], 3); fill(g, col, R.baju2); }
    for (let i = 0; i < 3; i++) { dot(g, 312, y0 + 134 + i * 22, 5, "#d8c48a"); outline(g, ellPts(312, y0 + 134 + i * 22, 5, 5, 12), 2.2); }
  }
};

export const gambarTokoh = (g: G2, R: Rupa, G: Gaya) => {
  const light = G.light ?? -2.3, two = Math.PI * 2;
  const walking = G.jalan !== undefined, ph = G.jalan ?? 0, amp = walking ? clamp(G.langkah ?? 1, 0, 1) : 0, run = !!G.lari;
  const bob = walking ? -(run ? 14 : 6) * amp * (1 - Math.cos(2 * two * ph)) / 2 : 0;
  g.lineJoin = "round"; g.lineCap = "round";
  if (!G.belakang || R.gayaRambut === "hantu") tilt(g, G, () => hairBack(g, R, light));
  const legs = [-1, 1].map((s) => {
    const lift = Math.max(0, Math.sin(two * (ph + (s > 0 ? 0.5 : 0)))) * (run ? 62 : 32) * amp;
    const H: P2 = [300 + s * U.hipX, U.hipY + bob], A: P2 = [300 + s * (U.hipX + 6), U.ankY - lift];
    const len = U.ankY - U.hipY, K0 = ik(H, A, len * 0.502, len * 0.5, [s, 0]), m = lerp2(H, A, 0.5);
    return { s, H, A, lift, K: [m[0] + (K0[0] - m[0]) * (run ? 0.32 : 0.2), K0[1]] as P2 };
  });
  if (R.atasan === "gaun") {
    for (const L of legs) { // kaki telanjang pucat
      const ft = rotPts(ellPts(L.A[0] + L.s * 6, 960 - L.lift, 22, 12, 24), L.s * 0.12, [L.A[0], 960 - L.lift]);
      part(g, ft, R.kulit, light, 4);
    }
  } else {
    for (const L of legs) { // sepatu pipih + sol
      const c: P2 = [L.A[0], 958 - L.lift], sh = rotPts(ellPts(L.A[0] + L.s * 10, c[1], 33, 15, 32), L.s * 0.12, c);
      const sole = rotPts(ellPts(L.A[0] + L.s * 10, c[1] + 6, 34, 10, 32, 0, Math.PI), L.s * 0.12, c);
      ink(g, [sh]); cel(g, sh, R.sepatu, light, 4);
      within(g, sh, () => fill(g, sole, R.sol));
      if (R.sepatu === "#e8ecef") for (const d of [-8, 4]) dot(g, L.A[0] + L.s * 6 + d, c[1] - 6, 2.6, mix(TINTA, R.sepatu, 0.4));
      outline(g, sh, LW * 0.9);
    }
    const blk = rbox(300, U.tBot - 24, U.hipY + 30 + bob, U.tw - 4, U.tw - 6, 6, 10);
    const th = legs.map((L) => capsule(L.H, L.K, U.legR, U.legR - 0.5)), sn = legs.map((L) => tube(L.K, L.A, U.legR - 0.5, U.legR - 1.5));
    ink(g, [blk, ...th, ...sn]);
    cel(g, blk, R.bawah, light, 8); for (const p of [...th, ...sn]) cel(g, p, R.bawah, light, 7);
    line(g, [[300, U.hipY + 14 + bob], [300, U.hipY + 40 + bob]], 3.4, mix(TINTA, R.bawah, 0.3));
    for (const L of legs) {
      const jeans = R.celana === "jins";
      if (R.celana === "kargo") { // saku samping celana kargo
        const c = lerp2(L.H, L.K, 0.75), pk = rbox(c[0] + L.s * 12, c[1] - 14, c[1] + 40, 16, 16, 4, 4);
        fill(g, pk, shd(R.bawah, 0.88)); outline(g, pk, 3); line(g, [[c[0] + L.s * 12 - 16, c[1] - 2], [c[0] + L.s * 12 + 16, c[1] - 2]], 2.6);
      }
      if (jeans) { const m = lerp2(L.H, L.K, 0.5); line(g, [[m[0] + L.s * (U.legR - 7), m[1]], [L.K[0] + L.s * (U.legR - 7), L.K[1]], [L.A[0] + L.s * (U.legR - 8), L.A[1] - 26]], 2.4, mix(R.bawah, "#ffffff", 0.3)); }
      const cuffY = L.A[1] - 18; line(g, [[L.A[0] - U.legR + 3, cuffY], [L.A[0] + U.legR - 3, cuffY]], 3, jeans ? mix(R.bawah, "#ffffff", 0.25) : shd(R.bawah, 0.7));
    }
  }
  g.save(); g.translate(0, bob);
  const sw = walking ? Math.sin(two * ph) * amp : 0;
  const dflt = (s: number): Lengan => (run ? { pose: "lari", w: s * Math.sin(two * ph) } : { pose: "turun", ayun: s * sw });
  const aR = armGeom(-1, G.kanan ?? dflt(-1)), aL = armGeom(1, G.kiri ?? dflt(1));
  if (R.atasan === "gaun") {
    const dress = smoothC([[300 - U.tw + 22, U.shY], [300 + U.tw - 22, U.shY], [300 + U.tw, U.shY + 26], [300 + U.tw + 8, 700], [300 + U.tw + 30, 930],
      [300 + 70, 912], [300 + 44, 940], [300 + 14, 916], [300 - 16, 944], [300 - 46, 914], [300 - 74, 938], [300 - U.tw - 30, 928], [300 - U.tw - 8, 700], [300 - U.tw, U.shY + 26]], 4);
    part(g, dress, R.baju, light, 14);
    for (const x of [-60, -20, 30, 70]) line(g, [[300 + x * 0.6, U.tBot - 40], [300 + x, 900]], 2.6, R.baju2);
    within(g, dress, () => { g.globalAlpha = 0.35; for (const [x, y, rr] of [[250, 760, 16], [340, 840, 12], [290, 560, 9]] as const) dot(g, x, y, rr, "#8f8a7a"); g.globalAlpha = 1; });
  } else {
    const shirt = rbox(300, U.shY, U.tBot, U.tw, U.tw - 3, 26, 7);
    part(g, shirt, R.baju, light, 16);
    if (!G.belakang) torsoDetail(g, R, shirt, light);
    if (G.belakang && R.atasan === "hoodie") { // tudung tergantung di punggung
      const hb = smoothC([[300 - 56, U.shY + 2], [300 + 56, U.shY + 2], [300 + 44, U.shY + 58], [300, U.shY + 76], [300 - 44, U.shY + 58]], 4);
      part(g, hb, shd(R.baju, 0.9), light, 6);
    } else if (R.atasan === "hoodie" && R.gayaRambut !== "topeng") { // tudung di pundak + tali
      const hood = smoothC([[300 - 58, U.shY + 6], [300 - 40, U.shY - 16], [300, U.shY - 22], [300 + 40, U.shY - 16], [300 + 58, U.shY + 6], [300 + 30, U.shY + 26], [300, U.shY + 30], [300 - 30, U.shY + 26]], 4);
      part(g, hood, shd(R.baju, 0.88), light, 6);
      fill(g, ellPts(300, U.shY + 2, 30, 14, 24), shd(R.baju, 0.55));
      for (const s of [-1, 1]) { line(g, [[300 + s * 16, U.shY + 22], [300 + s * 20, U.shY + 92]], 3.4, R.baju2); dot(g, 300 + s * 20, U.shY + 96, 4.4, "#9aa0aa"); }
    }
  }
  badanCiri(g, R, light, !!G.belakang);
  const neck = rbox(300, U.hc + 0.8 * U.r, U.shY + (R.atasan === "hoodie" ? 6 : 12), U.neckW, U.neckW, 3, 3);
  part(g, neck, mix(R.kulit, "#b8bfd0", 0.12), light, 4, 5);
  if (R.atasan === "rompi" || R.atasan === "flanel") line(g, [[300 - 14, U.shY + 6], [300, U.shY + 20], [300 + 14, U.shY + 6]], 3.4);
  for (const A of [aR, aL]) if (A.front) drawArm(g, R, A, light, "atas", G);
  for (const A of [aR, aL]) if (!A.front) drawArm(g, R, A, light, "semua", G);
  head(g, R, G, light);
  for (const A of [aR, aL]) if (A.front) drawArm(g, R, A, light, "bawah", G);
  g.restore();
};

/** kepala + leher saja (untuk baris ekspresi di lembar karakter) */
export const gambarKepala = (g: G2, R: Rupa, G: Gaya) => {
  const light = G.light ?? -2.3;
  g.lineJoin = "round"; g.lineCap = "round";
  if (R.gayaRambut === "kuncir") hairBack(g, R, light);
  const neck = rbox(300, U.hc + 0.8 * U.r, U.shY + 12, U.neckW, U.neckW, 3, 3);
  part(g, neck, mix(R.kulit, "#b8bfd0", 0.12), light, 4, 5);
  head(g, R, G, light);
};

/** kakek pos 3 yang ternyata sudah lama meninggal: pucat kebiruan */
export const KAKEK_PUCAT: Rupa = { ...KAKEK, nama: "Kakek?", kulit: "#b9c3c8", baju: "#4a4a4c", baju2: "#a8a8a2" };
/** semua rupa yang bisa dipanggil dari ep.json */
/** Sinta yang sudah "pulang": sedikit pucat, tidak pernah berkedip (cast.ts) */
export const SINTA_PULANG: Rupa = { ...SINTA, nama: "Sinta.", kulit: "#dcc7b4", kantung: true };
/** rombongan pendaki baru (Musim 2 akhir) */
export const DIMAS: Rupa = { nama: "Dimas", celana: "jins", kulit: "#d9b18c", rambut: "#2a1d14", gayaRambut: "acak", atasan: "hoodie", baju: "#2f5d8a", baju2: "#d8dde2", bawah: "#2e3440", sepatu: "#e8ecef", sol: "#2a2a33" };
export const AYU: Rupa = { nama: "Ayu", celana: "kargo", kulit: "#e6c19c", rambut: "#3a2416", gayaRambut: "kuncir", atasan: "flanel", baju: "#3f7a4a", baju2: "#1d3a22", bawah: "#4a4436", sepatu: "#6a5642", sol: "#231a14" };
/** Raka sebagai penjaga Pos 3 yang baru (Musim 3 akhir) */
export const RAKA_PUCAT: Rupa = { ...RAKA, nama: "Raka?", kulit: "#bcc6cb", baju: "#4a5146", baju2: "#9a9a92" };
/** dua pendaki terakhir yang disambut Raka */
export const TOMI: Rupa = { nama: "Tomi", celana: "kargo", kulit: "#d6ad86", rambut: "#1a1410", gayaRambut: "acak", atasan: "hoodie", baju: "#9a2f2a", baju2: "#e0d8cc", bawah: "#33352e", sepatu: "#4a3a2a", sol: "#1a140e" };
export const RINA: Rupa = { nama: "Rina", celana: "jins", kulit: "#ebc8a6", rambut: "#1c1310", gayaRambut: "kuncir", atasan: "flanel", baju: "#2f4f8a", baju2: "#16264a", bawah: "#2a3550", sepatu: "#e8ecef", sol: "#2a2a33" };
/** Sekar: wujud asli sosok — gadis pendaki pertama yang ditinggal, gaun putih kusam, wajah pucat terlihat */
export const SEKAR: Rupa = { nama: "Sekar", kulit: "#d3dbe0", rambut: "#0e0c12", gayaRambut: "kuncir", atasan: "gaun", baju: "#e2e1da", baju2: "#b9b8b2", bawah: "#e2e1da", sepatu: "#d3dbe0", sol: "#d3dbe0", kantung: true };
// ---- KISAH NYATA NUSANTARA (tokoh nyata digambar sederhana, tanpa meniru wajah) ----
export const GIE: Rupa = { nama: "Gie", ransel: "#7a4a2a", celana: "kain", kulit: "#e6c8a8", rambut: "#141110", gayaRambut: "acak", atasan: "flanel", baju: "#56604a", baju2: "#2a3022", bawah: "#3a3b36", sepatu: "#3e2e20", sol: "#16110c", kacamata: true };
export const IDHAN: Rupa = { nama: "Idhan", topi: "kupluk", topiWarna: "#b0302a", topiWarna2: "#f0e6d0", ransel: "#d0681e", celana: "kargo", kulit: "#d8b08a", rambut: "#16120f", gayaRambut: "acak", atasan: "hoodie", baju: "#2f4a5c", baju2: "#c8ccd0", bawah: "#2e3330", sepatu: "#3e2e20", sol: "#16110c" };
export const PETANI: Rupa = { nama: "Petani", topi: "caping", topiWarna: "#d8b878", kumis: "#1a1410", celana: "kain", kulit: "#c99a72", rambut: "#1a1410", gayaRambut: "acak", atasan: "rompi", baju: "#4a3a28", baju2: "#bfae8c", bawah: "#2f2a22", sepatu: "#2a1e14", sol: "#120c08" };
export const PETANI_W: Rupa = { nama: "Ibu", sanggul: true, selendang: "#8a5a2e", selendang2: "#e8cf98", celana: "kain", kulit: "#d0a47c", rambut: "#14100d", gayaRambut: "kuncir", atasan: "flanel", baju: "#6a4a2e", baju2: "#3a2616", bawah: "#3e2a1c", sepatu: "#2a1e14", sol: "#120c08" };
export const ANAK: Rupa = { nama: "Anak", celana: "kain", kulit: "#d4a67c", rambut: "#14100d", gayaRambut: "acak", atasan: "hoodie", baju: "#7a5a3a", baju2: "#d8c8a8", bawah: "#3a3026", sepatu: "#2a1e14", sol: "#120c08" };
export const PEMANGKU: Rupa = { nama: "Pemangku", topi: "udeng", topiWarna: "#f4f1ea", topiWarna2: "#d8d0bc", jenggot: "#ece9e2", selendang: "#e8c43a", selendang2: "#f8f0c8", celana: "kain", kulit: "#c89a72", rambut: "#e2e0dc", gayaRambut: "botak", atasan: "rompi", baju: "#f2efe6", baju2: "#e8e2d2", bawah: "#f0ece2", sepatu: "#c89a72", sol: "#8a6a4a", kantung: true };
export const UMAT: Rupa = { nama: "Umat", sanggul: true, selendang: "#e8c43a", selendang2: "#9a2a22", celana: "kain", kulit: "#c99c74", rambut: "#14100d", gayaRambut: "kuncir", atasan: "flanel", baju: "#f0ece2", baju2: "#d8b84a", bawah: "#e8c43a", sepatu: "#c99c74", sol: "#8a6a4a" };
export const ALETA: Rupa = { nama: "Mama Aleta", sanggul: true, selendang: "#b02a22", selendang2: "#f0c040", celana: "kain", kulit: "#a8764e", rambut: "#14100d", gayaRambut: "kuncir", atasan: "flanel", baju: "#9a2a22", baju2: "#2a1a10", bawah: "#5a2a1e", sepatu: "#3a2416", sol: "#140c08", kantung: true };
export const MAMA2: Rupa = { nama: "Mama", topi: "ikat", topiWarna: "#2a3a6a", topiWarna2: "#e0c040", selendang: "#2a4a8a", selendang2: "#f0e0a0", celana: "kain", kulit: "#a07048", rambut: "#14100d", gayaRambut: "kuncir", atasan: "flanel", baju: "#2a3a6a", baju2: "#e0c040", bawah: "#3a2a4a", sepatu: "#3a2416", sol: "#140c08" };
export const PILOT: Rupa = { nama: "Kapten", topi: "pet", topiWarna: "#1e2a44", topiWarna2: "#d8b44a", dasi: "#1a1e2a", celana: "kain", kulit: "#f0d6c0", rambut: "#6a5040", gayaRambut: "acak", atasan: "rompi", baju: "#1e2a44", baju2: "#f2f2f2", bawah: "#1e2a44", sepatu: "#141414", sol: "#0a0a0a", kantung: true };
export const RUPA_BY_NAME: Record<string, Rupa> = { GIE, IDHAN, PETANI, PETANI_W, ANAK, PEMANGKU, UMAT, ALETA, MAMA2, PILOT, SEKAR, RAKA, RAKA_PUCAT, SINTA, SINTA_PALSU, SINTA_PULANG, KAKEK, KAKEK_PUCAT, HANTU, JAKA, MBAH, DIMAS, AYU, TOMI, RINA };

/** PEMERAN PER CERITA: `pemeran` di ep.json mendefinisikan tokoh khusus episode tanpa mengubah file ini.
 *  { "NAMA": { "dari": "PETANI", "baju": "#...", "topi": "peci", ... } } -> salin rupa `dari` lalu timpa field-nya.
 *  Bentuk badan selalu sama (aturan user); yang berbeda hanya warna, pakaian, rambut, aksesori. Tokoh utama serial tetap memakai rupa terkunci. */
type PemeranDef = Partial<Rupa> & { dari?: string };
for (const [k, v] of Object.entries(((EP_TOKOH as unknown) as { pemeran?: Record<string, PemeranDef> }).pemeran ?? {})) {
  const { dari, ...isi } = v;
  RUPA_BY_NAME[k] = { ...(RUPA_BY_NAME[dari ?? "PETANI"] ?? PETANI), ...isi, nama: isi.nama ?? k } as Rupa;
}
