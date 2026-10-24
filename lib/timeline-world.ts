// "Meanwhile" across the world: what was happening in other regions in a given year, and same-time pairs for the
// "Did you know?" cards. Pure functions over TimelineData, shared by the client and the share images.
import type { Ref, State, Stop, TimelineData } from "./timeline-types";

export type Region = { id: string; name: string };

// Years with their own shareable page (app/timeline/year/[year]); others share the explore link.
export const YEAR_PAGES = { from: 1900 };
export const yearPath = (year: number, now: number) => (year >= YEAR_PAGES.from && year <= now ? `/timeline/year/${year}` : `/timeline#explore=${year}`);

// Checked in order, so each test only has to separate its region from the ones after it.
const REGIONS: (Region & { test: (lng: number, lat: number) => boolean })[] = [
  { id: "americas", name: "the Americas", test: (lng) => lng < -30 },
  { id: "east", name: "East Asia", test: (lng) => lng >= 92 },
  { id: "asia", name: "Central and South Asia", test: (lng) => lng >= 62 },
  { id: "mideast", name: "the Middle East", test: (lng, lat) => lng >= 25 && lat >= 12 && lat < 43 },
  { id: "europe", name: "Europe", test: (_, lat) => lat >= 36 },
  { id: "africa", name: "Africa", test: () => true },
];

export const regionOf = (lng: number, lat: number): Region => REGIONS.find((r) => r.test(lng, lat))!;

export type Meanwhile = { region: string; title: string; when: string; ref: Ref };

// How far from the year an event may be and still count as "meanwhile". Older eras are sparsely recorded.
const windowFor = (year: number) => (year < -500 ? 200 : year < 600 ? 60 : 30);

const located = (s: Stop) => s.type === "event" && s.year !== undefined && s.place?.lng !== undefined && s.precision !== "unknown";

export function meanwhile(data: TimelineData, year: number, exclude?: string, limit = 3): Meanwhile[] {
  const w = windowFor(year);
  const out: (Meanwhile & { gap: number })[] = [];
  for (const r of REGIONS) {
    if (r.id === exclude) continue;
    const event = data.stops
      .filter((s) => located(s) && Math.abs(s.year! - year) <= w && regionOf(s.place!.lng!, s.place!.lat!).id === r.id)
      .sort((a, b) => Math.abs(a.year! - year) - Math.abs(b.year! - year))[0];
    if (event) {
      out.push({ region: r.name, title: event.title, when: event.label.split(" · ")[0], ref: { t: "event", id: event.id }, gap: Math.abs(event.year! - year) });
      continue;
    }
    const state = data.states
      .filter((s: State) => year >= s.from && year <= s.to && s.capital.lng !== undefined && regionOf(s.capital.lng, s.capital.lat!).id === r.id)
      .sort((a, b) => Number(b.lane === "world") - Number(a.lane === "world") || b.to - b.from - (a.to - a.from))[0];
    if (state) out.push({ region: r.name, title: state.name, when: "ruling", ref: { t: "polity", id: state.id }, gap: w + 1 });
  }
  return out
    .sort((a, b) => a.gap - b.gap)
    .slice(0, limit)
    .map((m) => ({ region: m.region, title: m.title, when: m.when, ref: m.ref }));
}

export type Fact = { a: Stop; b: Stop; gap: number };

const FACT_GAP = 12;

// Pairs of a moment in Muslim history and a world event from another region, close in time. Only firm dates are used,
// so the claim on the card holds.
export function sameTime(stops: Stop[]): Fact[] {
  const firm = stops.filter((s) => located(s) && s.year! > 0 && (s.precision === "exact" || s.precision === "approx"));
  const world = firm.filter((s) => s.kind === "world");
  const out: Fact[] = [];
  for (const a of firm) {
    if (a.kind === "world") continue;
    const ra = regionOf(a.place!.lng!, a.place!.lat!).id;
    const b = world
      .filter((w) => Math.abs(w.year! - a.year!) <= FACT_GAP && regionOf(w.place!.lng!, w.place!.lat!).id !== ra)
      .sort((x, y) => Math.abs(x.year! - a.year!) - Math.abs(y.year! - a.year!))[0];
    if (b) out.push({ a, b, gap: Math.abs(b.year! - a.year!) });
  }
  return out;
}
