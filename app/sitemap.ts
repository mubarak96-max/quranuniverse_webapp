import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";
import { GAMES, gameHref } from "@/lib/games";
import { getSurahs, surahHref } from "@/lib/data";
import { getJourneyIds } from "@/lib/journey";
import { getNames, nameHref } from "@/lib/names";
import { getLibraryRefs, getTimeline } from "@/lib/timeline";
import { refHref } from "@/lib/timeline-types";
import { SITE, absUrl } from "@/lib/site";

export const dynamic = "force-static";

const PAGES = ["about", "contact", "privacy", "terms", "disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const at = (path: string, priority: number, lastModified = SITE.updated) => ({ url: absUrl(path), lastModified, priority });
  const surahs = getSurahs();
  return [
    at("/", 1),
    at("/learn", 0.9),
    at("/timeline", 0.9),
    ...getTimeline().stops.map((s) => at(`/timeline/${s.id}`, s.type === "chapter" ? 0.7 : 0.6)),
    ...getJourneyIds().map((id) => at(`/timeline/journey/${id}`, 0.8)),
    at("/timeline/villains", 0.8),
    ...getTimeline().villains.map((v) => at(`/timeline/villains/${v.id}`, 0.7)),
    ...getTimeline().prophets.map((p) => at(`/timeline/prophets/${p.id}`, 0.7)),
    at("/timeline/library", 0.8),
    ...getLibraryRefs().map((r) => at(refHref(r), 0.6)),
    at("/names", 0.9),
    ...getNames().map((n) => at(nameHref(n), 0.7)),
    at("/games", 0.8),
    ...GAMES.map((g) => at(gameHref(g), 0.8)),
    ...getArticles().map((a) => at(`/learn/${a.slug}`, 0.8, a.updated)),
    ...surahs.map((s) => at(surahHref(s.id), 0.9)),
    ...surahs.flatMap((s) => s.verses.map((v) => at(surahHref(s.id, v.id), 0.6))),
    ...PAGES.map((p) => at(`/${p}`, 0.3)),
  ];
}
