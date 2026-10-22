"use client";

import { useEffect, useState } from "react";

export type Feature = { n: string; s?: string; d: string };
export type Label = { n: string; x: number; y: number; r: number };
export type Snapshot = { year: number; features: Feature[]; labels: Label[] };
export type Land = { land: string; rivers: string };

// Module-level caches: each layer file is fetched once per page load and shared by every view.
const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function load<T>(file: string): Promise<T> {
  if (cache.has(file)) return Promise.resolve(cache.get(file) as T);
  let p = inflight.get(file);
  if (!p) {
    p = fetch(`/borders/${file}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${file}: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        cache.set(file, data);
        inflight.delete(file);
        return data;
      });
    inflight.set(file, p);
  }
  return p as Promise<T>;
}

export const prefetchLand = () => {
  load("land.json").catch(() => undefined);
};

export const prefetchSnapshot = (year: number | undefined) => {
  if (year !== undefined) load(`${year}.json`).catch(() => undefined);
};

export function useLand(): Land | undefined {
  const [land, setLand] = useState(() => cache.get("land.json") as Land | undefined);
  useEffect(() => {
    let live = true;
    load<Land>("land.json").then((l) => live && setLand(l));
    return () => {
      live = false;
    };
  }, []);
  return land;
}

// Returns the snapshot layers to draw. While a new snapshot arrives the old one stays underneath, then is dropped
// once the new layer has faded in, so the map never flashes empty.
export function useSnapshots(year: number | undefined): Snapshot[] {
  const [layers, setLayers] = useState<Snapshot[]>(() => {
    const hit = year === undefined ? undefined : (cache.get(`${year}.json`) as Snapshot | undefined);
    return hit ? [hit] : [];
  });

  useEffect(() => {
    if (year === undefined) {
      setLayers([]);
      return;
    }
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    load<Snapshot>(`${year}.json`).then((snap) => {
      if (!live) return;
      setLayers((prev) => (prev.at(-1)?.year === snap.year ? prev : [...prev.slice(-1), snap]));
      timer = setTimeout(() => live && setLayers((prev) => prev.slice(-1)), 500);
    });
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [year]);

  return layers;
}
