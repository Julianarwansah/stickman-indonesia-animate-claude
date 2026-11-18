// PETAKA GUNUNG — mesin cerita berbasis data. Tiap episode = folder salinan mesin ini + timeline.json (dari
// suara/buat_suara.py) + ep.json (adegan: tokoh berkeyframe, kamera per scene, efek). Kode di sini tidak diubah per episode.
//
// Waktu di ep.json: angka detik, "id" (mulai baris), "id$" (akhir baris), "id+1.5" / "id$-0.4" (geser detik).
// Keyframe tokoh: {at, p:[x,z], y?, mode: diri|jalan|lari, vis?, w? (wajah dasar), miring?, kiri?/kanan? (pose lengan),
//                  lihat?, hadap?, rupa?}. Posisi diinterpolasi lurus ke keyframe berikutnya; kunci lain bertahan.
// Scene: {subj: "R" | "R+S" | [x,y,z], az, dist, distTo?, distT?, push?, camH?, lookH?, dx?, dz?, fov?, hand?, roll?,
//         fix?, light?, snow?, hide?, back?, overlay?, dof?, kick?, pose?, moonAz?, bayangan?, glitch?}
import TL from "./timeline.json";
import EP from "./ep.json";

export const FPS = 30;
export const TOTAL: number = (TL as { total: number }).total;
export const D0 = 0;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- peta dunia (dipakai island.ts) ----------------
export const SEA_Y = -60;
export const POS_HUT: V3 = [62, 0, -7.5];      // pondok pos 3
export const KAKEK_AT: V3 = [60.6, 0, -3.3];
export const BASECAMP: V3 = [142, 0, -8];      // desa / basecamp kaki gunung (x 125..170)
export const MAKAM: V3 = [-55, 0, -6];         // makam tua + sesajen
export const JURANG_X = -95;
export const POHON: V3 = [-90.4, 0, -4.4];    // pohon mati besar, rumah sosok (Musim 2)                   // tepi jurang (tanah berakhir di x < JURANG_X)
export const X_STOP = 22;                      // titik tersesat Ep.1
export const PURA: V3 = [-74, 0, -7];              // pura Bali (candi bentar + meru), di antara makam dan pohon mati
export const SAWAH_X: [number, number] = [178, 214];  // sawah berundak sesudah desa (|z| 3..23)
export const LAMPS: V3[] = [[64.6, 0, -4.2], [136, 0, -3.6], [151, 0, 3.4]];
export const shipPose = (_id: number, _f: number): { pos: V3; yaw: number; ice: number } => ({ pos: [0, -200, 0], yaw: 0, ice: 0 });

// ---------------- data episode ----------------
type KF = { at: number | string; p?: [number, number]; y?: number; mode?: "diri" | "jalan" | "lari"; vis?: boolean; w?: string; miring?: number;
  kiri?: Record<string, unknown> | null; kanan?: Record<string, unknown> | null; lihat?: [number, number]; hadap?: number; rupa?: string; skala?: number };
export type TokohDef = { rupa: string; suara?: string[]; bicaraWajah?: Record<string, string>; jalur: KF[] };
export type SceneDef = {
  subj?: string | V3; az: number; dist: number; distTo?: number; distT?: number; push?: number; camH?: number; lookH?: number; dx?: number; dz?: number;
  fov?: number; hand?: number; roll?: number; fix?: boolean; light?: "day" | "golden"; snow?: number; hide?: string[]; back?: string[];
  overlay?: "hitam" | "kedip"; capPos?: "atas" | "bawah"; ikut?: boolean; akting?: boolean; letusan?: number; gas?: number; dof?: number; kick?: number; pose?: Record<string, Record<string, unknown>>; moonAz?: number;
  bayangan?: { p: [number, number]; hantu?: boolean; len?: number; kepala?: boolean }[]; glitch?: { key: string; rupa: string };
  /** layar HP berisi foto: orang di foto (kiri ke kanan, depan), sosok di belakang, zoom (1 = utuh) ke titik fokus 0..1 */
  hp?: { depan: { rupa: string; w?: string }[]; belakang?: { rupa: string; x: number; w?: string; kanan?: Record<string, unknown>; kiri?: Record<string, unknown> }[]; zoom?: number; zoomTo?: number; fokus?: [number, number]; jam?: string };
};
export type EpDef = { ep: number; judul: string; seri?: string; stempel?: string; kartuJudul?: string; kartuBawah?: string; kunci?: string[];
  /** latar: gunungApi [x,z] | false, kawahMenyala, asapGunung, desa 'kayu' (default) | 'barat', kabut (0..1, default 0.6), vignette (default 0.6), jarakKabut (default 1.6) */
  aktingOtomatis?: boolean; kameraOtomatis?: boolean; gunungApi?: [number, number] | false; kawahMenyala?: boolean; asapGunung?: boolean; desa?: "kayu" | "barat"; hutan?: "pinus" | "tropis" | "gundul"; tanah?: "hutan" | "abu" | "kering"; kabut?: number; vignette?: number; jarakKabut?: number; hook?: string; pilihan: { A: string; B: string }; menang?: string; lampu?: boolean;
  api?: [number, number][]; benda?: { jenis: "senter"; p: [number, number]; dari?: number | string; sampai?: number | string }[]; tokoh: Record<string, TokohDef>; scenes: Record<string, SceneDef> };
