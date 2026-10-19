import Link from "next/link";
import type { Card } from "@/lib/data";
import { BoxRow } from "./BoxRow";
import { Rich } from "./Rich";

// Drawn pictures store colors as {{token}} placeholders; on the web they resolve to theme CSS variables.
const svgWithTheme = (src: string) => src.replace(/\{\{(\w+)\}\}/g, "var(--$1)");

export function VerseCard({ card, surahName }: { card: Card; surahName: string }) {
  return (
    <article className="card">
      <div className="card-top">
        <span className="eyebrow">
          {surahName} · {card.id}
        </span>
        <span className="pill">{card.place === "makkah" ? "Makkah" : "Madinah"}</span>
      </div>
      <h2 className="card-title">{card.title}</h2>
      <p className="card-sub">{card.subtitle}</p>
      <hr />

      {card.picture.kind === "svg" ? (
        <div className="fig" dangerouslySetInnerHTML={{ __html: svgWithTheme(card.picture.src) }} />
      ) : (
        <div className="dia">
          <div className="lab">{card.picture.label}</div>
          <BoxRow row={card.picture.row} />
        </div>
      )}

      <div className="dia">
        <div className="lab">{card.key.label}</div>
        <BoxRow row={card.key.row} />
      </div>

      <div className="text">
        <p className="story">
          <Rich text={card.then} />
        </p>
        <p className="story">
          <Rich text={card.now} />
        </p>
        <div className="shift">
          <p className="old">{card.old}</p>
          <p className="new">{card.new}</p>
        </div>
      </div>

      <div className="try">
        <div className="lab">Try this</div>
        <p>{card.try}</p>
      </div>

      {card.related.length > 0 && (
        <div className="related">
          <span>Related</span>
          {card.related.map((r) => {
            const [s, a] = r.split(":");
            return (
              <Link key={r} href={`/surah/${s}/${a}`}>
                {r}
              </Link>
            );
          })}
        </div>
      )}

      <div className="card-foot">
        <span>Simplified reflection. Read the tafsir for scholarship.</span>
        {card.meta.status !== "approved" && <span className="status">{card.meta.status}</span>}
      </div>
    </article>
  );
}
