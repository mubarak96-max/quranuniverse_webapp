"use client";

import { useEffect, useRef, useState } from "react";
import { AXIS, tToYear, yearText, yearToT, type Chapter } from "@/lib/timeline-types";
import { clampMapYear } from "@/lib/timeline-entry";

export function ExplorerYears({ year, chapters, playing, onPlay, onYear }: {
  year: number; chapters: Chapter[]; playing: boolean; onPlay: (value: boolean) => void; onYear: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(Math.abs(year)));
  const [era, setEra] = useState(year < 0 ? "bce" : "ce");
  const yearRef = useRef(year);
  yearRef.current = year;
  useEffect(() => { setDraft(String(Math.abs(year))); setEra(year < 0 ? "bce" : "ce"); }, [year]);
  useEffect(() => {
    if (!playing) return;
    let position = yearToT(yearRef.current);
    if (position >= 1) position = 0;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      position = Math.min(1, position + Math.min(now - previous, 500) / 180000);
      previous = now;
      onYear(clampMapYear(tToYear(position)));
      if (position === 1) onPlay(false);
    }, 150);
    const pause = () => { if (document.hidden) onPlay(false); };
    document.addEventListener("visibilitychange", pause);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", pause); };
  }, [playing, onPlay, onYear]);
  const changeYear = (next: number) => { onPlay(false); onYear(clampMapYear(next)); };
  const currentChapter = chapters.find((chapter) => chapter.from !== undefined && year >= chapter.from && year <= chapter.to!);
  return (
    <div className="ex-years">
      <div className="ex-year-heading">
        <div><span className="ex-year-label">The world in</span><output className="ex-year-value">{yearText(year)}</output><span className="ex-era-name">{currentChapter?.title ?? "Between chapters"}</span></div>
        <form className="ex-year-form" onSubmit={(e) => { e.preventDefault(); if (draft) changeYear(Number(draft) * (era === "bce" ? -1 : 1)); }}>
          <label htmlFor="ex-year-input">Go to a year</label>
          <div><input id="ex-year-input" type="number" min="1" max={era === "bce" ? -AXIS.min : AXIS.max} required value={draft} onChange={(e) => setDraft(e.target.value)} />
            <select aria-label="Year era" value={era} onChange={(e) => setEra(e.target.value)}><option value="ce">CE</option><option value="bce">BCE</option></select><button type="submit">Go</button></div>
        </form>
        <label className="ex-era-select">Jump to a chapter<select value="" onChange={(e) => { if (e.target.value) changeYear(Number(e.target.value)); }}><option value="">Choose a chapter</option>{chapters.filter((chapter) => chapter.from !== undefined).map((chapter) => <option key={chapter.id} value={chapter.from}>{chapter.title}</option>)}</select></label>
      </div>
      <div className="ex-slider-row">
        <button className="ex-play" type="button" aria-label={playing ? "Pause timeline" : "Play timeline"} aria-pressed={playing} onClick={() => onPlay(!playing)}>{playing ? "Ⅱ" : "▶"}</button>
        <div className="ex-slider-track">
          <label className="sr-only" htmlFor="ex-year-slider">Explore history by year</label>
          <input id="ex-year-slider" type="range" min={AXIS.min} max={AXIS.max} step="1" value={year} aria-valuetext={yearText(year)} onChange={(e) => changeYear(Number(e.target.value))} onKeyDown={(e) => {
            if (year === 1 && (e.key === "ArrowLeft" || e.key === "ArrowDown")) { e.preventDefault(); changeYear(-1); }
            if (year === -1 && (e.key === "ArrowRight" || e.key === "ArrowUp")) { e.preventDefault(); changeYear(1); }
          }} style={{ "--year-progress": `${(year - AXIS.min) / (AXIS.max - AXIS.min) * 100}%` } as React.CSSProperties} />
          <div className="ex-year-ticks" aria-hidden="true"><span>3400 BCE</span><span style={{ left: `${(-1000 - AXIS.min) / (AXIS.max - AXIS.min) * 100}%` }}>1000 BCE</span><span>Today</span></div>
        </div>
        <div className="ex-year-step"><button type="button" aria-label="Previous year" disabled={year === AXIS.min} onClick={() => changeYear(year === 1 ? -1 : year - 1)}>−</button><button type="button" aria-label="Next year" disabled={year === AXIS.max} onClick={() => changeYear(year === -1 ? 1 : year + 1)}>+</button></div>
      </div>
      <div className="ex-year-presets" aria-label="Jump to a milestone">{[[-2000, "Ibrahim’s era"], [610, "First revelation"], [622, "Hijra"], [750, "Abbasid era"], [1453, "Constantinople"], [2026, "Today"]].map(([at, title]) => <button type="button" key={at} aria-pressed={year === at} onClick={() => changeYear(Number(at))}>{title}</button>)}</div>
    </div>
  );
}
