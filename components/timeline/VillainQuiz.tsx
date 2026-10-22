"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Villain } from "@/lib/timeline-types";

// Fixed rather than random choices, so the server and the browser render the same first question.
function choicesFor(pool: Villain[], i: number) {
  const n = pool.length;
  return [pool[i], pool[(i + 3) % n], pool[(i + 5) % n]].sort((a, b) => a.name.localeCompare(b.name));
}

export function VillainQuiz({ villains, onOpen }: { villains: Villain[]; onOpen: (id: string) => void }) {
  const pool = useMemo(() => villains.filter((v) => v.said?.text), [villains]);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string>();
  const [score, setScore] = useState(0);

  const answer = pool[round % pool.length];
  const choices = useMemo(() => choicesFor(pool, round % pool.length), [pool, round]);

  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === answer.id) setScore((s) => s + 1);
  };

  return (
    <div className="vq" aria-live="polite">
      <p className="vq-head">
        <b>Who said it?</b>
        {round > 0 || picked ? (
          <span>
            {score} of {round + (picked ? 1 : 0)}
          </span>
        ) : null}
      </p>
      <blockquote className="vq-quote">{answer.said!.text}</blockquote>
      <div className="vq-choices">
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            className={picked ? (c.id === answer.id ? "right" : c.id === picked ? "wrong" : undefined) : undefined}
            onClick={() => pick(c.id)}
            disabled={!!picked && c.id !== answer.id && c.id !== picked}
          >
            {c.name}
          </button>
        ))}
      </div>
      {picked && (
        <p className="vq-after">
          <Link href={answer.said!.href}>Quran {answer.said!.ref}</Link>
          <button type="button" className="linkish" onClick={() => onOpen(answer.id)}>
            About {answer.name}
          </button>
          <button
            type="button"
            className="linkish"
            onClick={() => {
              setPicked(undefined);
              setRound((r) => r + 1);
            }}
          >
            Next quote →
          </button>
        </p>
      )}
    </div>
  );
}
