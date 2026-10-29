"use client";

import { useEffect, useRef, useState } from "react";
import { SURAH_JOURNEY, SURAH_PUZZLES } from "@/lib/games";
import { dayNumber } from "./daily";
import { ChapterBanner, Ring } from "./JourneyMap";
import { Daily, loadDaily, MAX } from "./guess/Daily";
import { Level } from "./guess/Level";
import {
  art,
  CHAPTERS,
  loadProgress,
  nextLevel,
  playedDaily,
  playedToday,
  setMuted,
  streak,
  type Progress,
  type QuestVerse,
  type SurahPick,
} from "./guess/quest";

export type { SurahPick } from "./guess/quest";

const PER = SURAH_JOURNEY.perChapter;
const LEVELS = SURAH_JOURNEY.levels;
const chapterOf = (level: number) => Math.floor(level / PER);

export function GuessTheSurah({ surahs }: { surahs: SurahPick[] }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [daily, setDaily] = useState(false);
  const [chapters, setChapters] = useState<Record<number, QuestVerse[][]>>({});
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [dailyState, setDailyState] = useState<"new" | "won" | "lost">("new");
  const loading = useRef(new Set<number>());

  const refreshDaily = () => {
    const today = dayNumber(SURAH_PUZZLES.epoch);
    const g = loadDaily().days[today];
    setDailyState(!g ? "new" : g.g.includes(g.s) ? "won" : g.g.length >= MAX ? "lost" : "new");
  };

  useEffect(() => {
    setProgress(loadProgress());
    refreshDaily();
  }, []);

  const current = progress ? nextLevel(progress, LEVELS) : 0;

  const fetchChapter = (c: number) => {
    if (chapters[c] || c >= LEVELS / PER || loading.current.has(c)) return;
    loading.current.add(c);
    setFailed(false);
    fetch(`${SURAH_JOURNEY.dir}/${c}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((levels: QuestVerse[][]) => setChapters((all) => ({ ...all, [c]: levels })))
      .catch(() => setFailed(true))
      .finally(() => loading.current.delete(c));
  };

  useEffect(() => {
    if (progress) fetchChapter(chapterOf(Math.min(current, LEVELS - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when the current level moves
  }, [progress, current]);

  const play = (level: number) => {
    fetchChapter(chapterOf(level));
    setPlaying(level);
  };

  if (!progress) return <div className="gs-map is-loading" aria-busy="true" />;

  const done = current >= LEVELS;
  const found = progress.found.length;
  const mute = () => setProgress(setMuted(progress, !progress.muted));
  const verses = playing !== null ? chapters[chapterOf(playing)]?.[playing % PER] : undefined;

  return (
    <div className="gs-map">
      <section className="gs-summary" aria-label="Your progress">
        <Ring fraction={found / 114} label={`You have found ${found} of 114 surahs`}>
          <b>{found}</b>
          <small>of 114 surahs found</small>
        </Ring>
        <dl>
          <div><dt>Level</dt><dd>{Math.min(current + 1, LEVELS)}<small>/{LEVELS}</small></dd></div>
          <div><dt>Day streak</dt><dd className={playedToday(progress) ? "is-lit" : ""}>{streak(progress)}</dd></div>
          <div><dt>Points</dt><dd>{progress.xp.toLocaleString("en")}</dd></div>
        </dl>
        <button type="button" className="gs-cta gs-continue" onClick={() => play(done ? LEVELS - 1 : current)}>
          {done ? "Replay the last level" : current === 0 ? "Start the journey" : `Continue · Level ${current + 1}`}
        </button>
      </section>

      <button type="button" className="gq-daily-card" onClick={() => setDaily(true)}>
        <span className="gq-daily-art" style={{ backgroundImage: `url(${art(5)})` }} aria-hidden="true" />
        <span className="gq-daily-text">
          <small>Daily verse #{dayNumber(SURAH_PUZZLES.epoch) + 1}</small>
          <b>{dailyState === "new" ? "Today’s verse is waiting" : dailyState === "won" ? "Solved today, masha'Allah" : "Played today"}</b>
          <span>Six guesses, one verse, the same for everyone. New at midnight.</span>
        </span>
        <span className={`gq-daily-go is-${dailyState}`}>{dailyState === "new" ? "Play" : "Result"}</span>
      </button>

      <ol className="gs-chapters">
        {CHAPTERS.map((ch, c) => {
          const first = c * PER;
          const list = Array.from({ length: PER }, (_, k) => first + k);
          const locked = first > current;
          const here = chapterOf(Math.min(current, LEVELS - 1)) === c;
          const expanded = here || open === c;
          const stars = list.reduce((n, l) => n + (progress.stars[l] ?? 0), 0);
          return (
            <li key={c} className={["gs-chapter", locked && "is-locked", here && "is-here"].filter(Boolean).join(" ")}>
              <ChapterBanner
                art={art(c)}
                ar={ch.ar}
                kicker={`Chapter ${c + 1}`}
                name={ch.name}
                line={locked ? `Unlocks at level ${first + 1}` : ch.line}
                stars={locked ? undefined : `${stars}/${PER * 3}`}
                locked={locked}
                expanded={expanded}
                onToggle={() => !here && setOpen(open === c ? null : c)}
              />
              {expanded && !locked && (
                <ol className="gs-path">
                  {list.map((l, k) => {
                    const s = progress.stars[l] ?? 0;
                    const state = s ? "is-done" : l === current ? "is-current" : "is-locked";
                    return (
                      <li key={l} style={{ "--x": `${Math.sin(k * 0.9 + 1.2) * 34}%` } as React.CSSProperties}>
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

      {playing !== null &&
        (verses ? (
          <Level
            key={playing}
            level={playing}
            perChapter={PER}
            verses={verses}
            surahs={surahs}
            progress={progress}
            last={playing + 1 >= LEVELS}
            onProgress={setProgress}
            onNext={() => play(playing + 1)}
            onClose={() => setPlaying(null)}
            onMute={mute}
          />
        ) : (
          <div className="gs-stage is-loading" role="status">
            {failed ? (
              <div className="gs-failed">
                <p>This level could not load. Check your connection and try again.</p>
                <button type="button" className="gs-cta" onClick={() => play(playing)}>Try again</button>
                <button type="button" className="gs-ghost" onClick={() => setPlaying(null)}>Back to the map</button>
              </div>
            ) : (
              <span className="gs-spinner" aria-label="Loading level" />
            )}
          </div>
        ))}

      {daily && (
        <Daily
          surahs={surahs}
          muted={progress.muted}
          onMute={mute}
          onClose={() => {
            setDaily(false);
            refreshDaily();
          }}
          onPlayed={(solved) => setProgress((p) => (p ? playedDaily(p, solved) : p))}
        />
      )}
    </div>
  );
}

