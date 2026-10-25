"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildCard, entityOf, linkOf, nameOf, placeOf, yearOf } from "@/lib/timeline-graph";
import { activeStates, AXIS, SLUG, villainsNear, yearsAgo, yearToT, type Focus, type Named, type Ref, type Stop, type TimelineData } from "@/lib/timeline-types";
import { meanwhile, regionOf, yearPath } from "@/lib/timeline-world";
import { Atlas, type Light, type Pin, type Spot } from "./Atlas";
import { ChronoQuiz } from "./ChronoQuiz";
import { EntityPanel } from "./EntityPanel";
import { ExplorePanel, aliveAt } from "./ExplorePanel";
import { TimelineHome } from "./TimelineHome";
import { TimelineExplorer } from "./TimelineExplorer";
import { clampMapYear } from "@/lib/timeline-entry";
import { LanesView } from "./LanesView";
import { LibraryHint } from "./LibraryHint";
import { LibraryView, type Shelf } from "./LibraryView";
import { MoreDrawer } from "./MoreDrawer";
import { ProphetPanel, ProphetTree } from "./ProphetTree";
import { StoryPanel } from "./StoryPanel";
import { Ticker } from "./Ticker";
import { TimeBar } from "./TimeBar";
import { prefetchBorders } from "./useBorders";
import { VillainLine } from "./VillainLine";
import { VillainPanel } from "./VillainPanel";
import { YearMark } from "./YearMark";

export type View = "intro" | "story" | "explore" | "prophets" | "villains" | "library" | "empires" | "entity" | "quiz";

const WORLD: Focus = { lng: 38, lat: 24, zoom: 2 };
const LAST_KEY = "timeline:last";
const PIN_GAP = 0.15;
const TRAIL_MAX = 12;
const MAPLESS: View[] = ["prophets", "villains", "library", "empires"];
// While history plays, the camera drifts toward what just happened, but no more often than this.
const FOLLOW_ZOOM = 2.3;
const FOLLOW_GAP_MS = 2600;

// Reading time for autoplay: a calm pace plus time for a journey to draw itself.
function readMs(s: Stop) {
  if (s.type === "chapter") return 6000;
  const words = `${s.what} ${s.tie ?? ""} ${s.quote?.text ?? ""}`.split(/\s+/).length;
  return 4500 + words * 230 + (s.routes.length ? 2500 : 0);
}

const storage = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // private mode or blocked storage: the preference just isn't remembered
    }
  },
};

