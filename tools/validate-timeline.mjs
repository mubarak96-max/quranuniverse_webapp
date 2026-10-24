// Checks the timeline content in content/timeline before a build: valid JSON, unique ids, Quran refs that exist,
// quote excerpts that match the translation, links that resolve, and known enum values. Names in `who` lists that
// match no person are listed as a warning, since they are allowed but do not link.
//   node tools/validate-timeline.mjs        (exit code 1 on any error)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content", "timeline");
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

function read(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch (e) {
    err(rel, `cannot parse: ${e.message}`);
    return undefined;
  }
}
const readIf = (rel) => (fs.existsSync(path.join(ROOT, rel)) ? read(rel) : undefined);

const quran = JSON.parse(fs.readFileSync(path.join(process.cwd(), "quran.json"), "utf8"));
const sahih = JSON.parse(fs.readFileSync(path.join(process.cwd(), "en.sahih.json"), "utf8"));
const PRECISION = new Set(["exact", "approx", "traditional", "unknown"]);
const GROUPS = new Set(["unseen", "quran", "hadith", "family", "companion", "scholar", "ruler"]);
const KINDS = new Set(["prophet", "revelation", "battle", "empire", "knowledge", "world", "event"]);
const HADITH_URL = /^https:\/\/sunnah\.com\/[a-z]+:[0-9]+[a-z]?$/;

function checkRef(where, ref) {
  const m = /^(\d+):(\d+)(?:-(\d+))?$/.exec(String(ref));
  if (!m) return err(where, `bad verse ref "${ref}"`);
  const [s, a, b] = [+m[1], +m[2], m[3] ? +m[3] : undefined];
  const total = quran[s - 1]?.total_verses;
  if (!total) return err(where, `no surah ${s} in "${ref}"`);
  if (a < 1 || a > total || (b !== undefined && (b < a || b > total))) err(where, `verse out of range "${ref}" (surah ${s} has ${total})`);
}

function checkQuote(where, q) {
  if (q === undefined) return;
  if (typeof q === "string") return checkRef(where, q);
  checkRef(where, q.ref);
  const [s, range] = String(q.ref).split(":");
  const text = sahih[`${s}:${String(range).split("-")[0]}`]?.text ?? "";
  if (q.from && !text.includes(q.from)) err(where, `quote "from" not in ${q.ref}: "${q.from}"`);
  if (q.to && !text.includes(q.to)) err(where, `quote "to" not in ${q.ref}: "${q.to}"`);
}

function checkHadith(where, list) {
  for (const h of list ?? []) {
    if (!h.label) err(where, "hadith without a label");
    if (!HADITH_URL.test(h.url ?? "")) err(where, `hadith url "${h.url}" is not a sunnah.com reference`);
  }
}

function checkPlace(where, p) {
  if (!p) return;
  if (!p.name) err(where, "place without a name");
  if ((p.lat === undefined) !== (p.lng === undefined)) err(where, "place has only one of lat/lng");
  if (p.lat !== undefined && (Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180)) err(where, `place out of range ${p.lat},${p.lng}`);
}

// ---------- load ----------
const eraFiles = fs.readdirSync(path.join(ROOT, "eras")).filter((f) => f.endsWith(".json")).sort();
const eras = eraFiles.map((f) => [f, read(path.join("eras", f))]).filter(([, e]) => e);
const states = read("states.json") ?? [];
const prophets = read("prophets.json") ?? [];
const villainFile = read("villains.json") ?? { villains: [], ages: [] };
const nations = readIf("nations.json") ?? [];
const sites = readIf("places.json") ?? [];
const faiths = readIf("faiths.json");
const peopleFiles = fs.existsSync(path.join(ROOT, "people")) ? fs.readdirSync(path.join(ROOT, "people")).filter((f) => f.endsWith(".json")).sort() : [];
const people = peopleFiles.flatMap((f) => (read(path.join("people", f)) ?? []).map((p) => ({ ...p, _file: f })));

