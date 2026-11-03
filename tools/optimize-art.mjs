// Converts the timeline illustrations (PNG, as generated) into the WebP files the pages use:
//   public/timeline/art/<name>.webp     1600 px wide, for heroes
//   public/timeline/art/<name>-sm.webp   640 px wide, for cards, the chapter strip and the map spotlight
// Usage: node tools/optimize-art.mjs <folder with PNGs>
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const src = process.argv[2];
if (!src) {
  console.error("Usage: node tools/optimize-art.mjs <folder with PNGs>");
  process.exit(1);
}
const out = path.join(process.cwd(), "public", "timeline", "art");
fs.mkdirSync(out, { recursive: true });

for (const file of fs.readdirSync(src).filter((f) => f.endsWith(".png"))) {
  const name = file.replace(/\.png$/, "");
  const input = path.join(src, file);
  await sharp(input).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(out, `${name}.webp`));
  await sharp(input).resize({ width: 640 }).webp({ quality: 72 }).toFile(path.join(out, `${name}-sm.webp`));
  const kb = (f) => Math.round(fs.statSync(path.join(out, f)).size / 1024);
  console.log(`${name}: ${kb(`${name}.webp`)} KB / ${kb(`${name}-sm.webp`)} KB`);
}
