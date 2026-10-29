// Writes the static puzzle files the games fetch at runtime (public/games/...).
// Output is deterministic: fixed seeds mean a rebuild never reshuffles puzzles players have already seen.
import fs from "node:fs";
import path from "node:path";
import { gloss, plain, words } from "../lib/arabic.ts";
import {
  BUILDER_JOURNEY,
  BUILDER_PUZZLES,
  CONNECTIONS_JOURNEY,
  CONNECTIONS_PUZZLES,
  CROSSWORD_LEVELS,
  CROSSWORD_PUZZLES,
  MEMORIZATION_DIR,
  SURAH_JOURNEY,
  SURAH_PUZZLES,
  VOCABULARY,
  VOCABULARY_FILE,
} from "../lib/games.ts";

const root = path.join(import.meta.dirname, "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const surahs = read("quran.json");
const sahih = read("en.sahih.json");
const translit = read("en.transliteration.json");
const wbw = read("colored-english-wbw-translation.json");

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pick = (list, rand) => list[Math.floor(rand() * list.length)];
const en = (s, v) => sahih[`${s}:${v}`].text;

// Word-by-word glosses paired with Arabic words. Ten verses where the two sources split words
// differently return null and are left out of the word games.
function pairs(s, v) {
  const ar = words(surahs[s - 1].verses[v - 1].text);
  const out = ar.map((w, i) => [w, wbw[`${s}:${v}:${i + 1}`]]);
  return wbw[`${s}:${v}:${ar.length + 1}`] === undefined && out.every((p) => p[1] !== undefined)
    ? out.map(([w, g]) => [w, gloss(g)])
    : null;
}

function writeDaily(schedule, list) {
  const out = path.join(root, "public", schedule.dir);
  fs.mkdirSync(out, { recursive: true });
  const days = list.slice(0, schedule.days);
  for (let c = 0; c * schedule.chunk < days.length; c++) {
    fs.writeFileSync(path.join(out, `${c}.json`), JSON.stringify(days.slice(c * schedule.chunk, (c + 1) * schedule.chunk)));
  }
  return days.length;
}

// Every surah appears once per 114-day cycle, so short Makkan surahs get as many days as al-Baqarah.
function surahCycle(rand, count, choose) {
  const days = [];
  while (days.length < count) {
    for (const s of shuffle(surahs, rand)) {
      const day = choose(s);
      if (day) days.push(day);
    }
  }
  return days;
}

function guessTheSurah() {
  const rand = mulberry32(114);
  // Very short verses give too little to reason from and very long ones fill the screen.
  const fits = (t) => t.length >= 70 && t.length <= 320;
  const days = surahCycle(rand, SURAH_PUZZLES.days, (s) => {
    const pool = s.verses.filter((v) => fits(en(s.id, v.id)));
    const v = pool.length > 0 ? pick(pool, rand) : s.verses.reduce((a, b) => (en(s.id, b.id).length > en(s.id, a.id).length ? b : a));
    return { ...surahVerse(s.id, v.id), tr: translit[`${s.id}:${v.id}`].text.replace(/<[^>]+>/g, "") };
  });
  return `${writeDaily(SURAH_PUZZLES, days)} puzzles, ${surahJourney()} journey levels`;
}

// Standard starting verse of each of the thirty juz.
const JUZ = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];
const juzOf = (s, a) => JUZ.reduce((j, [js, ja], i) => (s > js || (s === js && a >= ja) ? i + 1 : j), 1);

// A guess-the-surah verse with what the hints need: its juz and a neighbouring verse.
function surahVerse(s, a) {
  const total = surahs[s - 1].total_verses;
  const nb = a > 1 ? a - 1 : total > 1 ? a + 1 : null;
  return { s, a, en: en(s, a), ar: surahs[s - 1].verses[a - 1].text, j: juzOf(s, a), nb: nb && { a: nb, en: en(s, nb) } };
}

