// Builds the timeline map layers in public/borders/:
//   <year>.json  historical borders from historical-basemaps (GPL-3.0, github.com/aourednik/historical-basemaps)
//   land.json    coastline and major rivers from Natural Earth 1:50m (public domain)
// Every layer is clipped to the map box in lib/map-box.json, simplified, and pre-projected to SVG path strings.
// Run when the box or the snapshot list changes: node tools/borders.mjs [cache-dir]
import fs from "node:fs";
import path from "node:path";
import BOX from "../lib/map-box.json" with { type: "json" };

const HB = "https://raw.githubusercontent.com/aourednik/historical-basemaps/master";
const NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson";
const YEARS = [
  -3000, -2000, -1500, -1000, -700, -500, -400, -323, -300, -200, -100, -1, 100, 200, 300, 400, 500, 600, 700, 800, 900,
  1000, 1100, 1200, 1279, 1300, 1400, 1492, 1500, 1530, 1600, 1650, 1700, 1715, 1783, 1800, 1815, 1878, 1880, 1900, 1914,
  1920, 1930, 1938, 1945, 1960, 1994, 2000, 2010,
];
const RIVERS = /^(Nile|Euphrates|Tigris|Indus|Ganges|Jordan|Amu\s+Darya|Syr Darya|Danube|Niger|Volga|Huang|Chang Jiang|Yangtze)$/;
const TOLERANCE = 0.04; // degrees, about 1.5px at the closest story zoom

// Clip one degree past the box so cut edges never show inside the viewport.
const CLIP = { lon0: BOX.lon0 - 1, lon1: BOX.lon1 + 1, lat0: BOX.lat0 + 1, lat1: BOX.lat1 - 1 };
const OUT = path.join(process.cwd(), "public", "borders");
const CACHE = process.argv[2] ?? path.join(process.cwd(), ".cache", "borders");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

async function fetchCached(url, name) {
  const local = path.join(CACHE, name);
  if (!fs.existsSync(local)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    fs.writeFileSync(local, await res.text());
  }
  return fs.readFileSync(local, "utf8");
}

const project = ([lon, lat]) => [(lon - BOX.lon0) * BOX.k * BOX.kx, (BOX.lat0 - lat) * BOX.k];
const fmt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

// Sutherland-Hodgman clip of a closed ring against the clip box.
function clipRing(ring) {
  const edges = [
    [(p) => p[0] >= CLIP.lon0, (a, b) => cross(a, b, 0, CLIP.lon0)],
    [(p) => p[0] <= CLIP.lon1, (a, b) => cross(a, b, 0, CLIP.lon1)],
    [(p) => p[1] <= CLIP.lat0, (a, b) => cross(a, b, 1, CLIP.lat0)],
    [(p) => p[1] >= CLIP.lat1, (a, b) => cross(a, b, 1, CLIP.lat1)],
  ];
  let out = ring;
  for (const [inside, at] of edges) {
    const input = out;
    out = [];
    if (input.length === 0) break;
    let prev = input[input.length - 1];
    for (const cur of input) {
      if (inside(cur)) {
        if (!inside(prev)) out.push(at(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(at(prev, cur));
      prev = cur;
    }
  }
  return out;
}

function cross(a, b, axis, v) {
  const t = (v - a[axis]) / (b[axis] - a[axis]);
  return axis === 0 ? [v, a[1] + t * (b[1] - a[1])] : [a[0] + t * (b[0] - a[0]), v];
}

const inClip = (p) => p[0] >= CLIP.lon0 && p[0] <= CLIP.lon1 && p[1] <= CLIP.lat0 && p[1] >= CLIP.lat1;

// Open lines are cut into the runs that stay inside the clip box.
function clipLine(line) {
  const runs = [];
  let run = [];
  for (const p of line) {
    if (inClip(p)) run.push(p);
    else if (run.length) {
      runs.push(run);
      run = [];
    }
  }
  if (run.length) runs.push(run);
  return runs;
}

function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let best = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = distToSeg(pts[i], pts[s], pts[e]);
      if (d > best) {
        best = d;
        idx = i;
      }
    }
    if (best > tol) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function distToSeg(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]);
}

const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;

function inside(p, ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function edgeDist(p, ring) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) best = Math.min(best, distToSeg(p, ring[j], ring[i]));
  return best;
}

