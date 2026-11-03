import { buildCard, contemporaries, indexOf, linkOf } from "./timeline-graph";
import { AXIS, KIND_LABEL, spanText, type Card, type Ref, type TimelineData } from "./timeline-types";

export type TimelineEntry = Card & { sections?: { title: string; text: string }[]; journey?: string };

export function timelineEntry(data: TimelineData, ref: Ref): TimelineEntry | undefined {
  const card = buildCard(data, ref);
  if (card) return card;
  if (ref.t === "event") {
    const stop = data.stops.find((item) => item.id === ref.id);
    if (!stop) return;
    const chapter = data.chapters[stop.chapter];
    const related = [...stop.links, ...(stop.who ?? []).flatMap((person) => person.ref ? [person.ref] : [])];
    const unique = related.filter((item, index) => related.findIndex((other) => other.id === item.id && other.t === item.t) === index);
    return {
      ref, name: stop.title, kind: stop.type === "chapter" ? `Chapter ${chapter.n}` : KIND_LABEL[stop.kind ?? "event"],
      when: stop.label, year: stop.year, precision: stop.precision, story: stop.what, tie: stop.tie,
      note: stop.note, source: stop.source, wiki: stop.wiki, place: stop.place, quote: stop.quote,
      verses: stop.verses.filter((verse) => verse.ref !== stop.quote?.ref), hadith: stop.hadith ?? [],
      groups: stop.type === "chapter"
        ? [{ q: "In this chapter", items: data.stops.slice(chapter.start + 1, chapter.start + chapter.count).map((item) => linkOf(data, { t: "event", id: item.id })) }]
        : [{ q: "Who and where", items: unique.map((item) => linkOf(data, item)) }].filter((group) => group.items.length),
    };
  }
  if (ref.t === "prophet") {
    const prophet = data.prophets.find((item) => item.id === ref.id);
    if (!prophet) return;
    return {
      ref, name: prophet.name, arabic: prophet.arabic, kind: prophet.woman ? "Woman of the Quran" : "Prophet",
      when: spanText(prophet.from, prophet.to, "traditional"), precision: prophet.from === undefined ? "unknown" : "traditional",
      year: prophet.from, journey: prophet.journey,
      story: prophet.line, place: prophet.place, quote: prophet.verse, source: "The Quran", verses: [], hadith: [],
      groups: [
        { q: "Moments in history", items: momentsFor(data, ref, prophet.stop) },
        { q: "Family of prophets", items: data.prophets.filter((item) => item.id === prophet.parent || item.parent === prophet.id).map((item) => linkOf(data, { t: "prophet", id: item.id })) },
        { q: "Who lived at the same time?", items: contemporaries(data, prophet.from, prophet.to, ref, 8) },
        { q: "Who opposed them?", items: data.villains.filter((v) => v.against.prophet === prophet.id).map((v) => linkOf(data, { t: "villain", id: v.id })) },
      ].filter((group) => group.items.length),
    };
  }
  if (ref.t === "villain") {
    const villain = data.villains.find((item) => item.id === ref.id);
    if (!villain) return;
    return {
      ref, name: villain.name, arabic: villain.arabic, kind: "Villain of Islamic history", role: villain.title,
      when: villain.when, year: villain.year, story: villain.deed, end: villain.end, lesson: villain.lesson,
      journey: villain.journey,
      sections: [
        { title: "What they relied on", text: villain.relied ?? "" },
        { title: "What undid them", text: villain.undone ?? "" },
        { title: "Who they opposed", text: villain.against.name },
      ].filter((section) => section.text),
      note: villain.note, place: villain.place, source: villain.source, quote: villain.verse,
      verses: villain.mentions.filter((verse) => verse.ref !== villain.verse?.ref), hadith: villain.hadith ?? [],
      groups: [
        { q: "Who stood against them?", items: villain.against.prophet ? [linkOf(data, { t: "prophet", id: villain.against.prophet })] : [] },
        { q: "Moments in history", items: momentsFor(data, ref, villain.stop) },
        { q: "Others of their age", items: data.villains.filter((v) => v.age === villain.age && v.id !== villain.id).slice(0, 8).map((v) => linkOf(data, { t: "villain", id: v.id })) },
      ].filter((group) => group.items.length),
    };
  }
}

// Every moment that names the entry, with its own moment first.
function momentsFor(data: TimelineData, ref: Ref, own?: string) {
  const list = (indexOf(data).moments.get(`${ref.t}:${ref.id}`) ?? []).map((s) => s.id);
  const ids = [...new Set([...(own ? [own] : []), ...list])];
  return ids.filter((id) => data.stops.some((s) => s.id === id)).map((id) => linkOf(data, { t: "event", id }));
}

export function clampMapYear(year: number, min = AXIS.min, max = AXIS.max): number {
  const clamped = Math.min(max, Math.max(min, Math.round(year)));
  return clamped === 0 ? 1 : clamped;
}
