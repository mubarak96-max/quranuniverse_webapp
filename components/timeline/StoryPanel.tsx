"use client";

import Link from "next/link";
import { useRef } from "react";
import { KIND_LABEL, yearsAgo, type Chapter, type State, type Stop, type Villain } from "@/lib/timeline-types";

type Props = {
  stop: Stop;
  chapter: Chapter;
  chapters: number;
  position: number;
  rule: State[];
  meanwhile: State[];
  now: number;
  playing: boolean;
  readMs: number;
  atStart: boolean;
  atEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onExplore: () => void;
  villains: Villain[];
  onVillain: (id: string) => void;
};

const SWIPE_PX = 50;

export function StoryPanel(p: Props) {
  const { stop, chapter } = p;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const quote = stop.quote;
  const refs = stop.verses.filter((v) => v.ref !== quote?.ref);
  const isChapter = stop.type === "chapter";

  // Horizontal swipes on touch screens step through the story, like flipping cards.
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") swipe.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent) {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) {
      if (dx < 0) p.onNext();
      else p.onPrev();
    }
  }

  return (
    <section className={`panel sp${isChapter ? " sp-is-chapter" : ""}`} aria-label="Story" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <header className="sp-head">
        <span>
          Chapter {chapter.n} · {chapter.title}
        </span>
        <span className="sp-count">
          {p.position} / {chapter.count}
        </span>
      </header>

      <div className="sp-body" key={stop.id}>
        {isChapter ? (
          <div className="sp-chapter" aria-live="polite">
            <p className="sp-chapnum">
              Chapter {chapter.n} of {p.chapters}
            </p>
            <h2>{stop.title}</h2>
            <p className="sp-span">{stop.label}</p>
            <p className="sp-what">{stop.what}</p>
            <p className="sp-dim">{chapter.count - 1} moments in this chapter</p>
          </div>
        ) : (
          <article aria-live="polite">
            <p className="sp-when">
              <time>{stop.label.split(" · ")[0]}</time>
              {stop.label.includes(" · ") && <span>{stop.label.split(" · ")[1]}</span>}
            </p>
            <p className="sp-meta">
              {stop.kind && <b className={`k-${stop.kind}`}>{KIND_LABEL[stop.kind]}</b>}
              {stop.place && <span>{stop.place.name}</span>}
              {stop.year !== undefined && stop.precision !== "unknown" && <span>{yearsAgo(stop.year, p.now, stop.precision)}</span>}
            </p>
            <h2 className="sp-title">{stop.title}</h2>
            <p className="sp-what">{stop.what}</p>
            {stop.who && <p className="sp-who">{stop.who.join(" · ")}</p>}
            {stop.journey && (
              <Link href={`/timeline/journey/${stop.journey}`} className="sp-journey">
                <b>Step into this story</b>
                <span>Full screen, scene by scene</span>
              </Link>
            )}
            {quote?.text && (
              <blockquote className="sp-quote">
                <p>{quote.text}</p>
                <cite>
                  <Link href={quote.href}>Quran {quote.ref}</Link>
                </cite>
              </blockquote>
            )}
            {(refs.length > 0 || stop.article) && (
              <p className="sp-links">
                {refs.map((v) => (
                  <Link key={v.ref} href={v.href}>
                    {v.ref}
                  </Link>
                ))}
                {stop.article && (
                  <Link href={`/learn/${stop.article}`} className="sp-guide">
                    Read the guide →
                  </Link>
                )}
              </p>
            )}
            {(p.rule.length > 0 || p.meanwhile.length > 0 || p.villains.length > 0) && (
              <dl className="sp-context">
                {p.villains.length > 0 && (
                  <>
                    <dt>Villain</dt>
                    <dd>
                      {p.villains.map((v) => (
                        <button key={v.id} type="button" className="chip villain" onClick={() => p.onVillain(v.id)}>
                          {v.name}
                        </button>
                      ))}
                    </dd>
                  </>
                )}
                {p.rule.length > 0 && (
                  <>
                    <dt>Muslim rule</dt>
                    <dd>
                      {p.rule.map((s) => (
                        <span key={s.id} className={`dot c${s.color ?? 0}`}>
                          {s.name}
                        </span>
                      ))}
                    </dd>
                  </>
                )}
                {p.meanwhile.length > 0 && (
                  <>
                    <dt>Meanwhile</dt>
                    <dd>{p.meanwhile.map((s) => s.name).join(" · ")}</dd>
                  </>
                )}
              </dl>
            )}
            <p className="sp-source">
              Source: {stop.source}
              {stop.year !== undefined && (
                <>
                  {" · "}
                  <button type="button" className="linkish" onClick={p.onExplore}>
                    See the world in this year
                  </button>
                </>
              )}
            </p>
          </article>
        )}
      </div>

      <footer className="sp-nav">
        <button type="button" className="nav-btn" onClick={p.onPrev} disabled={p.atStart} aria-label="Previous moment">
          ←
        </button>
        <button type="button" className={`nav-btn play${p.playing ? " on" : ""}`} onClick={p.onTogglePlay} aria-label={p.playing ? "Pause" : "Play the story"}>
          {p.playing ? "❚❚" : "▶"}
        </button>
        <button type="button" className="nav-next" onClick={p.onNext} disabled={p.atEnd}>
          {p.playing && <i key={stop.id} className="nav-timer" style={{ animationDuration: `${p.readMs}ms` }} />}
          <span>{isChapter ? "Begin" : "Next"}</span> →
        </button>
      </footer>
    </section>
  );
}
