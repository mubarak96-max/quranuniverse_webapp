"use client";

// The home of the course: an illustrated welcome with the reader's progress and "continue", who the course is for,
// the six voices every day is written in, and the thirty days as one vertical path. Each day opens in place to show
// what is inside before it is begun.
import Link from "next/link";
import { useState } from "react";
import { BASE, LENSES, PARTS, dayHref, type DaySummary, type Lens } from "@/lib/q30-types";
import { LensIcon } from "./LensIcon";
import { Offline } from "./Offline";
import { useProgress, type State } from "./progress";

type Props = { days: DaySummary[]; thumbs: Record<number, string | undefined>; hero?: string; urls: string[] };

const READERS: [string, string][] = [
  ["If you are Muslim", "Go beneath the recitation: the Arabic words, the tafsir, the threads that tie one surah to another, and things you may never have noticed."],
  ["If you are exploring Islam", "An honest, ordered picture of what the Quran teaches about God, people and life, told in its own words and with its hard questions faced."],
  ["If you are simply curious", "What the book recited by nearly two billion people actually says, how it is built, and why it moves the people who read it."],
];

const VOICES: Record<Lens, string> = {
  story: "A scene from the Quran or the life of the Prophet ﷺ, told so you are there.",
  text: "The key verses read closely, in Arabic and English, word by word.",
  scholar: "What the great commentators add, and where they differ.",
  reason: "The hard questions, stated fairly and answered honestly.",
  heart: "A quiet page for the soul: what this means for you.",
  life: "What it looks like lived, today.",
};

function status(p: State | null, day: number) {
  const d = p?.days[day];
  if (d?.done) return "done";
  if (d?.page) return "reading";
  return "new";
}

export function Journey({ days, thumbs, hero, urls }: Props) {
  const p = useProgress();
  const [copied, setCopied] = useState(false);
  const done = days.filter((d) => p?.days[d.day]?.done).length;
  const last = p?.last && p.days[p.last] && !p.days[p.last].done ? p.last : days.find((d) => !p?.days[d.day]?.done)?.day;
  const lastPage = last ? (p?.days[last]?.page ?? 0) : 0;
  const current = days.find((d) => d.day === last);

  async function recommend() {
    const data = { title: "The Quran in 30 Days", text: "A free daily read that maps the whole Quran, about 15 minutes a day.", url: location.origin + BASE };
    if (navigator.share) {
      await navigator.share(data).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(data.url);
    setCopied(true);
  }

  return (
    <div className="jr">
      <header className="jr-hero">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element -- static export serves pre-sized WebP files
          <img className="jr-hero-art" src={hero} alt="" width={1600} height={1067} fetchPriority="high" />
        )}
        <div className="jr-hero-text">
          <p className="jr-kicker">A guided course · 30 days · about 15 minutes a day</p>
          <h1>
            The Quran in <em>30 Days</em>
          </h1>
          <p className="jr-lede">
            One day at a time, the whole Quran comes into view: who it says Allah is, the prophets and their stories,
            death and what follows, its law, its ethics and its voice. Told as story, close reading, scholarship,
            argument and reflection.
          </p>
          <div className="jr-cta">
            {last && (
              <Link href={`${dayHref(last)}${lastPage ? `#p${lastPage + 1}` : ""}`} className="jr-go">
                <span>{done === 0 && lastPage === 0 ? `Begin Day ${last}` : `Continue Day ${last}`}</span>
                {current && <small>{current.title}</small>}
              </Link>
            )}
            <a href="#days" className="jr-all">
              See all 30 days
            </a>
          </div>
          {done > 0 && (
            <div className="jr-progress" style={{ "--p": done / 30 } as React.CSSProperties}>
              <span className="jr-ring">
                <b>{done}</b>
              </span>
              <span>
                of 30 days read{done === 30 ? ". Masha'Allah, the whole map is yours." : ""}
              </span>
            </div>
          )}
        </div>
      </header>

      <section className="jr-for" aria-label="Who this course is for">
        {READERS.map(([t, d]) => (
          <div key={t}>
            <h2>{t}</h2>
            <p>{d}</p>
          </div>
        ))}
      </section>

      <section className="jr-voices" aria-labelledby="voices">
        <h2 id="voices">Every day, read six ways</h2>
        <ul>
          {(Object.keys(LENSES) as Lens[]).map((l) => (
            <li key={l} data-lens={l}>
              <LensIcon lens={l} />
              <b>{LENSES[l]}</b>
              <span>{VOICES[l]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="days" className="jr-days" aria-label="The thirty days">
        {PARTS.map((part) => {
          const list = days.filter((d) => d.part === part.n);
          if (!list.length) return null;
          return (
            <div key={part.n} className="jr-part" style={{ "--tint": part.tint } as React.CSSProperties}>
              <header className="jr-part-head">
                <span>Part {part.n}</span>
                <h2>{part.title}</h2>
                <p>{part.blurb}</p>
              </header>
              <ol className="jr-list">
                {list.map((d) => {
                  const s = status(p, d.day);
                  return (
                    <li key={d.day} className={`jr-day is-${s}`}>
                      <details name="q30-day">
                        <summary>
                          <span className="jr-node" aria-hidden="true">
                            {s === "done" ? "✓" : d.day}
                          </span>
                          <span className="jr-thumb">
                            {thumbs[d.day] && (
                              // eslint-disable-next-line @next/next/no-img-element -- static export serves pre-sized WebP files
                              <img src={thumbs[d.day]} alt="" width={640} height={427} loading="lazy" decoding="async" />
                            )}
                          </span>
                          <span className="jr-day-text">
                            <small>
                              Day {d.day} · {d.minutes} min
                              {s === "done" && " · read"}
                              {s === "reading" && " · in progress"}
                            </small>
                            <b>{d.title}</b>
                            <em>{d.question}</em>
                          </span>
                          <svg className="jr-chev" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </summary>
                        <div className="jr-open">
                          <p className="jr-summary">{d.summary}</p>
                          <ol className="jr-inside">
                            {d.chapters.map((c, i) => (
                              <li key={i} data-lens={c.lens}>
                                <LensIcon lens={c.lens} />
                                <span>{c.title}</span>
                                <small>{LENSES[c.lens]}</small>
                              </li>
                            ))}
                          </ol>
                          <div className="jr-extras">
                            {d.word && (
                              <p className="jr-word">
                                <span className="ar" lang="ar" dir="rtl">
                                  {d.word.ar}
                                </span>
                                <span>
                                  <i>{d.word.tr}</i> · {d.word.meaning}
                                </span>
                              </p>
                            )}
                            {d.refs.length > 0 && <p className="jr-refs">{d.refs.join(" · ")}</p>}
                          </div>
                          <Link href={s === "done" ? `${dayHref(d.day)}#p1` : dayHref(d.day)} className="jr-begin">
                            {s === "done" ? "Read again" : s === "reading" ? "Continue reading" : `Begin Day ${d.day}`}
                          </Link>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </section>

      <footer className="jr-foot">
        <Link href={`${BASE}/reference`}>Every key word and verse</Link>
        <button type="button" onClick={recommend}>
          {copied ? "Link copied" : "Recommend this course"}
        </button>
        <Offline urls={urls} />
      </footer>
    </div>
  );
}
