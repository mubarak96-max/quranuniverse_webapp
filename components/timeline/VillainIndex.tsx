import Link from "next/link";
import type { Villain, VillainAge } from "@/lib/timeline-types";

// Plain list under the interactive line: crawlable links to every villain page, and a fallback when scripts fail.
export function VillainIndex({ villains, ages, current }: { villains: Villain[]; ages: VillainAge[]; current?: string }) {
  return (
    <section className="tl-index" aria-labelledby="vl-index-h">
      <h2 id="vl-index-h">Every villain in Islamic history, from Iblis to the Dajjal</h2>
      <p className="tl-index-note">
        Each entry is drawn from the Quran, authentic hadith (with links to sunnah.com), the classical commentators and the
        historians. Companions who fought Islam and later became Muslim are not included, nor are figures Muslims disagree about.
      </p>
      <div className="tl-index-cols">
        {ages.map((a) => (
          <div key={a.id}>
            <h3>
              {a.title}
              <small>{a.span}</small>
            </h3>
            <ul>
              {villains
                .filter((v) => v.age === a.id)
                .map((v) => (
                  <li key={v.id}>
                    <Link href={`/timeline/villains/${v.id}`} aria-current={v.id === current ? "page" : undefined}>
                      <time>{v.when}</time> {v.name}: {v.title.toLowerCase()}
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