export const E = EP as unknown as EpDef;

// ---------------- timeline ----------------
export type Line = { id: string; scene: string; who: string | null; emo: string | null; text: string | null; mg: string | null; k?: string | null; start: number; end: number; dur: number; mulut: number[]; kata?: [string, number, number][] };
export const LINES = (TL as { baris: Line[] }).baris;
const BY = Object.fromEntries(LINES.map((l) => [l.id, l]));
export const T0 = (id: string) => BY[id].start / FPS;
export const T1 = (id: string) => BY[id].end / FPS;
/** waktu dari ep.json -> detik */
export const tm = (v: number | string): number => {
  if (typeof v === "number") return v;
  const m = /^([A-Za-z0-9_]+)(\$?)([+-][\d.]+)?$/.exec(v.trim());
  if (!m || !BY[m[1]]) throw new Error("waktu tidak dikenal di ep.json: " + v);
  return (m[2] ? T1(m[1]) : T0(m[1])) + (m[3] ? parseFloat(m[3]) : 0);
};
/** KEJUT OTOMATIS: frame saat penonton & tokoh harus tersentak — baris teriak, kata kejut (dari waktu kata whisper),
 *  jumpscare j01 (guncangan letusan diurus kameraOto). kejutAt(f) = 0..1 (naik 3 frame, turun ±16 frame). */
