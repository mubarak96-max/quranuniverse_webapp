"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { timelineEntry } from "@/lib/timeline-entry";
import { artOf, initials, LENSES, mapHref, small, type Thing } from "@/lib/timeline-things";
import { CERTAINTY, refHref, type Stop, type TimelineData } from "@/lib/timeline-types";
import type { Picked } from "./AtlasApp";
import { TONE } from "./atlas-style";

// The door from the map to an entry, worded for what is behind it.
const EXPLORE: Record<Thing["lens"], string> = {
  moment: "Explore this moment",
  prophet: "Explore the life and mission",
  person: "Explore their life and legacy",
  place: "Explore this place",
  polity: "Explore this empire",
  nation: "Explore this nation",
  villain: "Explore the record",
};

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, "")}…` : s);

// The card for the thing on the map: a picture, the essentials and the door to its page.
export function AtlasSpotlight({
  data,
  picked,
  stop,
  seen,
  touring,
  onOpen,
  onClose,
  onStep,
  onPick,
  onStopTour,
}: {
  data: TimelineData;
  picked: Picked;
  stop?: Stop;
  seen: Set<string>;
  touring: boolean;
  onOpen: () => void;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onPick: (t: Thing) => void;
  onStopTour: () => void;
}) {
  const { thing, also, hint } = picked;
  const [copied, setCopied] = useState(false);
  const head = useRef<HTMLHeadingElement>(null);
  const lens = LENSES.find((l) => l.id === thing.lens);
  const kind = thing.lens === "moment" && stop?.kind ? stop.kind : undefined;
  const people = (stop?.who ?? []).filter((w) => w.ref).slice(0, 6);
  const quote = stop?.quote;
  const card = useMemo(() => timelineEntry(data, thing.ref), [data, thing.ref]);
  const shown = new Set(people.map((p) => `${p.ref!.t}:${p.ref!.id}`));
  const links = (card?.groups ?? [])
    .map((g) => ({ q: g.q, items: g.items.filter((i) => !shown.has(`${i.ref.t}:${i.ref.id}`)).slice(0, 6) }))
    .filter((g) => g.items.length)
    .slice(0, 3);
  const cardQuote = !quote?.text && card?.quote?.text ? card.quote : undefined;

  useEffect(() => {
    setCopied(false);
    if (hint) head.current?.focus({ preventScroll: true });
  }, [thing.key, hint]);

  const share = async () => {
    const url = new URL(mapHref(thing.ref), location.origin).toString();
    try {
      if (navigator.share) await navigator.share({ title: thing.name, text: clip(thing.summary, 140), url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <article className={`sl${hint ? " sl-hint" : ""}`} aria-labelledby="sl-title" style={{ ["--tone" as string]: TONE[thing.tone] }} key={thing.key}>
      <div className="sl-art" style={{ backgroundImage: `url(${small(artOf(data, thing.ref))})` }}>
        <span className="sl-kind">
          <i aria-hidden="true" />
          {lens?.one}
          {kind && kind !== "event" ? ` · ${kind[0].toUpperCase()}${kind.slice(1)}` : ""}
        </span>
        <div className="sl-tools">
          <button type="button" onClick={() => onStep(-1)} aria-label="Previous in the list">
            ‹
          </button>
          <button type="button" onClick={() => onStep(1)} aria-label="Next in the list">
            ›
          </button>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      </div>
      <div className="sl-body">
        {hint && thing.lng !== undefined && (
          <p className="sl-found" role="status">
            <span aria-hidden="true">◉</span> Here it is on the map. Tap the glowing marker, or Explore below, to see everything recorded about it.
          </p>
        )}
        {hint && thing.lng === undefined && (
          <p className="sl-found" role="status">
            No place is recorded for this one, so it has no marker. Its chapter is shown on the map.
          </p>
        )}
        <h2 id="sl-title" ref={head} tabIndex={-1}>
          {thing.name}
        </h2>
        <p className="sl-meta">
          {thing.when && <span>{thing.when}</span>}
          {thing.place && thing.lens !== "place" && <span>{thing.place}</span>}
          {stop && stop.precision !== "exact" && <span className="sl-cert">{CERTAINTY[stop.precision]}</span>}
        </p>
        <p className="sl-text">{clip(thing.summary, 300)}</p>
        {quote?.text && (
          <blockquote className="sl-quote">
            <p>“{clip(quote.text, 180)}”</p>
            <cite>Quran {quote.ref}</cite>
          </blockquote>
        )}
        {cardQuote && (
          <blockquote className="sl-quote">
            <p>“{clip(cardQuote.text!, 180)}”</p>
            <cite>Quran {cardQuote.ref}</cite>
          </blockquote>
        )}
        {people.length > 0 && (
          <div className="sl-people" aria-label="People involved">
            {people.map((p) => (
              <a
                key={p.name}
                href={mapHref(p.ref!)}
                onClick={(e) => {
                  e.preventDefault();
                  const t = { key: `${p.ref!.t}:${p.ref!.id}` } as Thing;
                  onPick(t);
                }}
              >
                <span className="sl-avatar" aria-hidden="true">
                  {initials(p.name)}
                </span>
                {p.name}
              </a>
            ))}
          </div>
        )}
        <div className="sl-actions">
          <Link className="sl-open" href={refHref(thing.ref)} onClick={onOpen ? (e) => { e.preventDefault(); onOpen(); } : undefined}>
            {EXPLORE[thing.lens]} <span aria-hidden="true">→</span>
          </Link>
          <button type="button" className="sl-share" onClick={share}>
            {copied ? "Link copied" : "Share"}
          </button>
        </div>
        {links.map((g) => (
          <section className="sl-links" key={g.q}>
            <h3>{g.q}</h3>
            <ul>
              {g.items.map((i) => (
                <li key={`${i.ref.t}:${i.ref.id}`}>
                  <a
                    href={mapHref(i.ref)}
                    onClick={(e) => {
                      e.preventDefault();
                      onPick({ key: `${i.ref.t}:${i.ref.id}` } as Thing);
                    }}
                  >
                    <b>{i.name}</b>
                    {i.sub && <small>{i.sub}</small>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {touring && (
          <button type="button" className="sl-touring" onClick={onStopTour}>
            <span className="sl-pulse" aria-hidden="true" /> Touring the chapter · tap to stop
          </button>
        )}
        {also.length > 0 && (
          <details className="sl-also">
            <summary>
              {also.length} more at this spot
            </summary>
            <ul>
              {also.slice(0, 12).map((t) => (
                <li key={t.key}>
                  <button type="button" onClick={() => onPick(t)} className={seen.has(t.key) ? "is-seen" : undefined}>
                    <i style={{ background: TONE[t.tone] }} aria-hidden="true" />
                    <span>
                      {t.name}
                      <small>{t.when}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}
