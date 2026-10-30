"use client";

// The booklet reader: one page at a time on phones, two-page spreads on wide screens. Every page is in the HTML
// (so search engines and print see the whole day); the reader only decides which sheet is showing.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { patchDay, read, update } from "./progress";

type Props = {
  pages: React.ReactNode[];
  label: string;
  day?: number;
  closeHref?: string;
  onClose?: () => void;
  onFinish?: () => void;
};

const WIDE = "(min-width: 1080px) and (min-aspect-ratio: 5/4)";
const INTERACTIVE = "a, button, input, textarea, select, label, [role=button]";

export function Booklet({ pages, label, day, closeHref, onClose, onFinish }: Props) {
  const total = pages.length;
  const [at, setAt] = useState(0);
  const [spread, setSpread] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [marks, setMarks] = useState<number[]>([]);
  const start = useRef<{ x: number; y: number } | null>(null);
  const ready = useRef(false);

  // Open where the reader left off, or at the page named in the link (#p4).
  useEffect(() => {
    const fromHash = /^#p(\d+)$/.exec(location.hash);
    const saved = day ? read().days[day] : undefined;
    const page = fromHash ? +fromHash[1] - 1 : (saved?.page ?? 0);
    setAt(Math.min(Math.max(page, 0), total - 1));
    setMarks(saved?.marks ?? []);
    ready.current = true;
  }, [day, total]);

  useEffect(() => {
    const mq = matchMedia(WIDE);
    const sync = () => setSpread(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("bk-open");
    return () => document.documentElement.classList.remove("bk-open");
  }, []);

  // A page must fit its sheet like paper does: if a short screen makes it overflow, shrink its contents a little.
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fit = () => {
      for (const pg of stage.current?.querySelectorAll<HTMLElement>(".pg") ?? []) {
        const body = pg.querySelector<HTMLElement>(".pg-body");
        if (!body) continue;
        let z = 1;
        body.style.zoom = "1";
        while (pg.scrollHeight > pg.clientHeight + 1 && z > 0.72) {
          z -= 0.04;
          body.style.zoom = String(z);
        }
      }
    };
    fit();
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    if (stage.current) ro.observe(stage.current);
    return () => ro.disconnect();
  }, [spread]);

  // A spread starts on an even page; the visible pair is [first, first + 1].
  const first = spread ? at - (at % 2) : at;
  const lastSeen = spread ? Math.min(first + 1, total - 1) : at;

  useEffect(() => {
    if (!ready.current) return;
    history.replaceState(null, "", `#p${first + 1}`);
    if (!day) return;
    update((s) => {
      const d = (s.days[day] = { ...s.days[day], page: first });
      if (lastSeen === total - 1) d.done = true;
      s.last = day;
    });
    if (lastSeen === total - 1) onFinish?.();
  }, [first, lastSeen, total, day, onFinish]);

  const go = useCallback(
    (delta: 1 | -1) => {
      const step = spread ? 2 : 1;
      const next = first + delta * step;
      if (next < 0 || next > total - 1) return;
      setDir(delta);
      setAt(next);
    },
    [first, spread, total],
  );

  const jump = (i: number) => {
    setDir(i > first ? 1 : -1);
    setAt(i);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function close() {
    if (onClose) onClose();
    else if (closeHref) location.assign(closeHref);
  }

  function toggleMark() {
    if (!day) return;
    const next = marks.includes(first) ? marks.filter((m) => m !== first) : [...marks, first].sort((a, b) => a - b);
    setMarks(next);
    patchDay(day, { marks: next });
  }

  const onPointerDown = (e: React.PointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) return go(dx < 0 ? 1 : -1);
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    // A tap near either edge turns the page, as in an e-reader.
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    if (x > 0.8) go(1);
    else if (x < 0.2) go(-1);
  };

  const state = (i: number) => {
    if (i === first || (spread && i === first + 1)) return "on";
    return i < first ? "before" : "after";
  };
  const marked = marks.includes(first);

  return (
    <div className="bk" data-spread={spread || undefined} data-dir={dir}>
      <header className="bk-bar">
        {closeHref && !onClose ? (
          <Link href={closeHref} className="bk-icon" aria-label="Close and go to all days">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        ) : (
          <button type="button" className="bk-icon" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <p className="bk-title">{label}</p>
        <span className="bk-count">
          {first + 1}
          {spread && first + 1 < total ? `–${first + 2}` : ""} / {total}
        </span>
        {day && (
          <button type="button" className="bk-icon" onClick={toggleMark} aria-pressed={marked} aria-label={marked ? "Remove bookmark" : "Bookmark this page"}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 3.5h10v17l-5-3.5-5 3.5z" className={marked ? "is-filled" : undefined} />
            </svg>
          </button>
        )}
        <button type="button" className="bk-icon" onClick={() => print()} aria-label="Print or save as PDF" title="Print or save as PDF">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 9V3.5h10V9M7 17H4.5v-8h15v8H17M7 14h10v6.5H7z" />
          </svg>
        </button>
      </header>
      <div className="bk-stage" ref={stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {pages.map((p, i) => {
          const s = state(i);
          return (
            <div key={i} className="bk-sheet" data-state={s} data-side={spread ? (i % 2 ? "right" : "left") : undefined} aria-hidden={s !== "on"} inert={s !== "on"}>
              {p}
            </div>
          );
        })}
      </div>
      <footer className="bk-nav">
        <button type="button" className="bk-turn" onClick={() => go(-1)} disabled={first === 0} aria-label="Previous page">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <ol className="bk-dots">
          {pages.map((_, i) =>
            spread && i % 2 ? null : (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => jump(i)}
                  aria-label={`Page ${i + 1}`}
                  aria-current={i === first ? "page" : undefined}
                  className={marks.includes(i) ? "is-marked" : undefined}
                />
              </li>
            ),
          )}
        </ol>
        <button type="button" className="bk-turn" onClick={() => go(1)} disabled={lastSeen >= total - 1} aria-label="Next page">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </footer>
    </div>
  );
}
