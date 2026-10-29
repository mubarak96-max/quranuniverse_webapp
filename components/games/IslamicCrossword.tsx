"use client";

import { useEffect, useState } from "react";
import { CROSSWORD_LEVELS, CROSSWORD_PUZZLES } from "@/lib/games";
import { DailyStats, ShareBar } from "./DailyResult";
import { clock, type Puzzle } from "./crossword/grid";
import { Play, type Finish } from "./crossword/Play";
import { PrintSheet } from "./crossword/PrintSheet";
import { finishLevel, loadJourney, markPlayed, nextLevel, playedToday, setMuted, streak, type Journey } from "./crossword/progress";
import { dailyStats, useDaily } from "./useDaily";

// Daily records keep their original shape so streaks from before the journey still count; h is help used.
type Saved = { l: Record<string, string>; done: boolean; clean: boolean; secs: number; h?: number };
type Mode = { kind: "level"; level: number } | { kind: "daily" };

const KEY = "qu:islamic-crossword";
const PER = CROSSWORD_LEVELS.perChapter;

const CHAPTERS = [
  { name: "The Study", line: "Small grids of answers every Muslim knows." },
  { name: "The Caravanserai", line: "Prayer, fasting and the words of worship." },
  { name: "The Harbour", line: "Bigger grids: surahs, places and companions." },
  { name: "The Mountain Path", line: "Battles, journeys and the life of the Prophet." },
  { name: "The Minaret", line: "Harder clues from the Quran's stories." },
  { name: "The Observatory", line: "Full-size grids for the seasoned solver." },
];

const art = (c: number) => `/games/islamic-crossword/art/ch${c + 1}.webp`;

