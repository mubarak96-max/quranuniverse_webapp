// Saved Word Quest progress: stars per level, XP, how well each word is known, and the days played.
import { load, save } from "../daily";
import { withToday } from "../journey";
import { starsFor, type Word } from "./plan";

export type Progress = {
  stars: Record<number, number>;
  xp: number;
  strength: Record<number, number>;
  days: number[];
  muted: boolean;
};

export type LevelResult = { level: number; mistakes: number; xp: number; hits: number[]; misses: number[] };

const KEY = "qu:word-quest";
const EMPTY: Progress = { stars: {}, xp: 0, strength: {}, days: [], muted: false };

export const loadProgress = (): Progress => ({ ...EMPTY, ...load<Partial<Progress>>(KEY, {}) });

export { nextLevel, playedToday, streak } from "../journey";

// A word missed in its own level is not counted as learned until a later review gets it right.
export const learned = (p: Progress, levels: number[][]) =>
  levels.filter((_, i) => p.stars[i]).flat().filter((i) => (p.strength[i] ?? 0) > 0);

export const coverage = (p: Progress, levels: number[][], words: Word[], total: number) =>
  (learned(p, levels).reduce((n, i) => n + words[i].n, 0) / total) * 100;

export function finish(p: Progress, r: LevelResult): Progress {
  const strength = { ...p.strength };
  for (const i of r.hits) strength[i] = Math.min(5, (strength[i] ?? 0) + 1);
  for (const i of r.misses) strength[i] = Math.max(0, (strength[i] ?? 0) - 2);
  const next: Progress = {
    ...p,
    stars: { ...p.stars, [r.level]: Math.max(p.stars[r.level] ?? 0, starsFor(r.mistakes)) },
    xp: p.xp + r.xp,
    strength,
    days: withToday(p.days),
  };
  save(KEY, next);
  return next;
}

export function setMuted(p: Progress, muted: boolean): Progress {
  const next = { ...p, muted };
  save(KEY, next);
  return next;
}
