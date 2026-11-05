// The shape of public/search-index.json, written by tools/gen_search.mjs and read by components/search/Search.tsx.
// Compact on purpose: verses are positional (surah order, then ayah order), so keys and links are rebuilt client-side.
export type SearchIndex = {
  // [slug, transliteration, arabic, meaning, verse count, aliases]
  surahs: [string, string, string, string, number, string[]][];
  // verses[surah - 1][ayah - 1] = translation
  verses: string[][];
  // "2:255" -> card title
  titles: Record<string, string>;
  // [kind, title, blurb, href]
  pages: [string, string, string, string][];
};
