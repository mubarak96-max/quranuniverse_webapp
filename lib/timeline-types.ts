// Timeline types and pure helpers shared by the server loader (lib/timeline.ts) and the client components.

export type Precision = "exact" | "approx" | "traditional" | "unknown";
export type Kind = "prophet" | "revelation" | "battle" | "empire" | "knowledge" | "world" | "event";

export type Verse = { ref: string; href: string; text?: string };
export type LngLat = [number, number];
export type Place = { name: string; lng?: number; lat?: number; site?: string };
export type Route = { coords: LngLat[]; stops: { name: string; lng: number; lat: number }[] };
// zoom is a MapLibre zoom level; bounds is [west, south, east, north] when the camera should fit a journey.
export type Focus = { lng: number; lat: number; zoom: number; bounds?: [number, number, number, number] };

// A pointer to anything the timeline can open. Ids are unique within their type.
export type RefType = "event" | "prophet" | "villain" | "person" | "polity" | "place" | "nation";
export type Ref = { t: RefType; id: string };
export type Named = { name: string; ref?: Ref };

export type Stop = {
  id: string;
  type: "chapter" | "event";
  chapter: number;
  title: string;
  label: string;
  year?: number;
  to?: number;
  ah?: number;
  precision: Precision;
  what: string;
  tie?: string;
  note?: string;
  hadith?: Hadith[];
  wiki?: string;
  who?: Named[];
  place?: Place;
  verses: Verse[];
  quote?: Verse;
  article?: string;
  journey?: string;
  source?: string;
  kind?: Kind;
  routes: Route[];
  links: Ref[];
  focus: Focus;
};

export type Chapter = { id: string; n: number; title: string; span: string; blurb: string; start: number; count: number; from?: number; to?: number };

export type Faith = "islam" | "christian" | "jewish" | "zoroastrian" | "hindu" | "buddhist" | "chinese" | "pagan" | "mixed" | "secular";

export type State = {
  id: string;
  name: string;
  from: number;
  to: number;
  lane: "states" | "world";
  muslim: boolean;
  color?: number;
  capital: Place;
  faith?: Faith;
  kind?: string;
  line?: string;
  tie?: string;
  wiki?: string;
};

export type Overlay = { id: string; state: string; from: number; to: number; name: string; ring: LngLat[]; label: LngLat };

export type Prophet = {
  id: string;
  name: string;
  arabic: string;
  mentions?: number;
  line: string;
  verse: Verse;
  stop?: string;
  col: number;
  row: number;
  parent?: string;
  rel?: "son" | "descendant" | "nephew" | "brother" | "successor";
  group?: boolean;
  woman?: boolean;
  from?: number;
  to?: number;
  bar?: boolean;
  place?: Place;
  journey?: string;
};

export type VillainAge = { id: string; title: string; span: string };

export type VillainSymbol =
  | "flame"
  | "blade"
  | "crown"
  | "tower"
  | "coins"
  | "calf"
  | "shield"
  | "fire"
  | "elephant"
  | "spear"
  | "chain"
  | "scroll"
  | "mask"
  | "kaaba"
  | "arrow"
  | "eye"
  | "wall";

export type Hadith = { label: string; url: string };

export type Villain = {
  id: string;
  age: string;
  name: string;
  arabic: string;
  title: string;
  when: string;
  symbol: VillainSymbol;
  relied?: string;
  undone?: string;
  deed: string;
  end: string;
  verse?: Verse;
  source: "quran" | "tafsir" | "hadith" | "history";
  note: string;
  hadith?: Hadith[];
  against: { name: string; prophet?: string };
  stop?: string;
  group?: boolean;
  lesson: string;
  said?: Verse;
  mentions: Verse[];
  year?: number;
  place?: Place;
  journey?: string;
};

export type EndSigns = { note: string; hadith: Hadith; items: { name: string; villain?: string }[] };

export type PersonGroup = "unseen" | "quran" | "hadith" | "family" | "companion" | "scholar" | "ruler";
export type Source = "quran" | "hadith" | "tafsir" | "history";

export type Person = {
  id: string;
  name: string;
  arabic?: string;
  group: PersonGroup;
  role: string;
  line: string;
  story?: string;
  legacy?: string;
  lesson?: string;
  era: string;
  from?: number;
  to?: number;
  precision?: Precision;
  when: string;
  place?: Place;
  verses: Verse[];
  quote?: Verse;
  hadith?: Hadith[];
  source: Source;
  note?: string;
  woman?: boolean;
  polity?: string;
  title?: string;
  after?: string;
  links: Ref[];
  wiki?: string;
};

export type Nation = {
  id: string;
  name: string;
  arabic?: string;
  prophet?: string;
  era: string;
  place?: Place;
  from?: number;
  to?: number;
  precision?: Precision;
  verses: Verse[];
  quote?: Verse;
  story: string;
  end?: string;
  lesson?: string;
  archaeology?: string;
  polity?: string;
  links: Ref[];
};

export type Site = {
  id: string;
  name: string;
  arabic?: string;
  kind: string;
  lng: number;
  lat: number;
  line: string;
  story?: string;
  names?: string[];
  verses: Verse[];
  hadith?: Hadith[];
  era?: string;
  links: Ref[];
};

export type TimelineData = {
  stops: Stop[];
  chapters: Chapter[];
  states: State[];
  overlays: Overlay[];
  prophets: Prophet[];
  villains: Villain[];
  villainAges: VillainAge[];
  endSigns: EndSigns;
  people: Person[];
  nations: Nation[];
  sites: Site[];
  now: number;
};

export type VillainSeed = { list: Villain[]; ages: VillainAge[]; signs: EndSigns };

