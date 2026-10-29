// The hifz journey: the order levels come in, and how a surah is cut into levels.
// Pure, so the page can build it on the server and the client can reuse the types.

export type Level = { s: number; from: number; to: number; juz: number };
export type Chapter = { juz: number; name: string; levels: number[] };

// First verse of each juz in the Hafs mushaf, juz 1 to 30.
const JUZ_STARTS: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

export function juzOf(s: number, a: number) {
  let juz = 1;
  JUZ_STARTS.forEach(([js, ja], i) => {
    if (s > js || (s === js && a >= ja)) juz = i + 1;
  });
  return juz;
}

// A level is one sitting of revision: about 120 words, never across a juz boundary, never ending mid-verse.
const TARGET_WORDS = 120;

function cut(s: number, words: number[]): Level[] {
  const out: Level[] = [];
  let from = 1;
  let count = 0;
  for (let a = 1; a <= words.length; a++) {
    count += words[a - 1];
    const last = a === words.length;
    const juzBreak = !last && juzOf(s, a + 1) !== juzOf(s, a);
    if (last || juzBreak || count >= TARGET_WORDS) {
      out.push({ s, from, to: a, juz: juzOf(s, from) });
      from = a + 1;
      count = 0;
    }
  }
  // A two-verse scrap at the end of a long surah is folded into the level before it.
  const tail = out.at(-1)!;
  const prev = out.at(-2);
  if (prev && tail.to - tail.from < 2 && prev.juz === tail.juz) {
    prev.to = tail.to;
    out.pop();
  }
  return out;
}

// Al-Fatihah first, then juz 30 down to juz 1, the order most hifz students follow.
// Inside a juz the surahs run from the last to the first, and each surah's verses run forward.
export function buildJourney(wordsPerVerse: number[][]): Level[] {
  const all = wordsPerVerse.flatMap((w, i) => cut(i + 1, w));
  const opening = all.filter((l) => l.s === 1);
  const rest = all.filter((l) => l.s !== 1);
  rest.sort((x, y) => y.juz - x.juz || y.s - x.s || x.from - y.from);
  return [...opening, ...rest];
}

export function chapters(levels: Level[]): Chapter[] {
  const out: Chapter[] = [];
  levels.forEach((l, i) => {
    const juz = l.s === 1 ? 0 : l.juz;
    const last = out.at(-1);
    if (last && last.juz === juz) last.levels.push(i);
    else out.push({ juz, name: juz === 0 ? "The Opening" : `Juz ${juz}`, levels: [i] });
  });
  return out;
}

export const levelKey = (l: Level) => `${l.s}:${l.from}`;

// Folds "Ya-Sin", "yaseen" and "Al Mulk" into plain search keys.
export const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
