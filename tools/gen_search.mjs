// Writes public/search-index.json, the one file the search page downloads (lazily, only when someone searches).
// A static file rather than a route, so it works the same under `next build` (export) and the vinext worker.
import "./ts-hooks.mjs";
import fs from "node:fs";
import path from "node:path";

const { getArticles } = await import("../lib/articles.ts");
const { getCards, getSurahs, getTranslation, surahSlug } = await import("../lib/data.ts");
const { GAMES, gameHref } = await import("../lib/games.ts");
const { getNames, nameHref } = await import("../lib/names.ts");
const { getSummaries } = await import("../lib/q30.ts");
const { dayHref } = await import("../lib/q30-types.ts");
const { surahAliases, surahMeaning } = await import("../lib/surah-meta.ts");
const { getTimeline } = await import("../lib/timeline.ts");

const clip = (s, n = 160) => {
  const t = String(s ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, t.lastIndexOf(" ", n))}…` : t;
};

const surahs = getSurahs();
const titles = {};
for (const s of surahs) for (const c of getCards(s.id)) titles[`${s.id}:${c.ayah}`] = c.title;

const tl = getTimeline();
const pages = [
  ...getNames().map((n) => ["Name of Allah", `${n.transliteration} · ${n.meaning}`, clip(n.description), nameHref(n)]),
  ...getArticles().map((a) => ["Article", a.title, clip(a.description), `/learn/${a.slug}`]),
  ...getSummaries().map((d) => ["Quran in 30 Days", `Day ${d.day}: ${d.title}`, clip(d.summary), dayHref(d.day)]),
  ...tl.prophets.map((p) => ["Prophet", `Prophet ${p.name}`, clip(p.line), `/timeline/prophets/${p.id}`]),
  ...tl.villains.map((v) => ["Timeline", `${v.name}, ${v.title}`, clip(v.deed), `/timeline/villains/${v.id}`]),
  ...tl.stops.map((s) => ["Timeline", s.title, clip(s.what), `/timeline/${s.id}`]),
  ...GAMES.map((g) => ["Game", g.name, clip(g.tagline), gameHref(g)]),
];

const index = {
  surahs: surahs.map((s) => [surahSlug(s), s.transliteration, s.name, surahMeaning(s.id), s.total_verses, surahAliases(s.id)]),
  verses: surahs.map((s) => s.verses.map((v) => getTranslation(`${s.id}:${v.id}`))),
  titles,
  pages,
};

const out = path.join(import.meta.dirname, "..", "public", "search-index.json");
fs.writeFileSync(out, JSON.stringify(index));
console.log(`search index: ${index.verses.flat().length} verses, ${pages.length} pages, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
