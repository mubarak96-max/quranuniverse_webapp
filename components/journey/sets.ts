// Each scene names a set: the sky colours, the drifting motes drawn by Atmosphere, and an optional piece of
// scenery from Scenery. People are never drawn; presence is shown with light, weather and landscape.

export type Mode = "twinkle" | "drift" | "rise" | "fall" | "converge" | "emanate" | "swirl";

export type Motes = {
  n: number;
  mode: Mode;
  colors: string[];
  size: [number, number];
  speed: number;
  glow?: boolean;
};

export type Piece =
  | "orb"
  | "mound"
  | "vessel"
  | "assembly"
  | "bow"
  | "ember"
  | "tree"
  | "clouds"
  | "horizon"
  | "mountain"
  | "altars"
  | "dig"
  | "split"
  | "lamp"
  | "core"
  | "pillars"
  | "river"
  | "sea"
  | "chasm"
  | "birds"
  | "minaret"
  | "gate";

export type SetDef = { sky: [string, string, string]; motes: Motes; piece?: Piece };

const STARS = ["#ffffff", "#dfe6ff", "#fff3d6"];
const GOLD = ["#f6d68f", "#ffe9b8", "#e7b866"];
const DUST = ["#c9a27a", "#8f6a4a", "#e2c49c"];
const SPRAY = ["#e8f4fa", "#b9d8e6", "#7fb0c8"];
const FOG = ["#9aa0a6", "#6c7177", "#c4c8cc"];

