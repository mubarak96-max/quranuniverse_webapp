"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Stage, Stars, sfx as effects } from "../Stage";
import { Board } from "./Board";
import { clock, HELP, parFor, starsFor, xpFor, type Help, type Puzzle } from "./grid";

export type Finish = { secs: number; help: number; stars: number; xp: number };
export type Resume = { letters: Record<string, string>; secs: number; help: number; done: boolean };

type Props = {
  puzzle: Puzzle;
  label: string;
  title: string;
  art: string;
  muted: boolean;
  resume?: Resume;
  onMute: () => void;
  onClose: () => void;
  onSave?: (r: Resume) => void;
  onFinish: (f: Finish) => void;
  // Mode-specific end-of-grid content: the next level button, or the daily stats and share bar.
  end: (f: Finish) => ReactNode;
};

export function Play(p: Props) {
  const sfx = effects(p.muted);
  const [secs, setSecs] = useState(p.resume?.secs ?? 0);
  const [help, setHelp] = useState(p.resume?.help ?? 0);
  const [solved, setSolved] = useState(0);
  const [finish, setFinish] = useState<Finish | null>(() =>
    p.resume?.done ? score(p.puzzle, p.resume.help, p.resume.secs) : null,
  );
  const letters = useRef(p.resume?.letters ?? {});
  const live = useRef({ secs, help });
  live.current = { secs, help };

  // The clock stops while the tab is hidden, so stepping away does not cost the player stars.
  useEffect(() => {
    if (finish) return;
    const t = setInterval(() => !document.hidden && setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [finish]);

  const save = (done = false) => p.onSave?.({ letters: letters.current, ...live.current, done });

  const onHelp = (kind: Help) => {
    live.current.help += HELP[kind];
    setHelp(live.current.help);
    save();
  };

  const onSolved = () => {
    const f = score(p.puzzle, live.current.help, live.current.secs);
    setFinish(f);
    save(true);
    p.onFinish(f);
    sfx.win();
  };

  const onProgress = useCallback((n: number) => setSolved(n), []);
  const total = p.puzzle.words.length;

  return (
    <Stage
      label={p.label}
      art={p.art}
      progress={finish ? 1 : solved / total}
      muted={p.muted}
      onMute={p.onMute}
      onClose={() => {
        save(Boolean(finish));
        p.onClose();
      }}
      screen={finish ? "done" : "grid"}
      status={
        <>
          <span className="gs-lv">{p.title}</span>
          <span className="cw-clock">
            {help > 0 && <em className="cw-helped">{help} help</em>}
            <b>{clock(finish?.secs ?? secs)}</b>
          </span>
        </>
      }
    >
      {finish ? (
        <Result puzzle={p.puzzle} finish={finish} end={p.end(finish)} />
      ) : (
        <div className="gs-round cw-round">
          <p className="gs-kicker" tabIndex={-1}>
            {solved}/{total} answers
          </p>
          <Board
            puzzle={p.puzzle}
            initial={p.resume?.letters}
            done={false}
            sfx={sfx}
            onChange={(l) => {
              letters.current = l;
              save();
            }}
            onHelp={onHelp}
            onProgress={onProgress}
            onSolved={onSolved}
          />
        </div>
      )}
    </Stage>
  );
}

function score(puzzle: Puzzle, help: number, secs: number): Finish {
  const stars = starsFor(help, secs, parFor(puzzle));
  return { secs, help, stars, xp: xpFor(puzzle, stars, secs) };
}

// Answers are stored without spaces; the length pattern (3,4) puts them back for display.
const spaced = (word: string, len: string) => {
  let at = 0;
  return len
    .split(",")
    .map((n) => word.slice(at, (at += Number(n))))
    .join(" ");
};

function Result({ puzzle, finish, end }: { puzzle: Puzzle; finish: Finish; end: ReactNode }) {
  const par = parFor(puzzle);
  const words = [...puzzle.words].sort((a, b) => (a.d === b.d ? a.n - b.n : a.d === "a" ? -1 : 1));
  return (
    <div className="gs-round gs-complete cw-result" aria-live="polite">
      <p className="gs-kicker" tabIndex={-1}>Crossword solved</p>
      <Stars stars={finish.stars} />
      <h2 className="gs-title">{finish.stars === 3 ? "Masterful" : finish.stars === 2 ? "Well solved" : "Solved"}</h2>
      <dl className="gs-tally">
        <div><dt>Time</dt><dd>{clock(finish.secs)}</dd></div>
        <div><dt>Help used</dt><dd>{finish.help}</dd></div>
        <div><dt>XP</dt><dd>+{finish.xp}</dd></div>
      </dl>
      <p className="cw-criteria">
        Three stars: no help and under {clock(par)}. Two stars: up to 2 help.
      </p>
      {end}
      <section className="cw-answers" aria-labelledby="cw-answers-title">
        <h3 id="cw-answers-title">The answers</h3>
        <ol>
          {words.map((w) => (
            <li key={`${w.d}${w.n}`}>
              <b>
                {w.n}
                {w.d === "a" ? "A" : "D"}
              </b>
              <div>
                <strong>{spaced(w.word, w.len)}</strong>
                <span>{w.clue}</span>
                {w.x && <small>{w.x}</small>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
