import Link from "next/link";
import { gameHref, GAMES, type Game } from "@/lib/games";
import { SITE, absUrl, breadcrumbs, organization } from "@/lib/site";

export type Faq = { q: string; a: string };

// The visible FAQ and the FAQPage JSON-LD come from one array so they never drift apart.
export function gameJsonLd(game: Game, faq: Faq[]) {
  const url = absUrl(gameHref(game));
  return {
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: game.name,
        description: game.description,
        url,
        applicationCategory: "GameApplication",
        operatingSystem: "Any (web browser)",
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        keywords: game.keywords.join(", "),
        publisher: { "@id": organization["@id"] },
        isPartOf: { "@id": `${SITE.url}/#website` },
      },
      breadcrumbs([
        { name: "Home", path: "/" },
        { name: "Games", path: "/games" },
        { name: game.name, path: gameHref(game) },
      ]),
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}

export function GameFaq({ faq }: { faq: Faq[] }) {
  return (
    <section className="game-section faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Frequently asked questions</h2>
      {faq.map((f) => (
        <details key={f.q} className="drawer">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  );
}

export function MoreGames({ current }: { current: string }) {
  const others = GAMES.filter((g) => g.slug !== current);
  return (
    <section className="game-section" aria-labelledby="more-title">
      <h2 id="more-title">More Quran games</h2>
      {others.length > 0 ? (
        <ul className="game-grid">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={gameHref(g)} className="game-tile">
                <b>{g.name}</b>
                <small>{g.tagline}</small>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          More games are on the way. Until then, <Link href="/names">learn the 99 Names of Allah</Link> or{" "}
          <Link href="/timeline">walk through Islamic history</Link>.
        </p>
      )}
      <p>
        <Link href="/games" className="text-link">
          All games <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
