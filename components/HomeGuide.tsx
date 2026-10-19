import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { getArticle } from "@/lib/articles";
import { getSurah, surahHref } from "@/lib/data";
import { surahMeaning } from "@/lib/surah-meta";

// Surah names with the highest search demand (Ubersuggest), linked so crawlers and readers find them first.
const POPULAR: { id: number; ayah?: number; label?: string }[] = [
  { id: 1 },
  { id: 2, ayah: 255, label: "Ayat al-Kursi (2:255)" },
  { id: 18 },
  { id: 36 },
  { id: 55 },
  { id: 56 },
  { id: 67 },
  { id: 19 },
  { id: 12 },
  { id: 97 },
  { id: 112 },
  { id: 114 },
];

const GUIDES = [
  "what-is-the-quran",
  "how-to-read-the-quran",
  "what-is-islam",
  "five-pillars-of-islam",
  "jesus-in-the-quran",
  "ayatul-kursi",
  "four-quls",
  "what-is-tafsir",
];

const FAQ = [
  {
    q: "Can I read the Quran online in English for free?",
    a: "Yes. Quran Universe has all 114 surahs and 6,236 verses free to read, each in the original Arabic with the Sahih International English translation, a transliteration and a word-by-word breakdown. No account or app is needed.",
  },
  {
    q: "What makes Quran Universe different from other Quran websites?",
    a: "Every verse has a short card that explains the setting it was revealed in, how its message shows up in everyday life, and one small thing to try. The full Tafsir Ibn Kathir sits under each verse for anyone who wants the classical commentary.",
  },
  {
    q: "I am not Muslim. Is this site for me?",
    a: "Yes. The cards are written in plain English and assume no background in Islam, so they work as a starting point for anyone curious about what the Quran actually says. The Learn section covers the basics, such as what the Quran is and what Muslims believe.",
  },
  {
    q: "Which English translation of the Quran is used?",
    a: "The English text is the Sahih International translation, one of the most widely read modern English translations. It stays close to the Arabic and marks added words in brackets so you can see what is translation and what is clarification.",
  },
  {
    q: "Where should a beginner start reading the Quran?",
    a: "Most people start with Surah Al-Fatihah, the seven-verse opening that Muslims recite in every prayer, then read the short surahs at the end of the Quran such as Al-Ikhlas, Al-Falaq and An-Nas. Surah Yusuf and Surah Maryam are good next steps because they tell one continuous story.",
  },
  {
    q: "What is Tafsir Ibn Kathir?",
    a: "Tafsir Ibn Kathir is a classical commentary on the Quran by the 14th-century scholar Ismail ibn Kathir. It explains each verse using other verses, the sayings of the Prophet Muhammad and the views of early scholars, and it is one of the most trusted tafsirs in English.",
  },
];

export function HomeGuide() {
  const guides = GUIDES.map((s) => getArticle(s)).filter((a) => a !== undefined);
  return (
    <section className="home-guide" aria-labelledby="guide-title">
      <JsonLd
        data={{
          "@type": "FAQPage",
          mainEntity: FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <div className="guide-intro">
        <p className="eyebrow">Read the Quran online</p>
        <h2 id="guide-title">Understand the Quran, one verse at a time</h2>
        <p>
          Quran Universe is a free place to read the Quran online in Arabic and English and actually understand it.
          All 114 surahs and 6,236 verses are here, each with the Sahih International translation, a transliteration
          for reading along, a word-by-word meaning and the full Tafsir Ibn Kathir. On top of that, every verse has a
          simple card that explains what was happening when it was revealed and what it means for your life today.
        </p>
      </div>

      <div className="guide-cols">
        <article>
          <h3>For Muslims who want more than recitation</h3>
          <p>
            Many Muslims recite the Quran daily without knowing what the words mean. Each card answers three
            questions in plain English: what was the setting, where does this verse show up in your life now, and what
            is one small thing you can do with it today. Read a verse after Fajr, before you sleep, or on Friday with
            Surah Al-Kahf, and let the meaning stay with you.
          </p>
        </article>
        <article>
          <h3>For anyone exploring Islam</h3>
          <p>
            If you are curious about Islam, the clearest place to start is the Quran itself. You do not need Arabic or
            any background. Read the English translation, open the card for context, and use the Learn guides for the
            basics: what the Quran is, who Muslims believe revealed it, and what it says about Jesus, Mary and the
            prophets shared with Judaism and Christianity.
          </p>
        </article>
        <article>
          <h3>What you get on every verse</h3>
          <ul>
            <li>The original Arabic text in a clear Naskh script</li>
            <li>The Sahih International English translation</li>
            <li>A transliteration so you can read the Arabic aloud</li>
            <li>A word-by-word breakdown of the Arabic</li>
            <li>A plain-English card with context and one thing to try</li>
            <li>The complete Tafsir Ibn Kathir commentary</li>
          </ul>
        </article>
      </div>

      <div className="guide-block">
        <h3>Popular surahs and verses</h3>
        <ul className="chip-list">
          {POPULAR.map((p) => {
            const s = getSurah(p.id)!;
            return (
              <li key={`${p.id}:${p.ayah ?? ""}`}>
                <Link href={surahHref(p.id, p.ayah)}>
                  <b>{p.label ?? `Surah ${s.transliteration}`}</b>
                  {!p.label && <small>{surahMeaning(p.id)}</small>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {guides.length > 0 && (
        <div className="guide-block">
          <h3>Start learning</h3>
          <ul className="guide-links">
            {guides.map((a) => (
              <li key={a.slug}>
                <Link href={`/learn/${a.slug}`}>{a.title}</Link>
              </li>
            ))}
          </ul>
          <Link href="/learn" className="text-link">
            All guides <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}

      <div className="guide-block faq">
        <h3>Frequently asked questions</h3>
        {FAQ.map((f) => (
          <details key={f.q} className="drawer">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
