"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  baseScale,
  cameraFor,
  clampCamera,
  easeInOut,
  flight,
  transformOf,
  zoomAround,
  type Camera,
  type Focus,
  type Viewport,
} from "@/lib/map";
import { activeStates, snapshotFor, yearText, type Overlay, type Route, type State } from "@/lib/timeline-types";
import { useLand, useSnapshots, type Snapshot } from "./useMapLayers";

export type Pin = {
  id: string;
  x: number;
  y: number;
  tone: "event" | "capital" | "prophet" | "villain" | "near" | "way";
  label?: string;
  active?: boolean;
  onSelect?: () => void;
};

type Props = {
  year?: number;
  snapshots: number[];
  states: State[];
  overlays: Overlay[];
  focus: Focus;
  focusKey: string;
  routes: Route[];
  routeKey: string;
  pins: Pin[];
  hidden?: boolean;
};

type StateIndex = Map<string, State>;

// First active state that lists a dataset name owns it, so overlapping aliases resolve by file order.
function indexStates(states: State[]): StateIndex {
  const index: StateIndex = new Map();
  for (const s of states) for (const n of s.dataset) if (!index.has(n)) index.set(n, s);
  return index;
}

const stateClass = (s: State | undefined) => (!s ? "at-o" : s.muslim ? `at-m at-c${s.color ?? 0}` : "at-k");

const Borders = memo(function Borders({ snap, index, entering }: { snap: Snapshot; index: StateIndex; entering: boolean }) {
  return (
    <g className={`at-borders${entering ? " entering" : ""}`}>
      {snap.features.map((f, i) => (
        <path key={i} className={stateClass(index.get(f.n) ?? (f.s ? index.get(f.s) : undefined))} d={f.d}>
          {f.n && <title>{f.s && f.s !== f.n ? `${f.n} (${f.s})` : f.n}</title>}
        </path>
      ))}
    </g>
  );
});

type Gesture = { cam: Camera; x: number; y: number; dist?: number; moved: boolean };

