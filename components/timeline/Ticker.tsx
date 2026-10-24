"use client";

import { useEffect, useRef, useState } from "react";
import type { Ref, State, Stop } from "@/lib/timeline-types";

type Toast = { key: string; when: string; title: string; tone: string; ref: Ref };

type Props = {
  year: number;
  playing: boolean;
  stops: Stop[];
  states: State[];
  onOpen: (ref: Ref) => void;
  onPass: (stop: Stop) => void;
};

const TOAST_MS = 3600;
const MAX = 3;
// At full speed several moments can pass in a second; one caption at a time keeps them readable.
const GAP_MS = 1100;

// Captions for what the playhead passes while history plays: moments as they happen, and Muslim powers as they rise.
export function Ticker({ year, playing, stops, states, onOpen, onPass }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const prev = useRef(year);
  const lastAt = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = year;
    if (!playing || year <= from) return;
    const add: Toast[] = [];
    for (const s of states) {
      if (s.muslim && s.lane === "states" && s.from > from && s.from <= year) {
        add.push({ key: `s-${s.id}`, when: `${s.from < 0 ? `${-s.from} BCE` : s.from}`, title: `${s.name} rises`, tone: "rise", ref: { t: "polity", id: s.id } });
      }
    }
    const now = performance.now();
    const passed = stops.filter((s) => s.type === "event" && s.kind !== "world" && s.year !== undefined && s.precision !== "unknown" && s.year > from && s.year <= year);
    if (passed.length && now - lastAt.current > GAP_MS) {
      const s = passed[passed.length - 1];
      lastAt.current = now;
      add.push({ key: `e-${s.id}`, when: s.label.split(" · ")[0], title: s.title, tone: `k-${s.kind}`, ref: { t: "event", id: s.id } });
      onPass(s);
    }
    if (!add.length) return;
    setToasts((t) => [...t.filter((x) => !add.some((a) => a.key === x.key)), ...add].slice(-MAX));
    for (const a of add) setTimeout(() => setToasts((t) => t.filter((x) => x.key !== a.key)), TOAST_MS);
  }, [year, playing, stops, states, onPass]);

  useEffect(() => {
    if (!playing) setToasts([]);
  }, [playing]);

  return (
    <ol className="tk" aria-live="polite">
      {toasts.map((t) => (
        <li key={t.key} className={t.tone}>
          <button type="button" onClick={() => onOpen(t.ref)}>
            <time>{t.when}</time>
            <span>{t.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
