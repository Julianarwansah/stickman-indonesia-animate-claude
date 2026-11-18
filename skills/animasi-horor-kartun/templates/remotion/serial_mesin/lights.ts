// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};
export const LIGHTS: Record<"day" | "golden", LightPreset> = {
  // HOROR USA: preset "day" dipakai sebagai MALAM (cahaya bulan biru dari belakang-kanan kamera)
  day: {
    az: 140, el: 34,
    lit: [0.56, 0.65, 0.96], shade: [0.09, 0.1, 0.19], lift: [0.03, 0.04, 0.1], lambert: 0.35, sideK: 0.84, term: 0.2,
    charTint: [0.78, 0.85, 1.05], charShade: 0.78, charGrad: 0.1, bodyGrad: 0.22, sideTint: [0.8, 0.86, 1.0],
    blob: [0.5, 0.5, 0.62], actorShadow: false,
    top: "#0b1124", hor: "#2a3654", skyCurve: [0.0, 0.5, 0.6], fog: "#1c2333", fogNear: 2.5, fogFar: 34, sunDisc: "#c9d6ff",
    sunCol: "#c8d8ff", sunI: 1.6, sky: "#4a5a80", ground: "#202436", hemiI: 0.3,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    // HOROR USA: "golden" dipakai sebagai FAJAR pucat (pagi sesudah pencarian di kolam)
    az: 40, el: 10,
    lit: [0.86, 0.88, 0.95], shade: [0.2, 0.22, 0.3], lift: [0.05, 0.06, 0.12], lambert: 0.35, sideK: 0.82, term: 0.12,
    charTint: [0.88, 0.9, 0.96], charShade: 0.82, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#59606e", hor: "#9aa1ab", skyCurve: [0.05, 0.6, 1.0], fog: "#8a929c", fogNear: 3, fogFar: 36, sunDisc: "#d8dce4",
    sunCol: "#d8dee8", sunI: 1.6, sky: "#c9c3d6", ground: "#8a8090", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<"day" | "golden", WorldLook> = {
  day: {
    // depth.md 2.2: horizon #9fb6e6 just above the skyline, upper sky #5e93d9 at ~20 deg (grade: frame top #5997e2)
    sky: { c: ["#252d42", "#1c2336", "#141a2b", "#0d1120", "#070a14"], e: [0, 3, 8, 16, 40] },
    water: { near: "#10243a", mid: "#0c1c30", far: "#1b2b46", crest: "#3b5274", trough: "#081420", glint: "#9fb4d8", shade: [0.4, 0.45, 0.62] },
    cloud: { lit: "#4b5a7c", mid: "#36425f", shade: "#252e47" },
    bounce: [0, 0, 0],
    sat: 0.85,
  },
  golden: {
    // sunset, not dusk: #ffd08a horizon, peach/orange through ~10 deg, warm rose at 20, muted warm mauve only near the top
    // (the golden grade adds ~+11/255 blue to shadows/mids, so these lean warm)
    sky: { c: ["#a7adb6", "#9aa1ab", "#868d99", "#727a88", "#5d6474"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#a9afb8", mid: "#959ba6", shade: "#7d8390" },
    bounce: [0.04, 0.02, 0.0],
    sat: 0.95,
  },
};
