"use client";

import { useRef, useState } from "react";
import { Stage, Stars, sfx as effects } from "../Stage";
import {
  art,
  CHAPTERS,
  finish,
  POINTS,
  starsFor,
  tune,
  verseScore,
  type Progress,
  type QuestVerse,
  type SurahPick,
  type VerseResult,
} from "./quest";
import { VerseRound } from "./VerseRound";

type Props = {
  level: number;
  perChapter: number;
  verses: QuestVerse[];
  surahs: SurahPick[];
  progress: Progress;
  last: boolean;
  onProgress: (p: Progress) => void;
  onNext: () => void;
  onClose: () => void;
  onMute: () => void;
};

export function Level(p: Props) {
  const chapter = Math.floor(p.level / p.perChapter);
  const t = tune(p.level);
  const sfx = effects(p.progress.muted);
  const [at, setAt] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<VerseResult[]>([]);
  const [done, setDone] = useState<{ stars: number; before: number } | null>(null);
  // Results also live in a ref because the last verse's callback finishes the level in the same tick.
  const tally = useRef<VerseResult[]>([]);

  const next = (solved: boolean, hints: number, misses: number) => {
    const v = p.verses[at];
    const r = { s: v.s, a: v.a, solved, score: verseScore(solved, hints, misses) };
    tally.current = [...tally.current, r];
    setResults(tally.current);
    const total = tally.current.reduce((n, x) => n + x.score, 0);
    setScore(total);
    if (at + 1 < p.verses.length) {
      setAt(at + 1);
      return;
    }
    const stars = starsFor(total, p.verses.length * POINTS.base);
    const before = p.progress.found.length;
    setScore(total + stars * 20);
    p.onProgress(finish(p.progress, p.level, stars, total + stars * 20, tally.current));
    setDone({ stars, before });
    sfx.win();
  };

  return (
    <Stage
      label={`Level ${p.level + 1}`}
      art={art(chapter)}
      progress={(done ? p.verses.length : at) / p.verses.length}
      muted={p.progress.muted}
      onMute={p.onMute}
      onClose={p.onClose}
      screen={done ? "done" : at}
      status={
        <>
          <span className="gs-lv">Level {p.level + 1} · {CHAPTERS[chapter].name}</span>
          <span className="gs-xp" key={score}>
            <b>{score}</b> points
          </span>
        </>
      }
    >
      {done ? (
        <Complete {...p} stars={done.stars} before={done.before} results={results} score={score} />
      ) : (
        <VerseRound
          kicker={`Verse ${at + 1} of ${p.verses.length} · which surah?`}
          verse={p.verses[at]}
          surahs={p.surahs}
          settings={{ ...t, hintsOnMiss: false }}
          sfx={sfx}
          cta={at + 1 < p.verses.length ? "Next verse" : "Finish level"}
          onDone={(o) => next(o.solved, o.hints, o.misses)}
        />
      )}
    </Stage>
  );
}

function Complete(p: Props & { stars: number; before: number; results: VerseResult[]; score: number }) {
  const solved = p.results.filter((r) => r.solved).length;
  const found = p.progress.found.length;
  const newChapter = !p.last && Math.floor((p.level + 1) / p.perChapter) !== Math.floor(p.level / p.perChapter);
  return (
    <div className="gs-round gs-complete" aria-live="polite">
      <p className="gs-kicker" tabIndex={-1}>{p.last ? "Journey complete" : newChapter ? "Chapter complete" : "Level complete"}</p>
      <Stars stars={p.stars} />
      <h2 className="gs-title">{p.stars === 3 ? "Masha'Allah" : p.stars === 2 ? "Well done" : "Level cleared"}</h2>
      <dl className="gs-tally">
        <div><dt>Points</dt><dd>+{p.score}</dd></div>
        <div><dt>Solved</dt><dd>{solved}/{p.results.length}</dd></div>
        <div><dt>Surahs found</dt><dd>{found}</dd></div>
      </dl>
      {found > p.before && (
        <p className="gq-found">
          {found - p.before} new surah{found - p.before === 1 ? "" : "s"} added to your collection · {found} of 114
        </p>
      )}
      <ul className="gq-recap">
        {p.results.map((r) => {
          const s = p.surahs[r.s - 1];
          return (
            <li key={`${r.s}:${r.a}`} className={r.solved ? "is-hit" : "is-miss"}>
              <span className="ar" lang="ar" dir="rtl">{s.name}</span>
              <a href={`${s.href}/${r.a}`} target="_blank" rel="noopener">
                {s.transliteration} {r.s}:{r.a}
              </a>
              <small>{r.solved ? `+${r.score}` : "missed"}</small>
            </li>
          );
        })}
      </ul>
      <div className="gs-actions">
        {!p.last && (
          <button type="button" className="gs-cta" onClick={p.onNext} autoFocus>
            {newChapter ? `Enter ${CHAPTERS[Math.floor((p.level + 1) / p.perChapter)].name}` : `Level ${p.level + 2}`}
          </button>
        )}
        <button type="button" className="gs-ghost" onClick={p.onClose}>
          Back to the map
        </button>
      </div>
    </div>
  );
}
