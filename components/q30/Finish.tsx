"use client";

// The end of a day: what you did, the next day as the obvious next step, and a way to pass it on.
import Link from "next/link";
import { useState } from "react";
import { BASE } from "@/lib/q30-types";
import { useProgress } from "./progress";

type Next = { href: string; day: number; title: string; question: string; image?: string };

export function Finish({ day, next }: { day: number; next?: Next }) {
  const p = useProgress();
  const [shared, setShared] = useState(false);
  const done = p ? Object.values(p.days).filter((d) => d.done).length : 0;
  const score = p?.days[day]?.score;

  async function share() {
    const data = { title: document.title, text: "A short daily read on what the Quran says. Try this one:", url: location.href.split("#")[0] };
    if (navigator.share) {
      // The person may dismiss the share sheet; that is not an error worth showing.
      await navigator.share(data).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(data.url);
    setShared(true);
  }

  return (
    <section className="fn">
      <div className="fn-seal" aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path d="M32 4l6 10 11.5-2.5L47 23l10 6-10 6 2.5 11.5L38 44l-6 10-6-10-11.5 2.5L17 35 7 29l10-6-2.5-11.5L26 14z" />
          <path d="M23 31l6 6 12-13" className="fn-tick" />
        </svg>
      </div>
      <p className="fn-head">End of Day {day}</p>
      <p className="fn-sub">
        {done > 0 && `${done} of 30 days read`}
        {score && ` · quiz ${score[0]} of ${score[1]}`}
      </p>
      {next ? (
        <Link href={next.href} className="fn-next">
          {next.image && (
            // eslint-disable-next-line @next/next/no-img-element -- static export serves pre-sized WebP files
            <img src={next.image} alt="" width={640} height={427} loading="lazy" />
          )}
          <span>
            <small>Tomorrow · Day {next.day}</small>
            <b>{next.title}</b>
            <em>{next.question}</em>
            <i>Begin Day {next.day} →</i>
          </span>
        </Link>
      ) : (
        <p className="fn-last">This is the last day of the course. The Quran itself is the next book.</p>
      )}
      <div className="fn-actions">
        <Link href={BASE} className="fn-btn">
          All days
        </Link>
        <button type="button" className="fn-btn" onClick={share}>
          {shared ? "Link copied" : "Share this day"}
        </button>
        <button type="button" className="fn-btn" data-goto={0}>
          Read again
        </button>
      </div>
    </section>
  );
}
