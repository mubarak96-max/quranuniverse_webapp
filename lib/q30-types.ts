// Quran in 30 Days: types shared by the loader (lib/q30.ts), the validator (tools/validate-q30.mjs) and the booklet.
// Content files name verse references only; the loader fills in Arabic and English from the Quran data.

export const LABELS = {
  stated: "The Quran says",
  explained: "Scholars explain",
  unspecified: "Not specified",
  differ: "Readings differ",
} as const;

export type Label = keyof typeof LABELS;

// Line icons drawn in components/q30/Icons.tsx. Keep this list and that file in step.
export const ICONS = [
  "star", "moon", "sun", "flame", "drop", "book", "scroll", "scale", "tree", "mountain",
  "ship", "wave", "cave", "wall", "ant", "bird", "fish", "camel", "staff", "well",
  "crown", "key", "lamp", "gate", "compass", "heart", "eye", "seed", "cloud", "wind",
  "river", "cup", "jar", "cube", "minaret", "shield", "tent", "pen", "feather", "hourglass",
  "horn", "city", "palm", "grapes", "wheat", "coin", "chain", "lock", "rays", "seat",
  "table", "web", "people", "path", "home", "spark", "door", "hand", "bridge", "garden",
] as const;

export type Icon = (typeof ICONS)[number];

type Common = { title: string; caption: string; label?: Label };
type Item = { label: string; text?: string; ref?: string };

// One signature infographic per day. Each kind has one renderer in components/q30/visuals.
export type Visual = Common &
  (
    | { kind: "anatomy" }
    | { kind: "ring"; center: string; items: Item[] }
    | { kind: "panels"; items: (Item & { icon: Icon })[] }
    | { kind: "ladder"; items: Item[] }
    | { kind: "tree"; items: (Item & { id: string; parent?: string; mark?: boolean })[] }
    | { kind: "cycle"; items: Item[]; examples?: Item[] }
    | { kind: "timeline"; items: (Item & { at: string; mark?: boolean })[] }
    | { kind: "ledger"; left: { title: string; items: Item[] }; right: { title: string; items: Item[] } }
    | { kind: "gallery"; items: (Item & { icon: Icon })[] }
    | { kind: "columns"; unit: string; items: (Item & { value: number })[] }
    | { kind: "spectrum"; from: string; to: string; items: (Item & { at: number })[] }
    | { kind: "constellation"; items: (Item & { bright?: boolean })[] }
    | { kind: "flow"; items: Item[]; here: number }
    | { kind: "arc"; items: (Item & { at: number; level: number })[] }
    | { kind: "shares"; rows: { label: string; parts: { label: string; value: number }[] }[] }
    | { kind: "rings"; center: string; items: Item[] }
    | { kind: "decision"; items: { q: string; yes: string; no?: string; ref?: string }[] }
  );

export type VisualKind = Visual["kind"];

export type RawPassage = {
  ref: string;
  // Cuts a long single verse to the words that matter, as in the journeys.
  from?: string;
  to?: string;
  context: string;
  point: string;
  label: Label;
  note?: string;
};

export type Quiz = { q: string; options: string[]; answer: number; why: string };

export type RawDay = {
  day: number;
  title: string;
  question: string;
  emblem: Icon;
  intro: string[];
  passages: RawPassage[];
  visual: Visual;
  word: { ar: string; tr: string; root: string[]; meaning: string; nuance: string; refs: string[] };
  mixup: { myth: string; truth: string; refs: string[] };
  remember: string[];
  memorize: string;
  quiz: Quiz[];
  reflect: string;
  deeper: string[];
  links: { label: string; href: string }[];
  connections: number[];
  review?: boolean;
  status: "draft" | "review" | "approved";
};

export type VerseLine = { key: string; ar: string; en: string };
export type Passage = Omit<RawPassage, "from" | "to"> & { href: string; lines: VerseLine[]; cut: boolean };
export type RefLink = { ref: string; href: string };
export type Anatomy = { id: number; name: string; verses: number; makki: boolean }[];

export type Day = Omit<RawDay, "passages" | "mixup" | "word" | "memorize" | "deeper"> & {
  part: number;
  passages: Passage[];
  juz: number[];
  word: RawDay["word"] & { links: RefLink[] };
  mixup: RawDay["mixup"] & { links: RefLink[] };
  memorize: Passage;
  deeper: RefLink[];
  recall?: Quiz & { from: number };
  anatomy?: Anatomy;
};

// The card on the shelf: enough to draw a cover without loading the whole day.
export type DaySummary = { day: number; part: number; title: string; question: string; emblem: Icon; review: boolean };

export type Part = { n: number; title: string; from: number; to: number; sky: [string, string, string]; land: string; glow: string };

export const PARTS: Part[] = [
  { n: 1, title: "Foundations", from: 1, to: 5, sky: ["#0f2a3f", "#1f5468", "#d9a865"], land: "#0b1f2c", glow: "#f3d08a" },
  { n: 2, title: "The Messengers", from: 6, to: 12, sky: ["#2a1b3d", "#6b3f5e", "#e3a76f"], land: "#1c1228", glow: "#f6c98a" },
  { n: 3, title: "Muhammad ﷺ", from: 13, to: 14, sky: ["#13302a", "#2f6a57", "#e6c27a"], land: "#0c211c", glow: "#f2dc9c" },
  { n: 4, title: "People", from: 15, to: 17, sky: ["#1d2742", "#4a5f8c", "#d7b48a"], land: "#121a2e", glow: "#efd3a6" },
  { n: 5, title: "The Hereafter", from: 18, to: 22, sky: ["#0b0f1f", "#2b2f5a", "#b98bb8"], land: "#06080f", glow: "#e7c8f0" },
  { n: 6, title: "Returning to Allah", from: 23, to: 23, sky: ["#102b33", "#2c6d72", "#f0c987"], land: "#0a1c21", glow: "#fbe3a8" },
  { n: 7, title: "Law and Society", from: 24, to: 29, sky: ["#2d2414", "#7a5a2c", "#e9c98d"], land: "#1d170c", glow: "#f8e0ae" },
  { n: 8, title: "The Whole", from: 30, to: 30, sky: ["#14233a", "#3b5d86", "#f4d79b"], land: "#0c1626", glow: "#fff0c4" },
];

export const partOf = (day: number) => PARTS.find((p) => day >= p.from && day <= p.to)!;

export const DAYS = 30;
export const BASE = "/quran-in-30-days";
export const dayHref = (n: number) => `${BASE}/day-${n}`;
