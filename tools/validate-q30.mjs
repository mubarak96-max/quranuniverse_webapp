// Checks every day in content/q30 before it ships: shape, verse references, icons, visuals and quiz answers.
// Run: node tools/validate-q30.mjs [day ...]. Exits non-zero on errors; warnings flag pages that may overflow.
import fs from "node:fs";
import path from "node:path";
import { ICONS, LABELS, DAYS } from "../lib/q30-types.ts";

const root = path.join(import.meta.dirname, "..");
const dir = path.join(root, "content", "q30");
const surahs = JSON.parse(fs.readFileSync(path.join(root, "quran.json"), "utf8"));
const sahih = JSON.parse(fs.readFileSync(path.join(root, "en.sahih.json"), "utf8"));

const KINDS = {
  anatomy: [],
  ring: ["center", "items"],
  panels: ["items"],
  ladder: ["items"],
  tree: ["items"],
  cycle: ["items"],
  timeline: ["items"],
  ledger: ["left", "right"],
  gallery: ["items"],
  columns: ["unit", "items"],
  spectrum: ["from", "to", "items"],
  constellation: ["items"],
  flow: ["items", "here"],
  arc: ["items"],
  shares: ["rows"],
  rings: ["center", "items"],
  decision: ["items"],
};

const words = (s) => (s ?? "").split(/\s+/).filter(Boolean).length;

