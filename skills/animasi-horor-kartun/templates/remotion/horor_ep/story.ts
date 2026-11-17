// Horor USA Ep.1 "The Smiling Man of Maple Hollow" — 16:9 (1920x1080), ±8 menit, dunia raja_es zona Boston, malam.
// Waktu semuanya dari timeline.json (dibuat suara/buat_suara.py): satu SHOT = rangkaian baris naskah berurutan dengan
// scene yang sama. Gerak tokoh per bab ada di kid/psiko/miller (posisi per detik), kamera per scene di SCENES.
import TL from "./timeline.json";

export const FPS = 30;
export const TOTAL: number = (TL as { total: number }).total;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- tempat (dipakai island.ts) ----------------
export const SEA_Y = -0.6;
export const TX = 2000;
export const PIER = { x0: 2, x1: 6, z1: 22, y: 0.5 };
export const SHIP_AT = (x0: number): V3 => [x0 + 10.6, SEA_Y, 13];
export const LAKE: V3 = [-70, 0.02, -45];
export const LAKE_R = 18;
export const CRATES: V3[] = [[-5.85, 0, -3], [-4.5, 0, -3], [-3.15, 0, -3]];
export const MART: V3 = [TX + 4.2, PIER.y, 8.5];
export const MARKET: V3 = [TX + 90, 0, -24];
/** kapal tua bersandar di dermaga Boston, tanpa muatan es */
export const shipPose = (_id: number, _f: number): { pos: V3; yaw: number; ice: number } => ({ pos: SHIP_AT(0), yaw: -Math.PI / 2, ice: 0 });
/** lampu jalan di trotoar utara Elm Street */
export const LAMPS: V3[] = [[58, 0, -11.7], [46, 0, -11.7], [34, 0, -11.7], [10, 0, -11.7], [-6, 0, -11.7], [-30, 0, -11.7], [-50, 0, -11.7]];
export const MILLER_AT: V3 = [21.9, 0, -13.6];
export const ICE_Y = 0.014;

// ---------------- timeline ----------------
export type Line = { id: string; scene: string; who: string | null; emo: string | null; text: string | null; mg: string | null; start: number; end: number; dur: number; mulut: number[] };
export const LINES = (TL as { baris: Line[] }).baris;
const BY = Object.fromEntries(LINES.map((l) => [l.id, l]));
/** detik mulai / selesai sebuah baris */
export const T0 = (id: string) => BY[id].start / FPS;
export const T1 = (id: string) => BY[id].end / FPS;
/** siapa yang sedang bicara di frame f (dan bukaan mulutnya) */
export const speakingAt = (f: number): { who: string; emo: string; mouth: number } | null => {
  for (const l of LINES) if (l.who && f >= l.start && f < l.end) return { who: l.who, emo: l.emo ?? "netral", mouth: l.mulut[f - l.start] ?? 0 };
  return null;
};

