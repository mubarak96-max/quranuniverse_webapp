"use client";

// The knowledge check: one question at a time, the reason shown after each answer, the score kept with the day.
import { useState } from "react";
import type { Quiz as Q } from "@/lib/q30-types";
import { patchDay } from "./progress";

type Item = Q & { from?: number };

export function Quiz({ day, items }: { day: number; items: Item[] }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const done = i >= items.length;

  function pick(n: number) {
    if (picked !== null) return;
    setPicked(n);
    if (n === items[i].answer) setRight((r) => r + 1);
  }

  function next() {
    const end = i + 1 >= items.length;
    if (end) patchDay(day, { score: [right, items.length] });
    setI(i + 1);
    setPicked(null);
  }

  if (done) {
    return (
      <div className="qz qz-done">
        <p className="qz-score">
          <b>{right}</b> of {items.length}
        </p>
        <p>{right === items.length ? "Every answer right. Well read." : "Good. The pages are still here if you want another look."}</p>
        <button type="button" className="qz-again" onClick={() => {
            setI(0);
            setRight(0);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const q = items[i];
  return (
    <div className="qz">
      <p className="qz-step">
        Question {i + 1} of {items.length}
        {q.from && <span> · from Day {q.from}</span>}
      </p>
      <p className="qz-q">{q.q}</p>
      <ul className="qz-options">
        {q.options.map((o, n) => {
          const state = picked === null ? undefined : n === q.answer ? "right" : n === picked ? "wrong" : "dim";
          return (
            <li key={n}>
              <button type="button" onClick={() => pick(n)} data-state={state} disabled={picked !== null}>
                <i>{String.fromCharCode(65 + n)}</i>
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && (
        <div className="qz-why" role="status">
          <b>{picked === q.answer ? "Right." : "Not quite."}</b> {q.why}
          <button type="button" className="qz-next" onClick={next}>
            {i + 1 < items.length ? "Next question" : "See your score"}
          </button>
        </div>
      )}
    </div>
  );
}