// Verses many Muslims know by heart or hear in every khutbah; the early chapters lean on them.
const FAMOUS_VERSES = [
  "1:2", "1:5", "1:6", "2:2", "2:45", "2:152", "2:153", "2:183", "2:186", "2:201", "2:255", "2:256", "2:285",
  "2:286", "3:8", "3:26", "3:31", "3:103", "3:139", "3:185", "3:190", "4:1", "5:3", "6:162", "7:23", "9:51",
  "13:11", "13:28", "14:7", "16:90", "17:23", "17:24", "17:80", "18:10", "18:109", "20:25", "20:114", "21:35",
  "21:87", "23:1", "24:35", "25:63", "29:45", "31:13", "33:21", "33:56", "36:82", "39:53", "40:60", "49:10",
  "49:13", "50:16", "51:56", "55:13", "55:26", "59:22", "59:24", "62:9", "65:3", "67:2", "94:5", "103:2",
];
const famous = new Set(FAMOUS_VERSES);

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const STORIES = [7, 10, 11, 12, 14, 18, 19, 20, 21, 26, 27, 28, 37, 38, 71];

// Each chapter widens the pool and lengthens the verses: Juz Amma first, the whole Quran last.
const JOURNEY_CHAPTERS = [
  { surahs: [1, ...range(93, 114)], per: 3, max: 200, famousOnly: false },
  { surahs: [1, ...range(78, 114)], per: 3, max: 240, famousOnly: false, withFamous: true },
  { surahs: [12, 18, 19, 36, 55, 56, 67, ...range(67, 114)], per: 4, max: 280, withFamous: true },
  { surahs: [...STORIES, ...range(50, 114)], per: 4, max: 300 },
  { surahs: range(1, 114), per: 5, max: 300 },
  { surahs: range(1, 114), per: 5, max: 320, skipFamous: true },
];

function surahJourney() {
  const rand = mulberry32(6236);
  const used = new Set();
  const dir = path.join(root, "public", SURAH_JOURNEY.dir);
  fs.mkdirSync(dir, { recursive: true });
  let count = 0;
  JOURNEY_CHAPTERS.forEach((ch, c) => {
    const ok = (key) => {
      const [s, a] = key.split(":").map(Number);
      const t = en(s, a);
      return !used.has(key) && t.length >= 30 && t.length <= ch.max && !(ch.skipFamous && famous.has(key));
    };
    const keys = [...new Set(ch.surahs)].flatMap((s) => range(1, surahs[s - 1].total_verses).map((a) => `${s}:${a}`));
    const pool = shuffle(keys.filter(ok), rand);
    const extra = ch.withFamous ? shuffle(FAMOUS_VERSES.filter(ok), rand) : [];
    const levels = [];
    for (let l = 0; l < SURAH_JOURNEY.perChapter; l++) {
      const level = [];
      // Famous verses take every other slot when the chapter mixes them in, so the step up stays gentle.
      const sources = extra.length > 0 && l % 2 === 0 ? [extra, pool] : [pool, extra];
      for (const source of sources) {
        for (let i = 0; i < source.length && level.length < ch.per; i++) {
          const [s, a] = source[i].split(":").map(Number);
          if (used.has(source[i]) || level.some((v) => v.s === s)) continue;
          used.add(source[i]);
          level.push(surahVerse(s, a));
          if (source === extra) break;
        }
      }
      levels.push(level);
      count++;
    }
    fs.writeFileSync(path.join(dir, `${c}.json`), JSON.stringify(levels));
  });
  return count;
}

function ayahBuilder() {
  const rand = mulberry32(7);
  const days = surahCycle(rand, BUILDER_PUZZLES.days, (s) => {
    const pool = s.verses.map((v) => [v, pairs(s.id, v.id)]).filter(([, p]) => p && p.length >= 4 && p.length <= 9);
    if (pool.length === 0) return null;
    const [v, p] = pick(pool, rand);
    return { s: s.id, a: v.id, en: en(s.id, v.id), w: p };
  });
  return writeDaily(BUILDER_PUZZLES, days);
}

