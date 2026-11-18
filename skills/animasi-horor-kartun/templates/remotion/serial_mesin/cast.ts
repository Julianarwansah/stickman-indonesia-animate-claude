// Pemeran Horor USA Ep.1 sebagai kartu datar yang diterangi di dunia 3D (mesin kartu template). Gambar: tokoh.ts.
// Posisi dari koreografi story.ts; wajah ikut emosi baris yang sedang diucapkan; mulut ikut energi suara.
import * as THREE from "three";
import { Pen, fxShadow, fxContact } from "./toon";
import { gambarTokoh, RUPA_BY_NAME, Gaya, Rupa, Ekspresi } from "./tokoh";
import { FPS, SHOTS, V3, clamp01, speakingAt, sceneOf, ctxAt, LAMPS, Pose, KEYS, poseOf, E, tm } from "./story";

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



// ---------------- pemeran (data dari ep.json) ----------------
const tokoh = (out: Stage, cam: CamInfo, name: string, R: Rupa, p: V3, G: Gaya, shadow = true, skala = 1) => {
  const d = cam.pos.distanceTo(tmp.set(p[0], p[1] + 1.2 * skala, p[2]));
  const [w, h, k] = tier(d / skala);
  const g2: Gaya = { ...G, light: light2D(cam) };
  out.places.push({ key: `T|${name}|${R.nama}|${fkey(g2)}`, x: p[0], y: p[1], z: p[2], draw: (pen) => gambarTokoh(pen.g, R, g2), size: [w, h, k], scale: skala });
  if (shadow) blob(out, p[0], p[1], p[2], skala);
};
const FACE_OF: Record<string, Ekspresi> = { netral: "datar", senang: "senang", takut: "cemas", teriak: "teriak", sedih: "sedih", seram: "seram", bisik: "cemas", marah: "marah" };
/** kartu yang bicara: kunci "k" di baris naskah, atau tokoh terlihat pertama yang punya suara itu */
const speakerKey = (who: string, k: string | null, t: number) => {
  if (k) return k;
  for (const key of KEYS) if ((E.tokoh[key].suara ?? []).includes(who) && poseOf(key, t).vis) return key;
  return "";
};
const modeGaya = (pz: Pose): Partial<Gaya> =>
  pz.mode === "jalan" ? { jalan: pz.phase, langkah: 1 } : pz.mode === "lari" ? { lari: true, jalan: pz.phase, langkah: 1 } : {};

// ---------------- efek ----------------
const lampPool = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,196,120,0.55)"); gr.addColorStop(0.45, "rgba(255,180,100,0.22)"); gr.addColorStop(1, "rgba(255,170,90,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
const beamPool = (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,236,190,0.6)"); gr.addColorStop(0.5, "rgba(255,226,170,0.25)"); gr.addColorStop(1, "rgba(255,220,160,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
/** api unggun: lidah api kartun 3 lapis yang bergoyang (frame dibulatkan 8 langkah supaya cache kanvas kecil) */
const flame = (p: Pen, ph: number) => {
  const g = p.g;
  const tongue = (cx: number, h: number, w: number, col: string, o: number) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(cx - w, 250);
    g.quadraticCurveTo(cx - w * 1.1, 250 - h * 0.5, cx + 8 * Math.sin(ph * 6.28 + o), 250 - h);
    g.quadraticCurveTo(cx + w * 1.1, 250 - h * 0.5, cx + w, 250); g.closePath(); g.fill();
  };
  tongue(128, 200 + 20 * Math.sin(ph * 6.28), 70, "#e2471f", 0);
  tongue(110, 150 + 18 * Math.sin(ph * 6.28 + 2), 45, "#f59a2a", 1);
  tongue(146, 130 + 15 * Math.sin(ph * 6.28 + 4), 38, "#f59a2a", 2);
  tongue(128, 90 + 12 * Math.sin(ph * 6.28 + 1), 26, "#ffe08a", 3);
  g.fillStyle = "#3a2416"; g.fillRect(50, 240, 156, 16);
};
const shadowMan = (p: Pen, hantu: boolean, kepala = true) => {
  const g = p.g;
  g.fillStyle = "rgba(4,4,10,0.86)";
  g.beginPath(); g.ellipse(64, 470, 30, 22, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(40, 470); g.lineTo(30, 250); g.lineTo(98, 250); g.lineTo(88, 470); g.fill();
  g.beginPath(); g.moveTo(26, 260); g.lineTo(22, 120); g.lineTo(106, 120); g.lineTo(102, 260); g.fill();
  if (kepala) { g.beginPath(); g.ellipse(64, 86, 26, 36, 0, 0, Math.PI * 2); g.fill(); }
  g.lineWidth = 13; g.strokeStyle = "rgba(4,4,10,0.86)";
  if (hantu) {
    g.beginPath(); g.moveTo(34, 70); g.quadraticCurveTo(20, 200, 30, 250); g.lineTo(98, 250); g.quadraticCurveTo(108, 200, 94, 70); g.fill();
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 40, 130); g.quadraticCurveTo(64 + s * 60, 40, 64 + s * 30, 0); g.stroke(); }
  } else for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 40, 130); g.lineTo(64 + s * 48, 250); g.stroke(); }
};
const senterGambar = (p: Pen) => {
  const g = p.g;
  g.fillStyle = "#2a2a30"; g.strokeStyle = "#2b1631"; g.lineWidth = 8;
  g.beginPath(); g.roundRect(20, 44, 160, 40, 12); g.fill(); g.stroke();
  g.fillStyle = "#3a3a42"; g.beginPath(); g.moveTo(180, 30); g.lineTo(236, 22); g.lineTo(236, 106); g.lineTo(180, 98); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#fff6d0"; g.fillRect(228, 30, 8, 68);
};
const hh2 = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

