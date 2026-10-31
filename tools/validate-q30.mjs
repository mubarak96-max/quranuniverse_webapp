// Checks every day in content/q30 before it ships: shape, chapters and lenses, verse references, images, figures,
// quiz answers and reading length. Run: node tools/validate-q30.mjs [day ...]. Exits non-zero on errors.
import fs from "node:fs";
import path from "node:path";
import { LENSES, DAYS } from "../lib/q30-types.ts";

const root = path.join(import.meta.dirname, "..");
const dir = path.join(root, "content", "q30");
const surahs = JSON.parse(fs.readFileSync(path.join(root, "quran.json"), "utf8"));
const sahih = JSON.parse(fs.readFileSync(path.join(root, "en.sahih.json"), "utf8"));

const FIGURES = { timeline: ["items"], steps: ["items"], compare: ["left", "right"], facts: ["items"], anatomy: [] };
const BLOCKS = ["p", "h", "verse", "quote", "note", "list", "image", "figure", "word"];

const words = (s) => (s ?? "").split(/\s+/).filter(Boolean).length;

// "2:30-39" -> keys 2:30..2:39; a whole surah "112" is allowed for deeper links only.
function expand(ref) {
  const m = /^(\d+)(?::(\d+)(?:-(\d+))?)?$/.exec(ref);
  if (!m) return { error: `bad reference "${ref}"` };
  const s = +m[1];
  const surah = surahs[s - 1];
  if (!surah) return { error: `no surah ${s} in "${ref}"` };
  if (!m[2]) return { whole: true, keys: [] };
  const a = +m[2];
  const b = m[3] ? +m[3] : a;
  if (a < 1 || b > surah.total_verses || b < a) return { error: `"${ref}" is outside surah ${s} (1-${surah.total_verses})` };
  return { keys: Array.from({ length: b - a + 1 }, (_, i) => `${s}:${a + i}`) };
}

