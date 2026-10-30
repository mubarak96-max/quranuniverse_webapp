// Quran in 30 Days: reads content/q30/day-NN.json and fills in the Arabic, the Sahih International English,
// verse links and juz from the Quran data, so content files only name references.
import fs from "node:fs";
import path from "node:path";
import { juzOf } from "@/components/games/hifz/journey";
import { getSurah, getSurahs, getTranslation, surahHref } from "./data";
import { verse } from "./timeline";
import {
  DAYS,
  partOf,
  type Day,
  type DaySummary,
  type Passage,
  type RawDay,
  type RawPassage,
  type RefLink,
} from "./q30-types";

const DIR = path.join(process.cwd(), "content", "q30");

// "2:30-39" -> surah 2, verses 30..39. A bare "97" is the whole surah.
function parse(ref: string) {
  const [s, range] = ref.split(":");
  if (!range) return { s: +s, from: 1, to: getSurah(+s)!.total_verses, whole: true };
  const [a, b] = range.split("-").map(Number);
  return { s: +s, from: a, to: b ?? a, whole: false };
}

const link = (ref: string): RefLink => {
  const r = parse(ref);
  return { ref, href: r.whole ? surahHref(r.s) : surahHref(r.s, r.from) };
};

function passage(raw: RawPassage): Passage {
  const { from: cutFrom, to: cutTo, ...rest } = raw;
  const r = parse(raw.ref);
  const surah = getSurah(r.s)!;
  const cut = Boolean(cutFrom);
  const lines = [];
  for (let a = r.from; a <= r.to; a++) {
    const key = `${r.s}:${a}`;
    const en = cut ? verse(key, true, { from: cutFrom!, to: cutTo }).text! : getTranslation(key);
    // An excerpt shows no Arabic: the full verse beside a cut translation would not match.
    lines.push({ key, ar: cut ? "" : surah.verses[a - 1].text, en });
  }
  return { ...rest, href: surahHref(r.s, r.from), lines, cut };
}

function juzList(refs: string[]): number[] {
  const set = new Set<number>();
  for (const ref of refs) {
    const r = parse(ref);
    for (let a = r.from; a <= r.to; a++) set.add(juzOf(r.s, a));
  }
  return [...set].sort((a, b) => a - b);
}

const file = (n: number) => path.join(DIR, `day-${String(n).padStart(2, "0")}.json`);
const read = (n: number) => JSON.parse(fs.readFileSync(file(n), "utf8")) as RawDay;

export const getDayNumbers = () =>
  Array.from({ length: DAYS }, (_, i) => i + 1).filter((n) => fs.existsSync(file(n)));

// Each quiz page adds one question from an earlier day, so old lessons keep coming back.
const RECALL_GAP = [2, 5, 9];

const cache = new Map<number, Day>();

export function getDay(n: number): Day | undefined {
  if (cache.has(n)) return cache.get(n);
  if (!fs.existsSync(file(n))) return undefined;
  const raw = read(n);
  const back = Math.max(1, n - RECALL_GAP[n % 3]);
  const recallDay = n > 1 && fs.existsSync(file(back)) ? read(back) : undefined;
  const recallQ = recallDay?.quiz[n % recallDay.quiz.length];
  const day: Day = {
    ...raw,
    part: partOf(n).n,
    passages: raw.passages.map(passage),
    juz: juzList(raw.passages.map((p) => p.ref)),
    word: { ...raw.word, links: raw.word.refs.map(link) },
    mixup: { ...raw.mixup, links: raw.mixup.refs.map(link) },
    memorize: passage({ ref: raw.memorize, context: "", point: "", label: "stated" }),
    deeper: raw.deeper.map(link),
    recall: recallQ ? { ...recallQ, from: back } : undefined,
    anatomy:
      raw.visual.kind === "anatomy"
        ? getSurahs().map((s) => ({ id: s.id, name: s.transliteration, verses: s.total_verses, makki: s.type === "meccan" }))
        : undefined,
  };
  cache.set(n, day);
  return day;
}

export function getSummaries(): DaySummary[] {
  return getDayNumbers().map((n) => {
    const d = read(n);
    return { day: n, part: partOf(n).n, title: d.title, question: d.question, emblem: d.emblem, review: Boolean(d.review) };
  });
}

// The reference booklet: every key word, and every passage grouped by surah.
export function getReference() {
  const days = getDayNumbers().map(read);
  const words = days
    .map((d) => ({ day: d.day, ar: d.word.ar, tr: d.word.tr, meaning: d.word.meaning, root: d.word.root }))
    .sort((a, b) => a.tr.localeCompare(b.tr));
  const bySurah = new Map<number, { ref: string; href: string; day: number }[]>();
  for (const d of days) {
    for (const p of d.passages) {
      const r = parse(p.ref);
      const list = bySurah.get(r.s) ?? [];
      list.push({ ref: p.ref, href: surahHref(r.s, r.from), day: d.day });
      bySurah.set(r.s, list);
    }
  }
  const verses = [...bySurah.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([s, refs]) => ({ surah: s, name: getSurah(s)!.transliteration, refs }));
  return { words, verses };
}
