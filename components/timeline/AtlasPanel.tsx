"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { chapterArt, LENS_ART, LENS_BLURB, LENSES, mapHref, momentOfDay, small, type Lens, type Thing } from "@/lib/timeline-things";
import type { Chapter } from "@/lib/timeline-types";
import { TONE } from "./atlas-style";

type Counts = Partial<Record<Lens | "all", number>>;

type Props = {
  chapter: Chapter;
  chapters: Chapter[];
  lens: Lens | "all";
  totals: Counts;
  wide: boolean;
  onScope: (eraOnly: boolean) => void;
  query: string;
  list: Thing[];
  selected?: string;
  seen: Set<string>;
  last?: Thing;
  mapped: number;
  total: number;
  touring: boolean;
  sheet: boolean;
  onSheet: (open: boolean) => void;
  onLens: (l: Lens | "all") => void;
  onQuery: (q: string) => void;
  onPick: (t: Thing) => void;
  onTour: () => void;
};

const LIST_MAX = 800;
const toneOf = (l: Lens) => TONE[l === "moment" ? "event" : l];

// The one panel. Search across everything, seven collections to explore as a whole, and the chapter on screen.
// Everything listed is on the map; picking it flies there.
export function AtlasPanel(props: Props) {
  const { chapter, chapters, lens, totals, wide, onScope, query, list, selected, seen, last, mapped, total, touring, sheet, onSheet, onLens, onQuery, onPick, onTour } = props;
  const searching = query.trim().length >= 2;
  const today = useMemo(() => momentOfDay(list.length ? list : []), [list]);
  const seenCount = seen.size;
  const pct = Math.min(100, Math.round((seenCount / total) * 100));
  const undated = chapter.id === "beginning";
  const info = lens === "all" ? undefined : LENSES.find((l) => l.id === lens)!;

  return (
    <aside className="atl-panel ap" aria-label="Explore">
      <button type="button" className="ap-handle" onClick={() => onSheet(!sheet)} aria-expanded={sheet} aria-label={sheet ? "Collapse the list" : "Expand the list"}>
        <i />
      </button>
      <header className="ap-head">
        <p className="ap-eyebrow">Atlas of Islamic history</p>
        <div className="ap-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <label className="sr-only" htmlFor="ap-search">
            Search people, places and moments
          </label>
          <input
            id="ap-search"
            type="search"
            autoComplete="off"
            placeholder={`Search ${total.toLocaleString("en-US")} people, places & moments`}
            value={query}
            onFocus={() => onSheet(true)}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onQuery("");
              if (e.key === "Enter" && list[0]) onPick(list[0]);
            }}
          />
          {query ? (
            <button type="button" className="ap-clear" onClick={() => onQuery("")} aria-label="Clear search">
              ×
            </button>
          ) : (
            <kbd aria-hidden="true">/</kbd>
          )}
        </div>
        {lens !== "all" && (
          <div className="ap-lenses" role="group" aria-label="Collections">
            <button type="button" onClick={() => onLens("all")} className="ap-back">
              ← All collections
            </button>
            {LENSES.map((l) => (
              <button key={l.id} type="button" aria-pressed={lens === l.id} onClick={() => onLens(l.id)} style={{ ["--tone" as string]: toneOf(l.id) }}>
                <i aria-hidden="true" />
                {l.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="ap-scroll">
        {!searching && lens === "all" && (
          <nav className="ap-explore" aria-label="Explore a collection">
            <h2>Explore</h2>
            <ul>
              {LENSES.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => onLens(l.id)} style={{ ["--tone" as string]: toneOf(l.id), backgroundImage: `url(${small(LENS_ART[l.id])})` }}>
                    <b>{l.label}</b>
                    <small>{totals[l.id]?.toLocaleString("en-US")} on the map</small>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {!searching && info && (
          <section className="ap-era ap-coll" style={{ backgroundImage: `linear-gradient(180deg, rgba(4,12,16,.2), rgba(4,12,16,.94)), url(${small(LENS_ART[info.id])})`, ["--tone" as string]: toneOf(info.id) }}>
            <p className="ap-era-n">
              <i aria-hidden="true" /> Collection · {totals[info.id]} {info.label.toLowerCase()}
            </p>
            <h2>{wide ? `All ${info.label.toLowerCase()}` : `${info.label} in ${chapter.title}`}</h2>
            <p className="ap-era-blurb">{LENS_BLURB[info.id]}</p>
            <div className="ap-scope" role="group" aria-label="Range">
              <button type="button" aria-pressed={wide} onClick={() => onScope(false)}>
                All of history
              </button>
              <button type="button" aria-pressed={!wide} onClick={() => onScope(true)}>
                Chapter {chapter.n} only
              </button>
            </div>
          </section>
        )}

        {!searching && lens === "all" && (
          <section className="ap-era" style={{ backgroundImage: `linear-gradient(180deg, rgba(4,12,16,.15), rgba(4,12,16,.92)), url(${small(chapterArt(chapter))})` }}>
            <p className="ap-era-n">
              Chapter {chapter.n} of {chapters.length} · {chapter.span}
            </p>
            <h2>{chapter.title}</h2>
            <p className="ap-era-blurb">{chapter.blurb}</p>
            <div className="ap-era-actions">
              <button type="button" className="ap-tour" onClick={onTour} aria-pressed={touring}>
                {touring ? (
                  <>
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3h2v10H5zM9 3h2v10H9z" /></svg> Pause tour
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" /></svg> Tour this chapter
                  </>
                )}
              </button>
              <Link className="ap-read" href={`/timeline/chapter-${chapter.id}`}>
                The whole chapter →
              </Link>
            </div>
            {undated && <p className="ap-era-note">The Quran gives the order of these events, not their dates. The map shows where they took place.</p>}
          </section>
        )}

        {!searching && lens === "all" && !selected && (last || today) && (
          <div className="ap-cards">
            {last && (
              <button type="button" className="ap-mini" onClick={() => onPick(last)}>
                <small>Pick up where you left off</small>
                <b>{last.name}</b>
              </button>
            )}
            {today && !last && (
              <button type="button" className="ap-mini" onClick={() => onPick(today)}>
                <small>A moment in this chapter</small>
                <b>{today.name}</b>
              </button>
            )}
          </div>
        )}

        <div className="ap-list-head">
          <h3>
            {searching
              ? `${list.length >= 60 ? "Top" : list.length} results across all of history`
              : lens === "all"
                ? `In chapter ${chapter.n}`
                : wide
                  ? `${info!.label} across history`
                  : `${info!.label} in chapter ${chapter.n}`}
          </h3>
          {!searching && <span>{list.length}</span>}
        </div>
        {list.length === 0 ? (
          <p className="ap-empty">{searching ? "Nothing matches. Try a name, a city or a battle." : "Nothing of this kind in this chapter. Switch to All of history."}</p>
        ) : (
          <ol className="ap-list">
            {list.slice(0, LIST_MAX).map((t, i) => {
              const head = wide && !searching && (i === 0 || list[i - 1].chapter !== t.chapter);
              return (
                <Fragment key={t.key}>
                  {head && <li className="ap-group">{t.chapter >= 0 ? `${chapters[t.chapter].n}. ${chapters[t.chapter].title}` : "Across the ages"}</li>}
                  <li>
                    <a
                      href={mapHref(t.ref)}
                      aria-current={selected === t.key ? "true" : undefined}
                      className={seen.has(t.key) ? "is-seen" : undefined}
                      onClick={(e) => {
                        e.preventDefault();
                        onPick(t);
                      }}
                    >
                      <i className="ap-dot" style={{ background: TONE[t.tone] }} aria-hidden="true" />
                      <span className="ap-item">
                        <b>{t.name}</b>
                        <small>{[searching ? LENSES.find((l) => l.id === t.lens)?.one : undefined, t.when, t.lens === "moment" ? t.place : t.sub].filter(Boolean).join(" · ")}</small>
                      </span>
                      {t.lng === undefined && (
                        <span className="ap-nomap" title="No location on the map">
                          ◌
                        </span>
                      )}
                    </a>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
        {list.length > LIST_MAX && (
          <p className="ap-more">
            Showing {LIST_MAX} of {list.length}. Search or narrow to a chapter to see the rest.
          </p>
        )}

        <footer className="ap-foot">
          <div className="ap-progress" aria-label={`You have explored ${seenCount} of ${total}`}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p>
            You have explored <b>{seenCount}</b> of {total.toLocaleString("en-US")} entries · {mapped} moments on the map
          </p>
        </footer>
      </div>
    </aside>
  );
}
