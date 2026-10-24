// The timeline as a graph: lookups by ref, backlinks, contemporaries and the question-led cards. Pure functions over
// TimelineData, used by the server for static library pages and by the client for live navigation.
import {
  FAITH_LABEL,
  spanText,
  type Card,
  type CardLink,
  type Nation,
  type Person,
  type PersonGroup,
  type Place,
  type Precision,
  type Prophet,
  type Ref,
  type RefType,
  type Site,
  type State,
  type Stop,
  type TimelineData,
  type Villain,
} from "./timeline-types";

const key = (r: Ref) => `${r.t}:${r.id}`;

const ONE: Record<PersonGroup, string> = {
  unseen: "The unseen",
  quran: "In the Quran",
  hadith: "In the hadith",
  family: "Family of the Prophet ﷺ",
  companion: "Companion",
  scholar: "Scholar",
  ruler: "Ruler",
};

// Who to show first among contemporaries.
const RANK: Record<PersonGroup, number> = { ruler: 1, scholar: 2, companion: 3, family: 4, quran: 0, hadith: 5, unseen: 9 };

type Index = {
  stop: Map<string, Stop>;
  prophet: Map<string, Prophet>;
  villain: Map<string, Villain>;
  person: Map<string, Person>;
  polity: Map<string, State>;
  place: Map<string, Site>;
  nation: Map<string, Nation>;
  back: Map<string, Ref[]>;
  moments: Map<string, Stop[]>;
  rulers: Map<string, Person[]>;
  next: Map<string, Person>;
};

const indexes = new WeakMap<TimelineData, Index>();

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const list = m.get(k);
  if (list) list.push(v);
  else m.set(k, [v]);
}

export function indexOf(data: TimelineData): Index {
  const hit = indexes.get(data);
  if (hit) return hit;
  const ix: Index = {
    stop: new Map(data.stops.map((s) => [s.id, s])),
    prophet: new Map(data.prophets.map((p) => [p.id, p])),
    villain: new Map(data.villains.map((v) => [v.id, v])),
    person: new Map(data.people.map((p) => [p.id, p])),
    polity: new Map(data.states.map((s) => [s.id, s])),
    place: new Map(data.sites.map((s) => [s.id, s])),
    nation: new Map(data.nations.map((n) => [n.id, n])),
    back: new Map(),
    moments: new Map(),
    rulers: new Map(),
    next: new Map(),
  };
  const linkFrom = (from: Ref, links: Ref[]) => {
    for (const l of links) if (!(l.t === from.t && l.id === from.id)) push(ix.back, key(l), from);
  };
  for (const s of data.stops) {
    if (s.type !== "event") continue;
    const seen = new Set<string>();
    for (const r of [...(s.who ?? []).flatMap((w) => (w.ref ? [w.ref] : [])), ...s.links]) {
      if (seen.has(key(r))) continue;
      seen.add(key(r));
      push(ix.moments, key(r), s);
    }
  }
  for (const p of data.people) {
    linkFrom({ t: "person", id: p.id }, p.links);
    if (p.polity) push(ix.rulers, p.polity, p);
    if (p.after) ix.next.set(p.after, p);
  }
  for (const n of data.nations) linkFrom({ t: "nation", id: n.id }, n.links);
  for (const s of data.sites) linkFrom({ t: "place", id: s.id }, s.links);
  for (const list of ix.rulers.values()) list.sort((a, b) => (a.from ?? 0) - (b.from ?? 0));
  indexes.set(data, ix);
  return ix;
}

type Entity = Stop | Prophet | Villain | Person | State | Site | Nation;

export function entityOf(data: TimelineData, ref: Ref): Entity | undefined {
  const ix = indexOf(data);
  const map: Record<RefType, Map<string, Entity>> = {
    event: ix.stop,
    prophet: ix.prophet,
    villain: ix.villain,
    person: ix.person,
    polity: ix.polity,
    place: ix.place,
    nation: ix.nation,
  };
  return map[ref.t].get(ref.id);
}

