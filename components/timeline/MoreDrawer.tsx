"use client";

import { useEffect, useRef } from "react";
import type { Chapter } from "@/lib/timeline-types";
import type { View } from "./TimelineMain";

type Props = {
  open: boolean;
  chapters: Chapter[];
  counts: { people: number; villains: number; empires: number };
  onClose: () => void;
  onView: (v: View) => void;
  onWatch: () => void;
  onChapter: (stop: number) => void;
};

const WAYS: [View, string, (c: Props["counts"]) => string][] = [
  ["explore", "Explore by year", () => "Drag through 5,400 years and tap any land"],
  ["prophets", "Prophets family tree", () => "From Adam to Muhammad ﷺ, one family"],
  ["villains", "Villains of history", (c) => `${c.villains} villains, from Iblis to the Dajjal`],
  ["library", "Library", (c) => `${c.people} people, nations and places`],
  ["empires", "Who lived at the same time?", () => "Prophets, caliphs and scholars side by side"],
  ["quiz", "Which came first?", () => "A ten-round game. Share your score"],
];

// Every way into the timeline besides the globe itself, in one sheet.
export function MoreDrawer({ open, chapters, counts, onClose, onView, onWatch, onChapter }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="md"
      aria-label="All of the timeline"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="md-body">
        <header className="md-head">
          <p className="eyebrow">Islamic History Timeline</p>
          <button type="button" className="ep-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <button type="button" className="md-watch" onClick={onWatch}>
          <b>Watch history unfold</b>
          <span>5,400 years in 3 minutes</span>
        </button>
        <ul className="md-ways">
          {WAYS.map(([v, title, sub]) => (
            <li key={v}>
              <button type="button" onClick={() => onView(v)}>
                <b>{title}</b>
                <span>{sub(counts)}</span>
              </button>
            </li>
          ))}
        </ul>
        <h2 className="md-h">The story, chapter by chapter</h2>
        <ol className="md-chapters">
          {chapters.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onChapter(c.start)}>
                <span className="md-n">{c.n}</span>
                <span>
                  <b>{c.title}</b>
                  <small>
                    {c.span} · {c.count - 1} moments
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </dialog>
  );
}
