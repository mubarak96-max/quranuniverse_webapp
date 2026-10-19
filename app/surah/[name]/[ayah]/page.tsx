import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { VerseCard } from "@/components/VerseCard";
import {
  getCard,
  getSurah,
  getSurahBySlug,
  getTafsir,
  getTranslation,
  getTransliteration,
  getWords,
  surahHref,
} from "@/lib/data";

type Params = Promise<{ name: string; ayah: string }>;

// Verse pages render on first request and are then cached, so the build does not generate all 6,236.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Params }) {
  const { name, ayah } = await params;
  const id = getSurahBySlug(name)?.id;
  const card = id ? getCard(id, Number(ayah)) : undefined;
  return { title: card ? `${card.title} · ${id}:${ayah}` : `${id}:${ayah} · Quran Universe` };
}

export default async function VersePage({ params }: { params: Params }) {
  const { name, ayah: aid } = await params;
  const ayah = Number(aid);
  const surah = getSurahBySlug(name);
  if (!surah && /^\d+$/.test(name) && getSurah(Number(name))) permanentRedirect(surahHref(Number(name), ayah));
  const verse = surah?.verses.find((v) => v.id === ayah);
  if (!surah || !verse) notFound();

  const id = surah.id;
  const key = `${id}:${ayah}`;
  const card = getCard(id, ayah);
  const tafsir = getTafsir(key);
  const arabicWords = verse.text.split(" ");
  const glosses = getWords(key);
  const prevAt = ayah > 1 ? [id, ayah - 1] : id > 1 ? [id - 1, getSurah(id - 1)!.total_verses] : null;
  const nextAt = ayah < surah.total_verses ? [id, ayah + 1] : id < 114 ? [id + 1, 1] : null;

  return (
    <div className="verse-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Surahs</Link>
        <span aria-hidden="true">/</span>
        <Link href={surahHref(id)}>{surah.transliteration}</Link>
        <span aria-hidden="true">/</span>
        <span>Verse {ayah}</span>
      </nav>

      <section className="verse-block">
        <span className="vkey">{key}</span>
        <p className="ar verse-ar big" lang="ar" dir="rtl">
          {verse.text}
        </p>
        <p className="translit" dangerouslySetInnerHTML={{ __html: getTransliteration(key) }} />
        <p className="verse-en big">{getTranslation(key)}</p>
        {glosses.length > 0 && (
          <details className="drawer">
            <summary>Word by word</summary>
            <ol className="wbw" dir="rtl">
              {arabicWords.map((w, i) => (
                <li key={i}>
                  <span className="ar" lang="ar">
                    {w}
                  </span>
                  <span className="gloss" dir="ltr" dangerouslySetInnerHTML={{ __html: glosses[i] ?? "" }} />
                </li>
              ))}
            </ol>
          </details>
        )}
      </section>

      {card ? (
        <VerseCard card={card} surahName={surah.transliteration} />
      ) : (
        <p className="empty">A card for this verse is on the way.</p>
      )}

      {tafsir && (
        <details className="drawer tafsir">
          <summary>
            Tafsir Ibn Kathir
            {tafsir.from !== key && <small> (shared passage from {tafsir.from})</small>}
          </summary>
          <div className="prose" dangerouslySetInnerHTML={{ __html: tafsir.html }} />
        </details>
      )}

      <nav className="pager" aria-label="Verse navigation">
        {prevAt ? (
          <Link href={surahHref(prevAt[0], prevAt[1])} className="prev">
            <small>← Previous</small>
            <b>{prevAt.join(":")}</b>
          </Link>
        ) : (
          <span />
        )}
        {nextAt ? (
          <Link href={surahHref(nextAt[0], nextAt[1])} className="next">
            <small>Next →</small>
            <b>{nextAt.join(":")}</b>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
