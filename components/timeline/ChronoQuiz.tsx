"use client";

import { useMemo, useState } from "react";
import type { Stop } from "@/lib/timeline-types";
import { Share } from "./Share";

type Props = { stops: Stop[]; onOpen: (id: string) => void };

const ROUNDS = 10;
const MIN_GAP = 25;

// Ten pairs of dated moments at least MIN_GAP years apart. Only reliable dates are used, so the answer is never in dispute.
function deal(stops: Stop[]): [Stop, Stop][] {
  const pool = stops.filter((s) => s.type === "event" && s.year !== undefined && (s.precision === "exact" || s.precision === "approx"));
  const pairs: [Stop, Stop][] = [];
  for (let tries = 0; pairs.length < ROUNDS && tries < 500; tries++) {
    const a = pool[Math.floor(Math.random() * pool.length)];
    const b = pool[Math.floor(Math.random() * pool.length)];
    if (!a || !b || a === b || Math.abs(a.year! - b.year!) < MIN_GAP) continue;
    if (pairs.some(([x, y]) => [x, y].includes(a) || [x, y].includes(b))) continue;
    pairs.push([a, b]);
  }
  return pairs;
}

export function ChronoQuiz({ stops, onOpen }: Props) {
  const [game, setGame] = useState(0);
  const pairs = useMemo(() => deal(stops), [stops, game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [score, setScore] = useState(0);

  const pair = pairs[round];
  const done = round >= pairs.length;
  const first = pair && (pair[0].year! < pair[1].year! ? pair[0] : pair[1]);

  function pick(s: Stop) {
    if (picked) return;
    setPicked(s.id);
    if (s === first) setScore((n) => n + 1);
  }

  function next() {
    setPicked(undefined);
    setRound((r) => r + 1);
  }

  function again() {
    setGame((g) => g + 1);
    setRound(0);
    setScore(0);
    setPicked(undefined);
  }

  return (
    <section className="panel qz" aria-label="Which came first?">
      <header className="sp-head">
        <span>Which came first?</span>
        <span className="sp-count">{done ? "Done" : `${round + 1} / ${pairs.length}`}</span>
      </header>
      <div className="sp-body qz-body">
        {done ? (
          <div className="qz-end">
            <p className="qz-score">
              {score} <small>/ {pairs.length}</small>
            </p>
            <p className="sp-what">{score >= 8 ? "You know your history." : score >= 5 ? "Good instincts. The map can sharpen them." : "History is full of surprises. Play again?"}</p>
            <div className="qz-share">
              <button type="button" className="cta" onClick={again}>
                Play again
              </button>
              <Share
                title="Which came first?"
                text={`I scored ${score}/${pairs.length} on "Which came first?", the Islamic history timeline game. Can you beat it?`}
                path="/timeline#quiz"
                label="Share your score"
              />
            </div>
          </div>
        ) : (
          <>
            <p className="qz-ask">Tap the one that happened first.</p>
            <div className="qz-pair">
              {pair.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`qz-opt${picked ? (s === first ? " right" : picked === s.id ? " wrong" : "") : ""}`}
                  onClick={() => pick(s)}
                  disabled={!!picked && picked !== s.id && s !== first}
                >
                  <b>{s.title}</b>
                  <span>{s.place?.name}</span>
                  {picked && <time>{s.label.split(" · ")[0]}</time>}
                </button>
              ))}
            </div>
            {picked && (
              <div className="qz-after">
                <p>
                  {first.title} came {Math.abs(pair[0].year! - pair[1].year!).toLocaleString("en-US")} years earlier.{" "}
                  <button type="button" className="linkish" onClick={() => onOpen(first.id)}>
                    Read the story
                  </button>
                </p>
                <button type="button" className="cta" onClick={next}>
                  {round + 1 < pairs.length ? "Next pair →" : "See your score"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
