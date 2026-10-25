"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { Chapter, Kind, Stop } from "@/lib/timeline-types";

export type DirectoryMoment = Pick<Stop, "id" | "chapter" | "title" | "label" | "kind" | "what" | "place" | "who">;

type Props = {
  chapters: Chapter[];
  moments: number;
  events?: DirectoryMoment[];
  resume?: Stop;
  map?: ReactNode;
  onStart?: (stop: number) => void;
  onOpen?: (id: string) => void;
  onView?: (view: "prophets" | "empires" | "library" | "villains") => void;
};

const topics: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "All topics" },
  { id: "prophet", label: "Prophets & their people" },
  { id: "revelation", label: "Faith & revelation" },
  { id: "empire", label: "Caliphates & empires" },
  { id: "knowledge", label: "Knowledge & discovery" },
  { id: "battle", label: "Battles & conquests" },
  { id: "world", label: "The wider world" },
  { id: "event", label: "People & turning points" },
];

const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function TimelineHome({ chapters, moments, events = [], resume, map, onStart, onOpen, onView }: Props) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Kind | "all">("all");
  const search = normalize(query.trim());
  const filtered = topic !== "all" || search.length > 0;
  const groups = useMemo(() => chapters.map((chapter) => ({
    chapter,
    events: events.filter((event) => event.chapter === chapter.n - 1 &&
      (topic === "all" || (event.kind ?? "event") === topic) &&
      (!search || normalize(`${event.title} ${event.what} ${event.label} ${event.place?.name ?? ""} ${event.who?.map((p) => p.name).join(" ") ?? ""} ${chapter.title}`).includes(search))),
  })).filter((group) => !filtered || group.events.length > 0), [chapters, events, topic, search, filtered]);
  const found = groups.reduce((total, group) => total + group.events.length, 0);

  return (
    <div className="th-home">
      <header className="th-intro">
        <div className="th-heading">
          <p className="th-breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span>Timeline</p>
          <h1>A world of stories.<br />A journey through time.</h1>
          <p>Choose a year. Explore the world. Discover the people, places, and moments that shaped Islamic history.</p>
          <div className="th-intro-actions">
            <a className="th-primary" href="#timeline-chapters">Browse the chapters <span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </header>

      <div className="th-map-wrap">
        {map ?? <div className="th-map-loading" role="status">Loading the interactive map…</div>}
      </div>

      {resume && <Link className="th-resume" href={`/timeline/${resume.id}`} onClick={onOpen ? (e) => { e.preventDefault(); onOpen(resume.id); } : undefined}>
        <span>Continue where you left off <strong>{resume.title}</strong></span><span aria-hidden="true">→</span>
      </Link>}

      <div className="th-directory" id="timeline-chapters">
        <aside className="th-sidebar">
          <h2>Explore by topic</h2>
          <div className="th-topics" role="group" aria-label="Filter moments by topic">
            {topics.map(({ id, label }) => <button key={id} type="button" aria-pressed={topic === id} onClick={() => setTopic(id)}>
              <span>{label}</span><span>{id === "all" ? moments : events.filter((event) => (event.kind ?? "event") === id).length}</span>
            </button>)}
          </div>
          <nav className="th-collections" aria-label="More ways to explore">
            <h3>Follow a different thread</h3>
            {([
              ["prophets", "/timeline#prophets", "The prophets’ family tree"],
              ["empires", "/timeline#empires", "Empires through time"],
              ["library", "/timeline/library", "People, places & nations"],
              ["villains", "/timeline/villains", "Villains of Islamic history"],
            ] as const).map(([view, href, label]) => <a key={view} href={href} onClick={onView ? (e) => { e.preventDefault(); onView(view); } : undefined}>{label}<span aria-hidden="true">↗</span></a>)}
          </nav>
        </aside>

        <section className="th-content" aria-labelledby="th-chapters-title">
          <div className="th-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <label className="sr-only" htmlFor="th-search">Search the timeline</label>
            <input id="th-search" type="search" placeholder="Search a person, place, or moment…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="th-list-heading">
            <h2 id="th-chapters-title">{topic === "all" ? "The chapters" : topics.find((item) => item.id === topic)?.label}</h2>
            <span aria-live="polite">{filtered ? `${found} moments found` : `${chapters.length} chapters · ${moments} moments`}</span>
          </div>
          <div className="th-chapters" key={`${topic}:${search}`}>
            {groups.map(({ chapter, events: matches }) => <details className="th-chapter" key={chapter.id} open={filtered || undefined}>
              <summary>
                <span className="th-chapter-number">{String(chapter.n).padStart(2, "0")}</span>
                <span className="th-chapter-copy">
                  <span className="th-chapter-date">{chapter.span}</span>
                  <h3>{chapter.title}</h3>
                  <span className="th-chapter-description">{chapter.blurb}</span>
                  <span className="th-chapter-count">{filtered ? matches.length : chapter.count - 1} moments</span>
                </span>
                <span className="th-expand" aria-hidden="true">+</span>
              </summary>
              <div className="th-chapter-body">
                <Link className="th-read-chapter" href={`/timeline/chapter-${chapter.id}`} onClick={onStart ? (e) => { e.preventDefault(); onStart(chapter.start); } : undefined}>Read this chapter <span aria-hidden="true">→</span></Link>
                <ol className="th-moments">
                  {matches.map((event) => <li key={event.id}>
                    <Link href={`/timeline/${event.id}`} onClick={onOpen ? (e) => { e.preventDefault(); onOpen(event.id); } : undefined}>
                      <span className="th-moment-date">{event.label.split(" · ")[0]}</span>
                      <span><strong>{event.title}</strong>{event.place?.name && <small>{event.place.name}</small>}</span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </li>)}
                </ol>
              </div>
            </details>)}
          </div>
          {!groups.length && <div className="th-empty"><h3>No moments found</h3><p>Try another name or place, or browse all topics.</p><button type="button" onClick={() => { setQuery(""); setTopic("all"); }}>Clear filters</button></div>}
          <p className="th-date-note">A note on dates: the earliest prophets are presented in narrative order; their years are unknown. Ancient dates are approximate. Signs of the Hour describe events still to come.</p>
          <details className="th-sources"><summary>Sources & map credits</summary><p>Sources include the Quran, Sahih al-Bukhari and Muslim, the Seerah of Ibn Ishaq, Ibn Kathir&apos;s al-Bidaya wan-Nihaya, and standard histories. Approximate map borders come from Cliopatria, the open map of the Seshat Global History Databank (CC BY 4.0).</p></details>
        </section>
      </div>
    </div>
  );
}
