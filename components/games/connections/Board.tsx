"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Stage, Stars, sfx as effects } from "../Stage";
import { MISTAKES, replay, shuffle, starsFor, xpFor, type Group, type Result, type SurahRef } from "./logic";

type Props = {
  groups: Group[];
  label: string;
  heading: string;
  art?: string;
  muted: boolean;
  surahs: SurahRef[];
  initial?: { guesses: string[][]; hints?: number };
  onMute: () => void;
  onClose: () => void;
  // Called after every guess, so a daily board can be saved and restored mid-game.
  onGuess?: (guesses: string[][], hints: number, done: boolean, won: boolean) => void;
  onFinish: (r: Result) => void;
  actions: (r: Result) => ReactNode;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

// Tiles are narrow on a phone, so the longest unbreakable run of letters sets the font size (--n in the CSS).
const longest = (it: string) => Math.max(...it.split(/[\s\xad-]|(?<=[a-z])(?=[A-Z])/).map((w) => w.length));

// Joined phrases such as MashaAllah may wrap before the capital, never mid-name.
const breakable = (it: string) =>
  it.split(/(?<=[a-z])(?=[A-Z])/).flatMap((part, i) => (i === 0 ? [part] : [<wbr key={i} />, part]));

// Tiles glide into their new places on shuffle and solve where the browser supports view transitions.
function glide(update: () => void) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  document.startViewTransition(() => flushSync(update));
}

export function GroupBand({ group, surahs, index }: { group: Group; surahs: SurahRef[]; index?: number }) {
  const [s, a] = group.ref?.split(":").map(Number) ?? [];
  return (
    <li className={`ic-band is-l${group.level}`} style={index === undefined ? undefined : { viewTransitionName: `ic-band-${index}` }}>
      <b>{group.name}</b>
      <span className="ic-band-items">{group.items.join(" · ")}</span>
      <span className="ic-why">
        {group.why}
        {s && surahs[s - 1] && (
          <>
            {" "}
            <a href={`${surahs[s - 1].href}/${a}`} target="_blank" rel="noopener">
              {surahs[s - 1].name} {s}:{a}&nbsp;↗
            </a>
          </>
        )}
      </span>
    </li>
  );
}

function Lanterns({ left }: { left: number }) {
  return (
    <span className="ic-lanterns" aria-label={`${left} mistakes left`}>
      {Array.from({ length: MISTAKES }, (_, i) => (
        <svg key={i} viewBox="0 0 16 24" className={i < left ? "is-lit" : ""} aria-hidden="true">
          <path d="M8 1v3M5 4h6l1 3H4zM4 7h8l1 10-5 4-5-4z" />
        </svg>
      ))}
    </span>
  );
}

