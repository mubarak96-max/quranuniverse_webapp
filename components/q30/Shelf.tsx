"use client";

// The home of the course: progress, the "continue" button, a small progress map and all 30 booklet covers.
// Covers are drawn on the server and passed in; this component only adds each reader's progress on top.
import Link from "next/link";
import { useState } from "react";
import { PARTS, dayHref, type DaySummary } from "@/lib/q30-types";
import { Booklet } from "./Booklet";
import { Offline } from "./Offline";
import { update, useProgress, type State } from "./progress";

type Props = { days: DaySummary[]; covers: Record<number, React.ReactNode>; guide: React.ReactNode[]; urls: string[] };

function status(p: State | null, day: number) {
  const d = p?.days[day];
  if (d?.done) return "done";
  if (d?.page) return "reading";
  return "new";
}

// The 30 days on a gentle winding path; a dot fills in as each day is completed.
function ProgressMap({ p }: { p: State | null }) {
  const pts = Array.from({ length: 30 }, (_, i) => {
    const x = 14 + i * (372 / 29);
    const y = 34 + Math.sin(i / 2.2) * 16;
    return [x, y] as const;
  });
  return (
    <svg className="sh-map" viewBox="0 0 400 70" role="img" aria-label="Your 30-day map">
      <path d={`M${pts.map(([x, y]) => `${x} ${y}`).join(" L")}`} className="sh-map-path" />
      {pts.map(([x, y], i) => {
        const s = status(p, i + 1);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={s === "done" ? 5.2 : 4} className={`sh-map-dot is-${s}`} />
            {(i === 0 || (i + 1) % 5 === 0) && (
              <text x={x} y={y + 20} textAnchor="middle" className="sh-map-t">
                {i + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Shelf({ days, covers, guide, urls }: Props) {
  const p = useProgress();
  const [guideOpen, setGuideOpen] = useState(false);
  const done = days.filter((d) => p?.days[d.day]?.done).length;
  const last = p?.last && p.days[p.last] && !p.days[p.last].done ? p.last : days.find((d) => !p?.days[d.day]?.done)?.day;
  const lastPage = last ? (p?.days[last]?.page ?? 0) : 0;
  const showGuide = guideOpen || (p !== null && !p.intro);

  function closeGuide() {
    setGuideOpen(false);
    update((s) => {
      s.intro = true;
    });
  }

  return (
    <div className="sh">
      <header className="sh-hero">
        <p className="sh-kicker">A guided course · 30 booklets · about 20 minutes a day</p>
        <h1>
          The Quran in <em>30 Days</em>
        </h1>
        <p className="sh-lede">
          A map of the whole Quran: its message, its people and stories, the unseen and the Hereafter, its laws and its
          character. One short booklet a day.
        </p>
        <div className="sh-progress">
          <div className="sh-ring" style={{ "--p": done / 30 } as React.CSSProperties}>
            <b>{done}</b>
            <span>of 30</span>
          </div>
          <div className="sh-actions">
            {last && (
              <Link href={`${dayHref(last)}#p${lastPage + 1}`} className="sh-continue">
                {done === 0 && lastPage === 0 ? `Start Day ${last}` : `Continue Day ${last}`}
                {lastPage > 0 && <small>page {lastPage + 1}</small>}
              </Link>
            )}
            <div className="sh-tools">
              <button type="button" onClick={() => setGuideOpen(true)}>
                How it works
              </button>
              <Link href="/quran-in-30-days/reference">Key words and verses</Link>
              <Offline urls={urls} />
            </div>
          </div>
        </div>
        <ProgressMap p={p} />
      </header>

      {PARTS.map((part) => {
        const list = days.filter((d) => d.part === part.n);
        if (!list.length) return null;
        return (
          <section key={part.n} className="sh-part" aria-labelledby={`part-${part.n}`}>
            <h2 id={`part-${part.n}`}>
              <span>Part {part.n}</span> {part.title}
              <small>{part.from === part.to ? `Day ${part.from}` : `Days ${part.from}–${part.to}`}</small>
            </h2>
            <ul className="sh-grid">
              {list.map((d) => {
                const s = status(p, d.day);
                const page = p?.days[d.day]?.page ?? 0;
                return (
                  <li key={d.day}>
                    <Link href={dayHref(d.day)} className={`sh-book is-${s}`}>
                      <span className="sh-cover">
                        {covers[d.day]}
                        <span className="sh-num">{d.day}</span>
                        {s === "done" && <span className="sh-seal" aria-label="Completed">✓</span>}
                        {s === "reading" && <span className="sh-ribbon">Page {page + 1}</span>}
                      </span>
                      <b>{d.title}</b>
                      <small>{d.question}</small>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {showGuide && <Booklet pages={guide} label="How it works" onClose={closeGuide} />}
    </div>
  );
}
