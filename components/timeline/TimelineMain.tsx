"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAP, type Focus } from "@/lib/map";
import { activeStates, snapshotFor, villainsNear, type Stop, type TimelineData } from "@/lib/timeline-types";
import { Atlas, type Pin } from "./Atlas";
import { ExplorePanel, aliveAt } from "./ExplorePanel";
import { IntroPanel } from "./IntroPanel";
import { ProphetPanel, ProphetTree } from "./ProphetTree";
import { Progress } from "./Progress";
import { StoryPanel } from "./StoryPanel";
import { VillainLine } from "./VillainLine";
import { VillainPanel } from "./VillainPanel";
import { prefetchSnapshot } from "./useMapLayers";

export type View = "intro" | "story" | "explore" | "prophets" | "villains";

const WORLD: Focus = { x: MAP.w / 2, y: MAP.h / 2, zoom: 1 };
const INTRO_YEAR = 900;
const LAST_KEY = "timeline:last";
const PIN_GAP = 0.6;

// Reading time for autoplay: a calm pace plus time for a journey to draw itself.
function readMs(s: Stop) {
  if (s.type === "chapter") return 6000;
  const words = `${s.what} ${s.quote?.text ?? ""}`.split(/\s+/).length;
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
      // private mode or blocked storage: resume just won't be offered
    }
  },
};