export function Board(p: Props) {
  const { groups } = p;
  const size = groups[0].items.length;
  const all = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const fx = effects(p.muted);
  const [guesses, setGuesses] = useState<string[][]>(p.initial?.guesses ?? []);
  const [hints, setHints] = useState(p.initial?.hints ?? 0);
  const [order, setOrder] = useState(() => shuffle(all));
  const [picked, setPicked] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [pair, setPair] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const { solved, mistakes, lost, won } = replay(groups, guesses);
  const over = won || lost;
  const done = new Set(solved.flatMap((g) => g.items));
  const left = order.filter((it) => !done.has(it));
  const open = [...groups].sort((a, b) => a.level - b.level).filter((g) => !solved.includes(g));
  const bands = lost ? [...solved, ...open] : solved;

  const finish = (r: { solved: boolean; mistakes: number; hints: number }, solvedGroups: Group[]) => {
    const full: Result = { ...r, xp: xpFor(groups, r, solvedGroups) };
    p.onFinish(full);
    setResult(full);
    if (full.solved) fx.win();
  };

  // A daily board reopened after it was finished goes straight to its result.
  useEffect(() => {
    if (over) setResult({ solved: won, mistakes, hints, xp: xpFor(groups, { solved: won, mistakes, hints }, solved) });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the restored state matters
  }, []);

  const toggle = (it: string) => {
    if (over) return;
    setNote("");
    fx.tap();
    setPicked((s) => (s.includes(it) ? s.filter((x) => x !== it) : s.length < size ? [...s, it] : s));
  };

  const submit = () => {
    if (guesses.some((g) => sameSet(g, picked))) {
      setNote("You already tried that group.");
      return;
    }
    const next = [...guesses, picked];
    const r = replay(groups, next);
    const right = r.solved.length > solved.length;
    p.onGuess?.(next, hints, r.won || r.lost, r.won);
    if (right) {
      fx.hit(r.solved.length);
      glide(() => {
        setGuesses(next);
        setPicked([]);
        setPair((pr) => pr.filter((it) => !r.solved.at(-1)!.items.includes(it)));
        setNote("");
      });
    } else {
      fx.miss();
      setGuesses(next);
      const close = groups.some((g) => picked.filter((it) => g.items.includes(it)).length === size - 1);
      setNote(r.lost ? "Out of mistakes. Here is how they link." : close ? "One away…" : "Not a group.");
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
    if (r.won || r.lost) setTimeout(() => finish({ solved: r.won, mistakes: r.mistakes, hints }, r.solved), r.won ? 1100 : 2200);
  };

  const revealTheme = () => {
    const g = open.find((x) => !themes.includes(x.name));
    if (!g) return;
    setThemes([...themes, g.name]);
    setHints(hints + 1);
  };

  const showPair = () => {
    const g = open.find((x) => !x.items.some((it) => pair.includes(it)));
    if (!g) return;
    setPair([...pair, ...shuffle(g.items).slice(0, 2)]);
    setHints(hints + 1);
    setNote("Two tiles that belong together now glow.");
  };

  const stars = result ? starsFor(result) : 0;

  return (
    <Stage
      label={p.label}
      art={p.art}
      progress={result ? 1 : solved.length / groups.length}
      muted={p.muted}
      onMute={p.onMute}
      onClose={p.onClose}
      screen={result ? "done" : "board"}
      status={
        <>
          <span className="gs-lv">{p.label}</span>
          <Lanterns left={MISTAKES - mistakes} />
        </>
      }
    >
      {result ? (
        <div className="gs-round gs-complete ic-end" aria-live="polite">
          <p className="gs-kicker" tabIndex={-1}>{result.solved ? p.heading : "Out of mistakes"}</p>
          <Stars stars={stars} />
          <h2 className="gs-title">{!result.solved ? "So close" : stars === 3 ? "Flawless" : stars === 2 ? "Well done" : "Board cleared"}</h2>
          <dl className="gs-tally">
            <div><dt>XP earned</dt><dd>+{result.xp}</dd></div>
            <div><dt>Mistakes</dt><dd>{result.mistakes}</dd></div>
            <div><dt>Hints</dt><dd>{result.hints}</dd></div>
          </dl>
          <section className="ic-learn" aria-label="What links them">
            <h3>What links them</h3>
            <ol className="ic-bands">
              {[...groups].sort((a, b) => a.level - b.level).map((g) => (
                <GroupBand key={g.name} group={g} surahs={p.surahs} />
              ))}
            </ol>
          </section>
          <div className="gs-actions">{p.actions(result)}</div>
        </div>
      ) : (
        <div className="gs-round ic-round">
          <p className="gs-kicker" tabIndex={-1}>
            Find {groups.length} groups of {size}
          </p>
          {bands.length > 0 && (
            <ol className="ic-bands" aria-label="Groups found">
              {bands.map((g) => (
                <GroupBand key={g.name} group={g} surahs={p.surahs} index={groups.indexOf(g)} />
              ))}
            </ol>
          )}
          {themes.some((t) => open.some((g) => g.name === t)) && !over && (
            <ul className="ic-themes" aria-label="Revealed themes">
              {open
                .filter((g) => themes.includes(g.name))
                .map((g) => (
                  <li key={g.name} className={`is-l${g.level}`}>
                    One group: <b>{g.name}</b>
                  </li>
                ))}
            </ul>
          )}
          {!over && (
            <ul className={cx("ic-grid", size === 3 && "is-three", shake && "is-shaking")} aria-label="Words">
              {left.map((it) => (
                <li key={it} style={{ viewTransitionName: `ic-tile-${all.indexOf(it)}` }}>
                  <button
                    type="button"
                    className={cx("ic-tile", picked.includes(it) && "is-picked", pair.includes(it) && "is-paired")}
                    style={{ "--n": longest(it) } as React.CSSProperties}
                    aria-pressed={picked.includes(it)}
                    onClick={() => toggle(it)}
                  >
                    <span>{breakable(it)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="ic-note" role="status">
            {note}
          </p>
          {!over && (
            <>
              <div className="ic-controls">
                <button type="button" className="ic-tool" onClick={() => glide(() => setOrder(shuffle(order)))} aria-label="Shuffle the tiles">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.6 0 2.8-1.4 3.8-3M14 7h6M17 4l3 3-3 3M17 14l3 3-3 3" />
                  </svg>
                </button>
                <button type="button" className="ic-tool" onClick={() => setPicked([])} disabled={picked.length === 0} aria-label="Deselect all">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
                <button type="button" className="gs-cta ic-submit" onClick={submit} disabled={picked.length !== size}>
                  Submit
                </button>
              </div>
              <div className="ic-hints">
                <button type="button" className="gs-hint" onClick={revealTheme} disabled={!open.some((g) => !themes.includes(g.name))}>
                  Reveal a theme <small>costs a star</small>
                </button>
                <button type="button" className="gs-hint" onClick={showPair} disabled={!open.some((g) => !g.items.some((it) => pair.includes(it)))}>
                  Show a pair <small>costs a star</small>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Stage>
  );
}
