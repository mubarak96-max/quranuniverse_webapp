// Visuals drawn mostly in SVG: the Quran's anatomy, rings, cycles, arcs, concentric circles, bars and shares.
import type { Anatomy, Visual } from "@/lib/q30-types";

type Of<K extends Visual["kind"]> = Extract<Visual, { kind: K }>;

// Long legends go to two columns so the diagram and its key share one page.
function Legend({ items }: { items: { label: string; text?: string; ref?: string }[] }) {
  return (
    <ol className={items.length >= 6 ? "vz-legend is-cols" : "vz-legend"}>
      {items.map((it, i) => (
        <li key={i}>
          <b>
            {it.label} {it.ref && <small>{it.ref}</small>}
          </b>
          {it.text && <span>{it.text}</span>}
        </li>
      ))}
    </ol>
  );
}

export function AnatomyViz({ data }: { data: Anatomy }) {
  const rows = [data.slice(0, 57), data.slice(57)];
  const max = Math.sqrt(Math.max(...data.map((s) => s.verses)));
  const total = data.reduce((n, s) => n + s.verses, 0);
  const makki = data.filter((s) => s.makki).length;
  const H = 92;
  return (
    <div className="vz-anatomy">
      <svg viewBox="0 0 342 228" role="img" aria-label={`${data.length} surahs by length`}>
        {rows.map((row, ri) =>
          row.map((s, i) => {
            const h = Math.max(2, (Math.sqrt(s.verses) / max) * H);
            const x = 2 + i * 6;
            const base = ri === 0 ? 100 : 214;
            const mark = s.id === 2 || s.id === 96 || s.id === 108;
            return (
              <g key={s.id}>
                <rect x={x} y={base - h} width="4.4" height={h} rx="1.4" className={s.makki ? "vz-mk" : "vz-md"} />
                {mark && <circle cx={x + 2.2} cy={base - h - 5} r="2" className="vz-pin" />}
              </g>
            );
          }),
        )}
        <text x="16" y="12" className="vz-t">2 · al-Baqarah · 286 verses, the longest</text>
        <text x="2" y="226" className="vz-t">Surah 58</text>
        <text x="340" y="226" textAnchor="end" className="vz-t">114</text>
        <text x="2" y="112" className="vz-t">Surah 1</text>
        <text x="340" y="112" textAnchor="end" className="vz-t">57</text>
      </svg>
      <div className="vz-stats">
        <div>
          <b>{data.length}</b>
          <span>surahs</span>
        </div>
        <div>
          <b>{total.toLocaleString("en")}</b>
          <span>verses</span>
        </div>
        <div>
          <b className="vz-mk-t">{makki}</b>
          <span>Makki</span>
        </div>
        <div>
          <b className="vz-md-t">{data.length - makki}</b>
          <span>Madani</span>
        </div>
      </div>
      <p className="vz-note">Pins: al-Baqarah (longest), al-&apos;Alaq (first revealed), al-Kawthar (shortest, 3 verses).</p>
    </div>
  );
}

