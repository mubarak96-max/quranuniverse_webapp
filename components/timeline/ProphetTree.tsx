"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Prophet } from "@/lib/timeline-types";

const COL = 96;
const ROW = 78;
const NODE_W = 88;
const NODE_H = 48;
const PAD = 24;

const center = (p: Prophet) => ({ x: PAD + p.col * COL + NODE_W / 2, y: PAD + p.row * ROW + NODE_H / 2 });

const REL_TEXT: Record<NonNullable<Prophet["rel"]>, string> = {
  son: "Son of",
  descendant: "Descendant of",
  nephew: "Nephew of",
  brother: "Brother of",
  successor: "Successor of",
};

// Parent and child are joined with an elbow; side relations (brother, nephew) with a straight line.
function link(child: Prophet, parent: Prophet) {
  const c = center(child);
  const p = center(parent);
  if (child.rel === "brother" || child.rel === "nephew") return `M${p.x + NODE_W / 2},${p.y}H${c.x - NODE_W / 2}`;
  const mid = c.y - NODE_H / 2 - 14;
  return `M${p.x},${p.y + NODE_H / 2}V${mid}H${c.x}V${c.y - NODE_H / 2}`;
}

export function ProphetTree({ prophets, selected, onSelect }: { prophets: Prophet[]; selected?: string; onSelect: (id: string) => void }) {
  const byId = useMemo(() => new Map(prophets.map((p) => [p.id, p])), [prophets]);
  const width = PAD * 2 + (Math.max(...prophets.map((p) => p.col)) + 1) * COL;
  const height = PAD * 2 + Math.max(...prophets.map((p) => p.row)) * ROW + NODE_H;

  const lineage = useMemo(() => {
    const ids = new Set<string>();
    for (let p = selected ? byId.get(selected) : undefined; p; p = p.parent ? byId.get(p.parent) : undefined) ids.add(p.id);
    return ids;
  }, [selected, byId]);

  return (
    <div className="pt" role="region" aria-label="Family tree of the prophets">
      <div className="pt-canvas" style={{ aspectRatio: `${width} / ${height}`, minWidth: width * 0.82 }}>
        <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {prophets.map((p) => {
            const parent = p.parent ? byId.get(p.parent) : undefined;
            if (!parent) return null;
            const on = lineage.has(p.id) && lineage.has(parent.id);
            return <path key={p.id} d={link(p, parent)} className={`pt-link rel-${p.rel}${on ? " on" : ""}`} />;
          })}
        </svg>
        {prophets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`pt-node${p.group ? " group" : ""}${p.woman ? " woman" : ""}${p.id === selected ? " on" : ""}${lineage.has(p.id) ? " line" : ""}`}
            style={{ left: `${((PAD + p.col * COL) / width) * 100}%`, top: `${((PAD + p.row * ROW) / height) * 100}%`, width: `${(NODE_W / width) * 100}%` }}
            onClick={() => onSelect(p.id)}
            aria-pressed={p.id === selected}
          >
            <b>{p.name}</b>
            <span className="ar" lang="ar">
              {p.arabic}
            </span>
          </button>
        ))}
      </div>
      <p className="pt-legend">
        <span className="l-solid">parent and child</span>
        <span className="l-dash">many generations</span>
        <span className="l-dot">brother, nephew or successor</span>
      </p>
    </div>
  );
}

export function ProphetPanel({
  prophets,
  selected,
  onOpenStop,
  onSelect,
}: {
  prophets: Prophet[];
  selected?: string;
  onOpenStop: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const p = prophets.find((x) => x.id === selected);
  const parent = p?.parent ? prophets.find((x) => x.id === p.parent) : undefined;
  const children = p ? prophets.filter((x) => x.parent === p.id) : [];
  const named = prophets.filter((x) => !x.group && !x.woman).length;

  return (
    <section className="panel pp" aria-label="Prophet">
      <header className="sp-head">
        <span>Prophets family tree</span>
        <span className="sp-count">{named} named in the Quran</span>
      </header>
      <div className="sp-body" key={p?.id ?? "none"}>
        {!p ? (
          <div className="pp-intro">
            <h2 className="sp-title">One family of messengers</h2>
            <p className="sp-what">
              The Quran names {named} prophets. Most descend from Ibrahim through his two sons: Ismail, ancestor of Muhammad ﷺ, and Ishaq,
              ancestor of Musa, Dawud and Isa.
            </p>
            <p className="sp-dim">Tap a name to see who they were and where they lived.</p>
            <blockquote className="sp-quote">
              <p>We make no distinction between any of His messengers.</p>
              <cite>
                <Link href="/surah/al-baqarah/285">Quran 2:285</Link>
              </cite>
            </blockquote>
          </div>
        ) : (
          <article aria-live="polite">
            <p className="pp-ar ar" lang="ar">
              {p.arabic}
            </p>
            <h2 className="sp-title">{p.name}</h2>
            <p className="sp-meta">
              {p.mentions !== undefined && <b>Named {p.mentions} times in the Quran</b>}
              {p.woman && <span>not a prophet</span>}
            </p>
            <p className="sp-what">{p.line}</p>
            {p.verse.text && (
              <blockquote className="sp-quote">
                <p>{p.verse.text}</p>
                <cite>
                  <Link href={p.verse.href}>Quran {p.verse.ref}</Link>
                </cite>
              </blockquote>
            )}
            <dl className="sp-context">
              {parent && p.rel && (
                <>
                  <dt>{REL_TEXT[p.rel]}</dt>
                  <dd>
                    <button type="button" className="chip" onClick={() => onSelect(parent.id)}>
                      {parent.name}
                    </button>
                  </dd>
                </>
              )}
              {children.length > 0 && (
                <>
                  <dt>Followed by</dt>
                  <dd>
                    {children.map((c) => (
                      <button key={c.id} type="button" className="chip" onClick={() => onSelect(c.id)}>
                        {c.name}
                      </button>
                    ))}
                  </dd>
                </>
              )}
            </dl>
            {p.journey && (
              <Link href={`/timeline/journey/${p.journey}`} className="sp-journey">
                <b>Live {p.name}&apos;s story</b>
                <span>Full screen, scene by scene</span>
              </Link>
            )}
            {p.stop && (
              <button type="button" className="cta" onClick={() => onOpenStop(p.stop!)}>
                See {p.group ? "it" : p.name.replace(" ﷺ", "")} on the map →
              </button>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
