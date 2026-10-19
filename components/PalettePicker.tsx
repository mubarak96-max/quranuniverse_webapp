"use client";

import { useEffect, useState } from "react";

const KEY = "palette";

export function PalettePicker({ names, fallback }: { names: string[]; fallback: string }) {
  const [current, setCurrent] = useState(fallback);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && names.includes(saved)) setCurrent(saved);
    } catch {
      // storage can be blocked; the default palette still works
    }
  }, [names]);

  useEffect(() => {
    document.documentElement.dataset.palette = current;
  }, [current]);

  function choose(name: string) {
    setCurrent(name);
    try {
      localStorage.setItem(KEY, name);
    } catch {
      // storage can be blocked; the choice just won't persist
    }
  }

  return (
    <div className="palette" role="group" aria-label="Color palette">
      {names.map((n) => (
        <button key={n} type="button" aria-pressed={n === current} onClick={() => choose(n)}>
          {n[0].toUpperCase() + n.slice(1)}
        </button>
      ))}
    </div>
  );
}
