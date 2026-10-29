"use client";

import { useEffect, useState } from "react";
import { share, untilTomorrow } from "./daily";

export function DailyStats(props: { played: number; won: number; current: number; best: number; rate?: string }) {
  const { played, won, current, best, rate = "Win %" } = props;
  return (
    <dl className="game-stats">
      <div><dt>Played</dt><dd>{played}</dd></div>
      <div><dt>{rate}</dt><dd>{played ? Math.round((won / played) * 100) : 0}</dd></div>
      <div><dt>Streak</dt><dd>{current}</dd></div>
      <div><dt>Best</dt><dd>{best}</dd></div>
    </dl>
  );
}

export function ShareBar({ text }: { text: string }) {
  const [clock, setClock] = useState(untilTomorrow());
  const [note, setNote] = useState("");

  useEffect(() => {
    const t = setInterval(() => setClock(untilTomorrow()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <div className="game-links">
        <button
          type="button"
          className="game-btn"
          onClick={async () => {
            const r = await share(text);
            setNote(r === "copied" ? "Result copied" : r === "failed" ? "Could not share" : "");
          }}
        >
          Share result
        </button>
        <span className="game-next">
          Next puzzle in <b>{clock}</b>
        </span>
      </div>
      {note && <p className="game-note" role="status">{note}</p>}
    </>
  );
}
