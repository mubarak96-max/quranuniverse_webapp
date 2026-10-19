import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import {
  getCards,
  getSurah,
  getSurahBySlug,
  getSurahInfo,
  getSurahs,
  getTranslation,
  surahHref,
  surahSlug,
  type Surah,
} from "@/lib/data";
import { SITE, absUrl, breadcrumbs, organization } from "@/lib/site";
import { surahAliases, surahMeaning, surahTitle } from "@/lib/surah-meta";

type Params = Promise<{ name: string }>;

export function generateStaticParams() {
  return getSurahs().map((s) => ({ name: surahSlug(s) }));
}

const place = (s: Surah) => (s.type === "meccan" ? "Makkah" : "Madinah");

function describe(s: Surah) {
  const alias = surahAliases(s.id)[0];
  return (
    `Read Surah ${s.transliteration}${alias ? ` (${alias})` : ""}, surah ${s.id} of the Quran: ` +
    `${s.total_verses} ${s.type === "meccan" ? "Makkan" : "Madinan"} verses in Arabic with English translation, ` +
    `transliteration, word-by-word meaning and Tafsir Ibn Kathir.`
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const surah = getSurahBySlug((await params).name);
  if (!surah) return {};
  const t = surah.transliteration;
  const title = `${surahTitle(surah.id, t)}: English Translation & Tafsir`;
  const description = describe(surah);
  const url = surahHref(surah.id);
  return {
    title,
    description,
    keywords: [
      `surah ${t}`,
      ...surahAliases(surah.id),
      `surah ${t} in english`,
      `surah ${t} meaning`,
      `surah ${t} translation`,
      `surah ${t} tafsir`,
      `surah ${surah.id}`,
      surah.name,
    ],
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, siteName: SITE.name },
    twitter: { card: "summary", title, description },
  };
}

function surahJsonLd(s: Surah) {
  const url = absUrl(surahHref(s.id));
  const name = `Surah ${s.transliteration}`;
  return {
    "@graph": [
      {
        "@type": "Chapter",
        "@id": `${url}#chapter`,
        name,
        alternateName: [s.name, surahMeaning(s.id), ...surahAliases(s.id)],
        description: describe(s),
        url,
        position: s.id,
        inLanguage: ["ar", "en"],
        isAccessibleForFree: true,
        locationCreated: { "@type": "Place", name: place(s) },
        isPartOf: {
          "@type": "Book",
          name: "The Quran",
          alternateName: ["Al-Qur'an", "Koran", "القرآن"],
          inLanguage: "ar",
        },
        translator: { "@type": "Organization", name: "Sahih International" },
        publisher: { "@id": organization["@id"] },
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: `${surahTitle(s.id, s.transliteration)}: English Translation & Tafsir`,
        description: describe(s),
        inLanguage: "en",
        isPartOf: { "@id": `${SITE.url}/#website` },
        mainEntity: { "@id": `${url}#chapter` },
        breadcrumb: breadcrumbs([
          { name: "Surahs", path: "/" },
          { name, path: surahHref(s.id) },
        ]),
      },
    ],
  };
}

export default async function SurahPage({ params }: { params: Params }) {
  const { name } = await params;
  const surah = getSurahBySlug(name);
  if (!surah) {
    // Old numeric links (/surah/3) keep working.
    if (/^\d+$/.test(name) && getSurah(Number(name))) permanentRedirect(surahHref(Number(name)));
    notFound();
  }
  const id = surah.id;
  const cards = new Map(getCards(id).map((c) => [c.ayah, c]));

  // Every surah opens with the basmala except At-Tawbah; in Al-Fatihah it is verse 1 itself.
  const basmala = id !== 1 && id !== 9 ? getSurah(1)!.verses[0].text : null;

  return (
    <div className="reader">
      <JsonLd data={surahJsonLd(surah)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Surahs</Link>
        <span aria-hidden="true">/</span>
        <span>{surah.transliteration}</span>
      </nav>

      <header className="surah-head">
        <span className="ornament">
          <span>{surah.id}</span>
        </span>
        <p className="ar title-ar" lang="ar" dir="rtl">
          {surah.name}
        </p>
        <h1>{surah.transliteration}</h1>
        <p className="meta">
          {place(surah)} · {surah.total_verses} verses
        </p>
        <details className="drawer">
          <summary>About this surah</summary>
          <div className="prose" dangerouslySetInnerHTML={{ __html: getSurahInfo(id) }} />
        </details>
        {basmala && (
          <p className="ar bismillah" lang="ar" dir="rtl">
            {basmala}
          </p>
        )}
      </header>

      <ol className="verse-list">
        {surah.verses.map((v) => {
          const card = cards.get(v.id);
          const key = `${id}:${v.id}`;
          return (
            <li key={v.id}>
              <Link href={surahHref(id, v.id)} className="verse-row">
                <span className="vnum" aria-label={`Verse ${key}`}>
                  {key}
                </span>
                <span className="ar verse-ar" lang="ar" dir="rtl">
                  {v.text}
                </span>
                <span className="verse-en">{getTranslation(key)}</span>
                {card && (
                  <span className="teaser">
                    <span className="teaser-body">
                      <b>{card.title}</b>
                      <small>{card.subtitle}</small>
                    </span>
                    <span className="more">
                      Read more <span aria-hidden="true">→</span>
                    </span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