// Label point: the sampled spot deepest inside the ring, so labels stay off thin coasts and out of the sea.
function labelPoint(ring) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of ring) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  let best = [(x0 + x1) / 2, (y0 + y1) / 2];
  let bestD = inside(best, ring) ? edgeDist(best, ring) : -1;
  let [cx, cy, w, h] = [(x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0];
  for (let pass = 0; pass < 3; pass++) {
    const n = 16;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const p = [cx - w / 2 + (w * i) / n, cy - h / 2 + (h * j) / n];
        if (!inside(p, ring)) continue;
        const d = edgeDist(p, ring);
        if (d > bestD) [best, bestD] = [p, d];
      }
    }
    [cx, cy, w, h] = [best[0], best[1], w / 4, h / 4];
  }
  return best;
}

function polygonsOf(geometry) {
  return geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
}

// Returns the SVG path plus the largest projected ring, which drives the label.
function toPath(geometry) {
  let d = "";
  let largest = null;
  let largestArea = 0;
  for (const poly of polygonsOf(geometry)) {
    poly.forEach((ring, i) => {
      const pts = simplify(clipRing(ring), TOLERANCE);
      if (pts.length < 4) return;
      const projected = pts.map(project);
      d += "M" + projected.map(fmt).join("L") + "Z";
      const a = area(projected);
      if (i === 0 && a > largestArea) [largest, largestArea] = [projected, a];
    });
  }
  return { d, largest, largestArea };
}

for (const year of YEARS) {
  const name = `world_${year < 0 ? `bc${-year}` : year}.geojson`;
  const geo = JSON.parse(await fetchCached(`${HB}/geojson/${name}`, name));
  const features = [];
  const best = new Map();
  for (const f of geo.features) {
    const n = f.properties.NAME ?? "";
    const s = f.properties.SUBJECTO ?? "";
    const { d, largest, largestArea } = toPath(f.geometry);
    if (!d) continue;
    features.push(s && s !== n ? { n, s, d } : { n, d });
    if (n && largest && largestArea > (best.get(n)?.a ?? 0)) best.set(n, { ring: largest, a: largestArea });
  }
  const labels = [...best].map(([n, { ring, a }]) => {
    const [x, y] = labelPoint(ring);
    return { n, x: +x.toFixed(1), y: +y.toFixed(1), r: +Math.sqrt(a).toFixed(1) };
  });
  const target = path.join(OUT, `${year}.json`);
  fs.writeFileSync(target, JSON.stringify({ year, features, labels }));
  console.log(year, features.length, "features", labels.length, "labels", Math.round(fs.statSync(target).size / 1024), "KB");
}

const land = JSON.parse(await fetchCached(`${NE}/ne_50m_land.geojson`, "ne_50m_land.geojson"));
let landPath = "";
for (const f of land.features) landPath += toPath(f.geometry).d;
const rivers = JSON.parse(await fetchCached(`${NE}/ne_50m_rivers_lake_centerlines.geojson`, "ne_50m_rivers.geojson"));
const riverPaths = [];
for (const f of rivers.features) {
  if (!RIVERS.test(f.properties.name ?? "")) continue;
  const lines = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
  let d = "";
  for (const line of lines) {
    for (const run of clipLine(line)) {
      const pts = simplify(run, TOLERANCE);
      if (pts.length >= 2) d += "M" + pts.map(project).map(fmt).join("L");
    }
  }
  if (d) riverPaths.push(d);
}
fs.writeFileSync(path.join(OUT, "land.json"), JSON.stringify({ land: landPath, rivers: riverPaths.join("") }));
console.log("land", Math.round(fs.statSync(path.join(OUT, "land.json")).size / 1024), "KB", riverPaths.length, "river lines");

fs.writeFileSync(path.join(OUT, "LICENSE"), await fetchCached(`${HB}/LICENSE`, "LICENSE"));
fs.writeFileSync(
  path.join(OUT, "README.txt"),
  [
    "Map layers for the Quran Universe timeline, generated by tools/borders.mjs.",
    "<year>.json: historical borders from historical-basemaps, https://github.com/aourednik/historical-basemaps",
    "  Licence: GPL-3.0 (see LICENSE). These are clipped, simplified and projected copies.",
    "  Borders are approximate and contested; the dataset authors ask readers to verify against other sources.",
    "land.json: coastline and rivers from Natural Earth 1:50m, public domain, https://www.naturalearthdata.com",
    "",
  ].join("\n"),
);
