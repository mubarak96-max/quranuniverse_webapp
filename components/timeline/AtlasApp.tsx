"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clampMapYear } from "@/lib/timeline-entry";
import { chapterOfYear, LENSES, thingsOf, type Lens, type Thing } from "@/lib/timeline-things";
import { refHref, type Chapter, type Focus, type Stop, type TimelineData } from "@/lib/timeline-types";
import { AtlasMap, type MapFocusMark, type MapPoint, type Padding } from "./AtlasMap";
import { AtlasPanel } from "./AtlasPanel";
import { AtlasSpotlight } from "./AtlasSpotlight";
import { EraBar } from "./EraBar";
import { LAST_KEY, readSeen, SEEN_KEY, store, useTimelineData } from "./useTimelineData";

const WORLD: Focus = { lng: 40, lat: 26, zoom: 1.9 };
const TOUR_MS = 7000;
const DEFAULT_ERA = "prophet";

export type Picked = { thing: Thing; also: Thing[]; hint: boolean };

// The map is the timeline's front door and its one navigator. Every way in (a chapter, a lens, a search, a link from
// any page) lands here, flies the map to the thing, rings it with a beacon and offers its page from the spotlight.
export function AtlasApp({ chapters, initialEra, initialLens, initialYear }: { chapters: Chapter[]; initialEra?: string; initialLens?: Lens; initialYear?: number }) {
  const data = useTimelineData();
  if (!data) return <AtlasShell chapters={chapters} />;
  return <Atlas data={data} initialEra={initialEra} initialLens={initialLens} initialYear={initialYear} />;
}

// What renders before the data arrives: the same frame, so nothing jumps when the map lights up.
function AtlasShell({ chapters }: { chapters: Chapter[] }) {
  return (
    <section className="atl is-loading" aria-label="Atlas of Islamic history">
      <div className="atl-map am-map">
        <p className="am-loading" role="status">
          <span className="am-spinner" aria-hidden="true" />
          Lighting up 5,400 years…
        </p>
      </div>
      <div className="atl-panel ap">
        <header className="ap-head">
          <p className="ap-eyebrow">Atlas of Islamic history</p>
          <h1 className="ap-title">From Adam to today, on one map</h1>
        </header>
      </div>
      <EraBar chapters={chapters} current={chapters.findIndex((c) => c.id === DEFAULT_ERA)} onChapter={() => undefined} />
    </section>
  );
}

function usePadding(selected: boolean): [Padding, boolean] {
  const [w, setW] = useState(1280);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    on();
    addEventListener("resize", on);
    return () => removeEventListener("resize", on);
  }, []);
  const small = w < 900;
  const pad = useMemo<Padding>(
    () => (small ? { top: 76, right: 0, bottom: selected ? 300 : 170, left: 0 } : { top: 16, right: selected ? 420 : 0, bottom: 124, left: 432 }),
    [small, selected],
  );
  return [pad, small];
}

