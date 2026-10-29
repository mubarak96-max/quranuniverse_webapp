"use client";

import { useEffect, useState } from "react";
import { CONNECTIONS_JOURNEY, CONNECTIONS_PUZZLES } from "@/lib/games";
import { Board } from "./connections/Board";
import {
  CHAPTERS,
  finishLevel,
  loadJourney,
  markPlayed,
  nextLevel,
  saveJourney,
  streak,
  type Group,
  type Journey,
  type SurahRef,
} from "./connections/logic";
import { DailyStats, ShareBar } from "./DailyResult";
import { ChapterBanner, Ring } from "./JourneyMap";
import { dailyStats, useDaily } from "./useDaily";

type Saved = { guesses: string[][]; done: boolean; won: boolean; hints?: number };

const KEY = "qu:islamic-connections";
const PER = CONNECTIONS_JOURNEY.perChapter;
const SQUARE = ["", "🟩", "🟨", "🟧", "🟦"];
const art = (c: number) => `/games/islamic-connections/art/ch${c + 1}.webp`;

export function IslamicConnections({ surahs }: { surahs: SurahRef[] }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [levels, setLevels] = useState<Group[][] | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const daily = useDaily<Group[], Saved>(CONNECTIONS_PUZZLES, KEY);

  const fetchLevels = () => {
    setFailed(false);
    fetch(CONNECTIONS_JOURNEY.file)
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

  if (!journey || (!levels && !failed)) return <div className="gs-map is-loading" aria-busy="true" />;
  if (!levels) {
    return (
      <div className="ic-load-failed" role="alert">
        <p>The puzzles did not load. Check your connection and try again.</p>
        <button type="button" className="gs-cta" onClick={fetchLevels}>
          Try again
        </button>
      </div>
    );
  }

  const count = levels.length;
  const current = nextLevel(journey, count);
  const allDone = current >= count;
  const chapterNow = Math.floor(Math.min(current, count - 1) / PER);
  const starTotal = Object.values(journey.stars).reduce((n, s) => n + s, 0);
  const cleared = Object.keys(journey.stars).length;
  const todaySaved = daily.today !== null ? daily.saved[daily.today] : undefined;
  const toggleMute = () => setJourney(saveJourney({ ...journey, muted: !journey.muted }));
  const play = (l: number) => {
    setAttempt((a) => a + 1);
    setPlaying(l);
  };

  return (
    <div className="gs-map ic-map">
      <section className="gs-summary ic-summary" aria-label="Your progress">
        <Ring fraction={cleared / count} label={`${cleared} of ${count} levels complete`}>
          <b>{cleared}</b>
          <small>of {count} levels</small>
        </Ring>
        <dl>
          <div><dt>Stars</dt><dd>{starTotal}<small>/{count * 3}</small></dd></div>
          <div><dt>Day streak</dt><dd className={journey.days.includes(daily.today ?? -1) ? "is-lit" : ""}>{streak(journey)}</dd></div>
          <div><dt>XP</dt><dd>{journey.xp.toLocaleString("en")}</dd></div>
        </dl>
        <button type="button" className="gs-cta gs-continue" onClick={() => play(allDone ? count - 1 : current)}>
          {allDone ? "Replay the last level" : current === 0 ? "Start the journey" : `Continue · Level ${current + 1}`}
        </button>
        <button type="button" className="ic-daily" onClick={() => setDailyOpen(true)} disabled={!daily.puzzle}>
          <span className="ic-daily-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM4 11h16M8 3v6M16 3v6" /></svg>
          </span>
          <span>
            <b>Daily puzzle{daily.today !== null ? ` #${daily.today + 1}` : ""}</b>
            <small>{todaySaved?.done ? (todaySaved.won ? "Solved today. Come back tomorrow." : "Played today. Come back tomorrow.") : "Four groups of four, the same board for everyone."}</small>
          </span>
          <span className={todaySaved?.done ? "ic-daily-tag is-done" : "ic-daily-tag"}>{todaySaved?.done ? "Done" : "Play"}</span>
        </button>
      </section>

      <ol className="gs-chapters">
        {CHAPTERS.slice(0, Math.ceil(count / PER)).map((ch, c) => {
          const first = c * PER;
          const list = levels.slice(first, first + PER).map((_, k) => first + k);
          const locked = first > current;
          const here = chapterNow === c;
          const expanded = here || open === c;
          const stars = list.reduce((n, l) => n + (journey.stars[l] ?? 0), 0);
          return (
            <li key={c} className={["gs-chapter", locked && "is-locked", here && "is-here"].filter(Boolean).join(" ")}>
              <ChapterBanner
                art={art(c)}
                ar={ch.ar}
                kicker={`Chapter ${c + 1}`}
                name={ch.name}
                line={locked ? `Unlocks at level ${first + 1}` : ch.line}
                stars={locked ? undefined : `${stars}/${list.length * 3}`}
                locked={locked}
                expanded={expanded}
                onToggle={() => !here && setOpen(open === c ? null : c)}
              />
              {expanded && !locked && (
                <ol className="gs-path">
                  {list.map((l, k) => {
                    const s = journey.stars[l] ?? 0;
                    const state = s ? "is-done" : l === current ? "is-current" : l < current ? "is-done" : "is-locked";
                    return (
                      <li key={l} style={{ "--x": `${Math.sin(k * 0.9) * 34}%` } as React.CSSProperties}>
                        <button
                          type="button"
                          className={`gs-node ${state}`}
                          disabled={state === "is-locked"}
                          onClick={() => play(l)}
                          aria-label={`Level ${l + 1}${s ? `, ${s} stars` : state === "is-locked" ? ", locked" : ""}`}
                        >
                          <span>{l + 1}</span>
                        </button>
                        {s > 0 && <span className="gs-node-stars" aria-hidden="true">{"★".repeat(s)}{"☆".repeat(3 - s)}</span>}
                        {state === "is-current" && <span className="gs-node-tag">Play</span>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      {playing !== null && (
        <Board
          key={`${playing}-${attempt}`}
          groups={levels[playing]}
          label={`Level ${playing + 1} · ${CHAPTERS[Math.floor(playing / PER)].name}`}
          heading={playing + 1 === count ? "Journey complete" : (playing + 1) % PER === 0 ? "Chapter complete" : "Level complete"}
          art={art(Math.floor(playing / PER))}
          muted={journey.muted}
          surahs={surahs}
          onMute={toggleMute}
          onClose={() => setPlaying(null)}
          onFinish={(r) => setJourney((j) => (j && r.solved ? finishLevel(j, playing, r) : j && saveJourney(markPlayed(j))))}
          actions={(r) => (
            <>
              {r.solved && playing + 1 < count ? (
                <button type="button" className="gs-cta" onClick={() => play(playing + 1)} autoFocus>
                  {(playing + 1) % PER === 0 ? `Enter ${CHAPTERS[(playing + 1) / PER].name}` : `Level ${playing + 2}`}
                </button>
              ) : (
                !r.solved && (
                  <button type="button" className="gs-cta" onClick={() => play(playing)} autoFocus>
                    Try again
                  </button>
                )
              )}
              <button type="button" className="gs-ghost" onClick={() => setPlaying(null)}>
                Back to the map
              </button>
            </>
          )}
        />
      )}

      {dailyOpen && daily.puzzle && daily.day !== null && daily.today !== null && (
        <Board
          key={`daily-${daily.day}`}
          groups={daily.puzzle}
          label={daily.practice ? "Practice puzzle" : `Daily #${daily.today + 1}`}
          heading={daily.practice ? "Practice solved" : "Daily solved"}
          art={art(daily.day % CHAPTERS.length)}
          muted={journey.muted}
          surahs={surahs}
          initial={daily.practice ? undefined : daily.saved[daily.day]}
          onMute={toggleMute}
          onClose={() => setDailyOpen(false)}
          onGuess={(guesses, hints, done, won) => !daily.practice && daily.record(daily.day!, { guesses, hints, done, won })}
          onFinish={(r) => setJourney((j) => j && saveJourney(markPlayed({ ...j, xp: j.xp + r.xp })))}
          actions={() => (
            <DailyEnd
              practice={daily.practice}
              stats={dailyStats(daily.saved, daily.today!, (s) => s.done, (s) => s.won)}
              share={
                daily.practice
                  ? ""
                  : `Islamic Connections #${daily.today! + 1}\n${(daily.saved[daily.day!]?.guesses ?? [])
                      .map((g) => g.map((it) => SQUARE[daily.puzzle!.find((grp) => grp.items.includes(it))!.level]).join(""))
                      .join("\n")}\nquranuniverse.app/games/islamic-connections`
              }
              onPractice={daily.openRandom}
              onToday={daily.openToday}
              onClose={() => setDailyOpen(false)}
            />
          )}
        />
      )}
    </div>
  );
}

function DailyEnd(p: {
  practice: boolean;
  stats: ReturnType<typeof dailyStats>;
  share: string;
  onPractice: () => void;
  onToday: () => void;
  onClose: () => void;
}) {
  return (
    <div className="ic-daily-end">
      {!p.practice && (
        <>
          <DailyStats {...p.stats} />
          <ShareBar text={p.share} />
        </>
      )}
      <button type="button" className="gs-ghost" onClick={p.onPractice}>
        {p.practice ? "Another practice puzzle" : "Play a practice puzzle"}
      </button>
      {p.practice && (
        <button type="button" className="gs-ghost" onClick={p.onToday}>
          Back to today&rsquo;s puzzle
        </button>
      )}
      <button type="button" className="gs-ghost" onClick={p.onClose}>
        Back to the map
      </button>
    </div>
  );
}

