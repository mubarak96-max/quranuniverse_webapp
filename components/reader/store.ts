"use client";

// What the reader keeps on their own device: where they stopped, the verses they saved and how they like to read.
// Every write fires an event, so the header, the home page and the verse pages stay in step without a shared store.
import { useMemo, useSyncExternalStore } from "react";

export type Place = { key: string; href: string; surah: string; at: number };
export type Bookmark = Place & { text: string };
export type Settings = { ar: number; en: number; translit: boolean; translation: boolean };

export const DEFAULT_SETTINGS: Settings = { ar: 1, en: 1, translit: true, translation: true };
export const AR_STEPS = [0.85, 1, 1.15, 1.3, 1.5];
export const EN_STEPS = [0.9, 1, 1.1, 1.25];

const KEYS = { last: "qu:last", bookmarks: "qu:bookmarks", settings: "qu:settings" } as const;
const EVENT = "qu-reader-change";

function raw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: the choice just won't persist
  }
  window.dispatchEvent(new Event(EVENT));
}

function parse<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

// undefined on the server and during hydration, so the first client render matches the static HTML.
function useStored<T>(key: string, fallback: T): T | undefined {
  const snap = useSyncExternalStore<string | null | undefined>(subscribe, () => raw(key), () => undefined);
  return useMemo(() => (snap === undefined ? undefined : parse(snap, fallback)), [snap, fallback]);
}

// ---------- last read ----------
export const useLastRead = () => useStored<Place | null>(KEYS.last, null);

export function setLastRead(p: Omit<Place, "at">) {
  const prev = parse<Place | null>(raw(KEYS.last), null);
  if (prev?.key === p.key) return;
  write(KEYS.last, { ...p, at: Date.now() });
}

// ---------- bookmarks ----------
const NO_BOOKMARKS: Bookmark[] = [];
export const useBookmarks = () => useStored<Bookmark[]>(KEYS.bookmarks, NO_BOOKMARKS);

export function toggleBookmark(b: Omit<Bookmark, "at">): boolean {
  const list = parse<Bookmark[]>(raw(KEYS.bookmarks), []);
  const i = list.findIndex((x) => x.key === b.key);
  if (i >= 0) list.splice(i, 1);
  else list.unshift({ ...b, at: Date.now() });
  write(KEYS.bookmarks, list);
  return i < 0;
}

export function removeBookmark(key: string) {
  write(
    KEYS.bookmarks,
    parse<Bookmark[]>(raw(KEYS.bookmarks), []).filter((x) => x.key !== key),
  );
}

// ---------- reading settings ----------
const NO_SETTINGS: Partial<Settings> = {};
export function useSettings(): Settings | undefined {
  const saved = useStored<Partial<Settings>>(KEYS.settings, NO_SETTINGS);
  return useMemo(() => (saved === undefined ? undefined : { ...DEFAULT_SETTINGS, ...saved }), [saved]);
}

export function applySettings(s: Settings) {
  const root = document.documentElement;
  root.style.setProperty("--ar-scale", String(s.ar));
  root.style.setProperty("--en-scale", String(s.en));
  root.toggleAttribute("data-hide-translit", !s.translit);
  root.toggleAttribute("data-hide-translation", !s.translation);
}

export function setSettings(patch: Partial<Settings>) {
  const next = { ...DEFAULT_SETTINGS, ...parse<Partial<Settings>>(raw(KEYS.settings), {}), ...patch };
  applySettings(next);
  write(KEYS.settings, next);
}

// Runs before paint, like the theme script, so saved sizes never flash at the default size first.
export const settingsScript = `(function(){try{var s=JSON.parse(localStorage.getItem("${KEYS.settings}")||"null");if(!s)return;var r=document.documentElement;if(s.ar)r.style.setProperty("--ar-scale",s.ar);if(s.en)r.style.setProperty("--en-scale",s.en);if(s.translit===false)r.setAttribute("data-hide-translit","");if(s.translation===false)r.setAttribute("data-hide-translation","")}catch(e){}})()`;