// Verses people ask Allah with, for the Ayah Builder "Supplications" chapter. Long ones drop out by length.
const BUILDER_DUAS = [
  "2:201", "2:250", "3:8", "3:16", "3:147", "3:193", "7:23", "7:126", "10:85", "14:40", "14:41", "17:24", "17:80",
  "18:10", "20:25", "20:26", "20:27", "20:28", "20:114", "21:83", "21:87", "21:89", "23:29", "23:97", "23:98",
  "23:118", "25:65", "25:74", "26:83", "26:85", "27:19", "28:16", "28:21", "28:24", "29:30", "37:100", "44:12",
  "60:4", "60:5", "66:8", "71:28", "2:152", "2:153", "2:156", "13:28", "94:5", "94:6", "3:139", "14:7", "50:16",
];

// The Ayah Builder journey: chapters of levels, easiest first. Each chapter draws from its own verses,
// and within a chapter verses get longer as the levels go on.
function ayahJourney() {
  const rand = mulberry32(21);
  const used = new Set();
  const verse = (s, a) => {
    const w = pairs(s, a);
    return w && { s, a, en: en(s, a), w };
  };
  const fresh = (v) => v && !used.has(`${v.s}:${v.a}`);
  const from = (ids, min, max) =>
    ids.flatMap((s) => surahs[s - 1].verses.map((v) => verse(s, v.id))).filter((v) => fresh(v) && v.w.length >= min && v.w.length <= max);
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const all = range(1, 114);

  const chapters = [
    // In recitation order: the Fatihah, then the last surahs everyone knows by heart.
    { per: 3, inOrder: true, pool: () => from([1, 112, 113, 114, 108], 2, 9) },
    { per: 4, pool: () => from(range(78, 111), 3, 7) },
    { per: 4, pool: () => BUILDER_DUAS.map((k) => verse(...k.split(":").map(Number))).filter((v) => fresh(v) && v.w.length <= 16) },
    { per: 4, pool: () => from(all, 6, 9) },
    { per: 4, pool: () => from(all, 9, 12) },
    { per: 4, pool: () => from(all, 12, 15) },
  ];

  const dir = path.join(root, "public", BUILDER_JOURNEY.dir);
  fs.mkdirSync(dir, { recursive: true });
  const counts = chapters.map((ch, c) => {
    const n = ch.per * BUILDER_JOURNEY.perChapter;
    const verses = ch.inOrder
      ? ch.pool().slice(0, n)
      : shuffle(ch.pool(), rand)
          .slice(0, n)
          .sort((x, y) => x.w.length - y.w.length);
    for (const v of verses) used.add(`${v.s}:${v.a}`);
    const levels = [];
    for (let i = 0; i + ch.per <= verses.length; i += ch.per) levels.push(verses.slice(i, i + ch.per));
    fs.writeFileSync(path.join(dir, `${c}.json`), JSON.stringify(levels));
    return levels.length;
  });
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify(counts));
  return counts.join("+");
}

function memorization() {
  const out = path.join(root, "public", MEMORIZATION_DIR);
  fs.mkdirSync(out, { recursive: true });
  for (const s of surahs) {
    const verses = s.verses.map((v) => ({ w: words(v.text), en: en(s.id, v.id) }));
    fs.writeFileSync(path.join(out, `${s.id}.json`), JSON.stringify(verses));
  }
  return surahs.length;
}

