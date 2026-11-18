/** sampul.ts — sampul Shorts 1080x1920 yang memancing klik, digambar dengan tokoh yang SAMA dengan video (tokoh.ts), tanpa Remotion.
 *
 *    node sampul.ts <spek.json> <folder_keluar> [nomor_ep...]
 *  Env: TOKOH = path tokoh.ts mesin serial (default ./tokoh.ts), FONT = font tebal (default Arial Black Mac).
 *
 *  Resep (riset CTR thumbnail): 1 fokus = wajah besar dengan emosi berlebihan; ancaman terlihat SEBAGIAN (celah penasaran) + lingkaran/panah merah;
 *  teks 2-4 kata kontras tinggi yang melengkapi judul (bukan mengulang); elemen penting di area aman tengah (hindari 25 % bawah & 15 % kanan);
 *  branding serial konsisten; tetap terbaca di ukuran 25 %; jujur — semua yang tampak ada di episodenya.
 */
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
type Canvas = ReturnType<typeof createCanvas>;
type SKRSContext2D = ReturnType<Canvas["getContext"]>;
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, dirname, join } from "node:path";
import { tmpdir } from "node:os";

// tokoh.ts mesin bisa meng-import ./ep.json (pemeran per episode): Node tidak bisa langsung, jadi salin ke folder sementara
// dengan ep.json yang ada di sebelahnya (atau EP_JSON) disisipkan sebagai objek.
const tokohPath = resolve(process.env.TOKOH ?? "./tokoh.ts");
let src = readFileSync(tokohPath, "utf8");
const epJson = process.env.EP_JSON ?? join(dirname(tokohPath), "ep.json");
let epObj = "{}"; try { epObj = readFileSync(epJson, "utf8"); } catch { /* tanpa pemeran khusus */ }
src = src.replace(/import\s+(\w+)\s+from\s+"\.\/ep\.json";/, (_m, n) => `const ${n} = ${epObj};`);
const tmp = join(tmpdir(), `tokoh_sampul_${process.pid}.ts`); writeFileSync(tmp, src);
const T = await import(pathToFileURL(tmp).href);
GlobalFonts.registerFromPath(process.env.FONT ?? "/System/Library/Fonts/Supplemental/Arial Black.ttf", "Tebal");
const W = 1080, H = 1920;
type G = SKRSContext2D;

type Tokoh = { rupa: string; wajah?: string; x: number; y: number; s: number; lihat?: [number, number]; kanan?: object; kiri?: object;
  gelap?: number; cahaya?: string; potong?: "bawah" };
type Spek = {
  ep: number; seri: string; teks: string; kunci?: string[]; latar?: "hutan" | "makam" | "pos" | "jurang" | "desa";
  pohonMati?: boolean; api?: [number, number]; bulan?: [number, number];
  tokoh?: Tokoh[];                      // digambar berurutan (belakang dulu)
  hp?: { x: number; y: number; w: number; h: number; isi: Tokoh[]; jam?: string };
  depan?: Tokoh[];                      // digambar di depan HP
  lingkar?: { x: number; y: number; rx: number; ry: number }[];
  panah?: { dari: [number, number]; ke: [number, number] }[];
  tanya?: [number, number][];           // tanda tanya merah besar
  huruf?: { t: string; x: number; y: number }[];   // lencana pilihan A/B (lingkaran merah/kuning)
  warna?: string;                       // aksen (default merah)
};

const rnd = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };

/** gambar satu tokoh: kepala (300,310) unit desain dipetakan ke (x,y), skala s; gelap 0..1 = ditelan malam; cahaya = pendar tepi */
const tokoh = (g: G, t: Tokoh) => {
  const R = T.RUPA_BY_NAME[t.rupa]; if (!R) throw new Error("rupa tidak ada: " + t.rupa);
  const cw = Math.ceil(600 * t.s), ch = Math.ceil(1000 * t.s), off = createCanvas(cw, ch), o = off.getContext("2d");
  o.scale(t.s, t.s);
  T.gambarTokoh(o, R, { wajah: t.wajah ?? "datar", lihat: t.lihat, ...(t.kanan ? { kanan: t.kanan } : {}), ...(t.kiri ? { kiri: t.kiri } : {}) });
  if (t.gelap) { o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = "source-atop"; o.fillStyle = `rgba(8,12,30,${t.gelap})`; o.fillRect(0, 0, cw, ch); }
  const x0 = t.x - 300 * t.s, y0 = t.y - 310 * t.s;
  if (t.cahaya) { g.save(); g.shadowColor = t.cahaya; g.shadowBlur = 60; g.drawImage(off, x0, y0); g.restore(); }
  g.drawImage(off, x0, y0);
};

