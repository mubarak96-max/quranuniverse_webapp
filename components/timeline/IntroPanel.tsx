"use client";

import type { Chapter, Stop } from "@/lib/timeline-types";

type Props = {
  chapters: Chapter[];
  moments: number;
  resume?: Stop;
  onStart: (stop: number) => void;
  onResume: () => void;
  onExplore: () => void;
  onProphets: () => void;
  onVillains: () => void;
};

// Roughly 15 seconds a moment when read at a calm pace.
const minutes = (moments: number) => Math.round((moments * 15) / 60 / 5) * 5;

export function IntroPanel({ chapters, moments, resume, onStart, onResume, onExplore, onProphets, onVillains }: Props) {
  return (
    <section className="panel ip" aria-label="Start">
      <div className="ip-body">
        <p className="eyebrow">Timeline</p>
        <h1 className="ip-title">The story of the world, from Adam to today</h1>
        <p className="ip-lede">
          Prophets, empires and the people in between, told through the Quran on one living map. {moments} moments in{" "}
          {chapters.length} chapters, about {minutes(moments)} minutes from start to finish.
        </p>
        <div className="ip-actions">
          <button type="button" className="cta" onClick={() => onStart(0)}>
            Start from the beginning →
          </button>
          {resume && (
            <button type="button" className="cta ghost" onClick={onResume}>
              Continue: {resume.title}
            </button>
          )}
        </div>
        <div className="ip-alt">
          <button type="button" onClick={onExplore}>
            <b>Explore by year</b>
            <span>Drag through 5,000 years and watch borders change</span>
          </button>
          <button type="button" onClick={onProphets}>
            <b>Prophets family tree</b>
            <span>From Adam to Muhammad ﷺ, one family</span>
          </button>
          <button type="button" onClick={onVillains}>
            <b>Villains of history</b>
            <span>From Iblis to the Dajjal, and how each one fell</span>
          </button>
        </div>

        <h2 className="ip-h">Chapters</h2>
        <ol className="ip-chapters">
          {chapters.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => onStart(c.start)}>
                <span className="ip-n">{c.n}</span>
                <span className="ip-t">
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
    </section>
  );
}
