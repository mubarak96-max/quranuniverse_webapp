// Reading progress for Quran in 30 Days, kept on the reader's device. Every writer goes through update(), which
// fires an event so the day list, the reader, the quiz and the reflection stay in step without a shared store.
import { useMemo, useSyncExternalStore } from "react";
import { load, save } from "@/components/games/daily";

export type DayState = { page?: number; done?: boolean; score?: [number, number]; note?: string; seen?: number[] };
export type State = { days: Record<number, DayState>; last?: number; size?: number };

const KEY = "q30:v1";
const EVENT = "q30-change";

export const read = (): State => load<State>(KEY, { days: {} });

export function update(fn: (s: State) => void) {
  const s = read();
  fn(s);
  save(KEY, s);
  window.dispatchEvent(new Event(EVENT));
}

export function patchDay(day: number, patch: Partial<DayState>) {
  update((s) => {
    s.days[day] = { ...s.days[day], ...patch };
  });
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function raw() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// null on the server and during hydration, so the first client render matches the static HTML.
export function useProgress(): State | null {
  const snap = useSyncExternalStore<string | null | undefined>(subscribe, raw, () => undefined);
  return useMemo(() => (snap === undefined ? null : snap ? (JSON.parse(snap) as State) : { days: {} }), [snap]);
}
