// Quran in 30 Days: types shared by the loader (lib/q30.ts), the validator (tools/validate-q30.mjs) and the reader.
// Content files name verse references only; the loader fills in Arabic and English from the Quran data.

// Each chapter of a day is written in one voice, so a day moves between story, close reading, scholarship,
// argument, devotion and practice. The lens drives the chapter's look and the "inside" list; it is never a caption.
export const LENSES = {
  story: "Story",
  text: "Close reading",
  scholar: "Scholarship",
  reason: "Reasoning",
  heart: "Reflection",
  life: "Practice",
} as const;

export type Lens = keyof typeof LENSES;

export type Figure =
  | { kind: "timeline"; title: string; items: { at: string; label: string; text?: string }[] }
  | { kind: "steps"; title: string; items: { label: string; text?: string }[] }
  | { kind: "compare"; title: string; left: { title: string; items: string[] }; right: { title: string; items: string[] } }
  | { kind: "facts"; title: string; items: { value: string; label: string }[] }
  | { kind: "anatomy"; title: string };

export type Word = { ar: string; tr: string; root: string[]; meaning: string; nuance: string };

// One key per block, so content reads like a list of paragraphs.
export type Block =
  | { p: string }
  | { h: string }
  | { verse: string; from?: string; to?: string }
  | { quote: string; by: string }
  | { note: string; title?: string }
  | { list: string[] }
  | { image: string; alt: string; caption?: string; prompt: string }
  | { figure: Figure }
  | { word: Word };

export type Chapter = { lens: Lens; title: string; blocks: Block[] };

export type Quiz = { q: string; options: string[]; answer: number; why: string };

export type RawDay = {
  day: number;
  title: string;
  question: string;
  summary: string;
  cover: { alt: string; prompt: string };
  chapters: Chapter[];
  carry: string;
  quiz: Quiz[];
  reflect: string;
  deeper: string[];
  links: { label: string; href: string }[];
  connections: number[];
  review?: boolean;
  status: "draft" | "review" | "approved";
};

export type VerseLine = { key: string; ar: string; en: string };
export type Verse = { ref: string; href: string; name: string; lines: VerseLine[]; cut: boolean };
export type RefLink = { ref: string; href: string };
export type Anatomy = { id: number; name: string; verses: number; makki: boolean }[];

export type DayBlock = Exclude<Block, { verse: string }> | { verse: Verse };
export type DayChapter = Omit<Chapter, "blocks"> & { blocks: DayBlock[] };

export type Day = Omit<RawDay, "chapters" | "carry" | "deeper"> & {
  part: number;
  minutes: number;
  chapters: DayChapter[];
  carry: Verse;
  deeper: RefLink[];
  recall?: Quiz & { from: number };
  anatomy?: Anatomy;
};

// What the day list shows before a day is opened.
export type DaySummary = {
  day: number;
  part: number;
  title: string;
  question: string;
  summary: string;
  minutes: number;
  chapters: { lens: Lens; title: string }[];
  word?: { ar: string; tr: string; meaning: string };
  refs: string[];
  review: boolean;
};

export type Part = { n: number; title: string; blurb: string; from: number; to: number; tint: string };

export const PARTS: Part[] = [
  { n: 1, title: "Foundations", blurb: "What the Quran is, who it says Allah is, and what it says we are.", from: 1, to: 5, tint: "#3f7f86" },
  { n: 2, title: "The Messengers", blurb: "The prophets whose stories run through the whole book.", from: 6, to: 12, tint: "#b5794f" },
  { n: 3, title: "Muhammad ﷺ", blurb: "Makkah and Madinah: the man to whom it was revealed.", from: 13, to: 14, tint: "#4f8a6a" },
  { n: 4, title: "People", blurb: "Belief, doubt and hypocrisy; other faiths; women and men.", from: 15, to: 17, tint: "#6a78a8" },
  { n: 5, title: "The Hereafter", blurb: "Death, the Hour, the Judgment, the Fire and the Garden.", from: 18, to: 22, tint: "#8a6aa8" },
  { n: 6, title: "Returning to Allah", blurb: "Mercy, repentance and the heart.", from: 23, to: 23, tint: "#4f9a94" },
  { n: 7, title: "Law and Society", blurb: "Worship, family, money, limits, justice and character.", from: 24, to: 29, tint: "#a88a4f" },
  { n: 8, title: "The Whole", blurb: "How the Quran speaks, and how to keep reading it.", from: 30, to: 30, tint: "#c9a55a" },
];

export const partOf = (day: number) => PARTS.find((p) => day >= p.from && day <= p.to)!;

export const DAYS = 30;
export const BASE = "/quran-in-30-days";
export const dayHref = (n: number) => `${BASE}/day-${n}`;
export const pad = (n: number) => String(n).padStart(2, "0");
export const coverSrc = (n: number) => `/q30/day-${pad(n)}.webp`;
export const imageSrc = (name: string) => `/q30/${name}.webp`;
