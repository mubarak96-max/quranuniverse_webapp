// Saved hifz progress. Levels are keyed by their first verse ("67:1"), so stars survive a change in how surahs are cut.
import { load, save } from "../daily";
import { withToday } from "../journey";
import { levelKey, type Level } from "./journey";
import { starsFor, type Ref } from "./plan";

export type Progress = {
  stars: Record<string, number>;
  xp: number;
  // Misses per verse ("s:a", 1-based); a verse leaves the list once review gets it right enough times.
  weak: Record<string, number>;
  days: number[];
  muted: boolean;
};

export type Result = { level: number | null; mistakes: number; xp: number; hits: Ref[]; misses: Ref[] };

const KEY = "qu:hifz-journey";
const EMPTY: Progress = { stars: {}, xp: 0, weak: {}, days: [], muted: false };
const ref = (r: Ref) => `${r.s}:${r.v + 1}`;

export const loadProgress = (): Progress => ({ ...EMPTY, ...load<Partial<Progress>>(KEY, {}) });

export const nextLevel = (p: Progress, levels: Level[]) => {
  const i = levels.findIndex((l) => !p.stars[levelKey(l)]);
  return i < 0 ? levels.length : i;
};

export { playedToday, streak } from "../journey";

// The weakest verses first, a short set so review fits in a minute or two.
export function dueReview(p: Progress, count = 8): Ref[] {
  return Object.entries(p.weak)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([k]) => {
      const [s, a] = k.split(":").map(Number);
      return { s, v: a - 1 };
    });
}

export function finish(p: Progress, levels: Level[], r: Result): Progress {
  const weak = { ...p.weak };
  for (const m of r.misses) weak[ref(m)] = (weak[ref(m)] ?? 0) + 1;
  for (const h of r.hits) {
    const k = ref(h);
    if (weak[k] === undefined || r.misses.some((m) => ref(m) === k)) continue;
    if (weak[k] <= 1) delete weak[k];
    else weak[k]--;
  }
  const stars = { ...p.stars };
  if (r.level !== null) {
    const k = levelKey(levels[r.level]);
    stars[k] = Math.max(stars[k] ?? 0, starsFor(r.mistakes));
  }
  const next: Progress = {
    ...p,
    stars,
    weak,
    xp: p.xp + r.xp,
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
