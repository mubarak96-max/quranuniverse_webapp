// Illustrations for Quran in 30 Days. Every prompt lives in the day files (cover.prompt and image blocks); this script
// asks the Codex CLI to paint each missing one into .cache/q30-art, then writes web-sized WebP files to public/q30.
// Run: node tools/q30-images.mjs [--only name,name] [--jobs 3] [--redo]. Needs `codex` on PATH; sharp comes with Next.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.join(import.meta.dirname, "..");
const days = path.join(root, "content", "q30");
const art = path.join(root, ".cache", "q30-art");
const out = path.join(root, "public", "q30");

// One look across the whole course. The "no people" rule matters: Muslims do not depict prophets or companions.
const STYLE =
  "Style: painterly cinematic illustration, gouache and oil texture, soft film grain, deep shadows and warm glowing light, " +
  "ink-blue, teal and gold palette, quiet and reverent mood, highly detailed, wide landscape 3:2 composition. " +
  "Absolutely no people, no human or angelic figures, no silhouettes of people, no faces, no hands, no text, no letters, " +
  "no calligraphy, no watermark. Historical scenes are ancient: no modern buildings, roads, vehicles or electric lights.";

const HOME = {
  name: "home",
  prompt:
    "A vast desert valley at the last moment of night before dawn. A winding path of thirty small glowing oil lamps leads " +
    "from the foreground across the dunes toward a distant range of mountains, where the first gold light is breaking. " +
    "An immense sky of stars fades into deep blue above.",
};

const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const only = opt("--only", "")?.split(",").filter(Boolean) ?? [];
const jobs = Number(opt("--jobs", 3));

function prompts() {
  const list = [HOME];
  for (const f of fs.readdirSync(days).filter((f) => /^day-\d\d\.json$/.test(f)).sort()) {
    const d = JSON.parse(fs.readFileSync(path.join(days, f), "utf8"));
    const tag = f.slice(0, 6);
    if (d.cover?.prompt) list.push({ name: tag, prompt: d.cover.prompt });
    for (const c of d.chapters ?? []) for (const b of c.blocks) if (b.image) list.push({ name: b.image, prompt: b.prompt });
  }
  return list.filter((p) => !only.length || only.includes(p.name));
}

function paint({ name, prompt }) {
  const target = path.join(art, `${name}.png`);
  const task =
    `Use your image generation tool to create exactly one image, then copy the generated PNG to ${target.replace(/\\/g, "/")}. ` +
    `Do nothing else. Image prompt: ${prompt} ${STYLE}`;
  return new Promise((resolve) => {
    const p = spawn("codex exec --skip-git-repo-check -s workspace-write -", { cwd: root, shell: true });
    p.stdin.end(task);
    p.stdout.resume();
    p.stderr.resume();
    p.on("close", () => resolve(fs.existsSync(target)));
  });
}

async function web(name) {
  const src = path.join(art, `${name}.png`);
  await sharp(src).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(out, `${name}.webp`));
  // The day list shows small thumbnails; covers get one so the list stays light.
  if (/^day-\d\d$/.test(name) || name === "home")
    await sharp(src).resize({ width: 640 }).webp({ quality: 74 }).toFile(path.join(out, `${name}-sm.webp`));
}

fs.mkdirSync(art, { recursive: true });
fs.mkdirSync(out, { recursive: true });
const todo = prompts().filter((p) => flag("--redo") || !fs.existsSync(path.join(art, `${p.name}.png`)));
console.log(`${todo.length} image(s) to paint`);
let next = 0;
const failed = [];
await Promise.all(
  Array.from({ length: jobs }, async () => {
    while (next < todo.length) {
      const p = todo[next++];
      const ok = await paint(p);
      console.log(`${ok ? "painted" : "FAILED "} ${p.name}`);
      if (!ok) failed.push(p.name);
    }
  }),
);
for (const p of prompts()) {
  const src = path.join(art, `${p.name}.png`);
  const dst = path.join(out, `${p.name}.webp`);
  if (fs.existsSync(src) && (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(src).mtimeMs)) await web(p.name);
}
if (failed.length) console.log(`failed: ${failed.join(",")}`);
process.exit(failed.length ? 1 : 0);
