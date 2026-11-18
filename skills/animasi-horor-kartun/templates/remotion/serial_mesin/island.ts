// PETAKA GUNUNG: hutan pinus lereng gunung. Jalur setapak tanah sepanjang sumbu x (z = 0), pinus rapat di kiri-kanan,
// batu, akar, pondok pos 3 dengan satu lampu, tiang penanda jalur, dan siluet puncak gunung di kejauhan (tanpa kabut).
import * as THREE from "three";
import { Batch, Kit, V, boxGeo, lam, prop, setSight, Ray, house } from "./build";
import { ctex, rng } from "./paint";
import { twoTone } from "./shade";
import { NOINK } from "./ink";
import { hh, V3, LAMPS, POS_HUT, X_STOP, BASECAMP, MAKAM, JURANG_X, POHON, E, PURA, SAWAH_X } from "./story";
import { rumahKayu, gunungApi, pura, sawah } from "./latar_id";

export const worldUV = <M extends THREE.MeshLambertMaterial>(m: M, tile: number, key: string): M => {
  const prev = m.onBeforeCompile.bind(m), prevKey = m.customProgramCacheKey.bind(m);
  m.onBeforeCompile = (sh, r) => {
    prev(sh, r);
    sh.vertexShader = sh.vertexShader.replace("#include <uv_vertex>", `#include <uv_vertex>
      {
        vec4 wpU = vec4( position, 1.0 );
        #ifdef USE_INSTANCING
          wpU = instanceMatrix * wpU;
        #endif
        wpU = modelMatrix * wpU;
        vec3 nU = normal;
        #if defined( USE_MAP )
          vMapUv = abs( nU.y ) > 0.5 ? wpU.xz / ${tile.toFixed(2)} : vec2( wpU.x + wpU.z, wpU.y * 2.2 ) / ${tile.toFixed(2)};
        #endif
      }`);
  };
  m.customProgramCacheKey = () => prevKey() + "_wuv_" + key;
  return m;
};
const mats = new Map<string, THREE.MeshLambertMaterial>();
const wmat = (key: string, tile: number, make: () => THREE.MeshLambertMaterialParameters) => {
  let m = mats.get(key);
  if (!m) { m = worldUV(twoTone(new THREE.MeshLambertMaterial(make())), tile, key); mats.set(key, m); }
  return m;
};
const speck = (key: string, base: string, a: string, b: string, n = 700) => ctex(key, 512, 512, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let k = 0; k < n; k++) { g.fillStyle = r() < 0.5 ? a : b; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 6, 1.5 + r() * 3, r() * 3, 0, Math.PI * 2); g.fill(); }
});
const TXR = {
  forest: () => E.tanah === "abu" ? speck("ashFloor", "#6e6a6c", "rgba(40,38,42,0.45)", "rgba(170,165,160,0.35)", 1400)    // abu vulkanik
    : E.tanah === "kering" ? speck("dryFloor", "#8a7a52", "rgba(70,55,35,0.4)", "rgba(190,170,120,0.35)", 1400)              // savana kering (NTT)
    : speck("forestFloor", E.hutan === "tropis" ? "#4e6a36" : "#4a5a3c", "rgba(30,40,25,0.45)", "rgba(120,110,70,0.35)", 1400),
  trail: () => speck("trailDirt", "#8a7458", "rgba(70,55,40,0.4)", "rgba(170,150,120,0.35)", 900),
};

const yawM = (x: number, y: number, z: number, yaw = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(sx, sy, sz));

/** tempat yang harus kosong dari pohon (supaya tokoh tidak tertutup) */
const CLEAR: { x: number; z: number; r: number }[] = [
  { x: POS_HUT[0], z: POS_HUT[2], r: 6.5 }, { x: 59, z: -2.5, r: 4.5 },
  { x: 6, z: -8, r: 1.6 }, { x: X_STOP - 9, z: -8.5, r: 1.8 }, { x: POHON[0], z: POHON[2], r: 5 },
];
CLEAR.push({ x: MAKAM[0], z: MAKAM[2], r: 4.5 }, { x: PURA[0], z: PURA[2] - 4, r: 9 });
/** desa (x 122..172, |z| < 16) dan tepi jurang (x < JURANG_X + 6) bebas pohon */
const blocked = (x: number, z: number, pad = 0) => Math.abs(z) < 2.6 + pad || CLEAR.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + pad)
  || (x > 122 && x < 172 && Math.abs(z) < 16) || (x > SAWAH_X[0] - 3 && x < SAWAH_X[1] + 3 && Math.abs(z) < 26) || x < JURANG_X + 6;

