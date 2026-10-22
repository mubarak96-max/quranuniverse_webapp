// Journey types shared by the server loader (lib/journey.ts) and the player in components/journey.
import type { Verse } from "./timeline-types";

export type Ayah = Verse & { ar?: string };

export type InteractItem = { text?: string; en?: string; ar?: string; who?: string; ref?: string; href?: string };

// names: touch lights to reveal names. reveal: one light, each touch tells the next line.
// answer: a question with one reply. contrast: two sayings side by side.
export type Interact = { type: "names" | "reveal" | "answer" | "contrast"; hint?: string; items: InteractItem[] };

export type Scene = {
  id: string;
  act: number;
  set: string;
  mood: Mood;
  lens?: string;
  lines: string[];
  ayah?: Ayah;
  hadith?: { text?: string; cite: string };
  scholars?: string;
  refs: Verse[];
  interact?: Interact;
  cover?: boolean;
  end?: boolean;
};

export type Act = { title: string; start: number; count: number };

export type Journey = {
  id: string;
  name: string;
  arabic: string;
  tagline: string;
  description: string;
  stop: string;
  next?: { stop: string; title: string };
  villain?: boolean;
  outro?: string;
  acts: Act[];
  scenes: Scene[];
};

// Valence from -1 (darkest) to 1 (brightest) draws the journey's heart line.
export const MOODS = {
  stillness: 0,
  awe: 0.6,
  wonder: 0.7,
  unease: -0.35,
  life: 0.85,
  gratitude: 0.9,
  belonging: 0.8,
  humility: 0.35,
  honour: 0.9,
  pride: -0.6,
  defiance: -0.8,
  peace: 0.85,
  love: 0.95,
  caution: 0.15,
  temptation: -0.45,
  shame: -0.85,
  remorse: -0.55,
  hope: 0.55,
  clarity: 0.6,
  grief: -0.45,
  longing: -0.3,
  reunion: 0.85,
  toil: -0.1,
  joy: 0.8,
  envy: -0.55,
  dread: -0.75,
  horror: -1,
  regret: -0.8,
  gravity: -0.2,
  witness: 0.75,
  surprise: -0.15,
  continuity: 0.45,
} as const;

export type Mood = keyof typeof MOODS;

const NEUTRAL = [154, 163, 181];
const BRIGHT = [240, 198, 116];
const DARK = [214, 86, 74];

export function moodColor(mood: Mood): string {
  const v = MOODS[mood];
  const to = v >= 0 ? BRIGHT : DARK;
  const t = Math.abs(v);
  const [r, g, b] = NEUTRAL.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

export const moodLabel = (mood: Mood) => mood[0].toUpperCase() + mood.slice(1);
