// MapLibre style for the timeline atlas. Colours come from the timeline's parchment tokens (stage.css), read from the
// app element at runtime, so the map follows light and dark mode like the rest of the page.
import type { ExpressionSpecification, FilterSpecification, Map as MlMap, StyleSpecification } from "maplibre-gl";
import type { Faith, Kind, State } from "@/lib/timeline-types";

export type MapMode = "rulers" | "faith";

export type Palette = {
  dark: boolean;
  space: string;
  ocean: string;
  sea: string;
  land: string;
  coast: string;
  border: string;
  river: string;
  route: string;
  fg: string;
  page: string;
  muslim: string[];
  other: string[];
  faith: Record<Faith, string>;
  kind: Record<Kind, string>;
};

const hex = (h: string) => {
  const m = h.replace("#", "");
  const full = m.length === 3 ? [...m].map((c) => c + c).join("") : m;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

// Linear sRGB mix, like CSS color-mix(in srgb, a t, b).
export function mix(a: string, b: string, t: number) {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, i) => Math.round(v * t + y[i] * (1 - t))).join(",")})`;
}

export function readPalette(el: Element = document.documentElement): Palette {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(`--${name}`).trim() || "#888888";
  const [bg, page, fg, good, idea, reward, neu, old, trap, muted] = ["bg", "page", "fg", "good", "idea", "reward", "new", "old", "trap", "muted"].map(v);
  const dark = hex(bg).reduce((a, b) => a + b, 0) < 384;
  return {
    dark,
    space: bg,
    ocean: dark ? mix(good, bg, 0.22) : mix(good, bg, 0.3),
    sea: dark ? mix(good, bg, 0.3) : mix(good, page, 0.32),
    land: dark ? mix(reward, bg, 0.12) : page,
    coast: mix(fg, page, 0.35),
    border: mix(fg, page, dark ? 0.45 : 0.55),
    river: mix(good, page, 0.45),
    route: trap,
    fg,
    page,
    muslim: [idea, mix(good, "#0f9f6e", 0.7), reward, neu, old, mix("#2f9e44", good, 0.75)],
    other: [0.07, 0.1, 0.13, 0.16].map((t) => mix(fg, page, t)),
    faith: {
      islam: "#1f9d55",
      christian: good,
      jewish: idea,
      zoroastrian: "#e8590c",
      hindu: "#f59f00",
      buddhist: "#b08d1a",
      chinese: trap,
      pagan: old,
      mixed: muted,
      secular: muted,
    },
    kind: {
      prophet: reward,
      revelation: dark ? "#f3d27a" : "#c98f12",
      battle: trap,
      empire: idea,
      knowledge: good,
      event: neu,
      world: dark ? mix(fg, bg, 0.7) : mix(fg, bg, 0.55),
    },
  };
}

export const yearFilter = (year: number | undefined, name?: string): FilterSpecification => {
  if (year === undefined) return ["==", ["get", "f"], 1e9];
  const span: ExpressionSpecification[] = [
    ["<=", ["get", "f"], year],
    [">=", ["get", "t"], year],
  ];
  return ["all", ...span, ...(name ? [["==", ["get", "n"], name] as ExpressionSpecification] : [])];
};

export function fillColor(p: Palette, mode: MapMode, states: State[]): ExpressionSpecification {
  if (mode === "faith") {
    const pairs = Object.entries(p.faith).flat();
    return ["match", ["get", "fa"], ...pairs, p.other[0]] as unknown as ExpressionSpecification;
  }
  const muslim = states.filter((s) => s.muslim).flatMap((s) => [s.id, p.muslim[(s.color ?? 0) % p.muslim.length]]);
  const known = states.filter((s) => !s.muslim).flatMap((s) => [s.id, p.other[3]]);
  return [
    "match",
    ["get", "s"],
    ...muslim,
    ...known,
    ["match", ["get", "h"], 0, p.other[0], 1, p.other[1], 2, p.other[2], p.other[1]],
  ] as unknown as ExpressionSpecification;
}

// Fills stay thin enough for the relief underneath to read through, like ink washes on an old atlas.
export function fillOpacity(mode: MapMode, states: State[]): ExpressionSpecification | number {
  if (mode === "faith") return ["match", ["get", "fa"], "", 0.2, 0.42];
  const ids = states.filter((s) => s.muslim).map((s) => s.id);
  return ["case", ["in", ["get", "s"], ["literal", ids]], 0.5, 0.34];
}

// Event lights. With a time position `at` (0..1 on the timeline axis) a light ignites as the playhead reaches its
// moment and fades over the next few percent of the axis; without one, every light glows faintly, like a night sky.
const LIGHT_AFTER = 0.035;
const LIGHT_BEFORE = 0.003;
const since = (at: number): ExpressionSpecification => ["-", at, ["get", "t"]];

export function lightPaint(at: number | undefined) {
  if (at === undefined) return { core: 0.75, coreR: 3.2, halo: 0.22, haloR: 9 };
  const fade = (peak: number, rest: number): ExpressionSpecification => [
    "interpolate",
    ["linear"],
    since(at),
    -LIGHT_BEFORE,
    0,
    0,
    peak,
    0.008,
    rest,
    LIGHT_AFTER,
    0,
  ];
  return {
    core: fade(1, 0.85),
    coreR: ["interpolate", ["linear"], since(at), -LIGHT_BEFORE, 2, 0, 7, 0.008, 4.2, LIGHT_AFTER, 3] as ExpressionSpecification,
    halo: fade(0.75, 0.25),
    haloR: ["interpolate", ["linear"], since(at), -LIGHT_BEFORE, 4, 0, 30, 0.008, 13, LIGHT_AFTER, 8] as ExpressionSpecification,
  };
}

const kindColor = (p: Palette): ExpressionSpecification =>
  ["match", ["get", "k"], ...Object.entries(p.kind).flat(), p.kind.event] as unknown as ExpressionSpecification;

// The relief imagery, warmed toward the page so it reads as an engraved atlas rather than a satellite photo.
export function earthPaint(p: Palette) {
  return p.dark
    ? { "raster-saturation": -0.45, "raster-contrast": -0.05, "raster-brightness-min": 0.04, "raster-brightness-max": 0.62 }
    : { "raster-saturation": -0.4, "raster-contrast": -0.2, "raster-brightness-min": 0.28, "raster-brightness-max": 1 };
}

type PaintName = Parameters<MlMap["setPaintProperty"]>[1];
type PaintValue = Parameters<MlMap["setPaintProperty"]>[2];

export function themePaint(p: Palette): [string, PaintName, PaintValue][] {
  const earth = Object.entries(earthPaint(p)) as [PaintName, number][];
  return [
    ["ocean", "background-color", p.ocean],
    ...earth.map(([k, v]) => ["earth", k, v] as [string, PaintName, PaintValue]),
    ["sea", "fill-color", p.sea],
    ["land", "fill-color", p.land],
    ["land", "fill-opacity", p.dark ? 0.32 : 0.42],
    ["coast", "line-color", p.coast],
    ["borders-line", "line-color", p.border],
    ["borders-hi", "line-color", p.fg],
    ["rivers", "line-color", p.river],
    ["routes", "line-color", p.route],
    ["routes-glow", "line-color", p.route],
    ["lights-halo", "circle-color", kindColor(p)],
    ["lights-core", "circle-color", kindColor(p)],
    ["lights-core", "circle-stroke-color", p.page],
  ];
}

const empty = { type: "FeatureCollection" as const, features: [] };
const EARTH = "/earth/{z}/{x}/{y}.jpg";
// A wash over the whole sphere; the land wash above it then lifts the continents back toward the paper.
const WORLD_POLYGON = {
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      [
        [-180, -85],
        [180, -85],
        [180, 85],
        [-180, 85],
        [-180, -85],
      ],
    ],
  },
};

export function baseStyle(p: Palette, globe: boolean): StyleSpecification {
  const light = lightPaint(undefined);
  return {
    version: 8,
    projection: { type: globe ? "globe" : "mercator" },
    sources: {
      earth: { type: "raster", tiles: [EARTH], tileSize: 256, maxzoom: 4 },
      sea: { type: "geojson", data: WORLD_POLYGON },
      land: { type: "geojson", data: empty },
      rivers: { type: "geojson", data: empty },
      borders: { type: "geojson", data: empty },
      routes: { type: "geojson", data: empty },
      lights: { type: "geojson", data: empty },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": p.ocean } },
      { id: "earth", type: "raster", source: "earth", paint: { ...earthPaint(p), "raster-fade-duration": 300 } },
      { id: "sea", type: "fill", source: "sea", paint: { "fill-color": p.sea, "fill-opacity": p.dark ? 0.35 : 0.45 } },
      { id: "land", type: "fill", source: "land", paint: { "fill-color": p.land, "fill-opacity": p.dark ? 0.32 : 0.42 } },
      { id: "coast", type: "line", source: "land", paint: { "line-color": p.coast, "line-width": 0.6, "line-opacity": 0.7 } },
      { id: "borders-fill", type: "fill", source: "borders", filter: yearFilter(undefined), paint: { "fill-color": p.other[1], "fill-opacity": 0.4 } },
      { id: "borders-line", type: "line", source: "borders", filter: yearFilter(undefined), paint: { "line-color": p.border, "line-width": 0.8 } },
      { id: "borders-hi", type: "line", source: "borders", filter: yearFilter(undefined), paint: { "line-color": p.fg, "line-width": 2 } },
      { id: "rivers", type: "line", source: "rivers", paint: { "line-color": p.river, "line-width": 0.8, "line-opacity": 0.7 } },
      {
        id: "routes-glow",
        type: "line",
        source: "routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.route, "line-width": 10, "line-blur": 6, "line-opacity": 0.35 },
      },
      {
        id: "routes",
        type: "line",
        source: "routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": p.route, "line-width": 2.6, "line-dasharray": [2, 1.2] },
      },
      {
        id: "lights-halo",
        type: "circle",
        source: "lights",
        paint: { "circle-color": kindColor(p), "circle-radius": light.haloR, "circle-opacity": light.halo, "circle-blur": 1, "circle-pitch-alignment": "map" },
      },
      {
        id: "lights-core",
        type: "circle",
        source: "lights",
        paint: {
          "circle-color": kindColor(p),
          "circle-radius": light.coreR,
          "circle-opacity": light.core,
          "circle-stroke-color": p.page,
          "circle-stroke-width": 1,
          "circle-stroke-opacity": light.core,
          "circle-pitch-alignment": "map",
        },
      },
    ],
  };
}

// Only lights inside the glow window exist for clicks and hovers, so a moment still to come cannot be tapped.
export function lightFilter(at: number | undefined): FilterSpecification {
  if (at === undefined) return ["has", "t"];
  return ["all", [">=", ["get", "t"], at - LIGHT_AFTER], ["<=", ["get", "t"], at + LIGHT_BEFORE]];
}
