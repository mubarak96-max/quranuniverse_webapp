"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Stars, sfx as effects } from "../Stage";
import { coverage, type LevelResult, type Progress } from "./progress";
import { buildLevel, CHAPTERS, chapterOf, starsFor, type ChapterVerses, type SurahRef, type Word } from "./plan";
import { Choice, Intro, Match, VerseHunt } from "./Rounds";

type Props = {
  level: number;
  words: Word[];
  levels: number[][];
  total: number;
  perChapter: number;
  verses: ChapterVerses;
  surahs: SurahRef[];
  progress: Progress;
  onFinish: (r: LevelResult) => Progress;
  onNext: () => void;
  onClose: () => void;
  onMute: () => void;
};

const POINTS = { intro: 0, match: 10, choice: 10, verse: 25 };

export function Play(p: Props) {
  const replay = Boolean(p.progress.stars[p.level]);
  const steps = useMemo(
    () => buildLevel(p.level, p.words, p.levels, p.verses, p.progress.strength, replay),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a level is dealt once per attempt
    [p.level],
  );
  const sfx = effects(p.progress.muted);
  const [at, setAt] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState(0);
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<{ before: number; after: Progress; stars: number } | null>(null);
  // Refs carry the score for callbacks that fire after a delay, when the state they closed over is stale.
  const tally = useRef({ xp: 0, mistakes: 0 });
  const hits = useRef(new Set<number>());
  const misses = useRef(new Set<number>());

  const step = steps[at];
  const chapter = CHAPTERS[chapterOf(p.level, p.perChapter)];

  const hit = (word: number) => {
    const c = combo + 1;
    setCombo(c);
    setBest((b) => Math.max(b, c));
    // The combo multiplier tops out at double points after ten answers in a row.
    tally.current.xp += Math.round(POINTS[step.kind] * (1 + Math.min(c, 10) / 10));
    setXp(tally.current.xp);
    setBurst((b) => b + 1);
    hits.current.add(word);
    sfx.hit(c - 1);
  };
  const miss = (word: number) => {
    setCombo(0);
    setMistakes(++tally.current.mistakes);
    misses.current.add(word);
    sfx.miss();
  };
  const hint = () => setMistakes(++tally.current.mistakes);

  const advance = () => {
    if (at + 1 < steps.length) {
      setAt(at + 1);
      return;
    }
    const { xp, mistakes } = tally.current;
    const stars = starsFor(mistakes);
    const bonus = stars * 15;
    const before = coverage(p.progress, p.levels, p.words, p.total);
    const after = p.onFinish({
      level: p.level,
      mistakes,
      xp: xp + bonus,
      hits: [...hits.current].filter((i) => !misses.current.has(i)),
      misses: [...misses.current],
    });
    setXp(xp + bonus);
    setResult({ before, after, stars });
    sfx.win();
  };

  const round = { words: p.words, onHit: hit, onMiss: miss, onDone: advance };

  return (
    <Stage
      label={`Level ${p.level + 1}`}
      art={`/games/quran-vocabulary/art/ch${chapterOf(p.level, p.perChapter) + 1}.webp`}
      progress={(result ? steps.length : at) / steps.length}
      muted={p.progress.muted}
      onMute={p.onMute}
      onClose={p.onClose}
      screen={result ? "done" : at}
      status={
        <>
          <span className="gs-lv">Level {p.level + 1} · {chapter.name}</span>
          <span className="gs-xp" key={burst}>
            {combo >= 3 && <em className="gs-combo">{combo} in a row · {(1 + Math.min(combo, 10) / 10).toFixed(1)}× XP</em>}
            <b>{xp}</b> XP
          </span>
        </>
      }
    >
      {result ? (
        <Complete {...p} result={result} xp={xp} best={best} mistakes={mistakes} steps={steps.length} />
      ) : step.kind === "intro" ? (
        <Intro words={p.words} ids={step.words} verses={p.verses} surahs={p.surahs} onDone={advance} tap={sfx.tap} />
      ) : step.kind === "match" ? (
        <Match {...round} ids={step.words} />
      ) : step.kind === "choice" ? (
        <Choice {...round} word={step.word} options={step.options} reverse={step.reverse} seconds={step.seconds} />
      ) : (
        <VerseHunt {...round} word={step.word} verse={step.verse} translation={step.translation} surahs={p.surahs} onHint={hint} />
      )}
    </Stage>
  );
}

function Complete(p: Props & {
  result: { before: number; after: Progress; stars: number };
  xp: number;
  best: number;
  mistakes: number;
  steps: number;
}) {
  const { before, after, stars } = p.result;
  const now = coverage(after, p.levels, p.words, p.total);
  const max = (p.words.reduce((n, w) => n + w.n, 0) / p.total) * 100;
  const last = p.level + 1 >= p.levels.length;
  const newChapter = !last && chapterOf(p.level + 1, p.perChapter) !== chapterOf(p.level, p.perChapter);
  const [shown, setShown] = useState(before);

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1400);
      setShown(before + (now - before) * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [before, now]);

  return (
    <div className="gs-round gs-complete" aria-live="polite">
      <p className="gs-kicker" tabIndex={-1}>{last ? "Journey complete" : newChapter ? "Chapter complete" : "Level complete"}</p>
      <Stars stars={stars} />
      <h2 className="gs-title">{p.mistakes === 0 ? "Flawless" : stars === 2 ? "Well done" : "Level cleared"}</h2>
      <dl className="gs-tally">
        <div><dt>XP earned</dt><dd>+{p.xp}</dd></div>
        <div><dt>Best combo</dt><dd>×{p.best}</dd></div>
        <div><dt>Mistakes</dt><dd>{p.mistakes}</dd></div>
      </dl>
      <div className="wq-unlock">
        <span>Quran words you can now recognise</span>
        <b>{shown.toFixed(1)}%</b>
        <div className="wq-unlock-bar"><i style={{ width: `${(shown / max) * 100}%` }} /></div>
        <small>+{(now - before).toFixed(1)}% from this level, out of {max.toFixed(0)}% across all 300 words</small>
      </div>
      <ul className="wq-learned">
        {p.levels[p.level].map((i) => (
          <li key={i}>
            <span className="ar" lang="ar" dir="rtl">{p.words[i].ar}</span>
            <span>{p.words[i].en}</span>
            <small>{p.words[i].n.toLocaleString("en")}×</small>
          </li>
        ))}
      </ul>
      <div className="gs-actions">
        {!last && (
          <button type="button" className="gs-cta" onClick={p.onNext} autoFocus>
            {newChapter ? `Enter ${CHAPTERS[chapterOf(p.level + 1, p.perChapter)].name}` : `Level ${p.level + 2}`}
          </button>
        )}
        <button type="button" className="gs-ghost" onClick={p.onClose}>
          Back to the map
        </button>
      </div>
    </div>
  );
}
