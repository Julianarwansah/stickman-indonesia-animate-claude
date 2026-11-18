// LATAR INDONESIA untuk serial_mesin: gunung api yang terlihat, pura Bali (candi bentar + meru), rumah kayu panggung, sawah berundak.
// Dulu desa = rumah ala Amerika berdaun jendela biru dan gunung hanya siluet jauh yang tertelan kabut -> latar tidak cocok cerita.
// Semua dibangun sekali ke Batch dunia (gaya toon + garis tinta sama dengan aset lain). Koordinat diekspor dari story.ts.
import * as THREE from "three";
import { Batch, V, boxGeo, lam, quad, tri } from "./build";
import { ctex, rep } from "./paint";
import { hh, E, PURA, SAWAH_X } from "./story";

const yawM = (x: number, y: number, z: number, yaw = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), yaw), V(sx, sy, sz));

/** papan kayu vertikal (dinding rumah panggung) */
const papan = (key: string, base: string) => ctex("papan" + key, 256, 256, (g, r) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 32) {
    g.fillStyle = `rgba(40,22,10,${0.25 + 0.15 * r()})`; g.fillRect(x, 0, 3, 256);                       // celah papan
    g.fillStyle = `rgba(255,230,190,${0.06 + 0.06 * r()})`; g.fillRect(x + 6, 0, 10, 256);               // serat terang
    for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(50,28,12,0.35)"; g.beginPath(); g.ellipse(x + 16, r() * 256, 2.5, 5, 0, 0, 7); g.fill(); } // mata kayu
  }
});
/** genteng tanah liat: deret lengkung */
const genteng = (key: string, base: string) => ctex("genteng" + key, 256, 256, (g) => {
  g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < 256; x += 32) {
    g.fillStyle = "rgba(60,20,10,0.35)"; g.fillRect(x, y + 26, 32, 6);
    g.fillStyle = "rgba(255,200,160,0.12)"; g.beginPath(); g.ellipse(x + 16, y + 10, 12, 8, 0, Math.PI, 0); g.fill();
  }
});
/** bata merah ekspos (pura Bali) */
const bataBali = () => ctex("bataBali", 256, 256, (g, r) => {
  g.fillStyle = "#a9553a"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) for (let x = (y / 16) % 2 ? -24 : 0; x < 256; x += 48) {
    g.fillStyle = `rgba(${150 + r() * 40},${70 + r() * 20},${50 + r() * 15},1)`; g.fillRect(x + 1, y + 1, 46, 14);
  }
});

