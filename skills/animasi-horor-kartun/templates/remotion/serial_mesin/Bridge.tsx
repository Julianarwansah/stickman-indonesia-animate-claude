// "The Bridge That Fell for a Song": our original 67 s short in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gambarTokoh, RUPA_BY_NAME, Ekspresi } from "./tokoh";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame, OffthreadVideo, Sequence, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World, loadKit } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, FLASH_AT, SHOTS, SPY, layersAt, dofAt, sceneOf, shotAt, LINES, Line, hh, FPS, ShotDef, E } from "./story";
import MG from "./mg.json";
import { W, H, POTRET, CAPTION } from "./format";

export const PG_FRAMES = TOTAL;

/** A/B switches for test stills only (Remotion inputProps `{ post: { ink: false, ... } }`); everything is on by default. */
type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({ ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });

/** Bloom for emissive sources only (depth.md 6.4). Its MIP chain always starts at 540x960 (half of 1080x1920),
 *  whatever the output size, so the glow keeps the same size relative to the frame (e-fold ~30 px at 1080p,
 *  ~1.5 % of the frame height) at 540, 1080 and 1440 widths. ADD blend: HDR-safe (SCREEN darkens values > 1). */
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => { const k = 1080 / Math.max(1, Math.min(w, h)); setSize(Math.round(w * k), Math.round(h * k)); };
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Kit | null>(null);
  const [handle] = useState(() => delayRender("rajaes kit"));
  useEffect(() => { loadKit().then((k) => { setKit(k); continueRender(handle); }); }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }), // film grain, OFF by default (inputProps post.grain): the reference measures no grain and it quadruples the file size
  }), [camera, scene]);
  useEffect(() => () => { (fx.ink as unknown as { dispose?: () => void }).dispose?.(); }, [fx]);
  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : null}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : null}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : null}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : null}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : null}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : null}
    </EffectComposer>
  ), [fx, on]);
  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);
  // thin-lens focus: distance along the view axis to the shot's focus point (default: the camera's look target)
  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f)); else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f; // deterministic per frame
  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

/** test stills only: inputProps `{ post: { dpr: 0.5 } }` forces the WebGL buffer size (R3F clamps dpr to >= 1 by default) */
const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas width={W} height={H} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 40, near: 0.2, far: 1500 }}>
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

