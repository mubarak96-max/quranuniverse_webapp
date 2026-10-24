import Link from "next/link";
import { HomeGuide } from "@/components/HomeGuide";
import { SurahIndex } from "@/components/SurahIndex";
import { getSurah, getSurahs, surahHref } from "@/lib/data";
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

export default function Home() {
  const surahs = getSurahs();
  const verses = surahs.reduce((n, s) => n + s.total_verses, 0);
  return (
    <div className="home">
      <section className="hero">
        <div>
          <p className="hero-pill">
            {surahs.length} surahs · {verses.toLocaleString("en")} verses · Tafsir Ibn Kathir
          </p>
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
        </div>
        <ul className="hero-tiles" aria-label="Popular surahs and verses">
          {FEATURED.map((f) => {
            const s = getSurah(f.id)!;
            const sub = f.ayah ? `${f.id}:${f.ayah}` : surahMeaning(f.id);
            return (
              <li key={`${f.id}:${f.ayah ?? ""}`}>
                <Link href={surahHref(f.id, f.ayah)}>
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
          <span className="ar" lang="ar" dir="rtl">
            القرآن
          </span>
          <b>The Quran</b>
          <small>Every surah and verse with a card and Tafsir Ibn Kathir</small>
        </Link>
        <Link href="/timeline" className="module">
          <span className="ar" lang="ar" dir="rtl">
            التاريخ
          </span>
          <b>Timeline</b>
          <small>The prophets, nations and empires, from Adam to today</small>
        </Link>
        <Link href="/names" className="module">
          <span className="ar" lang="ar" dir="rtl">
            الأسماء الحسنى
          </span>
          <b>Names of Allah</b>
          <small>The 99 Beautiful Names, their meanings and verses</small>
        </Link>
      </nav>
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
