// "The Bridge That Fell for a Song": our original 67 s short in the flat-characters-in-a-3D-toon-world style.
// One three.js world (world.ts) posed per frame from the story timeline (story.ts). Post chain (look-match pass):
//   InkPass (world ink lines, own pass) -> lens blur pre + main (thin-lens DOF per shot from dofAt) ->
//   [bloom (emissive only) + NEUTRAL tone mapping + colour grade] (one merged EffectPass), MSAA 4.
// Ink runs before the DOF so lines blur with what they belong to; bloom after the DOF so glows defocus with their
// source; the grade is display-referred, so it comes after tone mapping. Every pixel-sized parameter is specified at
// 1080x1920 and scaled with the output size, so stills at --scale 0.5 and the 1440x2560 final match.
// Place changes crossfade by stacking a second canvas for the fade frames; the hook ends on a 4-frame white flash.
import React, { useEffect, useMemo, useState } from "react";
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
import { TOTAL, FLASH_AT, SHOTS, SPY, layersAt, dofAt, sceneOf, shotAt, LINES, hh, FPS, ShotDef } from "./story";
import MG from "./mg.json";
import { W, H, POTRET, CAPTION } from "./format";

export const EP1_FRAMES = TOTAL;

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
/** salju turun: 3 lapis (jauh kecil lambat, dekat besar cepat & kabur), posisi murni fungsi frame */
const Salju: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const n = Math.round(260 * k), t = f / FPS, flakes: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const layer = i % 3, sp = [55, 95, 170][layer] * (0.8 + 0.4 * hh(i, 2)), r = [1.6, 2.6, 4.6][layer] * (0.7 + 0.6 * hh(i, 3));
    const y = ((hh(i, 1) * (H + 100) + sp * t) % (H + 100)) - 50, x = (hh(i, 4) * (W + 80) + 30 * Math.sin(t * (0.6 + hh(i, 5)) + i)) % (W + 80) - 40;
    flakes.push(<circle key={i} cx={x} cy={y} r={r} fill="#eef3ff" opacity={[0.55, 0.7, 0.85][layer]} filter={layer === 2 ? "url(#blur)" : undefined} />);
  }
  return <AbsoluteFill><svg width={W} height={H}><defs><filter id="blur"><feGaussianBlur stdDeviation="1.6" /></filter></defs>{flakes}</svg></AbsoluteFill>;
};
/** lampu sirene polisi: merah dan biru bergantian dari kedua sisi */
const Sirene: React.FC<{ f: number }> = ({ f }) => {
  const ph = Math.floor(f / 8) % 2, pulse = 0.55 + 0.45 * Math.abs(Math.sin((f / 8) * Math.PI));
  const a = ph ? "rgba(255,40,40," : "rgba(40,90,255,", b = ph ? "rgba(40,90,255," : "rgba(255,40,40,";
  return <AbsoluteFill style={{ mixBlendMode: "screen", background: `radial-gradient(ellipse at 0% 45%, ${a}${0.42 * pulse}) 0, rgba(0,0,0,0) 55%), radial-gradient(ellipse at 100% 45%, ${b}${0.3 * (1.4 - pulse)}) 0, rgba(0,0,0,0) 55%)` }} />;
};
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

/** caption per kata (Shorts/Reels/TikTok): kalimat yang sedang diucapkan, kata aktif kuning; waktu kata dibagi
 *  sebanding panjang huruf di dalam baris. Di atas zona UI aplikasi (bawah 25 % layar). */
const Caption: React.FC<{ f: number }> = ({ f }) => {
  const l = LINES.find((x) => x.text && f >= x.start && f < x.end + 6);
  if (!l || !l.text) return null;
  const words = l.text.split(/\s+/), total = l.text.length, u = Math.min(1, (f - l.start) / Math.max(1, l.end - l.start));
  let acc = 0, active = 0;
  words.forEach((w, i) => { if (acc / total <= u) active = i; acc += w.length + 1; });
  const lo = Math.max(0, active - 2), hi = Math.min(words.length, lo + 5);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: POTRET ? H * 0.26 : 90 }}>
      <div style={{ maxWidth: W * 0.86, textAlign: "center", fontFamily: "Arial Black, Impact, sans-serif", fontSize: POTRET ? 74 : 54, lineHeight: 1.15,
        color: "#ffffff", textTransform: "uppercase", WebkitTextStroke: POTRET ? "4px #0b0710" : "3px #0b0710", textShadow: "0 6px 18px rgba(0,0,0,0.75)" }}>
        {words.slice(lo, hi).map((w, i) => <React.Fragment key={i}><span style={{ color: lo + i === active ? "#ffd84a" : "#ffffff" }}>{w}</span>{" "}</React.Fragment>)}
      </div>
    </AbsoluteFill>
  );
};

export const HororEp1: React.FC = () => {
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
          {sc.snow ? <Salju f={f} k={sc.snow} /> : null}
          {sc.overlay === "sirene" ? <Sirene f={f} /> : null}
          {sc.overlay === "hitam" ? <AbsoluteFill style={{ background: "#000" }} /> : null}
          {capLine ? <Cap text={capLine.mg!.slice(4)} k={(f - s.a) / FPS} /> : null}
          {(MG as Record<string, string>)[s.scene] ? <MgClip s={s} /> : null}
          {CAPTION && !(MG as Record<string, string>)[s.scene] ? <Caption f={f} /> : null}
        </>);
      })()}
      {f >= SPY.a && f < SPY.b && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 36%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 470px, #120c14 486px)" }} />}
      {f >= SPY.a && f < SPY.b && <AbsoluteFill><div style={{ position: "absolute", left: 540 - 486, top: 0.36 * 1920 - 486, width: 972, height: 972, borderRadius: "50%", boxShadow: "inset 0 0 60px 30px rgba(10,6,12,0.75)" }} /></AbsoluteFill>}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {f >= EP1_FRAMES - 12 && <AbsoluteFill style={{ background: "#000000", opacity: Math.min(1, (f - (EP1_FRAMES - 12) + 1) / 10) }} />}
    </AbsoluteFill>
  );
};
