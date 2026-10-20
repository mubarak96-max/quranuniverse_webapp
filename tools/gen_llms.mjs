// Writes public/llms.txt (llmstxt.org), a plain map of the site for AI assistants.
// It is a static file because Workers have no filesystem and vinext does not prerender route handlers.
// Runs before every build (see package.json); Node strips the TypeScript types from the lib imports.
import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "../lib/markdown.ts";
import { SITE, absUrl } from "../lib/site.ts";
import { surahTitle } from "../lib/surah-meta.ts";

const root = path.join(import.meta.dirname, "..");
const slug = (t) => t.toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const surahs = JSON.parse(fs.readFileSync(path.join(root, "quran.json"), "utf8"));
const dir = path.join(root, "content", "articles");
const articles = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => ({ slug: f.slice(0, -3), ...parseFrontmatter(fs.readFileSync(path.join(dir, f), "utf8")).data }));

const lines = [
  `# ${SITE.name}`,
  "",
  `> ${SITE.description}`,
  "",
  "Quran Universe is written for Muslims who want to understand what they recite and for non-Muslims exploring Islam. " +
    "Each verse page has the Arabic text, the Sahih International English translation, transliteration, word-by-word meaning, " +
    "a plain-English card (historical setting, modern relevance, one practical step) and the full Tafsir Ibn Kathir.",
  "",
  `Verse URLs follow ${absUrl("/surah/<surah-slug>/<verse-number>")}, for example ${absUrl("/surah/al-baqarah/255")} for Ayat al-Kursi (2:255).`,
  "",
  "## Guides",
  "",
  ...articles.map((a) => `- [${a.title}](${absUrl(`/learn/${a.slug}`)}): ${a.description}`),
  "",
  "## Surahs",
  "",
  ...surahs.map(
    (s) =>
      `- [${s.id}. ${surahTitle(s.id, s.transliteration)}](${absUrl(`/surah/${slug(s.transliteration)}`)}): ` +
      `${s.type === "meccan" ? "Makkan" : "Madinan"}, ${s.total_verses} verses`,
  ),
  "",
  "## About",
  "",
  `- [About](${absUrl("/about")})`,
  `- [Disclaimer](${absUrl("/disclaimer")}): cards are simplified reflections, not religious rulings`,
  `- [Privacy policy](${absUrl("/privacy")})`,
  `- [Terms of use](${absUrl("/terms")})`,
  "",
];
fs.writeFileSync(path.join(root, "public", "llms.txt"), lines.join("\n"));
console.log(`llms.txt: ${articles.length} guides, ${surahs.length} surahs`);
