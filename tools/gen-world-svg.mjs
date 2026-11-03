// Writes public/timeline/world.svg: the land outline from public/borders/land.json in plain equirectangular degrees
// (x = longitude, y = -latitude, viewBox -180 -90 360 180). Entry pages crop it with their own viewBox to draw a small
// locator map without shipping any map code. Run with `node tools/gen-world-svg.mjs` when land.json changes.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const topo = JSON.parse(fs.readFileSync(path.join(root, "public", "borders", "land.json"), "utf8"));
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

const arcs = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * sx + tx, y * sy + ty];
  });
});

const line = (ids) => {
  const out = [];
  for (const i of ids) {
    const a = i < 0 ? [...arcs[~i]].reverse() : arcs[i];
    out.push(...(out.length ? a.slice(1) : a));
  }
  return out;
};

const r = (n) => Math.round(n * 10) / 10;
const ring = (pts) => {
  let d = "";
  let last = "";
  for (const [lng, lat] of pts) {
    const p = `${r(lng)} ${r(-lat)}`;
    if (p === last) continue;
    d += (d ? "L" : "M") + p;
    last = p;
  }
  return d + "Z";
};

let land = "";
for (const g of topo.objects.ne_50m_land.geometries) {
  const polys = g.type === "Polygon" ? [g.arcs] : g.arcs;
  for (const p of polys) for (const rr of p) land += ring(line(rr));
}

let rivers = "";
for (const g of topo.objects.rivers.geometries) {
  const lines = g.type === "LineString" ? [g.arcs] : g.arcs;
  for (const l of lines) rivers += ring(line(l)).replace(/Z$/, "");
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-180 -90 360 180" preserveAspectRatio="none">
<path d="${land}" fill="#24433f" stroke="#5b8178" stroke-width="0.12" stroke-linejoin="round"/>
<path d="${rivers}" fill="none" stroke="#3f7f8c" stroke-width="0.12" stroke-opacity="0.8"/>
</svg>
`;
const out = path.join(root, "public", "timeline");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "world.svg"), svg);
console.log(`world.svg: ${(svg.length / 1024).toFixed(0)} KB`);
