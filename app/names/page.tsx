import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { NameIndex } from "@/components/NameIndex";
import { getSurah, surahHref } from "@/lib/data";
import { getNames, nameHref } from "@/lib/names";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

const title = "The 99 Names of Allah (Asma ul Husna) with Meanings";
const description =
  "All 99 Beautiful Names of Allah in Arabic with transliteration and English meaning, each explained: what it tells you about Allah, how to trust Him with it and how to call on Him by it.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["99 names of allah", "asma ul husna", "names of allah meaning", "allah names in arabic"],
  alternates: { canonical: "/names" },
  openGraph: { type: "website", title, description, url: "/names", siteName: SITE.name },
};

export default function NamesPage() {
  const names = getNames();
  return (
    <div className="names-page">
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: title,
          description,
          url: absUrl("/names"),
          isPartOf: { "@id": `${SITE.url}/#website` },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Names of Allah", path: "/names" },
          ]),
        }}
      />
      <header className="names-head">
        <p className="title-ar" lang="ar" dir="rtl">
          الأسماء الحسنى
        </p>
        <h1>The 99 Names of Allah</h1>
        <blockquote>
          <p>&ldquo;And to Allah belong the best names, so invoke Him by them.&rdquo;</p>
          <Link href={surahHref(7, 180)}>{getSurah(7)!.transliteration} 7:180</Link>
        </blockquote>
      </header>
      <NameIndex
        names={names.map((n) => ({
          number: n.number,
          arabic: n.arabic,
          transliteration: n.transliteration,
          meaning: n.meaning,
          href: nameHref(n),
        }))}
      />
    </div>
  );
}
