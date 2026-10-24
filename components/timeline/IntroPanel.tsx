"use client";

import { useEffect, useState } from "react";
import type { Chapter, Stop } from "@/lib/timeline-types";
import { regionOf, type Fact } from "@/lib/timeline-world";

type Props = {
  chapters: Chapter[];
  moments: number;
  now: number;
  resume?: Stop;
  facts?: Fact[];
  onWatch: () => void;
  onStart: (stop: number) => void;
  onResume: () => void;
  onBirth: (year: number) => void;
  onFact?: (id: string) => void;
  onMore: () => void;
};

const FACT_MS = 8000;
const BIRTH_MIN = 1900;

function factText({ a, b, gap }: Fact) {
  const when = gap === 0 ? "The same year" : `${gap} year${gap === 1 ? "" : "s"} ${b.year! > a.year! ? "later" : "earlier"}`;
  return { lead: `${a.label.split(" · ")[0]}: ${a.title}.`, rest: `${when}, in ${regionOf(b.place!.lng!, b.place!.lat!).name}: ${b.title}.` };
}

// The opening screen: one big way in (watch), the story for readers, and a personal hook (your birth year).
export function IntroPanel({ chapters, moments, now, resume, facts, onWatch, onStart, onResume, onBirth, onFact, onMore }: Props) {
  const [fact, setFact] = useState(-1);
  const [birth, setBirth] = useState("");

  useEffect(() => {
    if (!facts?.length) return;
    setFact(Math.floor(Math.random() * facts.length));
    const timer = setInterval(() => setFact((i) => (i + 1) % facts.length), FACT_MS);
    return () => clearInterval(timer);
  }, [facts]);

  const shown = facts && fact >= 0 ? facts[fact] : undefined;
  const text = shown && factText(shown);
  const born = Number(birth);
  const valid = Number.isInteger(born) && born >= BIRTH_MIN && born <= now;

  return (
    <section className="panel ip" aria-label="Start">
      <div className="ip-body">
        <p className="eyebrow">Islamic History Timeline</p>
        <h1 className="ip-title">The story of the world, from Adam to the Hour</h1>
        <p className="ip-lede">
          Prophets, caliphs and empires on one living globe. {moments} moments in {chapters.length} chapters.
        </p>

        <button type="button" className="ip-watch" onClick={onWatch}>
          <span className="ip-watch-icon" aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M4 2.2v11.6a.8.8 0 0 0 1.2.7l9.6-5.8a.8.8 0 0 0 0-1.4L5.2 1.5A.8.8 0 0 0 4 2.2Z" />
            </svg>
          </span>
          <span>
            <b>Watch history unfold</b>
            <small>5,400 years in 3 minutes</small>
          </span>
        </button>

        <div className="ip-actions">
          <button type="button" className="cta ghost" onClick={() => onStart(0)}>
            Read the story
          </button>
          {resume ? (
            <button type="button" className="cta ghost" onClick={onResume}>
              Continue: {resume.title}
            </button>
          ) : (
            <button type="button" className="cta ghost" onClick={onMore}>
              Chapters and more
            </button>
          )}
        </div>

        <form
          className="ip-birth"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onBirth(born);
          }}
        >
          <label htmlFor="ip-born">Your birth year in Islamic history</label>
          <div>
            <input
              id="ip-born"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="e.g. 1995"
              value={birth}
              onChange={(e) => setBirth(e.target.value.replace(/\D/g, ""))}
            />
            <button type="submit" disabled={!valid}>
              See my year →
            </button>
          </div>
        </form>

        {text && shown && (
          <button type="button" className="ip-fact" key={shown.a.id} onClick={() => onFact?.(shown.a.id)}>
            <small>Did you know?</small>
            <b>{text.lead}</b> {text.rest}
          </button>
        )}
      </div>
    </section>
  );
}
