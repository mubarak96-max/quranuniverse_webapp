"use client";

import type { Chapter } from "@/lib/timeline-types";

// One segment per chapter, sized by how many moments it holds. Tapping a segment jumps to that chapter.
export function Progress({ chapters, index, onJump }: { chapters: Chapter[]; index: number; onJump: (stop: number) => void }) {
  return (
    <nav className="pg" aria-label="Chapters">
      {chapters.map((c) => {
        const done = Math.min(1, Math.max(0, (index - c.start + 1) / c.count));
        const current = index >= c.start && index < c.start + c.count;
        return (
          <button
            key={c.id}
            type="button"
            className={`pg-seg${current ? " on" : ""}`}
            style={{ flexGrow: c.count }}
            onClick={() => onJump(c.start)}
            aria-label={`Chapter ${c.n}: ${c.title}`}
            aria-current={current ? "step" : undefined}
            title={`${c.n}. ${c.title} · ${c.span}`}
          >
            <i style={{ transform: `scaleX(${done})` }} />
          </button>
        );
      })}
    </nav>
  );
}
