"use client";

import { useEffect, useRef } from "react";
import { yearText, type Chapter } from "@/lib/timeline-types";

// The chapters as one strip along the bottom of the map, with a year slider for the borders of the chapter on screen.
export function EraBar({ chapters, current, year, onChapter, onYear }: { chapters: Chapter[]; current: number; year?: number; onChapter: (i: number) => void; onYear?: (y: number) => void }) {
  const c = chapters[current];
  const strip = useRef<HTMLOListElement>(null);
  const dated = c && c.id !== "beginning" && c.id !== "hour" && c.from !== undefined && c.to !== undefined && c.to > c.from;

  const first = useRef(true);
  useEffect(() => {
    // Scroll only the strip, never the page.
    const box = strip.current;
    const el = box?.children[current] as HTMLElement | undefined;
    if (box && el) box.scrollTo({ left: el.offsetLeft - (box.clientWidth - el.clientWidth) / 2, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [current]);

  return (
    <nav className="eb" aria-label="Chapters of history">
      <div className="eb-row">
        <button type="button" className="eb-step" onClick={() => onChapter(Math.max(0, current - 1))} disabled={current <= 0} aria-label="Previous chapter">
          ‹
        </button>
        <ol className="eb-strip" ref={strip}>
          {chapters.map((ch, i) => (
            <li key={ch.id}>
              <button type="button" aria-current={i === current ? "true" : undefined} onClick={() => onChapter(i)} style={{ backgroundImage: `url(/timeline/art/ch-${ch.id}-sm.webp)` }}>
                <span className="eb-n">{String(ch.n).padStart(2, "0")}</span>
                <span className="eb-t">{ch.title}</span>
                <span className="eb-s">{ch.span}</span>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="eb-step" onClick={() => onChapter(Math.min(chapters.length - 1, current + 1))} disabled={current >= chapters.length - 1} aria-label="Next chapter">
          ›
        </button>
      </div>
      {dated && onYear && (
        <div className="eb-year">
          <label htmlFor="eb-range">
            Borders in <b>{year !== undefined ? yearText(year) : "—"}</b>
          </label>
          <input
            id="eb-range"
            type="range"
            min={c.from}
            max={c.to}
            step={1}
            value={year ?? c.from}
            onChange={(e) => onYear(Number(e.target.value) || 1)}
            aria-valuetext={year !== undefined ? yearText(year) : undefined}
          />
          <span className="eb-ends">
            {yearText(c.from!)} – {yearText(c.to!)}
          </span>
        </div>
      )}
    </nav>
  );
}