const latar = (g: G, sp: Spek) => {
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#070a1a"); bg.addColorStop(0.45, "#141c38"); bg.addColorStop(0.8, "#1c1530"); bg.addColorStop(1, "#2a0c14");
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const [mx, my] = sp.bulan ?? [820, 330];
  const mg = g.createRadialGradient(mx, my, 40, mx, my, 420); mg.addColorStop(0, "rgba(220,230,255,0.55)"); mg.addColorStop(1, "rgba(220,230,255,0)");
  g.fillStyle = mg; g.fillRect(0, 0, W, H);
  g.fillStyle = "#e8ecf6"; g.beginPath(); g.arc(mx, my, 110, 0, 7); g.fill();
  g.fillStyle = "rgba(170,180,205,0.35)"; for (const [dx, dy, r] of [[-30, -20, 22], [35, 25, 16], [10, 50, 12]]) { g.beginPath(); g.arc(mx + dx, my + dy, r, 0, 7); g.fill(); }
  // pinus berlapis (jauh terang -> dekat gelap)
  for (const [lay, base, col, n] of [[0, 1050, "#1a2442", 9], [1, 1200, "#111a32", 8], [2, 1380, "#0a1022", 7]] as const) {
    g.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const x = (i + rnd(i, lay)) * (W / (n - 1)) - 60, h = 380 + 300 * rnd(i, lay + 5) + lay * 120, w = 150 + 90 * rnd(i, lay + 9);
      g.beginPath(); g.moveTo(x, base - h);
      for (let k = 1; k <= 4; k++) { g.lineTo(x + (w * k) / 4 / 1.0, base - h + (h * k) / 4); g.lineTo(x + (w * k) / 8, base - h + (h * k) / 4); }
      for (let k = 4; k >= 1; k--) { g.lineTo(x - (w * k) / 8, base - h + (h * k) / 4); g.lineTo(x - (w * k) / 4, base - h + (h * k) / 4); }
      g.closePath(); g.fill(); g.fillRect(x - w / 2, base, w, 900);
    }
  }
  if (sp.pohonMati) {   // pohon mati bercabang seperti tangan
    const tg = g.createRadialGradient(260, 1030, 30, 260, 1030, 420); tg.addColorStop(0, "rgba(200,215,245,0.85)"); tg.addColorStop(0.35, "rgba(150,170,220,0.4)"); tg.addColorStop(1, "rgba(150,170,220,0)");
    g.fillStyle = tg; g.fillRect(0, 500, W, 1100);   // cahaya pucat di balik pohon: siluet terbaca
    g.strokeStyle = "#05060c"; g.lineCap = "round";
    const br =(x: number, y: number, a: number, len: number, w: number, d: number) => {
      if (d > 6 || len < 12) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      br(x2, y2, a - 0.45 - 0.2 * rnd(d, x), len * 0.72, w * 0.68, d + 1); br(x2, y2, a + 0.4 + 0.2 * rnd(d, y), len * 0.7, w * 0.68, d + 1);
    };
    br(250, 1500, -Math.PI / 2 - 0.08, 330, 46, 0);
  }
  if (sp.latar === "makam") {   // nisan miring
    for (let i = 0; i < 6; i++) {
      const x = 90 + i * 170 + 30 * rnd(i, 3), y = 1330 + 40 * rnd(i, 4), a = (rnd(i, 7) - 0.5) * 0.25;
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = "#3a3e4c"; g.strokeStyle = "#0b0a12"; g.lineWidth = 6;
      g.beginPath(); g.roundRect(-45, -150, 90, 170, [40, 40, 4, 4]); g.fill(); g.stroke(); g.restore();
    }
  }
  if (sp.latar === "pos") {   // siluet pondok + lampu
    g.fillStyle = "#06080f"; g.fillRect(620, 980, 420, 360); g.beginPath(); g.moveTo(590, 990); g.lineTo(830, 820); g.lineTo(1070, 990); g.fill();
    g.fillStyle = "rgba(255,190,90,0.9)"; g.fillRect(700, 1060, 90, 80);
  }
  if (sp.api) {   // api unggun
    const [ax, ay] = sp.api, fg = g.createRadialGradient(ax, ay, 10, ax, ay, 380); fg.addColorStop(0, "rgba(255,140,40,0.6)"); fg.addColorStop(1, "rgba(255,90,20,0)");
    g.fillStyle = fg; g.fillRect(0, 0, W, H);
    for (const [c, s] of [["#ff5a1e", 1], ["#ffb02e", 0.62], ["#fff2b0", 0.3]] as const) {
      g.fillStyle = c; g.beginPath(); g.moveTo(ax - 70 * s, ay); g.quadraticCurveTo(ax - 60 * s, ay - 120 * s, ax, ay - 200 * s); g.quadraticCurveTo(ax + 60 * s, ay - 120 * s, ax + 70 * s, ay); g.closePath(); g.fill();
    }
  }
  // kabut bawah + cahaya merah
  const fog = g.createLinearGradient(0, 1150, 0, 1650); fog.addColorStop(0, "rgba(150,165,200,0)"); fog.addColorStop(1, "rgba(150,165,200,0.28)");
  g.fillStyle = fog; g.fillRect(0, 1150, W, 770);
  const red = g.createRadialGradient(W / 2, H + 100, 50, W / 2, H + 100, 900); red.addColorStop(0, "rgba(200,20,30,0.55)"); red.addColorStop(1, "rgba(200,20,30,0)");
  g.fillStyle = red; g.fillRect(0, 0, W, H);
};

