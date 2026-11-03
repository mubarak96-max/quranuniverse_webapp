import Link from "next/link";
import { entityOf, linkOf, placeOf, spanOf } from "@/lib/timeline-graph";
import type { TimelineEntry } from "@/lib/timeline-entry";
import { tafsirOf, verseDetail, type VerseDetail } from "@/lib/timeline-sources";
import { artOf, chapterArt, chapterOfYear, LENSES, mapHref, small, thingsOf, type Thing } from "@/lib/timeline-things";
import {
  activeStates,
  AXIS,
  CERTAINTY,
  refHref,
  toAh,
  yearsAgo,
  yearText,
  yearToT,
  type CardLink,
  type Chapter,
  type Nation,
  type Prophet,
  type Ref,
  type Route,
  type Site,
  type State,
  type Stop,
  type TimelineData,
  type Villain,
} from "@/lib/timeline-types";
import { meanwhile, regionOf } from "@/lib/timeline-world";
import { TONE } from "./atlas-style";
import { EntryActions } from "./EntryActions";
import { Avatar, ConnectionGraph, SpanChart, StatStrip, TafsirBlock, VerseGallery, type GraphNode, type SpanRow, type Stat } from "./EntryModules";

const SOURCE: Record<string, string> = { quran: "The Quran", hadith: "Authentic hadith", tafsir: "Classical tafsir", history: "Historical record" };
const MAX_VERSES = 6;

const keyOf = (r: Ref) => `${r.t}:${r.id}`;
const thingOf = (data: TimelineData, ref: Ref) => thingsOf(data).find((t) => t.ref.t === ref.t && t.ref.id === ref.id);
const toneOf = (data: TimelineData, ref: Ref) => {
  const t = thingOf(data, ref);
  return t ? TONE[t.tone] : TONE.event;
};
const kindOf = (data: TimelineData, ref: Ref) => LENSES.find((l) => l.id === thingOf(data, ref)?.lens)?.one ?? "";
const group = (card: TimelineEntry, ...qs: string[]) => card.groups.find((g) => qs.includes(g.q))?.items ?? [];
const n = (x: number) => x.toLocaleString("en-US");

