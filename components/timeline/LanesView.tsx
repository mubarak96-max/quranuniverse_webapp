"use client";

import { useMemo, useRef, useState } from "react";
import { AXIS, sameRef, tToYear, yearText, yearToT, type Ref, type TimelineData } from "@/lib/timeline-types";

type Bar = { ref: Ref; name: string; from: number; to: number; tone: string; dot?: boolean };
type Lane = { id: string; title: string; rows: Bar[][] };

type Props = {
  data: TimelineData;
  selected?: Ref;
  onSelect: (ref: Ref) => void;
};

const ALL = "all";
const MIN_SPAN = 0.012;

// Greedy interval packing: each bar goes in the first row where it does not touch the previous bar.
function pack(bars: Bar[], maxRows: number, gap: number, pos: (y: number) => number): Bar[][] {
  const rows: Bar[][] = [];
  const ends: number[] = [];
  for (const b of [...bars].sort((a, c) => a.from - c.from)) {
    const start = pos(b.from);
    const end = Math.max(pos(b.to), start + MIN_SPAN);
    let r = ends.findIndex((e) => e + gap <= start);
    if (r < 0) {
      if (rows.length >= maxRows) continue;
      r = rows.length;
      rows.push([]);
      ends.push(-1);
    }
    rows[r].push(b);
    ends[r] = end;
  }
  return rows;
}

// "Who lived at the same time?": prophets, powers, rulers, scholars and villains on parallel lanes, one era at a time.
export function LanesView({ data, selected, onSelect }: Props) {
  const eras = useMemo(() => data.chapters.filter((c) => c.from !== undefined && c.to !== undefined && c.to > c.from), [data.chapters]);
  const [era, setEra] = useState<string>(() => eras.find((c) => c.id === "prophet")?.id ?? ALL);
  const [hover, setHover] = useState<number>();
  const body = useRef<HTMLDivElement>(null);

  const win = useMemo(() => {
    const c = eras.find((x) => x.id === era);
    if (!c) return { from: AXIS.min, to: AXIS.max, all: true };
    const pad = Math.max(10, (c.to! - c.from!) * 0.06);
    return { from: Math.round(c.from! - pad), to: Math.min(AXIS.max, Math.round(c.to! + pad)), all: false };
  }, [era, eras]);

  const pos = useMemo(() => {
    if (win.all) return (y: number) => yearToT(y);
    return (y: number) => (Math.min(win.to, Math.max(win.from, y)) - win.from) / (win.to - win.from);
  }, [win]);
  const toYear = (t: number) => (win.all ? tToYear(t) : Math.round(win.from + t * (win.to - win.from)));

  const lanes = useMemo<Lane[]>(() => {
    const inWin = (b: Bar) => b.to >= win.from && b.from <= win.to;
    const prophets: Bar[] = data.prophets
      .filter((p) => p.from !== undefined)
      .map((p) => ({ ref: { t: "prophet", id: p.id }, name: p.name, from: p.from!, to: p.bar && p.to ? p.to : p.from!, tone: "prophet", dot: !p.bar }));
    const states = (muslim: boolean): Bar[] =>
      data.states.filter((s) => s.muslim === muslim).map((s) => ({ ref: { t: "polity", id: s.id }, name: s.name, from: s.from, to: s.to, tone: muslim ? `c${s.color ?? 0}` : "world" }));
    const people = (groups: string[], tone: string): Bar[] =>
      data.people
        .filter((p) => groups.includes(p.group) && p.from !== undefined && p.precision !== "unknown")
        .map((p) => ({ ref: { t: "person", id: p.id }, name: p.name, from: p.from!, to: p.to ?? p.from!, tone }));
    const villains: Bar[] = data.villains
      .filter((v) => v.year !== undefined)
      .map((v) => ({ ref: { t: "villain", id: v.id }, name: v.name, from: v.year!, to: v.year!, tone: "villain", dot: true }));
    const gap = win.all ? 0.004 : 0.008;
    const lane = (id: string, title: string, bars: Bar[], rows: number): Lane => ({ id, title, rows: pack(bars.filter(inWin), rows, gap, pos) });
    return [
      lane("prophets", "Prophets", prophets, 3),
      lane("muslim", "Muslim powers", states(true), 5),
      lane("world", "World powers", states(false), 5),
      lane("rulers", "Kings and rulers", people(["ruler"], "ruler"), win.all ? 4 : 8),
      lane("people", "Companions, family and people of the Quran", people(["companion", "family", "quran", "hadith"], "person"), win.all ? 3 : 6),
      lane("scholars", "Scholars", people(["scholar"], "scholar"), win.all ? 4 : 6),
      lane("villains", "Villains", villains, 2),
    ].filter((l) => l.rows.length);
  }, [data, win, pos]);

  const ticks = useMemo(() => {
    if (win.all) return [-3000, -2000, -1000, 0, 570, 750, 1000, 1258, 1500, 1800, 2000];
    const span = win.to - win.from;
    const step = [5, 10, 25, 50, 100, 250, 500, 1000].find((s) => span / s <= 9) ?? 1000;
    const out: number[] = [];
    for (let y = Math.ceil(win.from / step) * step; y <= win.to; y += step) out.push(y);
    return out;
  }, [win]);

  function onMove(e: React.PointerEvent) {
    const r = body.current?.getBoundingClientRect();
    if (!r) return;
    const t = (e.clientX - r.left) / r.width;
    setHover(t >= 0 && t <= 1 ? toYear(t) : undefined);
  }

  return (
    <div className="ln">
      <nav className="ln-eras lib-shelves" aria-label="Choose an era">
        {eras.map((c) => (
          <button key={c.id} type="button" className={era === c.id ? "on" : undefined} aria-pressed={era === c.id} onClick={() => setEra(c.id)}>
            {c.title}
          </button>
        ))}
        <button type="button" className={era === ALL ? "on" : undefined} aria-pressed={era === ALL} onClick={() => setEra(ALL)}>
          All of history
        </button>
      </nav>
      <div className="ln-scroll">
        <div className={`ln-body${win.all ? " is-all" : ""}`} ref={body} onPointerMove={onMove} onPointerLeave={() => setHover(undefined)}>
          <div className="ln-ticks" aria-hidden="true">
            {ticks.map((y) => (
              <span key={y} style={{ left: `${pos(y) * 100}%` }}>
                {y < 0 ? `${-y} BCE` : y}
              </span>
            ))}
          </div>
          {lanes.map((l) => (
            <section key={l.id} className={`ln-lane ln-${l.id}`} aria-label={l.title}>
              <h3>{l.title}</h3>
              {l.rows.map((row, i) => (
                <div key={i} className="ln-row">
                  {row.map((b) => {
                    const left = pos(b.from);
                    const width = Math.max(pos(b.to) - left, MIN_SPAN);
                    return (
                      <button
                        key={`${b.ref.t}:${b.ref.id}`}
                        type="button"
                        className={`ln-bar t-${b.tone}${b.dot ? " dot" : ""}${sameRef(selected, b.ref) ? " on" : ""}`}
                        style={{ left: `${left * 100}%`, width: b.dot ? undefined : `${width * 100}%` }}
                        title={`${b.name} · ${yearText(b.from, "approx")}${b.to !== b.from ? `–${yearText(b.to, "approx").replace("c. ", "")}` : ""}`}
                        onClick={() => onSelect(b.ref)}
                      >
                        <span>{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </section>
          ))}
          {hover !== undefined && (
            <div className="ln-cursor" style={{ left: `${pos(hover) * 100}%` }} aria-hidden="true">
              <span>{yearText(hover)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
