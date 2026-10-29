"use client";

import { useEffect, useState } from "react";
import { SURAH_PUZZLES } from "@/lib/games";
import { DailyStats, ShareBar } from "../DailyResult";
import { dayNumber, fetchDay, load, save, streaks } from "../daily";
import { Stage, sfx as effects } from "../Stage";
import { art, band, type QuestVerse, type SurahPick } from "./quest";
import { VerseRound } from "./VerseRound";

export type DailySaved = { days: Record<number, { g: number[]; s: number }> };
type Stats = { played: number; won: number; current: number; best: number; spread: number[] };

export const MAX = 6;
export const DAILY_KEY = "qu:guess-the-surah";
const SQUARE = { hit: "🟩", hot: "🟨", warm: "🟧", cold: "⬜" };

export const loadDaily = () => load<DailySaved>(DAILY_KEY, { days: {} });

export function dailyStats(saved: DailySaved, today: number): Stats {
  // Results are re-derived from the saved guesses, so there is no separate counter that could drift.
  const results: Record<number, boolean> = {};
  const spread = Array<number>(MAX).fill(0);
  for (const [d, { g, s }] of Object.entries(saved.days)) {
    const win = g.includes(s);
    if (win) spread[g.length - 1]++;
    if (win || g.length >= MAX) results[Number(d)] = win;
  }
  const { current, best } = streaks(results, today);
  return { played: Object.keys(results).length, won: Object.values(results).filter(Boolean).length, current, best, spread };
}

export function Daily({ surahs, muted, onMute, onClose, onPlayed }: {
  surahs: SurahPick[];
  muted: boolean;
  onMute: () => void;
  onClose: () => void;
  onPlayed: (solved: number | null) => void;
}) {
  const today = dayNumber(SURAH_PUZZLES.epoch);
  const [day, setDay] = useState(today);
  const [puzzle, setPuzzle] = useState<QuestVerse | null>(null);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState<DailySaved>(loadDaily);
  const [finished, setFinished] = useState(false);
  const practice = day !== today;
  const sfx = effects(muted);

  const open = (d: number) => {
    setDay(d);
    setPuzzle(null);
    setError(false);
    setFinished(false);
    fetchDay<QuestVerse>(SURAH_PUZZLES, d).then(setPuzzle, () => setError(true));
  };

  useEffect(() => {
    open(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open today's verse once
  }, []);

  const record = (g: number[]) => {
    if (practice || !puzzle) return;
    const next = { days: { ...saved.days, [day]: { g, s: puzzle.s } } };
    setSaved(next);
    save(DAILY_KEY, next);
    if (g.includes(puzzle.s) || g.length >= MAX) onPlayed(g.includes(puzzle.s) ? puzzle.s : null);
  };

  const guesses = practice ? [] : (saved.days[day]?.g ?? []);
  const over = puzzle && (guesses.includes(puzzle.s) || guesses.length >= MAX);
  const showResult = puzzle && (finished || (!practice && over));

  return (
    <Stage
      label="Today's verse"
      art={art(5)}
      progress={puzzle ? Math.min(1, (showResult ? MAX : guesses.length) / MAX) : 0}
      muted={muted}
      onMute={onMute}
      onClose={onClose}
      screen={`${day}-${showResult ? "r" : "p"}-${puzzle ? 1 : 0}`}
      status={<span className="gs-lv">{practice ? "Practice verse" : `Daily verse #${today + 1}`}</span>}
    >
      {error ? (
        <div className="gs-round gs-failed">
          <p className="gs-kicker" tabIndex={-1}>Could not load</p>
          <p>The verse did not load. Check your connection and try again.</p>
          <button type="button" className="gs-cta" onClick={() => open(day)}>Try again</button>
        </div>
      ) : !puzzle ? (
        <div className="gq-wait"><span className="gs-spinner" aria-label="Loading the verse" /></div>
      ) : showResult ? (
        <Result
          puzzle={puzzle}
          surahs={surahs}
          guesses={guesses}
          practice={practice}
          stats={dailyStats(saved, today)}
          today={today}
          onPractice={() => open(Math.floor(Math.random() * SURAH_PUZZLES.days))}
          onToday={() => open(today)}
        />
      ) : (
        <VerseRound
          kicker="Which surah is this verse from?"
          verse={puzzle}
          surahs={surahs}
          settings={{ choices: 0, tries: MAX, free: 0, translation: true, nearby: 0, hintsOnMiss: true }}
          initial={guesses}
          sfx={sfx}
          onGuess={record}
          cta="See your result"
          onDone={() => setFinished(true)}
        />
      )}
    </Stage>
  );
}

function Result({ puzzle, surahs, guesses, practice, stats, today, onPractice, onToday }: {
  puzzle: QuestVerse;
  surahs: SurahPick[];
  guesses: number[];
  practice: boolean;
  stats: Stats;
  today: number;
  onPractice: () => void;
  onToday: () => void;
}) {
  const answer = surahs[puzzle.s - 1];
  const won = guesses.includes(puzzle.s);
  const top = Math.max(1, ...stats.spread);
  const text = `Guess the Surah #${today + 1} ${won ? guesses.length : "X"}/${MAX}\n${guesses
    .map((id) => SQUARE[band(Math.abs(id - answer.id))])
    .join("")}\nquranuniverse.app/games/guess-the-surah`;
  return (
    <div className="gs-round gs-complete gq-daily">
      <p className="gs-kicker" tabIndex={-1}>{practice ? "Practice verse" : won ? `Solved in ${guesses.length} of ${MAX}` : "Not this time"}</p>
      <h2 className="gs-title">
        {answer.transliteration} <span className="ar" lang="ar" dir="rtl">{answer.name}</span>
      </h2>
      <p className="gq-reveal-meta">
        “{answer.meaning}” · verse {puzzle.s}:{puzzle.a} · {answer.place} · {answer.verses} verses
      </p>
      <a className="gq-link" href={`${answer.href}/${puzzle.a}`} target="_blank" rel="noopener">
        Read this verse with tafsir <span aria-hidden="true">↗</span>
      </a>
      {!practice && (
        <>
          <DailyStats {...stats} />
          <ol className="gq-spread" aria-label="Guess distribution">
            {stats.spread.map((n, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                <i style={{ width: `${Math.max(8, (n / top) * 100)}%` }} className={won && guesses.length === i + 1 ? "is-now" : ""}>
                  {n}
                </i>
              </li>
            ))}
          </ol>
          <ShareBar text={text} />
        </>
      )}
      <div className="gs-actions">
        <button type="button" className="gs-cta" onClick={onPractice}>
          {practice ? "Another practice verse" : "Practice with a random verse"}
        </button>
        {practice && (
          <button type="button" className="gs-ghost" onClick={onToday}>
            Back to today&rsquo;s verse
          </button>
        )}
      </div>
    </div>
  );
}
