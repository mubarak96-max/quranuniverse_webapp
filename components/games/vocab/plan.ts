// Level building for Word Quest: which words a level teaches and reviews, and the steps the player meets.
// Difficulty is set by the level number alone, so it rises as the player moves along the map.
import { plain } from "@/lib/arabic";

export type Word = { ar: string; en: string; n: number };
export type Verse = { s: number; a: number; w: string[]; g: string[]; en: string; hit: number[] };
export type ChapterVerses = Record<number, Verse[]>;
export type SurahRef = { name: string; href: string };

export type Step =
  | { kind: "intro"; words: number[] }
  | { kind: "match"; words: number[] }
  | { kind: "choice"; word: number; options: number[]; reverse: boolean; seconds: number | null }
  | { kind: "verse"; word: number; verse: Verse; translation: boolean };

export const CHAPTERS = [
  { name: "First Light", ar: "الفجر", line: "The words you will meet on every page." },
  { name: "The Oasis", ar: "الواحة", line: "Little words that hold whole verses together." },
  { name: "The Courtyard", ar: "الصحن", line: "Who speaks, who listens, and to whom." },
  { name: "The House of Wisdom", ar: "بيت الحكمة", line: "Names, places and the Book itself." },
  { name: "The Garden", ar: "الروضة", line: "Mercy, reward and the life to come." },
  { name: "The Night Sky", ar: "الليل", line: "The last stretch to 300 words." },
];

export const chapterOf = (level: number, perChapter: number) => Math.floor(level / perChapter);

export function tune(level: number) {
  return {
    options: level < 8 ? 3 : 4,
    // Share of questions that show the meaning and ask for the Arabic, the harder direction.
    reverse: level < 4 ? 0 : Math.min(0.5, 0.15 + level * 0.01),
    seconds: level < 3 ? null : Math.max(5, 12 - Math.floor(level / 6)),
    verses: level === 0 ? 1 : level < 30 ? 2 : 3,
    translation: level < 15,
    review: level === 0 ? 0 : Math.min(3, 1 + Math.floor(level / 10)),
    // How strongly wrong options are chosen to look like the answer.
    lookalike: Math.min(0.85, level / 40),
  };
}

export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const sameMeaning = (a: Word, b: Word) => a.en.toLowerCase() === b.en.toLowerCase();

// Letters two spellings share, so وَلَا and وَمَا score as lookalikes and مِن and جَنَّة do not.
function likeness(a: string, b: string) {
  const x = plain(a);
  const y = plain(b);
  let shared = 0;
  for (const ch of new Set(x)) if (y.includes(ch)) shared++;
  return shared / Math.max(x.length, y.length) + (x[0] === y[0] ? 0.3 : 0) - Math.abs(x.length - y.length) * 0.1;
}

function distractors(words: Word[], answer: number, pool: number[], count: number, lookalike: number) {
  // Each option scores a blend of looking like the answer and chance; the level sets the blend.
  const ranked = pool
    .filter((i) => i !== answer && !sameMeaning(words[i], words[answer]))
    .map((i) => ({ i, score: lookalike * likeness(words[i].ar, words[answer].ar) + (1 - lookalike) * Math.random() }))
    .sort((a, b) => b.score - a.score)
    .map((o) => o.i);
  const picked: number[] = [];
  for (const i of ranked) {
    if (picked.length === count) break;
    if (!picked.some((p) => sameMeaning(words[p], words[i]))) picked.push(i);
  }
  return picked;
}

// Review favours the weakest words the player has met, and skips any that share a meaning with a new word.
function reviewWords(words: Word[], fresh: number[], seen: number[], strength: Record<number, number>, count: number) {
  return shuffle(seen)
    .sort((a, b) => (strength[a] ?? 0) - (strength[b] ?? 0))
    .filter((i) => !fresh.some((f) => sameMeaning(words[f], words[i])))
    .reduce<number[]>((out, i) => (out.length < count && !out.some((o) => sameMeaning(words[o], words[i])) ? [...out, i] : out), []);
}

export function buildLevel(
  level: number,
  words: Word[],
  levels: number[][],
  verses: ChapterVerses,
  strength: Record<number, number>,
  replay: boolean,
): Step[] {
  const t = tune(level);
  const fresh = levels[level];
  const seen = levels.slice(0, level).flat();
  const review = reviewWords(words, fresh, seen, strength, t.review);
  const pool = levels.slice(0, level + 2).flat();

  const steps: Step[] = [];
  if (!replay) steps.push({ kind: "intro", words: fresh });
  steps.push({ kind: "match", words: shuffle([...fresh, ...review.slice(0, 1)]) });
  for (const word of shuffle([...fresh, ...review])) {
    const reverse = Math.random() < t.reverse;
    steps.push({
      kind: "choice",
      word,
      reverse,
      seconds: t.seconds,
      options: shuffle([word, ...distractors(words, word, pool, t.options - 1, reverse ? t.lookalike : t.lookalike / 2)]),
    });
  }
  const hunted = shuffle(fresh.filter((i) => verses[i]?.length)).slice(0, t.verses);
  for (const word of hunted) {
    steps.push({ kind: "verse", word, verse: shuffle(verses[word])[0], translation: t.translation });
  }
  return steps;
}
