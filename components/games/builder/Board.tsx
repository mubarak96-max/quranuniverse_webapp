"use client";

import { useState, type ReactNode } from "react";
import type { SurahRef, Tile, Verse } from "./plan";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type Props = {
  verse: Verse;
  tiles: Tile[];
  surah: SurahRef;
  glosses: boolean;
  guide: boolean;
  // Words already placed when a saved daily puzzle is reopened.
  initial?: number;
  onRight: () => void;
  onWrong: () => void;
  onHint: () => void;
  onPlaced?: (placed: number) => void;
  onSolved: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  after?: ReactNode;
};

// One verse: tap the Arabic tiles in reading order, right to left. Words with the same spelling are interchangeable.
export function Board(p: Props) {
  const n = p.verse.w.length;
  const [placed, setPlaced] = useState<number[]>(() => Array.from({ length: p.initial ?? 0 }, (_, i) => i));
  const [shake, setShake] = useState<number | null>(null);
  const [showGloss, setShowGloss] = useState(p.glosses);
  const [showGuide, setShowGuide] = useState(p.guide);
  const solved = placed.length >= n;

  const place = (tile: Tile) => {
    const next = [...placed, tile.id];
    setPlaced(next);
    p.onPlaced?.(next.length);
    if (next.length >= n) p.onSolved();
  };

  const tap = (tile: Tile) => {
    if (solved || placed.includes(tile.id)) return;
    if (!tile.decoy && tile.ar === p.verse.w[placed.length][0]) {
      p.onRight();
      place(tile);
    } else {
      p.onWrong();
      setShake(tile.id);
      setTimeout(() => setShake(null), 420);
    }
  };

  const hintNext = () => {
    const want = p.verse.w[placed.length][0];
    const tile = p.tiles.find((t) => !t.decoy && !placed.includes(t.id) && t.ar === want);
    if (!tile) return;
    p.onHint();
    place(tile);
  };

  const reveal = (set: (v: boolean) => void) => {
    p.onHint();
    set(true);
  };

  // Each slot shows the tile placed in it; the word text comes from the tile so a swapped duplicate still reads right.
  const byId = new Map(p.tiles.map((t) => [t.id, t]));

  return (
    <div className="gs-round ab-round">
      <p className="gs-kicker" tabIndex={-1}>
        {solved ? "Verse complete" : `Build the verse · word ${placed.length + 1} of ${n}`}
      </p>

      {showGuide || solved ? (
        <blockquote className="ab-guide">&ldquo;{p.verse.en}&rdquo;</blockquote>
      ) : (
        <p className="ab-guide is-hidden">The English guide is hidden at this level.</p>
      )}

      <ol className={cx("ab-slots", solved && "is-solved")} dir="rtl" aria-label="The verse, word by word">
        {p.verse.w.map(([, gloss], k) => {
          const t = k < placed.length ? byId.get(placed[k]) : undefined;
          return (
            <li key={k} className={cx(t && "is-placed", k === placed.length && "is-next")}>
              {t ? (
                <>
                  <span className="ar" lang="ar">{t.ar}</span>
                  <small dir="ltr">{gloss}</small>
                </>
              ) : (
                <span className="ab-slot-n" aria-hidden="true">{k + 1}</span>
              )}
            </li>
          );
        })}
      </ol>

      {solved ? (
        <div className="gs-feedback is-right" role="status">
          <p className="ab-solved-ref">
            <a href={`${p.surah.href}/${p.verse.a}`} target="_blank" rel="noopener">
              {p.surah.name} {p.verse.s}:{p.verse.a} <span aria-hidden="true">↗</span>
            </a>
          </p>
          {p.after}
          {p.onContinue && (
            <button type="button" className="gs-cta" onClick={p.onContinue} autoFocus>
              {p.continueLabel ?? "Continue"}
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="ab-tray" dir="rtl" aria-label="Word tiles">
            {p.tiles.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  lang="ar"
                  className={cx("ab-tile", placed.includes(t.id) && "is-used", shake === t.id && "is-wrong")}
                  disabled={placed.includes(t.id)}
                  onClick={() => tap(t)}
                >
                  <span className="ar">{t.ar}</span>
                  {showGloss && <small dir="ltr" lang="en">{t.gloss}</small>}
                </button>
              </li>
            ))}
          </ul>
          <div className="ab-hints" aria-label="Hints, each counts as one slip">
            <button type="button" onClick={hintNext}>
              Next word <small>+1 slip</small>
            </button>
            {!showGloss && (
              <button type="button" onClick={() => reveal(setShowGloss)}>
                Meanings <small>+1 slip</small>
              </button>
            )}
            {!showGuide && (
              <button type="button" onClick={() => reveal(setShowGuide)}>
                Translation <small>+1 slip</small>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
