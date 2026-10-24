// MapLibre runs its tile work in a separate worker file that bundlers do not copy. This puts the installed version in
// public/vendor so the atlas can point setWorkerUrl at it. Runs before dev and build.
import fs from "node:fs";
import path from "node:path";

const src = path.join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const out = path.join(process.cwd(), "public", "vendor");
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(src, path.join(out, "maplibre-gl-worker.mjs"));