/** rumah kayu panggung: tiang, lantai, dinding papan, atap genteng curam, teras + tangga, jendela kayu */
export const rumahKayu = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, si: number) => {
  const m = yawM(x, 0, z, yaw), hp = 0.9, h = 2.6, hw = w / 2, hd = d / 2, rh = d * 0.62, o = 0.6;
  const dindingWarna = ["#9a6a40", "#8a5a34", "#a8784a", "#7e5232"][si % 4], atapWarna = ["#a5482e", "#8f3f2a", "#b0563a", "#6a4a3a"][si % 4];
  const tiang = lam("tiangKayu", () => ({ color: "#5a3a22" })), lantai = lam("lantaiKayu", () => ({ color: "#7a5032" }));
  const dinding = lam("dindingPapan" + si % 4, () => ({ map: rep(papan(String(si % 4), dindingWarna), w / 2, 1) }));
  const atap = lam("atapGenteng" + si % 4, () => ({ map: rep(genteng(String(si % 4), atapWarna), w / 1.5, 2), side: THREE.DoubleSide }));
  const gelap = lam("jendelaGelap", () => ({ color: "#1e1610" })), daun = lam("daunJendela", () => ({ color: "#5e3c22" }));
  for (const tx of [-hw, 0, hw]) for (const tz of [-hd, hd]) b.add(new THREE.CylinderGeometry(0.1, 0.12, hp, 8).translate(0, hp / 2, 0), tiang, m.clone().multiply(new THREE.Matrix4().makeTranslation(tx, 0, tz)));
  b.add(boxGeo(V(-hw - 0.1, hp, -hd - 0.1), V(hw + 0.1, hp + 0.18, hd + 1.4)), lantai, m);                // lantai + teras depan
  const y0 = hp + 0.18;
  b.add(quad(V(-hw, y0, hd), V(hw, y0, hd), V(hw, y0 + h, hd), V(-hw, y0 + h, hd), w / 2, 1), dinding, m);
  b.add(quad(V(hw, y0, -hd), V(-hw, y0, -hd), V(-hw, y0 + h, -hd), V(hw, y0 + h, -hd), w / 2, 1), dinding, m);
  b.add(quad(V(-hw, y0, -hd), V(-hw, y0, hd), V(-hw, y0 + h, hd), V(-hw, y0 + h, -hd), d / 2, 1), dinding, m);
  b.add(quad(V(hw, y0, hd), V(hw, y0, -hd), V(hw, y0 + h, -hd), V(hw, y0 + h, hd), d / 2, 1), dinding, m);
  b.add(tri(V(-hw, y0 + h, -hd), V(-hw, y0 + h, hd), V(-hw, y0 + h + rh, 0)), dinding, m);
  b.add(tri(V(hw, y0 + h, hd), V(hw, y0 + h, -hd), V(hw, y0 + h + rh, 0)), dinding, m);
  // atap curam menjorok (menaungi teras)
  b.add(quad(V(-hw - o, y0 + h - 0.5, hd + 1.5), V(hw + o, y0 + h - 0.5, hd + 1.5), V(hw + o, y0 + h + rh, 0), V(-hw - o, y0 + h + rh, 0), 1, 1), atap, m);
  b.add(quad(V(hw + o, y0 + h - 0.5, -hd - o), V(-hw - o, y0 + h - 0.5, -hd - o), V(-hw - o, y0 + h + rh, 0), V(hw + o, y0 + h + rh, 0), 1, 1), atap, m);
  b.add(boxGeo(V(-hw - o, y0 + h + rh - 0.05, -0.12), V(hw + o, y0 + h + rh + 0.15, 0.12)), lam("bubungan", () => ({ color: "#4a2a1c" })), m);   // bubungan
  for (const tx of [-hw + 0.3, hw - 0.3]) b.add(new THREE.CylinderGeometry(0.07, 0.07, h + 0.2, 6).translate(0, y0 + h / 2, 0), tiang, m.clone().multiply(new THREE.Matrix4().makeTranslation(tx, 0, hd + 1.3)));   // tiang teras
  // pintu + 2 jendela berdaun kayu terbuka
  b.add(boxGeo(V(-0.45, y0, hd - 0.02), V(0.45, y0 + 2.0, hd + 0.03)), gelap, m);
  for (const sx of [-1, 1]) {
    const cx = sx * hw * 0.58;
    b.add(boxGeo(V(cx - 0.4, y0 + 0.9, hd - 0.02), V(cx + 0.4, y0 + 1.8, hd + 0.03)), gelap, m);
    for (const s2 of [-1, 1]) b.add(boxGeo(V(cx + s2 * 0.4 + (s2 < 0 ? -0.38 : 0), y0 + 0.88, hd + 0.03), V(cx + s2 * 0.4 + (s2 < 0 ? 0 : 0.38), y0 + 1.82, hd + 0.08)), daun, m);
  }
  for (let k = 0; k < 3; k++) b.add(boxGeo(V(-0.5, k * 0.3, hd + 1.4 + (2 - k) * 0.3), V(0.5, k * 0.3 + 0.08, hd + 1.4 + (3 - k) * 0.3)), lantai, m);   // tangga
};

/** gunung api besar yang terlihat dari jalur dan desa: kerucut berlapis, kawah terpotong, alur lereng, asap tipis.
 *  Tanpa kabut (kabut dunia hanya ±35 m) supaya bentuknya selalu terbaca. `E.gunungApi = [x, z]` memindah, `false` mematikan. */
