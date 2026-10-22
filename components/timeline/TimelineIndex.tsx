import Link from "next/link";
import type { TimelineData } from "@/lib/timeline-types";

// Plain list of every moment under the interactive map: crawlable links, and a fallback when scripts fail.
export function TimelineIndex({ data, current }: { data: TimelineData; current?: string }) {
  return (
    <section className="tl-index" aria-labelledby="tl-index-h">
      <h2 id="tl-index-h">Every moment in the timeline</h2>
      <p className="tl-index-note">
        Borders come from the open historical-basemaps project (GPL-3.0) and are approximate. Dates before 1000 BCE are
        estimates, and for the earliest prophets the Quran gives the order of events but not their years. Sources: the Quran,
        Sahih al-Bukhari, the Seerah of Ibn Ishaq, Ibn Kathir&apos;s al-Bidaya wan-Nihaya, and standard histories. See also the{" "}
        <Link href="/timeline/villains">villains of Islamic history</Link>, from Iblis to the Dajjal.
      </p>
      <div className="tl-index-cols">
        {data.chapters.map((c) => (
          <div key={c.id}>
            <h3>
              <Link href={`/timeline/chapter-${c.id}`}>
                {c.n}. {c.title}
              </Link>
              <small>{c.span}</small>
            </h3>
            <ul>
              {data.stops.slice(c.start + 1, c.start + c.count).map((s) => (
                <li key={s.id}>
                  <Link href={`/timeline/${s.id}`} aria-current={s.id === current ? "page" : undefined}>
                    <time>{s.label.split(" · ")[0]}</time> {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