// ---------- ids ----------
function idSet(kind, list, where = (x) => kind) {
  const ids = new Set();
  for (const x of list) {
    if (!x.id) err(where(x), "entry without an id");
    else if (ids.has(x.id)) err(where(x), `duplicate ${kind} id "${x.id}"`);
    ids.add(x.id);
  }
  return ids;
}
const ids = {
  events: idSet(
    "event",
    eras.flatMap(([f, e]) => e.events.map((x) => ({ ...x, _f: f }))),
    (x) => `eras/${x._f}`,
  ),
  prophets: idSet("prophet", prophets, () => "prophets.json"),
  villains: idSet("villain", villainFile.villains, () => "villains.json"),
  people: idSet("person", people, (x) => `people/${x._file}`),
  polities: idSet("polity", states, () => "states.json"),
  places: idSet("place", sites, () => "places.json"),
  nations: idSet("nation", nations, () => "nations.json"),
};
const eraIds = new Set(eras.map(([, e]) => e.id));
for (const id of ids.people) if (ids.villains.has(id) || ids.prophets.has(id)) err("people", `person id "${id}" is also a prophet or villain id`);

function checkLinks(where, links) {
  for (const [key, list] of Object.entries(links ?? {})) {
    if (!ids[key]) {
      err(where, `unknown link type "${key}"`);
      continue;
    }
    for (const id of list ?? []) if (!ids[key].has(id)) err(where, `link to missing ${key} "${id}"`);
  }
}

// ---------- names, for `who` lists ----------
const norm = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ﷺ/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const names = new Map();
const claim = (n, owner) => {
  const k = norm(n);
  if (!k) return;
  if (names.has(k) && names.get(k) !== owner) warn("names", `"${n}" is claimed by ${names.get(k)} and ${owner}; the first wins`);
  else names.set(k, owner);
};
for (const p of prophets) claim(p.name, `prophet ${p.id}`);
claim("Muhammad", "prophet muhammad");
claim("The Prophet", "prophet muhammad");
for (const v of villainFile.villains) claim(v.name, `villain ${v.id}`);
for (const p of people) for (const n of [p.name, ...(p.aliases ?? [])]) claim(n, `person ${p.id}`);
for (const n of nations) claim(n.name, `nation ${n.id}`);

// ---------- eras ----------
const unlinked = new Map();
for (const [f, era] of eras) {
  const where = `eras/${f}`;
  for (const e of era.events) {
    const w = `${where} ${e.id}`;
    if (!e.title || !e.what) err(w, "missing title or what");
    if (!e.year || !PRECISION.has(e.year.precision)) err(w, `bad year/precision ${JSON.stringify(e.year)}`);
    if (e.year?.to !== undefined && e.year.to < e.year.ce) err(w, "year.to before year.ce");
    if (!KINDS.has(e.kind)) err(w, `bad kind "${e.kind}"`);
    if ((e.kind === "world" || e.kind === "empire") && !e.tie) warn(w, "world/empire event without a tie");
    checkPlace(w, e.place);
    for (const v of e.verses ?? []) checkRef(w, v);
    checkQuote(w, e.quote);
    checkHadith(w, e.hadith);
    checkLinks(w, e.links);
    for (const r of e.routes ?? []) for (const pt of r.points) if (pt.length < 2 || Math.abs(pt[0]) > 90 || Math.abs(pt[1]) > 180) err(w, `bad route point ${pt}`);
    for (const n of e.who ?? []) if (!names.has(norm(n))) unlinked.set(n, (unlinked.get(n) ?? 0) + 1);
  }
}

