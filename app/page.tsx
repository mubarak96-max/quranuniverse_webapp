import Link from "next/link";
import { HomeGuide } from "@/components/HomeGuide";
import { SurahIndex } from "@/components/SurahIndex";
import { getSurah, getSurahs, getTranslation, surahHref } from "@/lib/data";
import { surahMeaning } from "@/lib/surah-meta";

const FEATURED: { id: number; ayah?: number; ar?: string; label?: string; tag?: string }[] = [
  { id: 1, tag: "Start here" },
  { id: 2, ayah: 255, ar: "آية الكرسي", label: "Ayat al-Kursi", tag: "Most read" },
  { id: 18, tag: "Fridays" },
  { id: 36 },
  { id: 55 },
  { id: 56 },
  { id: 67, tag: "Before sleep" },
  { id: 19 },
  { id: 12 },
];

function HomeIcon({ name }: { name: "book" | "clock" | "arch" | "heart" | "leaf" }) {
  const paths = {
    book: "M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l4 2",
    arch: "M4 21V11c0-4 6-5 8-9 2 4 8 5 8 9v10M2 21h20M9 21v-5a3 3 0 0 1 6 0v5M4 13h16",
    heart: "M12 21 3.5 12.5C-2 7 5 0 10.5 5.5L12 7l1.5-1.5C19 0 26 7 20.5 12.5Z",
    leaf: "M4 20C1 10 8 4 21 3c-1 13-7 20-17 17Zm0 0L16 8",
  };
  return <svg className="home-icon" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}

export default function Home() {
  const surahs = getSurahs();
  const verses = surahs.reduce((n, s) => n + s.total_verses, 0);
  return (
    <div className="home">
      <section className="hero">
        <div>
          <p className="hero-eyebrow">Read · Reflect · Understand</p>
          <h1>
            Every verse, made <em>easy to understand</em>
          </h1>
          <p className="lede">
            Each verse has a card with the setting it came down in, where it shows up in your life today, and one small
            thing to try.
          </p>
          <Link href={surahHref(1)} className="hero-cta">
            Start reading <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-meta">
            {surahs.length} surahs · {verses.toLocaleString("en")} verses · Tafsir Ibn Kathir
          </p>
        </div>
        <ul className="hero-tiles" aria-label="Popular surahs and verses">
          {FEATURED.map((f) => {
            const s = getSurah(f.id)!;
            const sub = f.ayah ? `${f.id}:${f.ayah}` : surahMeaning(f.id);
            return (
              <li key={`${f.id}:${f.ayah ?? ""}`}>
                <Link href={surahHref(f.id, f.ayah)}>
                  <span className="num"><span>{f.id}</span></span>
                  {f.tag && <span className="hero-tag">{f.tag}</span>}
                  <span className="ar" lang="ar" dir="rtl">
                    {f.ar ?? s.name}
                  </span>
                  <b>{f.label ?? s.transliteration}</b>
                  {/* Some meanings repeat the name (Ya-Sin), so drop the duplicate line. */}
                  {sub !== s.transliteration && <small>{sub}</small>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
      <nav className="modules" aria-label="Explore">
        <Link href="#index-title" className="module">
          <span className="module-icon"><HomeIcon name="book" /></span>
          <b>The Quran</b>
          <small>Every surah and verse with a card and Tafsir Ibn Kathir</small>
        </Link>
        <Link href="/timeline" className="module">
          <span className="module-icon"><HomeIcon name="clock" /></span>
          <b>Timeline</b>
          <small>The prophets, nations and empires, from Adam to today</small>
        </Link>
        <Link href="/names" className="module">
          <span className="module-icon"><HomeIcon name="arch" /></span>
          <b>Names of Allah</b>
          <small>The 99 Beautiful Names, their meanings and verses</small>
        </Link>
      </nav>
      <section className="home-reflection" aria-labelledby="reflection-title">
        <div className="section-heading">
          <h2 id="reflection-title">A moment of reflection</h2>
          <span className="section-rule" aria-hidden="true"><span className="ornament" /></span>
        </div>
        <div className="reflection-panel">
          <Link href={surahHref(1, 1)} className="reflection-source">Al-Fatihah · 1:1</Link>
          <blockquote>{getTranslation("1:1")}</blockquote>
          <div className="reflection-steps">
            <Link href={surahHref(1, 1)}>
              <HomeIcon name="book" />
              <span><b>Understand</b><small>Read the translation and tafsir.</small></span>
              <span className="reflection-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link href={surahHref(1, 1)}>
              <HomeIcon name="heart" />
              <span><b>Reflect</b><small>Explore the meaning in everyday life.</small></span>
              <span className="reflection-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link href={surahHref(1, 1)}>
              <HomeIcon name="leaf" />
              <span><b>Practice</b><small>Find one small thing to try today.</small></span>
              <span className="reflection-arrow" aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
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
      <HomeGuide />
    </div>
  );
}
