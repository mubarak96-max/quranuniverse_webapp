import Link from "next/link";
import { notFound } from "next/navigation";
import { getCards, getSurah, getSurahInfo, getSurahs, getTranslation } from "@/lib/data";

export function generateStaticParams() {
  return getSurahs().map((s) => ({ id: String(s.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const surah = getSurah(Number((await params).id));
  return { title: surah ? `${surah.transliteration} · Quran Cards` : "Quran Cards" };
}

export default async function SurahPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const surah = getSurah(id);
  if (!surah) notFound();
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
              <Link href={`/surah/${id}/${v.id}`} className="verse-row">
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
