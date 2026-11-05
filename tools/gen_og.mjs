// Writes public/og/surah/<slug>.png, the link preview shared by a surah page and every verse in it (see
// surahOgImage in lib/data.ts). One image per surah (114) rather than per verse (6,236) keeps the build fast.
// Static files rather than a route, so they work the same under `next build` (export) and the vinext worker.
// Arabic is left out on purpose: the image renderer does not join Arabic letters correctly.
import "./ts-hooks.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createElement as h } from "react";
// next/og has no ESM export map; this is the Node build it re-exports.
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";

const { getSurahs, surahSlug } = await import("../lib/data.ts");
const { surahMeaning } = await import("../lib/surah-meta.ts");

const INK = "#233735";
const GREEN = "#22665e";
const GOLD = "#a87a26";
const MUTED = "#62716b";
const flex = (style, ...children) => h("div", { style: { display: "flex", ...style } }, ...children);

function card(s) {
  const meaning = surahMeaning(s.id);
  return flex(
    {
      width: "100%",
      height: "100%",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "64px 72px",
      background: "radial-gradient(120% 100% at 15% 0%, #fffef9 0%, #f6f5ef 55%, #e8e4d4 100%)",
      color: INK,
      fontFamily: "serif",
    },
    flex(
      { fontSize: 26, letterSpacing: 5, textTransform: "uppercase", color: GOLD },
      `Surah ${s.id} of 114 · ${s.type === "meccan" ? "Makkah" : "Madinah"}`,
    ),
    flex(
      { flexDirection: "column" },
      flex({ fontSize: 120, lineHeight: 1.05, letterSpacing: -3, color: GREEN }, s.transliteration),
      meaning && meaning.toLowerCase() !== s.transliteration.toLowerCase()
        ? flex({ fontSize: 46, color: MUTED, marginTop: 10, fontStyle: "italic" }, meaning)
        : null,
      flex({ width: 120, height: 3, background: GOLD, marginTop: 36 }),
      flex(
        { fontSize: 32, marginTop: 30, maxWidth: 960, lineHeight: 1.35 },
        `${s.total_verses} verses in Arabic and English, with word-by-word meaning, a simple card for every verse and Tafsir Ibn Kathir`,
      ),
    ),
    flex({ fontSize: 26, color: MUTED }, "Quran Universe · Understand every verse of the Quran"),
  );
}

const dir = path.join(import.meta.dirname, "..", "public", "og", "surah");
fs.mkdirSync(dir, { recursive: true });

// Rendering takes ~40s, so skip it when neither this design nor the surah data has changed since the last run.
const stampFile = path.join(dir, ".stamp");
const stamp = crypto
  .createHash("sha1")
  .update(fs.readFileSync(import.meta.filename))
  .update(JSON.stringify(getSurahs().map((s) => [s.id, s.transliteration, s.type, s.total_verses, surahMeaning(s.id)])))
  .digest("hex");
const have = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).length;
if (have === 114 && fs.existsSync(stampFile) && fs.readFileSync(stampFile, "utf8") === stamp) {
  console.log("og images: up to date");
  process.exit(0);
}
let bytes = 0;
for (const s of getSurahs()) {
  const png = Buffer.from(await new ImageResponse(card(s), { width: 1200, height: 630 }).arrayBuffer());
  fs.writeFileSync(path.join(dir, `${surahSlug(s)}.png`), png);
  bytes += png.length;
}
fs.writeFileSync(stampFile, stamp);
console.log(`og images: 114 surahs, ${(bytes / 1024 / 1024).toFixed(1)} MB`);
