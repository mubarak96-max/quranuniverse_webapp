// Search over public/search-index.json: word-start matching on every term, so "pray" finds "prayer" but "ant"
// does not find "want". Kept free of React so it can be tested from Node.
import type { SearchIndex } from "./search-types";

export type Prepared = {
  index: SearchIndex;
  // Normalized "translation + card title" per verse, in reading order.
  hay: { s: number; a: number; text: string }[];
};

export type VerseHit = { s: number; a: number; score: number };
export type PageHit = { kind: string; title: string; blurb: string; href: string; score: number };

const STOP = new Set(["the", "of", "and", "a", "an", "in", "to", "is", "on", "for", "about", "verse", "verses", "quran"]);

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’‘`ʿʾ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const fold = (s: string) => norm(s).replace(/\b(al|an|ar|as|at|ad|ash|az)\s/g, "").replace(/\s/g, "");
export const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Normalizes every verse once, right after the index downloads, so each keystroke only runs the regexes.
export function prepare(index: SearchIndex): Prepared {
  const hay: Prepared["hay"] = [];
  index.verses.forEach((vs, i) =>
    vs.forEach((t, j) => hay.push({ s: i + 1, a: j + 1, text: ` ${norm(`${t} ${index.titles[`${i + 1}:${j + 1}`] ?? ""}`)}` })),
  );
  return { index, hay };
}

export function terms(q: string): string[] {
  const all = norm(q).split(" ").filter(Boolean);
  const kept = all.filter((t) => !STOP.has(t));
  return kept.length ? kept : all;
}

// Sahih International writes English names ("Moses", "Paradise"); readers often type the Arabic ones.
const SAME = [
  ["musa", "moses"],
  ["ibrahim", "abraham"],
  ["isa", "jesus"],
  ["nuh", "noah"],
  ["yusuf", "joseph"],
  ["dawud", "dawood", "david"],
  ["sulayman", "sulaiman", "solomon"],
  ["yunus", "jonah"],
  ["ayyub", "job"],
  ["yaqub", "jacob"],
  ["ismail", "ishmael"],
  ["ishaq", "isaac"],
  ["harun", "haroon", "aaron"],
  ["idris", "enoch"],
  ["lut", "lot"],
  ["zakariya", "zakariyya", "zechariah"],
  ["yahya", "john"],
  ["maryam", "mary"],
  ["ilyas", "elias"],
  ["firawn", "firaun", "pharaoh"],
  ["iblis", "shaytan", "shaitan", "satan"],
  ["jannah", "paradise"],
  ["jahannam", "hellfire", "hell"],
  ["salah", "salat", "prayer"],
  ["zakat", "zakah"],
  ["sabr", "patience", "patient"],
  ["tawbah", "repentance", "repent"],
  ["dua", "supplication", "invoke"],
  ["rizq", "provision"],
  ["taqwa", "righteousness", "fear allah"],
  ["kursi", "throne"],
  ["makkah", "mecca", "makka"],
  ["madinah", "medina"],
];
const SAME_MAP = new Map(SAME.flatMap((group) => group.map((w) => [w, group] as const)));

// Light suffix trimming, so "patience" also finds "patient" and "parents" finds "parent". Never below 4 letters,
// which keeps short words ("ants", "isa") from turning into prefixes of half the dictionary.
function stem(t: string): string {
  if (t.length < 6) return t.replace(/(?<=\w{4})s$/, "");
  return t.replace(/(ience|iences|ance|ances|ence|ences|ings|ing|ies|es|ed|s)$/, "").replace(/^(.{0,3})$/, t);
}

// Every spelling a term may appear as; a verse matches the term if any of them starts a word.
export function alternatives(t: string): string[] {
  return [...new Set([t, ...(SAME_MAP.get(t) ?? [])].map(stem))];
}

export const termPattern = (t: string) => alternatives(t).map(esc).join("|");

export function run(p: Prepared, q: string) {
  const { index } = p;
  const ts = terms(q);
  const direct: { label: string; sub: string; href: string }[] = [];
  if (!ts.length) return { direct, pages: [] as PageHit[], verses: [] as VerseHit[] };

  // "2:255", "2 255", "2.255" jump straight to the verse; a bare number or a surah name to the surah.
  const ref = q.trim().match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (ref) {
    const [s, a] = [Number(ref[1]), Number(ref[2])];
    const surah = index.surahs[s - 1];
    if (surah && a >= 1 && a <= surah[4]) direct.push({ label: `${surah[1]} ${s}:${a}`, sub: index.verses[s - 1][a - 1], href: `/surah/${surah[0]}/${a}` });
  }
  const num = q.trim().match(/^\d{1,3}$/);
  const fq = fold(q);
  // Verses known by a name the translation never uses.
  if (/kursi|kursy/.test(fq)) direct.push({ label: "Ayat al-Kursi · Al-Baqarah 2:255", sub: index.verses[1][254], href: `/surah/${index.surahs[1][0]}/255` });
  index.surahs.forEach(([slug, tr, , meaning, count, aliases], i) => {
    const hit = num
      ? Number(num[0]) === i + 1
      : fq.length >= 3 && [tr, ...aliases].some((n) => fold(n).startsWith(fq) || (fq.length >= 5 && fold(n).includes(fq))) ||
        (fq.length >= 4 && fold(meaning) === fq);
    if (hit && direct.length < 6) direct.push({ label: `Surah ${tr}`, sub: `Surah ${i + 1} · ${meaning} · ${count} verses`, href: `/surah/${slug}` });
  });

  const res = ts.map((t) => new RegExp(`\\s(?:${termPattern(t)})`));
  const phrase = ts.length > 1 ? ` ${ts.join(" ")}` : null;

  const pages: PageHit[] = [];
  for (const [kind, title, blurb, href] of index.pages) {
    const nt = ` ${norm(title)}`;
    const nb = ` ${norm(blurb)}`;
    if (!res.every((r) => r.test(nt) || r.test(nb))) continue;
    const score = res.reduce((n, r) => n + (r.test(nt) ? 3 : 1), 0) + (phrase && nt.includes(phrase) ? 4 : 0);
    pages.push({ kind, title, blurb, href, score });
  }
  pages.sort((x, y) => y.score - x.score);

  const verses: VerseHit[] = [];
  for (const h of p.hay) {
    if (!res.every((r) => r.test(h.text))) continue;
    let score = phrase && h.text.includes(phrase) ? 5 : 0;
    const title = index.titles[`${h.s}:${h.a}`];
    if (title) {
      const nt = ` ${norm(title)}`;
      score += res.filter((r) => r.test(nt)).length * 2;
    }
    verses.push({ s: h.s, a: h.a, score });
  }
  verses.sort((x, y) => y.score - x.score || x.s - y.s || x.a - y.a);
  return { direct, pages, verses };
}
