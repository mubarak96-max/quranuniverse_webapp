// MapLibre style for the timeline atlas: a night atlas. Deep teal seas over the NASA relief, borders washed in like
// ink, and every person, place and moment as a point of light. The map keeps this palette in light and dark mode, the
// way a planetarium stays dark, so the lights always read.
import type { ExpressionSpecification, FilterSpecification, StyleSpecification } from "maplibre-gl";
import type { Kind, State } from "@/lib/timeline-types";
import type { Lens } from "@/lib/timeline-things";

export const NIGHT = {
  space: "#040a0f",
  ocean: "#08202a",
  sea: "#0a2b37",
  land: "#1b302c",
  coast: "#7fa197",
  border: "#e9d9ae",
  river: "#3c8a99",
  route: "#ffcf73",
  label: "#f3e7c7",
  ink: "#081419",
};

// Muslim polities take these washes in turn (State.color picks one); everyone else is a faint neutral.
const MUSLIM = ["#22a58b", "#3fbf8f", "#c9a24a", "#3b9fb6", "#9b82d4", "#68c46f"];
const OTHER = ["#7d8b86", "#8f8a7a", "#72808c", "#857a86"];

// Point colours. Moments take their kind; everything else its lens.
export const TONE: Record<Kind | Exclude<Lens, "moment">, string> = {
  prophet: "#ffd27a",
  revelation: "#fff0b8",
  battle: "#ff8a6b",
  empire: "#5ed6b8",
  knowledge: "#7ccaff",
  world: "#c9c3b4",
  event: "#f0d9a6",
  person: "#c8a8ff",
  place: "#8be6d4",
  polity: "#4fd1a5",
  nation: "#f0a868",
  villain: "#ff6f7a",
};

export const yearFilter = (year: number | undefined, name?: string): FilterSpecification => {
  if (year === undefined) return ["==", ["get", "f"], 1e9];
  const span: ExpressionSpecification[] = [
    ["<=", ["get", "f"], year],
    [">=", ["get", "t"], year],
  ];
  return ["all", ...span, ...(name ? [["==", ["get", "n"], name] as ExpressionSpecification] : [])];
};

export function fillColor(states: State[]): ExpressionSpecification {
  const muslim = states.filter((s) => s.muslim).flatMap((s) => [s.id, MUSLIM[(s.color ?? 0) % MUSLIM.length]]);
  return ["match", ["get", "s"], ...muslim, ["match", ["get", "h"], 0, OTHER[0], 1, OTHER[1], 2, OTHER[2], OTHER[3]]] as unknown as ExpressionSpecification;
}

export function fillOpacity(states: State[]): ExpressionSpecification {
  const ids = states.filter((s) => s.muslim).map((s) => s.id);
  return ["case", ["in", ["get", "s"], ["literal", ids]], 0.34, 0.1];
}

const toneColor: ExpressionSpecification = ["match", ["get", "c"], ...Object.entries(TONE).flat(), TONE.event] as unknown as ExpressionSpecification;

// `e` is 1 for things in the chapter on screen and 0 for the rest of history, which stays as a faint star field.
const inEra = (on: number | ExpressionSpecification, off: number | ExpressionSpecification): ExpressionSpecification => ["case", ["==", ["get", "e"], 1], on, off];

export const lensFilter = (lens: Lens | "all"): FilterSpecification => (lens === "all" ? ["has", "c"] : ["==", ["get", "l"], lens]);

const empty = { type: "FeatureCollection" as const, features: [] };
const EARTH = "/earth/{z}/{x}/{y}.jpg";
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

export function baseStyle(globe: boolean): StyleSpecification {
  return {
    version: 8,
    projection: { type: globe ? "globe" : "mercator" },
    sky: {
      "sky-color": "#0d3443",
      "horizon-color": "#1d5a63",
      "fog-color": "#0a2530",
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.7,
      "fog-ground-blend": 0.9,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 5, 0.6, 7, 0],
    },
    sources: {
      earth: { type: "raster", tiles: [EARTH], tileSize: 256, maxzoom: 4 },
      sea: { type: "geojson", data: WORLD_POLYGON },
      land: { type: "geojson", data: empty },
      rivers: { type: "geojson", data: empty },
      borders: { type: "geojson", data: empty },
      routes: { type: "geojson", data: empty },
      things: { type: "geojson", data: empty },
    },
    layers: [
      { id: "ocean", type: "background", paint: { "background-color": NIGHT.ocean } },
      {
        id: "earth",
        type: "raster",
        source: "earth",
        paint: { "raster-saturation": -0.35, "raster-contrast": 0.08, "raster-brightness-min": 0.02, "raster-brightness-max": 0.58, "raster-hue-rotate": -8, "raster-fade-duration": 300 },
      },
      { id: "sea", type: "fill", source: "sea", paint: { "fill-color": NIGHT.sea, "fill-opacity": 0.42 } },
      { id: "land", type: "fill", source: "land", paint: { "fill-color": NIGHT.land, "fill-opacity": 0.38 } },
      { id: "coast", type: "line", source: "land", paint: { "line-color": NIGHT.coast, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 6, 1.1], "line-opacity": 0.55 } },
      { id: "borders-fill", type: "fill", source: "borders", filter: yearFilter(undefined), paint: { "fill-color": OTHER[0], "fill-opacity": 0.1 } },
      {
        id: "borders-line",
        type: "line",
        source: "borders",
        filter: yearFilter(undefined),
        paint: { "line-color": NIGHT.border, "line-width": ["interpolate", ["linear"], ["zoom"], 1, 0.4, 6, 1.2], "line-opacity": 0.28 },
      },
      { id: "borders-hi", type: "line", source: "borders", filter: yearFilter(undefined), paint: { "line-color": NIGHT.route, "line-width": 2.2, "line-opacity": 0.9 } },
      { id: "rivers", type: "line", source: "rivers", paint: { "line-color": NIGHT.river, "line-width": 0.9, "line-opacity": 0.75 } },
      {
        id: "routes-glow",
        type: "line",
        source: "routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": NIGHT.route, "line-width": 12, "line-blur": 8, "line-opacity": 0.35 },
      },
      {
        id: "routes",
        type: "line",
        source: "routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": NIGHT.route, "line-width": 2.6, "line-dasharray": [2, 1.4] },
      },
      {
        id: "things-halo",
        type: "circle",
        source: "things",
        filter: lensFilter("all"),
        layout: { "circle-sort-key": ["get", "e"] },
        paint: {
          "circle-color": toneColor,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, inEra(9, 0), 6, inEra(18, 0)],
          "circle-opacity": inEra(0.28, 0),
          "circle-blur": 1,
          "circle-pitch-alignment": "map",
        },
      },
      {
        id: "things-core",
        type: "circle",
        source: "things",
        filter: lensFilter("all"),
        layout: { "circle-sort-key": ["get", "e"] },
        paint: {
          "circle-color": toneColor,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, inEra(3.2, 1.3), 4, inEra(4.6, 1.9), 7, inEra(6.5, 2.6)],
          "circle-opacity": inEra(1, 0.32),
          "circle-stroke-color": NIGHT.ink,
          "circle-stroke-width": inEra(1.2, 0),
          "circle-pitch-alignment": "map",
        },
      },
    ],
  };
}
