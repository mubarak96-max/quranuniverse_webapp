"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap, Marker, StyleSpecification } from "maplibre-gl";
import { FAITH_LABEL, spanText, type Faith, type Focus, type Kind, type Overlay, type Route, type State } from "@/lib/timeline-types";
import { baseStyle, fillColor, fillOpacity, lightFilter, lightPaint, readPalette, themePaint, yearFilter, type MapMode, type Palette } from "./atlas-style";
import type { Feature } from "./topo";
import { useBorders, useLand } from "./useBorders";

export type Pin = {
  id: string;
  lng: number;
  lat: number;
  tone: "event" | "capital" | "prophet" | "villain" | "near" | "way" | "person" | "place";
  label?: string;
  arabic?: string;
  active?: boolean;
  onSelect?: () => void;
};

// One glowing point per dated moment. `t` is its position on the timeline axis (yearToT), which drives the glow.
export type Light = { id: string; lng: number; lat: number; k: Kind; t: number; n: string; y: string };

export type Spot = { lng: number; lat: number; name?: string; state?: string };

type Props = {
  year?: number;
  states: State[];
  overlays: Overlay[];
  focus: Focus;
  focusKey: string;
  routes: Route[];
  routeKey: string;
  pins: Pin[];
  hidden?: boolean;
  mode: MapMode;
  onSpot?: (s: Spot) => void;
  spot?: Spot;
  lights: Light[];
  at?: number;
  onLight?: (id: string) => void;
  onLights?: (ids: string[]) => void;
  spin?: boolean;
};

type Lib = typeof import("maplibre-gl");
let lib: Promise<Lib> | undefined;
// The worker is copied to /vendor by tools/copy-maplibre-worker.mjs, because bundlers move the main file away from it.
const loadLib = () =>
  (lib ??= import("maplibre-gl").then((m) => {
    m.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
    return m;
  }));

const GLOBE_KEY = "timeline:globe";
const LABEL_LIMIT = 46;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const collection = (features: unknown[]) => ({ type: "FeatureCollection" as const, features }) as GeoJSON.FeatureCollection;

function overlayFeatures(overlays: Overlay[]) {
  return overlays.map((o) => ({
    type: "Feature",
    properties: { n: o.name, f: o.from, t: o.to, s: o.state, fa: "islam", h: 0, area: 400, lx: o.label[0], ly: o.label[1] },
    geometry: { type: "Polygon", coordinates: [[...o.ring, o.ring[0]]] },
  }));
}

const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const ROUTE_MS = 1800;
const ROUTE_DELAY = 600;

