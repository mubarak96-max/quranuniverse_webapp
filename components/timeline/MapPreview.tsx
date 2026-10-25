"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { CERTAINTY, refHref, yearText, type Card, type Stop } from "@/lib/timeline-types";
import type { Spot } from "./Atlas";

export function MapPreview({ card, spot, year, nearby, alternatives, onClose, onSelect }: {
  card?: Card; spot?: Spot; year: number; nearby: Stop[]; alternatives: Stop[]; onClose: () => void; onSelect: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    if (!element.open) element.showModal();
  }, []);
  const summary = card?.line ?? card?.story ?? card?.tie;
  const excerpt = summary && (summary.length > 330 ? `${summary.slice(0, 327).replace(/\s+\S*$/, "")}…` : summary);
  return (
    <dialog ref={dialog} className="ex-preview" aria-labelledby="ex-preview-title" onClose={onClose} onClick={(e) => {
      if (e.target !== e.currentTarget) return;
      const bounds = e.currentTarget.getBoundingClientRect();
      if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose();
    }}>
      <div className="ex-preview-top"><span>{card?.kind ?? "On the map"}</span><button type="button" onClick={onClose} aria-label="Close preview" autoFocus>×</button></div>
      <h2 id="ex-preview-title">{card?.name ?? spot?.name ?? "Uncharted in our collection"}</h2>
      <p className="ex-preview-meta">{card?.when ?? `Map at ${yearText(year)}`}{card?.place && <span>{card.place.name}</span>}</p>
      {card?.precision && card.precision !== "exact" && <p className="ex-preview-certainty">{CERTAINTY[card.precision]}</p>}
      <p className="ex-preview-text">{excerpt ?? (card ? "Explore its history, sources, and connections to other people and places." : "There isn’t a detailed entry for this territory at the selected date. Explore a marked moment or search for a place by name.")}</p>
      {card ? <Link className="ex-see-more" href={refHref(card.ref)}>See more <span aria-hidden="true">→</span></Link> : nearby.length > 0 && <div className="ex-preview-nearby"><h3>Moments nearby</h3>{nearby.map((stop) => <button key={stop.id} type="button" onClick={() => onSelect(stop.id)}>{stop.title}<span>{stop.label.split(" · ")[0]}</span></button>)}</div>}
      {alternatives.length > 0 && <details className="ex-preview-nearby ex-alternatives"><summary>{alternatives.length} more moments at this location</summary>{alternatives.map((stop) => <button key={stop.id} type="button" onClick={() => onSelect(stop.id)}>{stop.title}<span>{stop.label.split(" · ")[0]}</span></button>)}</details>}
    </dialog>
  );
}
