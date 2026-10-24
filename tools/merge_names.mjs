// Merges names1.json (Arabic, English meaning, description, verses) with names2.json
// (cleaner transliteration, Arabic explanation) into content/names.json, in names1 order.
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const one = read("names1.json").data;
const two = new Map(read("names2.json").map((n) => [n.id, n]));
const quran = read("quran.json");

// Source fixes: #50's English description is in French, and 48/65 share "Al-Majid" in names2.
const TRANSLIT = { 48: "Al-Majeed", 65: "Al-Majid" };
const DESC = { 50: "The Witness, the One from whom nothing is absent." };
const MEANING = {
  "The Maginificent": "The Magnificent",
  "The Inhertior": "The Inheritor",
  "The Owner / Soverign of All": "The Owner / Sovereign of All",
  "The Guide to Repentence": "The Guide to Repentance",
  "The inspirer of faith": "The Inspirer of Faith",
  "The Forebearing": "The Forbearing",
};

const clean = (s) =>
  s
    .replace(/\\"/g, '"')
    .replace(/\}/g, "")
    .replace(/\bKoran\b/g, "Quran")
    .replace(/\bFrench words\b/g, "English words")
    .replace(/\s+/g, " ")
    .trim();

const slug = (t) => t.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function verses(found, num) {
  const refs = [...found.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].replace(/\s+/g, "")).filter(Boolean);
  return refs.map((ref) => {
    const [s, a] = ref.split(":");
    const [from, to] = a.split("-").map(Number);
    const surah = quran[Number(s) - 1];
    if (!surah || !surah.verses.some((v) => v.id === from)) throw new Error(`#${num}: bad verse ${ref}`);
    return to ? { surah: Number(s), ayah: from, to } : { surah: Number(s), ayah: from };
  });
}

const names = one.map((n) => {
  const b = two.get(n.number);
  const transliteration = TRANSLIT[n.number] ?? b.transliteration;
  return {
    number: n.number,
    slug: slug(transliteration),
    arabic: n.name.trim(),
    transliteration,
    meaning: MEANING[n.en.meaning] ?? n.en.meaning.trim(),
    description: DESC[n.number] ?? clean(n.en.desc),
    meaningAr: b.meaning_ar.trim(),
    verses: verses(n.found, n.number),
  };
});

const slugs = new Set(names.map((n) => n.slug));
if (slugs.size !== names.length) throw new Error("duplicate slugs");

fs.writeFileSync(path.join(root, "content", "names.json"), JSON.stringify(names, null, 2) + "\n");
console.log(`wrote ${names.length} names`);
