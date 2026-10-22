"use client";

import type { Scene } from "@/lib/journey-types";

// Interactive lights placed on the scene itself, away from the text: the top of the screen on phones, the right
// half on wide screens. A fixed jitter keeps the grid from looking ruled.
function spot(i: number, cols: number) {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const j = (n: number) => (Math.abs(Math.sin(i * 12.9898 + n * 78.233)) * 43758.5453) % 1;
  return {
    "--mx": `${10 + col * (80 / (cols - 1)) + (j(1) - 0.5) * 8}%`,
    "--my": `${11 + row * 8.5 + (j(2) - 0.5) * 3}%`,
    "--dx": `${54 + col * (38 / (cols - 1)) + (j(3) - 0.5) * 5}%`,
    "--dy": `${18 + row * 22 + (j(4) - 0.5) * 9}%`,
  } as React.CSSProperties;
}

export function Field({ scene, taps, onTap }: { scene: Scene; taps: number[]; onTap: (i: number) => void }) {
  const it = scene.interact;
  if (it?.type === "names") {
    return (
      <div className="jr-field">
        {it.items.map((item, i) => {
          const on = taps.includes(i);
          return (
            <button
              key={item.en}
              type="button"
              className={`jr-light${on ? " on" : ""}`}
              style={spot(i, 4)}
              onClick={() => !on && onTap(i)}
              aria-label={on ? `${item.en}, ${item.ar}` : "A hidden name"}
            >
              <i />
              {on && (
                <span>
                  <b className="ar" lang="ar">
                    {item.ar}
                  </b>
                  {item.en}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }
  if (it?.type === "reveal") {
    const all = taps.length >= it.items.length;
    return (
      <div className="jr-field">
        <button
          type="button"
          className={`jr-light jr-bright${all ? " on" : ""}`}
          onClick={() => onTap(taps.length)}
          aria-label={it.hint}
          disabled={all}
        >
          <i />
        </button>
      </div>
    );
  }
  return null;
}