// ---------------- shot ----------------
export type Light = "day" | "golden";
export type ShotDef = { id: number; a: number; b: number; light: Light; sunAz?: number; sunEl?: number; far?: number; moonAz?: number; scene: string; first: Line };
export const SHOTS: ShotDef[] = [];
{
  let prev = "";
  for (const l of LINES) {
    if (l.scene === prev) continue;
    prev = l.scene;
    SHOTS.push({ id: SHOTS.length + 1, a: SHOTS.length ? l.start : 0, b: 0, light: "day", scene: l.scene, first: l });
  }
  SHOTS.forEach((s, i) => { s.b = i + 1 < SHOTS.length ? SHOTS[i + 1].a : TOTAL; });
}
export const XFADE: Record<number, number> = {};
export const FLASH_AT = -100;
export const SPY = { a: -10, b: -10 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- koreografi: posisi tiap tokoh di detik t ----------------
export type Pose = { p: V3; mode: "diri" | "jalan" | "lari" | "jatuh"; phase: number; vis: boolean; miring?: number };
const JZ = -10.1, EZ = -9.2;
const lin = (t: number, t0: number, x0: number, v: number) => x0 - v * Math.max(0, t - t0);
export const bab = (t: number) => (t < T0("k1") ? 0 : t < T0("k2") ? 1 : t < T0("k3") ? 2 : t < T0("k4") ? 3 : t < T0("k5") ? 4 : 5);

/** posisi Jake ("J") atau Emily ("E") */
export const kid = (who: "J" | "E", t: number): Pose => {
  const e = who === "E", off = e ? 0.37 : 0;
  const B = bab(t);
  if (B === 1) {
    // jalan dari ujung timur Elm St., berhenti mengobrol di depan deretan rumah (a03..a07), jalan lagi sampai depan rumah
    // Pak Miller (berhenti a09..a12), lalu jalan lagi
    const tA = T0("a01"), tC = T0("a03") - 0.3, tC2 = T0("a07"), tStop = T0("a09") - 0.6, tGo = T0("a12"), SX = 25.2, X0 = 60;
    const xC = Math.max(SX + 6, X0 - 1.1 * (tC - tA)), V2 = (xC - SX) / Math.max(1, tStop - tC2);
    const x = t < tC ? lin(t, tA, X0, (X0 - xC) / Math.max(1, tC - tA)) : t < tC2 ? xC : t < tStop ? lin(t, tC2, xC, V2) : t < tGo ? SX : lin(t, tGo, SX, 1.1);
    const walk = t < tC || (t >= tC2 && t < tStop) || t >= tGo, d = Math.abs(X0 - x);
    return { p: [x + (e ? 0.6 : 0), 0, e ? EZ : JZ], mode: walk ? "jalan" : "diri", phase: (d / 1.34 + off) % 1, vis: t >= tA - 0.5 };
  }
  if (B === 2) {
    const t2 = T0("b01"), tH = T0("b03") - 0.3, tRun = T0("b13") + 0.35, SX = 10, X2 = SX + 1.0 * (tH - t2);
    const x = t < tH ? lin(t, t2, X2, 1.0) : t < tRun ? SX : lin(t, tRun, SX, 3.4);
    const mode = t < tH ? "jalan" : t < tRun ? "diri" : "lari", d = Math.abs(X2 - x);
    return { p: [x + (e ? 0.6 : 0), 0, e ? EZ : JZ], mode, phase: mode === "lari" ? ((t - tRun) * 1.4 + off) % 1 : (d / 1.34 + off) % 1, vis: true };
  }
  if (B === 3) {
    const tA = T0("c01h"), tP = T0("c10h"), V = 3.4;
    if (t < tP) {
      const x0 = 10, x1 = -7.4, tArr = tA + (x0 - x1) / V, u = clamp01((t - tA) / (tArr - tA));
      const x = x0 + (x1 - x0) * u, z0 = e ? -4.0 : -4.6, z1 = e ? -2.6 : -3.5, z = z0 + (z1 - z0) * smooth((u - 0.8) / 0.2);
      return { p: [x + (e ? 0.12 : 0), 0, z], mode: u < 1 ? "lari" : "diri", phase: ((t - tA) * 1.4 + off) % 1, vis: true };
    }
    const z = Math.min(17, 1 + 3.2 * (t - tP));
    return { p: [e ? 4.5 : 3.5, PIER.y, z + (e ? -0.5 : 0)], mode: z < 17 ? "lari" : "diri", phase: ((t - tP) * 1.4 + off) % 1, vis: true };
  }
  if (B === 4) {
    const tA = T0("d01") - 0.5, x = Math.max(-84, -53.5 - 2.6 * Math.max(0, t - tA));
    return { p: [x + (e ? 0.7 : 0), ICE_Y, e ? -44.5 : -45.5], mode: x > -84 && t >= tA ? "lari" : "diri", phase: ((t - tA) * 1.3 + off) % 1, vis: true };
  }
  if (B === 5) {
    if (t >= T0("e09")) return { p: [31.5 + (e ? 0 : -1.2), 0, -11.4], mode: "diri", phase: 0, vis: true };
    const tA = T0("e01"), tx = e ? 24.3 : 23.4, x = Math.max(tx, 34 - 3.2 * Math.max(0, t - tA));
    return { p: [x, 0, e ? -11.4 : -11.9], mode: x > tx ? "lari" : "diri", phase: ((t - tA) * 1.4 + off) % 1, vis: t < T0("e07") };
  }
  return { p: [0, 0, 0], mode: "diri", phase: 0, vis: false };
};

/** titik lubang es (tempat si Psikopat berhenti dan jatuh) */
export const holeAt = (): V3 => { const tA = T0("d06") - 1, tStop = T0("d07") + 0.6; return [-52.5 - 1.15 * (tStop - tA), ICE_Y, -45]; };

/** si Psikopat */
export const psiko = (t: number): Pose => {
  const B = bab(t);
  if (B === 0) return { p: [46, 0, -9.8], mode: "diri", phase: 0, vis: t >= T0("c03") - 0.2 };
  if (B === 2) {
    if (t < T0("b06")) return { p: [34, 0, -9.8], mode: "diri", phase: 0, vis: false };
    const tilt = 16 * smooth((t - T0("b11")) / 1.3);
    const tS = T0("b12") + 0.4, tW = T0("b13") + 1.2;
    const x = t < tS ? 34 : t < tS + 0.9 ? 34 - 0.8 * smooth((t - tS) / 0.9) : t < tW ? 33.2 : lin(t, tW, 33.2, 1.15);
    const mode = (t >= tS && t < tS + 0.9) || t >= tW ? "jalan" : "diri";
    return { p: [x, 0, -9.8], mode, phase: (Math.max(0, t - tS) * 0.8) % 1, vis: true, miring: t < tW ? tilt : 0 };
  }
  if (B === 3) {
    if (t < T0("c04h") - 1) return { p: [9, 0, -3], mode: "diri", phase: 0, vis: false };
    if (t < T0("c08h") - 0.15) {
      const x = Math.max(-1.7, lin(t, T0("c04h") - 1, 9, 1.1));
      return { p: [x, 0, -3], mode: x > -1.7 ? "jalan" : "diri", phase: (Math.max(0, t - T0("c04h")) * 0.8) % 1, vis: true };
    }
    if (t < T0("c15h") - 0.5) return { p: [-2.15, 0, -3.0], mode: "diri", phase: 0, vis: t < T0("c10h") + 0.5, miring: 12 };
    const z = 1 + 1.05 * (t - (T0("c15h") - 0.5));
    return { p: [4, PIER.y, z], mode: "jalan", phase: (t * 0.8) % 1, vis: true };
  }
  if (B === 4) {
    const tA = T0("d06") - 1, tStop = T0("d07") + 0.6, tFall = T0("d09") + 0.2, xs = holeAt()[0];
    if (t < tA) return { p: [-52.5, ICE_Y, -45], mode: "diri", phase: 0, vis: false };
    const x = t < tStop ? lin(t, tA, -52.5, 1.15) : xs;
    if (t < tFall) return { p: [x, ICE_Y, -45], mode: t < tStop ? "jalan" : "diri", phase: ((t - tA) * 0.8) % 1, vis: true };
    const y = ICE_Y - 2.4 * clamp01((t - tFall) / 0.75) ** 2;
    return { p: [xs, y, -45], mode: "jatuh", phase: 0, vis: t < tFall + 0.8 };
  }
  if (B === 5) return { p: [46, 0, -9.8], mode: "diri", phase: 0, vis: t >= T0("e11") };
  return { p: [0, 0, 0], mode: "diri", phase: 0, vis: false };
};

/** Pak Miller */
export const miller = (t: number): Pose => {
  const B = bab(t);
  const vis = B === 0 ? t >= T0("c02") - 0.2 && t < T0("c03") : B === 1 ? true : B === 5 ? t < T0("e07") : false;
  return { p: MILLER_AT, mode: "diri", phase: 0, vis };
};

// ---------------- kamera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
export type Ctx = { f: number; t: number; T: number; u: number; s: ShotDef };
const T = (f: number) => f / FPS;
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
/** lensa `dist` m dari p pada azimut az (90 = lensa di -x menghadap +x; 180 = lensa di +z menghadap -z; 270 = di +x menghadap -x) */
const ms = (p: V3, az: number, dist: number, k: number, o: { camH?: number; lookH?: number; fov?: number; roll?: number; dx?: number; dz?: number } = {}): Shot => {
  const a = (az * Math.PI) / 180, look: V3 = [p[0] + (o.dx ?? 0), p[1] + (o.lookH ?? 1.0), p[2] + (o.dz ?? 0)];
  const pos: V3 = [look[0] - Math.sin(a) * dist, p[1] + (o.camH ?? 1.35), look[2] - Math.cos(a) * dist];
  return dolly(pos, look, k, { fov: o.fov ?? 40, roll: o.roll ?? 0 });
};
const push = (c: Ctx, rate = 0.0015) => Math.exp(-rate * (c.f - c.s.a));
const mid = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const J = (c: Ctx) => kid("J", T(c.f)).p, E = (c: Ctx) => kid("E", T(c.f)).p, P = (c: Ctx) => psiko(T(c.f)).p;
/** posisi tetap di awal shot (kamera diam sementara tokoh bergerak) */
const at0 = (c: Ctx, fn: (t: number) => Pose) => fn(T(c.s.a)).p;
const eyes = (p: V3, h = 1.45): V3 => [p[0], p[1] + h, p[2]];
const KIDS = (c: Ctx) => mid(J(c), E(c));

export type Scene = {
  cam: (c: Ctx) => Shot;
  light?: Light; moonAz?: number;
  dof?: { cInf: number; focus?: (c: Ctx) => V3 };
  /** tokoh tampak belakang di scene ini */
  back?: string[];
  /** salju turun (0..1) */
  snow?: number;
  /** layar hitam / lampu sirene */
  overlay?: "hitam" | "sirene";
  /** gaya tambahan per tokoh (wajah dasar, lengan, lihat): J, E, M, P */
  pose?: (c: Ctx) => Record<string, Record<string, unknown>>;
};
const S = (s: Scene) => s;

export const SCENES: Record<string, Scene> = {
  // ---- pembuka ----
  intro_jalan: S({ cam: (c) => ms([34, 0, -9.6], 94, 15, push(c, 0.0012), { camH: 1.9, lookH: 1.6 }), snow: 0.6, dof: { cInf: 0 } }),
  intro_rumah: S({ cam: (c) => ms([38 - 15 * c.u, 0, -11.2], 178, 9, 1, { camH: 2.0, lookH: 2.3 }), snow: 0.6, dof: { cInf: 3, focus: () => eyes(MILLER_AT) } }),
  intro_topeng: S({ cam: (c) => ms([46, 0, -9.8], 92, 12, push(c, 0.0035), { camH: 1.3, lookH: 1.25 }), snow: 0.7, moonAz: -12, dof: { cInf: 8, focus: () => eyes([46, 0, -9.8]) } }),
  judul: S({ cam: () => ms([46, 0, -9.8], 92, 8, 1, { lookH: 1.3 }) }),
  // ---- bab 1 ----
  bab1: S({ cam: () => ms([40, 0, -9.6], 94, 10, 1) }),
  jalan_jauh: S({ cam: (c) => ms([at0(c, (t) => kid("J", t))[0] - 6, 0, -9.6], 93, 9.5, push(c, 0.0012), { camH: 1.5, lookH: 1.0 }), snow: 0.4, dof: { cInf: 4, focus: (c) => eyes(J(c)) } }),
  jalan_dekat: S({ cam: (c) => ms(KIDS(c), 96, 4.6, 1, { camH: 1.45, lookH: 1.12 }), snow: 0.4, dof: { cInf: 9, focus: (c) => eyes(J(c)) } }),
  ngobrol_emily: S({ cam: (c) => ms(E(c), 104, 2.1, 1, { camH: 1.42, lookH: 1.36, dx: -0.15 }), snow: 0.35, dof: { cInf: 12, focus: (c) => eyes(E(c)) } }),
  ngobrol_jake: S({ cam: (c) => ms(J(c), 82, 2.1, 1, { camH: 1.42, lookH: 1.36, dx: 0.1 }), snow: 0.35, dof: { cInf: 12, focus: (c) => eyes(J(c)) } }),
  jalan_jauh2: S({ cam: (c) => ms(KIDS(c), 128, 13, 1, { camH: 6.5, lookH: 0.8 }), snow: 0.45, moonAz: 14, dof: { cInf: 0 } }),
  miller_teras: S({ cam: (c) => ms(MILLER_AT, 160, 6.6, push(c, 0.0016), { camH: 1.6, lookH: 1.4, dx: 1.0 }), snow: 0.35, dof: { cInf: 6, focus: () => eyes(MILLER_AT) },
    pose: (c) => ({ M: { kiri: { pose: "dadah", k: clamp01((c.f - c.s.a) / 12), w: 0.5 * Math.sin(c.t * 4) } } }) }),
  miller_cu: S({ cam: (c) => ms(MILLER_AT, 174, 2.3, push(c, 0.002), { camH: 1.36, lookH: 1.4 }), snow: 0.3, dof: { cInf: 13, focus: () => eyes(MILLER_AT) } }),
  anak_canggung: S({ cam: (c) => ms(KIDS(c), 338, 3.8, push(c, 0.0015), { camH: 1.45, lookH: 1.2 }), snow: 0.3, moonAz: 30, dof: { cInf: 10, focus: (c) => eyes(J(c)) } }),
  emily_bisik: S({ cam: (c) => ms(E(c), 100, 2.4, 1, { camH: 1.4, lookH: 1.35, dx: -0.12 }), snow: 0.35, dof: { cInf: 12, focus: (c) => eyes(E(c)) } }),
  // ---- bab 2 ----
  bab2: S({ cam: () => ms([20, 0, -9.6], 94, 10, 1) }),
  salju_jalan: S({ cam: (c) => ms(KIDS(c), 132, 13, push(c, 0.0008), { camH: 4.8, lookH: 1.0 }), snow: 1, dof: { cInf: 0 } }),
  kaki_jauh: S({ cam: (c) => ms([at0(c, (t) => kid("J", t))[0] - 4, 0, -9.65], 92, 6, 1, { camH: 0.55, lookH: 0.9 }), snow: 0.9, dof: { cInf: 9, focus: (c) => eyes(J(c), 1.0) } }),
  emily_takut: S({ cam: (c) => ms(E(c), 262, 2.3, push(c, 0.002), { camH: 1.4, lookH: 1.36 }), snow: 0.8, dof: { cInf: 13, focus: (c) => eyes(E(c)) },
    pose: () => ({ E: { lihat: [-0.7, 0] } }) }),
  jake_tenang: S({ cam: (c) => ms(J(c), 98, 2.3, 1, { camH: 1.4, lookH: 1.36 }), snow: 0.8, dof: { cInf: 13, focus: (c) => eyes(J(c)) } }),
  hitam: S({ cam: () => ms([10, 0, -9.6], 94, 10, 1), overlay: "hitam" }),
  psiko_jauh: S({ cam: (c) => ms([KIDS(c)[0] + 6.0, 0, -9.65], 90, 10.5, push(c, 0.0015), { camH: 1.75, lookH: 1.3 }), back: ["J", "E"], snow: 0.8, moonAz: 6,
    dof: { cInf: 7, focus: (c) => eyes(P(c)) } }),
  psiko_wajah: S({ cam: (c) => ms(P(c), 91, 1.75, push(c, 0.003), { camH: 1.47, lookH: 1.47 }), snow: 0.6, dof: { cInf: 15, focus: (c) => eyes(P(c)) } }),
  psiko_kapak: S({ cam: (c) => ms(P(c), 98, 2.3, push(c, 0.003), { camH: 0.55, lookH: 0.75, dx: -0.2 }), snow: 0.6, dof: { cInf: 14, focus: (c) => [P(c)[0], 0.6, P(c)[2] - 0.3] } }),
  jake_takut: S({ cam: (c) => ms(J(c), 274, 2.2, push(c, 0.003), { camH: 1.4, lookH: 1.38 }), snow: 0.8, dof: { cInf: 13, focus: (c) => eyes(J(c)) } }),
  psiko_miring: S({ cam: (c) => ms(P(c), 90, 3.0, push(c, 0.003), { camH: 1.3, lookH: 1.3 }), snow: 0.7, dof: { cInf: 12, focus: (c) => eyes(P(c)) } }),
  psiko_langkah: S({ cam: (c) => ms(P(c), 90, 4.0 - 1.2 * smooth(c.t / 1.2), 1, { camH: 1.0, lookH: 1.2 }), snow: 0.7, dof: { cInf: 12, focus: (c) => eyes(P(c)) } }),
  jake_teriak: S({ cam: (c) => ms(J(c), bab(T(c.f)) === 3 ? 92 : 272, 1.8, push(c, 0.004), { camH: 1.42, lookH: 1.42 }), snow: 0.8, dof: { cInf: 15, focus: (c) => eyes(J(c)) } }),
  lari_jalan: S({ cam: (c) => ms([at0(c, (t) => kid("J", t))[0] - 9 - 2.6 * c.t, 0, -9.6], 94, 9, 1, { camH: 1.4, lookH: 1.1 }), snow: 0.9, dof: { cInf: 5, focus: (c) => eyes(J(c)) } }),
  lari_dekat: S({ cam: (c) => ms(KIDS(c), 97, 4.2, 1, { camH: 1.4, lookH: 1.1, roll: -0.04 }), snow: 0.9, dof: { cInf: 10, focus: (c) => eyes(J(c)) } }),
  hp_pesan: S({ cam: (c) => ms(J(c), 96, 2.2, 1, { lookH: 1.3 }) }),
  jake_tengok: S({ cam: (c) => ms(J(c), 100, 2.1, 1, { camH: 1.42, lookH: 1.4, roll: 0.05 }), snow: 0.9, dof: { cInf: 14, focus: (c) => eyes(J(c)) },
    pose: () => ({ J: { lihat: [0.85, 0], hadap: 0.6 } }) }),
  psiko_jalan: S({ cam: (c) => ms(P(c), 91, 3.4, 1, { camH: 1.15, lookH: 1.3 }), snow: 0.9, dof: { cInf: 12, focus: (c) => eyes(P(c)) } }),
  // ---- bab 3: dermaga ----
  bab3: S({ cam: () => ms([0, 0, -3], 92, 10, 1) }),
  dermaga_lari: S({ cam: () => ms([-3, 0, -3.6], 88, 8.5, 1, { camH: 1.35, lookH: 1.0 }), snow: 0.5, moonAz: -4, dof: { cInf: 5, focus: (c) => eyes(J(c)) } }),
  peti_anak: S({ cam: (c) => ms(KIDS(c), 84, 2.7, push(c, 0.0015), { camH: 1.2, lookH: 1.15 }), snow: 0.4, dof: { cInf: 12, focus: (c) => eyes(J(c)) },
    pose: () => ({ J: { lihat: [0.8, 0] }, E: { lihat: [0.6, 0] } }) }),
  peti_kaki: S({ cam: (c) => ms([P(c)[0] - 0.5, 0, -3], 93, 3.2, 1, { camH: 0.32, lookH: 0.45 }), snow: 0.4, dof: { cInf: 12, focus: (c) => [P(c)[0], 0.4, -3] } }),
  peti_psiko: S({ cam: () => ms([-3.6, 0, -3.1], 72, 8.2, 1, { camH: 1.25, lookH: 1.05 }), snow: 0.4, dof: { cInf: 6, focus: (c) => eyes(P(c)) },
    pose: () => ({ J: { lihat: [0.9, 0] }, E: { lihat: [0.9, 0] } }) }),
  peti_anak_dekat: S({ cam: (c) => ms(KIDS(c), 86, 1.95, push(c, 0.0025), { camH: 1.36, lookH: 1.38 }), snow: 0.4, dof: { cInf: 14, focus: (c) => eyes(J(c)) },
    pose: () => ({ J: { lihat: [0.8, 0] }, E: { lihat: [0.8, 0] } }) }),
  hp_getar: S({ cam: (c) => ms(J(c), 84, 1.7, push(c, 0.004), { camH: 1.35, lookH: 1.25 }), snow: 0.3, dof: { cInf: 15, focus: (c) => eyes(J(c)) },
    pose: (c) => ({ J: { kiri: { pose: "hp", k: clamp01((c.f - c.s.a) / 8) }, wajah: "kaget" } }) }),
  psiko_atas_peti: S({ cam: (c) => ms(P(c), 90, 4.85, push(c, 0.004), { camH: 1.45, lookH: 1.5 }), snow: 0.3, dof: { cInf: 12, focus: (c) => eyes(P(c)) } }),
  dermaga_kabur: S({ cam: () => ms([4, PIER.y, 9], 180, 11, 1, { camH: 1.4, lookH: 0.9 }), snow: 0.4, moonAz: 18, dof: { cInf: 4, focus: (c) => eyes(J(c)) } }),
  telp_911: S({ cam: (c) => ms(J(c), 182, 2.0, 1, { lookH: 1.3 }) }),
  jake_telp: S({ cam: (c) => ms(J(c), 186, 2.1, push(c, 0.003), { camH: 1.42, lookH: 1.38 }), snow: 0.4, dof: { cInf: 14, focus: (c) => eyes(J(c)) },
    pose: () => ({ J: { kanan: { pose: "telepon" } } }) }),
  emily_panik: S({ cam: (c) => ms(E(c), 176, 2.1, push(c, 0.003), { camH: 1.42, lookH: 1.38 }), snow: 0.4, dof: { cInf: 14, focus: (c) => eyes(E(c)) } }),
  psiko_dermaga: S({ cam: () => ms([4, PIER.y, 6.5], 180, 4.5, 1, { camH: 1.0, lookH: 1.3 }), snow: 0.5, dof: { cInf: 10, focus: (c) => eyes(P(c)) } }),
  dermaga_lebar: S({ cam: () => ms([4, PIER.y, 9], 228, 19, 1, { camH: 6.5, lookH: 0.5 }), snow: 0.5, moonAz: -20, dof: { cInf: 0 } }),
  // ---- bab 4: kolam beku ----
  bab4: S({ cam: () => ms([-70, 0, -45], 90, 20, 1) }),
  kolam_lebar: S({ cam: (c) => ms([-70, 0, -45], 92, 26, push(c, 0.0008), { camH: 4.5, lookH: 0.5 }), snow: 0.4, moonAz: 4, dof: { cInf: 0 } }),
  kolam_es: S({ cam: (c) => ms([-62.5, 0, -42.5], 110, 6.5, push(c, 0.0015), { camH: 4.5, lookH: 0.2 }), snow: 0.4, dof: { cInf: 4, focus: () => [-63, 0.3, -42.8] } }),
  kolam_anak: S({ cam: (c) => ms(KIDS(c), 94, 3.8, 1, { camH: 1.35, lookH: 1.0 }), snow: 0.5, dof: { cInf: 10, focus: (c) => eyes(J(c)) } }),
  kolam_lari: S({ cam: (c) => ms([at0(c, (t) => kid("J", t))[0] - 6 - 1.6 * c.t, 0, -45], 94, 6, 1, { camH: 1.2, lookH: 0.9 }), snow: 0.5, dof: { cInf: 5, focus: (c) => eyes(J(c)) } }),
  kolam_psiko: S({ cam: (c) => ms(P(c), 92, 4.0, 1, { camH: 1.1, lookH: 1.25 }), snow: 0.5, dof: { cInf: 11, focus: (c) => eyes(P(c)) } }),
  kolam_psiko_berhenti: S({ cam: (c) => ms(P(c), 92, 3.4, push(c, 0.003), { camH: 1.3, lookH: 1.0 }), snow: 0.4, dof: { cInf: 11, focus: (c) => eyes(P(c)) } }),
  kolam_retak: S({ cam: (c) => ms(holeAt(), 100, 3.6, push(c, 0.004), { camH: 2.6, lookH: 0.3 }), snow: 0.3, dof: { cInf: 6, focus: () => holeAt() } }),
  kolam_tenggelam: S({ cam: () => ms(holeAt(), 95, 5.5, 1, { camH: 1.4, lookH: 0.7 }), snow: 0.3, dof: { cInf: 6, focus: () => add(holeAt(), [0, 0.6, 0]) } }),
  kolam_anak_lihat: S({ cam: (c) => ms(KIDS(c), 272, 3.6, push(c, 0.002), { camH: 1.35, lookH: 1.2 }), snow: 0.3, dof: { cInf: 10, focus: (c) => eyes(E(c)) } }),
  kolam_air: S({ cam: (c) => ms(holeAt(), 105, 3.4, push(c, 0.002), { camH: 2.2, lookH: 0.1 }), snow: 0.2, dof: { cInf: 6, focus: () => holeAt() } }),
  // ---- bab 5 ----
  bab5: S({ cam: () => ms(MILLER_AT, 180, 8, 1) }),
  miller_pintu: S({ cam: (c) => ms(MILLER_AT, 158, 7.5, push(c, 0.0015), { camH: 1.6, lookH: 1.3, dx: 1.2 }), snow: 0.3, dof: { cInf: 5, focus: () => eyes(MILLER_AT) },
    pose: (c) => ({ M: { kiri: { pose: "dadah", k: 1, w: 0.7 * Math.sin(c.t * 5) } } }) }),
  miller_cu2: S({ cam: () => ms(MILLER_AT, 176, 2.3, 1, { camH: 1.36, lookH: 1.4 }), snow: 0.2, dof: { cInf: 13, focus: () => eyes(MILLER_AT) } }),
  sirene: S({ cam: (c) => ms([26, 0, -10.5], 128, 13, push(c, 0.0012), { camH: 4.0, lookH: 1.0 }), snow: 0.3, overlay: "sirene", dof: { cInf: 0 } }),
  anak_lega: S({ cam: (c) => ms(KIDS(c), 196, 3.3, 1, { camH: 1.4, lookH: 1.2 }), snow: 0.2, overlay: "sirene", dof: { cInf: 10, focus: (c) => eyes(J(c)) } }),
  miller_senyum: S({ cam: () => ms(MILLER_AT, 170, 2.4, 1, { camH: 1.36, lookH: 1.4 }), snow: 0.2, overlay: "sirene", dof: { cInf: 13, focus: () => eyes(MILLER_AT) } }),
  kolam_pagi: S({ cam: (c) => ms(holeAt(), 120, 9, push(c, 0.001), { camH: 3.0, lookH: 0.3 }), light: "golden", dof: { cInf: 4, focus: () => holeAt() } }),
  berita: S({ cam: () => ms(holeAt(), 120, 9, 1, { camH: 3.0, lookH: 0.3 }), light: "golden" }),
  hp_malam: S({ cam: () => ms([31.5, 0, -11.4], 180, 3, 1, { lookH: 1.3 }) }),
  emily_hp: S({ cam: (c) => ms(E(c), 178, 2.1, push(c, 0.003), { camH: 1.36, lookH: 1.3 }), snow: 0.4, dof: { cInf: 14, focus: (c) => eyes(E(c)) },
    pose: () => ({ E: { kiri: { pose: "hp" } } }) }),
  jendela: S({ cam: (c) => ms([31.5, 0, -11.4], 104, 14, push(c, 0.001), { camH: 2.2, lookH: 1.6 }), snow: 0.8, moonAz: -8, dof: { cInf: 4, focus: (c) => eyes(P(c)) } }),
  akhir_topeng: S({ cam: (c) => ms(P(c), 91, 2.4 - 0.9 * smooth(c.t / 6), 1, { camH: 1.47, lookH: 1.47 }), snow: 0.8, dof: { cInf: 15, focus: (c) => eyes(P(c)) } }),
};
export const sceneOf = (s: ShotDef) => SCENES[s.scene] ?? SCENES.intro_jalan;
for (const s of SHOTS) { const sc = sceneOf(s); s.light = sc.light ?? "day"; if (sc.moonAz !== undefined) s.moonAz = sc.moonAz; }

const ctxOf = (s: ShotDef, f: number): Ctx => { const T_ = (s.b - s.a) / FPS, t = (f - s.a) / FPS; return { f, t, T: T_, u: clamp01(t / Math.max(0.01, T_)), s }; };
export const ctxAt = (f: number) => ctxOf(shotAt(f), f);

/** guncangan di awal shot tertentu */
const KICK_SCENES = new Set(["jake_teriak", "psiko_langkah", "psiko_atas_peti", "kolam_tenggelam", "hp_getar"]);
const kickAt = (s: ShotDef, f: number) => {
  if (!KICK_SCENES.has(s.scene)) return 0;
  const n = f - s.a;
  return n >= 0 && n < 7 ? 0.7 * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5 : 0;
};
export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], sh = sceneOf(s).cam(ctxOf(s, f)), c: Cam = { fov: 40, roll: 0, ...sh }, a = kickAt(s, f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lensa ----------------
export const dofAt = (f: number) => {
  const s = shotAt(f), d = sceneOf(s).dof ?? { cInf: 6 }, c = ctxOf(s, f);
  return { cInf: d.cInf, focus: d.focus ? (_f: number) => d.focus!(c) : undefined };
};
export const focusAt = (id: number, f: number): V3 => { const d = dofAt(f); return d.focus ? d.focus(f) : camAt(id, f).look; };

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
