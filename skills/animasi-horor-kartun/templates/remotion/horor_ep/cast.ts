// Pemeran Horor USA Ep.1 sebagai kartu datar yang diterangi di dunia 3D (mesin kartu template). Gambar: tokoh.ts.
// Posisi dari koreografi story.ts; wajah ikut emosi baris yang sedang diucapkan; mulut ikut energi suara.
import * as THREE from "three";
import { Pen, fxShadow, fxContact } from "./toon";
import { gambarTokoh, JAKE, EMILY, MILLER, PSIKO, Gaya, Rupa, Lengan, Ekspresi } from "./tokoh";
import { FPS, SHOTS, V3, clamp01, kid, psiko, miller, bab, T0, speakingAt, sceneOf, ctxAt, holeAt, LAMPS, Pose } from "./story";
import { fxSplash, fxRing } from "./toon";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // meter per unit desain: 1000 unit = 2,16 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
const ROOTS = new Set<THREE.Object3D>();

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = Math.min(rt ? rt.width : r.domElement.width, rt ? rt.height : r.domElement.height) / 1080; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3; fwd?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
/** resolusi gambar menurut jarak: [lebar, tinggi kanvas, skala dari desain 600 x 1000] */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- cahaya ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const findSun = (cam: CamInfo, out: THREE.Vector3) => (cam.sun ? out.copy(cam.sun).normalize() : out);
/** sudut kanvas arah datangnya matahari pada kartu tegak yang menghadap kamera, dibulatkan 45 derajat */
const light2D = (cam: CamInfo) => {
  const sx = SUN.dot(cam.right), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- kedip ----------------
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number) => {
  const f = Math.round(t * FPS);
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

// ---------------- bayangan kontak (sama dengan template) ----------------
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
export type Stage = { places: Place[]; fx: FxPlace[] };
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h;
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c, w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};



// ---------------- pemeran ----------------
const tokoh = (out: Stage, cam: CamInfo, name: string, R: Rupa, p: V3, G: Gaya, shadow = true) => {
  const d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 1.2, p[2]));
  const [w, h, k] = tier(d);
  const g2: Gaya = { ...G, light: light2D(cam) };
  out.places.push({ key: `T|${name}|${fkey(g2)}`, x: p[0], y: p[1], z: p[2], draw: (pen) => gambarTokoh(pen.g, R, g2), size: [w, h, k] });
  if (shadow) blob(out, p[0], p[1], p[2]);
};
const FACE_OF: Record<string, Ekspresi> = { netral: "datar", senang: "senang", takut: "takut", teriak: "teriak", sedih: "sedih", seram: "seram", bisik: "bisik", marah: "marah" };
const KEY: Record<string, string> = { jake: "J", emily: "E", miller: "M", psiko: "P" };
const RUPA: Record<string, Rupa> = { J: JAKE, E: EMILY, M: MILLER, P: PSIKO };

/** wajah dasar tiap tokoh menurut cerita (kalau tidak sedang bicara) */
const baseFace = (key: string, t: number): Ekspresi => {
  const B = bab(t);
  if (key === "M") return B === 5 ? (t < T0("e04") ? "marah" : "senyum") : "seram";
  if (key === "J") {
    if (B === 1) return t >= T0("a09") && t < T0("a12") ? "cemas" : "datar";
    if (B === 2) return t < T0("b06") ? "datar" : t < T0("b13") ? "takut" : "teriak";
    if (B === 5) return t < T0("e05") ? "takut" : t < T0("e07") ? "senyum" : "cemas";
    return "takut";
  }
  if (B === 1) return t >= T0("a09") && t < T0("a12") ? "cemas" : "senyum";
  if (B === 2) return t < T0("b03") ? "senyum" : "takut";
  if (B === 5) return t < T0("e05") ? "takut" : t < T0("e07") ? "senyum" : "takut";
  return "takut";
};
const armsFor = (key: string, pz: Pose, t: number): Partial<Gaya> => {
  const B = bab(t);
  if (key === "P") return pz.mode === "jatuh" ? { kanan: { pose: "dadah", k: 1, w: 0.6 }, kiri: { pose: "dadah", k: 1, w: -0.6 } } : { kanan: { pose: "kapak" } };
  if (key === "E" && B >= 2 && B <= 4) return { kiri: { pose: "senter" } };
  return {};
};
const modeGaya = (pz: Pose): Partial<Gaya> =>
  pz.mode === "jalan" ? { jalan: pz.phase, langkah: 1 } : pz.mode === "lari" ? { lari: true, jalan: pz.phase, langkah: 1 } : {};