// One page for any entry: a moment, a prophet, a person, a place, an empire, a nation or a villain. The sections are
// chosen for the kind of entry, and every one is built from the sources: the verses in Arabic and English, Ibn
// Kathir's commentary, the people and places linked to it and where it sits among everything else.
export function EntryPage({ data, card, stop, previous, next }: { data: TimelineData; card: TimelineEntry; stop?: Stop; previous?: Stop; next?: Stop }) {
  const ref = card.ref;
  const entity = entityOf(data, ref);
  const thing = thingOf(data, ref);
  const chapter: Chapter | undefined = thing && thing.chapter >= 0 ? data.chapters[thing.chapter] : stop ? data.chapters[stop.chapter] : undefined;
  const art = artOf(data, ref);
  const place = card.place?.lng !== undefined ? card.place : placeOf(data, ref);
  const year = card.year ?? thing?.year;
  const precision = card.precision ?? "approx";
  const dated = year !== undefined && precision !== "unknown" && year >= AXIS.min && year <= data.now;
  const lens = LENSES.find((l) => l.id === thing?.lens);
  const tone = thing ? TONE[thing.tone] : TONE.event;
  const [from, to] = spanOf(data, ref);

  // Sources: the key verse first, then every other passage cited, each in Arabic and English.
  const villain = ref.t === "villain" ? (entity as Villain) : undefined;
  // Entries that cite few verses add those of the moments they appear in, which are part of their record.
  const borrowed =
    ref.t === "event"
      ? []
      : card.groups
          .flatMap((g) => g.items)
          .filter((i) => i.ref.t === "event")
          .flatMap((m) => {
            const s = data.stops.find((x) => x.id === m.ref.id);
            return s ? [s.quote?.ref, ...s.verses.map((v) => v.ref)] : [];
          });
  const refs = [...new Set([card.quote?.ref, villain?.said?.ref, ...card.verses.map((v) => v.ref), ...borrowed].filter((r): r is string => !!r))];
  const verses = refs.slice(0, MAX_VERSES).map(verseDetail).filter((v): v is VerseDetail => !!v);
  const tafsir = refs[0] ? tafsirOf(refs[0]) : undefined;

  const ruled = dated ? activeStates(data.states, year).filter((s) => s.muslim) : [];
  const world = dated ? meanwhile(data, year!, place?.lng !== undefined ? regionOf(place.lng, place.lat!).id : undefined, 4).filter((m) => m.ref.id !== ref.id) : [];
  const links = uniqueLinks(card.groups.flatMap((g) => g.items));
  const moments = group(card, "Moments in history", "Where do they appear in history?", "What happened here?", "What happened in its time?", "In this chapter");

  const stats = statsOf({ data, ref, entity, card, dated, year, precision, from, to, verses: refs.length, links: links.length, moments: moments.length });

  const facts: [string, string][] = [
    ["Type", card.kind],
    ...(card.role ? [[ref.t === "polity" ? "Faith of its rulers" : ref.t === "place" ? "Other names" : "Known as", card.role] as [string, string]] : []),
    ...(card.when ? [["When", card.when.split(" · ")[0]] as [string, string]] : []),
    ...(dated && year! >= 622 ? [["Hijri year", `${stop?.ah ?? toAh(year!)} AH`] as [string, string]] : []),
    ...(place?.name ? [["Where", place.name] as [string, string]] : []),
    ...(chapter ? [["Era", `${chapter.n}. ${chapter.title}`] as [string, string]] : []),
    ...(card.precision && card.precision !== "exact" ? [["Dating", CERTAINTY[card.precision]] as [string, string]] : []),
    ...(card.source ? [["Main source", SOURCE[card.source] ?? card.source] as [string, string]] : []),
  ];

  const graph: GraphNode[] = links.slice(0, 12).map((l) => ({ key: keyOf(l.ref), name: l.name, sub: l.sub, href: mapHref(l.ref), tone: toneOf(data, l.ref), kind: kindOf(data, l.ref) }));

  return (
    <article className="en" style={{ ["--tone" as string]: tone }}>
      <header className="en-hero" style={{ backgroundImage: `url(${art})` }}>
        <div className="en-hero-in">
          <nav className="en-crumbs" aria-label="Breadcrumb">
            <Link href="/timeline">Atlas</Link>
            {lens && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/timeline?lens=${lens.id}`}>{lens.label}</Link>
              </>
            )}
            {chapter && (
              <>
                <span aria-hidden="true">/</span>
                <Link href={`/timeline/chapter-${chapter.id}`}>{chapter.title}</Link>
              </>
            )}
          </nav>
          <p className="en-kind">
            <i aria-hidden="true" />
            {card.kind}
            {lens && lens.id !== "moment" && !card.kind.toLowerCase().includes(lens.one.toLowerCase()) ? ` · ${lens.one}` : ""}
          </p>
          <h1>{card.name}</h1>
          {card.arabic && (
            <p className="en-arabic" lang="ar" dir="rtl">
              {card.arabic}
            </p>
          )}
          {card.role && <p className="en-role">{card.role}</p>}
          <ul className="en-chips">
            {card.when && <li>{card.when}</li>}
            {place?.name && <li>{place.name}</li>}
            {card.precision && card.precision !== "exact" && <li>{CERTAINTY[card.precision]}</li>}
          </ul>
          <EntryActions refKey={keyOf(ref)} name={card.name} mapUrl={mapHref(ref)} mapped={place?.lng !== undefined} />
        </div>
      </header>

      <StatStrip stats={stats} />

      <div className="en-grid">
        <div className="en-main">
          <section className="en-overview">
            {card.line && <p className="en-lede">{card.line}</p>}
            {card.story && <p className={`en-story${card.story.length < 320 && !card.line ? " en-story-short" : ""}`}>{card.story}</p>}
          </section>

          <Feature data={data} card={card} entity={entity} stop={stop} tone={tone} art={art} />

          {(stop?.journey || card.journey || stop?.article) && (
            <div className="en-feature">
              {(stop?.journey ?? card.journey) && (
                <Link href={`/timeline/journey/${stop?.journey ?? card.journey}`} className="en-feature-card" style={{ backgroundImage: `url(${small(art)})` }}>
                  <small>Illustrated journey</small>
                  <b>Walk through it scene by scene →</b>
                </Link>
              )}
              {stop?.article && (
                <Link href={`/learn/${stop.article}`} className="en-feature-card en-feature-guide" style={{ backgroundImage: "url(/timeline/art/k-knowledge-sm.webp)" }}>
                  <small>Guide</small>
                  <b>Read the in-depth guide →</b>
                </Link>
              )}
            </div>
          )}

          {verses.length > 0 && (
            <section className="en-sec">
              <SectionHead k="Revelation" title={verses.length > 1 ? `${verses.length} passages of the Quran` : "In the Quran"} />
              <VerseGallery verses={verses} />
              {refs.length > MAX_VERSES && (
                <p className="en-more-refs">
                  Also cited:{" "}
                  {card.verses
                    .filter((v) => !verses.some((d) => d.ref === v.ref))
                    .map((v, i) => (
                      <span key={v.ref}>
                        {i > 0 && ", "}
                        <Link href={v.href}>{v.ref}</Link>
                      </span>
                    ))}
                </p>
              )}
            </section>
          )}

          {tafsir && (
            <section className="en-sec">
              <SectionHead k="Commentary" title="What the scholars say" />
              <TafsirBlock tafsir={tafsir} />
            </section>
          )}

          <Insights card={card} />

          {card.hadith.length > 0 && (
            <section className="en-sec">
              <SectionHead k="Sunnah" title="In the hadith" />
              <ul className="hd">
                {card.hadith.map((h) => (
                  <li key={h.url}>
                    <a href={h.url} target="_blank" rel="noreferrer">
                      <span className="hd-seal" aria-hidden="true">
                        ح
                      </span>
                      <span>
                        <b>{h.label}</b>
                        <small>Read the narration on sunnah.com ↗</small>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {dated && <TimeRibbon data={data} year={year!} self={ref} chapter={chapter} />}

          {world.length > 0 && (
            <section className="en-sec">
              <SectionHead k="Meanwhile" title="Elsewhere in the world" />
              <ul className="en-world">
                {world.map((m) => (
                  <li key={m.ref.id}>
                    <Link href={mapHref(m.ref)} style={{ backgroundImage: `linear-gradient(180deg, rgba(4,12,16,.25), rgba(4,12,16,.92)), url(${small(artOf(data, m.ref))})` }}>
                      <small>{m.region}</small>
                      <b>{m.title}</b>
                      <span>{m.when}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {graph.length > 1 && (
            <section className="en-sec">
              <SectionHead k="Connections" title={`Linked to ${links.length} others in the atlas`} />
              <ConnectionGraph name={card.name} tone={tone} nodes={graph} />
            </section>
          )}

          {card.groups.map((g) => (
            <section className="en-sec en-sec-tight" key={g.q}>
              <h3 className="en-h3">{g.q}</h3>
              <ul className="en-cards">
                {g.items.map((item) => (
                  <RelatedCard key={keyOf(item.ref)} data={data} item={item} />
                ))}
              </ul>
            </section>
          ))}

          {(card.note || card.wiki) && (
            <details className="en-note">
              <summary>On the sources and dating</summary>
              {card.note && <p>{card.note}</p>}
              {card.wiki && (
                <p>
                  <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(card.wiki.replace(/ /g, "_"))}`} target="_blank" rel="noreferrer">
                    Further reading on Wikipedia ↗
                  </a>
                </p>
              )}
            </details>
          )}
        </div>

        <aside className="en-side">
          {place?.lng !== undefined && <Locator data={data} lng={place.lng} lat={place.lat!} name={place.name} self={ref} wide={ref.t === "polity"} routes={stop?.routes ?? []} />}
          <dl className="en-facts">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          {ruled.length > 0 && (
            <div className="en-ruled">
              <h3>Muslim powers at the time</h3>
              <ul>
                {ruled.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link href={mapHref({ t: "polity", id: s.id })}>
                      <i aria-hidden="true" />
                      {s.name}
                      <small>
                        {yearText(s.from)}–{yearText(s.to)}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {(previous || next || chapter) && (
        <nav className="en-next" aria-label="Continue through history">
          {previous && previous.type === "event" ? (
            <Link href={`/timeline/${previous.id}`} style={{ backgroundImage: `url(${small(artOf(data, { t: "event", id: previous.id }))})` }}>
              <small>← Before</small>
              <b>{previous.title}</b>
              <span>{previous.label.split(" · ")[0]}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && next.type === "event" ? (
            <Link href={`/timeline/${next.id}`} className="en-next-r" style={{ backgroundImage: `url(${small(artOf(data, { t: "event", id: next.id }))})` }}>
              <small>After →</small>
              <b>{next.title}</b>
              <span>{next.label.split(" · ")[0]}</span>
            </Link>
          ) : chapter ? (
            <Link href={`/timeline/chapter-${chapter.id}`} className="en-next-r" style={{ backgroundImage: `url(${small(chapterArt(chapter))})` }}>
              <small>The era →</small>
              <b>{chapter.title}</b>
              <span>{chapter.span}</span>
            </Link>
          ) : null}
        </nav>
      )}
    </article>
  );
}

function SectionHead({ k, title }: { k: string; title: string }) {
  return (
    <header className="en-sh">
      <p>{k}</p>
      <h2>{title}</h2>
    </header>
  );
}

function uniqueLinks(items: CardLink[]) {
  const seen = new Set<string>();
  return items.filter((i) => !seen.has(keyOf(i.ref)) && seen.add(keyOf(i.ref)));
}

function statsOf(o: {
  data: TimelineData;
  ref: Ref;
  entity: unknown;
  card: TimelineEntry;
  dated: boolean;
  year?: number;
  precision: TimelineEntry["precision"];
  from?: number;
  to?: number;
  verses: number;
  links: number;
  moments: number;
}): Stat[] {
  const { data, ref, entity, card, dated, year, precision, from, to } = o;
  const out: Stat[] = [];
  if (ref.t === "prophet" && (entity as Prophet).mentions) out.push({ value: n((entity as Prophet).mentions!), label: "times named in the Quran" });
  if (dated) out.push({ value: yearsAgo(year!, data.now, precision ?? "approx").replace(/ years ago$/, "").replace(/^about /, "~"), label: "years ago" });
  if (from !== undefined && to !== undefined && to > from && ref.t !== "event")
    out.push({ value: `${n(to - from)}`, label: ref.t === "polity" ? "years in power" : ref.t === "nation" ? "years recorded" : "years of life" });
  if (ref.t === "event" && dated && year! >= 622) out.push({ value: `${card.when?.match(/(\d+) AH/)?.[1] ?? toAh(year!)}`, label: "year of the Hijra (AH)" });
  if (ref.t === "polity") {
    const rulers = group(card, "Who ruled it?").length;
    if (rulers) out.push({ value: n(rulers), label: "rulers recorded" });
  }
  if (ref.t === "place") {
    const people = group(card, "Who lived here?").length;
    if (people) out.push({ value: n(people), label: "people of this place" });
  }
  if (o.verses) out.push({ value: n(o.verses), label: o.verses === 1 ? "Quran passage" : "Quran passages" });
  if (card.hadith.length) out.push({ value: n(card.hadith.length), label: card.hadith.length === 1 ? "hadith cited" : "hadith cited" });
  if (o.moments && ref.t !== "event") out.push({ value: n(o.moments), label: o.moments === 1 ? "moment in history" : "moments in history" });
  if (o.links) out.push({ value: n(o.links), label: "connections" });
  return out.slice(0, 5);
}

// Prose fields become designed blocks: why it matters, how it ended, what lasted and what to take from it.
function Insights({ card }: { card: TimelineEntry }) {
  const blocks: { k: string; title: string; text?: string; cls: string }[] = [
    { k: "Significance", title: "Why it matters in Islam", text: card.tie, cls: "in-tie" },
    { k: "Legacy", title: "What it left behind", text: card.legacy, cls: "in-legacy" },
  ];
  const shown = blocks.filter((b) => b.text);
  if (!shown.length && !card.lesson && !card.sections?.length) return null;
  return (
    <section className="en-sec">
      {shown.length > 0 && (
        <div className="in-grid">
          {shown.map((b) => (
            <article className={`in ${b.cls}`} key={b.k}>
              <p className="in-k">{b.k}</p>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
            </article>
          ))}
        </div>
      )}
      {card.lesson && (
        <aside className="en-lesson">
          <span className="en-lesson-mark" aria-hidden="true">
            ❖
          </span>
          <div>
            <p className="en-lesson-k">Reflection</p>
            <p>{card.lesson}</p>
          </div>
        </aside>
      )}
    </section>
  );
}

// The module that suits the kind of entry.
function Feature({ data, card, entity, stop, tone, art }: { data: TimelineData; card: TimelineEntry; entity: unknown; stop?: Stop; tone: string; art: string }) {
  const ref = card.ref;

  if (ref.t === "villain") {
    const v = entity as Villain;
    const said = v.said;
    const prophet = v.against.prophet ? data.prophets.find((p) => p.id === v.against.prophet) : undefined;
    return (
      <section className="en-sec">
        <SectionHead k="Rise and fall" title="What they relied on, and what undid them" />
        <div className="rf">
          <div className="rf-col rf-rise">
            <p className="rf-k">Relied on</p>
            <p className="rf-v">{v.relied ?? "Their own power"}</p>
          </div>
          <div className="rf-arrow" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <path d="M6 20h26M24 12l8 8-8 8" />
            </svg>
          </div>
          <div className="rf-col rf-fall">
            <p className="rf-k">Undone by</p>
            <p className="rf-v">{v.undone ?? "The decree of Allah"}</p>
          </div>
        </div>
        {v.end && (
          <div className="rf-end" style={{ backgroundImage: `linear-gradient(90deg, rgba(4,12,16,.94), rgba(4,12,16,.55)), url(${small(art)})` }}>
            <p className="rf-k">Their end</p>
            <p>{v.end}</p>
          </div>
        )}
        <div className="rf-pair">
          {said?.text && (
            <figure className="rf-said">
              <p className="rf-k">In their own words · Quran {said.ref}</p>
              <blockquote>{said.text}</blockquote>
            </figure>
          )}
          {(prophet || v.against.name) && (
            <Link className="rf-against" href={prophet ? mapHref({ t: "prophet", id: prophet.id }) : "#"}>
              <p className="rf-k">Stood against them</p>
              <span className="rf-who">
                <Avatar name={v.against.name} tone={TONE.prophet} />
                <span>
                  <b>{prophet ? `Prophet ${prophet.name}` : v.against.name}</b>
                  {prophet && <small>{prophet.line}</small>}
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (ref.t === "nation") {
    const nat = entity as Nation;
    const prophet = nat.prophet ? data.prophets.find((p) => p.id === nat.prophet) : undefined;
    const steps = [
      { k: "The people", title: nat.name, text: [nat.place?.name, card.when].filter(Boolean).join(" · ") },
      { k: "The messenger", title: prophet ? `Prophet ${prophet.name}` : "A warner", text: prophet?.line ?? "The Quran tells of the warning they were given." },
      { k: "The outcome", title: nat.end ? "What became of them" : "Their fate", text: nat.end ?? "Their story is kept in the Quran as a sign." },
    ];
    return (
      <section className="en-sec">
        <SectionHead k="The arc" title="A people, a messenger, an outcome" />
        <ol className="arcs">
          {steps.map((s, i) => (
            <li key={s.k}>
              <span className="arcs-n">{i + 1}</span>
              <p className="rf-k">{s.k}</p>
              <h3>
                {i === 1 && prophet ? <Link href={mapHref({ t: "prophet", id: prophet.id })}>{s.title}</Link> : s.title}
              </h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        {nat.archaeology && (
          <div className="rf-end" style={{ backgroundImage: `linear-gradient(90deg, rgba(4,12,16,.94), rgba(4,12,16,.5)), url(${small(art)})` }}>
            <p className="rf-k">What the ground tells us</p>
            <p>{nat.archaeology}</p>
          </div>
        )}
      </section>
    );
  }

  if (ref.t === "polity") {
    const s = entity as State;
    const rulers = spanRows(data, group(card, "Who ruled it?"));
    const self: SpanRow = { key: keyOf(ref), name: s.name, from: s.from, to: s.to, href: mapHref(ref), tone, self: true };
    const rivals = spanRows(data, group(card, "Who were its neighbours in time?"));
    return (
      <>
        {rulers.length > 0 && (
          <section className="en-sec">
            <SectionHead k="Dynasty" title={`${rulers.length} rulers, in order`} />
            <SpanChart rows={[self, ...rulers]} caption="Bars show each ruler's recorded dates. Tap a name to find them on the map." />
          </section>
        )}
        {rivals.length > 0 && (
          <section className="en-sec">
            <SectionHead k="Neighbours in time" title="The powers that rose and fell beside it" />
            <SpanChart rows={[self, ...rivals]} />
          </section>
        )}
      </>
    );
  }

  if (ref.t === "person" || ref.t === "prophet") {
    const [from, to] = spanOf(data, ref);
    if (from === undefined || to === undefined || to <= from) return <Cast data={data} />;
    const self: SpanRow = { key: keyOf(ref), name: card.name, from, to, href: mapHref(ref), tone, self: true };
    const rows = spanRows(data, group(card, "Who lived at the same time?")).slice(0, 9);
    const marks = group(card, "Moments in history", "Where do they appear in history?")
      .map((m) => ({ m, y: spanOf(data, m.ref)[0] }))
      .filter((x) => x.y !== undefined && x.y >= from - 30 && x.y <= to + 30)
      .map(({ m, y }) => ({ key: keyOf(m.ref), year: y!, label: m.name, href: refHref(m.ref) }));
    return (
      <section className="en-sec">
        <SectionHead k="A life in its time" title={rows.length ? `${card.name} and ${rows.length} contemporaries` : `The life of ${card.name}`} />
        <SpanChart rows={[self, ...rows]} marks={marks} caption="Diamonds mark the moments of this life recorded in the atlas. Dates of the earliest figures are traditional." />
      </section>
    );
  }

  if (ref.t === "place") {
    const site = entity as Site;
    const here = group(card, "What happened here?");
    return (
      <section className="en-sec">
        <SectionHead k="Through the ages" title={here.length ? `${here.length} moments at ${site.name}` : `${site.name} in history`} />
        {here.length > 0 ? <AgesStrip data={data} items={here} /> : <p className="en-quiet">No moments are recorded here yet. Explore what lies around it on the map.</p>}
      </section>
    );
  }

  return <Cast data={data} stop={stop} />;
}

function spanRows(data: TimelineData, items: CardLink[]): SpanRow[] {
  return items
    .map((i): SpanRow | undefined => {
      const [f, t] = spanOf(data, i.ref);
      if (f === undefined) return undefined;
      const point = t === undefined || t <= f;
      const role = i.ref.t === "person" ? i.sub?.split(" · ")[0] : undefined;
      return { key: keyOf(i.ref), name: i.name, sub: role ?? kindOf(data, i.ref), from: f, to: point ? f + 1 : t!, point, href: mapHref(i.ref), tone: toneOf(data, i.ref) };
    })
    .filter((r): r is SpanRow => !!r);
}

// Who was there: everyone named in the moment, with what they are known for.
function Cast({ data, stop }: { data: TimelineData; stop?: Stop }) {
  const named = stop?.who ?? [];
  const linked = named.filter((w) => w.ref).map((w) => linkOf(data, w.ref!));
  const others = named.filter((w) => !w.ref).map((w) => w.name);
  if (!linked.length && !others.length) return null;
  return (
    <section className="en-sec">
      <SectionHead k="Who was there" title={`${named.length} ${named.length === 1 ? "person" : "people"} in this moment`} />
      <ul className="cast">
        {linked.map((l) => (
          <li key={keyOf(l.ref)}>
            <Link href={mapHref(l.ref)}>
              <Avatar name={l.name} tone={toneOf(data, l.ref)} />
              <span>
                <b>{l.name}</b>
                <small>{l.sub ?? kindOf(data, l.ref)}</small>
              </span>
            </Link>
          </li>
        ))}
        {others.map((o) => (
          <li key={o} className="cast-plain">
            <span>
              <Avatar name={o} tone="#8a948f" />
              <span>
                <b>{o}</b>
                <small>Named in this moment</small>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AgesStrip({ data, items }: { data: TimelineData; items: CardLink[] }) {
  return (
    <ol className="ages">
      {items.slice(0, 18).map((i) => (
        <li key={keyOf(i.ref)}>
          <Link href={refHref(i.ref)} style={{ backgroundImage: `linear-gradient(180deg, rgba(4,12,16,.1), rgba(4,12,16,.92)), url(${small(artOf(data, i.ref))})` }}>
            <small>{i.sub}</small>
            <b>{i.name}</b>
          </Link>
        </li>
      ))}
    </ol>
  );
}

function RelatedCard({ data, item }: { data: TimelineData; item: CardLink }) {
  const t = thingOf(data, item.ref);
  const lens = LENSES.find((l) => l.id === t?.lens);
  return (
    <li>
      <Link href={mapHref(item.ref)} className="en-card" style={{ ["--c" as string]: t ? TONE[t.tone] : TONE.event }}>
        <span className="en-card-k">
          <i aria-hidden="true" />
          {lens?.one}
        </span>
        <b>{item.name}</b>
        {item.sub && <small>{item.sub}</small>}
        <span className="en-card-go" aria-hidden="true">
          Show on map →
        </span>
      </Link>
    </li>
  );
}

// A strip of all 5,400 years with the eras as bands, this entry marked and the moments near it as ticks.
function TimeRibbon({ data, year, self, chapter }: { data: TimelineData; year: number; self: Ref; chapter?: Chapter }) {
  const things = thingsOf(data);
  const near = things
    .filter((t) => t.lens === "moment" && t.year !== undefined && t.key !== keyOf(self) && (chapter ? t.chapter === chapter.n - 1 : Math.abs(t.year - year) < 80))
    .sort((a, b) => Math.abs(a.year! - year) - Math.abs(b.year! - year));
  const before = near.filter((t) => t.year! <= year).slice(0, 2).reverse();
  const after = near.filter((t) => t.year! > year).slice(0, 2);
  const bands = data.chapters.filter((c) => c.from !== undefined && c.id !== "hour" && c.id !== "beginning");
  const ticks = things.filter((t) => t.lens === "moment" && t.year !== undefined && t.year >= AXIS.min && t.year <= data.now && t.chapter === (chapter ? chapter.n - 1 : chapterOfYear(data.chapters, year)));
  const pct = (y: number) => `${(yearToT(y) * 100).toFixed(2)}%`;
  return (
    <section className="en-sec">
      <SectionHead k="In time" title="Where it sits in 5,400 years" />
      <div className="tr">
        <div className="tr-axis">
          {bands.map((c, i) => {
            const end = bands[i + 1]?.from ?? data.now;
            return (
              <Link
                key={c.id}
                href={`/timeline/chapter-${c.id}`}
                className={`tr-band${chapter?.id === c.id ? " on" : ""}`}
                style={{ left: pct(c.from!), width: `calc(${pct(end)} - ${pct(c.from!)})` }}
                title={`${c.title} · ${c.span}`}
              >
                <span>{c.n}</span>
              </Link>
            );
          })}
          {ticks.map((t) => (
            <i key={t.key} className="tr-tick" style={{ left: pct(t.year!) }} />
          ))}
          <span className="tr-mark" style={{ left: pct(year) }}>
            <b>{yearText(year)}</b>
          </span>
        </div>
        <div className="tr-ends">
          <span>{yearText(AXIS.min)}</span>
          <span>The Prophet ﷺ · 570 CE</span>
          <span>Today</span>
        </div>
        {(before.length > 0 || after.length > 0) && (
          <ol className="tr-near">
            {before.map((t) => (
              <NearItem key={t.key} t={t} />
            ))}
            <li className="tr-self">
              <small>{yearText(year)}</small>
              <b>This entry</b>
            </li>
            {after.map((t) => (
              <NearItem key={t.key} t={t} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

const NearItem = ({ t }: { t: Thing }) => (
  <li>
    <Link href={refHref(t.ref)}>
      <small>{t.when}</small>
      <b>{t.name}</b>
    </Link>
  </li>
);

// A small vector map cut from /timeline/world.svg, with the place, any journey drawn on it, the moments around it and
// a link to the live atlas.
function Locator({ data, lng, lat, name, self, wide, routes }: { data: TimelineData; lng: number; lat: number; name: string; self: Ref; wide?: boolean; routes: Route[] }) {
  const pts = [[lng, lat], ...routes.flatMap((r) => r.coords)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const spanX = Math.max(wide ? 64 : 34, (Math.max(...xs) - Math.min(...xs)) * 1.4);
  const w = Math.min(300, spanX);
  const h = w * 0.62;
  const midX = routes.length ? (Math.max(...xs) + Math.min(...xs)) / 2 : lng;
  const midY = routes.length ? (Math.max(...ys) + Math.min(...ys)) / 2 : lat;
  const x0 = Math.min(180 - w, Math.max(-180, midX - w / 2));
  const y0 = Math.min(90 - h, Math.max(-90, -midY - h / 2));
  const near = thingsOf(data).filter((t) => t.lng !== undefined && t.lens === "moment" && t.lng > x0 && t.lng < x0 + w && -t.lat! > y0 && -t.lat! < y0 + h && t.key !== keyOf(self));
  const r = w / 120;
  return (
    <figure className="lc">
      <Link href={mapHref(self)} aria-label={`Show ${name} on the live map`}>
        <svg viewBox={`${x0} ${y0} ${w} ${h}`} role="img" aria-label={`Map showing ${name}`}>
          <rect x={x0} y={y0} width={w} height={h} fill="#0a2430" />
          <image href="/timeline/world.svg" x={-180} y={-90} width={360} height={180} preserveAspectRatio="none" />
          {near.slice(0, 80).map((t) => (
            <circle key={t.key} cx={t.lng} cy={-t.lat!} r={r * 1.4} fill={TONE[t.tone]} opacity={0.55} />
          ))}
          {routes.map((rt, i) => (
            <polyline key={i} points={rt.coords.map(([x, y]) => `${x},${-y}`).join(" ")} fill="none" stroke="#ffcf73" strokeWidth={r * 0.9} strokeDasharray={`${r * 3} ${r * 2}`} strokeLinecap="round" />
          ))}
          {routes.flatMap((rt) => rt.stops).map((s) => (
            <circle key={`${s.name}-${s.lng}`} cx={s.lng} cy={-s.lat} r={r * 1.8} fill="#081419" stroke="#ffcf73" strokeWidth={r * 0.6} />
          ))}
          <circle className="lc-pulse" cx={lng} cy={-lat} r={r * 6} fill="none" stroke="#ffcf73" strokeWidth={r * 0.8} />
          <circle cx={lng} cy={-lat} r={r * 3} fill="#ffcf73" stroke="#081419" strokeWidth={r} />
        </svg>
        <figcaption>
          <span>{routes.length ? `The route · ${routes.flatMap((x) => x.stops).length} stops` : name}</span>
          <b>Open in the atlas →</b>
        </figcaption>
      </Link>
    </figure>
  );
}