// "2:30-39" -> [[2,30],...,[2,39]]; a whole surah "112" is allowed for deeper links only.
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
    return { errors: [`invalid JSON: ${e.message}`], warns };
  }
  const want = +file.match(/day-(\d+)\.json/)[1];
  if (d.day !== want) err(`"day" is ${d.day}, file says ${want}`);
  for (const k of ["title", "question", "emblem", "reflect", "memorize", "status"]) if (!d[k]) err(`missing "${k}"`);
  if (!ICONS.includes(d.emblem)) err(`emblem "${d.emblem}" is not an icon`);
  if (!["draft", "review", "approved"].includes(d.status)) err(`status "${d.status}"`);
  if (d.title?.length > 48) warn(`title is ${d.title.length} chars; covers fit about 48`);

  const refOk = (ref, where, { whole = false, max = 0 } = {}) => {
    const r = expand(ref);
    if (r.error) return err(`${where}: ${r.error}`);
    if (r.whole && !whole) err(`${where}: "${ref}" needs a verse number`);
    if (max && r.keys.length > max) err(`${where}: "${ref}" spans ${r.keys.length} verses; show at most ${max} (cite the rest in "context" or "deeper")`);
    return r;
  };

  if (!Array.isArray(d.intro) || d.intro.length < 1 || d.intro.length > 3) err(`"intro" needs 1-3 paragraphs`);
  const introWords = (d.intro ?? []).reduce((n, p) => n + words(p), 0);
  if (introWords > 170) warn(`intro is ${introWords} words; the page fits about 150`);

  const ps = d.passages ?? [];
  if (ps.length < 4 || ps.length > 8 || ps.length % 2) err(`"passages" needs 4, 6 or 8 entries (two per page), has ${ps.length}`);
  ps.forEach((p, i) => {
    const where = `passage ${i + 1} (${p.ref})`;
    const r = refOk(p.ref, where, { max: 6 });
    if (!LABELS[p.label]) err(`${where}: label "${p.label}"`);
    if (!p.context || !p.point) err(`${where}: needs "context" and "point"`);
    if (p.label === "differ" && !p.note) err(`${where}: "differ" needs a "note" naming the readings`);
    if (p.from) {
      if (r?.keys?.length !== 1) err(`${where}: "from" cuts work on a single verse only`);
      else if (!sahih[r.keys[0]].text.includes(p.from)) err(`${where}: "from" text not found in Sahih International`);
      else if (p.to && !sahih[r.keys[0]].text.includes(p.to)) err(`${where}: "to" text not found in Sahih International`);
    }
    if (r?.keys && !p.from) {
      const n = r.keys.reduce((t, k) => t + words(sahih[k]?.text), 0);
      if (n > 95) warn(`${where}: ${n} words of translation; two passages share a page, aim under 80 or cut with "from"/"to"`);
    }
    if (words(p.context) + words(p.point) + words(p.note) > 60) warn(`${where}: context+point+note over 60 words`);
  });

  const v = d.visual ?? {};
  if (!KINDS[v.kind]) err(`visual kind "${v.kind}"`);
  else for (const k of KINDS[v.kind]) if (v[k] === undefined) err(`visual "${v.kind}" needs "${k}"`);
  if (!v.title || !v.caption) err(`visual needs "title" and "caption"`);
  if (v.label && !LABELS[v.label]) err(`visual label "${v.label}"`);
  for (const it of v.items ?? []) {
    if (it.icon && !ICONS.includes(it.icon)) err(`visual icon "${it.icon}" is not an icon`);
    if (it.ref) refOk(it.ref, `visual item "${it.label}"`, { whole: true });
  }
  if (Array.isArray(v.items) && v.items.length > 14 && v.kind !== "tree" && v.kind !== "constellation") warn(`visual has ${v.items.length} items; over 14 crowds a page`);
  if (v.kind === "flow" && !(v.here >= 0 && v.here < (v.items?.length ?? 0))) err(`flow "here" must index an item`);
  if (v.kind === "tree") {
    const ids = new Set((v.items ?? []).map((i) => i.id));
    for (const it of v.items ?? []) if (it.parent && !ids.has(it.parent)) err(`tree item "${it.id}" has unknown parent "${it.parent}"`);
  }

  const w = d.word ?? {};
  for (const k of ["ar", "tr", "meaning", "nuance"]) if (!w[k]) err(`word needs "${k}"`);
  if (!Array.isArray(w.root) || w.root.length < 2 || w.root.length > 4) err(`word.root needs 2-4 Arabic letters`);
  (w.refs ?? []).forEach((r) => refOk(r, "word.refs"));
  if (!d.mixup?.myth || !d.mixup?.truth) err(`mixup needs "myth" and "truth"`);
  if (words(d.mixup?.truth) > 80) warn(`mixup.truth is ${words(d.mixup?.truth)} words`);
  (d.mixup?.refs ?? []).forEach((r) => refOk(r, "mixup.refs"));

  if (!Array.isArray(d.remember) || d.remember.length !== 3) err(`"remember" needs exactly 3 points`);
  const mem = refOk(d.memorize ?? "", "memorize", { max: 2 });
  if (mem?.keys) {
    const n = mem.keys.reduce((t, k) => t + words(sahih[k]?.text), 0);
    if (n > 45) warn(`memorize verse is ${n} words; pick a short verse`);
  }

  const qs = d.quiz ?? [];
  if (qs.length !== 3) err(`"quiz" needs 3 questions`);
  qs.forEach((q, i) => {
    if (!Array.isArray(q.options) || q.options.length < 3 || q.options.length > 4) err(`quiz ${i + 1}: 3-4 options`);
    if (!(q.answer >= 0 && q.answer < (q.options?.length ?? 0))) err(`quiz ${i + 1}: answer index out of range`);
    if (!q.why) err(`quiz ${i + 1}: needs "why"`);
  });

  (d.deeper ?? []).forEach((r) => refOk(r, "deeper", { whole: true }));
  (d.connections ?? []).forEach((c) => (c >= 1 && c <= DAYS && c !== d.day) || err(`connection ${c}`));
  (d.links ?? []).forEach((l) => l.href?.startsWith("/") || err(`link "${l.label}" must be a site path`));
  return { errors, warns };
}

const only = process.argv.slice(2).map(Number);
const files = fs
  .readdirSync(dir)
  .filter((f) => /^day-\d\d\.json$/.test(f))
  .filter((f) => !only.length || only.includes(+f.slice(4, 6)))
  .sort();
let failed = 0;
for (const f of files) {
  const { errors, warns } = check(f);
  if (errors.length) failed++;
  if (errors.length || warns.length) {
    console.log(`\n${f}`);
    errors.forEach((e) => console.log(`  error: ${e}`));
    warns.forEach((w) => console.log(`  warn:  ${w}`));
  }
}
const missing = only.length ? [] : Array.from({ length: DAYS }, (_, i) => i + 1).filter((n) => !files.includes(`day-${String(n).padStart(2, "0")}.json`));
if (missing.length) console.log(`\nmissing days: ${missing.join(", ")}`);
console.log(`\n${files.length} day(s) checked, ${failed} with errors.`);
process.exit(failed || missing.length ? 1 : 0);