const KATA_KEJUT = /^(meletus|letusan|meledak|ledakan|tiba-tiba|menjerit|berteriak|teriak|runtuh|longsor|gempa|lahar|menjebol|menyapu|jatuh|terjatuh|dentum|padam|mati!|hilang!|menoleh!|lari!)/i;
export const KEJUT: number[] = [];
for (const l of LINES) {
  if (l.id === "j01" || l.emo === "teriak") KEJUT.push(l.start);
  for (const [w, f0] of l.kata ?? []) if (KATA_KEJUT.test(w.replace(/[".,?…]+$/, ""))) KEJUT.push(f0);
}
export const kejutAt = (f: number) => { let k = 0; for (const a of KEJUT) { const n = f - a; if (n >= 0 && n < 20) k = Math.max(k, n < 3 ? n / 3 : (1 - (n - 3) / 17) ** 1.5); } return k; };
/** kata sedih dalam baris narator -> tokoh yang mendengar ikut sedih */
export const KATA_SEDIH = /^(meninggal|tewas|wafat|korban|hilang|ditinggal|menangis|tidak pernah turun|gugur)/i;
export const speakingAt = (f: number): { who: string; emo: string; mouth: number; k: string | null } | null => {
  for (const l of LINES) if (l.who && f >= l.start && f < l.end) return { who: l.who, emo: l.emo ?? "netral", mouth: l.mulut[f - l.start] ?? 0, k: l.k ?? null };
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
const JS = SHOTS.find((s) => s.scene.startsWith("jumpscare"));
export const FLASH_AT = JS ? JS.a : -100;
export const SPY = { a: -10, b: -10 };
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (f: number): { id: number; alpha: number }[] => [{ id: shotAt(f).id, alpha: 1 }];

// ---------------- koreografi dari keyframe ----------------
export type Pose = { p: V3; mode: "diri" | "jalan" | "lari" | "jatuh"; phase: number; vis: boolean; miring?: number; w?: string; extra: Record<string, unknown>; rupa?: string; skala?: number };
type KFt = KF & { t: number };
const JALUR: Record<string, KFt[]> = Object.fromEntries(Object.entries(E.tokoh).map(([k, d]) => [k, d.jalur.map((x) => ({ ...x, t: tm(x.at) })).sort((a, b) => a.t - b.t)]));
const HIDDEN: Pose = { p: [0, -50, 0], mode: "diri", phase: 0, vis: false, extra: {} };
export const KEYS = Object.keys(E.tokoh);
export const poseOf = (key: string, t: number): Pose => {
  const J = JALUR[key];
  if (!J || !J.length || t < J[0].t) return HIDDEN;
  let i = 0;
  while (i + 1 < J.length && J[i + 1].t <= t) i++;
  // kunci yang bertahan (diambil dari keyframe terakhir yang menyetelnya)
  let p: [number, number] = [0, 0], y = 0, mode: Pose["mode"] = "diri", vis = true, w: string | undefined, miring: number | undefined, rupa: string | undefined, skala: number | undefined;
  const extra: Record<string, unknown> = {};
  let mt0 = J[0].t;
  for (let k = 0; k <= i; k++) {
    const x = J[k];
    if (x.p) p = x.p; if (x.y !== undefined) y = x.y;
    if (x.mode) { if (x.mode !== mode) mt0 = x.t; mode = x.mode; }
    if (x.vis !== undefined) vis = x.vis; if (x.w !== undefined) w = x.w; if (x.miring !== undefined) miring = x.miring;
    if (x.rupa !== undefined) rupa = x.rupa; if (x.skala !== undefined) skala = x.skala;
    for (const kk of ["kiri", "kanan", "lihat", "hadap"] as const) if (x[kk] !== undefined) { if (x[kk] === null) delete extra[kk]; else extra[kk] = x[kk]; }
  }
  // interpolasi posisi ke keyframe berikutnya yang punya p
  const cur = J[i];
  let nx: KFt | undefined;
  for (let k = i + 1; k < J.length; k++) if (J[k].p) { nx = J[k]; break; }
  if (nx && mode !== "diri") {
    const u = clamp01((t - cur.t) / Math.max(0.01, nx.t - cur.t));
    p = [p[0] + (nx.p![0] - p[0]) * u, p[1] + (nx.p![1] - p[1]) * u];
    if (nx.y !== undefined) y = y + (nx.y - y) * u;
  }
  const rate = mode === "lari" ? 1.4 : 0.8;
  return { p: [p[0], y, p[1]], mode, phase: ((t - mt0) * rate + (key.charCodeAt(0) % 7) * 0.13) % 1, vis, w, miring, extra, rupa, skala };
};

// ---------------- kamera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
export type Ctx = { f: number; t: number; T: number; u: number; s: ShotDef };
const ms = (p: V3, az: number, dist: number, k: number, o: { camH?: number; lookH?: number; fov?: number; roll?: number; dx?: number; dz?: number } = {}): Shot => {
  const a = (az * Math.PI) / 180, look: V3 = [p[0] + (o.dx ?? 0), p[1] + (o.lookH ?? 1.0), p[2] + (o.dz ?? 0)];
  const pos: V3 = [look[0] - Math.sin(a) * dist * k, p[1] + (o.camH ?? 1.35), look[2] - Math.cos(a) * dist * k];
  return { pos, look, fov: o.fov ?? 40, roll: o.roll ?? 0 };
};
const subjAt = (subj: string | V3 | undefined, t: number): V3 => {
  if (!subj) return [0, 0, 0];
  if (Array.isArray(subj)) return subj;
  const ks = subj.split("+").map((k) => poseOf(k, t).p);
  return [ks.reduce((s, p) => s + p[0], 0) / ks.length, ks.reduce((s, p) => s + p[1], 0) / ks.length, ks.reduce((s, p) => s + p[2], 0) / ks.length];
};
const hand = (t: number, k: number) => 0.012 * k * Math.sin(t * 1.7) + 0.007 * k * Math.sin(t * 4.3 + 1);
export type Scene = SceneDef & { light?: Light };
export const SCENES = E.scenes as Record<string, Scene>;
const DEFAULT: Scene = { subj: [0, 0, 0], az: 180, dist: 10, overlay: "hitam" };
/** kartu pilihan tanpa definisi scene: pakai kamera shot sebelumnya (adegan 3D tetap bergerak samar di balik kartu), bukan layar hitam */
const sebelumPilihan = (s: ShotDef): Scene | undefined => { for (let i = SHOTS.indexOf(s) - 1; i >= 0; i--) { const d = SCENES[SHOTS[i].scene]; if (d) return { ...d, overlay: undefined, letusan: 0, gas: 0, hp: undefined, glitch: undefined }; } return undefined; };
export const sceneOf = (s: ShotDef): Scene => SCENES[s.scene] ?? (s.scene === "pilihan" ? sebelumPilihan(s) ?? DEFAULT : s.scene === "judul_hitam" ? DEFAULT : (console.warn("scene tanpa definisi: " + s.scene), DEFAULT));
for (const s of SHOTS) { const sc = sceneOf(s); s.light = sc.light ?? "day"; if (sc.moonAz !== undefined) s.moonAz = sc.moonAz; }

const ctxOf = (s: ShotDef, f: number): Ctx => { const T_ = (s.b - s.a) / FPS, t = (f - s.a) / FPS; return { f, t, T: T_, u: clamp01(t / Math.max(0.01, T_)), s }; };
export const ctxAt = (f: number) => ctxOf(shotAt(f), f);
/** kamera ikut pembicara (scene `ikut: true`): subjek = tokoh yang sedang bicara (potong per baris), kembali ke subj saat narasi */
const pembicaraKey = (f: number): string | null => {
  for (const l of LINES) if (l.who && l.who !== "narator" && f >= l.start - 2 && f < l.end + 6) {
    if (l.k) return l.k;
    for (const k of KEYS) if ((E.tokoh[k].suara ?? []).includes(l.who)) return k;
  }
  return null;
};
const camOf = (s: ShotDef, f: number): Shot => {
  const sc = sceneOf(s), c = ctxOf(s, f), tt = sc.fix ? s.a / FPS : f / FPS;
  const pk = sc.ikut ? pembicaraKey(f) : null;
  const p = subjAt(pk ?? sc.subj, tt);
  const k = sc.push ? Math.exp(-sc.push * (f - s.a)) : 1;
  const dist = sc.distTo !== undefined ? sc.dist + (sc.distTo - sc.dist) * smooth(c.t / (sc.distT ?? c.T)) : sc.dist;
  return ms(p, sc.az, dist, k, { camH: sc.camH, lookH: sc.lookH, dx: sc.dx, dz: sc.dz, fov: sc.fov, roll: (sc.roll ?? 0) + (sc.hand ? hand(c.t, sc.hand) : (E.kameraOtomatis !== false && !sc.fix ? hand(c.t, 0.35) : 0)) });
};
const kickAt = (s: ShotDef, f: number) => {
  const k = sceneOf(s).kick;
  if (!k) return 0;
  const n = f - s.a, len = k > 1.5 ? 16 : 7;
  return n >= 0 && n < len ? k * 0.7 * (n % 2 ? -1 : 1) * (1 - n / len) ** 1.2 : 0;
};
/** KAMERA OTOMATIS saat kejut: dorong cepat ke subjek (punch-in 15 %) + guncang kecil; letusan = guncang pelan terus-menerus */
const kameraOto = (s: ShotDef, f: number, c: Cam): Cam => {
  const sc = sceneOf(s);
  if (E.kameraOtomatis === false || sc.fix || sc.overlay === "hitam") return c;
  const k = kejutAt(f), g = Math.max(k, 0.25 * (sc.letusan ?? 0));
  if (!k && !g) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]], L = Math.hypot(...d);
  const push = 0.15 * k, j = 0.012 * L * g;
  const jx = j * (hh(f, 1) - 0.5), jy = j * (hh(f, 2) - 0.5), jz = j * (hh(f, 3) - 0.5);
  return { ...c, pos: [c.pos[0] + d[0] * push + jx, c.pos[1] + d[1] * push + jy, c.pos[2] + d[2] * push + jz], roll: c.roll + 0.012 * g * (hh(f, 4) - 0.5) };
};
export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1], c: Cam = kameraOto(s, f, { fov: 40, roll: 0, ...camOf(s, f) }), a = kickAt(s, f);
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a * 4;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.01 };
};

// ---------------- lensa ----------------
export const dofAt = (f: number) => {
  const s = shotAt(f), sc = sceneOf(s), c = camOf(s, f);
  return { cInf: sc.dof ?? 6, focus: (_f: number) => c.look };
};
export const focusAt = (id: number, f: number): V3 => camAt(id, f).look;

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