function check(file) {
  const errors = [];
  const warns = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warns.push(m);
  let d;
  try {
    d = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
  } catch (e) {
    return { errors: [`invalid JSON: ${e.message}`], warns, read: 0 };
  }
  const want = +file.match(/day-(\d+)\.json/)[1];
  const tag = String(want).padStart(2, "0");
  if (d.day !== want) err(`"day" is ${d.day}, file says ${want}`);
  for (const k of ["title", "question", "summary", "reflect", "carry", "status"]) if (!d[k]) err(`missing "${k}"`);
  if (!["draft", "review", "approved"].includes(d.status)) err(`status "${d.status}"`);
  if (d.title?.length > 52) warn(`title is ${d.title.length} chars; aim under 52`);
  if (words(d.summary) > 45) warn(`summary is ${words(d.summary)} words; aim under 45`);
  if (!d.cover?.alt || !d.cover?.prompt) err(`cover needs "alt" and "prompt"`);

  const refOk = (ref, where, { whole = false, max = 0 } = {}) => {
    const r = expand(ref);
    if (r.error) return err(`${where}: ${r.error}`);
    if (r.whole && !whole) err(`${where}: "${ref}" needs a verse number`);
    if (max && r.keys.length > max) err(`${where}: "${ref}" spans ${r.keys.length} verses; show at most ${max}`);
    return r;
  };
  // Inline references in prose, e.g. "(2:255)" or "(25:32-33)", become links, so they must exist too.
  const inline = (text, where) => {
    for (const m of (text ?? "").matchAll(/\b(\d{1,3}:\d{1,3}(?:-\d{1,3})?)\b/g)) refOk(m[1], `${where} inline ${m[1]}`);
  };

  let read = 0;
  let images = 0;
  let wordsBlocks = 0;
  const chapters = d.chapters ?? [];
  if (chapters.length < 6 || chapters.length > 10) err(`"chapters" needs 6-10 entries, has ${chapters.length}`);
  const lenses = new Set(chapters.map((c) => c.lens));
  if (lenses.size < 5) err(`only ${lenses.size} different lenses; use at least 5 of ${Object.keys(LENSES).join(", ")}`);
  chapters.forEach((c, ci) => {
    const where = `chapter ${ci + 1} (${c.title})`;
    if (!LENSES[c.lens]) err(`${where}: lens "${c.lens}"`);
    if (!c.title) err(`chapter ${ci + 1}: missing title`);
    if (!Array.isArray(c.blocks) || !c.blocks.length) return err(`${where}: no blocks`);
    let chapterWords = 0;
    c.blocks.forEach((b, bi) => {
      const keys = Object.keys(b).filter((k) => BLOCKS.includes(k));
      const at = `${where} block ${bi + 1}`;
      if (keys.length !== 1) return err(`${at}: needs exactly one of ${BLOCKS.join(", ")}, has ${Object.keys(b).join(", ")}`);
      const k = keys[0];
      if (k === "p" || k === "h" || k === "note" || k === "quote") {
        chapterWords += words(b[k]);
        inline(b[k], at);
      }
      if (k === "quote" && !b.by) err(`${at}: quote needs "by"`);
      if (k === "list") {
        if (!Array.isArray(b.list) || b.list.length < 2) err(`${at}: list needs 2+ items`);
        for (const it of b.list ?? []) {
          chapterWords += words(it);
          inline(it, at);
        }
      }
      if (k === "verse") {
        const r = refOk(b.verse, at, { max: 8 });
        if (b.from) {
          if (r?.keys?.length !== 1) err(`${at}: "from" cuts work on a single verse only`);
          else if (!sahih[r.keys[0]].text.includes(b.from)) err(`${at}: "from" text not found in Sahih International`);
          else if (b.to && !sahih[r.keys[0]].text.includes(b.to)) err(`${at}: "to" text not found in Sahih International`);
        }
        if (r?.keys) chapterWords += r.keys.reduce((t, key) => t + words(sahih[key]?.text), 0);
      }
      if (k === "image") {
        images++;
        if (!new RegExp(`^day-${tag}-[a-z0-9-]+$`).test(b.image)) err(`${at}: image name must look like "day-${tag}-something"`);
        if (!b.alt || !b.prompt) err(`${at}: image needs "alt" and "prompt"`);
      }
      if (k === "figure") {
        const f = b.figure ?? {};
        if (!FIGURES[f.kind]) err(`${at}: figure kind "${f.kind}"`);
        else for (const need of FIGURES[f.kind]) if (f[need] === undefined) err(`${at}: figure "${f.kind}" needs "${need}"`);
        if (!f.title) err(`${at}: figure needs "title"`);
        if (Array.isArray(f.items) && f.items.length > 10) warn(`${at}: figure has ${f.items.length} items; over 10 crowds a page`);
      }
      if (k === "word") {
        wordsBlocks++;
        const w = b.word ?? {};
        for (const need of ["ar", "tr", "meaning", "nuance"]) if (!w[need]) err(`${at}: word needs "${need}"`);
        if (!Array.isArray(w.root) || w.root.length < 2 || w.root.length > 4) err(`${at}: word.root needs 2-4 Arabic letters`);
        chapterWords += words(w.nuance);
      }
    });
    if (chapterWords > 650) warn(`${where}: ${chapterWords} words; a chapter reads best under 600`);
    read += chapterWords;
  });
  if (images > 2) err(`${images} inline images; use at most 2 (the cover is separate)`);
  if (wordsBlocks < 1) err(`no "word" block; every day teaches one Arabic word`);
  if (read < 2000) warn(`${read} words to read; a day should be 2,200-3,200`);
  if (read > 3400) warn(`${read} words to read; a day should be 2,200-3,200`);

  const carry = refOk(d.carry ?? "", "carry", { max: 2 });
  if (carry?.keys) {
    const n = carry.keys.reduce((t, k) => t + words(sahih[k]?.text), 0);
    if (n > 45) warn(`carry verse is ${n} words; pick a short verse`);
  }

  const qs = d.quiz ?? [];
  if (qs.length < 3 || qs.length > 5) err(`"quiz" needs 3-5 questions`);
  qs.forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 4) err(`quiz ${i + 1}: 3-4 options`);
    if (!(q.answer >= 0 && q.answer < (q.options?.length ?? 0))) err(`quiz ${i + 1}: answer index out of range`);
    if (!q.why) err(`quiz ${i + 1}: needs "why"`);
  });

  (d.deeper ?? []).forEach((r) => refOk(r, "deeper", { whole: true }));
  (d.connections ?? []).forEach((c) => (c >= 1 && c <= DAYS && c !== d.day) || err(`connection ${c}`));
  (d.links ?? []).forEach((l) => l.href?.startsWith("/") || err(`link "${l.label}" must be a site path`));
  return { errors, warns, read };
}

const only = process.argv.slice(2).map(Number);
const files = fs
  .readdirSync(dir)
  .filter((f) => /^day-\d\d\.json$/.test(f))
  .filter((f) => !only.length || only.includes(+f.slice(4, 6)))
  .sort();
let failed = 0;
for (const f of files) {
  const { errors, warns, read } = check(f);
  if (errors.length) failed++;
  console.log(`\n${f}: ${read} words, about ${Math.round(read / 200)} min`);
  errors.forEach((e) => console.log(`  error: ${e}`));
  warns.forEach((w) => console.log(`  warn:  ${w}`));
}
const missing = only.length ? [] : Array.from({ length: DAYS }, (_, i) => i + 1).filter((n) => !files.includes(`day-${String(n).padStart(2, "0")}.json`));
if (missing.length) console.log(`\nmissing days: ${missing.join(", ")}`);
console.log(`\n${files.length} day(s) checked, ${failed} with errors.`);
process.exit(failed || missing.length ? 1 : 0);
