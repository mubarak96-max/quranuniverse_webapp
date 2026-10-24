// Builds the timeline map layers in public/borders/:
//   b<n>.json    TopoJSON of the Cliopatria polities (Seshat Global History Databank, CC BY 4.0,
//                github.com/Seshat-Global-History-Databank/cliopatria), one file per time band
//   index.json   the bands and their year ranges
//   land.json    TopoJSON of the coastline and major rivers from Natural Earth 1:50m (public domain)
// Each polity row keeps n (name), f and t (first and last year), plus s (our state id from content/timeline/states.json)
// and fa (ruling faith from content/timeline/faiths.json), so the map can colour by ruler or faith without lookups.
// Rows overlap in time, so a band holds every row that touches it and the client filters by year on the GPU.
// Rerun after changing states.json or faiths.json:
//   node tools/cliopatria.mjs <cliopatria.geojson from the Cliopatria zip> [cache-dir]
// Simplification uses mapshaper through npx, so it needs network access the first time.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2];
if (!SRC) throw new Error("usage: node tools/cliopatria.mjs <cliopatria.geojson> [cache-dir]");
const CACHE = process.argv[3] ?? path.join(process.cwd(), ".cache", "borders");
const OUT = path.join(process.cwd(), "public", "borders");
const CONTENT = path.join(process.cwd(), "content", "timeline");
const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const MAPSHAPER = ["-y", "mapshaper@0.6.102"];
const RIVERS = /^(Nile|Euphrates|Tigris|Indus|Ganges|Jordan|Amu Darya|Syr Darya|Danube|Niger|Volga|Huang|Chang Jiang|Yangtze|Mississippi|Amazon|Congo|Zambezi|Oxus|Rhine|Dnieper|Don|Mekong|Brahmaputra)$/;

// Narrower bands where the story spends its time, so a scrub through the caliphates loads small files.
const BANDS = [
  [-3400, -1201],
  [-1200, -301],
  [-300, 299],
  [300, 699],
  [700, 999],
  [1000, 1249],
  [1250, 1499],
  [1500, 1749],
  [1750, 1899],
  [1900, 2024],
];

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

const states = readJson(path.join(CONTENT, "states.json"));
const faiths = readJson(path.join(CONTENT, "faiths.json")).faiths;
// A Cliopatria name can belong to several of our states over time (Egypt's dynasties); the row's years pick one.
const owners = new Map();
for (const s of states) for (const n of s.clio ?? []) owners.set(n, [...(owners.get(n) ?? []), s]);
const faithOf = new Map(Object.entries(faiths).flatMap(([faith, names]) => names.map((n) => [n, faith])));

function ownerOf(name, from, to) {
  const list = owners.get(name);
  if (!list) return "";
  const mid = (from + to) / 2;
  return (list.find((s) => mid >= s.from && mid <= s.to) ?? list[0]).id;
}

function mapshaper(args) {
  execFileSync("npx", [...MAPSHAPER, ...args], { stdio: ["ignore", "ignore", "inherit"], shell: true, env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" } });
}

console.log("reading", SRC);
const all = readJson(SRC).features.filter((f) => f.properties.Type === "POLITY" && f.geometry);
// tools/validate-timeline.mjs checks states.json and faiths.json against this list.
fs.writeFileSync(path.join(CACHE, "names.json"), JSON.stringify([...new Set(all.map((f) => f.properties.Name))].sort()));
const index = [];
BANDS.forEach(([lo, hi], i) => {
  const features = all
    .filter((f) => f.properties.FromYear <= hi && f.properties.ToYear >= lo)
    .map((f) => {
      const { Name: n, FromYear: from, ToYear: to } = f.properties;
      const s = ownerOf(n, from, to);
      const fa = faithOf.get(n) ?? states.find((x) => x.id === s)?.faith ?? "";
      return { type: "Feature", properties: { n, f: from, t: to, s, fa }, geometry: f.geometry };
    });
  const tmp = path.join(CACHE, `band-${i}.geojson`);
  fs.writeFileSync(tmp, JSON.stringify({ type: "FeatureCollection", features }));
  const file = `b${i}.json`;
  mapshaper([tmp, "-simplify", "3%", "weighted", "keep-shapes", "-filter-slivers", "min-area=300km2", "-o", path.join(OUT, file), "format=topojson", "quantization=20000"]);
  index.push({ from: lo, to: hi, file });
  console.log(file, lo, hi, features.length, "rows", (fs.statSync(path.join(OUT, file)).size / 1e6).toFixed(2), "MB");
});
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ bands: index }));

async function fetchCached(name) {
  const local = path.join(CACHE, name);
  if (!fs.existsSync(local)) {
    const res = await fetch(`${NE}/${name}`);
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    fs.writeFileSync(local, await res.text());
  }
  return local;
}

const land = await fetchCached("ne_50m_land.geojson");
const riversAll = readJson(await fetchCached("ne_50m_rivers_lake_centerlines.geojson"));
const rivers = path.join(CACHE, "rivers.geojson");
fs.writeFileSync(
  rivers,
  JSON.stringify({ type: "FeatureCollection", features: riversAll.features.filter((f) => RIVERS.test(f.properties.name ?? "")).map((f) => ({ ...f, properties: {} })) }),
);
mapshaper(["-i", land, rivers, "combine-files", "-simplify", "8%", "keep-shapes", "-filter-fields", "", "-o", path.join(OUT, "land.json"), "format=topojson", "quantization=40000"]);
console.log("land.json", (fs.statSync(path.join(OUT, "land.json")).size / 1e6).toFixed(2), "MB");