function vocabulary() {
  const forms = new Map();
  let total = 0;
  for (const s of surahs) {
    for (const v of s.verses) {
      for (const [w, g] of pairs(s.id, v.id) ?? []) {
        total++;
        const key = plain(w);
        const e = forms.get(key) ?? { key, n: 0, glosses: new Map(), spellings: new Map(), at: `${s.id}:${v.id}`, uses: [] };
        e.n++;
        e.glosses.set(g, (e.glosses.get(g) ?? 0) + 1);
        const bare = w.replace(/\s.*/, "");
        e.spellings.set(bare, (e.spellings.get(bare) ?? 0) + 1);
        if (e.uses.at(-1)?.[1] !== v.id || e.uses.at(-1)?.[0] !== s.id) e.uses.push([s.id, v.id]);
        forms.set(key, e);
      }
    }
  }
  const top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
  // "And not" at the start of a verse and "and not" mid-verse are one gloss; keep the lower-case form.
  // Only the first letter is folded, so "Lord" and "We" keep their capitals.
  const lower = (g) => g.charAt(0).toLowerCase() + g.slice(1);
  const topGloss = (m) => {
    const folded = new Map();
    for (const [g, n] of m) folded.set(lower(g), (folded.get(lower(g)) ?? 0) + n);
    const key = top(folded);
    return [...m.keys()].includes(key) ? key : [...m.keys()].find((g) => lower(g) === key);
  };
  // "(of) Allah" and "Allah" are one meaning; the bracketed helper words come from English grammar, not the Arabic.
  const meaning = (g) => g.replace(/^\([^)]*\)\s*/, "").replace(/\s*\([^)]*\)$/, "").replace(/,(\S)/g, ", $1");
  const ranked = [...forms.values()].sort((a, b) => b.n - a.n).slice(0, VOCABULARY.words);
  const list = ranked.map((e) => ({
    ar: top(e.spellings),
    en: VOCABULARY_FIXES[top(e.spellings)] ?? meaning(topGloss(e.glosses)),
    n: e.n,
    at: e.at,
  }));

  // Levels take words in frequency order, but two words with one meaning never share a level,
  // or a matching round would have two right answers.
  const levels = [];
  for (let queue = list.map((_, i) => i); queue.length > 0; ) {
    const level = [];
    const rest = [];
    for (const i of queue) {
      const taken = level.length >= VOCABULARY.perLevel || level.some((j) => list[j].en.toLowerCase() === list[i].en.toLowerCase());
      (taken ? rest : level).push(i);
    }
    levels.push(level);
    queue = rest;
  }

  // Up to three example verses per word, from different surahs, short enough to read at a glance.
  // Unvowelled spellings merge different words (مِن "from" and مَن "whom"), so a position counts only
  // where the verse's own gloss carries the meaning being taught. Words with no such verse get none.
  const verse = (word, s, a) => {
    const p = pairs(s, a);
    const g = p.map(([, gl]) => meaning(gl));
    const hit = g.flatMap((gl, i) => (gl.toLowerCase() === word.en.toLowerCase() ? [i] : []));
    return { s, a, w: p.map(([w]) => w), g, en: en(s, a), hit };
  };
  const examples = ranked.map((e, i) => {
    const fits = e.uses
      .filter(([s, a]) => pairs(s, a))
      .map(([s, a]) => verse(list[i], s, a))
      .filter((v) => v.hit.length > 0 && v.w.length >= 4 && v.w.length <= 14 && v.en.length <= 240)
      .sort((x, y) => Math.abs(x.w.length - 8) - Math.abs(y.w.length - 8) || x.s - y.s || x.a - y.a);
    const chosen = [];
    for (const v of fits) {
      if (chosen.length < 3 && !chosen.some((c) => c.s === v.s)) chosen.push(v);
    }
    return chosen;
  });
  const bare = list.filter((_, i) => examples[i].length === 0).map((w) => w.ar);
  if (bare.length > 0) console.log(`  vocabulary words without an example verse: ${bare.join(" ")}`);

  const dir = path.join(root, "public", VOCABULARY.verses);
  fs.mkdirSync(dir, { recursive: true });
  const perChapter = VOCABULARY.perChapter;
  for (let c = 0; c * perChapter < levels.length; c++) {
    const chapter = {};
    for (const level of levels.slice(c * perChapter, (c + 1) * perChapter)) for (const i of level) chapter[i] = examples[i];
    fs.writeFileSync(path.join(dir, `${c}.json`), JSON.stringify(chapter));
  }

  const file = path.join(root, VOCABULARY_FILE);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ total, words: list, levels }));
  return `${list.length} words in ${levels.length} levels`;
}

// Word-by-word glosses that describe a different use of the form than the one a learner meets most.
const VOCABULARY_FIXES = {
  "كَانَ": "was",
  "كُتِبَ": "is prescribed",
  "هَلۡ": "is? (question)",
  "ٱلۡمَوۡتُ": "death",
  "عَمَّا": "about what",
};

