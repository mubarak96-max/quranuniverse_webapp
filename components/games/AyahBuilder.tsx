"use client";

import { useEffect, useRef, useState } from "react";
import { BUILDER_JOURNEY, BUILDER_PUZZLES } from "@/lib/games";
import { DailyPlay, type DailySaved } from "./builder/Daily";
import { builderArt, Play } from "./builder/Play";
import { CHAPTERS, type SurahRef, type Verse } from "./builder/plan";
import { finish, loadProgress, nextLevel, playedToday, setMuted, streak, type Progress } from "./builder/progress";
import { ChapterBanner } from "./JourneyMap";
import { dailyStats, useDaily } from "./useDaily";

const KEY = "qu:ayah-builder";
// Finishing the daily verse within this many slips counts as a win for its streak.
const ALLOWED = 2;

type Props = { surahs: SurahRef[]; chapters: number[]; versesPerLevel: number[] };

export function AyahBuilder({ surahs, chapters, versesPerLevel }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [dailyOpen, setDailyOpen] = useState(false);
  const [levels, setLevels] = useState<Record<number, Verse[][]>>({});
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const loading = useRef(new Set<number>());
  const daily = useDaily<Verse, DailySaved>(BUILDER_PUZZLES, KEY);

  useEffect(() => setProgress(loadProgress()), []);

  const total = chapters.reduce((a, b) => a + b, 0);
  const firstOf = (c: number) => chapters.slice(0, c).reduce((a, b) => a + b, 0);
  const chapterOf = (level: number) => {
    let c = 0;
    while (c < chapters.length - 1 && level >= firstOf(c + 1)) c++;
    return c;
  };
  const current = progress ? nextLevel(progress, total) : 0;

  const fetchChapter = (c: number) => {
    if (levels[c] || c >= chapters.length || loading.current.has(c)) return;
    loading.current.add(c);
    setFailed(false);
    fetch(`${BUILDER_JOURNEY.dir}/${c}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((v: Verse[][]) => setLevels((all) => ({ ...all, [c]: v })))
      .catch(() => setFailed(true))
      .finally(() => loading.current.delete(c));
  };

  // The chapter being played loads as soon as the map shows, so the first tap opens without a wait.
  useEffect(() => {
    if (progress) fetchChapter(chapterOf(Math.min(current, total - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the current level moves
  }, [progress, current]);

  const play = (level: number) => {
    fetchChapter(chapterOf(level));
    setPlaying(level);
  };

  if (!progress) return <div className="gs-map is-loading" aria-busy="true" />;

  const done = current >= total;
  const built = versesPerLevel.reduce((n, k, l) => n + (progress.stars[l] ? k : 0), 0);
  const days = streak(progress);
  const mute = () => setProgress(setMuted(progress, !progress.muted));
  const today = daily.today;
  const todaySaved = today !== null ? daily.saved[today] : undefined;

  const stage = () => {
    if (playing === null) return null;
    const c = chapterOf(playing);
    const list = levels[c];
    if (!list) {
      return (
        <div className="gs-stage is-loading" role="status">
          {failed ? (
            <div className="gs-failed">
              <p>This level could not load. Check your connection and try again.</p>
              <button type="button" className="gs-cta" onClick={() => play(playing)}>
                Try again
              </button>
              <button type="button" className="gs-ghost" onClick={() => setPlaying(null)}>
                Back to the map
              </button>
            </div>
          ) : (
            <span className="gs-spinner" aria-label="Loading level" />
          )}
        </div>
      );
    }
    return (
      <Play
        key={playing}
        level={playing}
        chapter={c}
        verses={list[playing - firstOf(c)]}
        pool={list.flat()}
        surahs={surahs}
        progress={progress}
        last={playing + 1 >= total}
        newChapter={playing + 1 < total && chapterOf(playing + 1) !== c}
        onFinish={(r) => setProgress(finish(progress, r))}
        onNext={() => play(playing + 1)}
        onClose={() => setPlaying(null)}
        onMute={mute}
      />
    );
  };

  return (
    <div className="gs-map ab-map">
      <section className="gs-summary" aria-label="Your progress">
        <div className="ab-summary-head">
          <span className="gs-eyebrow">Your journey</span>
          <b>
            {Math.min(current, total)}/{total} levels
          </b>
          <div className="gs-meter" aria-hidden="true">
            <i style={{ width: `${(Math.min(current, total) / total) * 100}%` }} />
          </div>
        </div>
        <dl>
          <div><dt>Verses built</dt><dd>{built}</dd></div>
          <div><dt>Day streak</dt><dd className={playedToday(progress) ? "is-lit" : ""}>{days}</dd></div>
          <div><dt>XP</dt><dd>{progress.xp.toLocaleString("en")}</dd></div>
        </dl>
        <button type="button" className="gs-cta gs-continue" onClick={() => play(done ? total - 1 : current)}>
          {done ? "Replay the last level" : current === 0 ? "Start building" : `Continue · Level ${current + 1}`}
        </button>
      </section>

      <button
        type="button"
        className={`ab-daily${todaySaved?.done ? " is-done" : ""}`}
        onClick={() => {
          daily.openToday();
          setDailyOpen(true);
        }}
        disabled={today === null}
      >
        <span className="ab-daily-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9 7 7 0 01-9-9z" /></svg>
        </span>
        <span>
          <b>Today&rsquo;s verse{today !== null ? ` #${today + 1}` : ""}</b>
          <small>{todaySaved?.done ? `Solved with ${todaySaved.mistakes} slip${todaySaved.mistakes === 1 ? "" : "s"} · see your stats` : "One verse for everyone, every day. Share your result."}</small>
        </span>
        <span className="ab-daily-go" aria-hidden="true">{todaySaved?.done ? "✓" : "→"}</span>
      </button>

      <ol className="gs-chapters">
        {CHAPTERS.slice(0, chapters.length).map((ch, c) => {
          const first = firstOf(c);
          const list = Array.from({ length: chapters[c] }, (_, k) => first + k);
          const locked = first > current;
          const here = chapterOf(Math.min(current, total - 1)) === c;
          const expanded = here || open === c;
          const stars = list.reduce((n, l) => n + (progress.stars[l] ?? 0), 0);
          return (
            <li key={c} className={["gs-chapter", locked && "is-locked", here && "is-here"].filter(Boolean).join(" ")}>
              <ChapterBanner
                art={builderArt(c)}
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
                    const s = progress.stars[l] ?? 0;
                    const state = s ? "is-done" : l === current ? "is-current" : "is-locked";
                    return (
                      <li key={l} style={{ "--x": `${Math.sin(k * 1.1) * 30}%` } as React.CSSProperties}>
                        {state === "is-current" && <span className="gs-node-tag">Build</span>}
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
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>

      {stage()}

      {dailyOpen &&
        (daily.puzzle && daily.day !== null && today !== null ? (
          <DailyPlay
            key={daily.day}
            verse={daily.puzzle}
            label={daily.practice ? "Practice verse" : `Daily verse #${today + 1}`}
            shareLabel={`Ayah Builder #${today + 1}`}
            surahs={surahs}
            saved={daily.practice ? undefined : daily.saved[daily.day]}
            practice={daily.practice}
            stats={dailyStats(daily.saved, today, (r) => r.done, (r) => r.mistakes <= ALLOWED)}
            muted={progress.muted}
            onMute={mute}
            onSave={daily.practice ? undefined : (r) => daily.record(daily.day!, r)}
            onPractice={daily.openRandom}
            onClose={() => setDailyOpen(false)}
          />
        ) : (
          <div className="gs-stage is-loading" role="status">
            {daily.error ? (
              <div className="gs-failed">
                <p>Today&rsquo;s verse could not load. Check your connection and try again.</p>
                <button type="button" className="gs-cta" onClick={daily.openToday}>
                  Try again
                </button>
                <button type="button" className="gs-ghost" onClick={() => setDailyOpen(false)}>
                  Back to the map
                </button>
              </div>
            ) : (
              <span className="gs-spinner" aria-label="Loading today's verse" />
            )}
          </div>
        ))}
    </div>
  );
}
