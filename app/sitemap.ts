import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/articles";
import { getSurahs, surahHref } from "@/lib/data";
import { SITE, absUrl } from "@/lib/site";

const PAGES = ["about", "contact", "privacy", "terms", "disclaimer"];

export default function sitemap(): MetadataRoute.Sitemap {
  const at = (path: string, priority: number, lastModified = SITE.updated) => ({ url: absUrl(path), lastModified, priority });
  const surahs = getSurahs();
  return [
    at("/", 1),
    at("/learn", 0.9),
    ...getArticles().map((a) => at(`/learn/${a.slug}`, 0.8, a.updated)),
    ...surahs.map((s) => at(surahHref(s.id), 0.9)),
    ...surahs.flatMap((s) => s.verses.map((v) => at(surahHref(s.id, v.id), 0.6))),
    ...PAGES.map((p) => at(`/${p}`, 0.3)),
  ];
}
