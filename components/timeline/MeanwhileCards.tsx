"use client";

import { refHref, type Ref } from "@/lib/timeline-types";
import type { Meanwhile } from "@/lib/timeline-world";

export function MeanwhileCards({ items, onOpen, title = "Meanwhile" }: { items: Meanwhile[]; onOpen: (ref: Ref) => void; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="mw" aria-label={title}>
      <h3 className="mw-h">{title}</h3>
      <ul>
        {items.map((m) => (
          <li key={`${m.ref.t}:${m.ref.id}`}>
            <a
              href={refHref(m.ref)}
              onClick={(e) => {
                e.preventDefault();
                onOpen(m.ref);
              }}
            >
              <small>In {m.region}</small>
              <b>{m.title}</b>
              <span>{m.when}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
