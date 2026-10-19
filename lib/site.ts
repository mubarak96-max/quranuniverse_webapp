// One place for the site identity used by metadata, JSON-LD, sitemap and legal pages.
export const SITE = {
  name: "Quran Universe",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://quranuniverse.app").replace(/\/$/, ""),
  email: "mubarakmmm5@gmail.com",
  tagline: "Understand every verse of the Quran",
  description:
    "Read all 114 surahs of the Quran in Arabic with English translation, transliteration, word-by-word meaning and Tafsir Ibn Kathir, plus a simple card that explains every verse.",
  updated: "2026-10-20",
};

export const absUrl = (path = "/") => `${SITE.url}${path === "/" ? "" : path}`;

export const organization = {
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.name,
  url: SITE.url,
  logo: absUrl("/apple-icon.png"),
  email: SITE.email,
};

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  };
}
