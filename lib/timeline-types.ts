// Timeline types and pure helpers shared by the server loader (lib/timeline.ts) and the client components.
import type { Focus, Pt } from "./map";

export type Precision = "exact" | "approx" | "unknown";
export type Kind = "prophet" | "revelation" | "battle" | "empire" | "knowledge" | "world" | "event";

export type Verse = { ref: string; href: string; text?: string };
export type Route = { d: string; stops: (Pt & { name: string })[] };
export type Place = { name: string } & Partial<Pt>;

export type Stop = {
  id: string;
  type: "chapter" | "event";
  chapter: number;
  title: string;
  label: string;
  year?: number;
  ah?: number;
  precision: Precision;
  what: string;
  who?: string[];
  place?: Place;
  verses: Verse[];
  quote?: Verse;
  article?: string;
  journey?: string;
  source?: string;
  kind?: Kind;
  routes: Route[];
  focus: Focus;
};

export type Chapter = { id: string; n: number; title: string; span: string; blurb: string; start: number; count: number; from?: number; to?: number };

export type State = {
  id: string;
  name: string;
  from: number;
  to: number;
  lane: "states" | "world";
  muslim: boolean;
  color?: number;
  capital: Place;
  dataset: string[];
};

export type Overlay = { id: string; state: string; from: number; to: number; name: string; d: string; label: Pt };

export type Prophet = {
  id: string;
  name: string;
  arabic: string;
  mentions?: number;
  line: string;
  verse: Verse;
  stop?: string;
  col: number;
  row: number;
  parent?: string;
  rel?: "son" | "descendant" | "nephew" | "brother" | "successor";
  group?: boolean;
  woman?: boolean;
  from?: number;
  to?: number;
  bar?: boolean;
  place?: Place;
  journey?: string;
};

export type VillainAge = { id: string; title: string; span: string };

export type VillainSymbol =
  | "flame"
  | "blade"
  | "crown"
  | "tower"
  | "coins"
  | "calf"
  | "shield"
  | "fire"
  | "elephant"
  | "spear"
  | "chain"
  | "scroll"
  | "mask"
  | "kaaba"
  | "arrow"
  | "eye"
  | "wall";

export type Hadith = { label: string; url: string };

export type Villain = {
  id: string;
  age: string;
  name: string;
  arabic: string;
  title: string;
  when: string;
  symbol: VillainSymbol;
  relied?: string;
  undone?: string;
  deed: string;
  end: string;
  verse?: Verse;
  source: "quran" | "tafsir" | "hadith" | "history";
  note: string;
  hadith?: Hadith[];
  against: { name: string; prophet?: string };
  stop?: string;
  group?: boolean;
  lesson: string;
  said?: Verse;
  mentions: Verse[];
  year?: number;
  place?: Place;
  journey?: string;
};

export type EndSigns = { note: string; hadith: Hadith; items: { name: string; villain?: string }[] };

export type TimelineData = {
  stops: Stop[];
  chapters: Chapter[];
  states: State[];
  overlays: Overlay[];
  prophets: Prophet[];
  villains: Villain[];
  villainAges: VillainAge[];
  endSigns: EndSigns;
  snapshots: number[];
  now: number;
};

export type VillainSeed = { list: Villain[]; ages: VillainAge[]; signs: EndSigns };

export type TimelineSeed = { chapters: Chapter[]; now: number; moments: number; stop?: Stop; position: number; villains?: VillainSeed };

// Explore axis: piecewise linear so the Prophet's era and the caliphates get most of the width.
export const AXIS = { min: -3200, max: 2026 };
const BREAKS: [number, number][] = [
  [-3200, 0],
  [570, 0.28],
  [1258, 0.68],
  [2026, 1],
];

export function yearToT(year: number): number {
  const y = Math.min(AXIS.max, Math.max(AXIS.min, year));
  for (let i = 1; i < BREAKS.length; i++) {
    const [y0, t0] = BREAKS[i - 1];
    const [y1, t1] = BREAKS[i];
    if (y <= y1) return t0 + ((y - y0) / (y1 - y0)) * (t1 - t0);
  }
  return 1;
}

export function tToYear(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  for (let i = 1; i < BREAKS.length; i++) {
    const [y0, t0] = BREAKS[i - 1];
    const [y1, t1] = BREAKS[i];
    if (c <= t1) return Math.round(y0 + ((c - t0) / (t1 - t0)) * (y1 - y0));
  }
  return AXIS.max;
}

// Hijri years drift about 3% against the solar calendar; exact AH comes from the data when it matters.
export const toAh = (ce: number) => Math.floor((ce - 621.5) * 1.0307) + 1;

export function yearText(ce: number, precision: Precision = "exact"): string {
  if (precision === "unknown") return "Date unknown";
  const base = ce < 0 ? `${-ce} BCE` : `${ce} CE`;
  return precision === "approx" ? `c. ${base}` : base;
}

export function yearsAgo(ce: number, now: number, precision: Precision): string {
  const n = now - ce;
  if (precision === "approx" && n > 1000) return `about ${(Math.round(n / 100) * 100).toLocaleString("en-US")} years ago`;
  return `${n.toLocaleString("en-US")} years ago`;
}

export const snapshotFor = (year: number, snapshots: number[]) =>
  snapshots.reduce((best, s) => (s <= year && s > best ? s : best), snapshots[0]);

export const villainsNear = (villains: Villain[], year: number) =>
  villains.filter((v) => v.year !== undefined && Math.abs(year - v.year) <= 25);

export function activeStates(states: State[], year: number | undefined) {
  if (year === undefined) return [];
  return states.filter((s) => year >= s.from && year <= s.to);
}

export const KIND_LABEL: Record<Kind, string> = {
  prophet: "Prophets",
  revelation: "Revelation",
  battle: "Battle",
  empire: "Rulers",
  knowledge: "Knowledge",
  event: "Event",
  world: "World",
};