// Groups that are true by the text itself, so they need no hand-checked list.
function surahGroups() {
  // Opening letters carry a maddah sign; without that check "alam" (did We not) reads as Alif Lam Mim.
  const opens = (key, letters = false) =>
    surahs
      .filter((s) => {
        const first = words(s.verses[0].text)[0];
        return plain(first) === key && (!letters || first.includes("ٓ"));
      })
      .map((s) => s.transliteration);
  const qul = opens("قل");
  const haMim = opens("حم", true);
  const alifLamMim = opens("الم", true);
  const three = surahs.filter((s) => s.total_verses === 3).map((s) => s.transliteration);
  return [
    { name: "Surahs that begin with Qul (Say)", level: 3, items: qul, why: `${qul.length} surahs open with the command Qul, Say.`, ref: "112:1" },
    {
      name: "Surahs that begin with Ha Mim",
      level: 4,
      items: haMim,
      why: `${haMim.length} surahs in a row, from ${haMim[0]} to ${haMim.at(-1)}, open with the letters Ha Mim.`,
      ref: "40:1",
    },
    {
      name: "Surahs that begin with Alif Lam Mim",
      level: 4,
      items: alifLamMim,
      why: `${alifLamMim.length} surahs open with the letters Alif Lam Mim, the first of them ${alifLamMim[0]}.`,
      ref: "2:1",
    },
    { name: "Surahs with only three verses", level: 3, items: three, why: "The shortest surahs in the Quran, three verses each." },
  ];
}

const fitsGroup = (item, g) => g.items.includes(item) || (g.also ?? []).includes(item);

// Ways the shown tiles split into the shown groups, counted up to two. A fair board has exactly one,
// which still allows a red herring: a tile that fits two groups, where only one split uses every tile.
function connectionSplits(groups, tiles, size) {
  let count = 0;
  const walk = (gi, left) => {
    if (count > 1) return;
    if (gi === groups.length) {
      if (left.length === 0) count++;
      return;
    }
    const fit = left.filter((t) => fitsGroup(t, groups[gi]));
    const choose = (from, picked) => {
      if (picked.length === size) return walk(gi + 1, left.filter((t) => !picked.includes(t)));
      for (let i = from; i < fit.length; i++) choose(i + 1, [...picked, fit[i]]);
    };
    choose(0, []);
  };
  walk(0, tiles);
  return count;
}

// One group per entry of the ladder, `size` tiles each, with a red-herring count inside [min, max].
// Groups used on recent boards sit out so neighbouring levels do not repeat themselves.
function connectionPuzzle(groups, rand, ladder, size, [min, max], recent) {
  const linked = (a, b) => [...a.items, ...(a.also ?? [])].some((t) => fitsGroup(t, b)) || b.items.some((t) => fitsGroup(t, a));
  for (let tries = 0; tries < 50000; tries++) {
    const chosen = [];
    for (const level of ladder) {
      const open = groups.filter((g) => g.level === level && g.items.length >= size && !recent.includes(g.name) && !chosen.includes(g));
      const tied = open.filter((g) => chosen.some((c) => linked(c, g)));
      chosen.push(pick(min > 0 && tied.length > 0 && rand() < 0.8 ? tied : open, rand));
    }
    const shown = chosen.map((g) => shuffle(g.items, rand).slice(0, size));
    const tiles = shown.flat();
    if (new Set(tiles).size < tiles.length) continue;
    const herrings = tiles.filter((t) => chosen.filter((g) => fitsGroup(t, g)).length > 1).length;
    if (herrings < min || herrings > max || connectionSplits(chosen, tiles, size) !== 1) continue;
    return chosen.map((g, i) => ({ name: g.name, level: g.level, items: shown[i], why: g.why, ...(g.ref && { ref: g.ref }) }));
  }
  throw new Error(`connections: no fair board for ladder ${ladder} with ${min}-${max} red herrings`);
}

