import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getCards, getSurah, getSurahBySlug, getSurahInfo, getSurahs, getTranslation, surahHref, surahSlug } from "@/lib/data";

type Params = Promise<{ name: string }>;

export function generateStaticParams() {
  return getSurahs().map((s) => ({ name: surahSlug(s) }));
}

export async function generateMetadata({ params }: { params: Params }) {
  const surah = getSurahBySlug((await params).name);
  return { title: surah ? `${surah.transliteration} · Quran Universe` : "Quran Universe" };
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

  return (
    <>
      <section className="surah-head">
        <span className="eyebrow">
          Surah {surah.id} · {surah.type === "meccan" ? "Makkah" : "Madinah"} · {surah.total_verses} verses
        </span>
        <h1>{surah.transliteration}</h1>
        <p className="ar title-ar" lang="ar" dir="rtl">
          {surah.name}
        </p>
        <details className="drawer">
          <summary>About this surah</summary>
          <div className="prose" dangerouslySetInnerHTML={{ __html: getSurahInfo(id) }} />
        </details>
      </section>

      <ol className="verse-list">
        {surah.verses.map((v) => {
          const card = cards.get(v.id);
          const key = `${id}:${v.id}`;
          return (
            <li key={v.id}>
              <Link href={surahHref(id, v.id)} className="verse-row">
                <span className="vnum">{v.id}</span>
                <span className="vbody">
                  <span className="ar verse-ar" lang="ar" dir="rtl">
                    {v.text}
                  </span>
                  <span className="verse-en">{getTranslation(key)}</span>
                  {card && (
                    <span className="teaser">
                      <b>{card.title}</b>
                      <small>{card.subtitle}</small>
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
