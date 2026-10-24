// A minimal TopoJSON decoder for the border and land files written by tools/cliopatria.mjs. Shared arcs are stored once
// in those files, which is what keeps 5,400 years of overlapping borders small enough to download.
import type { LngLat } from "@/lib/timeline-types";

type Arc = LngLat[];
type Geometry = { type: string; arcs?: unknown; properties?: Record<string, unknown> };
export type Topology = {
  type: "Topology";
  transform?: { scale: [number, number]; translate: [number, number] };
  arcs: [number, number][][];
  objects: Record<string, { type: "GeometryCollection"; geometries: Geometry[] }>;
};

export type Feature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: { type: "Polygon"; coordinates: LngLat[][] } | { type: "MultiPolygon"; coordinates: LngLat[][][] } | { type: "MultiLineString"; coordinates: LngLat[][] };
};

function decodeArcs(t: Topology): Arc[] {
  const [sx, sy] = t.transform?.scale ?? [1, 1];
  const [tx, ty] = t.transform?.translate ?? [0, 0];
  return t.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      if (t.transform) {
        x += dx;
        y += dy;
        return [x * sx + tx, y * sy + ty] as LngLat;
      }
      return [dx, dy] as LngLat;
    });
  });
}

function line(arcs: Arc[], ids: number[]): LngLat[] {
  const out: LngLat[] = [];
  for (const i of ids) {
    const a = i < 0 ? [...arcs[~i]].reverse() : arcs[i];
    out.push(...(out.length ? a.slice(1) : a));
  }
  return out;
}

// Signed shoelace area in square degrees; good enough to rank polygons and place a label.
function ringArea(r: LngLat[]) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
}

function ringCentroid(r: LngLat[]): LngLat {
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const f = r[j][0] * r[i][1] - r[i][0] * r[j][1];
    x += (r[j][0] + r[i][0]) * f;
    y += (r[j][1] + r[i][1]) * f;
    a += f;
  }
  return a === 0 ? r[0] : [x / (3 * a), y / (3 * a)];
}

// Decodes every object in the file. Polygons gain `area` (square degrees) and `lx`/`ly`, a label point inside their
// largest ring.
export function decode(t: Topology): Record<string, Feature[]> {
  const arcs = decodeArcs(t);
  const out: Record<string, Feature[]> = {};
  for (const [name, obj] of Object.entries(t.objects)) {
    out[name] = [];
    for (const g of obj.geometries) {
      const props = { ...(g.properties ?? {}) };
      if (g.type === "Polygon" || g.type === "MultiPolygon") {
        const polys = (g.type === "Polygon" ? [g.arcs as number[][]] : (g.arcs as number[][][])).map((p) => p.map((r) => line(arcs, r)));
        let best = 0;
        let label: LngLat = polys[0]?.[0]?.[0] ?? [0, 0];
        let area = 0;
        for (const p of polys) {
          const pa = ringArea(p[0]);
          area += pa;
          if (pa > best) {
            best = pa;
            label = ringCentroid(p[0]);
          }
        }
        props.area = area;
        props.lx = label[0];
        props.ly = label[1];
        out[name].push({ type: "Feature", properties: props, geometry: { type: "MultiPolygon", coordinates: polys } });
      } else if (g.type === "LineString" || g.type === "MultiLineString") {
        const lines = g.type === "LineString" ? [line(arcs, g.arcs as number[])] : (g.arcs as number[][]).map((l) => line(arcs, l));
        out[name].push({ type: "Feature", properties: props, geometry: { type: "MultiLineString", coordinates: lines } });
      }
    }
  }
  return out;
}
