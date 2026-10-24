"use client";

import { useMemo, useState } from "react";
import { aliveAt as peopleAlive, entityOf, linkOf, search } from "@/lib/timeline-graph";
import { activeStates, refHref, toAh, villainsNear, yearText, type Prophet, type Ref, type Stop, type TimelineData } from "@/lib/timeline-types";
import { meanwhile, yearPath } from "@/lib/timeline-world";
import type { Spot } from "./Atlas";
import { MeanwhileCards } from "./MeanwhileCards";
import { Share } from "./Share";

const NEAR_YEARS = 60;
const NEAR_KM = 350;
const FACES = 8;

type Props = {
  year: number;
  data: TimelineData;
  spot?: Spot;
  birth?: number;
  onStep: (dir: 1 | -1) => void;
  onOpen: (ref: Ref) => void;
  onClearSpot: () => void;
};

export const aliveAt = (prophets: Prophet[], year: number) =>
  prophets.filter((p) => p.from !== undefined && (p.bar ? year >= p.from && year <= p.to! : Math.abs(year - p.from) <= 25));

function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

function go(onOpen: (ref: Ref) => void, ref: Ref) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    onOpen(ref);
  };
}

function Moments({ stops, onOpen }: { stops: Stop[]; onOpen: (ref: Ref) => void }) {
  return (
    <ul className="xp-list">
      {stops.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onOpen({ t: "event", id: s.id })}>
            <time className={`k-${s.kind}`}>{s.label.split(" · ")[0]}</time>
            <span>{s.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// People drawn as name medallions in Arabic calligraphy; the timeline shows no faces.
function Medallions({ data, refs, onOpen }: { data: TimelineData; refs: Ref[]; onOpen: (ref: Ref) => void }) {
  return (
    <ul className="meds">
      {refs.map((ref) => {
        const e = entityOf(data, ref) as { arabic?: string } | undefined;
        const l = linkOf(data, ref);
        return (
          <li key={`${ref.t}:${ref.id}`}>
            <a href={refHref(ref)} className={`med med-${ref.t}`} title={l.sub} onClick={go(onOpen, ref)}>
              <i lang={e?.arabic ? "ar" : undefined} dir={e?.arabic ? "rtl" : undefined}>
                {e?.arabic ?? l.name[0]}
              </i>
              <span>{l.name}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function ExplorePanel({ year, data, spot, birth, onStep, onOpen, onClearSpot }: Props) {
  const { stops, states, prophets, villains, now } = data;
  const [query, setQuery] = useState("");
  const muslim = useMemo(() => activeStates(states, year).filter((s) => s.muslim), [states, year]);
  const faces = useMemo(() => {
    const order = ["ruler", "scholar", "companion", "family", "quran", "hadith"];
    const people = peopleAlive(data, year)
      .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
      .map((p): Ref => ({ t: "person", id: p.id }));
    return [...aliveAt(prophets, year).map((p): Ref => ({ t: "prophet", id: p.id })), ...people].slice(0, FACES);
  }, [data, prophets, year]);
  const rivals = useMemo(() => villainsNear(villains, year), [villains, year]);
  const world = useMemo(() => meanwhile(data, year, undefined, 4), [data, year]);
  const near = useMemo(
    () =>
      stops
        .filter((s) => s.type === "event" && s.year !== undefined && Math.abs(s.year - year) <= NEAR_YEARS)
        .sort((a, b) => Math.abs(a.year! - year) - Math.abs(b.year! - year))
        .slice(0, 6)
        .sort((a, b) => a.year! - b.year!),
    [stops, year],
  );
  const here = useMemo(() => {
    if (!spot) return undefined;
    const state = spot.state ? states.find((s) => s.id === spot.state) : undefined;
    const events = stops
      .filter((s) => s.type === "event" && s.place?.lat !== undefined && km(spot, { lat: s.place.lat, lng: s.place.lng! }) <= NEAR_KM)
      .sort((a, b) => (a.year ?? -1e6) - (b.year ?? -1e6))
      .slice(0, 14);
    const sites = data.sites.filter((s) => km(spot, s) <= NEAR_KM / 2).slice(0, 8);
    return { state, events, sites };
  }, [spot, states, stops, data]);
  const results = useMemo(() => search(data, query), [data, query]);
  const ah = toAh(year);

  return (
    <section className="panel xp" aria-label="Explore by year">
      <header className="sp-head">
        <span>The world in {yearText(year)}</span>
        <Share title={`The world in ${yearText(year)}`} text={`What was happening in the world in ${yearText(year)}?`} path={yearPath(year, now)} />
      </header>
      <div className="xp-body">
        {birth === year && (
          <div className="xp-birth">
            <p className="eyebrow">Your year</p>
            <p>
              You were born in <b>{ah}–{ah + 1} AH</b>, {(year - 570).toLocaleString("en-US")} years after the birth of the Prophet ﷺ and{" "}
              {(year - 622).toLocaleString("en-US")} years after the Hijra.
            </p>
          </div>
        )}

        <div className="xp-step">
          <button type="button" onClick={() => onStep(-1)}>
            ← Earlier moment
          </button>
          <button type="button" onClick={() => onStep(1)}>
            Later moment →
          </button>
        </div>

        {here && (
          <div className="xp-here">
            <header>
              <h3 className="xp-h">{here.state ? here.state.name : (spot?.name ?? "This place")}</h3>
              <button type="button" className="ep-close" onClick={onClearSpot} aria-label="Close">
                ×
              </button>
            </header>
            {here.state && (
              <p>
                <button type="button" className="linkish" onClick={() => onOpen({ t: "polity", id: here.state!.id })}>
                  Open {here.state.name} →
                </button>
              </p>
            )}
            {!here.state && spot?.name && <p className="sp-dim">{spot.name} in {yearText(year)}</p>}
            {here.sites.length > 0 && (
              <p className="ep-chips">
                {here.sites.map((s) => (
                  <a key={s.id} href={refHref({ t: "place", id: s.id })} className="chip place" onClick={go(onOpen, { t: "place", id: s.id })}>
                    {s.name}
                  </a>
                ))}
              </p>
            )}
            <h4>What happened near here, across all of history</h4>
            {here.events.length ? <Moments stops={here.events} onOpen={onOpen} /> : <p className="sp-dim">No moments recorded within {NEAR_KM} km yet.</p>}
          </div>
        )}

        {faces.length > 0 && (
          <>
            <h3 className="xp-h">Alive in {yearText(year)}</h3>
            <Medallions data={data} refs={faces} onOpen={onOpen} />
          </>
        )}

        <dl className="xp-lines">
          <dt>Muslim rule</dt>
          <dd>
            {muslim.length ? (
              muslim.map((s) => (
                <a key={s.id} href={refHref({ t: "polity", id: s.id })} className={`dot c${s.color ?? 0}`} onClick={go(onOpen, { t: "polity", id: s.id })}>
                  {s.name}
                </a>
              ))
            ) : (
              <span className="sp-dim">{year < 610 ? "Not yet: the Quran has not been revealed" : "None"}</span>
            )}
          </dd>
          {rivals.length > 0 && (
            <>
              <dt>Villain</dt>
              <dd>
                {rivals.map((v) => (
                  <a key={v.id} href={refHref({ t: "villain", id: v.id })} className="chip villain" onClick={go(onOpen, { t: "villain", id: v.id })}>
                    {v.name}
                  </a>
                ))}
              </dd>
            </>
          )}
        </dl>

        <MeanwhileCards items={world} onOpen={onOpen} title="Around the world" />

        <h3 className="xp-h">Moments around {yearText(year)}</h3>
        {near.length ? <Moments stops={near} onOpen={onOpen} /> : <p className="sp-dim">No recorded moments within {NEAR_YEARS} years. Try the arrows.</p>}

        <details className="xp-find">
          <summary>Search people, places and events</summary>
          <label className="xp-search">
            <span className="sr-only">Search</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Badr, Luqman, Cordoba, Ottoman…" />
          </label>
          {results.length > 0 && (
            <ul className="xp-list">
              {results.map((l) => (
                <li key={`${l.ref.t}:${l.ref.id}`}>
                  <button type="button" onClick={() => onOpen(l.ref)}>
                    <time>{l.ref.t === "event" ? l.sub : l.ref.t === "polity" ? "Empire" : l.ref.t[0].toUpperCase() + l.ref.t.slice(1)}</time>
                    <span>{l.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && results.length === 0 && <p className="sp-dim">Nothing found for “{query}”.</p>}
        </details>
      </div>
    </section>
  );
}
