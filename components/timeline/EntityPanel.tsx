"use client";

import Link from "next/link";
import { CERTAINTY, refHref, type Card, type CardLink, type Ref } from "@/lib/timeline-types";

type Props = {
  card: Card;
  trail: CardLink[];
  onOpen: (ref: Ref) => void;
  onTrail: (index: number) => void;
  onYear?: (year: number) => void;
  onMap?: () => void;
  onClose?: () => void;
};

const TONE: Record<Ref["t"], string> = {
  event: "moment",
  prophet: "prophet",
  villain: "villain",
  person: "person",
  polity: "polity",
  place: "place",
  nation: "nation",
};

function Links({ items, onOpen }: { items: CardLink[]; onOpen: (ref: Ref) => void }) {
  if (items[0]?.ref.t === "event") {
    return (
      <ul className="ep-moments">
        {items.map((l) => (
          <li key={l.ref.id}>
            <a
              href={refHref(l.ref)}
              onClick={(e) => {
                e.preventDefault();
                onOpen(l.ref);
              }}
            >
              <time>{l.sub}</time>
              <span>{l.name}</span>
            </a>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="ep-chips">
      {items.map((l) => (
        <a
          key={`${l.ref.t}:${l.ref.id}`}
          href={refHref(l.ref)}
          className={`chip ${TONE[l.ref.t]}`}
          title={l.sub}
          onClick={(e) => {
            e.preventDefault();
            onOpen(l.ref);
          }}
        >
          {l.name}
        </a>
      ))}
    </p>
  );
}

// One person, empire, place or nation, answered as a short list of questions. Links open in place and leave a trail,
// so a reader can follow a thread and step back out of it.
export function EntityPanel({ card, trail, onOpen, onTrail, onYear, onMap, onClose }: Props) {
  return (
    <section className="panel ep" aria-label={card.name}>
      <header className="sp-head ep-head">
        {trail.length > 1 ? (
          <nav className="ep-trail" aria-label="Your trail">
            {trail.map((t, i) => (
              <button key={`${t.ref.t}:${t.ref.id}:${i}`} type="button" onClick={() => onTrail(i)} aria-current={i === trail.length - 1 ? "page" : undefined}>
                {t.name}
              </button>
            ))}
          </nav>
        ) : (
          <span>{card.kind}</span>
        )}
        {onClose && (
          <button type="button" className="ep-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </header>

      <div className="sp-body ep-body" key={`${card.ref.t}:${card.ref.id}`}>
        <p className="ep-kind">
          <b>{card.kind}</b>
          {card.role && <span>{card.role}</span>}
        </p>
        <h2 className="sp-title ep-name">
          {card.name}
          {card.arabic && (
            <span className="ep-ar" lang="ar" dir="rtl">
              {card.arabic}
            </span>
          )}
        </h2>
        {card.when && (
          <p className="ep-when">
            <time>{card.when}</time>
            {card.precision && card.precision !== "exact" && <span className={`ep-cert c-${card.precision}`}>{CERTAINTY[card.precision]}</span>}
            {card.place && <span>{card.place.name}</span>}
          </p>
        )}
        {card.line && <p className="ep-line">{card.line}</p>}
        {onMap && card.place?.lng !== undefined && (
          <button type="button" className="cta ghost ep-map" onClick={onMap}>
            Show on the map{card.year !== undefined ? " in their time" : ""} →
          </button>
        )}
        {card.story && <p className="sp-what">{card.story}</p>}

        {card.tie && (
          <div className="ep-q ep-tie">
            <h3>How does it touch Islam?</h3>
            <p>{card.tie}</p>
          </div>
        )}

        {(card.quote?.text || card.verses.length > 0) && (
          <div className="ep-q">
            <h3>What does the Quran say?</h3>
            {card.quote?.text && (
              <blockquote className="sp-quote">
                <p>{card.quote.text}</p>
                <cite>
                  <Link href={card.quote.href}>Quran {card.quote.ref}</Link>
                </cite>
              </blockquote>
            )}
            {card.verses.length > 0 && (
              <p className="sp-links">
                {card.verses.map((v) => (
                  <Link key={v.ref} href={v.href}>
                    {v.ref}
                  </Link>
                ))}
              </p>
            )}
          </div>
        )}

        {card.hadith.length > 0 && (
          <div className="ep-q">
            <h3>What does the hadith say?</h3>
            <p className="sp-links">
              {card.hadith.map((h) => (
                <a key={h.url} href={h.url} target="_blank" rel="noreferrer">
                  {h.label}
                </a>
              ))}
            </p>
          </div>
        )}

        {card.end && (
          <div className="ep-q">
            <h3>How did they end?</h3>
            <p>{card.end}</p>
          </div>
        )}
        {card.archaeology && (
          <div className="ep-q">
            <h3>What do historians say?</h3>
            <p>{card.archaeology}</p>
          </div>
        )}
        {card.legacy && (
          <div className="ep-q">
            <h3>What grew out of it?</h3>
            <p>{card.legacy}</p>
          </div>
        )}
        {card.lesson && (
          <div className="ep-q ep-lesson">
            <h3>The lesson</h3>
            <p>{card.lesson}</p>
          </div>
        )}

        {card.groups.map((g) => (
          <div key={g.q} className="ep-q">
            <h3>{g.q}</h3>
            <Links items={g.items} onOpen={onOpen} />
          </div>
        ))}

        {card.note && (
          <aside className="ep-note">
            <b>On the sources</b> {card.note}
          </aside>
        )}

        <p className="sp-source">
          {card.source && <>Source: {card.source === "quran" ? "the Quran" : card.source}</>}
          {card.wiki && (
            <>
              {card.source && " · "}
              <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(card.wiki.replace(/ /g, "_"))}`} target="_blank" rel="noreferrer">
                Wikipedia
              </a>
            </>
          )}
          {card.year !== undefined && onYear && (
            <>
              {" · "}
              <button type="button" className="linkish" onClick={() => onYear(card.year!)}>
                See the world in this year
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
