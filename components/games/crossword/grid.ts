// Crossword shapes shared by the board, the print sheet and the scoring, as written by tools/gen_games.mjs.

export type Dir = "a" | "d";
export type Word = { n: number; r: number; c: number; d: Dir; word: string; len: string; clue: string; x?: string };
export type Puzzle = { w: number; h: number; words: Word[] };

export const cellKey = (r: number, c: number) => `${r},${c}`;
export const wordId = (w: Word) => `${w.d}${w.n}`;

export const cellsOf = (w: Word) =>
  Array.from({ length: w.word.length }, (_, i) => cellKey(w.r + (w.d === "d" ? i : 0), w.c + (w.d === "a" ? i : 0)));

export function solutionOf(p: Puzzle) {
  const m = new Map<string, string>();
  for (const w of p.words) cellsOf(w).forEach((k, i) => m.set(k, w.word[i]));
  return m;
}

// Clue order players expect: all across clues by number, then all down clues.
export const clueOrder = (p: Puzzle) =>
  [...p.words].sort((a, b) => (a.d === b.d ? a.n - b.n : a.d === "a" ? -1 : 1));

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Help costs: a checked word or one revealed letter costs 1, a revealed word costs 2.
export const HELP = { check: 1, letter: 1, word: 2 } as const;
export type Help = keyof typeof HELP;

// About 25 seconds a word is a steady pace; three stars needs no help and that pace.
export const parFor = (p: Puzzle) => p.words.length * 25;

export function starsFor(help: number, secs: number, par: number) {
  const stars = help === 0 ? 3 : help <= 2 ? 2 : 1;
  return stars === 3 && secs > par ? 2 : stars;
}

export const xpFor = (p: Puzzle, stars: number, secs: number) =>
  p.words.length * 10 + stars * 15 + Math.max(0, Math.round((parFor(p) - secs) / 5));