// ---------------- per frame ----------------
export const stage = (id: number, f: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1], t = f / FPS, sc = sceneOf(s), c = ctxAt(f);
  LNAME = s.light;
  findSun(cam, SUN);
  if (sc.overlay === "hitam") return out;
  const sp = speakingAt(f), extra = sc.pose ?? {};
  const spKey = sp ? speakerKey(sp.who, sp.k, t) : "";
  KEYS.forEach((key, i) => {
    const pz = poseOf(key, t), def = E.tokoh[key];
    if (!pz.vis || (sc.hide ?? []).includes(key)) return;
    let rupaName = pz.rupa ?? def.rupa;
    if (sc.glitch && sc.glitch.key === key && f >= s.b - 45 && (f >= s.b - 36 || f % 3 === 0)) rupaName = sc.glitch.rupa;
    const R = RUPA_BY_NAME[rupaName];
    if (!R) return;
    const talking = spKey === key && sp;
    const bw = def.bicaraWajah ?? {};
    const G: Gaya = {
      wajah: ((talking ? bw[sp!.emo] ?? bw["*"] ?? FACE_OF[sp!.emo] : pz.w) ?? "datar") as Ekspresi,
      kedip: R.gayaRambut === "hantu" || rupaName.includes("PALSU") || rupaName.includes("PULANG") ? 0 : lidAt(t, i + 1), miring: pz.miring,
      belakang: (sc.back ?? []).includes(key),
      ...modeGaya(pz), ...(pz.extra as Partial<Gaya>),
      ...(extra[key] as Partial<Gaya> | undefined),
    };
    if (talking) G.bicara = sp!.mouth;
    tokoh(out, cam, key, R, pz.p, G, R.gayaRambut !== "hantu", pz.skala ?? 1);
    // sorot senter di tanah, ke arah lengan senter (kiri tokoh = +layar kanan -> arah -x dunia sebagai bawaan)
    const sen = (pz.extra.kiri as { pose?: string } | undefined)?.pose === "senter" || (pz.extra.kanan as { pose?: string } | undefined)?.pose === "senter";
    if (sen && s.light === "day" && hh2(Math.floor(f / 2), 3) > 0.1)
      out.fx.push({ key: "beam", cw: 256, ch: 256, draw: beamPool, x: pz.p[0] - 2.2, y: pz.p[1] + 0.03, z: pz.p[2] - 0.5, w: 3.2, h: 1.8, flat: true, soft: true, rot: 0.25 });
  });
  if (E.lampu !== false) for (const L of LAMPS) {
    if (Math.abs(L[0] - cam.pos.x) > 45) continue;
    out.fx.push({ key: "lampPool", cw: 256, ch: 256, draw: lampPool, x: L[0], y: 0.03, z: L[2] + 0.8, w: 7, h: 7, flat: true, soft: true });
  }
  for (const [x, z] of E.api ?? []) {
    if (Math.abs(x - cam.pos.x) > 40) continue;
    const ph = Math.round(((t * 1.6) % 1) * 8) / 8;
    out.fx.push({ key: `flame${ph}`, cw: 256, ch: 256, draw: (p) => flame(p, ph), x, y: 0.55, z, w: 0.9, h: 0.9 });
    out.fx.push({ key: "firePool", cw: 256, ch: 256, draw: lampPool, x, y: 0.03, z, w: 6 + 0.4 * Math.sin(t * 9), h: 6 + 0.4 * Math.sin(t * 9), flat: true, soft: true });
  }
  // benda tergeletak (senter yang masih menyala)
  for (const b of E.benda ?? []) {
    if ((b.dari !== undefined && t < tm(b.dari)) || (b.sampai !== undefined && t >= tm(b.sampai))) continue;
    out.fx.push({ key: "senterTanah", cw: 256, ch: 128, draw: senterGambar, x: b.p[0], y: 0.06, z: b.p[1], w: 0.45, h: 0.22, flat: true, rot: 0.6 });
    out.fx.push({ key: "beam", cw: 256, ch: 256, draw: beamPool, x: b.p[0] - 1.5, y: 0.03, z: b.p[1] - 0.9, w: 3.4, h: 1.7, flat: true, soft: true, rot: 0.6 });
  }
  for (const [i, b] of (sc.bayangan ?? []).entries()) {
    const len = b.len ?? 2.5;
    out.fx.push({ key: `shadowMan|${b.hantu ? 1 : 0}|${b.kepala === false ? 0 : 1}`, cw: 128, ch: 512, draw: (p) => shadowMan(p, !!b.hantu, b.kepala !== false), x: b.p[0], y: 0.035 + i * 0.001, z: b.p[1] - len / 2, w: 0.75, h: len, flat: true, soft: true, rot: 0 });
  }
  void c; void clamp01;
  return out;
};
