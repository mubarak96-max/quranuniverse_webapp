"use client";

import { useEffect, useRef } from "react";
import type { EndSigns, Villain, VillainAge } from "@/lib/timeline-types";
import { VillainIcon } from "./VillainIcon";

export function VillainLine({
  villains,
  ages,
  signs,
  selected,
  onSelect,
}: {
  villains: Villain[];
  ages: VillainAge[];
  signs: EndSigns;
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);

  // Stepping with next and previous in the panel keeps the chosen name in view.
  useEffect(() => {
    root.current?.querySelector(".vl-node.on")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="vl" ref={root} role="region" aria-label="Villains of history, in order">
      <div className="vl-line">
        {ages.map((a) => (
          <section key={a.id} className={`vl-age age-${a.id}`}>
            <h3>
              <span>{a.title}</span>
              <small>{a.span}</small>
            </h3>
            {villains
              .filter((v) => v.age === a.id)
              .map((v) => (
                <button
                  key={v.id}
                  type="button"
                  className={`vl-node${v.id === selected ? " on" : ""}`}
                  onClick={() => onSelect(v.id)}
                  aria-pressed={v.id === selected}
                >
                  <VillainIcon symbol={v.symbol} className="vl-icon" />
                  <span className="vl-name">
                    <b>{v.name}</b>
                    <small>{v.title}</small>
                  </span>
                  <span className="vl-side">
                    <span className="ar" lang="ar">
                      {v.arabic}
                    </span>
                    <small>vs {v.against.name}</small>
                  </span>
                </button>
              ))}
            {a.id === "end" && (
              <div className="vl-signs">
                <h4>Ten signs before the Hour</h4>
                <ol>
                  {signs.items.map((s) => (
                    <li key={s.name}>
                      {s.villain ? (
                        <button type="button" onClick={() => onSelect(s.villain!)}>
                          {s.name}
                        </button>
                      ) : (
                        s.name
                      )}
                    </li>
                  ))}
                </ol>
                <p>
                  {signs.note}{" "}
                  <a href={signs.hadith.url} target="_blank" rel="noopener noreferrer">
                    {signs.hadith.label} ↗
                  </a>
                </p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
