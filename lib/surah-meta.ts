// English name meanings and the spellings people actually type into search engines.
// Spellings come from Ubersuggest research (e.g. "surah yaseen", "surah rehman", "surah e mulk").

export const SURAH_MEANINGS: string[] = [
  "The Opening", "The Cow", "The Family of Imran", "The Women", "The Table Spread", "The Cattle",
  "The Heights", "The Spoils of War", "The Repentance", "Jonah", "Hud", "Joseph", "The Thunder",
  "Abraham", "The Rocky Tract", "The Bee", "The Night Journey", "The Cave", "Mary", "Ta-Ha",
  "The Prophets", "The Pilgrimage", "The Believers", "The Light", "The Criterion", "The Poets",
  "The Ant", "The Stories", "The Spider", "The Romans", "Luqman", "The Prostration",
  "The Combined Forces", "Sheba", "The Originator", "Ya-Sin", "Those Who Set the Ranks", "Sad",
  "The Troops", "The Forgiver", "Explained in Detail", "The Consultation", "The Ornaments of Gold",
  "The Smoke", "The Crouching", "The Wind-Curved Sandhills", "Muhammad", "The Victory",
  "The Rooms", "Qaf", "The Winnowing Winds", "The Mount", "The Star", "The Moon",
  "The Most Merciful", "The Inevitable Event", "The Iron", "The Pleading Woman", "The Exile",
  "She That Is to Be Examined", "The Ranks", "The Congregation (Friday)", "The Hypocrites",
  "The Mutual Disillusion", "The Divorce", "The Prohibition", "The Sovereignty", "The Pen",
  "The Reality", "The Ascending Stairways", "Noah", "The Jinn", "The Enshrouded One",
  "The Cloaked One", "The Resurrection", "Man", "Those Sent Forth", "The Great News",
  "Those Who Drag Forth", "He Frowned", "The Overthrowing", "The Cleaving", "The Defrauding",
  "The Splitting Open", "The Mansions of the Stars", "The Nightcomer", "The Most High",
  "The Overwhelming", "The Dawn", "The City", "The Sun", "The Night", "The Morning Hours",
  "The Relief", "The Fig", "The Clinging Clot", "The Night of Power", "The Clear Proof",
  "The Earthquake", "The Courser", "The Calamity", "The Rivalry in World Increase",
  "The Declining Day", "The Traducer", "The Elephant", "Quraysh", "The Small Kindnesses",
  "The Abundance", "The Disbelievers", "The Divine Support", "The Palm Fiber", "The Sincerity",
  "The Daybreak", "Mankind",
];

const ALIASES: Record<number, string[]> = {
  1: ["Surah Fatiha", "Al-Fatiha", "Fatihah", "Umm al-Kitab"],
  2: ["Surah Baqarah", "Baqara", "Al-Baqara"],
  3: ["Surah Imran", "Al-Imran", "Aal-e-Imran"],
  4: ["Surah Nisa", "An-Nisaa"],
  5: ["Surah Maidah", "Al-Ma'idah"],
  6: ["Surah Anam", "Al-An'am"],
  7: ["Surah Araf", "Al-A'raf"],
  9: ["Surah Tawbah", "Surah Taubah", "Bara'ah"],
  12: ["Surah Yusuf", "Surah Yousuf"],
  17: ["Surah Isra", "Bani Isra'il"],
  18: ["Surah Kahf", "Surah Al Kahf", "Kahaf"],
  19: ["Surah Maryam", "Surah e Maryam"],
  20: ["Surah Taha", "Ta Ha"],
  24: ["Surah Nur", "Surah Noor"],
  31: ["Surah Luqman", "Lukman"],
  32: ["Surah Sajdah", "Sajda"],
  36: ["Surah Yasin", "Surah Yaseen", "Surah Yassin", "Ya Sin"],
  44: ["Surah Dukhan", "Ad-Dukhaan"],
  48: ["Surah Fath", "Fatah"],
  55: ["Surah Rahman", "Surah Rehman", "Ar-Rahmaan"],
  56: ["Surah Waqiah", "Surah Waqia", "Al-Waqi'ah"],
  59: ["Surah Hashr"],
  62: ["Surah Juma", "Surah Jumu'ah"],
  64: ["Surah Taghabun"],
  67: ["Surah Mulk", "Surah e Mulk", "Tabarak"],
  72: ["Surah Jin"],
  73: ["Surah Muzammil", "Al-Muzzammil"],
  78: ["Surah Naba", "Amma"],
  87: ["Surah Ala", "Al-A'la"],
  89: ["Surah Fajr"],
  93: ["Surah Duha", "Ad-Duha"],
  94: ["Surah Inshirah", "Alam Nashrah", "Ash-Sharh"],
  95: ["Surah Tin", "At-Teen"],
  96: ["Surah Alaq", "Surah Iqra"],
  97: ["Surah Qadr", "Laylatul Qadr surah", "Inna Anzalnahu"],
  99: ["Surah Zalzalah", "Zilzal"],
  100: ["Surah Adiyat"],
  101: ["Surah Qariah"],
  102: ["Surah Takathur"],
  103: ["Surah Asr"],
  105: ["Surah Fil", "Surah Feel"],
  106: ["Surah Quraish"],
  107: ["Surah Maun", "Al-Ma'un"],
  108: ["Surah Kawthar", "Surah Kausar", "Surah Kosar"],
  109: ["Surah Kafirun", "Kafiroon"],
  110: ["Surah Nasr"],
  111: ["Surah Lahab", "Al-Masad", "Tabbat"],
  112: ["Surah Ikhlas", "Qul Huwallahu Ahad"],
  113: ["Surah Falaq", "Qul A'udhu bi Rabbil Falaq"],
  114: ["Surah Nas", "Surah Naas"],
};

export const surahMeaning = (id: number) => SURAH_MEANINGS[id - 1];
export const surahAliases = (id: number) => ALIASES[id] ?? [];

const fold = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

// "Surah Al-Mulk (The Sovereignty)", but plain "Surah Ya-Sin" where the meaning is just the name again.
export function surahTitle(id: number, transliteration: string) {
  const meaning = surahMeaning(id);
  return fold(meaning) === fold(transliteration) ? `Surah ${transliteration}` : `Surah ${transliteration} (${meaning})`;
}