export const gunungApi = (root: THREE.Object3D) => {
  if (E.gunungApi === false) return;
  const [gx, gz] = E.gunungApi ?? [60, -230];
  const g = new THREE.Group(); g.position.set(gx, -6, gz);
  const lereng = new THREE.MeshLambertMaterial({ color: "#3a3440", fog: false }), atas = new THREE.MeshLambertMaterial({ color: "#4a4248", fog: false });
  const alur = new THREE.MeshLambertMaterial({ color: "#2a2430", fog: false });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(70, 190, 70, 28, 1, true), lereng));
  const puncak = new THREE.Mesh(new THREE.CylinderGeometry(16, 70, 42, 28, 1, true), atas); puncak.position.y = 56; g.add(puncak);
  for (let i = 0; i < 14; i++) {                                                     // alur erosi di lereng
    const a = (i / 14) * Math.PI * 2 + hh(i, 3) * 0.2, rr = new THREE.Mesh(new THREE.BoxGeometry(3 + 3 * hh(i, 4), 1.5, 150), alur);
    rr.position.set(Math.cos(a) * 112, 42, Math.sin(a) * 112); rr.lookAt(Math.cos(a) * 16, 98, Math.sin(a) * 16); g.add(rr);
  }
  const kawah = new THREE.Mesh(new THREE.CircleGeometry(16, 24), new THREE.MeshBasicMaterial({ color: E.kawahMenyala ? new THREE.Color(2.4, 0.7, 0.15) : new THREE.Color("#1a1418"), fog: false }));
  kawah.rotation.x = -Math.PI / 2; kawah.position.y = 76.5; g.add(kawah);
  const asap = new THREE.MeshLambertMaterial({ color: "#8a8490", fog: false, transparent: true, opacity: 0.8 });
  for (let i = 0; i < (E.asapGunung === false ? 0 : 9); i++) {                     // asap tipis condong ke satu sisi
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(9 + i * 2.2, 1), asap); s.position.set(i * 7, 84 + i * 9, -i * 2); s.scale.y = 0.7; g.add(s);
  }
  g.traverse((o) => { o.frustumCulled = false; (o as THREE.Mesh).renderOrder = -0.5; });
  root.add(g);
};

