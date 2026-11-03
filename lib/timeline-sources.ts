// The primary sources behind an entry, read at build time: the Arabic and English of each verse it cites, and what
// Ibn Kathir says about its key verse. Server only (reads the Quran files from disk).
import { getSurah, getTafsir, getTranslation, surahHref } from "./data";

export type VerseDetail = {
  ref: string;
  href: string;
  surah: string;
  surahArabic: string;
  ayahs: { n: number; arabic: string; english: string }[];
  more: number;
};

const MAX_AYAHS = 3;

// "26:52-66" gives the first three ayahs of the range, and how many more the range holds.
export function verseDetail(ref: string): VerseDetail | undefined {
  const [s, range] = ref.split(":");
  const surah = getSurah(Number(s));
  if (!surah || !range) return undefined;
  const [a, b] = range.split("-").map(Number);
  const last = Number.isFinite(b) ? b : a;
  const ayahs = [];
  for (let n = a; n <= Math.min(last, a + MAX_AYAHS - 1); n++) {
    const arabic = surah.verses[n - 1]?.text;
    if (!arabic) break;
    ayahs.push({ n, arabic, english: getTranslation(`${s}:${n}`) });
  }
  if (!ayahs.length) return undefined;
  return { ref, href: surahHref(Number(s), a), surah: surah.transliteration, surahArabic: surah.name, ayahs, more: Math.max(0, last - a + 1 - ayahs.length) };
}

export type Tafsir = { ref: string; href: string; paras: string[]; more: boolean };

const strip = (html: string) =>
  html
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// The opening of Ibn Kathir's commentary on the verse: whole paragraphs up to about 900 characters, skipping headings.
export function tafsirOf(ref: string, budget = 900): Tafsir | undefined {
  const [s, range] = ref.split(":");
  const first = range?.split("-")[0];
  if (!first) return undefined;
  const t = getTafsir(`${s}:${first}`);
  if (!t) return undefined;
  const paras = [...t.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).filter((p) => p.length > 60);
  const out: string[] = [];
  let used = 0;
  for (const p of paras) {
    if (used && used + p.length > budget) break;
    out.push(used === 0 && p.length > budget ? `${p.slice(0, budget).replace(/\s+\S*$/, "")}…` : p);
    used += p.length;
  }
  if (!out.length) return undefined;
  return { ref: t.from, href: surahHref(Number(s), Number(first)), paras: out, more: paras.length > out.length };
}