export const buildWorld = (root: THREE.Object3D, kit: Kit, rays: Ray[]) => {
  setSight(rays);
  const b = new Batch(), r = rng(91);
  const M = {
    forest: wmat("forestW", 4, () => ({ map: TXR.forest() })),
    trail: wmat("trailW", 3, () => ({ map: TXR.trail() })),
    rock: lam("rockGrey", () => ({ color: "#7d7f86" })),
    rock2: lam("rockMoss", () => ({ color: "#5f6a58" })),
    wood: lam("postWood", () => ({ color: "#6a4a32" })),
    root: lam("rootDark", () => ({ color: "#4a3626" })),
    red: lam("markRed", () => ({ color: "#b8302c" })),
    pole: lam("lampPole", () => ({ color: "#30303a" })),
  };
  // tanah hutan + lereng naik di kedua sisi (z jauh lebih tinggi supaya terasa lereng)
  b.add(boxGeo(V(JURANG_X, -0.3, -200), V(260, 0, 200)), M.forest);
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const z0 = side * (22 + i * 12), y = (i + 1) * 1.6;
    b.add(boxGeo(V(JURANG_X, -0.3, Math.min(z0, z0 + side * 12)), V(260, y, Math.max(z0, z0 + side * 12))), M.forest);
  }
  // jurang: dinding tebing batu turun jauh, dasar gelap jauh di bawah
  b.add(boxGeo(V(JURANG_X - 0.6, -60, -200), V(JURANG_X, -0.3, 200)), M.rock);
  b.add(boxGeo(V(JURANG_X - 400, -80, -400), V(JURANG_X - 0.6, -79, 400)), lam("voidDark", () => ({ color: "#05070c" })));
  for (let i = 0; i < 18; i++) { const z = -14 + i * 1.7 + hh(i, 9); b.add(new THREE.DodecahedronGeometry(1, 0), M.rock, yawM(JURANG_X + 0.6 + hh(i, 3) * 1.2, 0.15, z, hh(i, 4) * 6, 0.5 + hh(i, 5) * 0.5, 0.4, 0.5)); }
  // jalur setapak tanah, sedikit berkelok
  for (let x = JURANG_X + 2; x < 176; x += 2) {
    const z = 0.5 * Math.sin(x * 0.07);
    b.add(boxGeo(V(-1.1, 0, -1.0 - 0.3 * hh(x, 1)), V(1.1, 0.012, 1.0 + 0.3 * hh(x, 2))), M.trail, yawM(x, 0, z, 0.08 * Math.sin(x)));
  }
  // akar melintang dan batu di pinggir jalur
  for (let i = 0; i < 70; i++) {
    const x = -110 + r() * 195, z = (r() < 0.5 ? -1 : 1) * (1.6 + r() * 6);
    if (CLEAR.some((c) => Math.hypot(x - c.x, z - c.z) < c.r)) continue;
    const s = 0.25 + r() * 0.7;
    b.add(new THREE.DodecahedronGeometry(1, 0), r() < 0.5 ? M.rock : M.rock2, yawM(x, s * 0.3, z, r() * 6, s * (1 + r()), s * 0.8, s));
  }
  for (let i = 0; i < 25; i++) {
    const x = -100 + r() * 180;
    b.add(new THREE.CylinderGeometry(0.06, 0.09, 2.4, 6).rotateZ(Math.PI / 2).rotateY(1.2 + r()), M.root, yawM(x, 0.04, 0.3 * (r() - 0.5)));
  }
  // pinus rapat (lebih tinggi menjauh dari jalur)
  for (let i = 0; i < (E.hutan === "gundul" ? 600 : 1300); i++) {
    const x = JURANG_X + r() * 330, z = (r() < 0.5 ? -1 : 1) * (3 + r() ** 0.8 * 55);
    if (blocked(x, z)) continue;
    const yb = Math.abs(z) > 22 ? Math.min(9.6, Math.floor((Math.abs(z) - 22) / 12 + 1) * 1.6) : 0;
    if (E.hutan === "gundul") { if (r() < 0.25) { const h = 4 + r() * 4; b.add(new THREE.CylinderGeometry(0.08, 0.22, h, 6).translate(0, h / 2, 0), M.root, yawM(x, yb, z)); } continue; }   // sesudah letusan: batang mati saja
    const jenis = E.hutan === "tropis" ? (r() < 0.5 ? "tree_fat" : r() < 0.5 ? "tree_oak" : "tree_default") : "tree_cone";
    prop(b, kit, jenis, x, yb, z, (E.hutan === "tropis" ? 6 + r() * 6 : 7 + r() * 9) + Math.abs(z) * 0.08, r() * 6);
  }
  // beberapa pohon mati (gundul) dekat jalur: batang + dahan
  for (let i = 0; i < 26; i++) {
    const x = -100 + r() * 170, z = (r() < 0.5 ? -1 : 1) * (3.2 + r() * 5);
    if (blocked(x, z, -0.4)) continue;
    const h = 4 + r() * 3;
    b.add(new THREE.CylinderGeometry(0.08, 0.2, h, 7).translate(0, h / 2, 0), M.root, yawM(x, 0, z));
    for (let k = 0; k < 4; k++) b.add(new THREE.CylinderGeometry(0.03, 0.06, 1.4, 5).translate(0, 0.7, 0).rotateZ(0.9 + r() * 0.5), M.root, yawM(x, h * (0.45 + k * 0.13), z, r() * 6));
  }
  // tiang penanda jalur (pita merah)
  for (const x of [48, 34, X_STOP + 4, 8, -10, -30]) {
    b.add(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 8).translate(0, 0.65, 0), M.wood, yawM(x, 0, 1.6));
    b.add(boxGeo(V(-0.07, 1.05, -0.07), V(0.07, 1.2, 0.07)), M.red, yawM(x, 0, 1.6));
  }
  // pondok pos 3 + papan nama + lampu
  house(b, POS_HUT[0], POS_HUT[2], 0, 6, 5, 3, 2);
  b.add(boxGeo(V(-0.05, 0, -0.05), V(0.05, 1.5, 0.05)), M.wood, yawM(56.4, 0, -1.6));
  b.add(boxGeo(V(-0.6, 1.25, -0.04), V(0.6, 1.7, 0.04)), lam("signBoard", () => ({ color: "#8a6a44" })), yawM(56.4, 0, -1.6));
  for (const [x, , z] of LAMPS) {
    b.add(new THREE.CylinderGeometry(0.06, 0.08, 3.0, 10).translate(0, 1.5, 0), M.pole, yawM(x, 0, z));
    b.add(boxGeo(V(-0.04, 2.92, -0.04), V(0.04, 2.98, 0.6)), M.pole, yawM(x, 0, z));
  }
  const glowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(5.0, 3.4, 1.6), fog: false });
  if (E.lampu !== false) for (const [x, , z] of LAMPS) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), glowM); m.position.set(x, 2.8, z + 0.6); root.add(m); }
  // pohon mati besar di tepi jurang: batang bengkok, dahan bercabang seperti tangan, akar mencengkeram
  {
    const bark = lam("barkDead", () => ({ color: "#3b2c22" })), [px, , pz] = POHON;
    b.add(new THREE.CylinderGeometry(0.28, 0.75, 9, 9).translate(0, 4.5, 0), bark, new THREE.Matrix4().compose(V(px, 0, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.06, 0, -0.09)), V(1, 1, 1)));
    for (let k = 0; k < 9; k++) {
      const h = 3.6 + k * 0.6, len = 3.2 - k * 0.22, ang = k * 2.2;
      b.add(new THREE.CylinderGeometry(0.05, 0.16, len, 6).translate(0, len / 2, 0).rotateZ(1.0 - 0.06 * k), bark, yawM(px + 0.3 * Math.sin(k), h, pz, ang));
      b.add(new THREE.CylinderGeometry(0.03, 0.07, len * 0.5, 5).translate(0, len * 0.25, 0).rotateZ(0.5), bark, yawM(px + Math.cos(ang) * len * 0.7, h + len * 0.55, pz - Math.sin(ang) * len * 0.7, ang + 0.8));
    }
    for (let k = 0; k < 6; k++) b.add(new THREE.CylinderGeometry(0.06, 0.18, 1.8, 6).rotateZ(1.25).translate(0.9, 0.1, 0), bark, yawM(px, 0, pz, k * 1.05));
  }
  // desa / basecamp kaki gunung: dua deret rumah menghadap jalur, pos basecamp, papan nama
  for (let i = 0; i < 5; i++) {
    const x = 126 + i * 10;
    if (E.desa === "barat") {
      if (Math.abs(x - BASECAMP[0]) > 3) house(b, x, -11 - hh(i, 7) * 2, 0, 7, 6, 3.4 + hh(i, 8), i + 1);
      house(b, x + 4, 11 + hh(i, 9) * 2, Math.PI, 7, 6, 3.2 + hh(i, 6), i + 4);
    } else {   // desa Indonesia: rumah kayu panggung beratap genteng
      if (Math.abs(x - BASECAMP[0]) > 3) rumahKayu(b, x, -10.5 - hh(i, 7) * 2, 0, 6.5, 5, i + 1);
      rumahKayu(b, x + 4, 10.5 + hh(i, 9) * 2, Math.PI, 6.5, 5, i + 4);
    }
  }
  house(b, BASECAMP[0], BASECAMP[2] - 2, 0, 9, 6, 3.6, 0);
  b.add(boxGeo(V(-0.06, 0, -0.06), V(0.06, 2.2, 0.06)), M.wood, yawM(124, 0, -2.2));
  b.add(boxGeo(V(-1.1, 1.7, -0.05), V(1.1, 2.4, 0.05)), lam("signBase", () => ({ color: "#2f5a3a" })), yawM(124, 0, -2.2));
  // makam tua: nisan batu miring, gundukan tanah, sesajen (bunga + kemenyan)
  const tomb = lam("tombStone", () => ({ color: "#8a8c86" })), soil = lam("graveSoil", () => ({ color: "#5a4632" })), flower = lam("flowerRed", () => ({ color: "#c43a3a" })), flowerY = lam("flowerYel", () => ({ color: "#e8c23a" }));
  for (let i = 0; i < 7; i++) {
    const x = MAKAM[0] - 3 + (i % 4) * 1.9 + hh(i, 1) * 0.4, z = MAKAM[2] - 1.2 - Math.floor(i / 4) * 2.4;
    b.add(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), soil, yawM(x, 0, z, 0, 0.55, 0.25, 1.0));
    b.add(boxGeo(V(-0.22, 0, -0.07), V(0.22, 0.7, 0.07)), tomb, new THREE.Matrix4().compose(V(x, 0, z - 0.95), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.15 * (hh(i, 2) - 0.5), 0, 0.25 * (hh(i, 3) - 0.5))), V(1, 1, 1)));
  }
  for (let i = 0; i < 9; i++) b.add(new THREE.SphereGeometry(0.07, 8, 6), i % 2 ? flower : flowerY, yawM(MAKAM[0] + 1.2 + (i % 3) * 0.16, 0.05, MAKAM[2] + 0.6 + Math.floor(i / 3) * 0.16));
  b.add(new THREE.CylinderGeometry(0.06, 0.08, 0.12, 10), lam("incense", () => ({ color: "#4a3a2a" })), yawM(MAKAM[0] + 0.7, 0.06, MAKAM[2] + 0.7));
  pura(b);
  sawah(b);
  b.build(root);
  gunungApi(root);
  // siluet puncak gunung (tidak terkena kabut) di kedua arah pandang
  const mtn = new THREE.MeshBasicMaterial({ color: "#0e1322", fog: false });
  const mtn2 = new THREE.MeshBasicMaterial({ color: "#151b2e", fog: false });
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, d = 700 + (i % 3) * 90, h = 160 + hh(i, 4) * 220;
    const m = new THREE.Mesh(new THREE.ConeGeometry(220 + hh(i, 5) * 160, h, 7), i % 2 ? mtn : mtn2);
    m.position.set(Math.cos(a) * d, h / 2 - 20, Math.sin(a) * d); m.rotation.y = hh(i, 6) * 3;
    m.layers.set(NOINK); m.renderOrder = -0.8; m.frustumCulled = false;
    root.add(m);
  }
};

/** pengganti kapal template (tidak dipakai): grup kosong */
export class Ship {
  group = new THREE.Group();
  constructor(root: THREE.Object3D) { root.add(this.group); this.group.visible = false; }
  pose(pos: V3, yaw: number, _ice: number, roll = 0) { this.group.position.set(...pos); this.group.rotation.set(roll, yaw, 0, "YXZ"); }
}