/** pura Bali: tembok bata keliling, candi bentar (gerbang terbelah), 2 meru beratap ijuk bertingkat, payung tedung, pelinggih kecil */
export const pura = (b: Batch) => {
  const [px, , pz] = PURA, bata = lam("bataBali", () => ({ map: rep(bataBali(), 1, 1) })), paras = lam("batuParas", () => ({ color: "#b8ad96" }));
  const ijuk = lam("ijuk", () => ({ color: "#2a221c" })), kayu = lam("kayuPura", () => ({ color: "#6a3e24" }));
  // tembok keliling 14 x 10 m (depan menghadap jalur, +z), celah gerbang di tengah depan
  for (const [x0, z0, x1, z1] of [[-7, -10, 7, -9.6], [-7, -10, -6.6, 0], [6.6, -10, 7, 0], [-7, -0.4, -1.6, 0], [1.6, -0.4, 7, 0]] as const)
    b.add(boxGeo(V(px + x0, 0, pz + z0), V(px + x1, 1.5, pz + z1)), bata);
  // candi bentar: dua menara bertingkat menyempit, sisi dalam rata
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) {
    const w = 1.6 - k * 0.26, y0 = k * 1.05, xi = s * 1.2;
    b.add(boxGeo(V(px + Math.min(xi, xi + s * w), y0, pz - 0.9 + k * 0.12), V(px + Math.max(xi, xi + s * w), y0 + 1.0, pz + 0.9 - k * 0.12)), k % 2 ? paras : bata);
  }
  // meru (pagoda bertumpang): badan bata + atap ijuk menyempit
  for (const [mx, mz, n] of [[-3.6, -6.5, 5], [3.4, -7, 3]] as const) {
    b.add(boxGeo(V(px + mx - 1.1, 0, pz + mz - 1.1), V(px + mx + 1.1, 1.6, pz + mz + 1.1)), bata);
    b.add(boxGeo(V(px + mx - 0.6, 1.6, pz + mz - 0.6), V(px + mx + 0.6, 2.4, pz + mz + 0.6)), kayu);
    for (let k = 0; k < n; k++) {
      const r0 = 1.9 - k * 0.28, y = 2.4 + k * 0.85;
      b.add(new THREE.CylinderGeometry(r0 * 0.45, r0, 0.55, 4).rotateY(Math.PI / 4).translate(0, y + 0.27, 0), ijuk, yawM(px + mx, 0, pz + mz));
      b.add(new THREE.CylinderGeometry(0.35, 0.35, 0.3, 8).translate(0, y + 0.7, 0), kayu, yawM(px + mx, 0, pz + mz));
    }
  }
  // pelinggih kecil + payung tedung kuning/putih di depan gerbang
  b.add(boxGeo(V(px - 0.5, 0, pz - 4.2), V(px + 0.5, 1.3, pz - 3.4)), paras);
  b.add(new THREE.ConeGeometry(0.7, 0.6, 4).rotateY(Math.PI / 4).translate(0, 1.6, 0), ijuk, yawM(px, 0, pz - 3.8));
  for (const [tx, col] of [[-2.4, "#e8c43a"], [2.4, "#f2efe4"]] as const) {
    b.add(new THREE.CylinderGeometry(0.04, 0.04, 2.6, 6).translate(0, 1.3, 0), kayu, yawM(px + tx, 0, pz + 0.9));
    b.add(new THREE.ConeGeometry(0.75, 0.35, 12, 1, true).translate(0, 2.65, 0), lam("tedung" + col, () => ({ color: col, side: THREE.DoubleSide })), yawM(px + tx, 0, pz + 0.9));
  }
};

/** sawah berundak di luar desa: petak air hijau-kebiruan, pematang tanah, undak naik menjauh dari jalur, gubuk kecil */
export const sawah = (b: Batch) => {
  const [x0, x1] = SAWAH_X, padi = lam("padiMuda", () => ({ color: "#6f9a4a" })), air = lam("airSawah", () => ({ color: "#5d7f7a" })), tanah = lam("pematang", () => ({ color: "#6a5236" }));
  for (const side of [-1, 1]) for (let row = 0; row < 6; row++) {
    const za = side * (3.2 + row * 3.4), zb = za + side * 3.2, y = row * 0.45;
    for (let x = x0; x < x1; x += 6) {
      const isAir = hh(x * 0.3 + row, side + 2) < 0.35;
      b.add(boxGeo(V(x + 0.15, -0.3, Math.min(za, zb) + 0.15), V(x + 5.85, y + 0.02, Math.max(za, zb) - 0.15)), isAir ? air : padi);
      b.add(boxGeo(V(x, -0.3, Math.min(za, zb)), V(x + 6, y + 0.14, Math.min(za, zb) + 0.15)), tanah);
      b.add(boxGeo(V(x, -0.3, Math.min(za, zb)), V(x + 0.15, y + 0.14, Math.max(za, zb))), tanah);
    }
  }
  // gubuk sawah (dangau): 4 tiang + atap ijuk
  const gx = x0 + 14, gz = -9, kayu = lam("tiangKayu", () => ({ color: "#5a3a22" }));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.add(new THREE.CylinderGeometry(0.07, 0.08, 2.4, 6).translate(0, 1.2, 0), kayu, yawM(gx + dx, 0.9, gz + dz));
  b.add(boxGeo(V(gx - 1.2, 1.5, gz - 1.2), V(gx + 1.2, 1.6, gz + 1.2)), kayu);
  b.add(new THREE.ConeGeometry(2.2, 1.4, 4).rotateY(Math.PI / 4).translate(0, 4.0, 0), lam("ijuk", () => ({ color: "#2a221c" })), yawM(gx, 0, gz));
};
