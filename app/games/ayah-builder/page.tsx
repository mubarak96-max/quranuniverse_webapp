import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { AyahBuilder } from "@/components/games/AyahBuilder";
import { GameFaq, MoreGames, gameJsonLd, type Faq } from "@/components/games/GamePage";
import { getSurahs, getWords, surahHref } from "@/lib/data";
import { BUILDER_JOURNEY, GAMES, gameHref } from "@/lib/games";
import { SITE } from "@/lib/site";
import { gloss, words } from "@/lib/arabic";
import "./builder.css";
import "./journey.css";

const game = GAMES.find((g) => g.slug === "ayah-builder")!;
const title = "Ayah Builder: A Quran Word by Word Puzzle";

export const metadata: Metadata = {
  title,
  description: game.description,
  keywords: game.keywords,
  alternates: { canonical: gameHref(game) },
  openGraph: { type: "website", title, description: game.description, url: gameHref(game), siteName: SITE.name },
  twitter: { card: "summary", title, description: game.description },
};

const faq: Faq[] = [
  {
    q: "What is Ayah Builder?",
    a: "Ayah Builder is a Quran word-by-word puzzle game. You see the English meaning of a verse and its Arabic words as shuffled tiles, and rebuild the verse by tapping the words in order, from right to left. A journey of 48 levels starts with Al-Fatihah and ends with long verses, and there is one daily verse for everyone.",
  },
  {
    q: "Why is the order different from the English translation?",
    a: "Arabic and English arrange sentences differently. Arabic often puts the verb first and the describing word after the noun, so 'the Most Merciful Lord' becomes 'Lord, the Most Merciful'. Building the verse in Arabic order trains you to follow the Quran as it is recited.",
  },
  {
    q: "Does the game change the words of the Quran?",
    a: "No. The tiles are the words of the verse, only shuffled, and each one goes back to its own place. From the second chapter a few decoy words from other verses join the tiles; they never fit a slot. The finished verse is always shown complete with a link to its tafsir.",
  },
  {
    q: "Where do the word meanings come from?",
    a: "The meanings come from the word-by-word translation used across Quran Universe, and the full-verse translation is Sahih International. Words in brackets, such as (is) or (the), are added to make the English read naturally.",
  },
  {
    q: "How does the game get harder?",
    a: "Levels open one after another. The first chapter shows the meaning of every tile. Later chapters hide the meanings behind a hint, add decoy words, then decoys that look like the real words, and the last chapter hides the English guide too. Hints help at any time but count as a slip, and fewer slips earn more stars.",
  },
];

// Written by tools/gen_games.mjs: how many levels each chapter has, and the verses in each level.
const dir = path.join(process.cwd(), "public", BUILDER_JOURNEY.dir);
const chapters = JSON.parse(fs.readFileSync(path.join(dir, "index.json"), "utf8")) as number[];
const versesPerLevel = chapters.flatMap((_, c) =>
  (JSON.parse(fs.readFileSync(path.join(dir, `${c}.json`), "utf8")) as unknown[][]).map((level) => level.length),
);

export default function AyahBuilderPage() {
  const surahs = getSurahs();
  const list = surahs.map((s) => ({ name: s.transliteration, href: surahHref(s.id) }));
  // The opening verse, word by word, as a worked example in the page text.
  const example = getWords("1:2").map(gloss);
  const arabic = words(surahs[0].verses[1].text);

  return (
    <div className="game-page ab-page">
      <JsonLd data={gameJsonLd(game, faq)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link>
        <span aria-hidden="true">/</span>
        <span>{game.name}</span>
      </nav>
      <header className="game-head">
        <h1>Ayah Builder</h1>
        <p className="lede">
          Rebuild the verses of the Quran word by word, in their Arabic order. {chapters.length} chapters,{" "}
          {versesPerLevel.length} levels, and a new daily verse.
        </p>
      </header>

      <AyahBuilder surahs={list} chapters={chapters} versesPerLevel={versesPerLevel} />

      <section className="game-section" aria-labelledby="how-title">
        <h2 id="how-title">How to play</h2>
        <ol className="game-steps">
          <li>Read the English meaning of the verse at the top. The empty boxes are its Arabic words, from right to left.</li>
          <li>Tap the Arabic tile that comes next. A right tile snaps into place and shows its meaning; a wrong one shakes.</li>
          <li>Stuck? Use a hint to place the next word, show the tile meanings or show the translation. Each counts as a slip.</li>
          <li>Finish a level with one slip or fewer for three stars. The next level opens as soon as you finish.</li>
          <li>Play today&rsquo;s verse too: everyone gets the same one, and two slips or fewer keeps your daily streak.</li>
        </ol>
      </section>

      <section className="game-section" aria-labelledby="example-title">
        <h2 id="example-title">Example: Al-Fatihah, verse 2</h2>
        <p>
          The English translation reads &ldquo;[All] praise is [due] to Allah, Lord of the worlds.&rdquo; Word by
          word, the Arabic says:
        </p>
        <ol className="ab-example" dir="rtl">
          {arabic.map((w, i) => (
            <li key={i}>
              <span className="ar" lang="ar">
                {w}
              </span>
              <small dir="ltr">{example[i]}</small>
            </li>
          ))}
        </ol>
        <p>
          Four words carry the whole meaning. Seeing them one by one is the quickest way to start understanding the
          Arabic you recite in every prayer. Every verse on this site has the same{" "}
          <Link href={surahHref(1, 2)}>word-by-word view</Link>.
        </p>
      </section>

      <section className="game-section" aria-labelledby="why-title">
        <h2 id="why-title">Why learn the Quran word by word?</h2>
        <p>
          A translation tells you what a verse means. A word-by-word reading tells you which Arabic word carries
          which part of that meaning. Over time you start to recognise words on your own, such as <i>rabb</i> (Lord),{" "}
          <i>ard</i> (earth) and <i>qalb</i> (heart), and the Quran begins to speak to you in its own language. To build
          your vocabulary faster, try the <Link href="/games/quran-vocabulary">Quran Word Quest</Link>.
        </p>
      </section>

      <GameFaq faq={faq} />
      <MoreGames current={game.slug} />
    </div>
  );
}