export function nameOf(data: TimelineData, ref: Ref): string {
  const e = entityOf(data, ref);
  if (!e) return ref.id;
  return "title" in e && ref.t === "event" ? (e as Stop).title : (e as { name: string }).name;
}

// When the thing happened or lived: [from, to, precision]. Lifespans and reigns give a range; events a year.
export function spanOf(data: TimelineData, ref: Ref): [number | undefined, number | undefined, Precision] {
  const e = entityOf(data, ref) as Partial<{ year: number; from: number; to: number; precision: Precision }> | undefined;
  if (!e) return [undefined, undefined, "unknown"];
  if (ref.t === "event") return [e.year, (e as Stop).to, e.precision ?? "exact"];
  if (ref.t === "villain") return [e.year, undefined, "approx"];
  if (ref.t === "polity") return [e.from, e.to, "approx"];
  if (ref.t === "place") return [undefined, undefined, "unknown"];
  return [e.from, e.to, e.precision ?? (ref.t === "prophet" ? "traditional" : "approx")];
}

// A year to set the map to: the middle of a life, the start of a reign, the year of an event.
export function yearOf(data: TimelineData, ref: Ref): number | undefined {
  const [from, to, precision] = spanOf(data, ref);
  if (from === undefined || precision === "unknown") return undefined;
  if (to === undefined || ref.t === "polity" || (ref.t === "person" && (entityOf(data, ref) as Person).group === "ruler")) return from;
  return Math.round((from + to) / 2);
}

export function placeOf(data: TimelineData, ref: Ref): Place | undefined {
  const e = entityOf(data, ref);
  if (!e) return undefined;
  if (ref.t === "place") {
    const s = e as Site;
    return { name: s.name, lng: s.lng, lat: s.lat, site: s.id };
  }
  if (ref.t === "polity") return (e as State).capital;
  return (e as { place?: Place }).place;
}

export function linkOf(data: TimelineData, ref: Ref): CardLink {
  const e = entityOf(data, ref);
  const [from, to, precision] = spanOf(data, ref);
  let sub = spanText(from, to, precision);
  if (ref.t === "person") sub = (e as Person).role + (sub ? ` · ${sub}` : "");
  else if (ref.t === "event") sub = (e as Stop).label.split(" · ")[0];
  else if (ref.t === "villain") sub = (e as Villain).title;
  else if (ref.t === "place") sub = (e as Site).line;
  else if (ref.t === "prophet") sub = "Prophet";
  return { ref, name: nameOf(data, ref), sub };
}

const unique = (refs: Ref[]) => {
  const seen = new Set<string>();
  return refs.filter((r) => !seen.has(key(r)) && seen.add(key(r)));
};

// People and prophets whose lives overlap the given span, most notable first.
export function contemporaries(data: TimelineData, from: number | undefined, to: number | undefined, self?: Ref, limit = 10): CardLink[] {
  if (from === undefined) return [];
  const end = to ?? from;
  const out: { ref: Ref; rank: number; gap: number }[] = [];
  for (const p of data.prophets) {
    if (p.from === undefined || p.id === self?.id) continue;
    const pe = p.to ?? p.from;
    if (p.from <= end + 10 && pe >= from - 10) out.push({ ref: { t: "prophet", id: p.id }, rank: -1, gap: 0 });
  }
  for (const p of data.people) {
    if (p.from === undefined || p.precision === "unknown" || p.id === self?.id) continue;
    const pe = p.to ?? p.from;
    if (p.from <= end && pe >= from) out.push({ ref: { t: "person", id: p.id }, rank: RANK[p.group], gap: Math.abs((p.from + pe) / 2 - (from + end) / 2) });
  }
  return out
    .sort((a, b) => a.rank - b.rank || a.gap - b.gap)
    .slice(0, limit)
    .map((o) => linkOf(data, o.ref));
}

