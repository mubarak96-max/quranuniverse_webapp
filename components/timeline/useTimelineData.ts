"use client";

import { useEffect, useState } from "react";
import type { TimelineData } from "@/lib/timeline-types";
import { prefetchLand } from "./useBorders";

let cached: TimelineData | undefined;
let pending: Promise<TimelineData> | undefined;

// The full dataset is one shared, cached file emitted at build time.
export function useTimelineData() {
  const [data, setData] = useState(cached);
  useEffect(() => {
    if (cached) return;
    prefetchLand();
    pending ??= fetch("/timeline/data.json").then((r) => r.json() as Promise<TimelineData>);
    pending.then((d) => {
      cached = d;
      setData(d);
    });
  }, []);
  return data;
}

// Small local memory: what the reader has seen on the map and the last page they read.
export const store = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {
      // private mode or blocked storage: the preference just isn't remembered
    }
  },
};

export const SEEN_KEY = "timeline:seen";
export const LAST_KEY = "timeline:last-read";

export function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(store.get(SEEN_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}