// One entity rendered as question-led sections. Built from TimelineData by lib/timeline-graph.ts, on the server for
// static pages and on the client for live navigation, so both render the same thing.
export type CardLink = { ref: Ref; name: string; sub?: string };
export type Card = {
  ref: Ref;
  kind: string;
  name: string;
  arabic?: string;
  role?: string;
  when?: string;
  precision?: Precision;
  year?: number;
  line?: string;
  story?: string;
  tie?: string;
  legacy?: string;
  lesson?: string;
  end?: string;
  archaeology?: string;
  note?: string;
  source?: string;
  wiki?: string;
  place?: Place;
  quote?: Verse;
  verses: Verse[];
  hadith: Hadith[];
  groups: { q: string; items: CardLink[] }[];
};

export type TimelineSeed = {
  chapters: Chapter[];
  now: number;
  moments: number;
  stop?: Stop;
  position: number;
  villains?: VillainSeed;
  card?: Card;
};

// Time axis: piecewise linear so the Prophet's era and the caliphates get most of the width.
export const AXIS = { min: -3400, max: 2026 };
const BREAKS: [number, number][] = [
  [-3400, 0],
  [-1000, 0.12],
  [570, 0.3],
  [1258, 0.66],
  [2026, 1],
];

export function yearToT(year: number): number {
  const y = Math.min(AXIS.max, Math.max(AXIS.min, year));
  for (let i = 1; i < BREAKS.length; i++) {
    const [y0, t0] = BREAKS[i - 1];
    const [y1, t1] = BREAKS[i];
    if (y <= y1) return t0 + ((y - y0) / (y1 - y0)) * (t1 - t0);
  }
  return 1;
}

export function tToYear(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  for (let i = 1; i < BREAKS.length; i++) {
    const [y0, t0] = BREAKS[i - 1];
    const [y1, t1] = BREAKS[i];
    if (c <= t1) return Math.round(y0 + ((c - t0) / (t1 - t0)) * (y1 - y0));
  }
  return AXIS.max;
}

// Hijri years drift about 3% against the solar calendar; exact AH comes from the data when it matters.
export const toAh = (ce: number) => Math.floor((ce - 621.5) * 1.0307) + 1;

export function yearText(ce: number, precision: Precision = "exact"): string {
  if (precision === "unknown") return "Date unknown";
  const base = ce < 0 ? `${-ce} BCE` : `${ce} CE`;
  return precision === "exact" ? base : `c. ${base}`;
}

export function spanText(from: number | undefined, to: number | undefined, precision: Precision = "exact"): string | undefined {
  if (from === undefined || precision === "unknown") return undefined;
  if (to === undefined || to === from) return yearText(from, precision);
  const era = (y: number) => (y < 0 ? "BCE" : "CE");
  const n = (y: number) => Math.abs(y);
  const c = precision === "exact" ? "" : "c. ";
  return era(from) === era(to) ? `${c}${n(from)}–${n(to)} ${era(to)}` : `${c}${n(from)} ${era(from)}–${n(to)} ${era(to)}`;
}

export function yearsAgo(ce: number, now: number, precision: Precision): string {
  const n = now - ce;
  if (precision !== "exact" && n > 1000) return `about ${(Math.round(n / 100) * 100).toLocaleString("en-US")} years ago`;
  return `${n.toLocaleString("en-US")} years ago`;
}

export const CERTAINTY: Record<Precision, string> = {
  exact: "Historical date",
  approx: "Approximate date",
  traditional: "Traditional date, disputed",
  unknown: "The Quran gives no date",
};

export const villainsNear = (villains: Villain[], year: number) =>
  villains.filter((v) => v.year !== undefined && Math.abs(year - v.year) <= 25);

export function activeStates(states: State[], year: number | undefined) {
  if (year === undefined) return [];
  return states.filter((s) => year >= s.from && year <= s.to);
}

export const KIND_LABEL: Record<Kind, string> = {
  prophet: "Prophets",
  revelation: "Revelation",
  battle: "Battle",
  empire: "Rulers",
  knowledge: "Knowledge",
  event: "Event",
  world: "World",
};

export const GROUP_LABEL: Record<PersonGroup, string> = {
  unseen: "The unseen",
  quran: "People of the Quran",
  hadith: "People of the hadith",
  family: "Family of the Prophet ﷺ",
  companion: "Companions",
  scholar: "Scholars",
  ruler: "Rulers",
};

export const FAITH_LABEL: Record<Faith, string> = {
  islam: "Islam",
  christian: "Christianity",
  jewish: "Judaism",
  zoroastrian: "Zoroastrianism",
  hindu: "Hinduism",
  buddhist: "Buddhism",
  chinese: "Chinese traditions",
  pagan: "Other faiths",
  mixed: "Mixed",
  secular: "Secular",
};

// Library and page slugs for each openable type.
export const SLUG: Partial<Record<RefType, string>> = { person: "person", place: "place", polity: "empire", nation: "nation" };
export const fromSlug = (slug: string): RefType | undefined =>
  (Object.entries(SLUG) as [RefType, string][]).find(([, s]) => s === slug)?.[0];

export function refHref(ref: Ref): string {
  if (ref.t === "event") return `/timeline/${ref.id}`;
  if (ref.t === "villain") return `/timeline/villains/${ref.id}`;
  if (ref.t === "prophet") return `/timeline/prophets/${ref.id}`;
  return `/timeline/library/${SLUG[ref.t]}/${ref.id}`;
}

export const sameRef = (a: Ref | undefined, b: Ref | undefined) => !!a && !!b && a.t === b.t && a.id === b.id;