// The first `share` of a path by length, ending on an interpolated point.
function partial(coords: [number, number][], share: number): [number, number][] {
  if (share >= 1 || coords.length < 2) return coords;
  const seg = coords.slice(1).map((c, i) => Math.hypot(c[0] - coords[i][0], c[1] - coords[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * share;
  const out: [number, number][] = [coords[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(coords[i + 1]);
      left -= seg[i];
      continue;
    }
    const f = seg[i] ? left / seg[i] : 0;
    out.push([coords[i][0] + (coords[i + 1][0] - coords[i][0]) * f, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * f]);
    break;
  }
  return out.length < 2 ? [coords[0], coords[0]] : out;
}

function pinElement(p: Pin) {
  const el = document.createElement(p.onSelect ? "button" : "div");
  el.className = `at-pin at-${p.tone}${p.active ? " on" : ""}`;
  if (p.onSelect) {
    (el as HTMLButtonElement).type = "button";
    el.setAttribute("aria-label", p.label ?? "");
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      p.onSelect?.();
    });
  }
  const dot = el.appendChild(document.createElement("i"));
  if (p.arabic) {
    el.classList.add("at-medal");
    const b = dot.appendChild(document.createElement("b"));
    b.lang = "ar";
    b.dir = "rtl";
    b.textContent = p.arabic;
  }
  if (p.label) {
    const s = document.createElement("span");
    s.textContent = p.label;
    el.appendChild(s);
  }
  return el;
}

const SPIN_DEG_PER_S = 2.4;
const SPIN_RESUME_MS = 4000;

export function Atlas({ year, states, overlays, focus, focusKey, routes, routeKey, pins, hidden, mode, onSpot, spot, lights, at, onLight, onLights, spin }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const probeA = useRef<HTMLSpanElement>(null);
  const probeB = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const libRef = useRef<Lib | null>(null);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [palette, setPalette] = useState<Palette>();
  const [globe, setGlobe] = useState(true);
  const [viewTick, setViewTick] = useState(0);
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const spotRef = useRef(onSpot);
  spotRef.current = onSpot;
  const lightRef = useRef(onLight);
  lightRef.current = onLight;
  const lightGroupRef = useRef(onLights);
  lightGroupRef.current = onLights;
  const statesRef = useRef(states);
  statesRef.current = states;
  const yearRef = useRef(year);
  yearRef.current = year;

  const land = useLand();
  const borders = useBorders(year);
  const byId = useMemo(() => new Map(states.map((s) => [s.id, s])), [states]);

  // Rows gain a stable tint index so neighbouring non-Muslim polities differ slightly in "Who ruled" mode.
  const rows = useMemo<Feature[]>(() => {
    for (const f of borders.rows) if (f.properties.h === undefined) f.properties.h = hash(String(f.properties.n)) % 4;
    return borders.rows;
  }, [borders.rows]);

  const insets = useCallback(() => {
    const a = probeA.current;
    const b = probeB.current;
    return { left: a?.offsetWidth ?? 0, top: a?.offsetHeight ?? 0, right: b?.offsetWidth ?? 0, bottom: b?.offsetHeight ?? 0 };
  }, []);

  const fly = useCallback(
    (f: Focus, instant = false) => {
      const map = mapRef.current;
      if (!map) return;
      map.setPadding(insets());
      const small = (box.current?.clientWidth ?? 1000) < 640;
      const zoom = Math.max(0.8, f.zoom - (small ? 0.8 : 0));
      const duration = instant || prefersReduced() ? 0 : undefined;
      if (f.bounds) {
        const [w, s, e, n] = f.bounds;
        map.fitBounds(
          [
            [w, s],
            [e, n],
          ],
          { padding: 64, maxZoom: zoom, duration: duration ?? 2200, essential: true },
        );
      } else if (duration === 0) map.jumpTo({ center: [f.lng, f.lat], zoom });
      else map.flyTo({ center: [f.lng, f.lat], zoom, curve: 1.42, speed: 0.9, essential: true });
    },
    [insets],
  );

  // Create the map once. The library is loaded on demand so it never runs on the server.
  useEffect(() => {
    let live = true;
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onTheme = () => box.current && setPalette(readPalette(box.current));
    try {
      if (localStorage.getItem(GLOBE_KEY) === "0") setGlobe(false);
    } catch {
      // storage blocked: keep the globe
    }
    loadLib().then((m) => {
      if (!live || !canvasBox.current) return;
      libRef.current = m;
      const p = readPalette(box.current!);
      setPalette(p);
      let flat = false;
      try {
        flat = localStorage.getItem(GLOBE_KEY) === "0";
      } catch {
        // storage blocked
      }
      const f = focusRef.current;
      const map = new m.Map({
        container: canvasBox.current,
        style: baseStyle(p, !flat) as StyleSpecification,
        center: [f.lng, f.lat],
        zoom: f.zoom,
        minZoom: 0.6,
        maxZoom: 9,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        cooperativeGestures: true,
        renderWorldCopies: false,
        fadeDuration: 0,
      });
      map.touchZoomRotate.disableRotation();
      mapRef.current = map;
      map.on("load", () => {
        if (!live) return;
        fly(focusRef.current, true);
        setReady(true);
        box.current?.classList.add("ready");
      });
      map.on("moveend", () => setViewTick((t) => t + 1));
      // A light wins over the land under it; a tap within a few pixels of one counts, as the dots are small.
      map.on("click", (e) => {
        const { x, y } = e.point;
        const near = map.queryRenderedFeatures(
          [
            [x - 8, y - 8],
            [x + 8, y + 8],
          ],
          { layers: ["lights-core"] },
        );
        if (near[0] && lightGroupRef.current) return lightGroupRef.current([...new Set(near.map((feature) => String(feature.properties.id)))]);
        if (near[0] && lightRef.current) return lightRef.current(String(near[0].properties.id));
        const hit = map
          .queryRenderedFeatures(e.point, { layers: ["borders-fill"] })
          .sort((a, b) => Number(a.properties.area) - Number(b.properties.area))[0];
        spotRef.current?.({ lng: e.lngLat.lng, lat: e.lngLat.lat, name: hit?.properties.n as string | undefined, state: (hit?.properties.s as string) || undefined });
      });
      map.on("mousemove", "lights-core", (e) => {
        const el = tip.current;
        const f = e.features?.[0];
        if (!el || !f || !lightRef.current) return;
        el.textContent = `${f.properties.y} · ${f.properties.n}`;
        el.style.transform = `translate(${e.point.x + 14}px, ${e.point.y + 14}px)`;
        el.hidden = false;
        el.dataset.light = "1";
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "lights-core", () => {
        if (tip.current) {
          tip.current.hidden = true;
          delete tip.current.dataset.light;
        }
        map.getCanvas().style.cursor = "";
      });
      map.on("mousemove", "borders-fill", (e) => {
        const el = tip.current;
        const hit = [...(e.features ?? [])].sort((a, b) => Number(a.properties.area) - Number(b.properties.area))[0];
        if (!el || !hit || el.dataset.light) return;
        const s = statesRef.current.find((x) => x.id === hit.properties.s);
        const name = s?.name ?? String(hit.properties.n);
        const faith = hit.properties.fa ? FAITH_LABEL[hit.properties.fa as Faith] : undefined;
        el.textContent = [name, s ? spanText(s.from, s.to) : undefined, faith].filter(Boolean).join(" · ");
        el.style.transform = `translate(${e.point.x + 14}px, ${e.point.y + 14}px)`;
        el.hidden = false;
        map.getCanvas().style.cursor = spotRef.current ? "pointer" : "";
      });
      map.on("mouseleave", "borders-fill", () => {
        if (tip.current) tip.current.hidden = true;
        map.getCanvas().style.cursor = "";
      });
    }).catch(() => { if (live) setLoadFailed(true); });
    const observer = new MutationObserver(onTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    media.addEventListener("change", onTheme);
    return () => {
      live = false;
      observer.disconnect();
      media.removeEventListener("change", onTheme);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [fly]);

  // Theme changes repaint the base layers in place, keeping the loaded sources.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !palette) return;
    for (const [layer, prop, value] of themePaint(palette)) map.setPaintProperty(layer, prop, value);
  }, [ready, palette]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !land) return;
    (map.getSource("land") as GeoJSONSource).setData(collection(land.land));
    (map.getSource("rivers") as GeoJSONSource).setData(collection(land.rivers));
  }, [ready, land]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("borders") as GeoJSONSource).setData(collection([...rows, ...overlayFeatures(overlays)]));
  }, [ready, rows, overlays]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !palette) return;
    const filter = yearFilter(year);
    map.setFilter("borders-fill", filter);
    map.setFilter("borders-line", filter);
    map.setFilter("borders-hi", spot?.name ? yearFilter(year, spot.name) : yearFilter(undefined));
    map.setPaintProperty("borders-fill", "fill-color", fillColor(palette, mode, states));
    map.setPaintProperty("borders-fill", "fill-opacity", fillOpacity(mode, states));
  }, [ready, year, mode, states, palette, spot]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("lights") as GeoJSONSource).setData(
      collection(lights.map(({ lng, lat, ...properties }) => ({ type: "Feature", properties, geometry: { type: "Point", coordinates: [lng, lat] } }))),
    );
  }, [ready, lights]);

  // Runs on every frame of playback, so it only swaps the four light expressions and the visibility window.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const p = lightPaint(at);
    map.setPaintProperty("lights-core", "circle-opacity", p.core);
    map.setPaintProperty("lights-core", "circle-stroke-opacity", p.core);
    map.setPaintProperty("lights-core", "circle-radius", p.coreR);
    map.setPaintProperty("lights-halo", "circle-opacity", p.halo);
    map.setPaintProperty("lights-halo", "circle-radius", p.haloR);
    const filter = lightFilter(at);
    map.setFilter("lights-core", filter);
    map.setFilter("lights-halo", filter);
  }, [ready, at]);

  // The globe turns slowly on the opening screen and pauses while someone handles it.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !spin || prefersReduced()) return;
    let raf = 0;
    let last = performance.now();
    let heldUntil = 0;
    const hold = () => (heldUntil = performance.now() + SPIN_RESUME_MS);
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (now > heldUntil && !map.isMoving()) {
        const c = map.getCenter();
        map.setCenter([c.lng + SPIN_DEG_PER_S * Math.min(dt, 0.1), c.lat]);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const canvas = map.getCanvasContainer();
    canvas.addEventListener("pointerdown", hold);
    canvas.addEventListener("wheel", hold, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", hold);
      canvas.removeEventListener("wheel", hold);
    };
  }, [ready, spin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setProjection({ type: globe ? "globe" : "mercator" });
    try {
      localStorage.setItem(GLOBE_KEY, globe ? "1" : "0");
    } catch {
      // storage blocked: the choice lasts for this visit
    }
  }, [ready, globe]);

  useEffect(() => {
    if (ready) fly(focusRef.current);
  }, [focusKey, ready, fly]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || hidden) return;
    map.resize();
  }, [hidden, ready]);

  useEffect(() => {
    const el = box.current;
    const map = mapRef.current;
    if (!el || !map || !ready) return;
    const ro = new ResizeObserver(() => {
      map.resize();
      map.setPadding(insets());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready, insets]);

  // Journeys draw themselves: each frame shows the path up to a growing share of its length. (An animated
  // line-gradient was tried first; on some GPUs it blanks the whole globe.)
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const source = map.getSource("routes") as GeoJSONSource;
    const draw = (share: number) =>
      source.setData(collection(routes.map((r) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: partial(r.coords, share) } }))));
    if (!routes.length || prefersReduced()) {
      draw(1);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0 - ROUTE_DELAY) / ROUTE_MS));
      draw(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ready, routeKey, routes]);

  // Pins are DOM markers, so they stay crisp, take focus and accept taps.
  const pinMarkers = useRef(new Map<string, Marker>());
  useEffect(() => {
    const map = mapRef.current;
    const m = libRef.current;
    if (!ready || !map || !m) return;
    const keep = new Set<string>();
    for (const p of pins) {
      const k = `${p.id}|${p.tone}|${p.active ? 1 : 0}|${p.label ?? ""}`;
      keep.add(k);
      if (pinMarkers.current.has(k)) continue;
      const marker = new m.Marker({ element: pinElement(p), anchor: "center" }).setLngLat([p.lng, p.lat]).addTo(map);
      pinMarkers.current.set(k, marker);
    }
    for (const [k, marker] of pinMarkers.current) {
      if (!keep.has(k)) {
        marker.remove();
        pinMarkers.current.delete(k);
      }
    }
  }, [ready, pins]);

  // Polity labels: the largest polities of the year, plus every state the timeline knows, sized to the zoom.
  const labelMarkers = useRef(new Map<string, Marker>());
  useEffect(() => {
    const map = mapRef.current;
    const m = libRef.current;
    if (!ready || !map || !m) return;
    const want = new Map<string, { lng: number; lat: number; area: number; known: boolean }>();
    if (year !== undefined && !hidden) {
      const z = map.getZoom();
      const min = 70 * Math.pow(4, 2 - z);
      for (const f of [...rows, ...overlayFeatures(overlays)]) {
        const p = f.properties as Record<string, number | string>;
        if (+p.f > year || +p.t < year) continue;
        const known = !!p.s && byId.has(String(p.s));
        const name = known ? byId.get(String(p.s))!.name : String(p.n);
        const area = +p.area;
        if (area < (known ? min / 6 : min)) continue;
        const cur = want.get(name);
        if (!cur || cur.area < area) want.set(name, { lng: +p.lx, lat: +p.ly, area, known });
      }
    }
    // Greedy placement in screen space: the most important label claims its box first, and any label that would overlap
    // a placed one is skipped until the camera moves.
    const boxes: [number, number, number, number][] = [];
    const { width, height } = map.getCanvas().getBoundingClientRect();
    // Labels under the floating panels would be cut off, so the visible area excludes them.
    const pad = map.getPadding();
    const x0 = (pad.left ?? 0) + 4;
    const y0 = pad.top ?? 0;
    const x1 = width - (pad.right ?? 0) - 4;
    const y1 = height - (pad.bottom ?? 0);
    const top = [...want]
      .sort((a, b) => Number(b[1].known) - Number(a[1].known) || b[1].area - a[1].area)
      .filter(([name, l]) => {
        const pt = map.project([l.lng, l.lat]);
        const w = name.length * (l.known ? 8.4 : 7.4) + 10;
        const box: [number, number, number, number] = [pt.x - w / 2, pt.y - 10, pt.x + w / 2, pt.y + 10];
        if (box[0] < x0 || box[2] > x1 || box[1] < y0 || box[3] > y1) return false;
        if (boxes.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return false;
        boxes.push(box);
        return true;
      })
      .slice(0, LABEL_LIMIT);
    const keep = new Set(top.map(([n]) => n));
    for (const [name, l] of top) {
      const cur = labelMarkers.current.get(name);
      if (cur) {
        cur.setLngLat([l.lng, l.lat]);
        continue;
      }
      const el = document.createElement("span");
      el.className = `at-label${l.known ? " major" : ""}`;
      el.textContent = name;
      labelMarkers.current.set(name, new m.Marker({ element: el, anchor: "center" }).setLngLat([l.lng, l.lat]).addTo(map));
    }
    for (const [name, marker] of labelMarkers.current) {
      if (!keep.has(name)) {
        marker.remove();
        labelMarkers.current.delete(name);
      }
    }
  }, [ready, rows, overlays, year, byId, viewTick, hidden]);

  const legend = useMemo(() => {
    if (mode !== "faith" || year === undefined) return [];
    const seen = new Set<string>();
    for (const f of rows) {
      const p = f.properties as Record<string, number | string>;
      if (+p.f <= year && +p.t >= year && p.fa) seen.add(String(p.fa));
    }
    return [...seen] as Faith[];
  }, [mode, rows, year]);

  return (
    <div ref={box} className={`atlas${hidden ? " is-hidden" : ""}`} role="region" aria-label="Map">
      <span ref={probeA} className="at-probe at-probe-lt" aria-hidden="true" />
      <span ref={probeB} className="at-probe at-probe-rb" aria-hidden="true" />
      <div ref={canvasBox} className="at-canvas" />
      {!ready && <p className="at-loading" role="status">{loadFailed ? "The map couldn’t load. Reload the page to try again." : "Loading the map…"}</p>}
      <div ref={tip} className="at-tip" hidden aria-hidden="true" />

      <div className="at-controls">
        <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={() => fly(focusRef.current)} aria-label="Reset map view">
          ⌖
        </button>
        <button type="button" onClick={() => setGlobe((g) => !g)} aria-label={globe ? "Flat map" : "Globe"} aria-pressed={globe} className="at-globe">
          {globe ? "◐" : "▭"}
        </button>
      </div>

      {legend.length > 0 && palette && (
        <ul className="at-legend" aria-label="Faith of the rulers">
          {legend.map((f) => (
            <li key={f}>
              <i style={{ background: palette.faith[f] }} />
              {FAITH_LABEL[f]}
            </li>
          ))}
        </ul>
      )}

      <p className="at-note">
        {year === undefined ? "Before recorded borders · " : "Borders approximate · "}
        {year !== undefined && (
          <>
            <a href="https://github.com/Seshat-Global-History-Databank/cliopatria" target="_blank" rel="noreferrer">
              Cliopatria, CC BY 4.0
            </a>
            {" · "}
          </>
        )}
        Relief: NASA Blue Marble
      </p>
    </div>
  );
}