export function aliveAt(data: TimelineData, year: number): Person[] {
  return data.people.filter((p) => {
    if (p.from === undefined || p.precision === "unknown") return false;
    return p.to === undefined ? Math.abs(year - p.from) <= 20 : year >= p.from && year <= p.to;
  });
}

const momentsOf = (data: TimelineData, ref: Ref) =>
  (indexOf(data).moments.get(key(ref)) ?? []).map((s) => linkOf(data, { t: "event", id: s.id }));

function linked(data: TimelineData, ref: Ref, own: Ref[], skip: Ref[] = []): CardLink[] {
  const back = indexOf(data).back.get(key(ref)) ?? [];
  const drop = new Set([key(ref), ...skip.map(key)]);
  return unique([...own, ...back])
    .filter((r) => r.t !== "event" && !drop.has(key(r)) && entityOf(data, r))
    .map((r) => linkOf(data, r));
}

const groupsOf = (groups: { q: string; items: CardLink[] }[]) => groups.filter((g) => g.items.length);

export function buildCard(data: TimelineData, ref: Ref): Card | undefined {
  const ix = indexOf(data);
  const e = entityOf(data, ref);
  if (!e) return undefined;
  const [from, to, precision] = spanOf(data, ref);

  if (ref.t === "person") {
    const p = e as Person;
    const before = p.after ? ix.person.get(p.after) : undefined;
    const after = ix.next.get(p.id);
    const line = [before, after].filter(Boolean).map((x) => linkOf(data, { t: "person", id: x!.id }));
    return {
      ref,
      kind: ONE[p.group],
      name: p.name,
      arabic: p.arabic,
      role: p.title ? `${p.title} · ${p.role}` : p.role,
      when: p.when,
      precision: p.precision,
      year: yearOf(data, ref),
      line: p.line,
      story: p.story,
      legacy: p.legacy,
      lesson: p.lesson,
      note: p.note,
      source: p.source,
      wiki: p.wiki,
      place: p.place,
      quote: p.quote,
      verses: p.verses.filter((v) => v.ref !== p.quote?.ref),
      hadith: p.hadith ?? [],
      groups: groupsOf([
        { q: "Who came before and after?", items: line },
        { q: "Where do they appear in the story?", items: momentsOf(data, ref) },
        { q: "Who else is linked?", items: linked(data, ref, p.links, [before, after].flatMap((x) => (x ? [{ t: "person" as const, id: x.id }] : []))) },
        { q: "Who lived at the same time?", items: contemporaries(data, p.from, p.to, ref, 8) },
      ]),
    };
  }

  if (ref.t === "polity") {
    const s = e as State;
    const rulers = (ix.rulers.get(s.id) ?? []).map((r) => linkOf(data, { t: "person", id: r.id }));
    const rivals = data.states
      .filter((o) => o.id !== s.id && o.from <= s.to && o.to >= s.from)
      .sort((a, b) => Number(b.muslim) - Number(a.muslim) || Math.abs(a.from - s.from) - Math.abs(b.from - s.from))
      .slice(0, 10)
      .map((o) => linkOf(data, { t: "polity", id: o.id }));
    return {
      ref,
      kind: s.kind ? s.kind[0].toUpperCase() + s.kind.slice(1) : s.muslim ? "Muslim power" : "World power",
      name: s.name,
      role: s.faith ? FAITH_LABEL[s.faith] : undefined,
      when: spanText(s.from, s.to, "exact"),
      year: s.from,
      line: s.line,
      tie: s.tie,
      wiki: s.wiki,
      place: s.capital,
      verses: [],
      hadith: [],
      groups: groupsOf([
        { q: "Who ruled it?", items: rulers },
        { q: "What happened in its time?", items: momentsOf(data, ref) },
        { q: "Who else is linked?", items: linked(data, ref, [], (ix.rulers.get(s.id) ?? []).map((r) => ({ t: "person" as const, id: r.id }))) },
        { q: "Who were its neighbours in time?", items: rivals },
      ]),
    };
  }

  if (ref.t === "place") {
    const s = e as Site;
    const here = data.stops
      .filter((x) => x.type === "event" && x.place?.site === s.id)
      .sort((a, b) => (a.year ?? -1e6) - (b.year ?? -1e6))
      .map((x) => linkOf(data, { t: "event", id: x.id }));
    const people = data.people.filter((p) => p.place?.site === s.id).map((p) => linkOf(data, { t: "person", id: p.id }));
    return {
      ref,
      kind: s.kind[0].toUpperCase() + s.kind.slice(1),
      name: s.name,
      arabic: s.arabic,
      role: s.names?.length ? `Also ${s.names.join(", ")}` : undefined,
      line: s.line,
      story: s.story,
      place: { name: s.name, lng: s.lng, lat: s.lat, site: s.id },
      verses: s.verses,
      hadith: s.hadith ?? [],
      groups: groupsOf([
        { q: "What happened here?", items: here },
        { q: "Who lived here?", items: people },
        { q: "Who else is linked?", items: linked(data, ref, s.links, people.map((p) => p.ref)) },
      ]),
    };
  }

  if (ref.t === "nation") {
    const n = e as Nation;
    return {
      ref,
      kind: "Nation of the Quran",
      name: n.name,
      arabic: n.arabic,
      when: spanText(from, to, precision) ?? "The Quran gives no date",
      precision: n.precision,
      year: yearOf(data, ref),
      story: n.story,
      end: n.end,
      lesson: n.lesson,
      archaeology: n.archaeology,
      place: n.place,
      quote: n.quote,
      verses: n.verses.filter((v) => v.ref !== n.quote?.ref),
      hadith: [],
      groups: groupsOf([
        { q: "Where do they appear in the story?", items: momentsOf(data, ref) },
        { q: "Who else is linked?", items: linked(data, ref, n.links) },
      ]),
    };
  }
  return undefined;
}

