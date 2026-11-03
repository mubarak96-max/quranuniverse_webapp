// Everything the atlas can show, flattened to one list of "things": every moment, prophet, person, place, empire,
// nation and villain, each with a lens (what kind of thing it is), the chapter it belongs to, a map position when one is
// known, and the art that illustrates it. Pure functions over TimelineData, used by the atlas on the client and by the
// entry pages and archive on the server, so both agree on where everything lives.
import { yearOf } from "./timeline-graph";
import { spanText, type Chapter, type Kind, type Ref, type TimelineData } from "./timeline-types";

export type Lens = "moment" | "prophet" | "person" | "place" | "polity" | "nation" | "villain";

export const LENSES: { id: Lens; label: string; one: string }[] = [
  { id: "moment", label: "Moments", one: "Moment" },
  { id: "prophet", label: "Prophets", one: "Prophet" },
  { id: "person", label: "People", one: "Person" },
  { id: "place", label: "Places", one: "Place" },
  { id: "polity", label: "Empires", one: "Empire" },
  { id: "nation", label: "Nations", one: "Nation of the Quran" },
  { id: "villain", label: "Villains", one: "Villain" },
];

const LENS_OF: Record<Ref["t"], Lens> = { event: "moment", prophet: "prophet", person: "person", place: "place", polity: "polity", nation: "nation", villain: "villain" };

export type Thing = {
  key: string;
  ref: Ref;
  lens: Lens;
  // Colour key on the map: the moment's kind for moments, otherwise the lens.
  tone: Kind | Exclude<Lens, "moment">;
  name: string;
  sub?: string;
  when?: string;
  year?: number;
  // Index into data.chapters, or -1 for things that belong to no single era (most places).
  chapter: number;
  lng?: number;
  lat?: number;
  place?: string;
  summary: string;
};

export const keyOf = (r: Ref) => `${r.t}:${r.id}`;
export const refOfKey = (k: string): Ref | undefined => {
  const [t, ...rest] = k.split(":");
  return t && rest.length && t in LENS_OF ? { t: t as Ref["t"], id: rest.join(":") } : undefined;
};

// The atlas address that shows a thing on the map. Every "go to X" in the timeline goes through here, so the map stays
// the one place people navigate from.
export const mapHref = (r: Ref) => `/timeline?focus=${encodeURIComponent(keyOf(r))}`;
export const eraHref = (c: Chapter) => `/timeline?era=${c.id}`;

// The chapter whose dated span holds the year, skipping the undated first chapter and the Signs of the Hour.
export function chapterOfYear(chapters: Chapter[], year: number | undefined): number {
  if (year === undefined) return -1;
  let best = -1;
  let gap = Infinity;
  for (const c of chapters) {
    if (c.id === "hour" || c.id === "beginning" || c.from === undefined || c.to === undefined) continue;
    const g = year < c.from ? c.from - year : year > c.to ? year - c.to : 0;
    if (g < gap || (g === 0 && gap === 0)) {
      // On a shared boundary year the later chapter wins, so 632 is the caliphates rather than the Prophet's life.
      gap = g;
      best = c.n - 1;
    }
  }
  return best;
}

const chapterById = (chapters: Chapter[], id: string | undefined) => (id ? chapters.findIndex((c) => c.id === id) : -1);

const cache = new WeakMap<TimelineData, Thing[]>();

