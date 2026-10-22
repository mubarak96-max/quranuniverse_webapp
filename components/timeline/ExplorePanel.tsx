"use client";

import { useMemo, useState } from "react";
import {
  activeStates,
  tToYear,
  toAh,
  yearText,
  yearToT,
  yearsAgo,
  villainsNear,
  type Chapter,
  type Prophet,
  type State,
  type Stop,
  type Villain,
} from "@/lib/timeline-types";

const NEAR_YEARS = 60;

type Props = {
  year: number;
  stops: Stop[];
  chapters: Chapter[];
  states: State[];
  prophets: Prophet[];
  villains: Villain[];
  now: number;
  onYear: (year: number) => void;
  onStep: (dir: 1 | -1) => void;
  onOpen: (stopId: string) => void;
  onVillain: (id: string) => void;
};

export const aliveAt = (prophets: Prophet[], year: number) =>
  prophets.filter((p) => p.from !== undefined && (p.bar ? year >= p.from && year <= p.to! : Math.abs(year - p.from) <= 25));

export function ExplorePanel({ year, stops, chapters, states, prophets, villains, now, onYear, onStep, onOpen, onVillain }: Props) {
  const [query, setQuery] = useState("");
  const active = useMemo(() => activeStates(states, year), [states, year]);
  const alive = useMemo(() => aliveAt(prophets, year), [prophets, year]);
  const rivals = useMemo(() => villainsNear(villains, year), [villains, year]);
  const near = useMemo(
    () =>
      stops
        .filter((s) => s.type === "event" && s.year !== undefined && s.precision !== "unknown" && Math.abs(s.year - year) <= NEAR_YEARS)
        .sort((a, b) => Math.abs(a.year! - year) - Math.abs(b.year! - year))
        .slice(0, 6)
        .sort((a, b) => a.year! - b.year!),
    [stops, year],
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return stops
      .filter((s) => s.type === "event")
      .filter((s) => [s.title, s.what, s.place?.name ?? "", ...(s.who ?? [])].some((t) => t.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [stops, query]);

  const muslim = active.filter((s) => s.muslim);
  const world = active.filter((s) => !s.muslim);

  return (
    <section className="panel xp" aria-label="Explore by year">
      <header className="sp-head">
        <span>Explore by year</span>
        <span className="sp-count">drag, or use the arrows</span>
      </header>
      <div className="xp-body">
        <div className="xp-year">
          <output aria-live="polite">{yearText(year)}</output>
          <span>
            {year >= 622 && `${toAh(year)} AH · `}
            {yearsAgo(year, now, "exact")}
          </span>
        </div>

        <div className="xp-scale">
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(yearToT(year) * 1000)}
            onChange={(e) => onYear(tToYear(+e.target.value / 1000))}
            aria-label="Year"
            aria-valuetext={yearText(year)}
          />
          <div className="xp-ribbon" aria-hidden="true">
            {chapters
              .filter((c) => c.from !== undefined)
              .map((c) => (
                <i
                  key={c.id}
                  title={c.title}
                  className={year >= c.from! && year <= c.to! ? "on" : undefined}
                  style={{ left: `${yearToT(c.from!) * 100}%`, width: `${Math.max(0.6, (yearToT(c.to!) - yearToT(c.from!)) * 100)}%` }}
                />
              ))}
          </div>
          <div className="xp-ticks" aria-hidden="true">
            <span>3000 BCE</span>
            <span style={{ left: "28%" }}>570</span>
            <span style={{ left: "68%" }}>1258</span>
            <span style={{ left: "100%" }}>today</span>
          </div>
        </div>

        <div className="xp-step">
          <button type="button" onClick={() => onStep(-1)}>
            ← Previous moment
          </button>
          <button type="button" onClick={() => onStep(1)}>
            Next moment →
          </button>
        </div>

        <dl className="xp-lines">
          <dt>Prophet</dt>
          <dd>
            {alive.length ? (
              alive.map((p) => (
                <button key={p.id} type="button" className="chip prophet" onClick={() => p.stop && onOpen(p.stop)}>
                  {p.name}
                </button>
              ))
            ) : (
              <span className="sp-dim">none recorded</span>
            )}
          </dd>
          {rivals.length > 0 && (
            <>
              <dt>Villain</dt>
              <dd>
                {rivals.map((v) => (
                  <button key={v.id} type="button" className="chip villain" onClick={() => onVillain(v.id)}>
                    {v.name}
                  </button>
                ))}
              </dd>
            </>
          )}
          <dt>Muslim rule</dt>
          <dd>
            {muslim.length ? (
              muslim.map((s) => (
                <span key={s.id} className={`dot c${s.color ?? 0}`} title={`Capital: ${s.capital.name}`}>
                  {s.name}
                </span>
              ))
            ) : (
              <span className="sp-dim">{year < 610 ? "not yet" : "none"}</span>
            )}
          </dd>
          <dt>Elsewhere</dt>
          <dd>{world.length ? world.map((s) => s.name).join(" · ") : <span className="sp-dim">—</span>}</dd>
        </dl>

        <h3 className="xp-h">Moments around {yearText(year)}</h3>
        {near.length ? (
          <ul className="xp-list">
            {near.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onOpen(s.id)}>
                  <time className={`k-${s.kind}`}>{s.label.split(" · ")[0]}</time>
                  <span>{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sp-dim">No recorded moments within {NEAR_YEARS} years. Try the arrows.</p>
        )}

        <label className="xp-search">
          <span>Search people, places and events</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Badr, Salah al-Din, Cordoba…" />
        </label>
        {results.length > 0 && (
          <ul className="xp-list">
            {results.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => onOpen(s.id)}>
                  <time className={`k-${s.kind}`}>{s.label.split(" · ")[0]}</time>
                  <span>{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim().length >= 2 && results.length === 0 && <p className="sp-dim">Nothing found for “{query}”.</p>}
      </div>
    </section>
  );
}
