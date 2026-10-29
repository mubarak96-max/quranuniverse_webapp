import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GameFaq, type Faq } from "@/components/games/GamePage";
import { GAMES, gameHref } from "@/lib/games";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

const title = "Free Islamic Games Online: Quran Quizzes and Puzzles";
const description =
  "Play free Islamic games online: daily Quran quiz games and puzzles for adults, teens and families. No app, no sign-up, and every answer links to the verse and its tafsir.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["islamic games", "islamic games online free", "quran game", "islamic quiz game", "quran quiz game", "islamic games for adults"],
  alternates: { canonical: "/games" },
  openGraph: { type: "website", title, description, url: "/games", siteName: SITE.name },
  twitter: { card: "summary", title, description },
};

const faq: Faq[] = [
  {
    q: "Are these Islamic games free?",
    a: "Yes. Every game on Quran Universe is free to play in your browser, with no app to install and no account to create. Your streaks are saved on your own device.",
  },
  {
    q: "Who are the games for?",
    a: "The games are written for adults and teens who want to know the Quran better, from new Muslims to people who have read it for years. Families can play them together, with one person reading the clues aloud.",
  },
  {
    q: "Is it allowed to learn the Quran through games?",
    a: "The games are tools for learning, like a quiz at an Islamic school. They never change or mock the words of the Quran: verses are shown complete, and every round links to the verse with its translation and Tafsir Ibn Kathir.",
  },
  {
    q: "Do I need to know Arabic to play?",
    a: "No. Each game works in English. The Arabic text and transliteration appear as clues and on the answer, so you pick up Quranic Arabic as you play.",
  },
];

export default function GamesPage() {
  return (
    <div className="games-hub">
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "CollectionPage",
              name: title,
              description,
              url: absUrl("/games"),
              isPartOf: { "@id": `${SITE.url}/#website` },
              mainEntity: {
                "@type": "ItemList",
                itemListElement: GAMES.map((g, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  name: g.name,
                  url: absUrl(gameHref(g)),
                })),
              },
            },
            breadcrumbs([
              { name: "Home", path: "/" },
              { name: "Games", path: "/games" },
            ]),
            {
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ],
        }}
      />
      <header className="game-head">
        <p className="eyebrow">Quran games</p>
        <h1>Free Islamic games to learn the Quran</h1>
        <p className="lede">
          Short daily puzzles built from the Quran itself. Play one in a few minutes, keep your streak and finish
          knowing a verse better than you did this morning.
        </p>
      </header>

      <ul className="game-grid">
        {GAMES.map((g) => (
          <li key={g.slug}>
            <Link href={gameHref(g)} className="game-tile">
              <b>{g.name}</b>
              <small>{g.description}</small>
              <span className="text-link">
                Play now <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="game-section" aria-labelledby="why-title">
        <h2 id="why-title">Why play Quran games?</h2>
        <p>
          Reading the Quran builds familiarity. Being asked about it builds memory. A short quiz makes you recall where
          a verse sits, what came before it and what its words mean, and that effort is what makes knowledge stay. Each
          game here ends by sending you back to the source: the verse in Arabic, its English translation, a
          word-by-word breakdown and the <Link href="/">tafsir of Ibn Kathir</Link>.
        </p>
        <p>
          The puzzles are made for grown-ups as much as children. They are a good fit for a study circle, a quiet
          moment after Fajr, a family game night in Ramadan, or a friendly competition when everyone shares their
          daily score.
        </p>
      </section>

      <section className="game-section" aria-labelledby="also-title">
        <h2 id="also-title">Keep learning between games</h2>
        <p>
          Learn the <Link href="/names">99 Names of Allah</Link> with their meanings, follow the prophets and empires on
          the <Link href="/timeline">Islamic history timeline</Link>, or read short guides on the{" "}
          <Link href="/learn">Learn</Link> page.
        </p>
      </section>

      <GameFaq faq={faq} />
    </div>
  );
}
