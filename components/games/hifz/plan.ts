// Questions for one hifz level. Difficulty comes from the level's place in the journey,
// so later juz bring more blanks, more question types and less help.
import { plain } from "@/lib/arabic";

export type Verse = { w: string[]; en: string };
export type Ref = { s: number; v: number };

export type Step =
  | { kind: "read"; s: number; from: number; to: number }
  | { kind: "fill"; s: number; v: number; blanks: number[]; options: string[][] }
  | { kind: "next"; s: number; v: number; options: number[] }
  | { kind: "order"; s: number; verses: number[] }
  | { kind: "first"; s: number; v: number; options: number[] }
  | { kind: "spot"; s: number; v: number; at: number; fake: string };

export type Kind = Step["kind"];

export function tune(level: number) {
  return {
    questions: Math.min(12, 6 + Math.floor(level / 12)),
    options: level < 4 ? 3 : 4,
    blanks: level < 12 ? 1 : level < 40 ? 2 : 3,
    kinds: (["fill", "next", "order", "first", "spot"] as const).slice(0, level < 2 ? 2 : level < 5 ? 3 : level < 8 ? 4 : 5),
    orderSize: level < 20 ? 3 : level < 60 ? 4 : 5,
    translation: level < 25,
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

// Pause marks ride along with the word before them; questions show and compare the bare word.
export const bare = (w: string) => w.replace(/\s.*/, "");
export const opening = (v: Verse, n = 3) => v.w.slice(0, n).map(bare).join(" ") + (v.w.length > n ? " …" : "");
const text = (v: Verse) => v.w.map(bare).join(" ");

// One-letter particles make poor blanks: every option would look alike.
const blankable = (w: string) => plain(w).length >= 3;

function likeness(a: string, b: string) {
  const x = plain(a);
  const y = plain(b);
  let shared = 0;
  for (const ch of new Set(x)) if (y.includes(ch)) shared++;
  return shared / Math.max(x.length, y.length) + (x.at(-1) === y.at(-1) ? 0.3 : 0) - Math.abs(x.length - y.length) * 0.1;
}

// Wrong words that look and sound like the answer, drawn from nearby verses so they feel plausible.
function lookalikes(answer: string, pool: string[], count: number) {
  const key = plain(answer);
  const seen = new Set([key]);
  const out: string[] = [];
  const ranked = shuffle(pool)
    .map((w) => ({ w, score: likeness(w, answer) }))
    .sort((a, b) => b.score - a.score)
    .map((o) => o.w);
  for (const w of ranked) {
    if (out.length === count) break;
    const k = plain(w);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(bare(w));
    }
  }
  return out;
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// Verses whose full text repeats in the surah (the refrain of ar-Rahman) cannot anchor
// a "what comes next" question: each repeat is followed by a different verse.
function unique(verses: Verse[]) {
  const count = new Map<string, number>();
  for (const v of verses) count.set(text(v), (count.get(text(v)) ?? 0) + 1);
  return (i: number) => count.get(text(verses[i])) === 1;
}

function make(kind: Exclude<Kind, "read">, s: number, verses: Verse[], range: number[], t: ReturnType<typeof tune>): Step | null {
  // Words from the passage and the verses around it; a whole long surah would be slow and less plausible.
  const pool = verses.slice(Math.max(0, range[0] - 10), range.at(-1)! + 11).flatMap((v) => v.w).filter(blankable);
  const isUnique = unique(verses);
  if (kind === "fill" || kind === "spot") {
    const v = pick(range.filter((i) => verses[i].w.some(blankable)));
    if (v === undefined) return null;
    const slots = shuffle(verses[v].w.map((w, i) => [w, i] as const).filter(([w]) => blankable(w)));
    if (kind === "spot") {
      const [word, at] = slots[0];
      const fake = lookalikes(word, pool, 1)[0];
      return fake ? { kind, s, v, at, fake } : null;
    }
    const blanks = slots.slice(0, t.blanks).map(([, i]) => i).sort((a, b) => a - b);
    const options = blanks.map((i) => shuffle([bare(verses[v].w[i]), ...lookalikes(verses[v].w[i], pool, t.options - 1)]));
    return options.every((o) => o.length >= 2) ? { kind, s, v, blanks, options } : null;
  }
  if (kind === "next" || kind === "first") {
    // "next" asks what follows v; "first" asks how v begins, so it needs a verse before it for context.
    const anchors = range.filter((i) => (kind === "next" ? range.includes(i + 1) && isUnique(i) : i > 0));
    const v = pick(anchors);
    if (v === undefined) return null;
    const answer = kind === "next" ? v + 1 : v;
    const show = (i: number) => (kind === "next" ? opening(verses[i], 5) : opening(verses[i], 2));
    const seen = new Set([show(answer)]);
    const wrong = shuffle(verses.map((_, i) => i)).filter((i) => !seen.has(show(i)) && seen.add(show(i)));
    if (wrong.length === 0) return null;
    return { kind, s, v, options: shuffle([answer, ...wrong.slice(0, t.options - 1)]) };
  }
  const size = Math.min(t.orderSize, range.length);
  if (size < 3) return null;
  const start = range[Math.floor(Math.random() * (range.length - size + 1))];
  return { kind: "order", s, verses: Array.from({ length: size }, (_, k) => start + k) };
}

export function buildLevel(level: number, s: number, verses: Verse[], from: number, to: number, replay: boolean): Step[] {
  const t = tune(level);
  const range = Array.from({ length: to - from + 1 }, (_, k) => from - 1 + k);
  const steps: Step[] = replay ? [] : [{ kind: "read", s, from: from - 1, to: to - 1 }];
  // Rotate through the unlocked kinds so a level never feels like ten of the same question.
  const order = shuffle([...t.kinds]);
  for (let n = 0, tries = 0; n < t.questions && tries < t.questions * 4; tries++) {
    const step = make(order[tries % order.length], s, verses, range, t);
    if (step) {
      steps.push(step);
      n++;
    }
  }
  return steps;
}

// Review: one fill-in question per weak verse, from whichever surahs they belong to.
export function buildReview(weak: Ref[], bySurah: Record<number, Verse[]>): Step[] {
  const t = { ...tune(0), options: 4 };
  return weak.flatMap(({ s, v }) => {
    const step = make("fill", s, bySurah[s], [v], t) ?? make("next", s, bySurah[s], [v], t);
    return step ? [step] : [];
  });
}

export const verseOf = (step: Step): Ref | null =>
  step.kind === "read" || step.kind === "order" ? null : { s: step.s, v: step.v };
