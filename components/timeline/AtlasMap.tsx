"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap, Marker, StyleSpecification } from "maplibre-gl";
import { spanText, type Focus, type Overlay, type Route, type State } from "@/lib/timeline-types";
import type { Lens } from "@/lib/timeline-things";
import { baseStyle, fillColor, fillOpacity, lensFilter, TONE, yearFilter } from "./atlas-style";
import type { Feature } from "./topo";
import { useBorders, useLand } from "./useBorders";

// One point per thing on the map. `e` marks things in the chapter on screen.
export type MapPoint = { key: string; lng: number; lat: number; tone: keyof typeof TONE; lens: Lens; name: string; when?: string; e: boolean };
export type MapFocusMark = { key: string; lng: number; lat: number; name: string; tone: keyof typeof TONE; hint?: string };
export type Padding = { top: number; right: number; bottom: number; left: number };

type Props = {
  year?: number;
  states: State[];
  overlays: Overlay[];
  points: MapPoint[];
  lens: Lens | "all";
  mark?: MapFocusMark;
  focus: Focus;
  focusKey: string;
  padding: Padding;
  routes: Route[];
  onPick: (keys: string[]) => void;
  onMarkOpen?: () => void;
  onEmpty?: (name?: string, state?: string) => void;
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
const LABEL_LIMIT = 40;
const ROUTE_MS = 1800;
const ROUTE_DELAY = 500;
const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const collection = (features: unknown[]) => ({ type: "FeatureCollection" as const, features }) as GeoJSON.FeatureCollection;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function overlayFeatures(overlays: Overlay[]) {
  return overlays.map((o) => ({
    type: "Feature",
    properties: { n: o.name, f: o.from, t: o.to, s: o.state, fa: "islam", h: 0, area: 400, lx: o.label[0], ly: o.label[1] },
    geometry: { type: "Polygon", coordinates: [[...o.ring, o.ring[0]]] },
  }));
}

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

export function AtlasMap({ year, states, overlays, points, lens, mark, focus, focusKey, padding, routes, onPick, onMarkOpen, onEmpty }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const libRef = useRef<Lib | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [globe, setGlobe] = useState(true);
  const [viewTick, setViewTick] = useState(0);
  const focusRef = useRef(focus);
  focusRef.current = focus;
  const paddingRef = useRef(padding);
  paddingRef.current = padding;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const emptyRef = useRef(onEmpty);
  emptyRef.current = onEmpty;
  const markOpenRef = useRef(onMarkOpen);
  markOpenRef.current = onMarkOpen;
  const statesRef = useRef(states);
  statesRef.current = states;

  const land = useLand();
  const borders = useBorders(year);
  const byId = useMemo(() => new Map(states.map((s) => [s.id, s])), [states]);
  const rows = useMemo<Feature[]>(() => {
    for (const f of borders.rows) if (f.properties.h === undefined) f.properties.h = hash(String(f.properties.n)) % 4;
    return borders.rows;
  }, [borders.rows]);

  const fly = useCallback((f: Focus, instant = false) => {
    const map = mapRef.current;
    if (!map) return;
    map.setPadding(paddingRef.current);
    const small = (box.current?.clientWidth ?? 1000) < 700;
    const zoom = Math.max(0.9, f.zoom - (small ? 0.7 : 0));
    const duration = instant || prefersReduced() ? 0 : undefined;
    if (f.bounds) {
      const [w, s, e, n] = f.bounds;
      map.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        { padding: 60, maxZoom: zoom, duration: duration ?? 2200, essential: true },
      );
    } else if (duration === 0) map.jumpTo({ center: [f.lng, f.lat], zoom });
    else map.flyTo({ center: [f.lng, f.lat], zoom, curve: 1.4, speed: 0.95, essential: true });
  }, []);

  useEffect(() => {
    let live = true;
    try {
      if (localStorage.getItem(GLOBE_KEY) === "0") setGlobe(false);
    } catch {
      // storage blocked: keep the globe
    }
    loadLib()
      .then((m) => {
        if (!live || !canvasBox.current) return;
        libRef.current = m;
        let flat = false;
        try {
          flat = localStorage.getItem(GLOBE_KEY) === "0";
        } catch {
          // storage blocked
        }
        const f = focusRef.current;
        const map = new m.Map({
          container: canvasBox.current,
          style: baseStyle(!flat) as StyleSpecification,
          center: [f.lng, f.lat],
          zoom: f.zoom,
          minZoom: 0.8,
          maxZoom: 9,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          renderWorldCopies: false,
          fadeDuration: 0,
        });
        map.touchZoomRotate.disableRotation();
        mapRef.current = map;
        map.on("load", () => {
          if (!live) return;
          fly(focusRef.current, true);
          setReady(true);
        });
        map.on("moveend", () => setViewTick((t) => t + 1));
        // Points win over the land under them, and a tap within a few pixels counts, because the dots are small.
        map.on("click", (e) => {
          const { x, y } = e.point;
          const near = map.queryRenderedFeatures(
            [
              [x - 10, y - 10],
              [x + 10, y + 10],
            ],
            { layers: ["things-core"] },
          );
          if (near.length) {
            const ranked = near
              .map((f) => ({ k: String(f.properties.k), e: Number(f.properties.e), d: Math.hypot((f.geometry as GeoJSON.Point).coordinates[0] - e.lngLat.lng, (f.geometry as GeoJSON.Point).coordinates[1] - e.lngLat.lat) }))
              .sort((a, b) => b.e - a.e || a.d - b.d);
            pickRef.current([...new Set(ranked.map((r) => r.k))]);
            return;
          }
          const hit = map
            .queryRenderedFeatures(e.point, { layers: ["borders-fill"] })
            .sort((a, b) => Number(a.properties.area) - Number(b.properties.area))[0];
          emptyRef.current?.(hit?.properties.n as string | undefined, (hit?.properties.s as string) || undefined);
        });
        const showTip = (text: string, px: { x: number; y: number }) => {
          const el = tip.current;
          if (!el) return;
          el.textContent = text;
          el.style.transform = `translate(${px.x + 14}px, ${px.y + 14}px)`;
          el.hidden = false;
        };
        map.on("mousemove", "things-core", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          if (tip.current) tip.current.dataset.point = "1";
          showTip([f.properties.n, f.properties.w].filter(Boolean).join(" · "), e.point);
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "things-core", () => {
          if (tip.current) {
            tip.current.hidden = true;
            delete tip.current.dataset.point;
          }
          map.getCanvas().style.cursor = "";
        });
        map.on("mousemove", "borders-fill", (e) => {
          if (tip.current?.dataset.point) return;
          const hit = [...(e.features ?? [])].sort((a, b) => Number(a.properties.area) - Number(b.properties.area))[0];
          if (!hit) return;
          const s = statesRef.current.find((x) => x.id === hit.properties.s);
          showTip([s?.name ?? String(hit.properties.n), s ? spanText(s.from, s.to) : undefined].filter(Boolean).join(" · "), e.point);
        });
        map.on("mouseleave", "borders-fill", () => {
          if (tip.current && !tip.current.dataset.point) tip.current.hidden = true;
        });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [fly]);

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
    if (!ready || !map) return;
    const filter = yearFilter(year);
    map.setFilter("borders-fill", filter);
    map.setFilter("borders-line", filter);
    map.setPaintProperty("borders-fill", "fill-color", fillColor(states));
    map.setPaintProperty("borders-fill", "fill-opacity", fillOpacity(states));
  }, [ready, year, states]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (map.getSource("things") as GeoJSONSource).setData(
      collection(
        points.map((p) => ({
          type: "Feature",
          properties: { k: p.key, c: p.tone, l: p.lens, n: p.name, w: p.when ?? "", e: p.e ? 1 : 0 },
          geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        })),
      ),
    );
  }, [ready, points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setFilter("things-core", lensFilter(lens));
    map.setFilter("things-halo", lensFilter(lens));
  }, [ready, lens]);

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
    if (!ready || !map) return;
    map.setPadding(padding);
  }, [ready, padding]);

  useEffect(() => {
    const el = box.current;
    const map = mapRef.current;
    if (!el || !map || !ready) return;
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  // Journeys draw themselves, a growing share of the path each frame.
  const routeKey = routes.map((r) => r.coords.length + ":" + r.coords[0]?.join(",")).join("|");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- routeKey stands for routes
  }, [ready, routeKey]);

  // The focus mark: a pulsing beacon with a hint bubble, as a DOM marker so it stays crisp and takes taps.
  const markRef = useRef<Marker | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    const m = libRef.current;
    markRef.current?.remove();
    markRef.current = null;
    if (!ready || !map || !m || !mark) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = "am-beacon";
    el.style.setProperty("--tone", TONE[mark.tone]);
    el.setAttribute("aria-label", `Open ${mark.name}`);
    el.innerHTML = `<i class="am-ring"></i><i class="am-ring am-ring2"></i><i class="am-dot"></i>`;
    const bubble = el.appendChild(document.createElement("span"));
    bubble.className = "am-hint";
    const b = bubble.appendChild(document.createElement("b"));
    b.textContent = mark.name;
    if (mark.hint) {
      const s = bubble.appendChild(document.createElement("small"));
      s.textContent = mark.hint;
    }
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      markOpenRef.current?.();
    });
    markRef.current = new m.Marker({ element: el, anchor: "center" }).setLngLat([mark.lng, mark.lat]).addTo(map);
  }, [ready, mark]);

  // Polity labels: the largest polities of the year plus every state the timeline knows, placed greedily so none
  // overlap, and kept out from under the panels.
  const labelMarkers = useRef(new Map<string, Marker>());
  useEffect(() => {
    const map = mapRef.current;
    const m = libRef.current;
    if (!ready || !map || !m) return;
    const want = new Map<string, { lng: number; lat: number; area: number; known: boolean }>();
    if (year !== undefined) {
      const z = map.getZoom();
      const min = 80 * Math.pow(4, 2 - z);
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
    const boxes: [number, number, number, number][] = [];
    const { width, height } = map.getCanvas().getBoundingClientRect();
    const pad = paddingRef.current;
    const center = map.getCenter();
    const top = [...want]
      .sort((a, b) => Number(b[1].known) - Number(a[1].known) || b[1].area - a[1].area)
      .filter(([name, l]) => {
        // On the globe, labels on the far side would project onto the near one.
        if (globe && Math.abs(((l.lng - center.lng + 540) % 360) - 180) > 80) return false;
        const pt = map.project([l.lng, l.lat]);
        const w = name.length * (l.known ? 7.6 : 6.6) + 12;
        const bx: [number, number, number, number] = [pt.x - w / 2, pt.y - 10, pt.x + w / 2, pt.y + 10];
        if (bx[0] < pad.left + 4 || bx[2] > width - pad.right - 4 || bx[1] < pad.top || bx[3] > height - pad.bottom) return false;
        if (boxes.some((b) => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1])) return false;
        boxes.push(bx);
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
      el.className = `am-label${l.known ? " major" : ""}`;
      el.textContent = name;
      labelMarkers.current.set(name, new m.Marker({ element: el, anchor: "center" }).setLngLat([l.lng, l.lat]).addTo(map));
    }
    for (const [name, marker] of labelMarkers.current) {
      if (!keep.has(name)) {
        marker.remove();
        labelMarkers.current.delete(name);
      }
    }
  }, [ready, rows, overlays, year, byId, viewTick, globe, padding]);

  return (
    <div ref={box} className="am-map" role="region" aria-label="Interactive map of Islamic history">
      <div ref={canvasBox} className="am-canvas" />
      {!ready && (
        <p className="am-loading" role="status">
          <span className="am-spinner" aria-hidden="true" />
          {failed ? "The map couldn’t load. Reload the page to try again." : "Lighting up 5,400 years…"}
        </p>
      )}
      <div ref={tip} className="am-tip" hidden aria-hidden="true" />
      <div className="am-controls" style={{ right: padding.right + 12, top: padding.top + 12 }}>
        <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
        </button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out">
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
        </button>
        <button type="button" onClick={() => fly(focusRef.current)} aria-label="Recentre the map">
          <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4.5" /><path d="M8 1v3M8 12v3M1 8h3M12 8h3" /></svg>
        </button>
        <button type="button" onClick={() => setGlobe((g) => !g)} aria-label={globe ? "Switch to flat map" : "Switch to globe"} aria-pressed={globe}>
          {globe ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="4" width="12" height="8" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c2 2 2 10 0 12M8 2c-2 2-2 10 0 12" /></svg>
          )}
        </button>
      </div>
      <p className="am-credit" style={{ right: padding.right + 12 }}>
        {year === undefined ? "Before recorded borders" : "Borders approximate"} ·{" "}
        <a href="https://github.com/Seshat-Global-History-Databank/cliopatria" target="_blank" rel="noreferrer">
          Cliopatria CC BY 4.0
        </a>{" "}
        · NASA Blue Marble
      </p>
    </div>
  );
}