// ---------------- efek ----------------
const lampPool = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,196,120,0.55)"); gr.addColorStop(0.45, "rgba(255,180,100,0.22)"); gr.addColorStop(1, "rgba(255,170,90,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
/** retakan es bercabang, digambar dari atas; r = 0..1 seberapa jauh retakan menjalar */
const crackDraw = (p: Pen, r: number, seed: number) => {
  const g = p.g, c = 300;
  g.lineCap = "round"; g.lineJoin = "round";
  for (let k = 0; k < 7; k++) {
    let a = (k / 7) * Math.PI * 2 + seed, x = c, y = c;
    const L = 290 * r * (0.6 + 0.4 * Math.abs(Math.sin(k * 7.3 + seed)));
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 6; s++) { a += Math.sin(s * 3.1 + k + seed) * 0.5; x += Math.cos(a) * L / 6; y += Math.sin(a) * L / 6; g.lineTo(x, y); }
    g.strokeStyle = "rgba(20,40,70,0.85)"; g.lineWidth = 7; g.stroke();
    g.strokeStyle = "rgba(235,248,255,0.9)"; g.lineWidth = 2.5; g.stroke();
  }
};
const holeDraw = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(150, 150, 20, 150, 150, 150);
  gr.addColorStop(0, "#04080f"); gr.addColorStop(0.75, "#0a1626"); gr.addColorStop(0.92, "#3a5a78"); gr.addColorStop(1, "rgba(200,225,240,0)");
  g.fillStyle = gr; g.beginPath(); g.ellipse(150, 150, 148, 120, 0.2, 0, Math.PI * 2); g.fill();
};
const axeFlat = (p: Pen) => {
  const g = p.g;
  g.save(); g.translate(200, 100); g.rotate(-0.4);
  g.fillStyle = "#6b4426"; g.strokeStyle = "#2b1631"; g.lineWidth = 8; g.fillRect(-150, -9, 260, 18); g.strokeRect(-150, -9, 260, 18);
  g.beginPath(); g.moveTo(95, -14); g.lineTo(150, -50); g.quadraticCurveTo(175, 0, 150, 50); g.lineTo(95, 14); g.closePath(); g.fillStyle = "#8f98a3"; g.fill(); g.stroke();
  g.restore();
};

// ---------------- per frame ----------------
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], t = f / FPS, sc = sceneOf(s), c = ctxAt(f);
  LNAME = s.light;
  findSun(cam, SUN);
  if (sc.overlay === "hitam") return out;
  const sp = speakingAt(f), extra = sc.pose ? sc.pose(c) : {};
  const poses: Record<string, Pose> = { J: kid("J", t), E: kid("E", t), M: miller(t), P: psiko(t) };
  ["J", "E", "M", "P"].forEach((key, i) => {
    const pz = poses[key];
    if (!pz.vis) return;
    const talking = sp && KEY[sp.who] === key;
    const G: Gaya = {
      wajah: talking ? FACE_OF[sp!.emo] ?? "datar" : baseFace(key, t),
      kedip: lidAt(t, i + 1), miring: pz.miring,
      belakang: (sc.back ?? []).includes(key),
      ...modeGaya(pz), ...armsFor(key, pz, t),
      ...(extra[key] as Partial<Gaya> | undefined),
    };
    if (talking) G.bicara = sp!.mouth;
    if (key === "P") G.wajah = "datar";
    tokoh(out, cam, key, RUPA[key], pz.p, G, pz.mode !== "jatuh");
  });
  // genangan cahaya lampu jalan (malam)
  if (s.light === "day") for (const L of LAMPS) {
    if (Math.abs(L[0] - cam.pos.x) > 45) continue;
    out.fx.push({ key: "lampPool", cw: 256, ch: 256, draw: lampPool, x: L[0], y: 0.03, z: L[2] + 0.8, w: 7, h: 7, flat: true, soft: true });
  }
  // kolam beku: retakan, lubang, cipratan, riak
  const B = bab(t);
  if (B === 4) {
    if (t >= T0("d03") - 0.3) for (const key of ["J", "E"]) {
      const pz = poses[key], r = clamp01((t - (T0("d03") - 0.3)) / 2.5);
      out.fx.push({ key: `crack${key}${Math.round(r * 20)}`, cw: 600, ch: 600, draw: (p) => crackDraw(p, Math.round(r * 20) / 20, key === "J" ? 1.3 : 4.1), x: pz.p[0] + 1.2, y: 0.025, z: pz.p[2], w: 3.2, h: 3.2, flat: true, soft: true });
    }
    const H = holeAt();
    if (t >= T0("d07") + 0.6 && t < T0("d09") + 0.3) {
      const r = clamp01((t - (T0("d07") + 0.6)) / Math.max(0.5, T0("d09") - T0("d07") - 0.6));
      out.fx.push({ key: `crackP${Math.round(r * 30)}`, cw: 600, ch: 600, draw: (p) => crackDraw(p, Math.round(r * 30) / 30, 2.2), x: H[0], y: 0.026, z: H[2], w: 4.5, h: 4.5, flat: true, soft: true });
    }
  }
  const tFall = T0("d09") + 0.2;
  if ((B === 4 && t >= tFall) || (B === 5 && s.light === "golden")) {
    const H = holeAt();
    out.fx.push({ key: "hole", cw: 300, ch: 300, draw: holeDraw, x: H[0], y: 0.027, z: H[2], w: 2.6, h: 2.2, flat: true, soft: true });
    if (B === 4) {
      const u = (t - tFall) / 1.1;
      if (u < 1) out.fx.push({ key: `splash${Math.round(u * 30)}`, cw: 800, ch: 800, draw: (p) => fxSplash(p, Math.round(u * 30) / 30), x: H[0], y: 0.9, z: H[2], w: 2.6, h: 2.6 });
      for (let k = 0; k < 2; k++) {
        const v = ((t - tFall) * 0.35 + k * 0.5) % 1, fade = clamp01(1 - (t - tFall) / 9);
        if (fade > 0.05) out.fx.push({ key: `ring${Math.round(v * 30)}`, cw: 600, ch: 600, draw: (p) => fxRing(p, Math.round(v * 30) / 30), x: H[0], y: 0.03, z: H[2], w: 2.4 * fade + 0.6, h: 2.4 * fade + 0.6, flat: true });
      }
    } else out.fx.push({ key: "axeFlat", cw: 400, ch: 200, draw: axeFlat, x: H[0] + 1.6, y: 0.03, z: H[2] + 0.6, w: 1.1, h: 0.55, flat: true, rot: 0.5 });
  }
  return out;
};
