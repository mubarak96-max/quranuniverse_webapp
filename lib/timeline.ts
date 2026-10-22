// Timeline content lives in content/timeline: eras/<nn>-<id>.json (chapters and their moments), states.json,
// prophets.json, villains.json and overlays.json. Map layers are pre-built into public/borders by tools/borders.mjs.
import fs from "node:fs";
import path from "node:path";
import { getTranslation, surahHref } from "./data";
import { project, type Focus, type Pt } from "./map";
import {
  AXIS,
  toAh,
  yearText,
  type Chapter,
  type EndSigns,
  type Kind,
  type Overlay,
  type Place,
  type Precision,
  type Prophet,
  type Route,
  type State,
  type Stop,
  type TimelineData,
  type TimelineSeed,
  type Verse,
  type Villain,
  type VillainAge,
} from "./timeline-types";

const ROOT = path.join(process.cwd(), "content", "timeline");
const BORDERS = path.join(process.cwd(), "public", "borders");

type LatLng = { lat?: number; lng?: number };
type RawEvent = {
  id: string;
  title: string;
  year: { ce: number; ah?: number; precision: Precision };
  place: { name: string } & LatLng;
  who?: string[];
  what: string;
  verses?: string[];
  quote?: RawQuote;
  routes?: { points: [number, number, string?][] }[];
  camera?: { zoom: number };
  article?: string;
  journey?: string;
  source: string;
  kind: Kind;
};
type RawEra = {
  id: string;
  title: string;
  span: string;
  blurb: string;
  camera: { lat: number; lng: number; zoom: number };
  zoom: number;
  events: RawEvent[];
};

const read = <T>(rel: string) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as T;

function place(p: { name: string } & LatLng): Place {
  const pt = p.lat !== undefined && p.lng !== undefined ? project(p.lat, p.lng) : undefined;
  return pt ? { name: p.name, ...pt } : { name: p.name };
}

// "2:30-37" links to 2:30. Only the quoted verse carries its text, which keeps the data file small.
export function verse(ref: string, withText: boolean, cut?: { from: string; to?: string }): Verse {
  const [surah, range] = ref.split(":");
  const first = range.split("-")[0];
  const href = surahHref(+surah, +first);
  if (!withText) return { ref, href };
  const text = getTranslation(`${surah}:${first}`);
  if (!cut) return { ref, href, text };
  // An excerpt of a long verse such as 5:3; ellipses mark each cut.
  const start = text.indexOf(cut.from);
  const end = cut.to ? text.indexOf(cut.to, start) + cut.to.length : text.length;
  return { ref, href, text: `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? " …" : ""}` };
}

type RawQuote = string | { ref: string; from: string; to?: string };
const quoted = (q: RawQuote) => (typeof q === "string" ? verse(q, true) : verse(q.ref, true, q));

// The quote defaults to the first verse of the first reference; content can name a stronger one.
function quoteOf(e: RawEvent): Verse | undefined {
  if (e.quote) return quoted(e.quote);
  return e.verses?.length ? verse(e.verses[0], true) : undefined;
}

function route(points: [number, number, string?][]): Route {
  const pts = points.map(([lat, lng, name]) => ({ ...project(lat, lng)!, name: name ?? "" }));
  return { d: "M" + pts.map((p) => `${p.x},${p.y}`).join("L"), stops: pts.filter((p) => p.name) };
}

