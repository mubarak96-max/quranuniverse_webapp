import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GameFaq, MoreGames, gameJsonLd, type Faq } from "@/components/games/GamePage";
import { IslamicConnections } from "@/components/games/IslamicConnections";
import { getSurahs, surahHref } from "@/lib/data";
import { GAMES, gameHref } from "@/lib/games";
import { SITE } from "@/lib/site";
import "./connections.css";

const game = GAMES.find((g) => g.slug === "islamic-connections")!;
const title = "Islamic Connections: An Islamic Trivia Puzzle Game";

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
    q: "How do you play Islamic Connections?",
    a: "Pick the words that share a link and press Submit. A correct group locks in with its name and a line on why the words belong together. Find every group before you make four mistakes. The journey starts with three groups of three and grows to four groups of four.",
  },
  {
    q: "Is there always only one right answer?",
    a: "Yes. Every board is checked by a solver so that there is exactly one way to sort all the words. In later levels some words fit two groups on purpose, such as Uhud, which is both a mountain and a battle, but only one arrangement uses every word.",
  },
  {
    q: "What do the colours mean?",
    a: "Groups are ranked from easiest to hardest: green, gold, rust and blue. The first is usually general knowledge, such as the pillars of Islam, and the last needs deeper study, such as surahs that open with the letters Ha Mim.",
  },
  {
    q: "What do the hints do?",
    a: "Reveal a theme shows the name of one group you have not found. Show a pair makes two tiles from the same group glow. Each hint costs a star, the same as a mistake: a clean board earns three stars.",
  },
  {
    q: "Is this game good for adults?",
    a: "Yes. The harder groups test knowledge of hadith scholars, the companions, the names of Paradise and the openings of surahs, so it works as Islamic trivia for adults and teens as well as for families.",
  },
];

const EXAMPLES = [
  { name: "The five pillars of Islam", items: "Shahadah, Salah, Zakat, Sawm, Hajj", level: 1 },
  { name: "Campaigns of the Prophet ﷺ", items: "Badr, Uhud, Khandaq, Khaybar", level: 2 },
  { name: "Surahs that begin with Qul (Say)", items: "Al-Jinn, Al-Kafirun, Al-Ikhlas, Al-Falaq, An-Nas", level: 3 },
  { name: "Names of Hell", items: "Jahannam, Saqar, Jahim, Hutamah", level: 4 },
];

export default function ConnectionsPage() {
  const surahs = getSurahs().map((s) => ({ name: s.transliteration, href: surahHref(s.id) }));
  return (
    <div className="game-page ic-page">
      <JsonLd data={gameJsonLd(game, faq)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link>
        <span aria-hidden="true">/</span>
        <span>{game.name}</span>
      </nav>
      <header className="game-head">
        <h1>Islamic Connections</h1>
        <p className="lede">{game.tagline}</p>
      </header>

      <IslamicConnections surahs={surahs} />

      <section className="game-section" aria-labelledby="how-title">
        <h2 id="how-title">How to play</h2>
        <ol className="game-steps">
          <li>Tap the words you think belong together, then press Submit.</li>
          <li>
            A correct group locks in with its name and why the words link, often with the verse that names them. A
            wrong guess puts out one of your four lanterns.
          </li>
          <li>&ldquo;One away&rdquo; means all but one of your words share a group.</li>
          <li>
            Each level unlocks the next. The journey moves from three groups of three to four groups of four, then
            adds red herrings: words that seem to fit two groups.
          </li>
          <li>Stuck? Reveal a theme or light up a pair, at the cost of a star. A new daily puzzle waits every day.</li>
        </ol>
      </section>

      <section className="game-section" aria-labelledby="examples-title">
        <h2 id="examples-title">Example groups</h2>
        <p>Every board mixes groups from easy to hard. Here are some groups you might see:</p>
        <ol className="ic-bands ic-examples">
          {EXAMPLES.map((g) => (
            <li key={g.name} className={`ic-band is-l${g.level}`}>
              <b>{g.name}</b>
              <span className="ic-band-items">{g.items}</span>
            </li>
          ))}
        </ol>
        <p>
          Some groups come straight from the text of the Quran. Five surahs open with the command <i>Qul</i>, Say,
          including <Link href={surahHref(112)}>Al-Ikhlas</Link> and <Link href={surahHref(114)}>An-Nas</Link>, and
          seven in a row, from <Link href={surahHref(40)}>Ghafir</Link> to <Link href={surahHref(46)}>Al-Ahqaf</Link>,
          open with the letters Ha Mim.
        </p>
      </section>

      <section className="game-section" aria-labelledby="learn-title">
        <h2 id="learn-title">Learn the answers</h2>
        <p>
          Each group is a doorway into a topic. Meet the prophets and their people on the{" "}
          <Link href="/timeline">Islamic history timeline</Link>, study the{" "}
          <Link href="/names">99 Names of Allah</Link>, or read short guides on the <Link href="/learn">Learn</Link>{" "}
          page.
        </p>
      </section>

      <GameFaq faq={faq} />
      <MoreGames current={game.slug} />
    </div>
  );
}