// The journey eases in with three groups of three, grows to four groups of four,
// then adds red herrings: tiles that seem to fit two groups.
function connectionStage(level) {
  if (level < 5) return [[1, 1, 1], 3, [0, 0]];
  if (level < 10) return [[1, 1, 2], 3, [0, 0]];
  if (level < 15) return [[1, 2, 2], 4, [0, 0]];
  if (level < 20) return [[1, 2, 3], 4, [0, 0]];
  if (level < 30) return [[1, 2, 3, 4], 4, [0, 0]];
  if (level < 45) return [[1, 2, 3, 4], 4, [1, 2]];
  return [[2, 3, 4, 4], 4, [2, 4]];
}

function connections() {
  const groups = [...read("content/games/connections.json"), ...surahGroups()];
  for (const g of groups) if (!g.why) throw new Error(`connections: group "${g.name}" has no why line`);

  const rand = mulberry32(16);
  const days = [];
  while (days.length < CONNECTIONS_PUZZLES.days) {
    const recent = days.slice(-2).flat().map((g) => g.name);
    days.push(connectionPuzzle(groups, rand, [1, 2, 3, 4], 4, [0, 2], recent));
  }

  const journeyRand = mulberry32(61);
  const levels = [];
  for (let l = 0; l < CONNECTIONS_JOURNEY.levels; l++) {
    const [ladder, size, herrings] = connectionStage(l);
    levels.push(connectionPuzzle(groups, journeyRand, ladder, size, herrings, levels.slice(-3).flat().map((g) => g.name)));
  }
  const file = path.join(root, "public", CONNECTIONS_JOURNEY.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(levels));

  for (const g of surahGroups()) console.log(`  ${g.name}: ${g.items.join(", ")}`);
  return `${writeDaily(CONNECTIONS_PUZZLES, days)} puzzles, ${levels.length} journey levels`;
}

// Greedy crossword fill: each new word must cross the grid and may not touch other words side by side.
function crosswordGrid(entries, rand, size = 13, want = 12) {
  const grid = new Map();
  const at = (r, c) => grid.get(`${r},${c}`);
  const placed = [];

  function fit(word, r, c, dir) {
    const [dr, dc] = dir === "across" ? [0, 1] : [1, 0];
    if (at(r - dr, c - dc) || at(r + dr * word.length, c + dc * word.length)) return -1;
    let crosses = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = r + dr * i;
      const cc = c + dc * i;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) return -1;
      const cell = at(rr, cc);
      if (cell) {
        if (cell !== word[i]) return -1;
        crosses++;
      } else if (at(rr + dc, cc + dr) || at(rr - dc, cc - dr)) {
        return -1;
      }
    }
    return crosses === word.length ? -1 : crosses;
  }

  function place(e, r, c, dir) {
    const [dr, dc] = dir === "across" ? [0, 1] : [1, 0];
    for (let i = 0; i < e.word.length; i++) grid.set(`${r + dr * i},${c + dc * i}`, e.word[i]);
    placed.push({ ...e, r, c, dir });
  }

  const pool = shuffle(entries, rand);
  const first = pool.find((e) => e.word.length >= 6 && e.word.length <= size);
  place(first, Math.floor(size / 2), Math.floor((size - first.word.length) / 2), "across");
  for (const e of pool) {
    if (placed.length >= want) break;
    if (placed.some((p) => p.word === e.word) || e.word.length > size) continue;
    let best = null;
    for (const p of placed) {
      for (let i = 0; i < p.word.length; i++) {
        for (let j = 0; j < e.word.length; j++) {
          if (p.word[i] !== e.word[j]) continue;
          const dir = p.dir === "across" ? "down" : "across";
          const r = p.dir === "across" ? p.r - j : p.r + i;
          const c = p.dir === "across" ? p.c + i : p.c - j;
          const score = fit(e.word, r, c, dir);
          if (score > 0 && (!best || score > best.score)) best = { r, c, dir, score };
        }
      }
    }
    if (best) place(e, best.r, best.c, best.dir);
  }

  // Crop to the used area and number the starts in reading order.
  const rows = placed.flatMap((p) => [p.r, p.dir === "down" ? p.r + p.word.length - 1 : p.r]);
  const cols = placed.flatMap((p) => [p.c, p.dir === "across" ? p.c + p.word.length - 1 : p.c]);
  const r0 = Math.min(...rows);
  const c0 = Math.min(...cols);
  const starts = [...new Set(placed.map((p) => `${p.r - r0},${p.c - c0}`))].sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return ar - br || ac - bc;
  });
  return {
    w: Math.max(...cols) - c0 + 1,
    h: Math.max(...rows) - r0 + 1,
    words: placed.map((p) => ({
      n: starts.indexOf(`${p.r - r0},${p.c - c0}`) + 1,
      r: p.r - r0,
      c: p.c - c0,
      d: p.dir === "across" ? "a" : "d",
      word: p.word,
      len: p.len,
      clue: p.clue,
      x: p.x,
    })),
  };
}

