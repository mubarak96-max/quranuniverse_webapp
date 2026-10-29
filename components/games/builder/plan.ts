// Ayah Builder levels: how each verse is dealt as tiles, and how the challenge rises with the level number.
import { plain } from "@/lib/arabic";

export type Verse = { s: number; a: number; en: string; w: [string, string][] };
export type SurahRef = { name: string; href: string };
export type Tile = { id: number; ar: string; gloss: string; decoy: boolean };

export const CHAPTERS = [
  { name: "The Opening", ar: "الفاتحة", line: "Al-Fatihah and the surahs you pray with every day." },
  { name: "Juz Amma", ar: "جزء عمّ", line: "Short verses from the last part of the Quran." },
  { name: "Supplications", ar: "الدعاء", line: "Verses the prophets prayed with, and that we still do." },
  { name: "The Straight Path", ar: "الصراط", line: "Verses from across the Quran. Decoy words join in." },
  { name: "The Lamp", ar: "السراج", line: "Longer verses, and decoys that look like the real word." },
  { name: "The Night Journey", ar: "الإسراء", line: "The longest verses, built without the English guide." },
];

export function tune(level: number) {
  return {
    decoys: level < 6 ? 0 : level < 14 ? 1 : level < 24 ? 2 : 3,
    // From here decoys are picked to look like words in the verse, not at random.
    lookalike: level >= 20,
    // Beginners see each tile's meaning; later it becomes a hint.
    glosses: level < 8,
    guide: level < 32,
  };
}

// Slips are wrong taps plus hints; a level allows a few before it costs stars.
export const starsFor = (slips: number) => (slips <= 1 ? 3 : slips <= 4 ? 2 : 1);

export function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function likeness(a: string, b: string) {
  const x = plain(a);
  const y = plain(b);
  let shared = 0;
  for (const ch of new Set(x)) if (y.includes(ch)) shared++;
  return shared / Math.max(x.length, y.length) + (x[0] === y[0] ? 0.3 : 0) - Math.abs(x.length - y.length) * 0.1;
}

// Decoys come from other verses in the chapter and never match a word of this verse, so every tile has one right place.
function decoys(verse: Verse, pool: Verse[], count: number, lookalike: boolean): [string, string][] {
  if (count === 0) return [];
  const own = new Set(verse.w.map(([ar]) => plain(ar)));
  const seen = new Set<string>();
  const candidates = pool
    .filter((v) => v !== verse)
    .flatMap((v) => v.w)
    .filter(([ar]) => {
      const key = plain(ar);
      if (own.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const ranked = lookalike
    ? candidates
        .map((w) => ({ w, score: Math.max(...verse.w.map(([ar]) => likeness(ar, w[0]))) + Math.random() * 0.2 }))
        .sort((a, b) => b.score - a.score)
        .map((c) => c.w)
    : shuffle(candidates);
  return ranked.slice(0, count);
}

export function deal(verse: Verse, pool: Verse[], level: number): Tile[] {
  const t = tune(level);
  const real = verse.w.map(([ar, gloss], i) => ({ id: i, ar, gloss, decoy: false }));
  const fake = decoys(verse, pool, t.decoys, t.lookalike).map(([ar, gloss], i) => ({ id: verse.w.length + i, ar, gloss, decoy: true }));
  const tiles = shuffle([...real, ...fake]);
  // A deal that leaves the verse in reading order would give the answer away.
  return tiles.length > 1 && tiles.every((x, i) => x.id === i) ? [...tiles.slice(1), tiles[0]] : tiles;
}
