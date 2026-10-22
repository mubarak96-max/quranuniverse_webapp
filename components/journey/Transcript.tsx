"use client";

import Link from "next/link";
import type { Journey } from "@/lib/journey-types";

// The whole journey as plain text: for reading without the full-screen player, for screen readers, and for search.
export function Transcript({ journey, onExperience }: { journey: Journey; onExperience: () => void }) {
  return (
    <article id="journey-text" className="jt">
      <p className="eyebrow">Journey</p>
      <h1>{journey.name}, peace be upon him: the journey</h1>
      <p className="jt-lede">{journey.tagline}</p>
      <p className="jt-actions">
        <button
          type="button"
          className="jt-btn"
          onClick={() => {
            scrollTo(0, 0);
            onExperience();
          }}
        >
          Experience it full screen
        </button>
        <Link href={`/timeline/${journey.stop}`}>Back to the timeline</Link>
      </p>

      {journey.acts.map((act, n) => {
        const scenes = journey.scenes.slice(act.start, act.start + act.count).filter((s) => !s.cover && !s.end);
        if (!scenes.length) return null;
        return (
          <section key={act.title}>
            <h2>
              <span>{n + 1}</span> {act.title}
            </h2>
            {scenes.map((s) => (
              <div key={s.id} className="jt-scene">
                <p>{s.lines.join(" ")}</p>
                {s.interact?.type === "reveal" && <p>{s.interact.items.map((i) => i.text).join(" ")}</p>}
                {s.interact?.type === "contrast" && (
                  <ul>
                    {s.interact.items.map((i) => (
                      <li key={i.who}>
                        {i.who}: “{i.text}” ({i.ref})
                      </li>
                    ))}
                  </ul>
                )}
                {s.ayah && (
                  <blockquote>
                    {s.ayah.ar && (
                      <p className="ar" lang="ar" dir="rtl">
                        {s.ayah.ar}
                      </p>
                    )}
                    <p>{s.ayah.text}</p>
                    <cite>
                      <Link href={s.ayah.href}>Quran {s.ayah.ref}</Link>
                    </cite>
                  </blockquote>
                )}
                {s.hadith && (
                  <blockquote className="jt-hadith">
                    {s.hadith.text && <p>{s.hadith.text}</p>}
                    <cite>{s.hadith.cite}</cite>
                  </blockquote>
                )}
                {(s.refs.length > 0 || s.scholars) && (
                  <p className="jt-src">
                    {s.refs.map((r) => (
                      <Link key={r.ref} href={r.href}>
                        Quran {r.ref}
                      </Link>
                    ))}
                    {s.scholars && <span>Reported by {s.scholars}</span>}
                  </p>
                )}
              </div>
            ))}
          </section>
        );
      })}
    </article>
  );
}
