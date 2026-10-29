// Saved Ayah Builder journey progress: stars per level, XP, days played and the sound setting.
import { load, save } from "../daily";
import { withToday } from "../journey";
import { starsFor } from "./plan";

export type Progress = { stars: Record<number, number>; xp: number; days: number[]; muted: boolean };
export type LevelResult = { level: number; slips: number; xp: number };

const KEY = "qu:ayah-journey";
const EMPTY: Progress = { stars: {}, xp: 0, days: [], muted: false };

export const loadProgress = (): Progress => ({ ...EMPTY, ...load<Partial<Progress>>(KEY, {}) });

export { nextLevel, playedToday, streak } from "../journey";

function store(p: Progress) {
  save(KEY, p);
  return p;
}

export function finish(p: Progress, r: LevelResult): Progress {
  return store({
    ...p,
    stars: { ...p.stars, [r.level]: Math.max(p.stars[r.level] ?? 0, starsFor(r.slips)) },
    xp: p.xp + r.xp,
    days: withToday(p.days),
  });
}

export const setMuted = (p: Progress, muted: boolean) => store({ ...p, muted });
