// Quran in 30 Days: reads content/q30/day-NN.json and fills in the Arabic, the Sahih International English and verse
// links from the Quran data, so content files only name references.
import fs from "node:fs";
import path from "node:path";
import { getSurah, getSurahs, getTranslation, surahHref } from "./data";
import { verse as cutVerse } from "./timeline";
import {
  DAYS,
  partOf,
  type Block,
  type Day,
  type DayBlock,
  type DaySummary,
  type RawDay,
  type RefLink,
  type Verse,
} from "./q30-types";

const DIR = path.join(process.cwd(), "content", "q30");

// "2:30-39" -> surah 2, verses 30..39. A bare "97" is the whole surah.
function parse(ref: string) {
  const [s, range] = ref.split(":");
  if (!range) return { s: +s, from: 1, to: getSurah(+s)!.total_verses, whole: true };
  const [a, b] = range.split("-").map(Number);
  return { s: +s, from: a, to: b ?? a, whole: false };
}

export const refHref = (ref: string) => {
  const r = parse(ref);
  return r.whole ? surahHref(r.s) : surahHref(r.s, r.from);
};

const link = (ref: string): RefLink => ({ ref, href: refHref(ref) });

function verse(ref: string, from?: string, to?: string): Verse {
  const r = parse(ref);
  const surah = getSurah(r.s)!;
  const cut = Boolean(from);
  const lines = [];
  for (let a = r.from; a <= r.to; a++) {
    const key = `${r.s}:${a}`;
    const en = cut ? cutVerse(key, true, { from: from!, to }).text! : getTranslation(key);
    // An excerpt shows no Arabic: the full verse beside a cut translation would not match.
    lines.push({ key, ar: cut ? "" : surah.verses[a - 1].text, en });
  }
  return { ref, href: surahHref(r.s, r.from), name: surah.transliteration, lines, cut };
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

function blockWords(b: Block): number {
  if ("p" in b) return words(b.p);
  if ("note" in b) return words(b.note);
  if ("quote" in b) return words(b.quote);
  if ("list" in b) return b.list.reduce((n, s) => n + words(s), 0);
  if ("word" in b) return words(b.word.nuance);
  if ("verse" in b) {
    const r = parse(b.verse);
    let n = 0;
    for (let a = r.from; a <= r.to; a++) n += words(getTranslation(`${r.s}:${a}`));
    return n;
  }
  return 0;
}

// Reading at about 200 words a minute, plus a little for the Arabic, figures and the quiz.
const minutesOf = (raw: RawDay) =>
  Math.round(raw.chapters.reduce((n, c) => n + c.blocks.reduce((m, b) => m + blockWords(b), 0), 0) / 200) + 2;

const file = (n: number) => path.join(DIR, `day-${String(n).padStart(2, "0")}.json`);
const read = (n: number) => JSON.parse(fs.readFileSync(file(n), "utf8")) as RawDay;

export const getDayNumbers = () =>
  Array.from({ length: DAYS }, (_, i) => i + 1).filter((n) => fs.existsSync(file(n)));

// Each quiz adds one question from an earlier day, so old lessons keep coming back.
const RECALL_GAP = [2, 5, 9];

const cache = new Map<number, Day>();

export function getDay(n: number): Day | undefined {
  if (cache.has(n)) return cache.get(n);
  if (!fs.existsSync(file(n))) return undefined;
  const raw = read(n);
  const back = Math.max(1, n - RECALL_GAP[n % 3]);
  const recallDay = n > 1 && fs.existsSync(file(back)) ? read(back) : undefined;
  const recallQ = recallDay?.quiz[n % recallDay.quiz.length];
  const hasAnatomy = raw.chapters.some((c) => c.blocks.some((b) => "figure" in b && b.figure.kind === "anatomy"));
  const day: Day = {
    ...raw,
    part: partOf(n).n,
    minutes: minutesOf(raw),
    chapters: raw.chapters.map((c) => ({
      ...c,
      blocks: c.blocks.map((b): DayBlock => ("verse" in b ? { verse: verse(b.verse, b.from, b.to) } : b)),
    })),
    carry: verse(raw.carry),
    deeper: raw.deeper.map(link),
    recall: recallQ ? { ...recallQ, from: back } : undefined,
    anatomy: hasAnatomy
      ? getSurahs().map((s) => ({ id: s.id, name: s.transliteration, verses: s.total_verses, makki: s.type === "meccan" }))
      : undefined,
  };
  cache.set(n, day);
  return day;
}

export function getSummary(n: number): DaySummary | undefined {
  if (!fs.existsSync(file(n))) return undefined;
  const d = read(n);
  const blocks = d.chapters.flatMap((c) => c.blocks);
  const w = blocks.find((b) => "word" in b);
  return {
    day: n,
    part: partOf(n).n,
    title: d.title,
    question: d.question,
    summary: d.summary,
    minutes: minutesOf(d),
    chapters: d.chapters.map((c) => ({ lens: c.lens, title: c.title })),
    word: w && "word" in w ? { ar: w.word.ar, tr: w.word.tr, meaning: w.word.meaning } : undefined,
    refs: blocks.flatMap((b) => ("verse" in b ? [b.verse] : [])).slice(0, 6),
    review: Boolean(d.review),
  };
}

export const getSummaries = () => getDayNumbers().map((n) => getSummary(n)!);

// The reference page: every key word, and every passage grouped by surah.
export function getReference() {
  const days = getDayNumbers().map(read);
  const words = days
    .flatMap((d) =>
      d.chapters.flatMap((c) => c.blocks.flatMap((b) => ("word" in b ? [{ day: d.day, ...b.word }] : []))),
    )
    .sort((a, b) => a.tr.localeCompare(b.tr));
  const bySurah = new Map<number, { ref: string; href: string; day: number }[]>();
  for (const d of days) {
    for (const c of d.chapters) {
      for (const b of c.blocks) {
        if (!("verse" in b)) continue;
        const r = parse(b.verse);
        const list = bySurah.get(r.s) ?? [];
        if (!list.some((x) => x.ref === b.verse && x.day === d.day)) list.push({ ref: b.verse, href: refHref(b.verse), day: d.day });
        bySurah.set(r.s, list);
      }
    }
  }
  const verses = [...bySurah.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([s, refs]) => ({ surah: s, name: getSurah(s)!.transliteration, refs }));
  return { words, verses };
}
