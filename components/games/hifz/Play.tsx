"use client";

import { useMemo, useRef, useState } from "react";
import { Stage, Stars, sfx as effects } from "../Stage";
import type { Level } from "./journey";
import { buildLevel, buildReview, starsFor, tune, verseOf, type Ref, type Step, type Verse } from "./plan";
import type { Progress, Result } from "./progress";
import { NextOrFirst, Order, ReadThrough, Fill, Spot } from "./Rounds";

export type SurahInfo = { name: string; href: string };

type Props = {
  // A journey level, or null for a review of weak verses.
  level: number | null;
  levels: Level[];
  review: Ref[];
  verses: Record<number, Verse[]>;
  surahs: SurahInfo[];
  art: string;
  title: string;
  progress: Progress;
  onFinish: (r: Result) => Progress;
  onNext: (() => void) | null;
  onClose: () => void;
  onMute: () => void;
};

const POINTS = 10;

export function Play(p: Props) {
  const lvl = p.level === null ? null : p.levels[p.level];
  const replay = lvl !== null && Boolean(p.progress.stars[`${lvl.s}:${lvl.from}`]);
  const steps = useMemo(
    () => (lvl ? buildLevel(p.level!, lvl.s, p.verses[lvl.s], lvl.from, lvl.to, replay) : buildReview(p.review, p.verses)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a level is dealt once per attempt
    [],
  );
  const translation = lvl ? tune(p.level!).translation : true;
  const sfx = effects(p.progress.muted);
  const [at, setAt] = useState(0);
  const [xp, setXp] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<{ stars: number; missed: Ref[] } | null>(null);
  // Refs carry the score for callbacks that fire after a delay, when the state they closed over is stale.
  const tally = useRef({ xp: 0, mistakes: 0, combo: 0 });
  const hits = useRef<Ref[]>([]);
  const misses = useRef<Ref[]>([]);

  const hit = (r: Ref) => {
    const t = tally.current;
    t.combo++;
    t.xp += POINTS + (t.combo >= 3 ? 5 : 0);
    setXp(t.xp);
    setCombo(t.combo);
    setBurst((b) => b + 1);
    hits.current.push(r);
    sfx.hit(t.combo - 1);
  };
  const miss = (r: Ref) => {
    tally.current.combo = 0;
    setCombo(0);
    setMistakes(++tally.current.mistakes);
    if (!misses.current.some((m) => m.s === r.s && m.v === r.v)) misses.current.push(r);
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
    p.onFinish({ level: p.level, mistakes, xp: xp + bonus, hits: hits.current, misses: misses.current });
    setXp(xp + bonus);
    setResult({ stars, missed: misses.current });
    sfx.win();
  };

  const step = steps[at] as Step | undefined;
  const surah = (s: number) => p.surahs[s - 1];
  const round = (s: number) => ({
    verses: p.verses[s],
    name: surah(s).name,
    translation,
    onHit: hit,
    onMiss: miss,
    onHint: hint,
    onDone: advance,
  });
  const where = step && verseOf(step);

  return (
    <Stage
      label={p.title}
      art={p.art}
      progress={(result ? steps.length : at) / Math.max(1, steps.length)}
      muted={p.progress.muted}
      onMute={p.onMute}
      onClose={p.onClose}
      screen={result ? "done" : at}
      status={
        <>
          <span className="gs-lv">
            {where && !result ? `${surah(where.s).name} · verse ${where.v + 1}` : p.title}
          </span>
          <span className="gs-xp" key={burst}>
            {combo >= 3 && <em className="gs-combo">{combo} in a row · +5 XP</em>}
            <b>{xp}</b> XP
          </span>
        </>
      }
    >
      {result || !step ? (
        <Complete {...p} stars={result?.stars ?? 3} missed={result?.missed ?? []} xp={xp} mistakes={mistakes} />
      ) : step.kind === "read" ? (
        <ReadThrough verses={p.verses[step.s]} name={surah(step.s).name} from={step.from} to={step.to} onDone={advance} />
      ) : step.kind === "fill" ? (
        <Fill {...round(step.s)} step={step} />
      ) : step.kind === "next" || step.kind === "first" ? (
        <NextOrFirst {...round(step.s)} step={step} />
      ) : step.kind === "order" ? (
        <Order {...round(step.s)} step={step} />
      ) : (
        <Spot {...round(step.s)} step={step} />
      )}
    </Stage>
  );
}

function Complete(p: Props & { stars: number; missed: Ref[]; xp: number; mistakes: number }) {
  const review = p.level === null;
  return (
    <div className="gs-round gs-complete" aria-live="polite">
      <p className="gs-kicker" tabIndex={-1}>{review ? "Review done" : "Level complete"}</p>
      <Stars stars={p.stars} />
      <h2 className="gs-title">{p.mistakes === 0 ? "Firmly memorised" : p.stars === 2 ? "Nearly there" : "Keep revising"}</h2>
      <dl className="gs-tally">
        <div><dt>XP earned</dt><dd>+{p.xp}</dd></div>
        <div><dt>Mistakes</dt><dd>{p.mistakes}</dd></div>
        <div><dt>To revise</dt><dd>{p.missed.length}</dd></div>
      </dl>
      {p.missed.length > 0 ? (
        <div className="hz-revise">
          <p>These verses will come back in your daily review. Read them again now:</p>
          <ul>
            {p.missed.map((m) => (
              <li key={`${m.s}:${m.v}`}>
                <a href={`${p.surahs[m.s - 1].href}/${m.v + 1}`} target="_blank" rel="noopener">
                  {p.surahs[m.s - 1].name} {m.s}:{m.v + 1} <span aria-hidden="true">↗</span>
                </a>
                <span className="ar" lang="ar" dir="rtl">{p.verses[m.s][m.v].w.slice(0, 5).join(" ")} …</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="hz-clean">Every answer right the first time. This passage is yours.</p>
      )}
      <div className="gs-actions">
        {p.onNext && (
          <button type="button" className="gs-cta" onClick={p.onNext} autoFocus>
            {review ? "Continue the journey" : "Next level"}
          </button>
        )}
        <button type="button" className="gs-ghost" onClick={p.onClose}>
          Back to the journey
        </button>
      </div>
    </div>
  );
}
