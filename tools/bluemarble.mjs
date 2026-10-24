// Downloads the globe's surface imagery into public/earth/{z}/{x}/{y}.jpg: NASA Blue Marble with shaded relief and
// bathymetry, from the GIBS tile service (public domain). The world is fetched to zoom 4, about 3 MB; the map
// overzooms beyond that. (A sharper zoom 5 over the Islamic world was tried, but its edge showed as a seam.)
// Run once by hand: node tools/bluemarble.mjs
import fs from "node:fs";
import path from "node:path";

const LAYER = "BlueMarble_ShadedRelief_Bathymetry";
const URL = (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${LAYER}/default/GoogleMapsCompatible_Level8/${z}/${y}/${x}.jpeg`;
const OUT = path.join(process.cwd(), "public", "earth");
const MAX_ZOOM = 4;

const jobs = [];
for (let z = 0; z <= MAX_ZOOM; z++) for (let x = 0; x < 2 ** z; x++) for (let y = 0; y < 2 ** z; y++) jobs.push([z, x, y]);

let bytes = 0;
async function fetchTile([z, x, y]) {
  const file = path.join(OUT, String(z), String(x), `${y}.jpg`);
  if (fs.existsSync(file)) return;
  const res = await fetch(URL(z, x, y));
  if (!res.ok || res.headers.get("content-type") !== "image/jpeg") throw new Error(`${z}/${x}/${y}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  bytes += buf.length;
}

const queue = [...jobs];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) await fetchTile(queue.shift());
  }),
);
console.log(`${jobs.length} tiles, ${(bytes / 1e6).toFixed(1)} MB written to public/earth`);