// ---------- people ----------
for (const p of people) {
  const w = `people/${p._file} ${p.id}`;
  if (!GROUPS.has(p.group)) err(w, `bad group "${p.group}"`);
  if (!p.name || !p.role || !p.line || !p.when) err(w, "missing name, role, line or when");
  if (!eraIds.has(p.era)) err(w, `unknown era "${p.era}"`);
  if (p.from !== undefined && !PRECISION.has(p.precision)) err(w, `from without a valid precision`);
  if (p.from !== undefined && p.to !== undefined && p.to < p.from) err(w, "to before from");
  if (p.polity && !ids.polities.has(p.polity)) err(w, `unknown polity "${p.polity}"`);
  if (p.after && !ids.people.has(p.after)) err(w, `unknown predecessor "${p.after}"`);
  checkPlace(w, p.place);
  for (const v of p.verses ?? []) checkRef(w, v);
  checkQuote(w, p.quote);
  checkHadith(w, p.hadith);
  checkLinks(w, p.links);
}

// ---------- villains, prophets, nations, places, states ----------
const ageIds = new Set(villainFile.ages.map((a) => a.id));
for (const v of villainFile.villains) {
  const w = `villains.json ${v.id}`;
  if (!ageIds.has(v.age)) err(w, `unknown age "${v.age}"`);
  if (v.stop && !ids.events.has(v.stop)) err(w, `stop "${v.stop}" is not an event`);
  if (v.against?.prophet && !ids.prophets.has(v.against.prophet)) err(w, `unknown prophet "${v.against.prophet}"`);
  checkQuote(w, v.verse);
  checkQuote(w, v.said);
  for (const m of v.mentions ?? []) checkRef(w, m);
  checkHadith(w, v.hadith);
  checkPlace(w, v.place);
}
for (const p of prophets) {
  checkRef(`prophets.json ${p.id}`, p.verse);
  if (p.stop && !ids.events.has(p.stop)) err(`prophets.json ${p.id}`, `stop "${p.stop}" is not an event`);
}
for (const n of nations) {
  const w = `nations.json ${n.id}`;
  if (n.prophet && !ids.prophets.has(n.prophet)) err(w, `unknown prophet "${n.prophet}"`);
  if (n.polity && !ids.polities.has(n.polity)) err(w, `unknown polity "${n.polity}"`);
  for (const v of n.verses ?? []) checkRef(w, v);
  checkQuote(w, n.quote);
  checkPlace(w, n.place);
  checkLinks(w, n.links);
}
for (const s of sites) {
  const w = `places.json ${s.id}`;
  if (typeof s.lat !== "number" || typeof s.lng !== "number") err(w, "place needs lat and lng");
  for (const v of s.verses ?? []) checkRef(w, v);
  checkHadith(w, s.hadith);
  checkLinks(w, s.links);
}
for (const s of states) {
  const w = `states.json ${s.id}`;
  if (!(s.from <= s.to)) err(w, "from after to");
  checkPlace(w, s.capital);
  if (s.dataset) warn(w, "still has the old `dataset` field; use `clio`");
}

// Cliopatria names must exist in the dataset for the map to colour them; the list is only available when the tool's
// cache is present, so this check is skipped otherwise.
const namesFile = path.join(process.cwd(), ".cache", "borders", "names.json");
if (faiths && fs.existsSync(namesFile)) {
  const known = new Set(JSON.parse(fs.readFileSync(namesFile, "utf8")));
  for (const [faith, list] of Object.entries(faiths.faiths)) for (const n of list) if (!known.has(n)) err("faiths.json", `${faith}: "${n}" is not a Cliopatria name`);
  for (const s of states) for (const n of s.clio ?? []) if (!known.has(n)) err(`states.json ${s.id}`, `"${n}" is not a Cliopatria name`);
}

const top = [...unlinked].sort((a, b) => b[1] - a[1]);
if (top.length) warn("who", `${top.length} names do not link to anyone, e.g. ${top.slice(0, 25).map(([n]) => n).join(", ")}`);

const count = (o) => Object.entries(o).map(([k, v]) => `${v.size} ${k}`).join(", ");
console.log(`timeline: ${count(ids)}`);
for (const w of warnings) console.log(`warning ${w}`);
for (const e of errors) console.log(`error   ${e}`);
console.log(`${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
