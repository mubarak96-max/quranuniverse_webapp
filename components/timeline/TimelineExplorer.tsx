"use client";

import { useCallback, useMemo, useState } from "react";
import { placeOf, search, yearOf } from "@/lib/timeline-graph";
import { clampMapYear, timelineEntry } from "@/lib/timeline-entry";
import { AXIS, yearToT, type Focus, type Ref, type TimelineData } from "@/lib/timeline-types";
import { Atlas, type Light, type Pin, type Spot } from "./Atlas";
import { ExplorerYears } from "./ExplorerYears";
import { MapPreview } from "./MapPreview";

const WORLD: Focus = { lng: 38, lat: 24, zoom: 1.7 };

export function TimelineExplorer({ data, year, onYear }: { data: TimelineData; year: number; onYear: (year: number) => void }) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Ref>();
  const [spot, setSpot] = useState<Spot>();
  const [atLocation, setAtLocation] = useState<string[]>([]);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [focus, setFocus] = useState(WORLD);
  const [focusKey, setFocusKey] = useState("world");
  const entries = useMemo(() => data.stops.filter((stop) => stop.type === "event" && stop.year !== undefined && stop.precision !== "unknown" && stop.place?.lng !== undefined && stop.place.lat !== undefined), [data]);
  const lights = useMemo<Light[]>(() => entries.map((stop) => ({ id: stop.id, lng: stop.place!.lng!, lat: stop.place!.lat!, k: stop.kind ?? "event", t: yearToT(stop.year!), n: stop.title, y: stop.label.split(" · ")[0] })), [entries]);
  const results = useMemo(() => search(data, query, 7), [data, query]);
  const card = useMemo(() => selection ? timelineEntry(data, selection) : undefined, [data, selection]);
  const nearby = useMemo(() => spot ? entries.filter((stop) => Math.abs(stop.place!.lat! - spot.lat) < 8 && Math.abs(stop.place!.lng! - spot.lng) < 8).sort((a, b) => Math.abs(a.year! - year) - Math.abs(b.year! - year)).slice(0, 3) : [], [entries, spot, year]);

  const select = useCallback((ref: Ref, move = false) => {
    setPlaying(false);
    setAtLocation([]);
    setSpot(undefined);
    setSelection(ref);
    setQuery("");
    if (move) {
      const at = yearOf(data, ref);
      if (at !== undefined) onYear(clampMapYear(at, AXIS.min, AXIS.max));
      const place = placeOf(data, ref);
      if (place?.lng !== undefined && place.lat !== undefined) {
        setFocus({ lng: place.lng, lat: place.lat, zoom: 3 });
        setFocusKey(`${ref.t}:${ref.id}`);
      }
    }
  }, [data, onYear]);

  const pins = useMemo<Pin[]>(() => {
    const capitals = data.states.filter((state) => state.from <= year && state.to >= year && state.capital.lng !== undefined && state.capital.lat !== undefined).map((state): Pin => ({ id: state.id, lng: state.capital.lng!, lat: state.capital.lat!, tone: "capital", label: state.capital.name, onSelect: () => select({ t: "polity", id: state.id }) }));
    const place = selection ? placeOf(data, selection) : undefined;
    if (place?.lng !== undefined && place.lat !== undefined) capitals.push({ id: "selected", lng: place.lng, lat: place.lat, tone: "place", active: true, label: card?.name, onSelect: () => selection && select(selection) });
    return capitals;
  }, [data, year, selection, card?.name, select]);

  const changeYear = useCallback((next: number) => { onYear(next); setSelection(undefined); setSpot(undefined); }, [onYear]);
  const openSpot = (at: Spot) => {
    setPlaying(false);
    const state = data.states.find((item) => item.id === at.state || (at.name && item.name.toLowerCase() === at.name.toLowerCase()));
    if (state) select({ t: "polity", id: state.id });
    else { setSelection(undefined); setSpot(at); }
  };

  return (
    <section className={`ex-explorer${expanded ? " ex-expanded" : ""}`} id="timeline-map" aria-label="Explore Islamic history on the map">
      <div className="ex-toolbar">
        <div className="ex-map-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <label className="sr-only" htmlFor="ex-search">Find a person, place, or event on the map</label>
          <input id="ex-search" type="search" autoComplete="off" placeholder="Find a place, person, or event…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") setQuery(""); }} aria-controls={query.trim().length >= 2 ? "ex-search-results" : undefined} />
          {query.trim().length >= 2 && <div className="ex-search-results" id="ex-search-results"><p role="status">{results.length ? "Search results from all periods" : "No matches. Try another name or place."}</p>{results.map((result) => <button type="button" key={`${result.ref.t}:${result.ref.id}`} onClick={() => select(result.ref, true)}><strong>{result.name}</strong><span>{result.sub}</span></button>)}</div>}
        </div>
        <button type="button" className="ex-expand-map" aria-pressed={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Reduce map" : "Expand map"}<span aria-hidden="true">{expanded ? "↙" : "↗"}</span></button>
      </div>
      <div className="tl-app ex-map">
        <Atlas year={year} states={data.states} overlays={data.overlays} focus={focus} focusKey={focusKey} routes={[]} routeKey="explorer" pins={pins} mode="rulers" lights={lights} onLight={(id) => select({ t: "event", id })} onLights={(ids) => {
          const ordered = [...ids].sort((a, b) => Math.abs(entries.find((stop) => stop.id === a)!.year! - year) - Math.abs(entries.find((stop) => stop.id === b)!.year! - year));
          select({ t: "event", id: ordered[0] });
          setAtLocation(ordered);
        }} onSpot={openSpot} spot={spot} />
        <div className="ex-map-key"><span><i />Historical moments</span><span><i />Capitals</span></div>
      </div>
      <div className="ex-map-status"><p><strong>{entries.length}</strong> mapped moments across all periods</p></div>
      <ExplorerYears year={year} chapters={data.chapters} playing={playing} onPlay={setPlaying} onYear={changeYear} />
      <p className="ex-map-footnote">Drag to move. Select a moment or territory to learn more. Borders and ancient dates are approximate; events with unknown dates are in the chapters below.</p>
      {(card || spot) && <MapPreview card={card} spot={spot} year={year} nearby={nearby} alternatives={entries.filter((stop) => atLocation.includes(stop.id) && stop.id !== selection?.id)} onClose={() => { setSelection(undefined); setSpot(undefined); setAtLocation([]); }} onSelect={(id) => select({ t: "event", id }, true)} />}
    </section>
  );
}
