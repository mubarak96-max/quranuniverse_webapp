// Timeline content lives in content/timeline: eras/<nn>-<id>.json (chapters and their moments), states.json,
// prophets.json, villains.json, people/*.json, nations.json, places.json and overlays.json. Map borders are pre-built
// into public/borders by tools/cliopatria.mjs. Cross-references are resolved here, at build time: `who` names and
// place names become refs, and `links` id lists become typed refs, dropping any id that does not exist
// (tools/validate-timeline.mjs reports those).
import fs from "node:fs";
import path from "node:path";
import { getTranslation, surahHref } from "./data";
import { buildCard } from "./timeline-graph";
import {
  AXIS,
  toAh,
  yearText,
  type Chapter,
  type EndSigns,
  type Focus,
  type Hadith,
  type Kind,
  type Nation,
  type Overlay,
  type Person,
  type Place,
  type Precision,
  type Prophet,
  type Ref,
  type RefType,
  type Route,
  type Site,
  type State,
  type Stop,
  type TimelineData,
  type TimelineSeed,
  type Verse,
  type Villain,
  type VillainAge,
} from "./timeline-types";

const ROOT = path.join(process.cwd(), "content", "timeline");

type LatLng = { lat?: number; lng?: number };
type RawPlace = { name: string } & LatLng;
type RawQuote = string | { ref: string; from: string; to?: string };
type RawLinks = Partial<Record<"prophets" | "people" | "villains" | "polities" | "events" | "places" | "nations", string[]>>;
type RawEvent = {
  id: string;
  title: string;
  year: { ce: number; to?: number; ah?: number; precision: Precision };
  place: RawPlace;
  who?: string[];
  what: string;
  tie?: string;
  note?: string;
  hadith?: Hadith[];
  wiki?: string;
  verses?: string[];
  quote?: RawQuote;
  routes?: { points: [number, number, string?][] }[];
  camera?: { zoom: number };
  article?: string;
  journey?: string;
  source: string;
  kind: Kind;
  links?: RawLinks;
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
type RawPerson = Omit<Person, "verses" | "quote" | "place" | "links"> & {
  verses?: string[];
  quote?: RawQuote;
  place?: RawPlace;
  links?: RawLinks;
  aliases?: string[];
};
type RawNation = Omit<Nation, "verses" | "quote" | "place" | "links" | "prophet"> & {
  prophet?: string | null;
  verses?: string[];
  quote?: RawQuote;
  place?: RawPlace;
  links?: RawLinks;
};
type RawSite = Omit<Site, "verses" | "links"> & { verses?: string[]; links?: RawLinks; aliases?: string[] };

const read = <T>(rel: string) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as T;
const readIf = <T>(rel: string, fallback: T) => (fs.existsSync(path.join(ROOT, rel)) ? read<T>(rel) : fallback);

// Story zooms in the content files were written for the old SVG atlas, where 1 fitted the Old World. MapLibre zoom 2
// shows a little more than that span on a laptop screen, which keeps neighbouring lands in view, and each doubling of
// the old scale is one MapLibre level.
const mapZoom = (z: number) => Math.min(9, Math.max(1, 2 + Math.log2(Math.max(z, 0.5))));

function place(p: RawPlace): Place {
  return p.lat !== undefined && p.lng !== undefined ? { name: p.name, lat: p.lat, lng: p.lng } : { name: p.name };
}

// "2:30-37" links to 2:30. Only the quoted verse carries its text, which keeps the data file small.
export function verse(ref: string, withText: boolean, cut?: { from: string; to?: string }): Verse {
  const [surah, range] = ref.split(":");
  const first = range.split("-")[0];
  const href = surahHref(+surah, +first);
  if (!withText) return { ref, href };
  const text = getTranslation(`${surah}:${first}`);
  if (!cut) return { ref, href, text };
  // An excerpt of a long verse such as 5:3; ellipses mark each cut. A cut that does not match falls back to the verse.
  const start = text.indexOf(cut.from);
  if (start < 0) return { ref, href, text };
  const end = cut.to && text.indexOf(cut.to, start) >= 0 ? text.indexOf(cut.to, start) + cut.to.length : text.length;
  return { ref, href, text: `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? " …" : ""}` };
}

const quoted = (q: RawQuote) => (typeof q === "string" ? verse(q, true) : verse(q.ref, true, q));
const refs = (list?: string[]) => (list ?? []).map((v) => verse(v, false));

function quoteOf(e: { quote?: RawQuote; verses?: string[] }): Verse | undefined {
  if (e.quote) return quoted(e.quote);
  return e.verses?.length ? verse(e.verses[0], true) : undefined;
}

function route(points: [number, number, string?][]): Route {
  return {
    coords: points.map(([lat, lng]) => [lng, lat]),
    stops: points.filter((p) => p[2]).map(([lat, lng, name]) => ({ name: name!, lng, lat })),
  };
}

function label(y: RawEvent["year"]): string {
  if (y.precision === "unknown") return "Date unknown";
  const ah = y.ah ?? (y.ce >= 622 ? toAh(y.ce) : undefined);
  return ah === undefined ? yearText(y.ce, y.precision) : `${yearText(y.ce, y.precision)} · ${ah} AH`;
}

// Names are matched loosely: case, diacritics, the ﷺ sign and punctuation are ignored.
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ﷺ/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const LINK_TYPE: Record<keyof RawLinks, RefType> = {
  prophets: "prophet",
  people: "person",
  villains: "villain",
  polities: "polity",
  events: "event",
  places: "place",
  nations: "nation",
};

let cache: TimelineData | undefined;

export function getTimeline(): TimelineData {
  if (cache) return cache;

  // clio (the Cliopatria names) is only needed by tools/cliopatria.mjs, so it is left out of the data file.
  const states = read<(Omit<State, "capital"> & { capital: RawPlace; clio?: string[] })[]>("states.json").map((raw) => {
    const s = { ...raw, capital: place(raw.capital) };
    delete s.clio;
    return s;
  });

  const overlays = read<{ overlays: Overlay[] }>("overlays.json").overlays;

  const prophetsRaw = read<(Omit<Prophet, "verse" | "place"> & { verse: string; place?: RawPlace })[]>("prophets.json");
  const villainFile = read<{
    ages: VillainAge[];
    signs: EndSigns;
    villains: (Omit<Villain, "verse" | "said" | "mentions" | "place"> & { verse?: RawQuote; said?: RawQuote; mentions?: string[]; place?: RawPlace })[];
  }>("villains.json");
  const peopleRaw = fs.existsSync(path.join(ROOT, "people"))
    ? fs
        .readdirSync(path.join(ROOT, "people"))
        .filter((f) => f.endsWith(".json"))
        .sort()
        .flatMap((f) => read<RawPerson[]>(path.join("people", f)))
    : [];
  const nationsRaw = readIf<RawNation[]>("nations.json", []);
  const sitesRaw = readIf<RawSite[]>("places.json", []);
  const eras = fs
    .readdirSync(path.join(ROOT, "eras"))
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => read<RawEra>(path.join("eras", f)));

  // Every id that a link may point at, by type.
  const ids: Record<RefType, Set<string>> = {
    event: new Set(eras.flatMap((e) => e.events.map((x) => x.id))),
    prophet: new Set(prophetsRaw.map((p) => p.id)),
    villain: new Set(villainFile.villains.map((v) => v.id)),
    person: new Set(peopleRaw.map((p) => p.id)),
    polity: new Set(states.map((s) => s.id)),
    place: new Set(sitesRaw.map((s) => s.id)),
    nation: new Set(nationsRaw.map((n) => n.id)),
  };
  const linksOf = (raw?: RawLinks, extra: Ref[] = []): Ref[] => {
    const out: Ref[] = [...extra];
    for (const [key, list] of Object.entries(raw ?? {}) as [keyof RawLinks, string[] | undefined][]) {
      const t = LINK_TYPE[key];
      if (!t || !list) continue;
      for (const id of list) if (ids[t].has(id) && !out.some((r) => r.t === t && r.id === id)) out.push({ t, id });
    }
    return out;
  };

  // Name index for `who` lists. Earlier entries win, so a prophet's name beats a person who shares it.
  const byName = new Map<string, Ref>();
  const addName = (name: string, ref: Ref) => {
    const k = norm(name);
    if (k && !byName.has(k)) byName.set(k, ref);
  };
  for (const p of prophetsRaw) addName(p.name, { t: "prophet", id: p.id });
  addName("Muhammad", { t: "prophet", id: "muhammad" });
  addName("The Prophet", { t: "prophet", id: "muhammad" });
  for (const v of villainFile.villains) addName(v.name, { t: "villain", id: v.id });
  for (const p of peopleRaw) for (const n of [p.name, ...(p.aliases ?? [])]) addName(n, { t: "person", id: p.id });
  for (const n of nationsRaw) addName(n.name, { t: "nation", id: n.id });
  const named = (name: string) => ({ name, ref: byName.get(norm(name)) });

  // Place names in events ("Cave of Hira, Makkah", "Cairo, Egypt") resolve to a place by its name or an alias: an exact
  // match first, then the alias that appears earliest in the name, then the longest. So "Mount Safa, Makkah" is Safa
  // when Safa is a place, and Makkah otherwise.
  const siteKeys = sitesRaw
    .flatMap((s) => [s.name, ...(s.aliases ?? []), ...(s.names ?? [])].map((a) => ({ key: norm(a), id: s.id })))
    .filter((k) => k.key.length >= 3);
  const siteFor = (name: string) => {
    const n = ` ${norm(name)} `;
    let best: { id: string; at: number; len: number } | undefined;
    for (const k of siteKeys) {
      if (n.trim() === k.key) return k.id;
      const at = n.indexOf(` ${k.key} `);
      if (at < 0) continue;
      if (!best || at < best.at || (at === best.at && k.key.length > best.len)) best = { id: k.id, at, len: k.key.length };
    }
    return best?.id;
  };
  const placeOf = (p: RawPlace): Place => {
    const site = siteFor(p.name);
    return site ? { ...place(p), site } : place(p);
  };

  const now = new Date().getUTCFullYear();
  const stops: Stop[] = [];
  const chapters: Chapter[] = [];
  eras.forEach((era, n) => {
    const chapterFocus: Focus = { lng: era.camera.lng, lat: era.camera.lat, zoom: mapZoom(era.camera.zoom) };
    const events = [...era.events].sort((a, b) => a.year.ce - b.year.ce || (a.year.ah ?? 0) - (b.year.ah ?? 0));
    const dated = (e: RawEvent) => e.year.precision !== "unknown" && e.year.ce >= AXIS.min && e.year.ce <= now;
    const years = events.filter(dated).map((e) => e.year.ce);
    chapters.push({
      id: era.id,
      n: n + 1,
      title: era.title,
      span: era.span,
      blurb: era.blurb,
      start: stops.length,
      count: events.length + 1,
      from: years.length ? Math.min(...years) : undefined,
      to: years.length ? Math.max(...years) : undefined,
    });
    stops.push({
      id: `chapter-${era.id}`,
      type: "chapter",
      chapter: n,
      title: era.title,
      label: era.span,
      year: events[0] && dated(events[0]) ? events[0].year.ce : undefined,
      precision: "exact",
      what: era.blurb,
      verses: [],
      routes: [],
      links: [],
      focus: chapterFocus,
    });
    for (const e of events) {
      const p = placeOf(e.place);
      const routes = (e.routes ?? []).map((r) => route(r.points));
      const zoom = mapZoom(e.camera?.zoom ?? era.zoom);
      let focus: Focus = chapterFocus;
      if (routes.length) {
        const pts = routes.flatMap((r) => r.coords).concat(p.lng !== undefined ? [[p.lng, p.lat!]] : []);
        const xs = pts.map((c) => c[0]);
        const ys = pts.map((c) => c[1]);
        focus = { lng: p.lng ?? xs[0], lat: p.lat ?? ys[0], zoom, bounds: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
      } else if (p.lng !== undefined) {
        focus = { lng: p.lng, lat: p.lat!, zoom };
      }
      stops.push({
        id: e.id,
        type: "event",
        chapter: n,
        title: e.title,
        label: label(e.year),
        year: dated(e) ? e.year.ce : undefined,
        to: e.year.to,
        ah: e.year.ah,
        precision: e.year.precision,
        what: e.what,
        tie: e.tie,
        note: e.note,
        hadith: e.hadith,
        wiki: e.wiki,
        who: e.who?.map(named),
        place: p,
        verses: refs(e.verses),
        quote: quoteOf(e),
        article: e.article,
        journey: e.journey,
        source: e.source,
        kind: e.kind,
        routes,
        links: linksOf(e.links, p.site ? [{ t: "place", id: p.site }] : []),
        focus,
      });
    }
  });

  const prophets = prophetsRaw.map<Prophet>((p) => ({ ...p, verse: verse(p.verse, true), place: p.place ? placeOf(p.place) : undefined }));

  const villains = villainFile.villains.map<Villain>((v) => ({
    ...v,
    verse: v.verse ? quoted(v.verse) : undefined,
    said: v.said ? quoted(v.said) : undefined,
    mentions: refs(v.mentions),
    place: v.place ? placeOf(v.place) : undefined,
  }));

  const people = peopleRaw.map<Person>((raw) => {
    const p = { ...raw };
    delete p.aliases;
    const extra: Ref[] = [];
    if (p.polity && ids.polity.has(p.polity)) extra.push({ t: "polity", id: p.polity });
    if (p.after && ids.person.has(p.after)) extra.push({ t: "person", id: p.after });
    const at = p.place ? placeOf(p.place) : undefined;
    if (at?.site) extra.push({ t: "place", id: at.site });
    return { ...p, verses: refs(p.verses), quote: p.quote ? quoted(p.quote) : undefined, place: at, links: linksOf(p.links, extra) };
  });

  const nations = nationsRaw.map<Nation>((n) => {
    const extra: Ref[] = [];
    if (n.prophet && ids.prophet.has(n.prophet)) extra.push({ t: "prophet", id: n.prophet });
    if (n.polity && ids.polity.has(n.polity)) extra.push({ t: "polity", id: n.polity });
    return {
      ...n,
      prophet: n.prophet ?? undefined,
      verses: refs(n.verses),
      quote: quoteOf(n),
      place: n.place ? placeOf(n.place) : undefined,
      links: linksOf(n.links, extra),
    };
  });

  const sites = sitesRaw.map<Site>((raw) => {
    const s = { ...raw };
    delete s.aliases;
    return { ...s, verses: refs(s.verses), links: linksOf(s.links) };
  });

  cache = { stops, chapters, states, overlays, prophets, villains, villainAges: villainFile.ages, endSigns: villainFile.signs, people, nations, sites, now };
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

// Every entity with its own library page.
export function getLibraryRefs(): Ref[] {
  const { people, states, sites, nations } = getTimeline();
  return [
    ...people.map((p) => ({ t: "person" as const, id: p.id })),
    ...nations.map((n) => ({ t: "nation" as const, id: n.id })),
    ...states.map((s) => ({ t: "polity" as const, id: s.id })),
    ...sites.map((s) => ({ t: "place" as const, id: s.id })),
  ];
}

// Library pages render their card on the server for the same reason.
export function getCardSeed(ref: Ref): TimelineSeed {
  return { ...getSeed(), card: buildCard(getTimeline(), ref) };
}
