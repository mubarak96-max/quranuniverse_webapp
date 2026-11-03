import Link from "next/link";
import { chapterArt, LENSES, small, thingsOf, type Lens } from "@/lib/timeline-things";
import { refHref, type TimelineData } from "@/lib/timeline-types";

// Below the atlas: the story as eleven illustrated chapters, then every entry by kind. Server-rendered, so every page
// is one plain link away for readers without scripts and for search engines.
export function TimelineArchive({ data, focus }: { data: TimelineData; focus?: Lens }) {
  const things = thingsOf(data);
  const moments = things.filter((t) => t.lens === "moment");
  const order: Lens[] = focus ? [focus, ...LENSES.map((l) => l.id).filter((l) => l !== focus && l !== "moment")] : LENSES.map((l) => l.id).filter((l) => l !== "moment");
  return (
    <section className="arc" aria-labelledby="arc-h">
      <header className="arc-head">
        <div>
          <p className="arc-eyebrow">History in {data.chapters.length} chapters</p>
          <h2 id="arc-h">From the first human to the Last Day</h2>
        </div>
        <p>
          {moments.length} moments, {data.prophets.length} prophets, {data.people.length} people, {data.sites.length} places and {data.states.length} empires, each tied
          to what the Quran and the authentic hadith say. Pick a chapter to read it from the start, or explore it on the map above.
        </p>
      </header>
      <div className="arc-grid">
        {data.chapters.map((c) => (
          <Link key={c.id} className="arc-card" href={`/timeline/chapter-${c.id}`} style={{ backgroundImage: `url(${c.n === 1 ? chapterArt(c) : small(chapterArt(c))})` }}>
            <span className="arc-n">CHAPTER {String(c.n).padStart(2, "0")}</span>
            <h3>{c.title}</h3>
            <p>{c.blurb}</p>
            <span className="arc-meta">
              <span>{c.span}</span>
              <span>{c.count - 1} moments</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="arc-index">
        <h2>Everything in the timeline</h2>
        <p>Every entry has its own page with the verses, hadith, people and places connected to it.</p>
        {data.chapters.map((c, i) => {
          const list = moments.filter((t) => t.chapter === i);
          return (
            <details key={c.id}>
              <summary>
                {c.n}. {c.title} <small>{list.length} moments</small>
              </summary>
              <ul>
                {list.map((t) => (
                  <li key={t.key}>
                    <Link href={refHref(t.ref)}>{t.name}</Link>
                    {t.when && <small>{t.when}</small>}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
        {order.map((lens) => {
          const list = things.filter((t) => t.lens === lens).sort((a, b) => a.name.localeCompare(b.name));
          const label = LENSES.find((l) => l.id === lens)!.label;
          return (
            <details key={lens} open={lens === focus || undefined}>
              <summary>
                {label} <small>{list.length}</small>
              </summary>
              <ul>
                {list.map((t) => (
                  <li key={t.key}>
                    <Link href={refHref(t.ref)}>{t.name}</Link>
                    {t.sub && lens !== "prophet" && lens !== "nation" && <small>{t.sub}</small>}
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
        <p className="arc-note">
          A note on dates: the earliest prophets are told in the Quran&apos;s order; their years are unknown. Ancient dates are approximate. Sources include the Quran, Sahih
          al-Bukhari and Muslim, the Seerah of Ibn Ishaq, Ibn Kathir&apos;s al-Bidaya wan-Nihaya and standard histories. Map borders come from Cliopatria, the open map of
          the Seshat Global History Databank (CC BY 4.0). Illustrations are artistic impressions and never depict prophets or angels.
        </p>
      </div>
    </section>
  );
}
