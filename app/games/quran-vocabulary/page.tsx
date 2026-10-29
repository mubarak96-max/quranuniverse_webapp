import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GameFaq, MoreGames, gameJsonLd, type Faq } from "@/components/games/GamePage";
import type { Word } from "@/components/games/vocab/plan";
import { WordQuest } from "@/components/games/vocab/WordQuest";
import { getSurahs, surahHref } from "@/lib/data";
import { GAMES, VOCABULARY_FILE, gameHref } from "@/lib/games";
import { SITE } from "@/lib/site";
import "./vocabulary.css";
import "./quest-play.css";

const game = GAMES.find((g) => g.slug === "quran-vocabulary")!;
const title = "The Most Common Words in the Quran: Learn Them With a Game";

export const metadata: Metadata = {
  title,
  description: game.description,
  keywords: game.keywords,
  alternates: { canonical: gameHref(game) },
  openGraph: { type: "website", title, description: game.description, url: gameHref(game), siteName: SITE.name },
  twitter: { card: "summary", title, description: game.description },
};

type Entry = Word & { at: string };

// Written by tools/gen_games.mjs from the word-by-word data.
const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), VOCABULARY_FILE), "utf8")) as { total: number; words: Entry[]; levels: number[][] };

export default function VocabularyPage() {
  const { total, words, levels } = data;
  const surahs = getSurahs().map((s) => ({ name: s.transliteration, href: surahHref(s.id) }));
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
  const sum = (k: number) => words.slice(0, k).reduce((n, w) => n + w.n, 0);
  const verseLink = (at: string) => {
    const [s, a] = at.split(":").map(Number);
    return surahHref(s, a);
  };

  const faq: Faq[] = [
    {
      q: "What is the most common word in the Quran?",
      a: `Counting each written form separately, the most common word in the Quran is ${words[0].ar} (${words[0].en}), which appears ${words[0].n.toLocaleString("en")} times. The most common noun is ${words[1].ar}, Allah, with ${words[1].n.toLocaleString("en")} appearances in this form alone.`,
    },
    {
      q: "How many words are in the Quran?",
      a: `This count finds ${total.toLocaleString("en")} words across the 114 surahs, using the word divisions of the Uthmani text. Counts vary slightly between sources depending on how joined words and particles are split.`,
    },
    {
      q: "Is it true that a few hundred words make up most of the Quran?",
      a: `Yes, in a sense. The 100 most common word forms on this page already make up ${pct(sum(100))} of all the words in the Quran, and the top 200 make up ${pct(sum(200))}. Courses that claim 80% coverage count by root word, so one root such as ك ت ب covers many forms like kataba, kitab and maktub.`,
    },
    {
      q: "How should I learn Quranic Arabic vocabulary?",
      a: "Start with the most frequent words, because each one you learn unlocks thousands of places in the Quran. Learn a few words a day, review them the next day and the next week, and look for them while you read or listen in prayer.",
    },
  ];

  return (
    <div className="game-page vm-page">
      <JsonLd data={gameJsonLd(game, faq)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link>
        <span aria-hidden="true">/</span>
        <span>{game.name}</span>
      </nav>
      <header className="game-head">
        <h1>Quran Word Quest</h1>
        <p className="lede">
          Learn the {words.length} most common words in the Quran, level by level, inside the verses they come from.
          The first 100 alone make up {pct(sum(100))} of the Quran.
        </p>
      </header>

      <WordQuest words={words.map(({ ar, en, n }) => ({ ar, en, n }))} levels={levels} total={total} surahs={surahs} />

      <section className="game-section" aria-labelledby="how-title">
        <h2 id="how-title">How Quran Word Quest works</h2>
        <ol className="game-steps">
          <li>
            The journey has {levels.length} levels in six chapters, from the most frequent words to the less frequent.
            Each level teaches {levels[0].length} new words and unlocks the next when you finish it.
          </li>
          <li>Every new word is shown inside a real verse first, with its meaning and how often it appears.</li>
          <li>
            Then you match words to meanings, answer quick-fire questions against the clock, and find the word inside a
            verse. Each verse then shows the meaning of every word in it.
          </li>
          <li>
            Levels get harder as you go: more choices, lookalike words, a shorter timer, and verses without the
            translation. Words you miss come back in later levels until you know them.
          </li>
          <li>Finish a level with no mistakes for three stars, and play every day to grow your streak.</li>
        </ol>
      </section>

      <section className="game-section" aria-labelledby="list-title">
        <h2 id="list-title">The 100 most common words in the Quran</h2>
        <p>
          Counted from the {total.toLocaleString("en")} words of the Quran in the word-by-word data used on this site.
          Each written form is counted on its own, so ولا (and not) is listed apart from لا (not). The meaning is the
          one the word carries most often; click a count to see the word in its first verse.
        </p>
        <div className="vm-table-wrap">
          <table className="vm-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Arabic</th>
                <th scope="col">Meaning</th>
                <th scope="col">Times</th>
              </tr>
            </thead>
            <tbody>
              {words.slice(0, 100).map((w, i) => (
                <tr key={w.ar}>
                  <td className="vm-n">{i + 1}</td>
                  <td className="ar" lang="ar" dir="rtl">
                    {w.ar}
                  </td>
                  <td>{w.en}</td>
                  <td className="vm-n">
                    <Link href={verseLink(w.at)}>{w.n.toLocaleString("en")}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="game-section" aria-labelledby="facts-title">
        <h2 id="facts-title">How much of the Quran these words cover</h2>
        <dl className="game-facts">
          <div><dt>Top 10 words</dt><dd>{pct(sum(10))}</dd></div>
          <div><dt>Top 50 words</dt><dd>{pct(sum(50))}</dd></div>
          <div><dt>Top 100 words</dt><dd>{pct(sum(100))}</dd></div>
          <div><dt>Top 200 words</dt><dd>{pct(sum(200))}</dd></div>
        </dl>
        <p>
          Most of the top words are small connecting words: <i>from</i>, <i>in</i>, <i>not</i>, <i>those who</i>.
          Learning them first means that when you read a verse such as <Link href={surahHref(2, 255)}>Ayatul Kursi</Link>,
          the words you do not know yet stand out clearly, and the{" "}
          <Link href={surahHref(1, 1)}>word-by-word view</Link> on each verse fills the gaps.
        </p>
      </section>

      <GameFaq faq={faq} />
      <MoreGames current={game.slug} />
    </div>
  );
}
