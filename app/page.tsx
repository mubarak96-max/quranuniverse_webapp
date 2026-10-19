import { SurahIndex } from "@/components/SurahIndex";
import { getSurahs, surahHref } from "@/lib/data";

export default function Home() {
  const surahs = getSurahs();
  const verses = surahs.reduce((n, s) => n + s.total_verses, 0);
  return (
    <div className="home">
      <section className="hero">
        <p className="ar bismillah" lang="ar" dir="rtl">
          {surahs[0].verses[0].text}
        </p>
        <h1>
          Every verse, made <em>easy to understand</em>
        </h1>
        <p className="lede">
          Each verse has a card with the setting it came down in, where it shows up in your life today, and one small
          thing to try.
        </p>
        <dl className="stats">
          <div>
            <dt>Surahs</dt>
            <dd>{surahs.length}</dd>
          </div>
          <div>
            <dt>Verses</dt>
            <dd>{verses.toLocaleString("en")}</dd>
          </div>
          <div>
            <dt>Tafsir</dt>
            <dd>Ibn Kathir</dd>
          </div>
        </dl>
      </section>
      <SurahIndex
        surahs={surahs.map((s) => ({
          id: s.id,
          name: s.name,
          transliteration: s.transliteration,
          place: s.type === "meccan" ? "Makkah" : "Madinah",
          verses: s.total_verses,
          href: surahHref(s.id),
        }))}
      />
    </div>
  );
}
