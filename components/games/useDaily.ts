"use client";

import { useEffect, useState } from "react";
import { dayNumber, fetchDay, load, save, streaks, type Schedule } from "./daily";

// Today's puzzle, a practice puzzle on demand, and one saved record per daily puzzle played.
export function useDaily<P, R>(schedule: Schedule & { epoch: string }, key: string) {
  const [today, setToday] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [puzzle, setPuzzle] = useState<P | null>(null);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState<Record<number, R>>({});

  const open = (d: number) => {
    setDay(d);
    setPuzzle(null);
    setError(false);
    fetchDay<P>(schedule, d).then(setPuzzle, () => setError(true));
  };

  useEffect(() => {
    const t = dayNumber(schedule.epoch);
    setToday(t);
    setSaved(load<Record<number, R>>(key, {}));
    open(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; schedule and key are module constants
  }, []);

  const record = (d: number, r: R) =>
    setSaved((prev) => {
      const next = { ...prev, [d]: r };
      save(key, next);
      return next;
    });

  return {
    today,
    day,
    puzzle,
    error,
    saved,
    record,
    practice: today !== null && day !== today,
    openToday: () => today !== null && open(today),
    openRandom: () => open(Math.floor(Math.random() * schedule.days)),
  };
}

// Played, won and streaks from saved records; `won` decides what counts as a win for each game.
export function dailyStats<R>(saved: Record<number, R>, today: number, done: (r: R) => boolean, won: (r: R) => boolean) {
  const results: Record<number, boolean> = {};
  for (const [d, r] of Object.entries(saved)) if (done(r)) results[Number(d)] = won(r);
  const played = Object.keys(results).length;
  return { played, won: Object.values(results).filter(Boolean).length, ...streaks(results, today) };
}
