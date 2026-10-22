// Journeys live in content/journeys/<id>.json: acts of scenes that retell one life on the timeline.
// Verse text and Arabic are filled in here from the Quran data, so content files only name references.
import fs from "node:fs";
import path from "node:path";
import { getSurah, surahHref } from "./data";
import type { Act, Ayah, Interact, Journey, Mood, Scene } from "./journey-types";
import { verse } from "./timeline";

const ROOT = path.join(process.cwd(), "content", "journeys");

// "words" slices the Arabic to match an excerpt of the translation: [first word, end word) by index.
type RawAyah = string | { ref: string; from?: string; to?: string; words?: [number, number] };
type RawScene = Omit<Scene, "act" | "ayah" | "refs" | "mood"> & { mood: Mood; ayah?: RawAyah; refs?: string[] };
type RawJourney = Omit<Journey, "acts" | "scenes"> & { acts: { title: string; scenes: RawScene[] }[] };

function ayah(raw: RawAyah): Ayah {
  const { ref, from, to, words } = typeof raw === "string" ? { ref: raw } : raw;
  const [surah, n] = ref.split(":").map(Number);
  const arabic = getSurah(surah)!.verses[n - 1].text;
  const v = verse(ref, true, from ? { from, to } : undefined);
  if (!v.text) throw new Error(`Journey verse ${ref} has no text; check its "from" and "to" excerpt.`);
  if (words) return { ...v, ar: arabic.split(" ").slice(...words).join(" ") };
  return { ...v, ar: from ? undefined : arabic };
}

function interact(raw: Interact): Interact {
  return {
    ...raw,
    items: raw.items.map((i) => (i.ref ? { ...i, href: surahHref(+i.ref.split(":")[0], +i.ref.split(":")[1]) } : i)),
  };
}

const cache = new Map<string, Journey>();

export const getJourneyIds = () =>
  fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));

export function getJourney(id: string): Journey | undefined {
  if (cache.has(id)) return cache.get(id);
  const file = path.join(ROOT, `${id}.json`);
  if (!fs.existsSync(file)) return undefined;
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as RawJourney;
  const acts: Act[] = [];
  const scenes: Scene[] = [];
  raw.acts.forEach((a, n) => {
    acts.push({ title: a.title, start: scenes.length, count: a.scenes.length });
    for (const s of a.scenes) {
      scenes.push({
        ...s,
        act: n,
        ayah: s.ayah ? ayah(s.ayah) : undefined,
        refs: (s.refs ?? []).map((r) => verse(r, false)),
        interact: s.interact ? interact(s.interact) : undefined,
      });
    }
  });
  const journey: Journey = { ...raw, acts, scenes };
  cache.set(id, journey);
  return journey;
}
