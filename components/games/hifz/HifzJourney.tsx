"use client";

import { useEffect, useRef, useState } from "react";
import { MEMORIZATION_DIR } from "@/lib/games";
import { ChapterBanner, Ring } from "../JourneyMap";
import { chapters, fold, levelKey, type Level } from "./journey";
import { Play, type SurahInfo } from "./Play";
import type { Ref, Verse } from "./plan";
import { dueReview, finish, loadProgress, nextLevel, playedToday, setMuted, streak, type Progress } from "./progress";

// `key` is the folded transliteration, common spellings and meaning, so "yaseen" and "rehman" find their surah.
export type HifzSurah = SurahInfo & { ar: string; verses: number; key: string };
type Session = { level: number | null; review: Ref[] };

const ART = ["h1", "h2", "h3", "h4", "h5", "h6"].map((a) => `/games/quran-memorization-test/art/${a}.webp`);
const art = (c: number) => ART[c % ART.length];
const TOTAL_VERSES = 6236;

export function HifzJourney({ levels, surahs }: { levels: Level[]; surahs: HifzSurah[] }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [verses, setVerses] = useState<Record<number, Verse[]>>({});
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const loading = useRef(new Set<number>());
  const groups = chapters(levels);

  const fetchSurahs = (ids: number[]) => {
    setFailed(false);
    for (const s of new Set(ids)) {
      if (verses[s] || loading.current.has(s)) continue;
      loading.current.add(s);
      fetch(`${MEMORIZATION_DIR}/${s}.json`)
        .then((r) => {
          if (!r.ok) throw new Error(`${r.status}`);
          return r.json();
        })
        .then((v: Verse[]) => setVerses((all) => ({ ...all, [s]: v })))
        .catch(() => setFailed(true))
        .finally(() => loading.current.delete(s));
    }
  };

  const play = (level: number) => {
    fetchSurahs([levels[level].s]);
    setSession({ level, review: [] });
  };
  const startReview = (p: Progress) => {
    const review = dueReview(p);
    fetchSurahs(review.map((r) => r.s));
    setSession({ level: null, review });
  };

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    // A link like /games/quran-memorization-test?surah=36 opens that surah's first level.
    const id = Number(new URLSearchParams(location.search).get("surah"));
    const first = levels.findIndex((l) => l.s === id);
    if (first >= 0) play(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once after saved progress loads
  }, []);

  if (!progress) return <div className="gs-map is-loading" aria-busy="true" />;

  const current = nextLevel(progress, levels);
  const done = current >= levels.length;
  const starred = levels.filter((l) => progress.stars[levelKey(l)]);
  const revised = starred.reduce((n, l) => n + l.to - l.from + 1, 0);
  const pct = (revised / TOTAL_VERSES) * 100;
  const due = dueReview(progress);
  const here = groups.findIndex((g) => g.levels.includes(Math.min(current, levels.length - 1)));
  const q = fold(query);
  const matches = q
    ? surahs
        .map((s, i) => ({ ...s, id: i + 1 }))
        .filter((s) => String(s.id) === q || s.key.includes(q) || s.ar.includes(query.trim()))
        .slice(0, 6)
    : [];
  const label = (l: Level) => {
    const s = surahs[l.s - 1];
    return l.from === 1 && l.to === s.verses ? s.name : `${s.name} ${l.from}–${l.to}`;
  };

  const s = session;
  const need = s ? (s.level === null ? s.review.map((r) => r.s) : [levels[s.level].s]) : [];
  const ready = s && need.every((id) => verses[id]);
  const chapterOf = (level: number) => groups.findIndex((g) => g.levels.includes(level));

  return (
    <div className="gs-map">
      <section className="gs-summary hz-summary" aria-label="Your progress">
        <Ring fraction={pct > 0 ? Math.max(0.02, pct / 100) : 0} label={`You have revised ${pct.toFixed(1)}% of the Quran's verses`}>
          <b>{pct < 10 && pct > 0 ? pct.toFixed(1) : Math.round(pct)}%</b>
          <small>of the Quran</small>
        </Ring>
        <dl>
          <div><dt>Levels</dt><dd>{starred.length}<small>/{levels.length}</small></dd></div>
          <div><dt>Day streak</dt><dd className={playedToday(progress) ? "is-lit" : ""}>{streak(progress)}</dd></div>
          <div><dt>XP</dt><dd>{progress.xp.toLocaleString("en")}</dd></div>
        </dl>
        <button type="button" className="gs-cta gs-continue" onClick={() => play(done ? levels.length - 1 : current)}>
          {done ? "Revise the last level" : current === 0 ? "Start with Al-Fatihah" : `Continue · ${label(levels[current])}`}
        </button>
        {due.length > 0 && (
          <button type="button" className="hz-review" onClick={() => startReview(progress)}>
            <b>Daily review</b>
            <span>{due.length} verse{due.length === 1 ? "" : "s"} to strengthen</span>
          </button>
        )}
      </section>

      <div className="hz-search">
        <label htmlFor="hz-q">Already know a surah? Jump to it</label>
        <input id="hz-q" type="search" placeholder="Name or number, e.g. Yasin or 67" value={query} onChange={(e) => setQuery(e.target.value)} />
        {matches.length > 0 && (
          <ul>
            {matches.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => play(levels.findIndex((l) => l.s === m.id))}>
                  <span>{m.id}. {m.name}</span>
                  <span className="ar" lang="ar" dir="rtl">{m.ar}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ol className="gs-chapters hz-chapters">
        {groups.map((g, c) => {
          const locked = g.levels[0] > current;
          const isHere = c === here;
          const count = g.levels.filter((l) => progress.stars[levelKey(levels[l])]).length;
          const expanded = !locked && (isHere || open === c);
          // Only the next two locked parts are listed; the rest collapse into one line below.
          if (locked && c > here + 2) return null;
          if (locked) {
            return (
              <li key={c} className="hz-locked">
                <MiniRing value={0} />
                <span><b>{g.name}</b> · {g.levels.length} levels</span>
                <svg className="hz-lock" viewBox="0 0 24 24" role="img" aria-label="Locked">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 018 0v3" />
                </svg>
              </li>
            );
          }
          return (
            <li key={c} className={["gs-chapter", isHere && "is-here"].filter(Boolean).join(" ")}>
              <ChapterBanner
                art={art(c)}
                kicker={g.juz === 0 ? "Start here" : `Part ${g.juz} of 30`}
                name={g.name}
                line={
                  <>
                    {surahs[levels[g.levels[0]].s - 1].name}
                    {levels[g.levels.at(-1)!].s !== levels[g.levels[0]].s && ` to ${surahs[levels[g.levels.at(-1)!].s - 1].name}`}
                  </>
                }
                expanded={expanded}
                onToggle={() => !isHere && setOpen(open === c ? null : c)}
              >
                <span className="hz-banner-ring">
                  <MiniRing value={count / g.levels.length} />
                  {count}/{g.levels.length}
                </span>
              </ChapterBanner>
              {expanded && (
                <ol className="gs-path hz-path">
                  {g.levels.map((l, k) => {
                    const st = progress.stars[levelKey(levels[l])] ?? 0;
                    const state = st ? "is-done" : l === current ? "is-current" : l < current ? "is-done" : "is-locked";
                    return (
                      <li key={l} style={{ "--x": `${Math.sin(k * 0.9) * 30}%` } as React.CSSProperties}>
                        <button
                          type="button"
                          className={`gs-node ${state}`}
                          disabled={state === "is-locked"}
                          onClick={() => play(l)}
                          aria-label={`${label(levels[l])}${st ? `, ${st} stars` : state === "is-locked" ? ", locked" : ""}`}
                        >
                          <span>{l + 1}</span>
                        </button>
                        <span className="hz-node-name">{label(levels[l])}</span>
                        {st > 0 && <span className="gs-node-stars" aria-hidden="true">{"★".repeat(st)}{"☆".repeat(3 - st)}</span>}
                        {state === "is-current" && <span className="gs-node-tag">Play</span>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
        {groups.length - 1 > here + 2 && (
          <li className="hz-locked hz-more">
            <span>
              <b>{groups.length - 1 - (here + 2)} more parts</b> ahead, all the way to {groups.at(-1)!.name}
            </span>
          </li>
        )}
      </ol>

      {s &&
        (ready ? (
          <Play
            key={s.level ?? "review"}
            level={s.level}
            levels={levels}
            review={s.review}
            verses={verses}
            surahs={surahs}
            art={art(s.level === null ? here : chapterOf(s.level))}
            title={s.level === null ? "Daily review" : `Level ${s.level + 1} · ${label(levels[s.level])}`}
            progress={progress}
            onFinish={(r) => {
              const next = finish(progress, levels, r);
              setProgress(next);
              return next;
            }}
            onNext={
              s.level === null ? (done ? null : () => play(current)) : s.level + 1 < levels.length ? () => play(s.level! + 1) : null
            }
            onClose={() => setSession(null)}
            onMute={() => setProgress(setMuted(progress, !progress.muted))}
          />
        ) : (
          <div className="gs-stage is-loading" role="status">
            {failed ? (
              <div className="gs-failed">
                <p>This surah could not load. Check your connection and try again.</p>
                <button type="button" className="gs-cta" onClick={() => fetchSurahs(need)}>
                  Try again
                </button>
                <button type="button" className="gs-ghost" onClick={() => setSession(null)}>
                  Back to the journey
                </button>
              </div>
            ) : (
              <span className="gs-spinner" aria-label="Loading" />
            )}
          </div>
        ))}
    </div>
  );
}


function MiniRing({ value }: { value: number }) {
  const len = 2 * Math.PI * 9;
  return (
    <svg className="hz-mini" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" className="hz-mini-track" />
      {value > 0 && <circle cx="12" cy="12" r="9" className="hz-mini-fill" strokeDasharray={`${value * len} ${len}`} />}
    </svg>
  );
}
