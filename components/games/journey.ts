// Day tracking every journey game shares: the days played, the streak they make, and the next level to play.
// Each game keeps its own storage key and saved shape; these helpers only read and extend `days` and `stars`.
import { dayNumber, streaks } from "./daily";

// Only differences between day numbers matter, so any fixed start date works; all games share this one.
const EPOCH = "2026-01-01";

export const today = () => dayNumber(EPOCH);

type Played = { days: number[] };

export const streak = (p: Played) => streaks(Object.fromEntries(p.days.map((d) => [d, true])), today()).current;

export const playedToday = (p: Played) => p.days.includes(today());

// Only the streak reads this list, so a year of days is plenty.
export function withToday(days: number[]): number[] {
  const d = today();
  return days.includes(d) ? days : [...days, d].slice(-366);
}

// The first level without stars, or `count` once every level is done.
export function nextLevel(p: { stars: Record<number, number> }, count: number) {
  for (let i = 0; i < count; i++) if (!p.stars[i]) return i;
  return count;
}
