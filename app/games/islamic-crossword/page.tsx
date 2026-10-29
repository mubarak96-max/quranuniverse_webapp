import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GameFaq, MoreGames, gameJsonLd, type Faq } from "@/components/games/GamePage";
import { IslamicCrossword } from "@/components/games/IslamicCrossword";
import { GAMES, gameHref } from "@/lib/games";
import { SITE } from "@/lib/site";
import "./crossword.css";
import "./play.css";

const game = GAMES.find((g) => g.slug === "islamic-crossword")!;
const title = "Islamic Crossword Puzzles: 48 Levels, Daily and Printable";

export const metadata: Metadata = {
  title,
  description: game.description,
  keywords: game.keywords,
  alternates: { canonical: gameHref(game) },
  openGraph: { type: "website", title, description: game.description, url: gameHref(game), siteName: SITE.name },
  twitter: { card: "summary", title, description: game.description },
};

const clues = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "games", "crossword.json"), "utf8")) as {
  a: string;
  c: string;
}[];

// A fixed handful of clues shown in the page text, as a sample of what the puzzles ask.
const SAMPLE = ["Nuh", "Yunus", "Hira", "Zamzam", "Badr", "Tawhid", "Zabur", "Ikhlas"];

const faq: Faq[] = [
  {
    q: "Is there a new Islamic crossword every day?",
    a: "Yes. Alongside the 48 journey levels, a new daily crossword unlocks at midnight in your time zone, and everyone gets the same grid on the same day. After solving it you can play past daily crosswords too.",
  },
  {
    q: "How do the crossword levels work?",
    a: "The journey has 48 levels in six chapters. The first grids are small, with answers most Muslims know, such as SALAH and MAKKAH. Each chapter adds more words, bigger grids and harder clues, ending with full 13 by 13 puzzles. Finishing a level unlocks the next one.",
  },
  {
    q: "Can I print the crossword?",
    a: "Yes. On the daily crossword card, use Print for a blank grid with all the clues, or Print with answers for a filled-in answer sheet. Both print cleanly on A4 or US Letter paper, which makes them handy for Islamic school classes and family game nights.",
  },
  {
    q: "How are Arabic names spelled in the answers?",
    a: "Answers use common English spellings of Arabic words, such as YUSUF, KABAH and ZAKAT, with no spaces, apostrophes or hyphens. The number in brackets after each clue shows the length of each word, so (3,4) means a three-letter word followed by a four-letter word.",
  },
  {
    q: "What topics do the clues cover?",
    a: "The clues cover the prophets, the companions, places in the life of the Prophet, prayer, fasting, Hajj, the books of revelation, the Islamic months, and well-known surahs of the Quran.",
  },
  {
    q: "What do the hints do, and how are stars earned?",
    a: "Check word marks wrong letters in the current answer, Reveal letter fills one square, and Reveal word fills the whole answer. Each hint adds to your help count. Solve a grid with no help and within the target time for three stars, or with up to two help for two stars. After every grid you see each answer with a short note explaining it.",
  },
];

export default function CrosswordPage() {
  const sample = SAMPLE.map((a) => clues.find((c) => c.a === a)!).filter(Boolean);
  return (
    <div className="game-page cw-page">
      <JsonLd data={gameJsonLd(game, faq)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link>
        <span aria-hidden="true">/</span>
        <span>{game.name}</span>
      </nav>
      <header className="game-head">
        <h1>Islamic Crossword</h1>
        <p className="lede">{game.tagline}</p>
      </header>

      <IslamicCrossword />

      <section className="game-section" aria-labelledby="how-title">
        <h2 id="how-title">How to play</h2>
        <ol className="game-steps">
          <li>Start the journey, or open today&rsquo;s daily crossword. Each level opens full screen.</li>
          <li>
            Tap a square to choose it, and tap it again to switch between across and down. The clue bar under the grid
            shows the current clue; the arrows move to the previous or next one.
          </li>
          <li>
            Type with the on-screen keyboard, or your own keyboard on a computer. The cursor jumps ahead as you type,
            and a finished answer lights up when it is right.
          </li>
          <li>Stuck? Check the word, reveal a letter or reveal the word, at the cost of a star.</li>
          <li>Finish the grid to see every answer explained, earn stars and XP, and move on to the next level.</li>
        </ol>
      </section>

      <section className="game-section" aria-labelledby="sample-title">
        <h2 id="sample-title">Sample clues and answers</h2>
        <p>The crosswords draw on {clues.length} clues about Islam and the Quran. Here are a few of them:</p>
        <dl className="game-facts">
          {sample.map((c) => (
            <div key={c.a}>
              <dt>{c.c}</dt>
              <dd>{c.a}</dd>
            </div>
          ))}
        </dl>
        <p>
          Want to go deeper on the answers? Read the stories of the prophets on the{" "}
          <Link href="/timeline">Islamic history timeline</Link>, or browse <Link href="/">all 114 surahs</Link> with
          translation and tafsir.
        </p>
      </section>

      <section className="game-section" aria-labelledby="class-title">
        <h2 id="class-title">Using the crossword in class or at home</h2>
        <p>
          Teachers can print one grid for each student and the answer sheet for marking. Parents can solve together
          with children, reading each clue aloud and talking about the story behind it. Because every printout comes
          from the daily puzzle, a whole class can work on the same grid on the same day.
        </p>
      </section>

      <GameFaq faq={faq} />
      <MoreGames current={game.slug} />
    </div>
  );
}
