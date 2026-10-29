"use client";

import { useMemo, useRef, useState } from "react";
import { Stage, Stars, sfx as effects } from "../Stage";
import { Board } from "./Board";
import { CHAPTERS, deal, starsFor, tune, type SurahRef, type Verse } from "./plan";
import type { LevelResult, Progress } from "./progress";

type Props = {
  level: number;
  chapter: number;
  verses: Verse[];
  pool: Verse[];
  surahs: SurahRef[];
  progress: Progress;
  last: boolean;
  newChapter: boolean;
  onFinish: (r: LevelResult) => void;
  onNext: () => void;
  onClose: () => void;
  onMute: () => void;
};

const TILE = 5;
const VERSE = 20;

export const builderArt = (chapter: number) => `/games/ayah-builder/art/ch${chapter + 1}.webp`;

export function Play(p: Props) {
  const t = tune(p.level);
  const deals = useMemo(
    () => p.verses.map((v) => deal(v, p.pool, p.level)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a level is dealt once per attempt
    [p.level],
  );
  const sfx = effects(p.progress.muted);
  const [at, setAt] = useState(0);
  const [xp, setXp] = useState(0);
  const [slips, setSlips] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [burst, setBurst] = useState(0);
  const [done, setDone] = useState(false);
  // The score lives in a ref too, because the level ends from a click handler that may hold stale state.
  const tally = useRef({ xp: 0, slips: 0, combo: 0 });

  const gain = (points: number) => {
    tally.current.xp += points;
    setXp(tally.current.xp);
    setBurst((b) => b + 1);
  };
  const right = () => {
    const c = ++tally.current.combo;
    setCombo(c);
    setBest((b) => Math.max(b, c));
    // Ten right taps in a row double the points, and the multiplier stops there.
    gain(Math.round(TILE * (1 + Math.min(c, 10) / 10)));
    sfx.hit(Math.min(c - 1, 9));
  };
  const slip = (sound: boolean) => {
    tally.current.combo = 0;
    setCombo(0);
    setSlips(++tally.current.slips);
    if (sound) sfx.miss();
  };

  const next = () => {
    if (at + 1 < p.verses.length) {
      setAt(at + 1);
      return;
    }
    const stars = starsFor(tally.current.slips);
    gain(stars * 15);
    p.onFinish({ level: p.level, slips: tally.current.slips, xp: tally.current.xp });
    setDone(true);
    sfx.win();
  };

  const verse = p.verses[at];
  const stars = starsFor(slips);
  const progress = done ? 1 : at / p.verses.length;

  return (
    <Stage
      label={`Level ${p.level + 1}`}
      art={builderArt(p.chapter)}
      progress={progress}
      muted={p.progress.muted}
      onMute={p.onMute}
      onClose={p.onClose}
      screen={done ? "done" : at}
      status={
        <>
          <span className="gs-lv">
            Level {p.level + 1} · Verse {Math.min(at + 1, p.verses.length)} of {p.verses.length}
          </span>
          <span className="gs-xp" key={burst}>
            {combo >= 3 && <em className="gs-combo">{combo} in a row</em>}
            <b>{xp}</b> XP
          </span>
        </>
      }
    >
      {done ? (
        <div className="gs-round gs-complete" aria-live="polite">
          <p className="gs-kicker" tabIndex={-1}>
            {p.last ? "Journey complete" : p.newChapter ? "Chapter complete" : "Level complete"}
          </p>
          <Stars stars={stars} />
          <h2 className="gs-title">{slips === 0 ? "Flawless" : stars === 3 ? "Excellent" : stars === 2 ? "Well built" : "Level cleared"}</h2>
          <dl className="gs-tally">
            <div><dt>XP earned</dt><dd>+{xp}</dd></div>
            <div><dt>Best run</dt><dd>×{best}</dd></div>
            <div><dt>Slips</dt><dd>{slips}</dd></div>
          </dl>
          <ul className="ab-built">
            {p.verses.map((v) => (
              <li key={`${v.s}:${v.a}`}>
                <span className="ar" lang="ar" dir="rtl">{v.w.map(([ar]) => ar).join(" ")}</span>
                <a href={`${p.surahs[v.s - 1].href}/${v.a}`} target="_blank" rel="noopener">
                  {p.surahs[v.s - 1].name} {v.s}:{v.a}
                </a>
              </li>
            ))}
          </ul>
          <div className="gs-actions">
            {!p.last && (
              <button type="button" className="gs-cta" onClick={p.onNext} autoFocus>
                {p.newChapter ? `Enter ${CHAPTERS[p.chapter + 1].name}` : `Level ${p.level + 2}`}
              </button>
            )}
            <button type="button" className="gs-ghost" onClick={p.onClose}>
              Back to the map
            </button>
          </div>
        </div>
      ) : (
        <Board
          key={at}
          verse={verse}
          tiles={deals[at]}
          surah={p.surahs[verse.s - 1]}
          glosses={t.glosses}
          guide={t.guide}
          onRight={right}
          onWrong={() => slip(true)}
          onHint={() => slip(false)}
          onSolved={() => {
            gain(VERSE);
            sfx.win();
          }}
          onContinue={next}
          continueLabel={at + 1 < p.verses.length ? "Next verse" : "Finish level"}
        />
      )}
    </Stage>
  );
}
