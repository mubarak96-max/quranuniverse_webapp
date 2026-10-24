"use client";

import { useMemo, useState } from "react";
import { linkOf, search } from "@/lib/timeline-graph";
import { GROUP_LABEL, refHref, sameRef, type CardLink, type PersonGroup, type Ref, type TimelineData } from "@/lib/timeline-types";

export type Shelf = PersonGroup | "nations" | "empires" | "places";

const SHELVES: [Shelf, string][] = [
  ["quran", GROUP_LABEL.quran],
  ["nations", "Nations of the Quran"],
  ["unseen", GROUP_LABEL.unseen],
  ["family", "Family of the Prophet ﷺ"],
  ["companion", GROUP_LABEL.companion],
  ["hadith", GROUP_LABEL.hadith],
  ["scholar", GROUP_LABEL.scholar],
  ["ruler", "Kings and rulers"],
  ["empires", "Empires"],
  ["places", "Places"],
];

const BLURB: Record<Shelf, string> = {
  quran: "Everyone the Quran names or points to who was not a prophet",
  nations: "The peoples whose stories the Quran tells, and what became of them",
  unseen: "Angels, jinn and the beings we believe in without seeing",
  family: "The wives, children and grandchildren of the Prophet ﷺ",
  companion: "The men and women who knew the Prophet ﷺ and believed",
  hadith: "People we know from the Prophet's ﷺ own stories and the Seerah",
  scholar: "The minds who carried the knowledge, from the Tabi'un to modern times",
  ruler: "Caliphs, sultans and the kings whose stories touch Islam",
  empires: "The powers of the world, Muslim and not, and how they met Islam",
  places: "Cities, mountains and sites where the story happened",
};

type Props = {
  data: TimelineData;
  shelf: Shelf;
  selected?: Ref;
  onShelf: (shelf: Shelf) => void;
  onSelect: (ref: Ref) => void;
};

export function LibraryView({ data, shelf, selected, onShelf, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const eraOrder = useMemo(() => new Map(data.chapters.map((c, i) => [c.id, i])), [data.chapters]);

  const items = useMemo<CardLink[]>(() => {
    if (query.trim().length >= 2) return search(data, query, 60).filter((l) => l.ref.t !== "event");
    if (shelf === "nations") return data.nations.map((n) => linkOf(data, { t: "nation", id: n.id }));
    if (shelf === "empires") return [...data.states].sort((a, b) => a.from - b.from).map((s) => linkOf(data, { t: "polity", id: s.id }));
    if (shelf === "places") return [...data.sites].sort((a, b) => a.name.localeCompare(b.name)).map((s) => linkOf(data, { t: "place", id: s.id }));
    return data.people
      .filter((p) => p.group === shelf)
      .sort((a, b) => (eraOrder.get(a.era) ?? 99) - (eraOrder.get(b.era) ?? 99) || (a.from ?? -1e5) - (b.from ?? -1e5))
      .map((p) => linkOf(data, { t: "person", id: p.id }));
  }, [data, shelf, query, eraOrder]);

  const counts = useMemo(() => {
    const c = new Map<Shelf, number>();
    for (const p of data.people) c.set(p.group, (c.get(p.group) ?? 0) + 1);
    c.set("nations", data.nations.length);
    c.set("empires", data.states.length);
    c.set("places", data.sites.length);
    return c;
  }, [data]);

  return (
    <div className="lib">
      <div className="lib-top">
        <label className="lib-search">
          <span className="sr-only">Search the library</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, nations, empires, places…" />
        </label>
        <nav className="lib-shelves" aria-label="Shelves">
          {SHELVES.filter(([s]) => counts.get(s)).map(([s, label]) => (
            <button
              key={s}
              type="button"
              className={shelf === s && !query ? "on" : undefined}
              aria-pressed={shelf === s && !query}
              onClick={() => {
                setQuery("");
                onShelf(s);
              }}
            >
              {label}
              <small>{counts.get(s)}</small>
            </button>
          ))}
        </nav>
      </div>
      <p className="lib-blurb">{query ? `${items.length} found` : BLURB[shelf]}</p>
      <ul className="lib-grid">
        {items.map((l) => (
          <li key={`${l.ref.t}:${l.ref.id}`}>
            <a
              href={refHref(l.ref)}
              className={`lib-card t-${l.ref.t}${sameRef(selected, l.ref) ? " on" : ""}`}
              aria-current={sameRef(selected, l.ref) ? "true" : undefined}
              onClick={(e) => {
                e.preventDefault();
                onSelect(l.ref);
              }}
            >
              <b>{l.name}</b>
              {l.sub && <span>{l.sub}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