function Circle({ n, center, arrows }: { n: number; center: string; arrows?: boolean }) {
  const R = 104;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [160 + R * Math.cos(a), 140 + R * Math.sin(a)];
  });
  return (
    <svg viewBox="0 0 320 280" className="vz-circle" aria-hidden="true">
      <circle cx="160" cy="140" r={R} className="vz-track" />
      {arrows &&
        pts.map((_, i) => {
          const a = -Math.PI / 2 + ((i + 0.5) / n) * Math.PI * 2;
          const x = 160 + R * Math.cos(a);
          const y = 140 + R * Math.sin(a);
          const deg = (a * 180) / Math.PI + 90;
          return <path key={i} d="M-4 -4 L0 0 L-4 4" transform={`translate(${x} ${y}) rotate(${deg})`} className="vz-arrow" />;
        })}
      <foreignObject x="80" y="95" width="160" height="90">
        <div className="vz-center">{center}</div>
      </foreignObject>
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="15" className="vz-node" />
          <text x={x} y={y + 4.5} textAnchor="middle" className="vz-num">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function RingViz({ v }: { v: Of<"ring"> }) {
  return (
    <div className="vz-ring">
      <Circle n={v.items.length} center={v.center} />
      <Legend items={v.items} />
    </div>
  );
}

export function CycleViz({ v }: { v: Of<"cycle"> }) {
  return (
    <div className="vz-cycle">
      <Circle n={v.items.length} center="the pattern repeats" arrows />
      <Legend items={v.items} />
      {v.examples && (
        <ul className="vz-chips">
          {v.examples.map((e, i) => (
            <li key={i}>
              <b>{e.label}</b>
              {e.text && <span>{e.text}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RingsViz({ v }: { v: Of<"rings"> }) {
  const n = v.items.length;
  const step = 150 / (n + 1);
  return (
    <div className="vz-rings">
      <svg viewBox="0 0 320 320" aria-hidden="true">
        {[...v.items].reverse().map((it, ri) => {
          const i = n - 1 - ri;
          const r = step * (i + 2);
          return (
            <g key={i}>
              <circle cx="160" cy="160" r={r} className="vz-band" fillOpacity={0.05 + (n - i) * 0.035} />
              <text x="160" y={160 - r + step * 0.68} textAnchor="middle" className="vz-band-t">
                {i + 1}
              </text>
            </g>
          );
        })}
        <circle cx="160" cy="160" r={step * 0.95} className="vz-core" />
        <text x="160" y="164" textAnchor="middle" className="vz-core-t">
          {v.center}
        </text>
      </svg>
      <Legend items={v.items} />
    </div>
  );
}

// A smooth line through the points: Catmull-Rom turned into cubic Béziers.
function smooth(p: [number, number][]) {
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1] ?? p[i];
    const [x1, y1] = p[i];
    const [x2, y2] = p[i + 1];
    const [x3, y3] = p[i + 2] ?? p[i + 1];
    d += ` C${x1 + (x2 - x0) / 6} ${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6} ${y2 - (y3 - y1) / 6} ${x2} ${y2}`;
  }
  return d;
}

export function ArcViz({ v }: { v: Of<"arc"> }) {
  const items = [...v.items].sort((a, b) => a.at - b.at);
  const pts = items.map((it) => [20 + it.at * 300, 120 - it.level * 80] as [number, number]);
  return (
    <div className="vz-arc">
      <svg viewBox="0 0 340 240" aria-hidden="true">
        <line x1="10" x2="330" y1="120" y2="120" className="vz-axis" />
        <path d={smooth(pts)} className="vz-line" />
        {pts.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" className="vz-dot" />
            <text x={x} y={items[i].level >= 0 ? y - 13 : y + 22} textAnchor="middle" className="vz-num">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <Legend items={items} />
    </div>
  );
}

export function ColumnsViz({ v }: { v: Of<"columns"> }) {
  const max = Math.max(...v.items.map((i) => i.value));
  return (
    <ul className="vz-columns">
      {v.items.map((it, i) => (
        <li key={i}>
          <div className="vz-col-head">
            <b>{it.label}</b>
            <span>
              {it.value} {v.unit}
            </span>
          </div>
          <div className="vz-bar">
            <i style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
          {(it.text || it.ref) && (
            <p>
              {it.text} {it.ref && <small>{it.ref}</small>}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

const frac = (x: number) => {
  for (const d of [2, 3, 4, 5, 6, 8, 9, 10, 12, 16, 18, 24]) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 0.002) return n === d ? "all" : `${n}/${d}`;
  }
  return `${Math.round(x * 100)}%`;
};

export function SharesViz({ v }: { v: Of<"shares"> }) {
  return (
    <div className="vz-shares">
      {v.rows.map((row, ri) => (
        <div key={ri} className="vz-share">
          <b>{row.label}</b>
          <div className="vz-stack">
            {row.parts.map((p, i) => (
              <i key={i} style={{ flexGrow: p.value, "--i": i } as React.CSSProperties} title={`${p.label}: ${frac(p.value)}`}>
                <span>{frac(p.value)}</span>
              </i>
            ))}
          </div>
          <ul>
            {row.parts.map((p, i) => (
              <li key={i} style={{ "--i": i } as React.CSSProperties}>
                {p.label.includes(frac(p.value)) ? p.label : `${p.label} ${frac(p.value)}`}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
