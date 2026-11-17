// Foto profil kanal (1600x1600, dipakai 800x800): topeng si Psikopat ("The Smiling Man") di depan bulan purnama,
// malam bersalju, siluet rumah & pinus Maple Hollow. Semua isi penting di dalam lingkaran tengah (YouTube memotong bulat).
import { gambarTokoh, PSIKO } from "../tokoh/tokoh";

const S = 1600, cv = document.createElement("canvas");
cv.width = S; cv.height = S; document.body.appendChild(cv);
const g = cv.getContext("2d")!;
const rnd = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

// langit malam
const sky = g.createRadialGradient(S * 0.5, S * 0.42, 50, S * 0.5, S * 0.5, S * 0.75);
sky.addColorStop(0, "#2c3a5e"); sky.addColorStop(0.55, "#16203a"); sky.addColorStop(1, "#070a14");
g.fillStyle = sky; g.fillRect(0, 0, S, S);
// bulan purnama di belakang kepala + cahaya
const mx = S * 0.5, my = S * 0.4;
const halo = g.createRadialGradient(mx, my, 200, mx, my, 760);
halo.addColorStop(0, "rgba(230,236,255,0.35)"); halo.addColorStop(1, "rgba(230,236,255,0)");
g.fillStyle = halo; g.fillRect(0, 0, S, S);
g.fillStyle = "#e9ecf2"; g.beginPath(); g.arc(mx, my, 520, 0, Math.PI * 2); g.fill();
g.fillStyle = "rgba(170,180,205,0.35)";
for (const [x, y, r] of [[-180, -160, 90], [150, 60, 120], [-60, 230, 70], [240, -230, 55], [-280, 90, 45]] as const) { g.beginPath(); g.arc(mx + x, my + y, r, 0, Math.PI * 2); g.fill(); }
// siluet pinus & atap rumah di bawah
g.fillStyle = "#0b101d";
for (let i = 0; i < 9; i++) {
  const x = -60 + i * 215 + rnd(i, 1) * 60, h = 330 + rnd(i, 2) * 220, w = 150 + rnd(i, 3) * 60;
  g.beginPath(); g.moveTo(x, S); g.lineTo(x + w / 2, S - h); g.lineTo(x + w, S); g.fill();
}
g.fillStyle = "#0e1424";
g.beginPath(); g.moveTo(0, S); g.lineTo(0, S - 230); g.lineTo(220, S - 360); g.lineTo(440, S - 230); g.lineTo(440, S); g.fill();
g.beginPath(); g.moveTo(S, S); g.lineTo(S, S - 250); g.lineTo(S - 230, S - 390); g.lineTo(S - 460, S - 250); g.lineTo(S - 460, S); g.fill();

// si Psikopat: kepala & bahu, menatap ke depan, kepala sedikit miring
g.save();
const k = 3.55;
g.translate(S / 2 - 300 * k, S * 0.53 - 310 * k);
g.scale(k, k);
gambarTokoh(g, PSIKO, { wajah: "datar", miring: 9, light: -2.4, kanan: { pose: "kapak" } });
g.restore();

// salju turun
for (let i = 0; i < 220; i++) {
  const x = rnd(i, 4) * S, y = rnd(i, 5) * S, r = 2 + rnd(i, 6) * 7;
  g.globalAlpha = 0.35 + 0.5 * rnd(i, 7); g.fillStyle = "#eef3ff"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
g.globalAlpha = 1;
// vinyet
const vg = g.createRadialGradient(S / 2, S / 2, S * 0.36, S / 2, S / 2, S * 0.72);
vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.6)");
g.fillStyle = vg; g.fillRect(0, 0, S, S);