export function Atlas({ year, snapshots, states, overlays, focus, focusKey, routes, routeKey, pins, hidden }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const probeA = useRef<HTMLSpanElement>(null);
  const probeB = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cam = useRef<Camera>({ x: 0, y: 0, z: 1 });
  const vp = useRef<Viewport>({ w: 1, h: 1, l: 0, t: 0, r: 0, b: 0 });
  const raf = useRef(0);
  const ready = useRef(false);
  const userMoved = useRef(false);
  const focusRef = useRef(focus);
  focusRef.current = focus;

  const land = useLand();
  const snapYear = year === undefined ? undefined : snapshotFor(year, snapshots);
  const layers = useSnapshots(snapYear);
  const active = useMemo(() => activeStates(states, year), [states, year]);
  // Keyed on the set of ruling states, so scrubbing through quiet years does not repaint every border.
  const activeKey = active.map((s) => s.id).join();
  const index = useMemo(() => indexStates(active), [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownOverlays = useMemo(
    () => (year === undefined ? [] : overlays.filter((o) => year >= o.from && year <= o.to)),
    [overlays, year],
  );
  const byId = useMemo(() => new Map(states.map((s) => [s.id, s])), [states]);

  // Camera writes go straight to the DOM: the SVG viewBox plus three CSS variables that pins, labels and strokes read.
  // Moving the viewBox (not a transform on a group) keeps Chrome repainting the whole map on every frame.
  const apply = useCallback((c: Camera) => {
    const { s, tx, ty } = transformOf(c, vp.current);
    const { w, h } = vp.current;
    svg.current?.setAttribute("viewBox", `${(-tx / s).toFixed(3)} ${(-ty / s).toFixed(3)} ${(w / s).toFixed(3)} ${(h / s).toFixed(3)}`);
    const st = box.current?.style;
    st?.setProperty("--tx", tx.toFixed(2));
    st?.setProperty("--ty", ty.toFixed(2));
    st?.setProperty("--s", s.toFixed(4));
  }, []);

  const stop = () => cancelAnimationFrame(raf.current);

  const flyTo = useCallback(
    (target: Camera) => {
      stop();
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cam.current = target;
        apply(target);
        return;
      }
      const f = flight(cam.current, target, vp.current);
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / f.duration);
        cam.current = f.at(easeInOut(t));
        apply(cam.current);
        if (t < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply],
  );

  // Insets come from CSS (--inset-*), often as calc(). Custom properties are not resolved to lengths by
  // getComputedStyle, so two invisible probes sized by them let the browser do the maths.
  const measure = useCallback(() => {
    const el = box.current;
    const a = probeA.current;
    const b = probeB.current;
    if (!el || !a || !b) return;
    vp.current = { w: el.clientWidth, h: el.clientHeight, l: a.offsetWidth, t: a.offsetHeight, r: b.offsetWidth, b: b.offsetHeight };
  }, []);

  useLayoutEffect(() => {
    measure();
    cam.current = cameraFor(focusRef.current, vp.current);
    apply(cam.current);
    ready.current = true;
    box.current?.classList.add("ready");
    const ro = new ResizeObserver(() => {
      measure();
      if (!userMoved.current) cam.current = cameraFor(focusRef.current, vp.current);
      apply(cam.current);
    });
    ro.observe(box.current!);
    return () => {
      ro.disconnect();
      stop();
    };
  }, [apply, measure]);

  useEffect(() => {
    if (!ready.current) return;
    userMoved.current = false;
    measure();
    flyTo(cameraFor(focusRef.current, vp.current));
  }, [focusKey, flyTo, measure]);

  // Pan with one pointer, pinch with two, zoom with the wheel. Pointer capture starts only once a drag is real,
  // so taps still reach the pin buttons underneath.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);

  const begin = () => {
    const pts = [...pointers.current.values()];
    if (pts.length === 0) gesture.current = null;
    else if (pts.length === 1) gesture.current = { cam: { ...cam.current }, x: pts[0].x, y: pts[0].y, moved: false };
    else {
      const [a, b] = pts;
      gesture.current = { cam: { ...cam.current }, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dist: Math.hypot(a.x - b.x, a.y - b.y), moved: true };
    }
  };

  const local = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointers.current.set(e.pointerId, local(e));
    begin();
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, local(e));
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      const dx = pts[0].x - g.x;
      const dy = pts[0].y - g.y;
      if (!g.moved && Math.hypot(dx, dy) < 5) return;
      if (!g.moved) box.current!.setPointerCapture(e.pointerId);
      g.moved = true;
      const s = baseScale(vp.current) * g.cam.z;
      cam.current = clampCamera({ x: g.cam.x - dx / s, y: g.cam.y - dy / s, z: g.cam.z });
    } else {
      const [a, b] = pts;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const zoomed = zoomAround(g.cam, vp.current, Math.hypot(a.x - b.x, a.y - b.y) / (g.dist || 1), g.x, g.y);
      const s = baseScale(vp.current) * zoomed.z;
      cam.current = clampCamera({ x: zoomed.x - (mx - g.x) / s, y: zoomed.y - (my - g.y) / s, z: zoomed.z });
    }
    stop();
    userMoved.current = true;
    apply(cam.current);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    if (gesture.current?.moved) suppressClick.current = true;
    pointers.current.delete(e.pointerId);
    begin();
  }

  useEffect(() => {
    const el = box.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stop();
      userMoved.current = true;
      const r = el.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016));
      cam.current = zoomAround(cam.current, vp.current, factor, e.clientX - r.left, e.clientY - r.top);
      apply(cam.current);
    };
    const onClickCapture = (e: MouseEvent) => {
      if (!suppressClick.current) return;
      suppressClick.current = false;
      e.stopPropagation();
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, [apply]);

  function zoomBy(factor: number, at?: { x: number; y: number }) {
    userMoved.current = true;
    const v = vp.current;
    const p = at ?? { x: v.l + (v.w - v.l - v.r) / 2, y: v.t + (v.h - v.t - v.b) / 2 };
    flyTo(zoomAround(cam.current, v, factor, p.x, p.y));
  }

  function reset() {
    userMoved.current = false;
    flyTo(cameraFor(focusRef.current, vp.current));
  }

  const top = layers.at(-1);
  const labels = top?.labels ?? [];

  return (
    <div
      ref={box}
      className={`atlas${hidden ? " is-hidden" : ""}`}
      role="region"
      aria-label="Map"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
        const r = box.current!.getBoundingClientRect();
        zoomBy(2, { x: e.clientX - r.left, y: e.clientY - r.top });
      }}
    >
      <span ref={probeA} className="at-probe at-probe-lt" aria-hidden="true" />
      <span ref={probeB} className="at-probe at-probe-rb" aria-hidden="true" />
      <svg ref={svg} className="at-svg" aria-hidden="true">
        <g className="at-world">
          {land && <path className="at-land" d={land.land} />}
          {layers.map((snap, i) => (
            <Borders key={snap.year} snap={snap} index={index} entering={i > 0} />
          ))}
          {shownOverlays.map((o) => (
            <path key={o.id} className={`at-overlay ${stateClass(byId.get(o.state))}`} d={o.d} />
          ))}
          {land && <path className="at-rivers" d={land.rivers} />}
          {routes.map((r, i) => (
            <path key={`${routeKey}-${i}`} className="at-route" d={r.d} pathLength={1} />
          ))}
        </g>
      </svg>

      <div className="at-labels" aria-hidden="true">
        {labels.map((l) => {
          const s = index.get(l.n);
          if (!s && l.r < 18) return null;
          return (
            <span key={l.n} className={`at-label${s ? " major" : ""}`} style={{ "--x": l.x, "--y": l.y, "--r": l.r } as React.CSSProperties}>
              {l.n}
            </span>
          );
        })}
        {shownOverlays.map((o) => (
          <span key={o.id} className="at-label major" style={{ "--x": o.label.x, "--y": o.label.y, "--r": 60 } as React.CSSProperties}>
            {o.name}
          </span>
        ))}
      </div>

      <div className="at-pins">
        {pins.map((p) => {
          const style = { "--x": p.x, "--y": p.y } as React.CSSProperties;
          const cls = `at-pin at-${p.tone}${p.active ? " on" : ""}`;
          const body = (
            <>
              <i />
              {p.label && <span>{p.label}</span>}
            </>
          );
          return p.onSelect ? (
            <button key={p.id} type="button" className={cls} style={style} onClick={p.onSelect} aria-label={p.label}>
              {body}
            </button>
          ) : (
            <div key={p.id} className={cls} style={style}>
              {body}
            </div>
          );
        })}
      </div>

      <div className="at-controls">
        <button type="button" onClick={() => zoomBy(1.8)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.8)} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={reset} aria-label="Back to this moment">
          ⌖
        </button>
      </div>

      <p className="at-note">
        {snapYear === undefined ? "Before recorded borders" : `Borders c. ${yearText(snapYear)} · approximate`}
      </p>
    </div>
  );
}
