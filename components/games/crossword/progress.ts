// Saved crossword journey: stars and best time per level, XP, the days played (for the streak) and sound.
import { load, save } from "../daily";
import { withToday } from "../journey";

export type Journey = {
  stars: Record<number, number>;
  best: Record<number, number>;
  xp: number;
  days: number[];
  muted: boolean;
};

const KEY = "qu:crossword-journey";
const EMPTY: Journey = { stars: {}, best: {}, xp: 0, days: [], muted: false };

export const loadJourney = (): Journey => ({ ...EMPTY, ...load<Partial<Journey>>(KEY, {}) });

const store = (j: Journey) => {
  save(KEY, j);
  return j;
};

export { nextLevel, playedToday, streak } from "../journey";

// The daily crossword also keeps the streak alive, so both modes call this when a grid is finished.
export function markPlayed(j: Journey, xp: number): Journey {
  return store({ ...j, xp: j.xp + xp, days: withToday(j.days) });
}

export function finishLevel(j: Journey, level: number, stars: number, secs: number, xp: number): Journey {
  const played = markPlayed(j, xp);
  return store({
    ...played,
    stars: { ...j.stars, [level]: Math.max(j.stars[level] ?? 0, stars) },
    best: { ...j.best, [level]: Math.min(j.best[level] ?? Infinity, secs) },
  });
}

export const setMuted = (j: Journey, muted: boolean) => store({ ...j, muted });
