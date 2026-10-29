// Islamic Connections: puzzle rules and the player's saved journey.
import { load, save } from "../daily";
import { withToday } from "../journey";

export type Group = { name: string; level: number; items: string[]; why: string; ref?: string };
export type SurahRef = { name: string; href: string };
export type Journey = { stars: Record<number, number>; xp: number; days: number[]; muted: boolean };
export type Result = { solved: boolean; mistakes: number; hints: number; xp: number };

export const MISTAKES = 4;
export const JOURNEY_KEY = "qu:connections-journey";

export const CHAPTERS = [
  { name: "The Lamp", ar: "المصباح", line: "Warm up with three groups of three." },
  { name: "The Fountain", ar: "النافورة", line: "Bigger boards: three groups of four." },
  { name: "The Arches", ar: "الأقواس", line: "The full board: four groups of four." },
  { name: "The Observatory", ar: "المرصد", line: "Red herrings: some words seem to fit twice." },
  { name: "The Mountain", ar: "الجبل", line: "More herrings and deeper knowledge." },
  { name: "The Stars", ar: "النجوم", line: "Master boards for the well read." },
];

export const shuffle = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Every outcome is replayed from the guesses, so a saved daily board restores exactly.
export function replay(groups: Group[], guesses: string[][]) {
  const solved: Group[] = [];
  let mistakes = 0;
  for (const g of guesses) {
    const hit = groups.find((grp) => g.length === grp.items.length && g.every((it) => grp.items.includes(it)));
    if (hit) solved.push(hit);
    else mistakes++;
  }
  return { solved, mistakes, lost: mistakes >= MISTAKES, won: solved.length === groups.length };
}

// Mistakes and hints cost the same: a clean solve earns three stars.
export const starsFor = (r: Pick<Result, "solved" | "mistakes" | "hints">) =>
  !r.solved ? 0 : r.mistakes + r.hints === 0 ? 3 : r.mistakes + r.hints === 1 ? 2 : 1;

export const xpFor = (groups: Group[], r: Pick<Result, "solved" | "mistakes" | "hints">, solved: Group[]) =>
  solved.reduce((n, g) => n + g.level * 10, 0) + starsFor(r) * 15 + (r.solved ? groups.length * 5 : 0);

export const loadJourney = (): Journey => ({ stars: {}, xp: 0, days: [], muted: false, ...load<Partial<Journey>>(JOURNEY_KEY, {}) });

export function saveJourney(j: Journey) {
  save(JOURNEY_KEY, j);
  return j;
}

export { nextLevel, streak } from "../journey";

// Any finished board, journey or daily, counts towards the streak.
export function markPlayed(j: Journey): Journey {
  const days = withToday(j.days);
  return days === j.days ? j : { ...j, days };
}

export function finishLevel(j: Journey, level: number, r: Result): Journey {
  const stars = starsFor(r);
  return saveJourney(
    markPlayed({
      ...j,
      xp: j.xp + r.xp,
      stars: stars > (j.stars[level] ?? 0) ? { ...j.stars, [level]: stars } : j.stars,
    }),
  );
}
