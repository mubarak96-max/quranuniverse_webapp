// Surah Quest rules: difficulty per level, the hint ladder, scoring and saved progress.
import type { SurahEntry } from "@/components/SurahIndex";
import { load, save } from "../daily";
import { withToday } from "../journey";

export type SurahPick = SurahEntry & { meaning: string };
export type QuestVerse = { s: number; a: number; en: string; ar: string; j: number; nb: { a: number; en: string } | null };
export type Hint = { key: string; label: string; body: string };
export type VerseResult = { s: number; a: number; solved: boolean; score: number };

export const CHAPTERS = [
  { name: "The Short Surahs", ar: "قصار السور", line: "Al-Fatihah and the surahs heard in every prayer." },
  { name: "The Mountain Path", ar: "الطريق", line: "The last two juz, from An-Naba to An-Nas." },
  { name: "Famous Verses", ar: "آيات مشهورة", line: "Ayat al-Kursi and the verses quoted in every khutbah." },
  { name: "Stories of the Prophets", ar: "قصص الأنبياء", line: "Nuh, Yusuf, Musa and the nations before us." },
  { name: "Two Cities", ar: "مكة والمدينة", line: "Makkah and Madinah: the whole Quran opens up." },
  { name: "The Whole Book", ar: "المصحف", line: "Any verse, any surah. Hints are earned, not given." },
];

export const art = (chapter: number) => `/games/guess-the-surah/art/g${chapter + 1}.webp`;

export function tune(level: number) {
  return {
    // Early levels answer from a few cards; from level 21 the player types any of the 114 names.
    choices: level < 10 ? 4 : level < 20 ? 6 : 0,
    tries: level < 10 ? 2 : 3,
    free: level < 10 ? 2 : level < 30 ? 1 : 0,
    translation: level < 40,
    // How strongly wrong cards are drawn from surahs close to the answer.
    nearby: Math.min(0.9, level / 20),
  };
}

export const POINTS = { base: 100, hint: 15, miss: 25, floor: 10 };

export const verseScore = (solved: boolean, hints: number, misses: number) =>
  solved ? Math.max(POINTS.floor, POINTS.base - hints * POINTS.hint - misses * POINTS.miss) : 0;

export const starsFor = (score: number, max: number) => (score >= max * 0.8 ? 3 : score >= max * 0.5 ? 2 : 1);

// Distance in surah numbers; the bands colour each wrong guess and the daily share squares.
export const band = (d: number) => (d === 0 ? "hit" : d <= 5 ? "hot" : d <= 20 ? "warm" : "cold");
export const BAND_LABEL = { hit: "Correct", hot: "Very close", warm: "Close", cold: "Far" };

const sizeOf = (n: number) =>
  n <= 10 ? "10 verses or fewer" : n <= 30 ? "11 to 30 verses" : n <= 60 ? "31 to 60 verses" : n <= 120 ? "61 to 120 verses" : "more than 120 verses";

// "Al-Baqarah" starts with B for a player, not A; the article and apostrophes are dropped.
export const firstLetter = (name: string) => name.replace(/^A[a-z]{1,2}-/, "").replace(/^['’]/, "")[0];

export function hints(v: QuestVerse, answer: SurahPick, translation: boolean): Hint[] {
  const list: Hint[] = [];
  if (!translation) list.push({ key: "en", label: "Translation", body: v.en });
  list.push(
    { key: "place", label: "Revealed in", body: answer.place },
    { key: "juz", label: "Juz", body: `This verse is in juz ${v.j} of 30` },
    { key: "size", label: "Length", body: `The surah has ${sizeOf(answer.verses)}` },
    { key: "meaning", label: "Name meaning", body: `Its name means “${answer.meaning}”` },
    { key: "letter", label: "First letter", body: `Its name starts with “${firstLetter(answer.transliteration)}”` },
  );
  if (v.nb) list.push({ key: "nb", label: v.nb.a < v.a ? "Verse before" : "Verse after", body: v.nb.en });
  return list;
}

export function choices(answer: number, count: number, nearby: number): number[] {
  const others = Array.from({ length: 114 }, (_, i) => i + 1)
    .filter((id) => id !== answer)
    .map((id) => ({ id, score: nearby * (1 - Math.abs(id - answer) / 114) + (1 - nearby) * Math.random() }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count - 1)
    .map((o) => o.id);
  return shuffle([answer, ...others]);
}

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type Progress = {
  stars: Record<number, number>;
  xp: number;
  found: number[];
  days: number[];
  muted: boolean;
};

const KEY = "qu:surah-quest";
const EMPTY: Progress = { stars: {}, xp: 0, found: [], days: [], muted: false };

export const loadProgress = (): Progress => ({ ...EMPTY, ...load<Partial<Progress>>(KEY, {}) });

export { nextLevel, playedToday, streak } from "../journey";

function store(p: Progress) {
  save(KEY, p);
  return p;
}

export function finish(p: Progress, level: number, stars: number, xp: number, results: VerseResult[]): Progress {
  return store({
    ...p,
    stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
    xp: p.xp + xp,
    found: [...new Set([...p.found, ...results.filter((r) => r.solved).map((r) => r.s)])],
    days: withToday(p.days),
  });
}

export const setMuted = (p: Progress, muted: boolean) => store({ ...p, muted });

// The daily verse also counts toward the streak and, when solved, the surahs found.
export function playedDaily(p: Progress, solved: number | null): Progress {
  return store({
    ...p,
    found: solved && !p.found.includes(solved) ? [...p.found, solved] : p.found,
    days: withToday(p.days),
  });
}