// Search across everything with a name. Name matches rank above matches in the description.
export function search(data: TimelineData, query: string, limit = 12): CardLink[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const all: { ref: Ref; name: string; text: string }[] = [
    ...data.prophets.map((p) => ({ ref: { t: "prophet" as const, id: p.id }, name: p.name, text: p.line })),
    ...data.people.map((p) => ({ ref: { t: "person" as const, id: p.id }, name: p.name, text: `${p.role} ${p.line}` })),
    ...data.villains.map((v) => ({ ref: { t: "villain" as const, id: v.id }, name: v.name, text: `${v.title} ${v.deed}` })),
    ...data.states.map((s) => ({ ref: { t: "polity" as const, id: s.id }, name: s.name, text: s.line ?? "" })),
    ...data.nations.map((n) => ({ ref: { t: "nation" as const, id: n.id }, name: n.name, text: n.story })),
    ...data.sites.map((s) => ({ ref: { t: "place" as const, id: s.id }, name: s.name, text: `${(s.names ?? []).join(" ")} ${s.line}` })),
    ...data.stops
      .filter((s) => s.type === "event")
      .map((s) => ({ ref: { t: "event" as const, id: s.id }, name: s.title, text: `${s.what} ${s.place?.name ?? ""} ${(s.who ?? []).map((w) => w.name).join(" ")}` })),
  ];
  const score = (x: (typeof all)[number]) => {
    const n = x.name.toLowerCase();
    if (n === q) return 0;
    if (n.startsWith(q)) return 1;
    if (n.includes(q)) return 2;
    return x.text.toLowerCase().includes(q) ? 3 : 9;
  };
  return all
    .map((x) => ({ x, s: score(x) }))
    .filter((o) => o.s < 9)
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map((o) => linkOf(data, o.x.ref));
}

export const TYPE_LABEL: Record<RefType, string> = {
  event: "Moment",
  prophet: "Prophet",
  villain: "Villain",
  person: "Person",
  polity: "Empire",
  place: "Place",
  nation: "Nation",
};