const hp = (g: G, p: NonNullable<Spek["hp"]>) => {
  g.save(); g.shadowColor = "rgba(0,0,0,0.8)"; g.shadowBlur = 50;
  g.fillStyle = "#0c0c10"; g.beginPath(); g.roundRect(p.x, p.y, p.w, p.h, 60); g.fill(); g.restore();
  g.strokeStyle = "#3a3a44"; g.lineWidth = 8; g.beginPath(); g.roundRect(p.x, p.y, p.w, p.h, 60); g.stroke();
  const sx = p.x + 26, sy = p.y + 26, sw = p.w - 52, sh = p.h - 52;
  g.save(); g.beginPath(); g.roundRect(sx, sy, sw, sh, 40); g.clip();
  const bg = g.createLinearGradient(0, sy, 0, sy + sh); bg.addColorStop(0, "#1c2638"); bg.addColorStop(0.6, "#2c3c3a"); bg.addColorStop(1, "#141a18");
  g.fillStyle = bg; g.fillRect(sx, sy, sw, sh);
  g.fillStyle = "rgba(20,40,30,0.9)"; for (let i = 0; i < 7; i++) { const x = sx + i * (sw / 6) - 30; g.beginPath(); g.moveTo(x - 50, sy + sh * 0.62); g.lineTo(x, sy + sh * 0.12); g.lineTo(x + 50, sy + sh * 0.62); g.fill(); }
  for (const t of p.isi) tokoh(g, t);
  const fl = g.createRadialGradient(sx + sw / 2, sy + sh * 0.4, 40, sx + sw / 2, sy + sh * 0.4, sw); fl.addColorStop(0, "rgba(255,255,255,0.14)"); fl.addColorStop(1, "rgba(0,0,0,0.5)");
  g.fillStyle = fl; g.fillRect(sx, sy, sw, sh);
  g.fillStyle = "rgba(255,200,80,0.95)"; g.font = "40px Tebal"; g.fillText(p.jam ?? "01:09", sx + 30, sy + sh - 34);
  g.restore();
};

/** teks besar: baris dipecah otomatis agar muat lebar 920; kata kunci diberi kotak merah */
const teks = (g: G, sp: Spek, aksen: string) => {
  const kata = sp.teks.toUpperCase().split(/ +/), kunci = new Set((sp.kunci ?? []).map((k) => k.toUpperCase()));
  let size = 150, lines: string[][] = [];
  const pack = () => { lines = [[]]; g.font = `${size}px Tebal`;
    for (const w of kata) { const cur = lines[lines.length - 1], test = [...cur, w].join(" "); if (cur.length && g.measureText(test).width > 920) lines.push([w]); else cur.push(w); } };
  pack(); while ((lines.length > 3 || lines.some((l) => g.measureText(l.join(" ")).width > 920)) && size > 80) { size -= 6; pack(); }
  let y = 330 + size;
  g.textBaseline = "alphabetic"; g.lineJoin = "round";
  for (const [li, l] of lines.entries()) {
    const full = g.measureText(l.join(" ")).width; let x = (W - full) / 2;
    g.save(); g.translate(W / 2, y - size / 2); g.rotate(li % 2 ? 0.012 : -0.018); g.translate(-W / 2, -(y - size / 2));
    for (const w of l) {
      const ww = g.measureText(w).width, isK = kunci.has(w.replace(/[^A-Z0-9]/g, "")) || kunci.has(w);
      if (isK) { g.fillStyle = aksen; g.fillRect(x - 14, y - size * 0.9, ww + 28, size * 1.08); }
      g.lineWidth = size * 0.16; g.strokeStyle = "#000000"; g.strokeText(w, x, y);
      g.fillStyle = isK ? "#ffffff" : "#ffe14a"; g.fillText(w, x, y);
      x += ww + g.measureText(" ").width;
    }
    g.restore(); y += size * 1.12;
  }
};

