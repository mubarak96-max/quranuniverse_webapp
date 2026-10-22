// Map projection and camera math for the timeline atlas. Pure functions, shared by the server loader and the client.
import BOX from "./map-box.json";

export type Pt = { x: number; y: number };
export type Camera = { x: number; y: number; z: number };
// w/h: element size in px. l/t/r/b: insets covered by floating panels, so the camera centres on the visible part.
export type Viewport = { w: number; h: number; l: number; t: number; r: number; b: number };
export type Focus = { x: number; y: number; zoom: number; box?: [number, number, number, number] };

// Equirectangular with a standard parallel near 32°N, so the Middle East keeps its shape. Must match tools/borders.mjs.
export const MAP = { w: (BOX.lon1 - BOX.lon0) * BOX.k * BOX.kx, h: (BOX.lat0 - BOX.lat1) * BOX.k };
export const ZOOM = { min: 0.8, max: 28 };

export function project(lat: number, lng: number): Pt | undefined {
  const x = (lng - BOX.lon0) * BOX.k * BOX.kx;
  const y = (BOX.lat0 - lat) * BOX.k;
  return x < 0 || x > MAP.w || y < 0 || y > MAP.h ? undefined : { x: +x.toFixed(1), y: +y.toFixed(1) };
}

const free = (v: Viewport) => ({ w: Math.max(1, v.w - v.l - v.r), h: Math.max(1, v.h - v.t - v.b) });
export const baseScale = (v: Viewport) => Math.min(free(v).w / MAP.w, free(v).h / MAP.h);

export function transformOf(c: Camera, v: Viewport) {
  const f = free(v);
  const s = baseScale(v) * c.z;
  return { s, tx: v.l + f.w / 2 - c.x * s, ty: v.t + f.h / 2 - c.y * s };
}

export function clampCamera(c: Camera): Camera {
  return {
    x: Math.min(MAP.w, Math.max(0, c.x)),
    y: Math.min(MAP.h, Math.max(0, c.y)),
    z: Math.min(ZOOM.max, Math.max(ZOOM.min, c.z)),
  };
}

// A box is fitted with 18% padding; a point uses its own zoom.
export function cameraFor(f: Focus, v: Viewport): Camera {
  if (!f.box) return clampCamera({ x: f.x, y: f.y, z: f.zoom });
  const [x0, y0, x1, y1] = f.box;
  const fr = free(v);
  const base = baseScale(v);
  const z = Math.min(fr.w / (Math.max(x1 - x0, 4) * base), fr.h / (Math.max(y1 - y0, 4) * base)) * 0.82;
  return clampCamera({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: Math.min(z, f.zoom * 1.6) });
}

// Zoom about a screen point: the map point under (px, py) stays under it.
export function zoomAround(c: Camera, v: Viewport, factor: number, px: number, py: number): Camera {
  const { s, tx, ty } = transformOf(c, v);
  const wx = (px - tx) / s;
  const wy = (py - ty) / s;
  const z = Math.min(ZOOM.max, Math.max(ZOOM.min, c.z * factor));
  const s2 = baseScale(v) * z;
  const fr = free(v);
  return clampCamera({ x: wx - (px - v.l - fr.w / 2) / s2, y: wy - (py - v.t - fr.h / 2) / s2, z });
}

// Smooth zoom-and-pan from van Wijk and Nuij (2003): zooms out on long hops, so the eye keeps its bearings.
export function flight(a: Camera, b: Camera, v: Viewport) {
  const rho = Math.SQRT2;
  const base = baseScale(v);
  const width = free(v).w;
  const w0 = width / (base * a.z);
  const w1 = width / (base * b.z);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d2 = dx * dx + dy * dy;
  let S: number;
  let at: (t: number) => Camera;
  if (d2 < 1e-6) {
    S = Math.log(w1 / w0) / rho;
    at = (t) => ({ x: a.x + t * dx, y: a.y + t * dy, z: (width / base) / (w0 * Math.exp(rho * t * S)) });
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + 4 * d2) / (2 * w0 * 2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - 4 * d2) / (2 * w1 * 2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / rho;
    at = (t) => {
      const s = t * S;
      const coshr0 = Math.cosh(r0);
      const u = (w0 / (2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - Math.sinh(r0));
      const w = (w0 * coshr0) / Math.cosh(rho * s + r0);
      return { x: a.x + u * dx, y: a.y + u * dy, z: width / base / w };
    };
  }
  const duration = Math.min(2400, Math.max(700, Math.abs(S) * 900));
  return { duration, at: (t: number) => (t >= 1 ? b : at(t)) };
}

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