// ---------------- lapisan 2D di atas gambar 3D ----------------
/** kabut gunung: gumpalan lembut melayang pelan dari kiri ke kanan, 2 lapis; posisi murni fungsi frame */
const Kabut: React.FC<{ f: number; k: number; pagi: boolean }> = ({ f, k, pagi }) => {
  const t = f / FPS, n = 14, blobs: React.ReactNode[] = [], col = pagi ? "215,220,228" : "150,162,186";
  for (let i = 0; i < n; i++) {
    const layer = i % 2, sp = [14, 32][layer] * (0.7 + 0.6 * hh(i, 2)), rw = [520, 760][layer] * (0.7 + 0.6 * hh(i, 3));
    const x = ((hh(i, 4) * (W + 2 * rw) + sp * t) % (W + 2 * rw)) - rw, y = H * (0.25 + 0.7 * hh(i, 1)) + 30 * Math.sin(t * 0.3 + i);
    blobs.push(<ellipse key={i} cx={x} cy={y} rx={rw} ry={rw * 0.32} fill={`rgba(${col},${(0.1 + 0.08 * layer) * k})`} filter="url(#kb)" />);
  }
  return <AbsoluteFill><svg width={W} height={H}><defs><filter id="kb"><feGaussianBlur stdDeviation="60" /></filter></defs>{blobs}</svg></AbsoluteFill>;
};
/** gunung meletus: cahaya merah dari cakrawala + kilat merah berdenyut + hujan abu */
const Letusan: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const t = f / FPS, dots: React.ReactNode[] = [];
  for (let i = 0; i < 160; i++) {
    const sp = 40 + 70 * hh(i, 2), x = (hh(i, 4) * (W + 60) + 18 * Math.sin(t + i)) % (W + 60) - 30, y = ((hh(i, 1) * (H + 60) + sp * t) % (H + 60)) - 30;
    dots.push(<circle key={i} cx={x} cy={y} r={1.5 + 3 * hh(i, 3)} fill="#3a3436" opacity={0.55 * k} />);
  }
  const p = 0.6 + 0.4 * Math.sin(t * 3.1) * Math.sin(t * 1.7);
  return <>
    <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(ellipse 120% 55% at 50% 38%, rgba(255,80,20,${0.38 * k * p}) 0%, rgba(160,20,0,${0.18 * k}) 45%, rgba(0,0,0,0) 75%)` }} />
    <AbsoluteFill><svg width={W} height={H}>{dots}</svg></AbsoluteFill>
  </>;
};
/** gas kawah: kabut kuning-hijau tebal yang turun dari atas */
const Gas: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const t = f / FPS;
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(150,160,90,${0.55 * k}) 0%, rgba(120,130,70,${0.35 * k}) ${30 + 10 * Math.sin(t)}%, rgba(0,0,0,0) 75%)` }} />;
};
/** senter berkedip: layar meredup acak sesaat */
const Kedip: React.FC<{ f: number }> = ({ f }) => {
  const v = hh(Math.floor(f / 2), 7), o = v > 0.86 ? 0.75 : v > 0.78 ? 0.35 : 0;
  return <AbsoluteFill style={{ background: "#000", opacity: o }} />;
};
/** vignette gelap tetap + napas pelan */
const Vignette: React.FC<{ f: number; kuat: number }> = ({ f, kuat }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 58% at 50% 42%, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 45%, rgba(2,3,8,${(0.82 + 0.06 * Math.sin(f / 22)) * kuat}) 100%)` }} />
);
/** cap lokasi bergaya mesin ketik di kiri bawah */
const Cap: React.FC<{ text: string; k: number }> = ({ text, k }) => {
  const n = Math.min(text.length, Math.floor(k * 30 * 24)), o = Math.min(1, Math.max(0, (5.5 - k) / 0.6));
  return <AbsoluteFill><div style={{ position: "absolute", left: POTRET ? 60 : 90, top: POTRET ? 230 : undefined, bottom: POTRET ? undefined : 86, opacity: o, fontFamily: "Courier New, monospace", fontSize: 38, fontWeight: 700, color: "#f2efe4", letterSpacing: 1, textShadow: "0 2px 8px rgba(0,0,0,0.85)", borderLeft: "5px solid #c8323a", paddingLeft: 18 }}>{text.slice(0, n)}<span style={{ opacity: (k * 2) % 1 < 0.5 ? 1 : 0 }}>▌</span></div></AbsoluteFill>;
};
/** sisipan motion-graphics layar penuh per scene; offset waktu klip berlanjut antar shot dengan scene yang sama */
const mgShots = (scene: string) => SHOTS.filter((s) => s.scene === scene);
const MgClip: React.FC<{ s: ShotDef }> = ({ s }) => {
  const file = (MG as Record<string, string>)[s.scene];
  if (!file) return null;
  let off = 0;
  for (const o of mgShots(s.scene)) { if (o.id === s.id) break; off += o.b - o.a; }
  return <Sequence from={s.a} durationInFrames={s.b - s.a}><OffthreadVideo src={staticFile(file)} startFrom={off} muted /></Sequence>;
};

/** caption per kata (Shorts/Reels/TikTok): frasa pendek TETAP (maks 3 kata / 18 huruf, dipotong di tanda baca), kata aktif kuning.
 *  Waktu kata dari suara asli (`kata` di timeline, hasil kata.py/whisper); cadangan: sebanding panjang huruf. Di atas zona UI (bawah 25 %). */
type Kata = [string, number, number];
const kataLine = (l: Line): Kata[] => {
  if (l.kata && l.kata.length) return l.kata;
  const words = (l.text ?? "").split(/\s+/), total = (l.text ?? "").length; let acc = 0;
  return words.map((w) => { const a = l.start + (acc / total) * (l.end - l.start); acc += w.length + 1; return [w, Math.round(a), Math.round(l.start + (acc / total) * (l.end - l.start))] as Kata; });
};
const halaman = (k: Kata[]): Kata[][] => {
  const out: Kata[][] = []; let cur: Kata[] = [];
  for (const w of k) {
    const len = cur.reduce((n, x) => n + x[0].length + 1, 0) + w[0].length;
    if (cur.length && (cur.length >= 3 || len > 18)) { out.push(cur); cur = []; }
    cur.push(w);
    if (/[.,?!:…]$/.test(w[0])) { out.push(cur); cur = []; }
  }
  if (cur.length) out.push(cur);
  // kata yatim (1 kata) digabung ke frasa sebelumnya bila frasa itu tidak berakhir tanda baca dan masih muat
  for (let i = out.length - 1; i > 0; i--) {
    const prev = out[i - 1], len = [...prev, ...out[i]].reduce((n, x) => n + x[0].length + 1, 0);
    if (out[i].length === 1 && !/[.,?!:…]$/.test(prev[prev.length - 1][0]) && prev.length <= 3 && len <= 24) { out[i - 1] = [...prev, ...out[i]]; out.splice(i, 1); }
  }
  return out;
};
const Caption: React.FC<{ f: number }> = ({ f }) => {
  const l = LINES.find((x) => x.text && f >= x.start - 2 && f < x.end + 8);
  if (!l || !l.text) return null;
  const pages = halaman(kataLine(l));
  let pi = 0;
  pages.forEach((pg, i) => { if (f >= pg[0][1] - 2) pi = i; });
  const pg = pages[pi], last = pg[pg.length - 1];
  if (f > last[2] + 10 && pi === pages.length - 1 && f > l.end) return null;
  const k0 = Math.min(1, Math.max(0, (f - pg[0][1] + 3) / 4));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: POTRET ? H * 0.26 : 90 }}>
      <div style={{ maxWidth: W * 0.86, textAlign: "center", fontFamily: "Arial Black, Impact, sans-serif", fontSize: POTRET ? 82 : 58, lineHeight: 1.12,
        color: "#ffffff", textTransform: "uppercase", WebkitTextStroke: POTRET ? "4px #0b0710" : "3px #0b0710", textShadow: "0 6px 18px rgba(0,0,0,0.75)",
        transform: `scale(${0.92 + 0.08 * k0})`, opacity: 0.4 + 0.6 * k0 }}>
        {pg.map((w, i) => { const on = f >= w[1] - 1 && (f < w[2] + 2 || i === pg.length - 1);
          return <React.Fragment key={i}><span style={{ color: on ? "#ffd84a" : "#ffffff" }}>{w[0].replace(/\.\.\.$/, "…")}</span>{" "}</React.Fragment>; })}
      </div>
    </AbsoluteFill>
  );
};

/** kartu pilihan A/B di akhir episode. Akibat pilihan TIDAK ditulis di kartu: dijawab dengan animasi di episode berikutnya.
 *  Kotak menyala saat narator menyebut hurufnya; lalu keduanya berdenyut + ajakan komentar. */
const PilihanAB: React.FC<{ f: number }> = ({ f }) => {
  const l = LINES.find((x) => x.scene === "pilihan")!, txt = l.text ?? "";
  const kk = kataLine(l);
  const at = (w: string) => { const hit = kk.find((x) => x[0].startsWith(w)); return hit ? hit[1] : l.start + (txt.indexOf(w) / Math.max(1, txt.length)) * (l.end - l.start); };
  const fA = at("A..."), fB = at("B..."), fK = at("Tulis") > l.start ? at("Tulis") : l.end - 20, k0 = Math.min(1, (f - l.start + 6) / 14);
  const pulse = 0.5 + 0.5 * Math.sin(f / 5);
  const box = (huruf: string, judul: string, warna: string, on: boolean, from: number) => {
    const show = Math.min(1, Math.max(0, (f - from + 4) / 8)), glow = on ? 1 : f >= fK ? 0.35 + 0.35 * pulse : 0.15;
    return (
      <div style={{ width: W * 0.84, padding: "38px 40px", marginTop: 46, borderRadius: 28, background: "rgba(12,10,16,0.92)", border: `6px solid ${warna}`,
        boxShadow: `0 0 ${30 + 60 * glow}px ${warna}`, opacity: 0.25 + 0.75 * show, transform: `scale(${0.94 + 0.06 * show + (on ? 0.03 : 0)})`,
        display: "flex", alignItems: "center", gap: 36 }}>
        <div style={{ width: 150, height: 150, borderRadius: 75, background: warna, color: "#0b0710", fontFamily: "Arial Black, Impact, sans-serif",
          fontSize: 110, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{huruf}</div>
        <div style={{ fontFamily: "Arial Black, Impact, sans-serif", color: "#f2efe4", textTransform: "uppercase" }}>
          <div style={{ fontSize: 58, lineHeight: 1.08 }}>{judul}</div>
        </div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #1d0a10 0%, #050307 75%)", alignItems: "center", paddingTop: 300, opacity: k0 }}>
      <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 78, color: "#d8d2c4", letterSpacing: 4, textAlign: "center", textShadow: "0 0 24px rgba(170,0,10,0.85)",
        transform: `translateX(${f % 41 < 2 ? 5 : 0}px)` }}>{(E.kartuJudul ?? "KAMU PILIH|MANA?").split("|").map((x, i) => <React.Fragment key={i}>{i ? <br /> : null}{x}</React.Fragment>)}</div>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 36, color: "#9a93a6", marginTop: 18, letterSpacing: 2 }}>{E.seri ?? "NAMA SERIAL"} · EP.{E.ep}</div>
      {box("A", E.pilihan.A, "#d83a3a", f >= fA && f < fB, fA)}
      {box("B", E.pilihan.B, "#ffd84a", f >= fB && f < fK, fB)}
      <div style={{ marginTop: 70, fontFamily: "Arial Black, Impact, sans-serif", fontSize: 54, color: "#ffffff", WebkitTextStroke: "3px #0b0710",
        opacity: Math.min(1, Math.max(0, (f - fK) / 8)), transform: `scale(${1 + 0.04 * pulse})` }}>TULIS A / B DI KOMENTAR</div>
      <div style={{ marginTop: 26, fontFamily: "Georgia, serif", fontSize: 40, color: "#b3101c", letterSpacing: 2, opacity: Math.min(1, Math.max(0, (f - fK - 20) / 10)) }}>{E.kartuBawah ?? "Jawabannya... di episode berikutnya."}</div>
      <TombolCTA f={f} at={(LINES.find((x) => x.id === "p02") ?? l).start} />
    </AbsoluteFill>
  );
};

/** layar HP dengan foto selfie (tokoh digambar dengan gambarTokoh yang sama), bisa zoom pelan ke satu titik */
const HpFoto: React.FC<{ spec: NonNullable<ReturnType<typeof sceneOf>["hp"]>; f: number; a: number; b: number }> = ({ spec, f, a, b }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const u = Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a))), z0 = spec.zoom ?? 1, z1 = spec.zoomTo ?? z0;
  const zoom = z0 + (z1 - z0) * (u * u * (3 - 2 * u)), [fx, fy] = spec.fokus ?? [0.5, 0.4];
  const inK = Math.min(1, (f - a) / 8);
  useLayoutEffect(() => {
    const cv = ref.current; if (!cv) return;
    const g = cv.getContext("2d")!, Wc = cv.width, Hc = cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, Hc); bg.addColorStop(0, "#1a2232"); bg.addColorStop(0.6, "#2c3a3a"); bg.addColorStop(1, "#141a18");
    g.fillStyle = bg; g.fillRect(0, 0, Wc, Hc);
    g.translate(fx * Wc, fy * Hc); g.scale(zoom, zoom); g.translate(-fx * Wc, -fy * Hc);
    for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(20,40,30,0.8)"; g.beginPath(); g.moveTo(i * 80 - 20, Hc * 0.62); g.lineTo(i * 80 + 30, Hc * 0.18); g.lineTo(i * 80 + 80, Hc * 0.62); g.fill(); }
    const draw = (rupa: string, x: number, y: number, sc: number, w = "senyum", ex: Record<string, unknown> = {}) => {
      const R = RUPA_BY_NAME[rupa]; if (!R) return;
      g.save(); g.translate(x, y); g.scale(sc, sc); gambarTokoh(g, R, { wajah: w as Ekspresi, ...ex }); g.restore();
    };
    for (const o of spec.belakang ?? []) draw(o.rupa, o.x * Wc - 300 * 0.62, Hc * 0.1, 0.62, o.w ?? "datar", { ...(o.kanan ? { kanan: o.kanan } : {}), ...(o.kiri ? { kiri: o.kiri } : {}) });
    spec.depan.forEach((o, i) => draw(o.rupa, (i + 0.5) / spec.depan.length * Wc - 300 * 0.8, Hc * 0.22, 0.8, o.w ?? "senyum"));
    g.setTransform(1, 0, 0, 1, 0, 0);
    const fl = g.createRadialGradient(Wc / 2, Hc * 0.4, 50, Wc / 2, Hc * 0.4, Wc); fl.addColorStop(0, "rgba(255,255,255,0.12)"); fl.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = fl; g.fillRect(0, 0, Wc, Hc);
    g.fillStyle = "rgba(255,200,80,0.9)"; g.font = "bold 34px Courier New"; g.fillText(spec.jam ?? "01:09", 30, Hc - 36);
  });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300, opacity: inK, transform: `translateY(${(1 - inK) * 80}px)` }}>
      <div style={{ width: 660, height: 1080, borderRadius: 70, background: "#0c0c10", border: "6px solid #2a2a30", boxShadow: "0 30px 80px rgba(0,0,0,0.8)", padding: 30, boxSizing: "border-box" }}>
        <canvas ref={ref} width={600} height={1020} style={{ width: 600, height: 1020, borderRadius: 40 }} />
      </div>
    </AbsoluteFill>
  );
};

/** pop-up singkat sesudah jumpscare: ajak like */
const LikePop: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const n = f - at;
  if (n < 0 || n > 60) return null;
  const sc = n < 8 ? 0.6 + 0.5 * (n / 8) : n < 12 ? 1.1 - 0.1 * ((n - 8) / 4) : 1, o = Math.min(1, (60 - n) / 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
      <div style={{ transform: `scale(${sc})`, opacity: o, background: "rgba(12,8,14,0.88)", border: "5px solid #ff3b5c", borderRadius: 60, padding: "22px 46px",
        fontFamily: "Arial Black, Impact, sans-serif", fontSize: 52, color: "#fff", boxShadow: "0 0 40px rgba(255,40,80,0.6)" }}>❤️ KALAU KAMU IKUT KAGET</div>
    </AbsoluteFill>
  );
};
/** ajakan tenang di kartu akhir: satu baris, tanpa ikon, muncul pelan */
const TombolCTA: React.FC<{ f: number; at: number }> = ({ f, at }) => (
  <div style={{ marginTop: 60, fontFamily: "Georgia, serif", fontSize: 40, letterSpacing: 8, color: "#d8d2c4", textShadow: "0 0 18px rgba(170,0,10,0.6)",
    opacity: Math.min(1, Math.max(0, (f - at) / 15)) }}>SUBSCRIBE · TULIS DI KOMENTAR</div>
);

export const PetakaGunung: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  return (
    <AbsoluteFill style={{ background: "#0b0f1c" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />)}
      {(() => {
        const s = shotAt(f), sc = sceneOf(s), capLine = LINES.find((l) => l.mg && l.mg.startsWith("cap:") && l.scene === s.scene && s.a <= l.start && l.start < s.b);
        return (<>
          {sc.snow ? <Kabut f={f} k={sc.snow} pagi={s.light === "golden"} /> : null}
          <Vignette f={f} kuat={s.scene === "jumpscare" ? 0.5 : 1} />
          {sc.overlay === "kedip" ? <Kedip f={f} /> : null}
          {(sc as { letusan?: number }).letusan ? <Letusan f={f} k={(sc as { letusan?: number }).letusan!} /> : null}
          {(sc as { gas?: number }).gas ? <Gas f={f} k={(sc as { gas?: number }).gas! * Math.min(1, (f - s.a) / 45)} /> : null}
          {sc.overlay === "hitam" ? <AbsoluteFill style={{ background: "#000" }} /> : null}
          {capLine ? <Cap text={capLine.mg!.slice(4)} k={(f - s.a) / FPS} /> : null}
          {sc.hp ? <HpFoto spec={sc.hp} f={f} a={s.a} b={s.b} /> : null}
          {(MG as Record<string, string>)[s.scene] ? <MgClip s={s} /> : null}
          {CAPTION && !(getInputProps() as { sampul?: boolean }).sampul && !(MG as Record<string, string>)[s.scene] && s.scene !== "pilihan" ? <Caption f={f} /> : null}
        </>);
      })()}
      {f >= SPY.a && f < SPY.b && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 36%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 470px, #120c14 486px)" }} />}
      {f >= SPY.a && f < SPY.b && <AbsoluteFill><div style={{ position: "absolute", left: 540 - 486, top: 0.36 * 1920 - 486, width: 972, height: 972, borderRadius: "50%", boxShadow: "inset 0 0 60px 30px rgba(10,6,12,0.75)" }} /></AbsoluteFill>}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {f >= FLASH_AT + 4 && f < FLASH_AT + 16 && <AbsoluteFill style={{ background: "#7a0008", mixBlendMode: "multiply", opacity: 0.55 * (1 - (f - FLASH_AT - 4) / 12) }} />}
      {f < 100 && <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, opacity: Math.min(1, (100 - f) / 12) }}>
        <div style={{ fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 40, letterSpacing: 8, color: "#e8e0cc", textShadow: "0 3px 10px #000" }}>{E.seri ?? "NAMA SERIAL"} · EP.{E.ep}</div>
        <div style={{ marginTop: 22, maxWidth: W * 0.84, background: "#ffd84a", color: "#141016", padding: "18px 30px", fontFamily: "Arial Black, Impact, sans-serif",
          fontSize: 58, lineHeight: 1.1, textAlign: "center", textTransform: "uppercase", boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          transform: `scale(${0.9 + 0.1 * Math.min(1, f / 6)}) rotate(-1.5deg)` }}>{(E as unknown as { hook?: string }).hook ?? E.judul}</div>
      </AbsoluteFill>}
      {(() => { const l = LINES.find((x) => x.mg && x.mg.startsWith("stempel:") && f >= x.start && f < x.end + 20); if (!l) return null;
        const k = Math.min(1, (f - l.start) / 6);
        return <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
          <div style={{ border: "8px solid #c22a2a", color: "#c22a2a", padding: "10px 34px", fontFamily: "Arial Black, Impact, sans-serif", fontSize: 76, letterSpacing: 6,
            transform: `rotate(-8deg) scale(${1.6 - 0.6 * k})`, opacity: k, background: "rgba(240,232,214,0.9)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>{E.stempel ?? "KISAH NYATA"}</div>
          <div style={{ marginTop: 26, fontFamily: "Georgia, serif", fontSize: 44, color: "#f2efe4", textShadow: "0 3px 10px #000", opacity: k }}>{l.mg!.slice(8)}</div>
        </AbsoluteFill>; })()}
      {shotAt(f).scene === "pilihan" && <PilihanAB f={f} />}
    </AbsoluteFill>
  );
};