export function TimelineMain({
  data,
  initialView,
  initialStop,
  initialVillain,
  initialRef,
  initialYear,
}: {
  data: TimelineData;
  initialView: View;
  initialStop?: string;
  initialVillain?: string;
  initialRef?: Ref;
  initialYear?: number;
}) {
  const { stops, chapters, states, overlays, prophets, villains, villainAges, endSigns, now } = data;
  const indexOf = useCallback((id: string) => stops.findIndex((s) => s.id === id), [stops]);

  const [view, setView] = useState<View>(initialView);
  const [index, setIndex] = useState(() => Math.max(0, initialStop ? indexOf(initialStop) : 0));
  const [year, setYear] = useState(() => initialYear ?? (initialRef ? (yearOf(data, initialRef) ?? 622) : 622));
  const [prophet, setProphet] = useState<string>();
  const [villain, setVillain] = useState(initialVillain);
  const [playing, setPlaying] = useState(false);
  const [riverPlaying, setRiverPlaying] = useState(false);
  const [resume, setResume] = useState<Stop>();
  const [spot, setSpot] = useState<Spot>();
  const [drawer, setDrawer] = useState(false);
  const [follow, setFollow] = useState<{ focus: Focus; key: string }>();
  const followAt = useRef(0);
  const [shelf, setShelf] = useState<Shelf>(() => {
    const e = initialRef ? entityOf(data, initialRef) : undefined;
    if (initialRef?.t === "nation") return "nations";
    if (initialRef?.t === "polity") return "empires";
    if (initialRef?.t === "place") return "places";
    return e && "group" in e && typeof e.group === "string" ? (e.group as Shelf) : "quran";
  });
  const [trail, setTrail] = useState<Ref[]>(() => (initialRef ? [initialRef] : []));

  const stop = stops[index];
  const chapter = chapters[stop.chapter];
  const current = trail.at(-1);
  const card = useMemo(() => (current ? buildCard(data, current) : undefined), [data, current]);

  // The intro page also serves #explore=<year>, #prophets=<id>, #villains=<id>, #empires and #quiz deep links.
  useEffect(() => {
    if (initialView === "intro") {
      const m = /^#(explore|prophets|villains|empires|quiz)(?:=(.+))?$/.exec(location.hash);
      if (m?.[1] === "explore") {
        if (m[2] && Number.isFinite(+m[2])) setYear(clampMapYear(+m[2]));
      } else if (m?.[1] === "prophets") {
        setView("prophets");
        setProphet(m[2]);
      } else if (m?.[1] === "villains") {
        setView("villains");
        setVillain(m[2]);
      } else if (m?.[1] === "empires" || m?.[1] === "quiz") setView(m[1]);
    }
    const last = storage.get(LAST_KEY);
    const at = last ? stops.find((s) => s.id === last) : undefined;
    if (at && at.id !== stops[0].id) setResume(at);
  }, [initialView, stops]);

  // Keep the address bar shareable without filling history: moments, years, villains and library cards have pages.
  const firstSync = useRef(true);
  useEffect(() => {
    const cardUrl = current && SLUG[current.t] ? `/timeline/library/${SLUG[current.t]}/${current.id}` : undefined;
    const url =
      view === "story"
        ? `/timeline/${stop.id}`
        : view === "explore"
          ? yearPath(year, now)
          : view === "prophets"
            ? `/timeline#prophets${prophet ? `=${prophet}` : ""}`
            : view === "villains"
              ? `/timeline/villains${villain ? `/${villain}` : ""}`
              : view === "library" || view === "entity"
                ? (cardUrl ?? "/timeline/library")
                : view === "empires" || view === "quiz"
                  ? `/timeline#${view}`
                  : year === 622 ? "/timeline" : `/timeline#explore=${year}`;
    const timer = setTimeout(() => {
      if (firstSync.current) {
        firstSync.current = false;
        if (location.pathname + location.hash === url) return;
      }
      if (location.pathname + location.hash !== url) history.replaceState(history.state, "", url);
      if (view === "story") document.title = `${stop.title} · ${stop.label.split(" · ")[0]} | Islamic History Timeline`;
      const v = view === "villains" ? villains.find((x) => x.id === villain) : undefined;
      if (v) document.title = `Who was ${v.name}? ${v.title} | Villains of Islamic History`;
      if (card && (view === "library" || view === "entity" || view === "empires")) document.title = `${card.name}: ${card.kind} | Islamic History Timeline`;
    }, 250);
    return () => clearTimeout(timer);
  }, [view, stop, year, now, prophet, villain, villains, current, card]);

  useEffect(() => {
    if (view === "story") storage.set(LAST_KEY, stop.id);
  }, [view, stop.id]);

  // Where "back to the globe" returns from the views without a map.
  const lastMapView = useRef<View>(initialView);
  useEffect(() => {
    if (!MAPLESS.includes(view)) lastMapView.current = view;
  }, [view]);

  const go = useCallback((i: number) => setIndex(Math.min(stops.length - 1, Math.max(0, i))), [stops.length]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const openStop = useCallback(
    (id: string) => {
      const i = indexOf(id);
      if (i < 0) return;
      setPlaying(false);
      setRiverPlaying(false);
      setIndex(i);
      setView("story");
    },
    [indexOf],
  );

  const openVillain = useCallback((id: string) => {
    setPlaying(false);
    setVillain(id);
    setView("villains");
  }, []);

  // One door for every link in the app. Cards stack into a trail while the reader stays in a card view.
  const open = useCallback(
    (ref: Ref) => {
      setRiverPlaying(false);
      if (ref.t === "event") return openStop(ref.id);
      if (ref.t === "villain") return openVillain(ref.id);
      if (ref.t === "prophet") {
        setProphet(ref.id);
        setView("prophets");
        return;
      }
      setPlaying(false);
      const stay = view === "library" || view === "empires" || view === "entity";
      setTrail((t) => (stay ? [...t.filter((r) => !(r.t === ref.t && r.id === ref.id)), ref].slice(-TRAIL_MAX) : [ref]));
      const y = yearOf(data, ref);
      if (y !== undefined) setYear(y);
      if (!stay) setView("entity");
    },
    [view, data, openStop, openVillain],
  );

  const explore = useCallback((at?: number) => {
    setPlaying(false);
    if (at !== undefined) setYear(at);
    setView("explore");
  }, []);

  // The headline action: play all of history from the first moment.
  const watch = useCallback(() => {
    setPlaying(false);
    setDrawer(false);
    setSpot(undefined);
    setYear(AXIS.min);
    setView("explore");
    setRiverPlaying(true);
  }, []);

  // Stable, because the time bar's playback loop restarts whenever it changes.
  const viewRef = useRef(view);
  viewRef.current = view;
  const onBarYear = useCallback((y: number) => {
    setYear(y);
    if (viewRef.current !== "explore") {
      setPlaying(false);
      setView("explore");
    }
  }, []);

  const onPass = useCallback((s: Stop) => {
    const t = performance.now();
    if (s.place?.lng === undefined || t - followAt.current < FOLLOW_GAP_MS) return;
    followAt.current = t;
    setFollow({ focus: { lng: s.place.lng, lat: s.place.lat!, zoom: FOLLOW_ZOOM }, key: s.id });
  }, []);

  const stepVillain = useCallback(
    (dir: 1 | -1) => {
      const i = villains.findIndex((v) => v.id === villain);
      const to = villains[i < 0 ? 0 : i + dir];
      if (to) setVillain(to.id);
    },
    [villains, villain],
  );

  const stepYear = useCallback(
    (dir: 1 | -1) => {
      const dated = stops.filter((s) => s.type === "event" && s.year !== undefined);
      const target = dir > 0 ? dated.find((s) => s.year! > year) : [...dated].reverse().find((s) => s.year! < year);
      if (target) setYear(target.year!);
    },
    [stops, year],
  );

  useEffect(() => {
    if (!playing || view !== "story") return;
    if (index >= stops.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(next, readMs(stop));
    const onHide = () => document.hidden && setPlaying(false);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [playing, view, index, stop, next, stops.length]);

  useEffect(() => {
    if (view === "story") prefetchBorders(stops[index + 1]?.year);
  }, [view, index, stops]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || t.closest("input, textarea, select, dialog, [role=slider]")) return;
      if (view === "story") {
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
        else if (e.key === " " && !t.closest("button, a")) setPlaying((p) => !p);
        else return;
      } else if (view === "explore") {
        if (e.key === "ArrowRight") stepYear(1);
        else if (e.key === "ArrowLeft") stepYear(-1);
        else if (e.key === " " && !t.closest("button, a")) setRiverPlaying((p) => !p);
        else return;
      } else if (view === "villains") {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") stepVillain(1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") stepVillain(-1);
        else return;
      } else return;
      e.preventDefault();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [view, next, prev, stepYear, stepVillain]);

  // What the map shows for the current view. The opening globe shows no borders, only the lights of every moment.
  const timed = view === "story" || view === "explore" || view === "entity";
  const mapYear = view === "story" ? stop.year : view === "explore" || view === "entity" ? year : undefined;
  const ruling = useMemo(() => activeStates(states, mapYear), [states, mapYear]);
  const entityPlace = view === "entity" && current ? placeOf(data, current) : undefined;

  const lights = useMemo<Light[]>(
    () =>
      stops
        .filter((s) => s.type === "event" && s.year !== undefined && s.precision !== "unknown" && s.place?.lng !== undefined)
        .map((s) => ({ id: s.id, lng: s.place!.lng!, lat: s.place!.lat!, k: s.kind ?? "event", t: yearToT(s.year!), n: s.title, y: s.label.split(" · ")[0] })),
    [stops],
  );

  const pins = useMemo<Pin[]>(() => {
    const out: Pin[] = [];
    for (const s of ruling) {
      if (s.muslim && s.capital.lng !== undefined) out.push({ id: `cap-${s.id}`, lng: s.capital.lng, lat: s.capital.lat!, tone: "capital", label: s.capital.name });
    }
    if (view === "story" && stop.type === "event") {
      // Reversed so that, when two waypoints merge, the earlier one (the starting city) keeps its name.
      for (const r of stop.routes) for (const w of [...r.stops].reverse()) out.push({ id: `way-${w.name}-${w.lng}`, lng: w.lng, lat: w.lat, tone: "way", label: w.name });
      if (stop.place?.lng !== undefined) out.push({ id: stop.id, lng: stop.place.lng, lat: stop.place.lat!, tone: "event", label: stop.place.name, active: true });
    }
    if (view === "explore" && !riverPlaying) {
      for (const p of aliveAt(prophets, year)) {
        if (p.place?.lng !== undefined)
          out.push({ id: `p-${p.id}`, lng: p.place.lng, lat: p.place.lat!, tone: "prophet", label: p.name, arabic: p.arabic, onSelect: () => open({ t: "prophet", id: p.id }) });
      }
      for (const v of villainsNear(villains, year)) {
        if (v.place?.lng !== undefined) out.push({ id: `v-${v.id}`, lng: v.place.lng, lat: v.place.lat!, tone: "villain", label: v.name, onSelect: () => openVillain(v.id) });
      }
      if (spot) out.push({ id: "spot", lng: spot.lng, lat: spot.lat, tone: "place", active: true });
    }
    if (view === "entity" && current && card) {
      for (const g of card.groups) {
        for (const l of g.items) {
          if (l.ref.t !== "event") continue;
          const s = entityOf(data, l.ref) as Stop | undefined;
          if (s?.place?.lng !== undefined) out.push({ id: s.id, lng: s.place.lng, lat: s.place.lat!, tone: "near", label: s.title, onSelect: () => openStop(s.id) });
        }
      }
      if (entityPlace?.lng !== undefined) out.push({ id: `e-${current.id}`, lng: entityPlace.lng, lat: entityPlace.lat!, tone: "event", label: card.name, active: true });
    }
    // Later pins draw on top. Pins closer than PIN_GAP degrees (about 15 km) collapse into the most important one,
    // so Makkah and the Cave of Thawr do not print their names over each other.
    const kept: Pin[] = [];
    for (const p of out.reverse()) {
      if (!kept.some((k) => Math.hypot(k.lng - p.lng, k.lat - p.lat) < PIN_GAP)) kept.push(p);
    }
    return kept.reverse();
  }, [ruling, view, stop, prophets, villains, year, riverPlaying, spot, current, card, entityPlace, data, open, openStop, openVillain]);

  const mapless = MAPLESS.includes(view);
  const focus: Focus =
    view === "story"
      ? stop.focus
      : view === "entity" && entityPlace?.lng !== undefined
        ? { lng: entityPlace.lng, lat: entityPlace.lat!, zoom: current?.t === "polity" ? 3.4 : 5 }
        : view === "explore" && follow
          ? follow.focus
          : WORLD;
  const focusKey = view === "story" ? stop.id : view === "entity" ? `e:${current?.t}:${current?.id}` : view === "explore" ? `x:${follow?.key ?? ""}` : view;

  const rule = stop.type === "event" ? ruling.filter((s) => s.muslim) : [];
  // Other regions in the same decades, so every story card shows what else was happening on the planet.
  const world = useMemo(() => {
    if (stop.type !== "event" || stop.year === undefined || stop.precision === "unknown") return [];
    const here = stop.place?.lng !== undefined ? regionOf(stop.place.lng, stop.place.lat!).id : undefined;
    return meanwhile(data, stop.year, here).filter((m) => m.ref.id !== stop.id);
  }, [data, stop]);
  const linked = useMemo<Named[]>(
    () =>
      stop.links
        .filter((r) => r.t !== "place" && !(stop.who ?? []).some((w) => w.ref?.t === r.t && w.ref.id === r.id))
        .map((ref) => ({ name: nameOf(data, ref), ref })),
    [stop, data],
  );
  const trailLinks = useMemo(() => trail.map((r) => linkOf(data, r)), [trail, data]);

  const showCard = (view === "library" || view === "empires" || view === "entity") && card;
  const markYear = view === "story" ? stop.year : timed ? year : undefined;
  const counts = { people: data.people.length + prophets.length, villains: villains.length, empires: states.length };

  if (view === "intro") return (
    <TimelineHome
      chapters={chapters}
      moments={stops.filter((s) => s.type === "event").length}
      events={stops.filter((s) => s.type === "event")}
      resume={resume}
      map={<TimelineExplorer data={data} year={year} onYear={setYear} />}
      onView={(nextView) => { setTrail([]); setView(nextView); window.scrollTo(0, 0); }}
    />
  );

  return (
    <div className={`tl-app view-${view}${riverPlaying && view === "explore" ? " is-playing" : ""}`}>
      <div className="tl-stage">
        <Atlas
          year={mapYear}
          states={states}
          overlays={overlays}
          focus={focus}
          focusKey={focusKey}
          routes={view === "story" ? stop.routes : []}
          routeKey={stop.id}
          pins={mapless ? [] : pins}
          hidden={mapless}
          mode="rulers"
          onSpot={view === "explore" ? setSpot : undefined}
          spot={view === "explore" ? spot : undefined}
          lights={lights}
          at={timed && markYear !== undefined ? yearToT(markYear) : undefined}
          onLight={mapless ? undefined : openStop}
          spin={view === "quiz"}
        />
        {view === "prophets" && <ProphetTree prophets={prophets} selected={prophet} onSelect={setProphet} />}
        {view === "villains" && <VillainLine villains={villains} ages={villainAges} signs={endSigns} selected={villain} onSelect={setVillain} />}
        {view === "library" && (
          <LibraryView
            data={data}
            shelf={shelf}
            selected={current}
            onShelf={setShelf}
            onSelect={(ref) => {
              setTrail([ref]);
              const y = yearOf(data, ref);
              if (y !== undefined) setYear(y);
            }}
          />
        )}
        {view === "empires" && <LanesView data={data} selected={current} onSelect={(ref) => (ref.t === "person" || ref.t === "polity" ? setTrail([ref]) : open(ref))} />}

        <nav className="tl-top" aria-label="Timeline">
          <button type="button" className="tl-more" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span>More</span>
          </button>
          {(
            <button
              type="button"
              className="tl-back"
              aria-label={mapless ? "Back to the globe" : "Back to the start"}
              onClick={() => {
                setRiverPlaying(false);
                setView(mapless ? (lastMapView.current === view ? "intro" : lastMapView.current) : "intro");
              }}
            >
              ← <span>{mapless ? "Back to the globe" : "Start"}</span>
            </button>
          )}
        </nav>

        {markYear !== undefined && (
          <YearMark year={markYear} ah={view === "story" ? stop.ah : undefined} approx={view === "story" && stop.precision !== "exact"} caption={yearsAgo(markYear, now, view === "story" ? stop.precision : "exact")} />
        )}

        {view === "explore" && <Ticker year={year} playing={riverPlaying} stops={stops} states={states} onOpen={open} onPass={onPass} />}

        {timed && (
          <div className="tl-bar">
            <TimeBar
              year={markYear ?? year}
              chapters={chapters}
              states={states}
              stops={stops}
              current={view === "story" ? stop.id : undefined}
              playing={riverPlaying}
              onYear={onBarYear}
              onPlay={view === "explore" ? setRiverPlaying : undefined}
            />
          </div>
        )}
      </div>

      <div className="tl-side">
        {view === "story" && (
          <StoryPanel
            stop={stop}
            chapter={chapter}
            chapters={chapters.length}
            position={index - chapter.start + 1}
            rule={rule}
            world={world}
            now={now}
            playing={playing}
            readMs={readMs(stop)}
            atStart={index === 0}
            atEnd={index === stops.length - 1}
            onPrev={prev}
            onNext={next}
            onTogglePlay={() => setPlaying((p) => !p)}
            onExplore={() => explore(stop.year)}
            villains={villains.filter((v) => v.stop === stop.id)}
            onVillain={openVillain}
            linked={linked}
            onOpen={open}
          />
        )}
        {view === "explore" && !riverPlaying && (
          <ExplorePanel year={year} data={data} spot={spot} onStep={stepYear} onOpen={open} onClearSpot={() => setSpot(undefined)} />
        )}
        {view === "prophets" && <ProphetPanel prophets={prophets} selected={prophet} onSelect={setProphet} onOpenStop={openStop} />}
        {view === "villains" && (
          <VillainPanel
            villains={villains}
            selected={villain}
            onSelect={setVillain}
            onProphet={(id) => {
              setProphet(id);
              setView("prophets");
            }}
            onOpenStop={openStop}
          />
        )}
        {showCard && (
          <EntityPanel
            card={card}
            trail={trailLinks}
            onOpen={open}
            onTrail={(i) => setTrail((t) => t.slice(0, i + 1))}
            onYear={(y) => explore(y)}
            onMap={view === "entity" ? undefined : () => setView("entity")}
            onClose={view === "entity" ? undefined : () => setTrail([])}
          />
        )}
        {(view === "library" || view === "empires") && !card && <LibraryHint view={view} />}
        {view === "quiz" && <ChronoQuiz stops={stops} onOpen={openStop} />}
      </div>

      <MoreDrawer
        open={drawer}
        chapters={chapters}
        counts={counts}
        onClose={() => setDrawer(false)}
        onWatch={watch}
        onView={(v) => {
          setDrawer(false);
          setRiverPlaying(false);
          if (v === "explore") explore(stop.year ?? year);
          else setView(v);
        }}
        onChapter={(i) => {
          setDrawer(false);
          setRiverPlaying(false);
          go(i);
          setView("story");
        }}
      />
    </div>
  );
}
