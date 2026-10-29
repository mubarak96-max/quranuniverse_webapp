"use client";

import { useEffect, useRef, useState } from "react";
import { VOCABULARY } from "@/lib/games";
import { ChapterBanner, Ring } from "../JourneyMap";
import { CHAPTERS, chapterOf, type ChapterVerses, type SurahRef, type Word } from "./plan";
import { Play } from "./Play";
import { coverage, finish, learned, loadProgress, nextLevel, playedToday, setMuted, streak, type Progress } from "./progress";

type Props = { words: Word[]; levels: number[][]; total: number; surahs: SurahRef[] };

const PER = VOCABULARY.perChapter;
const art = (c: number) => `/games/quran-vocabulary/art/ch${c + 1}.webp`;

export function WordQuest({ words, levels, total, surahs }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [verses, setVerses] = useState<Record<number, ChapterVerses>>({});
  const [open, setOpen] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = useRef(new Set<number>());

  useEffect(() => setProgress(loadProgress()), []);

  const current = progress ? nextLevel(progress, levels.length) : 0;
  const chapters = Math.ceil(levels.length / PER);

  const fetchChapter = (c: number) => {
    if (verses[c] || c >= chapters || loading.current.has(c)) return;
    loading.current.add(c);
    setFailed(false);
    fetch(`${VOCABULARY.verses}/${c}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((v: ChapterVerses) => setVerses((all) => ({ ...all, [c]: v })))
      .catch(() => setFailed(true))
      .finally(() => loading.current.delete(c));
  };

  // The next chapter loads early so the first level after a chapter break opens without a wait.
  useEffect(() => {
    if (!progress) return;
    const c = chapterOf(Math.min(current, levels.length - 1), PER);
    fetchChapter(c);
    if ((current % PER) >= PER - 2) fetchChapter(c + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the current level moves
  }, [progress, current]);

  const play = (level: number) => {
    fetchChapter(chapterOf(level, PER));
    setPlaying(level);
  };

  if (!progress) return <div className="gs-map is-loading" aria-busy="true" />;

  const done = current >= levels.length;
  const pct = coverage(progress, levels, words, total);
  const days = streak(progress);
  const known = learned(progress, levels).length;
  const loaded = playing !== null && verses[chapterOf(playing, PER)];

  return (
    <div className="gs-map">
      <section className="gs-summary" aria-label="Your progress">
        <Ring fraction={pct / ((words.reduce((n, w) => n + w.n, 0) / total) * 100)} label={`You recognise ${pct.toFixed(1)}% of the words in the Quran`}>
          <b>{pct.toFixed(1)}%</b>
          <small>of the Quran</small>
        </Ring>
        <dl>
          <div><dt>Words learned</dt><dd>{known}<small>/{words.length}</small></dd></div>
          <div><dt>Day streak</dt><dd className={playedToday(progress) ? "is-lit" : ""}>{days}</dd></div>
          <div><dt>XP</dt><dd>{progress.xp.toLocaleString("en")}</dd></div>
        </dl>
        <button type="button" className="gs-cta gs-continue" onClick={() => play(done ? levels.length - 1 : current)}>
          {done ? "Replay the last level" : current === 0 ? "Start your journey" : `Continue · Level ${current + 1}`}
        </button>
        {!playedToday(progress) && current > 0 && <p className="gs-nudge">Play one level today to keep your streak.</p>}
      </section>

      <ol className="gs-chapters">
        {CHAPTERS.slice(0, chapters).map((ch, c) => {
          const first = c * PER;
          const list = levels.slice(first, first + PER).map((_, k) => first + k);
          const locked = first > current;
          const here = chapterOf(Math.min(current, levels.length - 1), PER) === c;
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
                stars={locked ? undefined : `${stars}/${list.length * 3}`}
                locked={locked}
                expanded={expanded}
                onToggle={() => !here && setOpen(open === c ? null : c)}
              />
              {expanded && !locked && (
                <ol className="gs-path">
                  {list.map((l, k) => {
                    const s = progress.stars[l] ?? 0;
                    const state = l < current || s ? "is-done" : l === current ? "is-current" : "is-locked";
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

      {playing !== null &&
        (loaded ? (
          <Play
            key={playing}
            level={playing}
            words={words}
            levels={levels}
            total={total}
            perChapter={PER}
            verses={verses[chapterOf(playing, PER)]}
            surahs={surahs}
            progress={progress}
            onFinish={(r) => {
              const next = finish(progress, r);
              setProgress(next);
              return next;
            }}
            onNext={() => play(playing + 1)}
            onClose={() => setPlaying(null)}
            onMute={() => setProgress(setMuted(progress, !progress.muted))}
          />
        ) : (
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
        ))}
    </div>
  );
}