export const SETS: Record<string, SetDef> = {
  void: { sky: ["#020306", "#070a12", "#0b0d16"], motes: { n: 130, mode: "twinkle", colors: STARS, size: [0.5, 1.4], speed: 0.004 } },
  dawn: { sky: ["#0d1030", "#3b3466", "#d9b98a"], motes: { n: 80, mode: "rise", colors: GOLD, size: [0.6, 1.8], speed: 0.018, glow: true }, piece: "orb" },
  clay: {
    sky: ["#1a0f09", "#4a2c19", "#8a5a34"],
    motes: { n: 240, mode: "converge", colors: ["#b5452e", "#efe3cf", "#2b211b", "#c4924f", "#8a5a3c", "#6e3b28"], size: [0.8, 2.6], speed: 0.07 },
    piece: "mound",
  },
  vessel: { sky: ["#120c08", "#2e2016", "#4a3322"], motes: { n: 60, mode: "drift", colors: DUST, size: [0.5, 1.5], speed: 0.008 }, piece: "vessel" },
  breath: { sky: ["#1f130a", "#7a4b22", "#f0cf98"], motes: { n: 120, mode: "rise", colors: GOLD, size: [0.6, 2.2], speed: 0.03, glow: true }, piece: "orb" },
  court: { sky: ["#0a0d22", "#262c5a", "#bfae86"], motes: { n: 90, mode: "twinkle", colors: GOLD, size: [0.6, 1.6], speed: 0.004, glow: true }, piece: "assembly" },
  names: { sky: ["#050a16", "#0e1b38", "#1d2c55"], motes: { n: 90, mode: "twinkle", colors: STARS, size: [0.5, 1.3], speed: 0.004 } },
  bow: { sky: ["#07081a", "#1b1f45", "#3a3a6a"], motes: { n: 50, mode: "drift", colors: STARS, size: [0.5, 1.2], speed: 0.006 }, piece: "bow" },
  ember: {
    sky: ["#0f0503", "#3a1206", "#7a2a0e"],
    motes: { n: 100, mode: "rise", colors: ["#ff8a3d", "#ffb36b", "#e2482b"], size: [0.6, 1.8], speed: 0.06, glow: true },
    piece: "ember",
  },
  garden: {
    sky: ["#08201a", "#1f5a3c", "#cfe3a0"],
    motes: { n: 70, mode: "fall", colors: ["#9fd37a", "#e8d77a", "#5fae6a"], size: [1.4, 3.4], speed: 0.025 },
    piece: "tree",
  },
  tree: { sky: ["#061510", "#163a28", "#3a6a48"], motes: { n: 40, mode: "drift", colors: GOLD, size: [0.6, 1.6], speed: 0.008, glow: true }, piece: "tree" },
  whisper: { sky: ["#070908", "#151a17", "#262b26"], motes: { n: 90, mode: "swirl", colors: ["#8d958f", "#5d6560"], size: [0.5, 1.4], speed: 0.06 }, piece: "tree" },
  fallen: {
    sky: ["#0d0a06", "#2a2012", "#4a3a20"],
    motes: { n: 60, mode: "fall", colors: ["#8a6a2c", "#5f7a3a", "#a5803c"], size: [1.4, 3.2], speed: 0.04 },
    piece: "tree",
  },
  night: { sky: ["#02030a", "#0a1030", "#141a40"], motes: { n: 170, mode: "twinkle", colors: STARS, size: [0.4, 1.3], speed: 0.003 } },
  lamp: { sky: ["#02030a", "#0a1030", "#1c2250"], motes: { n: 170, mode: "twinkle", colors: STARS, size: [0.4, 1.3], speed: 0.003 }, piece: "lamp" },
  contrast: { sky: ["#0a0606", "#16121a", "#22202c"], motes: { n: 40, mode: "drift", colors: STARS, size: [0.5, 1.2], speed: 0.006 }, piece: "split" },
  descent: { sky: ["#0a1224", "#33456a", "#a3815a"], motes: { n: 90, mode: "rise", colors: ["#e8eef8", "#c4d0e4"], size: [0.6, 2], speed: 0.16 }, piece: "clouds" },
  earth: { sky: ["#160f09", "#5c3f25", "#d29a5c"], motes: { n: 50, mode: "drift", colors: DUST, size: [0.5, 1.6], speed: 0.012 }, piece: "horizon" },
  arafat: { sky: ["#160c1a", "#6b3d34", "#e2a868"], motes: { n: 40, mode: "drift", colors: DUST, size: [0.5, 1.4], speed: 0.01 }, piece: "mountain" },
  family: {
    sky: ["#150f08", "#4e3720", "#d9ae6e"],
    motes: { n: 50, mode: "rise", colors: ["#ffcf7a", "#ffa94d"], size: [0.6, 1.6], speed: 0.03, glow: true },
    piece: "horizon",
  },
  altars: { sky: ["#0c0907", "#2f2219", "#5a4030"], motes: { n: 40, mode: "rise", colors: ["#8a8580", "#b5afa8"], size: [1, 2.4], speed: 0.02 }, piece: "altars" },
  blood: { sky: ["#070202", "#260606", "#3e0a0a"], motes: { n: 30, mode: "fall", colors: ["#7a1414", "#4a0a0a"], size: [0.8, 1.8], speed: 0.01 } },
  crow: { sky: ["#110d0a", "#2f251b", "#4f3d2c"], motes: { n: 40, mode: "fall", colors: ["#2a2622", "#4a4440"], size: [1.2, 2.8], speed: 0.02 }, piece: "dig" },
  weight: { sky: ["#04060c", "#111829", "#1d2640"], motes: { n: 260, mode: "twinkle", colors: STARS, size: [0.4, 1], speed: 0.003 } },
  souls: { sky: ["#03040a", "#0d1230", "#1a2050"], motes: { n: 260, mode: "emanate", colors: [...STARS, ...GOLD], size: [0.5, 1.6], speed: 0.05, glow: true }, piece: "core" },
  covenant: { sky: ["#03040a", "#0f1638", "#1e2658"], motes: { n: 300, mode: "twinkle", colors: [...STARS, ...GOLD], size: [0.5, 1.5], speed: 0.003, glow: true } },
  dusk: { sky: ["#140a12", "#4a2838", "#c27a58"], motes: { n: 40, mode: "drift", colors: DUST, size: [0.5, 1.4], speed: 0.008 }, piece: "horizon" },
  burial: { sky: ["#05060a", "#171a24", "#2a2e3c"], motes: { n: 40, mode: "rise", colors: ["#f4f1ea", "#dfe6ff"], size: [0.6, 1.6], speed: 0.012, glow: true }, piece: "horizon" },
  end: { sky: ["#04050a", "#12162a", "#2a2840"], motes: { n: 150, mode: "twinkle", colors: STARS, size: [0.4, 1.3], speed: 0.003 } },

  // Downfalls: the tyrants are never shown, only what they built, trusted, and lost.
  palace: { sky: ["#0b0712", "#2a1a2e", "#7a5a3a"], motes: { n: 50, mode: "drift", colors: GOLD, size: [0.5, 1.4], speed: 0.008, glow: true }, piece: "pillars" },
  nile: { sky: ["#06121a", "#123a46", "#c9a46a"], motes: { n: 40, mode: "drift", colors: GOLD, size: [0.5, 1.4], speed: 0.01 }, piece: "river" },
  plagues: { sky: ["#0a0604", "#2a140a", "#5a2a14"], motes: { n: 220, mode: "swirl", colors: ["#6b4a22", "#8a6a2c", "#3a2a14", "#7a1414"], size: [0.6, 1.8], speed: 0.12 } },
  sea: { sky: ["#020a14", "#0a2a44", "#2f6f8a"], motes: { n: 90, mode: "rise", colors: SPRAY, size: [0.5, 1.6], speed: 0.05 }, piece: "sea" },
  flood: { sky: ["#01040a", "#06182a", "#0c2a40"], motes: { n: 120, mode: "fall", colors: SPRAY, size: [0.5, 1.8], speed: 0.09 }, piece: "sea" },
  shore: { sky: ["#0c0f14", "#2a3440", "#9aa4a8"], motes: { n: 30, mode: "drift", colors: SPRAY, size: [0.5, 1.2], speed: 0.006 }, piece: "horizon" },
  treasure: { sky: ["#100a02", "#3a2808", "#a07a2a"], motes: { n: 160, mode: "twinkle", colors: GOLD, size: [0.6, 2], speed: 0.004, glow: true }, piece: "orb" },
  procession: { sky: ["#140c04", "#5a3a12", "#e0b060"], motes: { n: 90, mode: "fall", colors: GOLD, size: [0.6, 1.8], speed: 0.02, glow: true }, piece: "horizon" },
  chasm: { sky: ["#080503", "#20140a", "#3a2414"], motes: { n: 80, mode: "fall", colors: DUST, size: [0.6, 2], speed: 0.06 }, piece: "chasm" },
  army: { sky: ["#1a1008", "#6a4424", "#d8a868"], motes: { n: 140, mode: "drift", colors: DUST, size: [0.5, 1.8], speed: 0.03 }, piece: "horizon" },
  birds: { sky: ["#140c06", "#5a3a22", "#c8925a"], motes: { n: 70, mode: "fall", colors: ["#3a2a1c", "#5a4430", "#2a1e14"], size: [0.8, 1.8], speed: 0.14 }, piece: "birds" },
  straw: { sky: ["#0e0a06", "#2e2416", "#4e3e28"], motes: { n: 90, mode: "drift", colors: ["#c8b070", "#a08850", "#7a6a40"], size: [0.6, 2.2], speed: 0.02 } },
  fog: { sky: ["#0a0b0d", "#1e2124", "#3a3d40"], motes: { n: 160, mode: "swirl", colors: FOG, size: [0.6, 2.4], speed: 0.03 } },
  mirage: { sky: ["#0c0c10", "#2a2a38", "#5a5a6a"], motes: { n: 140, mode: "fall", colors: FOG, size: [0.4, 1.2], speed: 0.12 } },
  minaret: { sky: ["#0a1228", "#3a4a7a", "#e8e4d8"], motes: { n: 80, mode: "rise", colors: STARS, size: [0.5, 1.6], speed: 0.02, glow: true }, piece: "minaret" },
  ludd: { sky: ["#0e0c18", "#4a3a4a", "#e0b080"], motes: { n: 50, mode: "drift", colors: GOLD, size: [0.5, 1.4], speed: 0.008, glow: true }, piece: "gate" },
};