// Journey grids grow chapter by chapter: small grids of well-known answers first, harder clues and bigger grids later.
const CROSSWORD_TIERS = [
  { size: 7, want: 5, min: 4, hardest: 1 },
  { size: 8, want: 6, min: 5, hardest: 1 },
  { size: 9, want: 7, min: 6, hardest: 2 },
  { size: 10, want: 8, min: 7, hardest: 2 },
  { size: 11, want: 10, min: 8, hardest: 3 },
  { size: 13, want: 12, min: 10, hardest: 3 },
];

function crosswordJourney(entries) {
  const rand = mulberry32(31);
  const uses = new Map(entries.map((e) => [e.word, 0]));
  const levels = [];
  for (let l = 0; l < CROSSWORD_LEVELS.levels; l++) {
    const tier = CROSSWORD_TIERS[Math.floor(l / CROSSWORD_LEVELS.perChapter)];
    const fair = entries.filter((e) => e.d <= tier.hardest && e.word.length <= tier.size);
    // Fresh answers first, so a player meets as much of the clue bank as possible before repeats;
    // in the hard tiers the hardest clues lead.
    const rank = (e) => uses.get(e.word) * 4 - (tier.hardest === 3 ? e.d : 0);
    let best = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const pool = shuffle(fair, rand).sort((a, b) => rank(a) - rank(b)).slice(0, 60);
      const grid = crosswordGrid(pool, rand, tier.size, tier.want);
      if (grid.words.length < tier.min) continue;
      const cost = grid.words.reduce((n, w) => n + uses.get(w.word), 0) - grid.words.length;
      if (!best || cost < best.cost) best = { grid, cost };
    }
    for (const w of best.grid.words) uses.set(w.word, uses.get(w.word) + 1);
    levels.push(best.grid);
  }
  const file = path.join(root, "public", CROSSWORD_LEVELS.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(levels));
  const met = [...uses.values()].filter((n) => n > 0).length;
  return `${levels.length} levels using ${met} of ${entries.length} answers`;
}

function crossword() {
  const entries = read("content/games/crossword.json").map((e) => ({
    word: e.a.toUpperCase().replace(/[^A-Z]/g, ""),
    len: e.a.split(/\s+/).map((part) => part.replace(/[^A-Za-z]/g, "").length).join(","),
    clue: e.c,
    x: e.x,
    d: e.d,
  }));
  const rand = mulberry32(13);
  const days = [];
  while (days.length < CROSSWORD_PUZZLES.days) {
    const grid = crosswordGrid(entries, rand);
    if (grid.words.length >= 9) days.push(grid);
  }
  return `${writeDaily(CROSSWORD_PUZZLES, days)} daily puzzles, journey ${crosswordJourney(entries)}`;
}

console.log(`games: guess-the-surah ${guessTheSurah()}`);
console.log(`games: ayah-builder ${ayahBuilder()} puzzles, journey ${ayahJourney()} levels`);
console.log(`games: memorization ${memorization()} surahs`);
console.log(`games: vocabulary ${vocabulary()}`);
console.log(`games: connections ${connections()}`);
console.log(`games: crossword ${crossword()}`);
