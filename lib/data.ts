// Reads the Quran data and generated cards straight from the project root, one level above web/.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "..");

export type BoxStyle = "idea" | "trap" | "reward" | "people" | "plain";
export type Box = { box: BoxStyle; title: string; sub?: string[]; strike?: boolean; num?: boolean };
export type Conn = { conn: string };
export type RowItem = Box | Conn;
export type Picture = { kind: "svg"; src: string } | { kind: "boxes"; label: string; row: RowItem[] };

export type Card = {
  id: string;
  surah: number;
  ayah: number;
  place: "makkah" | "madinah";
  title: string;
  subtitle: string;
  picture: Picture;
  key: { label: string; row: RowItem[] };
  then: string;
  now: string;
  old: string;
  new: string;
  try: string;
  related: string[];
  meta: { version: number; status: "draft" | "review" | "approved"; reviewer: string | null; updated?: string };
};

export type Surah = {
  id: number;
  name: string;
  transliteration: string;
  type: "meccan" | "medinan";
  total_verses: number;
  verses: { id: number; text: string }[];
};

export type Palette = Record<string, string>;
export type Theme = { palettes: Record<string, Palette>; default: string };

const cache = new Map<string, unknown>();

function readJson<T>(rel: string): T {
  if (!cache.has(rel)) {
    cache.set(rel, JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")));
  }
  return cache.get(rel) as T;
}

export const getSurahs = () => readJson<Surah[]>("quran.json");

export function getSurah(id: number): Surah | undefined {
  return getSurahs()[id - 1];
}

export function getCards(surah: number): Card[] {
  const rel = path.join("content", "cards", `${String(surah).padStart(3, "0")}.json`);
  return fs.existsSync(path.join(ROOT, rel)) ? readJson<Card[]>(rel) : [];
}

export function getCard(surah: number, ayah: number): Card | undefined {
  return getCards(surah).find((c) => c.ayah === ayah);
}

export const getTheme = () => readJson<Theme>(path.join("content", "theme.json"));

export function getTranslation(key: string): string {
  return readJson<Record<string, { text: string }>>("en.sahih.json")[key]?.text ?? "";
}

export function getTransliteration(key: string): string {
  return readJson<Record<string, { text: string }>>("en.transliteration.json")[key]?.text ?? "";
}

export function getWords(key: string): string[] {
  const wbw = readJson<Record<string, string>>("colored-english-wbw-translation.json");
  const words: string[] = [];
  for (let i = 1; wbw[`${key}:${i}`] !== undefined; i++) words.push(wbw[`${key}:${i}`]);
  return words;
}

// Grouped verses in the tafsir file point at the key that holds the shared passage.
export function getTafsir(key: string): { html: string; from: string } | undefined {
  const tafsir = readJson<Record<string, { text: string } | string>>("en-tafisr-ibn-kathir.json");
  const entry = tafsir[key];
  if (entry === undefined) return undefined;
  if (typeof entry === "string") {
    const target = tafsir[entry];
    return typeof target === "object" ? { html: target.text, from: entry } : undefined;
  }
  return { html: entry.text, from: key };
}

export function getSurahInfo(id: number): string {
  return readJson<Record<string, { text: string }>>("surah-info-en.json")[String(id)]?.text ?? "";
}
