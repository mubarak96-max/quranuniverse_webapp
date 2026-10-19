import { getArticles } from "@/lib/articles";
import { getSurahs, surahHref } from "@/lib/data";
import { SITE, absUrl } from "@/lib/site";
import { surahTitle } from "@/lib/surah-meta";

export const dynamic = "force-static";

// llms.txt (llmstxt.org): a plain map of the site for AI assistants that read it.
export function GET() {
  const surahs = getSurahs();
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Quran Universe is written for Muslims who want to understand what they recite and for non-Muslims exploring Islam. " +
      "Each verse page has the Arabic text, the Sahih International English translation, transliteration, word-by-word meaning, " +
      "a plain-English card (historical setting, modern relevance, one practical step) and the full Tafsir Ibn Kathir.",
    "",
    `Verse URLs follow ${absUrl("/surah/<surah-slug>/<verse-number>")}, for example ${absUrl(surahHref(2, 255))} for Ayat al-Kursi (2:255).`,
    "",
    "## Guides",
    "",
    ...getArticles().map((a) => `- [${a.title}](${absUrl(`/learn/${a.slug}`)}): ${a.description}`),
    "",
    "## Surahs",
    "",
    ...surahs.map(
      (s) =>
        `- [${s.id}. ${surahTitle(s.id, s.transliteration)}](${absUrl(surahHref(s.id))}): ` +
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
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