const label = (g: G, sp: Spek, aksen: string) => {
  g.font = "44px Tebal"; const t = sp.seri.toUpperCase(), w = g.measureText(t).width;
  g.fillStyle = "rgba(0,0,0,0.75)"; g.fillRect(60, 210, w + 40, 70);
  g.fillStyle = "#f2efe4"; g.fillText(t, 80, 263);
  g.fillStyle = aksen; g.fillRect(60 + w + 40, 210, 150, 70); g.fillStyle = "#ffffff"; g.fillText("EP." + sp.ep, 60 + w + 58, 263);
};

const sorot = (g: G, sp: Spek, aksen: string) => {
  g.save(); g.shadowColor = aksen; g.shadowBlur = 30; g.strokeStyle = aksen; g.lineWidth = 16; g.lineCap = "round";
  for (const l of sp.lingkar ?? []) { g.beginPath(); g.ellipse(l.x, l.y, l.rx, l.ry, -0.08, 0, Math.PI * 1.93); g.stroke(); }
  for (const p of sp.panah ?? []) {
    const [x1, y1] = p.dari, [x2, y2] = p.ke, cx = (x1 + x2) / 2 + (y2 - y1) * 0.25, cy = (y1 + y2) / 2 - (x2 - x1) * 0.25;
    g.lineWidth = 22; g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cx, cy, x2, y2); g.stroke();
    const a = Math.atan2(y2 - cy, x2 - cx); g.fillStyle = aksen; g.beginPath(); g.moveTo(x2 + Math.cos(a) * 30, y2 + Math.sin(a) * 30);
    g.lineTo(x2 + Math.cos(a + 2.5) * 70, y2 + Math.sin(a + 2.5) * 70); g.lineTo(x2 + Math.cos(a - 2.5) * 70, y2 + Math.sin(a - 2.5) * 70); g.fill();
  }
  for (const [k, h] of (sp.huruf ?? []).entries()) {
    const col = k % 2 ? "#ffd84a" : aksen; g.shadowColor = col; g.shadowBlur = 40; g.fillStyle = col;
    g.beginPath(); g.arc(h.x, h.y, 78, 0, 7); g.fill(); g.shadowBlur = 0; g.lineWidth = 10; g.strokeStyle = "#000"; g.stroke();
    g.font = "120px Tebal"; g.fillStyle = k % 2 ? "#0b0710" : "#ffffff"; const tw = g.measureText(h.t).width; g.fillText(h.t, h.x - tw / 2, h.y + 44);
  }
  g.font = "260px Tebal"; g.lineWidth = 18; g.strokeStyle = "#000"; g.fillStyle = aksen;
  for (const [x, y] of sp.tanya ?? []) { g.strokeText("?", x, y); g.fillText("?", x, y); }
  g.restore();
};

const akhir = (g: G) => {   // vignette + butir
  const v = g.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.48, H * 0.75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.6)");
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${0.035 * rnd(i, 1)})`; g.fillRect(rnd(i, 2) * W, rnd(i, 3) * H, 2, 2); }
};

export const buatSampul = (sp: Spek): Canvas => {
  const c = createCanvas(W, H), g = c.getContext("2d"), aksen = sp.warna ?? "#e3122a";
  latar(g, sp);
  for (const t of sp.tokoh ?? []) tokoh(g, t);
  if (sp.hp) hp(g, sp.hp);
  for (const t of sp.depan ?? []) tokoh(g, t);
  sorot(g, sp, aksen);
  akhir(g);
  teks(g, sp, aksen);
  label(g, sp, aksen);
  return c;
};

const [specPath, outDir, ...pilih] = process.argv.slice(2);
if (specPath) {
  const all: Spek[] = JSON.parse(readFileSync(specPath, "utf8"));
  mkdirSync(outDir, { recursive: true });
  for (const sp of all) {
    if (pilih.length && !pilih.includes(String(sp.ep))) continue;
    const c = buatSampul(sp);
    writeFileSync(`${outDir}/Cover_Episode${sp.ep}.png`, c.toBuffer("image/png"));
    console.log("sampul", sp.ep);
  }
}