export function TimelineMain({
  data,
  initialView,
  initialStop,
  initialVillain,
}: {
  data: TimelineData;
  initialView: View;
  initialStop?: string;
  initialVillain?: string;
}) {
  const { stops, chapters, states, overlays, prophets, villains, villainAges, endSigns, snapshots, now } = data;
  const indexOf = useCallback((id: string) => stops.findIndex((s) => s.id === id), [stops]);

  const [view, setView] = useState<View>(initialView);
  const [index, setIndex] = useState(() => Math.max(0, initialStop ? indexOf(initialStop) : 0));
  const [year, setYear] = useState(622);
  const [prophet, setProphet] = useState<string>();
  const [villain, setVillain] = useState(initialVillain);
  const [playing, setPlaying] = useState(false);
  const [resume, setResume] = useState<Stop>();

  const stop = stops[index];
  const chapter = chapters[stop.chapter];

  // The intro page also serves #explore=<year>, #prophets=<id> and #villains=<id> deep links.
  useEffect(() => {
    if (initialView === "intro") {
      const m = /^#(explore|prophets|villains)(?:=(.+))?$/.exec(location.hash);
      if (m?.[1] === "explore") {
        setView("explore");
        if (m[2] && !Number.isNaN(+m[2])) setYear(+m[2]);
      } else if (m?.[1] === "prophets") {
        setView("prophets");
        setProphet(m[2]);
      } else if (m?.[1] === "villains") {
        setView("villains");
        setVillain(m[2]);
      }
    }
    const last = storage.get(LAST_KEY);
    const at = last ? stops.find((s) => s.id === last) : undefined;
    if (at && at.id !== stops[0].id) setResume(at);
  }, [initialView, stops]);

  // Keep the address bar shareable without filling history: every moment has its own static page.
  const firstSync = useRef(true);
  useEffect(() => {
    const url =
      view === "story"
        ? `/timeline/${stop.id}`
        : view === "explore"
          ? `/timeline#explore=${year}`
          : view === "prophets"
            ? `/timeline#prophets${prophet ? `=${prophet}` : ""}`
            : view === "villains"
              ? `/timeline/villains${villain ? `/${villain}` : ""}`
              : "/timeline";
    const timer = setTimeout(() => {
      if (firstSync.current) {
        firstSync.current = false;
        if (location.pathname + location.hash === url) return;
      }
      if (location.pathname + location.hash !== url) history.replaceState(history.state, "", url);
      if (view === "story") document.title = `${stop.title} · ${stop.label.split(" · ")[0]} | Islamic History Timeline`;
      const v = view === "villains" ? villains.find((x) => x.id === villain) : undefined;
      if (v) document.title = `Who was ${v.name}? ${v.title} | Villains of Islamic History`;
    }, 250);
    return () => clearTimeout(timer);
  }, [view, stop, year, prophet, villain, villains]);

  useEffect(() => {
    if (view === "story") storage.set(LAST_KEY, stop.id);
  }, [view, stop.id]);

  const go = useCallback((i: number) => setIndex(Math.min(stops.length - 1, Math.max(0, i))), [stops.length]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const openStop = useCallback(
    (id: string) => {
      const i = indexOf(id);
      if (i < 0) return;
      setPlaying(false);
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

  const stepVillain = useCallback(
    (dir: 1 | -1) => {
      const i = villains.findIndex((v) => v.id === villain);
      const to = villains[i < 0 ? 0 : i + dir];
      if (to) setVillain(to.id);
    },
    [villains, villain],
  );

  const explore = useCallback((at?: number) => {
    setPlaying(false);
    if (at !== undefined) setYear(at);
    setView("explore");
  }, []);

  const stepYear = useCallback(
    (dir: 1 | -1) => {
      const dated = stops.filter((s) => s.type === "event" && s.year !== undefined && s.precision !== "unknown");
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
    if (view === "story") prefetchSnapshot(stops[index + 1]?.year === undefined ? undefined : snapshotFor(stops[index + 1].year!, snapshots));
  }, [view, index, stops, snapshots]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || t.closest("input, textarea, select")) return;
      if (view === "story") {
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
        else if (e.key === " " && !t.closest("button, a")) setPlaying((p) => !p);
        else return;
      } else if (view === "explore") {
        if (e.key === "ArrowRight") stepYear(1);
        else if (e.key === "ArrowLeft") stepYear(-1);
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

  // What the map shows for the current view.
  const mapYear = view === "story" ? stop.year : view === "explore" ? year : view === "intro" ? INTRO_YEAR : undefined;
  const ruling = useMemo(() => activeStates(states, mapYear), [states, mapYear]);

  const pins = useMemo<Pin[]>(() => {
    const out: Pin[] = [];
    for (const s of ruling) {
      if (s.muslim && s.capital.x !== undefined) out.push({ id: `cap-${s.id}`, x: s.capital.x, y: s.capital.y!, tone: "capital", label: s.capital.name });
    }
    if (view === "story" && stop.type === "event") {
      // Reversed so that, when two waypoints merge, the earlier one (the starting city) keeps its name.
      for (const r of stop.routes) for (const w of [...r.stops].reverse()) out.push({ id: `way-${w.name}-${w.x}`, x: w.x, y: w.y, tone: "way", label: w.name });
      if (stop.place?.x !== undefined) out.push({ id: stop.id, x: stop.place.x, y: stop.place.y!, tone: "event", label: stop.place.name, active: true });
    }
    if (view === "explore") {
      for (const p of aliveAt(prophets, year)) {
        if (p.place?.x !== undefined) out.push({ id: `p-${p.id}`, x: p.place.x, y: p.place.y!, tone: "prophet", label: p.name, onSelect: () => p.stop && openStop(p.stop) });
      }
      // Before moments, so an event at the same spot keeps its pin; the panel lists every villain of the time.
      for (const v of villainsNear(villains, year)) {
        if (v.place?.x !== undefined) out.push({ id: `v-${v.id}`, x: v.place.x, y: v.place.y!, tone: "villain", label: v.name, onSelect: () => openVillain(v.id) });
      }
      for (const s of stops) {
        if (s.type !== "event" || s.year === undefined || s.precision === "unknown" || Math.abs(s.year - year) > 30 || s.place?.x === undefined) continue;
        out.push({ id: s.id, x: s.place.x, y: s.place.y!, tone: "near", label: s.title, onSelect: () => openStop(s.id) });
      }
    }
    // Later pins draw on top. Pins closer than PIN_GAP map units (about 15 km) collapse into the most important one,
    // so Makkah and the Cave of Thawr do not print their names over each other.
    const kept: Pin[] = [];
    for (const p of out.reverse()) {
      if (!kept.some((k) => Math.hypot(k.x - p.x, k.y - p.y) < PIN_GAP)) kept.push(p);
    }
    return kept.reverse();
  }, [ruling, view, stop, prophets, villains, year, stops, openStop, openVillain]);

  const mapless = view === "prophets" || view === "villains";
  const focus = view === "story" ? stop.focus : WORLD;
  const focusKey = view === "story" ? stop.id : view;

  const rule = stop.type === "event" ? ruling.filter((s) => s.muslim) : [];
  const meanwhile = stop.type === "event" ? ruling.filter((s) => !s.muslim && s.lane === "world").slice(0, 3) : [];

  const tabs: [View, string][] = [
    ["story", "Story"],
    ["explore", "Explore"],
    ["prophets", "Prophets"],
    ["villains", "Villains"],
  ];

  return (
    <div className={`tl-app view-${view}`}>
      <div className="tl-stage">
        <Atlas
          year={mapYear}
          snapshots={snapshots}
          states={states}
          overlays={overlays}
          focus={focus}
          focusKey={focusKey}
          routes={view === "story" ? stop.routes : []}
          routeKey={stop.id}
          pins={mapless ? [] : pins}
          hidden={mapless}
        />
        {view === "prophets" && <ProphetTree prophets={prophets} selected={prophet} onSelect={setProphet} />}
        {view === "villains" && <VillainLine villains={villains} ages={villainAges} signs={endSigns} selected={villain} onSelect={setVillain} />}

        <nav className="tl-tabs" aria-label="Timeline views">
          <button type="button" className={view === "intro" ? "on" : undefined} onClick={() => setView("intro")} aria-label="Contents">
            ☰
          </button>
          {tabs.map(([v, label]) => (
            <button key={v} type="button" className={view === v ? "on" : undefined} aria-current={view === v ? "page" : undefined} onClick={() => (v === "explore" ? explore(stop.year ?? year) : setView(v))}>
              {label}
            </button>
          ))}
        </nav>

        {view === "story" && (
          <div className="tl-progress">
            <Progress chapters={chapters} index={index} onJump={(i) => go(i)} />
          </div>
        )}
      </div>

      <div className="tl-side">
        {view === "intro" && (
          <IntroPanel
            chapters={chapters}
            moments={stops.filter((s) => s.type === "event").length}
            resume={resume}
            onStart={(i) => {
              go(i);
              setView("story");
            }}
            onResume={() => resume && openStop(resume.id)}
            onExplore={() => explore()}
            onProphets={() => setView("prophets")}
            onVillains={() => setView("villains")}
          />
        )}
        {view === "story" && (
          <StoryPanel
            stop={stop}
            chapter={chapter}
            chapters={chapters.length}
            position={index - chapter.start + 1}
            rule={rule}
            meanwhile={meanwhile}
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
          />
        )}
        {view === "explore" && (
          <ExplorePanel
            year={year}
            stops={stops}
            chapters={chapters}
            states={states}
            prophets={prophets}
            now={now}
            onYear={setYear}
            onStep={stepYear}
            villains={villains}
            onVillain={openVillain}
            onOpen={openStop}
          />
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
      </div>
    </div>
  );
}