function boxOf(points: Pt[]): [number, number, number, number] {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

function label(y: RawEvent["year"]): string {
  if (y.precision === "unknown") return "Date unknown";
  const ah = y.ah ?? (y.ce >= 622 ? toAh(y.ce) : undefined);
  return ah === undefined ? yearText(y.ce, y.precision) : `${yearText(y.ce, y.precision)} · ${ah} AH`;
}

function eventStop(e: RawEvent, era: RawEra, chapter: number, chapterFocus: Focus): Stop {
  const p = place(e.place);
  const routes = (e.routes ?? []).map((r) => route(r.points));
  const zoom = e.camera?.zoom ?? era.zoom;
  let focus: Focus = chapterFocus;
  if (routes.length) {
    const pts = (e.routes ?? []).flatMap((r) => r.points.map(([lat, lng]) => project(lat, lng)!));
    focus = { x: 0, y: 0, zoom, box: boxOf(p.x !== undefined ? [...pts, p as Pt] : pts) };
  } else if (p.x !== undefined && p.y !== undefined) {
    focus = { x: p.x, y: p.y, zoom };
  }
  return {
    id: e.id,
    type: "event",
    chapter,
    title: e.title,
    label: label(e.year),
    year: e.year.ce < AXIS.min ? undefined : e.year.ce,
    ah: e.year.ah,
    precision: e.year.precision,
    what: e.what,
    who: e.who,
    place: p,
    verses: (e.verses ?? []).map((v) => verse(v, false)),
    quote: quoteOf(e),
    article: e.article,
    journey: e.journey,
    source: e.source,
    kind: e.kind,
    routes,
    focus,
  };
}

let cache: TimelineData | undefined;

export function getTimeline(): TimelineData {
  if (cache) return cache;
  const stops: Stop[] = [];
  const chapters: Chapter[] = [];
  const files = fs.readdirSync(path.join(ROOT, "eras")).filter((f) => f.endsWith(".json")).sort();
  files.forEach((file, n) => {
    const era = read<RawEra>(path.join("eras", file));
    const c = project(era.camera.lat, era.camera.lng)!;
    const chapterFocus: Focus = { x: c.x, y: c.y, zoom: era.camera.zoom };
    const events = [...era.events].sort((a, b) => a.year.ce - b.year.ce || (a.year.ah ?? 0) - (b.year.ah ?? 0));
    const dated = events.filter((e) => e.year.precision !== "unknown" && e.year.ce >= AXIS.min).map((e) => e.year.ce);
    chapters.push({
      id: era.id,
      n: n + 1,
      title: era.title,
      span: era.span,
      blurb: era.blurb,
      start: stops.length,
      count: events.length + 1,
      from: dated.length ? Math.min(...dated) : undefined,
      to: dated.length ? Math.max(...dated) : undefined,
    });
    stops.push({
      id: `chapter-${era.id}`,
      type: "chapter",
      chapter: n,
      title: era.title,
      label: era.span,
      year: events[0].year.ce < AXIS.min ? undefined : events[0].year.ce,
      precision: "exact",
      what: era.blurb,
      verses: [],
      routes: [],
      focus: chapterFocus,
    });
    for (const e of events) stops.push(eventStop(e, era, n, chapterFocus));
  });

  const states = read<(Omit<State, "capital"> & { capital: { name: string } & LatLng })[]>("states.json").map((s) => ({
    ...s,
    capital: place(s.capital),
  }));

  const overlays = read<{ overlays: (Omit<Overlay, "d" | "label"> & { ring: [number, number][]; label: [number, number] })[] }>(
    "overlays.json",
  ).overlays.map<Overlay>(({ ring, label: at, ...o }) => ({
    ...o,
    d: "M" + ring.map(([lng, lat]) => project(lat, lng)!).map((p) => `${p.x},${p.y}`).join("L") + "Z",
    label: project(at[1], at[0])!,
  }));

  const prophets = read<(Omit<Prophet, "verse" | "place"> & { verse: string; place?: { name: string } & LatLng })[]>(
    "prophets.json",
  ).map<Prophet>((p) => ({ ...p, verse: verse(p.verse, true), place: p.place ? place(p.place) : undefined }));

  const {
    ages: villainAges,
    signs: endSigns,
    villains: rawVillains,
  } = read<{
    ages: VillainAge[];
    signs: EndSigns;
    villains: (Omit<Villain, "verse" | "said" | "mentions" | "place"> & {
      verse?: RawQuote;
      said?: RawQuote;
      mentions?: string[];
      place?: { name: string } & LatLng;
    })[];
  }>("villains.json");
  const villains = rawVillains.map<Villain>((v) => ({
    ...v,
    verse: v.verse ? quoted(v.verse) : undefined,
    said: v.said ? quoted(v.said) : undefined,
    mentions: (v.mentions ?? []).map((r) => verse(r, false)),
    place: v.place ? place(v.place) : undefined,
  }));

  const snapshots = fs
    .readdirSync(BORDERS)
    .filter((f) => /^-?\d+\.json$/.test(f))
    .map((f) => +f.replace(".json", ""))
    .sort((a, b) => a - b);

  cache = { stops, chapters, states, overlays, prophets, villains, villainAges, endSigns, snapshots, now: new Date().getUTCFullYear() };
  return cache;
}

export const getStop = (id: string) => getTimeline().stops.find((s) => s.id === id);

export const getVillain = (id: string) => getTimeline().villains.find((v) => v.id === id);

// The small slice a page renders on the server before the full data file arrives.
export function getSeed(id?: string): TimelineSeed {
  const { chapters, stops, now } = getTimeline();
  const stop = id ? getStop(id) : undefined;
  const position = stop ? stops.indexOf(stop) - chapters[stop.chapter].start + 1 : 0;
  return { chapters, now, moments: stops.filter((s) => s.type === "event").length, stop, position };
}

// Villain pages render the whole line and panel on the server, so every villain is readable without scripts.
export function getVillainSeed(): TimelineSeed {
  const { villains, villainAges, endSigns } = getTimeline();
  return { ...getSeed(), villains: { list: villains, ages: villainAges, signs: endSigns } };
}
