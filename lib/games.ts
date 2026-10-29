// One registry for the games hub, sitemap and llms.txt. Add a game here only once its page is live.
export type Game = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  keywords: string[];
};

export const GAMES: Game[] = [
  {
    slug: "guess-the-surah",
    name: "Guess the Surah",
    tagline: "Read the ayah in Arabic and English, open hints, and name its surah. 60 levels and a daily verse.",
    description:
      "A Quran quiz game: read a verse in Arabic and English and guess which of the 114 surahs it comes from. Climb 60 levels from Juz Amma to the whole Quran, use hints, and play the daily verse.",
    keywords: ["guess the surah", "which surah", "quran quiz game", "quran quiz", "islamic quiz game", "daily quran game"],
  },
  {
    slug: "quran-memorization-test",
    name: "Quran Memorization Test",
    tagline: "A hifz journey from al-Fatihah through all 30 juz. Recite, then prove it, level by level.",
    description:
      "A free Quran memorization test that takes you through all 114 surahs in short levels. Fill missing words, pick the next verse, order verses and spot changed words, with a daily review of every verse you miss.",
    keywords: ["quran memorization test", "hifz test", "quran test", "quran memorization test online", "quran memorization tool", "test my quran memorization"],
  },
  {
    slug: "quran-vocabulary",
    name: "Quran Word Quest",
    tagline: "300 Quran words, 60 levels. Learn each one inside the verses it comes from.",
    description:
      "Learn the 300 most common words in the Quran in a level-based word game. Meet each word in a real verse, match it, race the clock and find it in the ayah as the levels get harder.",
    keywords: ["most common quran words", "quran words and meaning", "learn quran words", "common quran words", "quran words in english", "quranic arabic vocabulary"],
  },
  {
    slug: "islamic-crossword",
    name: "Islamic Crossword",
    tagline: "48 crossword levels from easy to expert, plus a new grid every day.",
    description:
      "A free Islamic crossword game: 48 levels that grow from small easy grids to full-size puzzles about the prophets, the Quran, prayer, Hajj and Islamic history, plus a printable daily crossword with answers.",
    keywords: ["islamic crossword", "islamic crossword puzzle", "islamic crossword puzzles printable", "islamic crossword puzzles with answers", "quran crossword"],
  },
  {
    slug: "islamic-connections",
    name: "Islamic Connections",
    tagline: "Find the hidden links between Islamic words. 60 levels, red herrings and a daily puzzle.",
    description:
      "An Islamic trivia puzzle game: sort words into groups that share a link, from the pillars of Islam to the surahs that begin with Qul. 60 levels that grow harder, hints, and a new daily puzzle.",
    keywords: ["islamic trivia", "islamic trivia game", "islamic trivia questions", "islamic quiz game", "islamic games for adults", "islamic connections"],
  },
  {
    slug: "ayah-builder",
    name: "Ayah Builder",
    tagline: "Rebuild Quran verses word by word, from Al-Fatihah to the longest ayat.",
    description:
      "A Quran word-by-word puzzle game: rebuild each verse from its Arabic words in order, with the meaning of every word. 48 levels from Al-Fatihah to long verses, plus a daily verse.",
    keywords: ["quran word by word", "quran word by word puzzle", "quran word order game", "learn quranic arabic", "quran puzzle"],
  },
];

export const gameHref = (g: Game) => `/games/${g.slug}`;

// Shared by tools/gen_games.mjs (writes the puzzles) and the client (picks today's), so both agree on the schedule.
// Puzzles ship as small static chunks because the full pool is too large to inline in the page.
export type Schedule = { epoch: string; days: number; chunk: number; dir: string };
const daily = (dir: string): Schedule => ({ epoch: "2026-10-29", days: 1140, chunk: 30, dir: `/games/${dir}` });

export const SURAH_PUZZLES = daily("guess-the-surah");
// Journey levels ship one file per chapter, like the vocabulary verses.
export const SURAH_JOURNEY = { levels: 60, perChapter: 10, dir: "/games/guess-the-surah/journey" };
export const BUILDER_PUZZLES = daily("ayah-builder");
export const BUILDER_JOURNEY = { perChapter: 8, dir: "/games/ayah-builder/journey" };
export const CONNECTIONS_PUZZLES = daily("islamic-connections");
export const CONNECTIONS_JOURNEY = { levels: 60, perChapter: 10, file: "/games/islamic-connections/journey.json" };
export const CROSSWORD_PUZZLES = daily("islamic-crossword");
export const CROSSWORD_LEVELS = { levels: 48, perChapter: 8, file: "/games/islamic-crossword/levels.json" };
export const MEMORIZATION_DIR = "/games/quran-memorization-test";
export const VOCABULARY_FILE = "public/games/quran-vocabulary/words.json";
// Example verses ship one file per chapter, fetched when the player reaches it.
export const VOCABULARY = { words: 300, perLevel: 5, perChapter: 10, verses: "/games/quran-vocabulary/verses" };

