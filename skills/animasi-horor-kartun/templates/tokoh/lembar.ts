// Lembar karakter HOROR USA (bukan bagian video): 4 pemeran berdiri dengan pose khas + baris ekspresi.
// Bundel: esbuild lembar.ts --bundle --format=iife --outfile=lembar.js, lalu buka lembar.html di Chrome headless.
import { gambarTokoh, gambarKepala, JAKE, EMILY, MILLER, PSIKO, Gaya, Rupa, Ekspresi } from "./tokoh";

const W = 2400, H = 1560;
const cv = document.createElement("canvas");
cv.width = W; cv.height = H; document.body.appendChild(cv);
const g = cv.getContext("2d")!;
const bg = g.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, "#121726"); bg.addColorStop(0.65, "#252d45"); bg.addColorStop(1, "#141826");
g.fillStyle = bg; g.fillRect(0, 0, W, H);
g.fillStyle = "#e9e6d6"; g.beginPath(); g.arc(2230, 120, 60, 0, Math.PI * 2); g.fill(); // bulan
g.fillStyle = "#121726"; g.beginPath(); g.arc(2255, 105, 54, 0, Math.PI * 2); g.fill();
g.fillStyle = "#1a1f2e"; g.fillRect(0, 1000, W, 70);
g.fillStyle = "#e9e6d6"; g.font = "bold 44px Arial"; g.fillText("HOROR USA — pemeran (dikejar psikopat)", 40, 64);

const label = (t: string, sub: string, x: number, y: number) => {
  g.textAlign = "center"; g.fillStyle = "#f2efe4"; g.font = "bold 34px Arial"; g.fillText(t, x, y);
  g.fillStyle = "#9aa3b8"; g.font = "24px Arial"; g.fillText(sub, x, y + 32); g.textAlign = "left";
};

const top: [Rupa, Gaya, string][] = [
  [JAKE, { wajah: "teriak", lari: true, jalan: 0.25, langkah: 1 }, "berlari, teriak"],
  [EMILY, { wajah: "takut", kiri: { pose: "senter" }, kanan: { pose: "takut", k: 1 }, lihat: [0.6, 0], sorot: true }, "senter, ketakutan"],
  [MILLER, { wajah: "seram", kiri: { pose: "dadah", k: 1, w: 0.2 }, lihat: [-0.4, 0] }, "melambai, senyum seram"],
  [PSIKO, { wajah: "datar", kanan: { pose: "kapak" }, lihat: [-0.4, 0] }, "membawa kapak"],
];
top.forEach(([r, gy, sub], i) => {
  g.save(); g.translate(i * 600, 40); gambarTokoh(g, r, { light: -2.3, ...gy }); g.restore();
  label(r.nama, sub, i * 600 + 300, 1110);
});

const EX: Ekspresi[] = ["datar", "cemas", "takut", "kaget", "teriak"];
[JAKE, EMILY].forEach((r, j) => EX.forEach((e, i) => {
  const k = j * 5 + i, cx = 120 + k * 240, cy = 1300, s = 0.7;
  g.save(); g.translate(cx - 300 * s, cy - 310 * s); g.scale(s, s); gambarKepala(g, r, { wajah: e, light: -2.3 }); g.restore();
  label(e, r.nama, cx, 1460);
}));
