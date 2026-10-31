"use client";

// The day reader: one page at a time on every screen, like a book. A page scrolls on its own; scrolling past its end
// (wheel or touch), swiping sideways, the slider, the arrow keys or the "next" card all turn to the next page.
// Every page is in the HTML for search engines; the reader only decides which one is showing.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LENSES, type Lens } from "@/lib/q30-types";
import { LensIcon } from "./LensIcon";
import { read, update } from "./progress";

type Props = { titles: { title: string; kind: string }[]; pages: React.ReactNode[]; day: number; label: string; closeHref: string };

// How far past a page's edge the reader must keep scrolling before it turns. Only a scroll gesture that begins at
// the edge counts (a pause in wheel events ends a gesture), so one long fling never races through several pages.
const PULL = 280;
const GESTURE_GAP = 200;
const SIZES = ["Small", "Medium", "Large"];
// A day counts as read once the reader reaches its end having seen most of its chapters, not by sliding to the end.
const ENOUGH = 0.75;

type Land = "start" | "end" | "keep";

const isLens = (k: string): k is Lens => k in LENSES;

export function Reader({ titles, pages, day, label, closeHref }: Props) {
  const total = pages.length;
  const [at, setAt] = useState(0);
  const [size, setSize] = useState(1);
  const [toc, setToc] = useState(false);
  const scrollers = useRef<(HTMLDivElement | null)[]>([]);
  const land = useRef<Land>("start");
  const kept = useRef<number[]>([]);
  const seen = useRef(new Set<number>());
  const tocRef = useRef<HTMLElement>(null);
  const edge = useRef({ armed: 0, last: 0, pull: 0, mute: false });
  const stage = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; top: boolean; end: boolean } | null>(null);
  const ready = useRef(false);

  // Open where the reader left off, or at the page named in the link (#p4).
  useEffect(() => {
    const fromHash = /^#p(\d+)$/.exec(location.hash);
    const s = read();
    const saved = s.days[day];
    // A finished day opens at its beginning again, not on its closing page.
    const resume = saved?.done && saved.page === total - 1 ? 0 : (saved?.page ?? 0);
    const page = fromHash ? +fromHash[1] - 1 : resume;
    seen.current = new Set(saved?.seen ?? []);
    setAt(Math.min(Math.max(page, 0), total - 1));
    if (s.size !== undefined) setSize(s.size);
    ready.current = true;
  }, [day, total]);

  useEffect(() => {
    document.documentElement.classList.add("rd-open");
    return () => document.documentElement.classList.remove("rd-open");
  }, []);

  const setPull = (v: number) => {
    edge.current.pull = v;
    const sc = scrollers.current[at];
    sc?.style.setProperty("--pull", String(Math.min(1, v / PULL)));
    sc?.toggleAttribute("data-pulling", v > 0);
  };

  useEffect(() => {
    const sc = scrollers.current[at];
    if (sc) {
      sc.scrollTop = land.current === "end" ? sc.scrollHeight : land.current === "keep" ? (kept.current[at] ?? 0) : 0;
      // Focus follows the page, so keyboard scrolling and screen readers land on what is now showing.
      if (ready.current) sc.focus({ preventScroll: true });
    }
    land.current = "start";
    edge.current = { ...edge.current, armed: 0, pull: 0 };
    for (const s of scrollers.current) {
      s?.style.setProperty("--pull", "0");
      s?.removeAttribute("data-pulling");
    }
    if (!ready.current) return;
    history.replaceState(null, "", `#p${at + 1}`);
    seen.current.add(at);
    const chapters = Array.from({ length: Math.max(0, total - 3) }, (_, i) => i + 1);
    const count = chapters.filter((i) => seen.current.has(i)).length;
    update((s) => {
      const d = (s.days[day] = { ...s.days[day], page: at, seen: [...seen.current].sort((a, b) => a - b) });
      if (at === total - 1 && count >= chapters.length * ENOUGH) d.done = true;
      s.last = day;
    });
  }, [at, day, total]);

  const jump = useCallback(
    (i: number, to: Land = "keep") => {
      if (i < 0 || i > total - 1) return;
      kept.current[at] = scrollers.current[at]?.scrollTop ?? 0;
      land.current = to;
      setToc(false);
      setAt(i);
    },
    [at, total],
  );

  const go = useCallback((dir: 1 | -1, to: Land = "start") => jump(at + dir, to), [at, jump]);

  useEffect(() => {
    if (toc) tocRef.current?.querySelector<HTMLElement>("[aria-current], button")?.focus();
  }, [toc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Escape") setToc(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const edges = () => {
    const sc = scrollers.current[at]!;
    return { top: sc.scrollTop <= 1, end: sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2 };
  };

  // The rest of a gesture that turned a page must not scroll the new page; React's wheel listener is passive, so
  // this one is attached by hand.
  useEffect(() => {
    const el = stage.current!;
    const hold = (e: WheelEvent) => {
      const g = edge.current;
      if (g.mute && performance.now() - g.last > GESTURE_GAP) g.mute = false;
      if (g.mute) e.preventDefault();
    };
    el.addEventListener("wheel", hold, { passive: false });
    return () => el.removeEventListener("wheel", hold);
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const now = performance.now();
    if (edge.current.mute) {
      edge.current.last = now;
      return;
    }
    const dir = e.deltaY > 0 ? 1 : -1;
    const { top, end } = edges();
    const atEdge = dir === 1 ? end && at < total - 1 : top && at > 0;
    const fresh = now - edge.current.last > GESTURE_GAP;
    edge.current.last = now;
    if (fresh) edge.current.armed = atEdge ? dir : 0;
    if (!atEdge || edge.current.armed !== dir) {
      if (edge.current.pull) setPull(0);
      return;
    }
    // Some mice report lines or pages instead of pixels.
    const px = Math.abs(e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 800 : 1);
    setPull(edge.current.pull + px);
    if (edge.current.pull >= PULL) {
      edge.current.armed = 0;
      edge.current.mute = true;
      go(dir, dir === 1 ? "start" : "end");
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, ...edges() };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const s = touch.current;
    if (!s) return;
    const dy = s.y - e.touches[0].clientY;
    if (s.end && dy > 0 && at < total - 1) setPull(dy * 2.2);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    setPull(0);
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) return go(dx < 0 ? 1 : -1);
    if (s.end && dy < -PULL / 2.2) return go(1);
    if (s.top && dy > 140) return go(-1, "end");
  };

  const onClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-goto]");
    if (el) jump(Number(el.dataset.goto), el.closest(".rd-next, .op") ? "start" : "keep");
  };

  function resize() {
    const n = (size + 1) % SIZES.length;
    setSize(n);
    update((s) => {
      s.size = n;
    });
  }

  const here = titles[at];
  return (
    <div className="rd" data-size={size} data-kind={here.kind} onClick={onClick}>
      <header className="rd-bar">
        <Link href={closeHref} className="rd-back">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          All days
        </Link>
        <p className="rd-label">{label}</p>
        <div className="rd-tools">
          <button type="button" className="rd-icon" onClick={resize} aria-label={`Text size: ${SIZES[size]}`} title={`Text size: ${SIZES[size]}`}>
            <span aria-hidden="true">Aa</span>
          </button>
          <button type="button" className="rd-icon" onClick={() => setToc(!toc)} aria-expanded={toc} aria-label="Contents">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
        </div>
      </header>

      <div className="rd-stage" ref={stage} onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {pages.map((p, i) => {
          const state = i === at ? "on" : i < at ? "before" : "after";
          const next = titles[i + 1];
          return (
            <section
              key={i}
              className="rd-page"
              data-state={state}
              data-kind={titles[i].kind}
              aria-hidden={state !== "on"}
              inert={state !== "on"}
            >
              <div
                className="rd-scroll"
                tabIndex={-1}
                ref={(el) => {
                  scrollers.current[i] = el;
                }}
              >
                <div className="rd-sheet">{p}</div>
                {next && (
                  <button type="button" className="rd-next" data-goto={i + 1}>
                    <span className="rd-next-bar" aria-hidden="true" />
                    <small>
                      <span className="rd-next-idle">Next</span>
                      <span className="rd-next-pull">Keep scrolling</span>
                    </small>
                    <b>{next.title}</b>
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="rd-nav">
        <button type="button" className="rd-turn" onClick={() => go(-1)} disabled={at === 0} aria-label="Previous page">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="rd-slider">
          <p className="rd-where">
            <span>
              {at + 1} / {total}
            </span>
            <b>{here.title}</b>
          </p>
          <div className="rd-track" style={{ "--p": total > 1 ? at / (total - 1) : 0 } as React.CSSProperties}>
            <ol aria-hidden="true">
              {titles.map((_, i) => (
                <li key={i} className={i <= at ? "is-read" : undefined} />
              ))}
            </ol>
            <input type="range" min={0} max={total - 1} step={1} value={at} onChange={(e) => jump(Number(e.target.value))} aria-label="Page" aria-valuetext={`Page ${at + 1} of ${total}: ${here.title}`} />
          </div>
        </div>
        <button type="button" className="rd-turn is-next" onClick={() => go(1)} disabled={at === total - 1} aria-label="Next page">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </footer>

      {toc && (
        <nav className="rd-toc" aria-label="Contents of this day" ref={tocRef}>
          <ol>
            {titles.map((t, i) => (
              <li key={i}>
                <button type="button" data-goto={i} aria-current={i === at ? "page" : undefined}>
                  <span className="rd-toc-n">{i + 1}</span>
                  {isLens(t.kind) && <LensIcon lens={t.kind} />}
                  <span>{t.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </div>
  );
}
