"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Villain } from "@/lib/timeline-types";
import { VillainIcon } from "./VillainIcon";
import { VillainQuiz } from "./VillainQuiz";

const SOURCE_TEXT: Record<Villain["source"], string> = {
  quran: "Named in the Quran",
  tafsir: "In the Quran, named by the commentators",
  hadith: "Authentic hadith",
  history: "Recorded by historians",
};

const SWIPE_PX = 50;

export function VillainPanel({
  villains,
  selected,
  onSelect,
  onProphet,
  onOpenStop,
}: {
  villains: Villain[];
  selected?: string;
  onSelect: (id: string) => void;
  onProphet: (id: string) => void;
  onOpenStop: (id: string) => void;
}) {
  const i = villains.findIndex((x) => x.id === selected);
  const v = villains[i];
  const prev = villains[i - 1];
  const next = villains[i + 1];
  const swipe = useRef<{ x: number; y: number } | null>(null);

  // Horizontal swipes on touch screens step along the line, as in the story panel.
  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch" && v) swipe.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent) {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) {
      const to = dx < 0 ? next : prev;
      if (to) onSelect(to.id);
    }
  }

  return (
    <section className="panel pp vp" aria-label="Villain" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <header className="sp-head">
        <span>Villains of history</span>
        <span className="sp-count">{v ? `${i + 1} / ${villains.length}` : `${villains.length} from the Quran, hadith and history`}</span>
      </header>
      <div className="sp-body" key={v?.id ?? "none"}>
        {!v ? (
          <div className="pp-intro">
            <h2 className="sp-title">Every age had its tyrant</h2>
            <p className="sp-what">
              From Iblis to the Dajjal the story repeats: someone rises in arrogance, a prophet or a believer stands against them, and
              what they relied on becomes what undoes them.
            </p>
            <button type="button" className="cta" onClick={() => onSelect(villains[0].id)}>
              Begin with {villains[0].name} →
            </button>
            <VillainQuiz villains={villains} onOpen={onSelect} />
            <blockquote className="sp-quote">
              <p>Travel through the land; then observe how was the end of the deniers.</p>
              <cite>
                <Link href="/surah/al-anam/11">Quran 6:11</Link>
              </cite>
            </blockquote>
          </div>
        ) : (
          <article aria-live="polite">
            <div className="vp-top">
              <VillainIcon symbol={v.symbol} className="vp-icon" />
              <p className="pp-ar ar" lang="ar">
                {v.arabic}
              </p>
            </div>
            <h2 className="sp-title">{v.name}</h2>
            <p className="sp-meta">
              <b>{v.title}</b>
              <span>{v.when}</span>
            </p>
            {v.relied && v.undone && (
              <div className="vp-turn">
                <p>
                  <small>Relied on</small>
                  {v.relied}
                </p>
                <span aria-hidden="true">→</span>
                <p>
                  <small>Undone by</small>
                  <b>{v.undone}</b>
                </p>
              </div>
            )}
            <p className="sp-what">{v.deed}</p>
            <div className="vp-end">
              <h3>How it ended</h3>
              <p>{v.end}</p>
            </div>
            {v.verse?.text && (
              <blockquote className="sp-quote">
                <p>{v.verse.text}</p>
                <cite>
                  <Link href={v.verse.href}>Quran {v.verse.ref}</Link>
                </cite>
              </blockquote>
            )}
            <p className="vp-lesson">
              <small>The lesson</small>
              {v.lesson}
            </p>
            {v.journey && (
              <Link href={`/timeline/journey/${v.journey}`} className="sp-journey vp-journey">
                <b>Watch {v.name}&apos;s downfall</b>
                <span>Full screen, scene by scene</span>
              </Link>
            )}
            {v.mentions.length > 0 && (
              <>
                <h3 className="vp-h">In the Quran</h3>
                <p className="sp-links">
                  {v.mentions.map((m) => (
                    <Link key={m.ref} href={m.href}>
                      {m.ref}
                    </Link>
                  ))}
                </p>
              </>
            )}
            <dl className="sp-context">
              <dt>Stood against</dt>
              <dd>
                {v.against.prophet ? (
                  <button type="button" className="chip" onClick={() => onProphet(v.against.prophet!)}>
                    {v.against.name}
                  </button>
                ) : (
                  <span>{v.against.name}</span>
                )}
              </dd>
              <dt>Source</dt>
              <dd className="vp-source">
                <b className={`src-${v.source}`}>{SOURCE_TEXT[v.source]}</b>
                <span>{v.note}</span>
                {v.hadith && (
                  <span className="vp-hadith">
                    {v.hadith.map((h) => (
                      <a key={h.url} href={h.url} target="_blank" rel="noopener noreferrer">
                        {h.label} ↗
                      </a>
                    ))}
                  </span>
                )}
              </dd>
            </dl>
            {v.stop && (
              <button type="button" className="cta" onClick={() => onOpenStop(v.stop!)}>
                See it on the map →
              </button>
            )}
            <nav className="vp-nav" aria-label="Other villains">
              {prev ? (
                <button type="button" className="cta ghost" onClick={() => onSelect(prev.id)}>
                  ← {prev.name}
                </button>
              ) : (
                <span />
              )}
              {next && (
                <button type="button" className="cta ghost" onClick={() => onSelect(next.id)}>
                  {next.name} →
                </button>
              )}
            </nav>
          </article>
        )}
      </div>
    </section>
  );
}