function Atlas({ data, initialEra, initialLens, initialYear }: { data: TimelineData; initialEra?: string; initialLens?: Lens; initialYear?: number }) {
  const router = useRouter();
  const { chapters, stops, states, overlays } = data;
  const things = useMemo(() => thingsOf(data), [data]);
  const byKey = useMemo(() => new Map(things.map((t) => [t.key, t])), [things]);
  const stopById = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);

  const startEra = Math.max(0, chapters.findIndex((c) => c.id === (initialEra ?? DEFAULT_ERA)));
  const [chapter, setChapter] = useState(initialYear !== undefined ? Math.max(0, chapterOfYear(chapters, initialYear)) : startEra);
  const [year, setYear] = useState<number | undefined>(initialYear ?? eraYear(chapters[startEra], data.now));
  const [lens, setLens] = useState<Lens | "all">(initialLens ?? "all");
  // A collection (one lens) spans all of history unless the reader narrows it to the chapter on screen.
  const [eraOnly, setEraOnly] = useState(false);
  const wide = lens !== "all" && !eraOnly;
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Picked>();
  const [focus, setFocus] = useState<{ f: Focus; key: string }>(() => ({ f: chapterFocus(stops, chapters[startEra]) ?? WORLD, key: "start" }));
  const [touring, setTouring] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const [last, setLast] = useState<Thing>();
  const [sheet, setSheet] = useState(false);
  const [pad, small] = usePadding(!!picked);

  const markSeen = useCallback((k: string) => {
    setSeen((s) => {
      if (s.has(k)) return s;
      const n = new Set(s).add(k);
      store.set(SEEN_KEY, JSON.stringify([...n]));
      return n;
    });
  }, []);

  // Show a thing: switch to its chapter and year, fly to it and ring it. `hint` adds the "tap to open" bubble, for
  // arrivals from a link or a search, where the reader has not yet seen where the thing sits.
  const show = useCallback(
    (key: string, opts: { hint?: boolean; also?: string[]; fly?: boolean } = {}) => {
      const thing = byKey.get(key);
      if (!thing) return;
      if (thing.chapter >= 0) setChapter(thing.chapter);
      const c = chapters[thing.chapter];
      const y = thing.year !== undefined && thing.ref.t !== "place" ? clampMapYear(thing.year) : c ? eraYear(c, data.now) : year;
      setYear(c?.id === "beginning" ? undefined : y);
      setPicked({ thing, hint: !!opts.hint, also: (opts.also ?? []).filter((k) => k !== key).map((k) => byKey.get(k)!).filter(Boolean) });
      markSeen(key);
      if (opts.fly === false) return;
      if (thing.lng !== undefined) {
        const stop = thing.ref.t === "event" ? stopById.get(thing.ref.id) : undefined;
        const zoom = thing.lens === "polity" ? 3.3 : thing.lens === "place" ? 5 : 4.4;
        setFocus({ f: stop?.focus.bounds ? stop.focus : { lng: thing.lng, lat: thing.lat!, zoom: Math.max(zoom, stop?.focus.zoom ?? 0) }, key });
      }
    },
    [byKey, chapters, data.now, year, markSeen, stopById],
  );

  // Arrivals: ?focus=person:bilal, ?era=musa, ?lens=villain, and the old #explore=900 / #prophets=musa links.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    setSeen(readSeen());
    const lastKey = store.get(LAST_KEY);
    if (lastKey && byKey.has(lastKey)) setLast(byKey.get(lastKey));
    const q = new URLSearchParams(location.search);
    const hash = /^#(explore|prophets|villains|empires|library)(?:=(.+))?$/.exec(location.hash);
    const lensQ = q.get("lens") as Lens | null;
    if (lensQ && LENSES.some((l) => l.id === lensQ)) setLens(lensQ);
    if (hash?.[1] === "villains") setLens("villain");
    if (hash?.[1] === "empires") setLens("polity");
    if (hash?.[1] === "library") setLens("person");
    if (hash?.[1] === "prophets") setLens("prophet");
    const era = q.get("era");
    const yr = Number(q.get("year") ?? (hash?.[1] === "explore" ? hash[2] : NaN));
    const focusKey = q.get("focus") ?? (hash?.[1] === "prophets" && hash[2] ? `prophet:${hash[2]}` : hash?.[1] === "villains" && hash[2] ? `villain:${hash[2]}` : null);
    if (focusKey && byKey.has(focusKey)) {
      const t = byKey.get(focusKey)!;
      if (lensQ === null && t.lng === undefined) setLens(t.lens);
      show(focusKey, { hint: true });
    } else if ((lensQ && LENSES.some((l) => l.id === lensQ)) || initialLens || (hash && hash[1] !== "explore")) {
      // A collection spreads over the world: start wide enough to see all of it.
      setFocus({ f: { ...WORLD, zoom: innerWidth < 900 ? 1.1 : 1.7 }, key: "lens:start" });
    } else if (era && chapters.some((c) => c.id === era)) {
      const i = chapters.findIndex((c) => c.id === era);
      setChapter(i);
      setYear(eraYear(chapters[i], data.now));
      setFocus({ f: chapterFocus(stops, chapters[i]) ?? WORLD, key: `era:${i}` });
    } else if (Number.isFinite(yr)) {
      const y = clampMapYear(yr);
      setYear(y);
      setChapter(Math.max(0, chapterOfYear(chapters, y)));
    }
  }, [byKey, chapters, data.now, show, stops, initialLens]);

  // Keep the address bar shareable without filling history.
  useEffect(() => {
    if (!booted.current) return;
    const q = new URLSearchParams();
    if (picked) q.set("focus", picked.thing.key);
    else q.set("era", chapters[chapter].id);
    if (lens !== "all") q.set("lens", lens);
    const url = `/timeline?${q.toString().replace(/%3A/g, ":")}`;
    const t = setTimeout(() => {
      if (location.pathname + location.search !== url) history.replaceState(history.state, "", url);
    }, 300);
    return () => clearTimeout(t);
  }, [picked, chapter, lens, chapters]);

  const pickEra = useCallback(
    (i: number) => {
      setTouring(false);
      setPicked(undefined);
      setQuery("");
      setChapter(i);
      setYear(eraYear(chapters[i], data.now));
      setFocus({ f: chapterFocus(stops, chapters[i]) ?? WORLD, key: `era:${i}:${Date.now()}` });
    },
    [chapters, data.now, stops],
  );

  const eraList = useMemo(() => {
    const inEra = things.filter((t) => (t.lens === "place" ? t.chapter === chapter || lens === "place" : t.chapter === chapter));
    return inEra.sort((a, b) => order(a) - order(b));
  }, [things, chapter, lens]);

  // How many of each kind exist across all of history, for the collection tiles.
  const totals = useMemo(() => {
    const c: Partial<Record<Lens | "all", number>> = { all: things.length };
    for (const t of things) c[t.lens] = (c[t.lens] ?? 0) + 1;
    return c;
  }, [things]);

  const list = useMemo(() => {
    const q = norm(query.trim());
    if (q.length >= 2) {
      const score = (t: Thing) => {
        const n = norm(t.name);
        if (n === q) return 0;
        if (n.startsWith(q) || n.includes(` ${q}`)) return 1;
        if (n.includes(q)) return 2;
        if (norm(`${t.sub ?? ""} ${t.place ?? ""}`).includes(q)) return 3;
        return norm(t.summary).includes(q) ? 4 : 9;
      };
      return things
        .filter((t) => lens === "all" || t.lens === lens)
        .map((t) => ({ t, s: score(t) }))
        .filter((x) => x.s < 9)
        .sort((a, b) => a.s - b.s || order(a.t) - order(b.t))
        .slice(0, 60)
        .map((x) => x.t);
    }
    if (wide) return things.filter((t) => t.lens === lens).sort((a, b) => chapterOrder(a) - chapterOrder(b) || order(a) - order(b));
    return eraList.filter((t) => (lens === "all" ? t.lens !== "place" || t.chapter === chapter : t.lens === lens));
  }, [query, things, lens, eraList, chapter, wide]);

  const polityAlive = useCallback(
    (t: Thing) => {
      const s = states.find((x) => `polity:${x.id}` === t.key);
      return !!s && year !== undefined && year >= s.from && year <= s.to;
    },
    [states, year],
  );

  const points = useMemo<MapPoint[]>(
    () =>
      things
        .filter((t) => t.lng !== undefined && t.lat !== undefined)
        .map((t) => ({
          key: t.key,
          lng: t.lng!,
          lat: t.lat!,
          tone: t.tone,
          lens: t.lens,
          name: t.name,
          when: t.when,
          e: wide ? t.lens === lens : t.lens === "polity" ? polityAlive(t) : t.lens === "place" ? lens === "place" || t.chapter === chapter : t.chapter === chapter,
        })),
    [things, chapter, lens, polityAlive, wide],
  );

  const mark = useMemo<MapFocusMark | undefined>(() => {
    const t = picked?.thing;
    if (!t || t.lng === undefined) return undefined;
    return { key: t.key, lng: t.lng, lat: t.lat!, name: t.name, tone: t.tone, hint: picked.hint ? "Tap to explore" : undefined };
  }, [picked]);

  const open = useCallback(
    (t: Thing) => {
      setTouring(false);
      router.push(refHref(t.ref));
    },
    [router],
  );

  // The chapter tour steps through its mapped moments in order.
  const tourList = useMemo(() => eraList.filter((t) => t.lens === "moment" && t.lng !== undefined), [eraList]);
  useEffect(() => {
    if (!touring) return;
    const at = picked ? tourList.findIndex((t) => t.key === picked.thing.key) : -1;
    const next = tourList[at + 1];
    if (!next) {
      setTouring(false);
      return;
    }
    const timer = setTimeout(() => show(next.key), at < 0 ? 200 : TOUR_MS);
    const onHide = () => document.hidden && setTouring(false);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [touring, picked, tourList, show]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!picked) return;
      const pool = list.length ? list : eraList;
      const i = pool.findIndex((t) => t.key === picked.thing.key);
      const to = pool[i < 0 ? 0 : i + dir];
      if (to) show(to.key, { hint: false });
    },
    [picked, list, eraList, show],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || t.closest("input, textarea, select, [role=slider]")) return;
      if (e.key === "Escape" && picked) setPicked(undefined);
      else if (e.key === "ArrowRight" && picked) step(1);
      else if (e.key === "ArrowLeft" && picked) step(-1);
      else if (e.key === "/") {
        e.preventDefault();
        document.getElementById("ap-search")?.focus();
      } else return;
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [picked, step]);

  const stop: Stop | undefined = picked?.thing.ref.t === "event" ? stopById.get(picked.thing.ref.id) : undefined;
  const mapped = things.filter((t) => t.lens === "moment").length;

  return (
    <section className={`atl${picked ? " has-pick" : ""}${sheet ? " sheet-open" : ""}`} aria-label="Atlas of Islamic history">
      <div className="atl-map">
        <AtlasMap
          year={year}
          states={states}
          overlays={overlays}
          points={points}
          lens={lens}
          mark={mark}
          focus={focus.f}
          focusKey={focus.key}
          padding={pad}
          routes={stop?.routes ?? []}
          onPick={(keys) => {
            setTouring(false);
            show(keys[0], { also: keys, fly: false });
            if (small) setSheet(false);
          }}
          onMarkOpen={() => picked && open(picked.thing)}
          onEmpty={(name, state) => {
            if (state && byKey.has(`polity:${state}`)) show(`polity:${state}`, { fly: false });
            else setPicked(undefined);
            void name;
          }}
        />
      </div>

      <AtlasPanel
        chapter={chapters[chapter]}
        chapters={chapters}
        lens={lens}
        totals={totals}
        wide={wide}
        onScope={(era) => setEraOnly(era)}
        query={query}
        list={list}
        selected={picked?.thing.key}
        seen={seen}
        last={last}
        mapped={mapped}
        total={things.length}
        touring={touring}
        sheet={sheet}
        onSheet={setSheet}
        onLens={(l) => {
          setLens(l);
          setTouring(false);
          setEraOnly(false);
          // A whole collection is spread over the world, so step back to see all of it.
          if (l !== "all") setFocus({ f: { ...WORLD, zoom: small ? 1.1 : 1.7 }, key: `lens:${l}:${Date.now()}` });
        }}
        onQuery={setQuery}
        onPick={(t) => {
          setTouring(false);
          show(t.key, { hint: true });
          if (small) setSheet(false);
        }}
        onTour={() => {
          setLens("all");
          setQuery("");
          setPicked(undefined);
          setTouring((v) => !v);
        }}
      />

      {picked && (
        <AtlasSpotlight
          data={data}
          picked={picked}
          stop={stop}
          seen={seen}
          touring={touring}
          onOpen={() => open(picked.thing)}
          onClose={() => {
            setTouring(false);
            setPicked(undefined);
          }}
          onStep={step}
          onPick={(t) => show(t.key, { hint: true })}
          onStopTour={() => setTouring(false)}
        />
      )}

      <EraBar
        chapters={chapters}
        current={chapter}
        year={year}
        onChapter={(i) => {
          pickEra(i);
          if (lens !== "all") setEraOnly(true);
        }}
        onYear={(y) => {
          setYear(y);
          setPicked(undefined);
        }}
      />
    </section>
  );
}

// The map year a chapter opens on: its first dated moment, or today for the Signs of the Hour.
function eraYear(c: Chapter | undefined, now: number): number | undefined {
  if (!c || c.id === "beginning") return undefined;
  if (c.id === "hour") return now;
  if (c.id === "prophet") return 610;
  return c.from;
}

function chapterFocus(stops: Stop[], c: Chapter | undefined): Focus | undefined {
  return c ? stops[c.start]?.focus : undefined;
}

// Dated things in order; undated ones after, in their content order.
const order = (t: Thing) => (t.year === undefined ? 1e6 : t.year);
// Collections run in chapter order; things with no chapter (most places) come last.
const chapterOrder = (t: Thing) => (t.chapter < 0 ? 99 : t.chapter);
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ﷺ/g, "")
    .toLowerCase();

