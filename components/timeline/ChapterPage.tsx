import Link from "next/link";
import { artOf, chapterArt, eraHref, initials, mapHref, small, thingsOf } from "@/lib/timeline-things";
import { KIND_LABEL, refHref, type TimelineData } from "@/lib/timeline-types";
import { TONE } from "./atlas-style";

// A chapter read from top to bottom: its painting, then every moment on an illustrated vertical timeline.
export function ChapterPage({ data, index }: { data: TimelineData; index: number }) {
  const c = data.chapters[index];
  const moments = data.stops.slice(c.start + 1, c.start + c.count);
  const things = thingsOf(data).filter((t) => t.chapter === index);
  const people = things.filter((t) => t.lens === "prophet" || t.lens === "person").slice(0, 14);
  const prev = data.chapters[index - 1];
  const next = data.chapters[index + 1];
  const counts = {
    prophets: things.filter((t) => t.lens === "prophet").length,
    people: things.filter((t) => t.lens === "person").length,
    villains: things.filter((t) => t.lens === "villain").length,
  };

  return (
    <article className="en en-chapter">
      <header className="en-hero en-hero-tall" style={{ backgroundImage: `url(${chapterArt(c)})` }}>
        <div className="en-hero-in">
          <nav className="en-crumbs" aria-label="Breadcrumb">
            <Link href="/timeline">Timeline</Link>
            <span aria-hidden="true">/</span>
            <span>Chapter {c.n}</span>
          </nav>
          <p className="en-kind">
            Chapter {c.n} of {data.chapters.length} · {c.span}
          </p>
          <h1>{c.title}</h1>
          <p className="en-hero-blurb">{c.blurb}</p>
          <ul className="en-chips">
            <li>{moments.length} moments</li>
            {counts.prophets > 0 && <li>{counts.prophets} prophets</li>}
            {counts.people > 0 && <li>{counts.people} people</li>}
            {counts.villains > 0 && <li>{counts.villains} villains</li>}
          </ul>
          <div className="en-actions">
            <Link href={eraHref(c)} className="en-btn en-btn-map">
              Explore this chapter on the map
            </Link>
            {moments[0] && (
              <Link href={`/timeline/${moments[0].id}`} className="en-btn">
                Start reading →
              </Link>
            )}
          </div>
        </div>
      </header>

      {people.length > 0 && (
        <section className="ch-cast" aria-labelledby="ch-cast-h">
          <h2 id="ch-cast-h">Who you will meet</h2>
          <ul>
            {people.map((p) => (
              <li key={p.key}>
                <Link href={mapHref(p.ref)} style={{ ["--c" as string]: TONE[p.tone] }}>
                  <span className="ch-av" aria-hidden="true">
                    {initials(p.name)}
                  </span>
                  <b>{p.name}</b>
                  {p.sub && p.lens !== "prophet" && <small>{p.sub}</small>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ol className="ch-line">
        {moments.map((m, i) => (
          <li key={m.id} style={{ ["--c" as string]: TONE[m.kind ?? "event"] }}>
            <div className="ch-when">
              <span>{m.label.split(" · ")[0]}</span>
              {m.ah !== undefined && <small>{m.ah} AH</small>}
            </div>
            <div className="ch-dot" aria-hidden="true" />
            <div className="ch-body">
              {(i % 6 === 0 || m.kind === "revelation" || m.kind === "battle") && (
                <div className="ch-art" style={{ backgroundImage: `url(${artOf(data, { t: "event", id: m.id })})` }} aria-hidden="true" />
              )}
              <p className="ch-kind">
                {KIND_LABEL[m.kind ?? "event"]}
                {m.place?.name && ` · ${m.place.name}`}
              </p>
              <h2>
                <Link href={refHref({ t: "event", id: m.id })}>{m.title}</Link>
              </h2>
              <p>{m.what}</p>
              {m.quote?.text && (
                <blockquote>
                  “{m.quote.text.length > 200 ? `${m.quote.text.slice(0, 197).replace(/\s+\S*$/, "")}…` : m.quote.text}” <cite>Quran {m.quote.ref}</cite>
                </blockquote>
              )}
              <div className="ch-links">
                <Link href={refHref({ t: "event", id: m.id })}>Read more →</Link>
                {m.place?.lng !== undefined && <Link href={mapHref({ t: "event", id: m.id })}>On the map</Link>}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <nav className="en-next" aria-label="Other chapters">
        {prev ? (
          <Link href={`/timeline/chapter-${prev.id}`} style={{ backgroundImage: `url(${small(chapterArt(prev))})` }}>
            <small>← Chapter {prev.n}</small>
            <b>{prev.title}</b>
            <span>{prev.span}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/timeline/chapter-${next.id}`} className="en-next-r" style={{ backgroundImage: `url(${small(chapterArt(next))})` }}>
            <small>Chapter {next.n} →</small>
            <b>{next.title}</b>
            <span>{next.span}</span>
          </Link>
        )}
      </nav>
    </article>
  );
}
