"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { sfx as effects } from "../Stage";
import { cellKey, cellsOf, clueOrder, HELP, solutionOf, wordId, type Dir, type Help, type Puzzle, type Word } from "./grid";

type Props = {
  puzzle: Puzzle;
  initial?: Record<string, string>;
  done: boolean;
  sfx: ReturnType<typeof effects>;
  onChange?: (letters: Record<string, string>) => void;
  onHelp: (kind: Help) => void;
  onProgress: (solved: number) => void;
  onSolved: () => void;
};

const ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function Board({ puzzle, initial, done, sfx, onChange, onHelp, onProgress, onSolved }: Props) {
  const solution = useMemo(() => solutionOf(puzzle), [puzzle]);
  const order = useMemo(() => clueOrder(puzzle), [puzzle]);
  const numbers = useMemo(() => new Map(puzzle.words.map((w) => [cellKey(w.r, w.c), w.n])), [puzzle]);

  const [letters, setLetters] = useState<Record<string, string>>(initial ?? {});
  const [active, setActive] = useState<{ key: string; dir: Dir }>(() => ({
    key: cellKey(order[0].r, order[0].c),
    dir: order[0].d,
  }));
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ id: string; n: number } | null>(null);
  const [shake, setShake] = useState<{ id: string; n: number } | null>(null);
  const combo = useRef(0);

  const isSolved = (w: Word, l = letters) => cellsOf(w).every((k) => l[k] === solution.get(k));
  const solved = order.filter((w) => isSolved(w));
  const locked = new Set(solved.flatMap(cellsOf));
  const wordAt = (key: string, dir: Dir) => puzzle.words.find((w) => w.d === dir && cellsOf(w).includes(key));
  const current = wordAt(active.key, active.dir) ?? wordAt(active.key, active.dir === "a" ? "d" : "a")!;
  const cells = cellsOf(current);

  useEffect(() => onProgress(solved.length), [solved.length, onProgress]);

  const firstOpen = (w: Word, l = letters) => cellsOf(w).find((k) => !l[k]) ?? cellsOf(w)[0];

  const select = (w: Word, l = letters) => setActive({ key: firstOpen(w, l), dir: w.d });

  // The next word in clue order that still needs letters, wrapping round to the start.
  const nextWord = (from: Word, by: 1 | -1, l = letters) => {
    const i = order.indexOf(from);
    for (let k = 1; k <= order.length; k++) {
      const w = order[(i + by * k + order.length * k) % order.length];
      if (!isSolved(w, l)) return w;
    }
    return order[(i + by + order.length) % order.length];
  };

  // Writes letters, then reacts to every word the change completed: a chime and a glow when right, a shake when wrong.
  const apply = (next: Record<string, string>, changed: string[]) => {
    setLetters(next);
    onChange?.(next);
    const touched = puzzle.words.filter((w) => cellsOf(w).some((k) => changed.includes(k)));
    for (const w of touched) {
      const full = cellsOf(w).every((k) => next[k]);
      if (!full || isSolved(w)) continue;
      if (isSolved(w, next)) {
        sfx.hit(combo.current++);
        setFlash({ id: wordId(w), n: Date.now() });
      } else if (cellsOf(w).some((k) => changed.includes(k) && !letters[k])) {
        combo.current = 0;
        sfx.miss();
        setShake({ id: wordId(w), n: Date.now() });
      }
    }
    if ([...solution].every(([k, v]) => next[k] === v)) {
      setTimeout(onSolved, 900);
      return;
    }
    if (isSolved(current, next) || cells.every((k) => next[k])) {
      const at = cells.indexOf(changed[changed.length - 1]);
      const gap = cells.slice(at + 1).find((k) => !next[k]) ?? cells.find((k) => !next[k]);
      if (gap && !isSolved(current, next)) setActive({ key: gap, dir: current.d });
      else select(nextWord(current, 1, next), next);
      return;
    }
    const at = cells.indexOf(changed[changed.length - 1]);
    const gap = cells.slice(at + 1).find((k) => !next[k]) ?? cells.slice(at + 1).find((k) => !locked.has(k));
    if (gap) setActive({ key: gap, dir: current.d });
  };

  const type = (ch: string) => {
    if (done) return;
    const target = locked.has(active.key) ? cells.find((k) => !locked.has(k)) : active.key;
    if (!target) return;
    wrong.delete(target);
    apply({ ...letters, [target]: ch }, [target]);
  };

  const erase = () => {
    if (done) return;
    if (letters[active.key] && !locked.has(active.key)) {
      const next = { ...letters, [active.key]: "" };
      setLetters(next);
      onChange?.(next);
      return;
    }
    const back = cells.slice(0, cells.indexOf(active.key)).reverse().find((k) => !locked.has(k));
    if (!back) return;
    const next = { ...letters, [back]: "" };
    setLetters(next);
    onChange?.(next);
    setActive({ key: back, dir: current.d });
  };

  const tap = (key: string) => {
    sfx.tap();
    if (key === active.key) {
      const other = active.dir === "a" ? "d" : "a";
      if (wordAt(key, other)) setActive({ key, dir: other });
      return;
    }
    setActive({ key, dir: wordAt(key, active.dir) ? active.dir : active.dir === "a" ? "d" : "a" });
  };

  const move = (dr: number, dc: number) => {
    const [r, c] = active.key.split(",").map(Number);
    for (let i = 1; i < Math.max(puzzle.w, puzzle.h); i++) {
      const key = cellKey(r + dr * i, c + dc * i);
      if (solution.has(key)) {
        const dir: Dir = dr === 0 ? "a" : "d";
        setActive({ key, dir: wordAt(key, dir) ? dir : dir === "a" ? "d" : "a" });
        return;
      }
    }
  };

  const help = (kind: Help) => {
    if (done || isSolved(current)) return;
    if (kind === "check") {
      const bad = cells.filter((k) => letters[k] && letters[k] !== solution.get(k));
      if (!cells.some((k) => letters[k])) return;
      onHelp(kind);
      setWrong(new Set([...wrong, ...bad]));
      if (bad.length === 0) sfx.tap();
      else sfx.miss();
      return;
    }
    const fill = kind === "letter" ? [locked.has(active.key) ? firstOpen(current) : active.key] : cells.filter((k) => letters[k] !== solution.get(k));
    onHelp(kind);
    setRevealed(new Set([...revealed, ...fill]));
    setWrong(new Set([...wrong].filter((k) => !fill.includes(k))));
    apply({ ...letters, ...Object.fromEntries(fill.map((k) => [k, solution.get(k)!])) }, fill);
  };

  // A physical keyboard drives the same actions as the on-screen one.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const arrows: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    if (/^[a-z]$/i.test(e.key)) type(e.key.toUpperCase());
    else if (e.key === "Backspace") erase();
    else if (arrows[e.key]) move(...arrows[e.key]);
    else if (e.key === " ") tap(active.key);
    else if (e.key === "Tab" || e.key === "Enter") select(nextWord(current, e.shiftKey ? -1 : 1));
    else return;
    e.preventDefault();
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => keys.current(e);
    document.addEventListener("keydown", on);
    return () => document.removeEventListener("keydown", on);
  }, []);

  const flashCells = flash ? cellsOf(puzzle.words.find((w) => wordId(w) === flash.id)!) : [];
  const shakeCells = shake ? cellsOf(puzzle.words.find((w) => wordId(w) === shake.id)!) : [];

  return (
    <div className="cw-board">
      <div className="cw-main">
        <div
          className="cw-grid"
          style={{ gridTemplateColumns: `repeat(${puzzle.w}, minmax(0, 1fr))`, "--cols": puzzle.w, "--rows": puzzle.h } as React.CSSProperties}
          role="grid"
          aria-label="Crossword grid"
        >
          {Array.from({ length: puzzle.h * puzzle.w }, (_, i) => {
            const r = Math.floor(i / puzzle.w);
            const c = i % puzzle.w;
            const key = cellKey(r, c);
            if (!solution.has(key)) return <span key={key} className="cw-block" aria-hidden="true" />;
            const fi = flashCells.indexOf(key);
            return (
              <button
                key={fi >= 0 ? `${key}-${flash!.n}` : shakeCells.includes(key) ? `${key}-${shake!.n}` : key}
                type="button"
                className={cx(
                  "cw-cell",
                  cells.includes(key) && "is-word",
                  key === active.key && "is-active",
                  locked.has(key) && "is-solved",
                  revealed.has(key) && "is-revealed",
                  wrong.has(key) && "is-wrong",
                  fi >= 0 && "is-flash",
                  shakeCells.includes(key) && "is-shake",
                )}
                style={fi >= 0 ? ({ "--i": fi } as React.CSSProperties) : undefined}
                aria-label={`Row ${r + 1}, column ${c + 1}${letters[key] ? `, ${letters[key]}` : ", empty"}`}
                onClick={() => tap(key)}
              >
                {numbers.has(key) && <small>{numbers.get(key)}</small>}
                <span>{letters[key]}</span>
              </button>
            );
          })}
        </div>

        <div className="cw-cluebar" aria-live="polite">
          <button type="button" className="cw-arrow" onClick={() => select(nextWord(current, -1))} aria-label="Previous clue">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="cw-clue" onClick={() => tap(active.key)}>
            <b>{current.n}{current.d === "a" ? "A" : "D"}</b>
            <span>
              {current.clue} <small>({current.len})</small>
            </span>
          </button>
          <button type="button" className="cw-arrow" onClick={() => select(nextWord(current, 1))} aria-label="Next clue">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        <div className="cw-help" role="group" aria-label="Hints">
          {(["check", "letter", "word"] as const).map((k) => (
            <button key={k} type="button" className="cw-help-btn" onClick={() => help(k)} disabled={done || isSolved(current)}>
              {k === "check" ? "Check word" : k === "letter" ? "Reveal letter" : "Reveal word"}
              <small>−{HELP[k]} help</small>
            </button>
          ))}
        </div>

        <div className="cw-keys" aria-label="Keyboard">
          {ROWS.map((row, i) => (
            <div key={row} className="cw-keyrow">
              {[...row].map((ch) => (
                <button key={ch} type="button" className="cw-key" onClick={() => type(ch)}>
                  {ch}
                </button>
              ))}
              {i === 2 && (
                <button type="button" className="cw-key is-wide" onClick={erase} aria-label="Delete">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11v12H9l-6-6zM12 9.5l5 5M17 9.5l-5 5" /></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <aside className="cw-lists">
        {(["a", "d"] as const).map((d) => (
          <section key={d}>
            <h3>{d === "a" ? "Across" : "Down"}</h3>
            <ol>
              {order
                .filter((w) => w.d === d)
                .map((w) => (
                  <li key={wordId(w)}>
                    <button
                      type="button"
                      className={cx(w === current && "is-active", solved.includes(w) && "is-solved")}
                      onClick={() => select(w)}
                    >
                      <b>{w.n}</b>
                      <span>
                        {w.clue} <small>({w.len})</small>
                      </span>
                    </button>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </aside>
    </div>
  );
}
