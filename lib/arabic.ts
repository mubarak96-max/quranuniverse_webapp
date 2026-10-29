// Word handling for the Uthmani text in quran.json, shared by tools/gen_games.mjs and the games.

// Pause marks (ۚ ۖ ۗ …) are separate tokens in the text; they belong to the word before them.
const PAUSE = /^[ۖ-ۭؕ-ؚ۝۞]+$/;

export function words(text: string): string[] {
  const out: string[] = [];
  for (const t of text.split(/\s+/).filter(Boolean)) {
    if (PAUSE.test(t) && out.length > 0) out[out.length - 1] += ` ${t}`;
    else out.push(t);
  }
  return out;
}

// Drops vowels and Quranic marks and folds alef and ya variants, so ٱللَّهِ and ٱللَّهُ compare equal.
export const plain = (word: string) =>
  word
    .replace(/\s.*/, "")
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي");

export const gloss = (html: string) => html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
