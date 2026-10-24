"use client";

import { useEffect, useState } from "react";
import { decode, type Feature, type Topology } from "./topo";

type Band = { from: number; to: number; file: string };
export type Land = { land: Feature[]; rivers: Feature[] };

// Module-level caches: each file is fetched and decoded once per page load and shared by every view.
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function load<T>(file: string, parse: (raw: unknown) => T): Promise<T> {
  if (cache.has(file)) return Promise.resolve(cache.get(file) as T);
  let p = inflight.get(file);
  if (!p) {
    p = fetch(`/borders/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${file}: ${r.status}`);
        return r.json();
      })
      .then((raw) => {
        const data = parse(raw);
        cache.set(file, data);
        inflight.delete(file);
        return data;
      });
    inflight.set(file, p);
  }
  return p as Promise<T>;
}

const bands = () => load("index.json", (raw) => (raw as { bands: Band[] }).bands);
const features = (raw: unknown) => Object.values(decode(raw as Topology)).flat();
const bandFor = (list: Band[], year: number) => list.find((b) => year >= b.from && year <= b.to);

export function prefetchBorders(year: number | undefined) {
  if (year === undefined) return;
  bands()
    .then((list) => {
      const b = bandFor(list, year);
      if (b) load(b.file, features);
    })
    .catch(() => undefined);
}

export const prefetchLand = () => {
  load("land.json", features).catch(() => undefined);
};

export function useLand(): Land | undefined {
  const [land, setLand] = useState<Land>();
  useEffect(() => {
    let live = true;
    load("land.json", features)
      .then((all) => {
        if (!live) return;
        setLand({
          land: all.filter((f) => f.geometry.type !== "MultiLineString"),
          rivers: all.filter((f) => f.geometry.type === "MultiLineString"),
        });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  return land;
}

// The border rows for the band holding `year`. The previous band stays until the next one is decoded, so the map
// never flashes empty; the caller filters rows by year.
export function useBorders(year: number | undefined): { file?: string; rows: Feature[] } {
  const [state, setState] = useState<{ file?: string; rows: Feature[] }>({ rows: [] });
  useEffect(() => {
    if (year === undefined) return;
    let live = true;
    bands()
      .then((list) => {
        const b = bandFor(list, year);
        if (!b) return;
        return load(b.file, features).then((rows) => {
          if (live) setState((prev) => (prev.file === b.file ? prev : { file: b.file, rows }));
          const i = list.indexOf(b);
          for (const n of [list[i + 1], list[i - 1]]) if (n) setTimeout(() => load(n.file, features).catch(() => undefined), 1500);
        });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [year]);
  return state;
}
