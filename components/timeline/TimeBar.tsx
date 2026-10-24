"use client";

import { useEffect, useMemo, useRef } from "react";
import { AXIS, tToYear, yearText, yearToT, type Chapter, type State, type Stop } from "@/lib/timeline-types";

type Props = {
  year: number;
  chapters: Chapter[];
  states: State[];
  stops: Stop[];
  current?: string;
  playing: boolean;
  onYear: (year: number) => void;
  onPlay?: (playing: boolean) => void;
};

// "5,400 years in 3 minutes": the compressed axis slows down through the Prophet's era and the caliphates.
export const PLAY_SECONDS = 180;
const EPIC_ROWS = 3;
const TICKS: [number, string, boolean?][] = [
  [-3000, "3000 BCE"],
  [-1000, "1000 BCE", true],
  [1, "1 CE", true],
  [622, "Hijra"],
  [1258, "1258", true],
  [1500, "1500"],
  [AXIS.max, "Today"],
];

// Muslim powers as thin bars above the axis, packed into a few rows like an epic strip.
function pack(states: State[]) {
  const rows: number[] = Array(EPIC_ROWS).fill(-Infinity);
  const out: { s: State; row: number }[] = [];
  for (const s of [...states].sort((a, b) => a.from - b.from)) {
    const row = rows.findIndex((end) => end < s.from);
    if (row < 0) continue;
    rows[row] = s.to;
    out.push({ s, row });
  }
  return out;
}

export function TimeBar({ year, chapters, states, stops, current, playing, onYear, onPlay }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const yearRef = useRef(year);
  yearRef.current = year;
  const epics = useMemo(() => pack(states.filter((s) => s.muslim && s.lane === "states")), [states]);
  const dated = useMemo(() => stops.filter((s) => s.type === "event" && s.year !== undefined && s.precision !== "unknown"), [stops]);
  // Built once: playback moves only the clip on the lit copy, not 400-odd dots a frame.
  const dots = useMemo(() => dated.map((s) => <i key={s.id} className={`k-${s.kind}`} style={{ left: `${yearToT(s.year!) * 100}%` }} />), [dated]);
  const marked = current ? dated.find((s) => s.id === current) : undefined;
  const t = yearToT(year);

  useEffect(() => {
    if (!playing || !onPlay) return;
    let raf = 0;
    let last = performance.now();
    let pos = yearToT(yearRef.current);
    if (pos >= 1) pos = 0;
    const step = (now: number) => {
      pos = Math.min(1, pos + Math.min(now - last, 100) / 1000 / PLAY_SECONDS);
      last = now;
      onYear(tToYear(pos));
      if (pos >= 1) onPlay(false);
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, onYear, onPlay]);

  const at = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    onYear(tToYear((clientX - r.left) / r.width));
  };

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    onPlay?.(false);
    e.currentTarget.setPointerCapture(e.pointerId);
    at(e.clientX);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const big = e.shiftKey ? 50 : year < 0 ? 25 : 1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") onYear(Math.min(AXIS.max, year + big));
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onYear(Math.max(AXIS.min, year - big));
    else if (e.key === "Home") onYear(AXIS.min);
    else if (e.key === "End") onYear(AXIS.max);
    else return;
    e.preventDefault();
    e.stopPropagation();
  }

  const chapter = chapters.find((c) => c.from !== undefined && year >= c.from && year <= c.to!);

  return (
    <div className={`tb${onPlay ? "" : " tb-quiet"}`}>
      {onPlay && (
        <button type="button" className={`tb-play${playing ? " on" : ""}`} onClick={() => onPlay(!playing)} aria-label={playing ? "Pause" : "Watch history unfold"}>
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <rect x="3" y="2" width="3.6" height="12" rx="1" />
              <rect x="9.4" y="2" width="3.6" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M4 2.2v11.6a.8.8 0 0 0 1.2.7l9.6-5.8a.8.8 0 0 0 0-1.4L5.2 1.5A.8.8 0 0 0 4 2.2Z" />
            </svg>
          )}
        </button>
      )}
      <div
        ref={track}
        className="tb-track"
        role="slider"
        tabIndex={0}
        aria-label="Year"
        aria-valuemin={AXIS.min}
        aria-valuemax={AXIS.max}
        aria-valuenow={year}
        aria-valuetext={`${yearText(year)}${chapter ? `, ${chapter.title}` : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && at(e.clientX)}
        onKeyDown={onKeyDown}
      >
        <div className="tb-epics" aria-hidden="true">
          {epics.map(({ s, row }) => (
            <i
              key={s.id}
              className={`c${s.color ?? 0}${year >= s.from && year <= s.to ? " on" : ""}`}
              style={{ left: `${yearToT(s.from) * 100}%`, width: `${Math.max(0.4, (yearToT(s.to) - yearToT(s.from)) * 100)}%`, top: `${row * 4}px` }}
            />
          ))}
        </div>
        <div className="tb-dots" aria-hidden="true">
          {dots}
        </div>
        <div className="tb-dots lit" style={{ clipPath: `inset(-4px ${(1 - t) * 100}% -4px -4px)` }} aria-hidden="true">
          {dots}
        </div>
        {marked && (
          <div className="tb-dots" aria-hidden="true">
            <i className={`k-${marked.kind} on`} style={{ left: `${yearToT(marked.year!) * 100}%` }} />
          </div>
        )}
        <div className="tb-chapters" aria-hidden="true">
          {chapters
            .filter((c) => c.from !== undefined)
            .map((c) => (
              <i
                key={c.id}
                className={c === chapter ? "on" : undefined}
                style={{ left: `${yearToT(c.from!) * 100}%`, width: `${Math.max(0.5, (yearToT(c.to!) - yearToT(c.from!)) * 100)}%` }}
              />
            ))}
        </div>
        <div className="tb-ticks" aria-hidden="true">
          {TICKS.map(([y, label, minor]) => (
            <span key={y} className={minor ? "minor" : undefined} style={{ left: `${yearToT(y) * 100}%` }}>
              {label}
            </span>
          ))}
        </div>
        <div className="tb-head" style={{ left: `${t * 100}%` }} aria-hidden="true">
          <i />
        </div>
      </div>
      {chapter && <p className="tb-chapter">{chapter.title}</p>}
    </div>
  );
}
