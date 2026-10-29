// Helpers every daily game shares: the puzzle number, saved progress and the share button.

const DAY = 86_400_000;

// Counted in the player's own calendar, so the puzzle changes at their local midnight.
export function dayNumber(epoch: string, now = new Date()): number {
  const [y, m, d] = epoch.split("-").map(Number);
  return Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / DAY);
}

export function untilTomorrow(now = new Date()): string {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const s = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// Storage can be missing or blocked (private windows, embedded previews); the game still plays without it.
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function share(text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

// Wins on consecutive days, ending today or yesterday so an unplayed today does not break the run yet.
export function streaks(results: Record<number, boolean>, today: number): { current: number; best: number } {
  const days = Object.keys(results).map(Number).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -2;
  for (const d of days) {
    run = results[d] ? (d === prev + 1 ? run + 1 : 1) : 0;
    best = Math.max(best, run);
    prev = d;
  }
  let current = 0;
  for (let d = results[today] === undefined ? today - 1 : today; results[d]; d--) current++;
  return { current, best };
}

export type Schedule = { days: number; chunk: number; dir: string };

// Days past the end of the pool wrap around to the start.
export async function fetchDay<T>(schedule: Schedule, day: number): Promise<T> {
  const i = ((day % schedule.days) + schedule.days) % schedule.days;
  const res = await fetch(`${schedule.dir}/${Math.floor(i / schedule.chunk)}.json`);
  const chunk: T[] = await res.json();
  return chunk[i % schedule.chunk];
}
