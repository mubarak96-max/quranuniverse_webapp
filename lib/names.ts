// The 99 Names of Allah, merged from the source lists by tools/merge_names.mjs,
// plus the written page for each name.
import fs from "node:fs";
import path from "node:path";
import type { RowItem } from "@/lib/data";

export type NameVerse = { surah: number; ayah: number; to?: number };

export type AllahName = {
  number: number;
  slug: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  description: string;
  meaningAr: string;
  verses: NameVerse[];
};

// The written page for a name, content/names/<slug>.json (checked by tools/validate_names.py).
export type NamePage = {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  root: { letters: string; sense: string };
  picture: { kind: "boxes"; label: string; row: RowItem[] };
  key: { label: string; row: RowItem[] };
  knowing: string[];
  seeing: string[];
  trusting: string[];
  loving: string[];
  now: string;
  old: string;
  new: string;
  try: string;
  dua: { text: string; note: string };
  pairs: { slug: string; why: string }[];
  faq: { q: string; a: string }[];
  lessons: number[];
  meta: { version: number; status: "draft" | "review" | "approved"; reviewer: string | null; updated: string };
};

// One talk in Ustadh Hisham Abu Yusuf's series on the names, which the pages draw on.
export type NameLesson = { n: number; video: string; label: string; title: string };

const readContent = <T>(...parts: string[]) =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", ...parts), "utf8")) as T;

let names: AllahName[] | undefined;
let lessons: NameLesson[] | undefined;

export function getNames(): AllahName[] {
  names ??= readContent<AllahName[]>("names.json");
  return names;
}

export function getNamePage(slug: string): NamePage | undefined {
  const file = path.join(process.cwd(), "content", "names", `${slug}.json`);
  return fs.existsSync(file) ? readContent<NamePage>("names", `${slug}.json`) : undefined;
}

export function getNameLessons(nums: number[]): NameLesson[] {
  lessons ??= readContent<NameLesson[]>("name-lessons.json");
  return nums.flatMap((n) => lessons!.filter((l) => l.n === n));
}

export const getNameBySlug = (slug: string) => getNames().find((n) => n.slug === slug);

export const nameHref = (n: AllahName) => `/names/${n.slug}`;

export const verseRef = (v: NameVerse) => `${v.surah}:${v.ayah}${v.to ? `-${v.to}` : ""}`;
