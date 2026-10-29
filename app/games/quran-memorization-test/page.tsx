import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GameFaq, MoreGames, gameJsonLd, type Faq } from "@/components/games/GamePage";
import { HifzJourney, type HifzSurah } from "@/components/games/hifz/HifzJourney";
import { buildJourney, fold } from "@/components/games/hifz/journey";
import { words } from "@/lib/arabic";
import { getSurahs, surahHref } from "@/lib/data";
import { surahAliases, surahMeaning } from "@/lib/surah-meta";
import { GAMES, gameHref } from "@/lib/games";
import { SITE } from "@/lib/site";
// The journey map reuses Word Quest's summary, banner and path styles.
import "./memorization.css";

const game = GAMES.find((g) => g.slug === "quran-memorization-test")!;
const title = "Quran Memorization Test: Check Your Hifz of Any Surah";

export const metadata: Metadata = {
  title,
  description: game.description,
  keywords: game.keywords,
  alternates: { canonical: gameHref(game) },
  openGraph: { type: "website", title, description: game.description, url: gameHref(game), siteName: SITE.name },
  twitter: { card: "summary", title, description: game.description },
};

// Surahs people most often memorize and revise, linked straight into the test.
const POPULAR = [67, 36, 18, 55, 56, 1, 78, 2, 112, 32];

const faq: Faq[] = [
  {
    q: "How does the Quran memorization test work?",
    a: "The test is a journey through the whole Quran in short levels, starting with al-Fatihah and Juz Amma. Each level first lets you recite the passage, then mixes five kinds of question: fill in the missing word, pick the verse that comes next, put verses in order, choose how a verse begins, and find the one word that has been changed. Levels unlock one after another and get harder as you go.",
  },
  {
    q: "Can I test myself on Juz Amma or a long surah like al-Baqarah?",
    a: "Yes. The journey covers all 114 surahs. Short surahs are one level each, and long surahs like al-Baqarah are split into passages of about ten verses. If you already know a surah, search for it above the map and jump straight to it.",
  },
  {
    q: "Is this a replacement for reciting to a teacher?",
    a: "No. The test checks that you remember the words and the order of the verses, which is useful for daily revision. It cannot check your pronunciation or tajwid, so keep reciting to a qualified teacher.",
  },
  {
    q: "Is the test free, and is my score saved?",
    a: "The test is free and needs no account. Your stars, streak and the verses you missed are saved in your browser on this device. Missed verses come back in a short daily review until you get them right.",
  },
  {
    q: "Which Quran text does the test use?",
    a: "The Arabic is the Uthmani script, with the Sahih International English translation available as a hint. Every verse links to its page with word-by-word meaning and Tafsir Ibn Kathir.",
  },
];

export default function MemorizationTestPage() {
  const surahs = getSurahs();
  const list: HifzSurah[] = surahs.map((s) => ({
    name: s.transliteration,
    ar: s.name,
    verses: s.total_verses,
    href: surahHref(s.id),
    key: fold([s.transliteration, surahMeaning(s.id), ...surahAliases(s.id)].join(" ")),
  }));
  const levels = buildJourney(surahs.map((s) => s.verses.map((v) => words(v.text).length)));

  return (
    <div className="game-page mt-page">
      <JsonLd data={gameJsonLd(game, faq)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link>
        <span aria-hidden="true">/</span>
        <span>{game.name}</span>
      </nav>
      <header className="game-head">
        <h1>Quran Memorization Test</h1>
        <p className="lede">
          Revise the whole Quran one short level at a time, from al-Fatihah and Juz Amma onward. Recite, then prove it.
        </p>
      </header>

      <HifzJourney levels={levels} surahs={list} />

      <section className="game-section" aria-labelledby="how-title">
        <h2 id="how-title">How to test your Quran memorization</h2>
        <ol className="game-steps">
          <li>
            Press <b>Continue</b>. The journey starts with al-Fatihah, then goes through Juz Amma from an-Nas upward,
            then juz 29, 28 and on. Already know a surah? Search for it and jump straight in.
          </li>
          <li>Each level opens with the passage. Recite it once, in your head or aloud, then start the test.</li>
          <li>
            Answer the questions: missing words, the next verse, verse order, how a verse begins, and spot the changed
            word. Later levels hide the translation and blank out more words.
          </li>
          <li>
            Finish with no mistakes for three stars. Verses you miss come back in your <b>daily review</b> until you
            get them right.
          </li>
        </ol>
      </section>

      <section className="game-section" aria-labelledby="routine-title">
        <h2 id="routine-title">A simple hifz revision routine</h2>
        <p>
          Many Quran teachers split each day into three parts. <b>Sabaq</b> is the new portion you memorize today.{" "}
          <b>Sabqi</b> is the recent portion from the last week or two. <b>Manzil</b> is older memorization that you
          revise on a rotating schedule so it is never forgotten.
        </p>
        <p>
          Use the journey for sabqi and the daily review for manzil. Play the next level after you revise
          yesterday&rsquo;s portion, then clear your daily review of older verses. A level with one star is a sign that
          the passage needs another full recitation before you move on.
        </p>
        <p>
          <b>Tips that help the words stay:</b> learn the meaning of a verse before you memorize it, recite new verses
          in your sunnah prayers, link the last word of one verse to the first word of the next, and use one printed
          mushaf so you remember where each verse sits on the page.
        </p>
      </section>

      <section className="game-section" aria-labelledby="popular-title">
        <h2 id="popular-title">Popular surahs to test</h2>
        <ul className="game-grid">
          {POPULAR.map((id) => {
            const s = surahs[id - 1];
            return (
              <li key={id}>
                {/* Plain link: a full load lets the test read ?surah= on mount. */}
                <a href={`${gameHref(game)}?surah=${id}`} className="game-tile">
                  <b>
                    {s.id}. {s.transliteration}
                  </b>
                  <small>
                    {s.total_verses} verses ·{" "}
                    <span className="ar" lang="ar" dir="rtl">
                      {s.name}
                    </span>
                  </small>
                </a>
              </li>
            );
          })}
        </ul>
        <p>
          Need to read a surah first? Every surah has a <Link href="/">verse-by-verse page</Link> with Arabic,
          transliteration and word-by-word meaning.
        </p>
      </section>

      <GameFaq faq={faq} />
      <MoreGames current={game.slug} />
    </div>
  );
}