export function IslamicCrossword() {
  const daily = useDaily<Puzzle, Saved>(CROSSWORD_PUZZLES, KEY);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [levels, setLevels] = useState<Puzzle[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [printing, setPrinting] = useState<"blank" | "answers" | null>(null);

  const fetchLevels = () => {
    setFailed(false);
    fetch(CROSSWORD_LEVELS.file)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(setLevels, () => setFailed(true));
  };

  useEffect(() => {
    setJourney(loadJourney());
    fetchLevels();
  }, []);

  useEffect(() => {
    if (!printing) return;
    const reset = () => setPrinting(null);
    addEventListener("afterprint", reset);
    print();
    return () => removeEventListener("afterprint", reset);
  }, [printing]);

  if (!journey) return <div className="gs-map is-loading" aria-busy="true" />;

  const count = CROSSWORD_LEVELS.levels;
  const current = nextLevel(journey, count);
  const done = current >= count;
  const chapters = Math.ceil(count / PER);
  const totalStars = Object.values(journey.stars).reduce((n, s) => n + s, 0);
  const { today, day, puzzle, practice } = daily;
  const todays = today !== null ? daily.saved[today] : undefined;
  const stats = today !== null ? dailyStats(daily.saved, today, (r) => r.done, (r) => r.clean) : null;
  const toggleMute = () => setJourney(setMuted(journey, !journey.muted));

  const playLevel = (level: number) => setMode({ kind: "level", level });

  const levelEnd = (level: number) => (
    <div className="gs-actions">
      {level + 1 < count && (
        <button type="button" className="gs-cta" onClick={() => playLevel(level + 1)} autoFocus>
          {(level + 1) % PER === 0 ? `Enter ${CHAPTERS[(level + 1) / PER].name}` : `Level ${level + 2}`}
        </button>
      )}
      <button type="button" className="gs-ghost" onClick={() => setMode(null)}>
        Back to the map
      </button>
    </div>
  );

  const dailyEnd = (f: Finish) =>
    practice || today === null ? (
      <div className="gs-actions">
        <button type="button" className="gs-cta" onClick={daily.openRandom}>
          Another past crossword
        </button>
        <button type="button" className="gs-ghost" onClick={() => setMode(null)}>
          Back to the map
        </button>
      </div>
    ) : (
      <div className="cw-daily-end">
        {stats && <DailyStats {...stats} rate="Solo %" />}
        <ShareBar
          text={`Islamic Crossword #${today + 1} ${"★".repeat(f.stars)}${"☆".repeat(3 - f.stars)} in ${clock(f.secs)}${f.help ? ` with ${f.help} help` : ""}\nquranuniverse.app/games/islamic-crossword`}
        />
        <button type="button" className="gs-ghost" onClick={() => setMode(null)}>
          Back to the map
        </button>
      </div>
    );

  return (
    <div className="gs-map cw-map">
      <section className="gs-summary" aria-label="Your progress">
        <div className="cw-summary-head">
          <p className="gs-eyebrow">Crossword journey</p>
          <h2>{done ? "Every grid solved" : `Level ${current + 1} of ${count}`}</h2>
          <div className="gs-meter" aria-hidden="true">
            <i style={{ width: `${(Math.min(current, count) / count) * 100}%` }} />
          </div>
        </div>
        <dl>
          <div><dt>Stars</dt><dd>{totalStars}<small>/{count * 3}</small></dd></div>
          <div><dt>Day streak</dt><dd className={playedToday(journey) ? "is-lit" : ""}>{streak(journey)}</dd></div>
          <div><dt>XP</dt><dd>{journey.xp.toLocaleString("en")}</dd></div>
        </dl>
        <button type="button" className="gs-cta gs-continue" onClick={() => playLevel(done ? count - 1 : current)} disabled={!levels}>
          {!levels ? "Loading…" : done ? "Replay the last grid" : current === 0 ? "Start the journey" : `Continue · Level ${current + 1}`}
        </button>
        {failed && (
          <p className="cw-error" role="alert">
            The levels could not load.{" "}
            <button type="button" onClick={fetchLevels}>
              Try again
            </button>
          </p>
        )}
      </section>

      <section className="cw-daily" aria-label="Daily crossword">
        <div>
          <p className="gs-eyebrow">Daily crossword{today !== null ? ` #${today + 1}` : ""}</p>
          <h2>{todays?.done ? `Solved in ${clock(todays.secs)}` : todays?.l && Object.values(todays.l).some(Boolean) ? "In progress" : "A new grid every day"}</h2>
          <p>Same 13×13 grid for everyone today. Solve it without help to grow your solo streak.</p>
        </div>
        <div className="cw-daily-actions">
          <button
            type="button"
            className="gs-cta"
            disabled={!puzzle}
            onClick={() => {
              if (practice) daily.openToday();
              setMode({ kind: "daily" });
            }}
          >
            {todays?.done ? "See today's grid" : "Play today's crossword"}
          </button>
          <button type="button" className="cw-link" onClick={() => setPrinting("blank")} disabled={!puzzle || practice}>
            Print
          </button>
          <button type="button" className="cw-link" onClick={() => setPrinting("answers")} disabled={!puzzle || practice}>
            Print with answers
          </button>
        </div>
      </section>

      <ol className="gs-chapters">
        {CHAPTERS.slice(0, chapters).map((ch, c) => {
          const list = Array.from({ length: PER }, (_, k) => c * PER + k);
          const locked = c * PER > current;
          const stars = list.reduce((n, l) => n + (journey.stars[l] ?? 0), 0);
          return (
            <li key={c} className={locked ? "gs-chapter is-locked" : "gs-chapter"}>
              <div className="gs-banner cw-banner" style={{ "--art": `url(${art(c)})` } as React.CSSProperties}>
                <span className="gs-banner-n">Chapter {c + 1}</span>
                <b>{ch.name}</b>
                <span className="gs-banner-line">{locked ? `Unlocks at level ${c * PER + 1}` : ch.line}</span>
                {!locked && <span className="gs-banner-stars">★ {stars}/{PER * 3}</span>}
              </div>
              {!locked && (
                <ol className="cw-levels">
                  {list.map((l) => {
                    const s = journey.stars[l] ?? 0;
                    const state = s ? "is-done" : l === current ? "is-current" : "is-locked";
                    return (
                      <li key={l}>
                        <button
                          type="button"
                          className={`cw-level ${state}`}
                          disabled={state === "is-locked" || !levels}
                          onClick={() => playLevel(l)}
                          aria-label={`Level ${l + 1}${s ? `, ${s} stars` : state === "is-locked" ? ", locked" : ""}`}
                        >
                          <small>{l + 1}</small>
                          {s ? (
                            <span className="cw-level-stars" aria-hidden="true">{"★".repeat(s)}{"☆".repeat(3 - s)}</span>
                          ) : state === "is-current" ? (
                            <span className="cw-level-play">Play</span>
                          ) : (
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z" /></svg>
                          )}
                          {journey.best[l] !== undefined && <em>{clock(journey.best[l])}</em>}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      {mode?.kind === "level" && levels && (
        <Play
          key={`level-${mode.level}`}
          puzzle={levels[mode.level]}
          label={`Level ${mode.level + 1}`}
          title={`Level ${mode.level + 1} · ${CHAPTERS[Math.floor(mode.level / PER)].name}`}
          art={art(Math.floor(mode.level / PER))}
          muted={journey.muted}
          onMute={toggleMute}
          onClose={() => setMode(null)}
          onFinish={(f) => setJourney(finishLevel(journey, mode.level, f.stars, f.secs, f.xp))}
          end={() => levelEnd(mode.level)}
        />
      )}

      {mode?.kind === "daily" && puzzle && day !== null && (
        <Play
          key={`daily-${day}`}
          puzzle={puzzle}
          label={practice ? "Past crossword" : `Daily crossword #${(today ?? 0) + 1}`}
          title={practice ? "Past crossword" : `Daily #${(today ?? 0) + 1}`}
          art={art(5)}
          muted={journey.muted}
          resume={
            practice || !daily.saved[day]
              ? undefined
              : {
                  letters: daily.saved[day].l,
                  secs: daily.saved[day].secs,
                  help: daily.saved[day].h ?? (daily.saved[day].clean ? 0 : 1),
                  done: daily.saved[day].done,
                }
          }
          onMute={toggleMute}
          onClose={() => setMode(null)}
          onSave={practice ? undefined : (r) => daily.record(day, { l: r.letters, done: r.done, clean: r.help === 0, secs: r.secs, h: r.help })}
          onFinish={(f) => setJourney(markPlayed(journey, f.xp))}
          end={dailyEnd}
        />
      )}

      {puzzle && today !== null && !practice && printing && (
        <PrintSheet puzzle={puzzle} title={`Islamic Crossword #${today + 1}`} answers={printing === "answers"} />
      )}
    </div>
  );
}