export function thingsOf(data: TimelineData): Thing[] {
  const hit = cache.get(data);
  if (hit) return hit;
  const { chapters } = data;
  const stopById = new Map(data.stops.map((s) => [s.id, s]));
  const out: Thing[] = [];

  for (const s of data.stops) {
    if (s.type !== "event") continue;
    out.push({
      key: `event:${s.id}`,
      ref: { t: "event", id: s.id },
      lens: "moment",
      tone: s.kind ?? "event",
      name: s.title,
      sub: s.place?.name,
      when: s.label.split(" · ")[0],
      year: s.year,
      chapter: s.chapter,
      lng: s.place?.lng,
      lat: s.place?.lat,
      place: s.place?.name,
      summary: s.what,
    });
  }

  for (const p of data.prophets) {
    const stop = p.stop ? stopById.get(p.stop) : undefined;
    const at = p.place?.lng !== undefined ? p.place : stop?.place;
    out.push({
      key: `prophet:${p.id}`,
      ref: { t: "prophet", id: p.id },
      lens: "prophet",
      tone: "prophet",
      name: p.woman ? p.name : `Prophet ${p.name}`,
      sub: p.arabic,
      when: spanText(p.from, p.to, "traditional"),
      year: p.from,
      chapter: stop ? stop.chapter : chapterOfYear(chapters, p.from),
      lng: at?.lng,
      lat: at?.lat,
      place: at?.name,
      summary: p.line,
    });
  }

  for (const p of data.people) {
    const year = yearOf(data, { t: "person", id: p.id });
    const era = chapterById(chapters, p.era);
    out.push({
      key: `person:${p.id}`,
      ref: { t: "person", id: p.id },
      lens: "person",
      tone: "person",
      name: p.name,
      sub: p.role,
      when: p.when,
      year,
      chapter: era >= 0 ? era : chapterOfYear(chapters, year),
      lng: p.place?.lng,
      lat: p.place?.lat,
      place: p.place?.name,
      summary: p.line,
    });
  }

  for (const v of data.villains) {
    const stop = v.stop ? stopById.get(v.stop) : undefined;
    const at = v.place?.lng !== undefined ? v.place : stop?.place;
    out.push({
      key: `villain:${v.id}`,
      ref: { t: "villain", id: v.id },
      lens: "villain",
      tone: "villain",
      name: v.name,
      sub: v.title,
      when: v.when,
      year: v.year,
      chapter: stop ? stop.chapter : chapterOfYear(chapters, v.year),
      lng: at?.lng,
      lat: at?.lat,
      place: at?.name,
      summary: v.deed,
    });
  }

  for (const s of data.states) {
    out.push({
      key: `polity:${s.id}`,
      ref: { t: "polity", id: s.id },
      lens: "polity",
      tone: "polity",
      name: s.name,
      sub: s.capital.name ? `Capital: ${s.capital.name}` : undefined,
      when: spanText(s.from, s.to, "exact"),
      year: s.from,
      chapter: chapterOfYear(chapters, s.from),
      lng: s.capital.lng,
      lat: s.capital.lat,
      place: s.capital.name,
      summary: s.line ?? s.tie ?? "",
    });
  }

  for (const n of data.nations) {
    const year = yearOf(data, { t: "nation", id: n.id });
    const era = chapterById(chapters, n.era);
    out.push({
      key: `nation:${n.id}`,
      ref: { t: "nation", id: n.id },
      lens: "nation",
      tone: "nation",
      name: n.name,
      sub: n.arabic,
      when: spanText(n.from, n.to, n.precision ?? "approx"),
      year,
      chapter: era >= 0 ? era : chapterOfYear(chapters, year),
      lng: n.place?.lng,
      lat: n.place?.lat,
      place: n.place?.name,
      summary: n.story,
    });
  }

  for (const s of data.sites) {
    out.push({
      key: `place:${s.id}`,
      ref: { t: "place", id: s.id },
      lens: "place",
      tone: "place",
      name: s.name,
      sub: s.kind[0].toUpperCase() + s.kind.slice(1),
      chapter: chapterById(chapters, s.era),
      lng: s.lng,
      lat: s.lat,
      place: s.name,
      summary: s.line,
    });
  }

  cache.set(data, out);
  return out;
}

// The illustration for a thing. Moments use their chapter's painting unless their kind has a stronger picture.
const CHAPTER_ART = new Set(["beginning", "early-nations", "ibrahim", "musa", "isa", "prophet", "caliphates", "golden-age", "empires", "modern", "hour"]);
export const chapterArt = (c: Chapter | undefined) => (c && CHAPTER_ART.has(c.id) ? `/timeline/art/ch-${c.id}.webp` : "/timeline/art/og-atlas.webp");

export function artOf(data: TimelineData, ref: Ref): string {
  const chapterOf = (i: number) => data.chapters[i];
  const thing = thingsOf(data).find((t) => t.ref.t === ref.t && t.ref.id === ref.id);
  const era = thing && thing.chapter >= 0 ? chapterArt(chapterOf(thing.chapter)) : undefined;
  if (ref.t === "event") {
    const s = data.stops.find((x) => x.id === ref.id);
    if (s?.kind === "revelation" || s?.kind === "battle" || s?.kind === "knowledge") return `/timeline/art/k-${s.kind}.webp`;
    return chapterArt(chapterOf(s?.chapter ?? -1));
  }
  // Prophets, villains and nations take the painting of their age, so each era looks like itself.
  if (ref.t === "prophet") return era ?? "/timeline/art/k-prophet.webp";
  if (ref.t === "villain") return era ?? "/timeline/art/t-villain.webp";
  if (ref.t === "nation") return "/timeline/art/t-nation.webp";
  if (ref.t === "place") {
    const kind = data.sites.find((x) => x.id === ref.id)?.kind;
    return PLACE_ART[kind ?? ""] ?? era ?? "/timeline/art/t-place.webp";
  }
  if (ref.t === "polity") return data.states.find((x) => x.id === ref.id)?.muslim ? "/timeline/art/k-empire.webp" : "/timeline/art/t-empire.webp";
  const p = data.people.find((x) => x.id === ref.id);
  if (p?.group === "scholar") return "/timeline/art/t-person.webp";
  if (p?.group === "ruler") return "/timeline/art/t-empire.webp";
  if (p?.group === "unseen") return "/timeline/art/ch-beginning.webp";
  return era ?? "/timeline/art/t-person.webp";
}

const PLACE_ART: Record<string, string> = {
  cave: "/timeline/art/k-revelation.webp",
  mountain: "/timeline/art/k-prophet.webp",
  valley: "/timeline/art/ch-ibrahim.webp",
  well: "/timeline/art/k-battle.webp",
  sea: "/timeline/art/ch-musa.webp",
  river: "/timeline/art/ch-golden-age.webp",
  region: "/timeline/art/k-world.webp",
  mosque: "/timeline/art/ch-caliphates.webp",
  site: "/timeline/art/t-nation.webp",
};

// A stable pick for "Moment of the day", so everyone sees the same one and it changes at midnight UTC.
export function momentOfDay(things: Thing[], day = Math.floor(Date.now() / 86400000)): Thing | undefined {
  const pool = things.filter((t) => t.lens === "moment" && t.lng !== undefined && t.summary.length > 80);
  return pool.length ? pool[(day * 2654435761) % pool.length >>> 0] : undefined;
}


// The 640 px version of an illustration, for cards and thumbnails.
export const small = (art: string) => art.replace(/\.webp$/, "-sm.webp");

// Up to two capital initials for an avatar, skipping titles like Prophet and The.
export const initials = (name: string) => {
  const words = name.replace(/^(Prophet|The|Al-|al-)\s+/i, "").split(/[\s-]+/).filter(Boolean);
  const caps = words.filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]);
  return (caps.length ? caps.join("") : (words[0] ?? name)[0] ?? "").toUpperCase();
};

// Each collection's picture and a line on what it holds.
export const LENS_ART: Record<Lens, string> = {
  moment: "/timeline/art/k-event.webp",
  prophet: "/timeline/art/k-prophet.webp",
  person: "/timeline/art/t-person.webp",
  place: "/timeline/art/t-place.webp",
  polity: "/timeline/art/t-empire.webp",
  nation: "/timeline/art/t-nation.webp",
  villain: "/timeline/art/t-villain.webp",
};

export const LENS_BLURB: Record<Lens, string> = {
  moment: "Every turning point, from the first human to the signs still to come.",
  prophet: "The prophets named in the Quran, from Adam to Muhammad ﷺ, where they lived and whom they called.",
  person: "Companions, the Prophet's family, scholars, rulers and the people of the Quran.",
  place: "Cities, mosques, mountains, wells and valleys where history and revelation met.",
  polity: "Caliphates, sultanates and the world empires around them, by their capitals.",
  nation: "The peoples the Quran tells of, the messengers sent to them and what became of them.",
  villain: "Tyrants and deceivers from Iblis to the Dajjal: what they relied on and what undid them.",
};
