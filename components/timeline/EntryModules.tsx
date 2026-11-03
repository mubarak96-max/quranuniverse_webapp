// Visual building blocks for entry pages. All server-rendered: charts are plain HTML and SVG.
import Link from "next/link";
import type { Tafsir, VerseDetail } from "@/lib/timeline-sources";
import { initials } from "@/lib/timeline-things";
import { yearText } from "@/lib/timeline-types";

export type Stat = { value: string; label: string };

export function StatStrip({ stats }: { stats: Stat[] }) {
  if (!stats.length) return null;
  return (
    <ul className="es">
      {stats.map((s) => (
        <li key={s.label}>
          <b>{s.value}</b>
          <span>{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

// Lifespans and reigns as bars on a shared axis, with optional moments marked as diamonds.
export type SpanRow = { key: string; name: string; sub?: string; from: number; to: number; href: string; tone: string; self?: boolean; point?: boolean };
export type SpanMark = { key: string; year: number; label: string; href: string };

const nice = (span: number) => [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((s) => span / s <= 6) ?? 1000;

export function SpanChart({ rows, marks = [], caption }: { rows: SpanRow[]; marks?: SpanMark[]; caption?: string }) {
  if (!rows.length) return null;
  const lo = Math.min(...rows.map((r) => r.from), ...marks.map((m) => m.year));
  const hi = Math.max(...rows.map((r) => r.to), ...marks.map((m) => m.year));
  const pad = Math.max(2, (hi - lo) * 0.04);
  const min = lo - pad;
  const max = hi + pad;
  const pct = (y: number) => ((y - min) / (max - min)) * 100;
  const step = nice(max - min);
  const ticks: number[] = [];
  for (let t = Math.ceil(min / step) * step; t <= max; t += step) ticks.push(t);
  return (
    <figure className="sc">
      <div className="sc-axis" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} style={{ left: `${pct(t)}%` }}>
            {yearText(t === 0 ? 1 : t)}
          </span>
        ))}
      </div>
      {marks.length > 0 && (
        <div className="sc-row sc-marks">
          <span className="sc-name">Moments</span>
          <div className="sc-track">
            {marks.map((m) => (
              <Link key={m.key} href={m.href} className="sc-mark" style={{ left: `${pct(m.year)}%` }} title={`${yearText(m.year)} · ${m.label}`}>
                <span className="sr-only">
                  {m.label}, {yearText(m.year)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {rows.map((r) => (
        <div className={`sc-row${r.self ? " sc-self" : ""}${r.point ? " sc-point" : ""}${pct(r.to) > 72 ? " sc-late" : ""}`} key={r.key}>
          <Link href={r.href} className="sc-name">
            {r.name}
            {r.sub && <small>{r.sub}</small>}
          </Link>
          <div className="sc-track">
            <span className="sc-bar" style={{ left: `${pct(r.from)}%`, width: `max(6px, ${pct(r.to) - pct(r.from)}%)`, ["--c" as string]: r.tone }}>
              <em>
                {r.point ? yearText(r.from) : `${yearText(r.from)}–${yearText(r.to)}`}
              </em>
            </span>
          </div>
        </div>
      ))}
      <div className="sc-grid" aria-hidden="true">
        {ticks.map((t) => (
          <i key={t} style={{ left: `${pct(t)}%` }} />
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// The Quran passages an entry cites, in Arabic and English.
export function VerseGallery({ verses }: { verses: VerseDetail[] }) {
  if (!verses.length) return null;
  return (
    <div className="vg">
      {verses.map((v, i) => (
        <article className={`vg-card${i === 0 ? " vg-lead" : ""}`} key={v.ref}>
          <header>
            <span className="vg-surah">
              Surah {v.surah} <span lang="ar">{v.surahArabic}</span>
            </span>
            <span className="vg-ref">{v.ref}</span>
          </header>
          <p className="vg-ar" lang="ar" dir="rtl">
            {v.ayahs.map((a) => (
              <span key={a.n}>
                {a.arabic} <span className="vg-n">﴿{a.n.toLocaleString("ar-EG")}﴾</span>{" "}
              </span>
            ))}
          </p>
          <div className="vg-en">
            {v.ayahs.map((a) => (
              <p key={a.n}>
                <sup>{a.n}</sup> {a.english}
              </p>
            ))}
          </div>
          <footer>
            {v.more > 0 && <span>+{v.more} more ayahs in this passage</span>}
            <Link href={v.href}>Read with tafsir →</Link>
          </footer>
        </article>
      ))}
    </div>
  );
}

export function TafsirBlock({ tafsir }: { tafsir: Tafsir }) {
  return (
    <figure className="tf">
      <div className="tf-head">
        <span className="tf-seal" aria-hidden="true">
          تفسير
        </span>
        <div>
          <p className="tf-k">From the tafsir of Ibn Kathir</p>
          <p className="tf-on">On Quran {tafsir.ref}</p>
        </div>
      </div>
      <blockquote>
        {tafsir.paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </blockquote>
      <figcaption>
        <Link href={tafsir.href}>Continue reading the tafsir →</Link>
      </figcaption>
    </figure>
  );
}

// The entry at the centre, everything linked to it around, each node a door to the map.
export type GraphNode = { key: string; name: string; sub?: string; href: string; tone: string; kind: string };

export function ConnectionGraph({ name, tone, nodes }: { name: string; tone: string; nodes: GraphNode[] }) {
  if (nodes.length < 2) return null;
  const W = 900;
  const H = 520;
  const cx = W / 2;
  const cy = H / 2;
  const n = nodes.length;
  const pos = nodes.map((node, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return { node, x: cx + Math.cos(a) * 250, y: cy + Math.sin(a) * 185, a };
  });
  const clip = (s: string) => (s.length > 22 ? `${s.slice(0, 20)}…` : s);
  return (
    <figure className="cg">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} and ${n} connections`}>
        <defs>
          <radialGradient id="cg-glow">
            <stop offset="0" stopColor={tone} stopOpacity="0.55" />
            <stop offset="1" stopColor={tone} stopOpacity="0" />
          </radialGradient>
        </defs>
        {pos.map(({ node, x, y }) => (
          <path key={`l-${node.key}`} d={`M${cx},${cy} Q${(cx + x) / 2},${(cy + y) / 2 - 18} ${x},${y}`} stroke={node.tone} strokeOpacity="0.35" strokeWidth="1.3" fill="none" />
        ))}
        <circle cx={cx} cy={cy} r="78" fill="url(#cg-glow)" />
        <circle cx={cx} cy={cy} r="38" fill="#0b1d22" stroke={tone} strokeWidth="2" />
        <text x={cx} y={cy + 6} textAnchor="middle" className="cg-c">
          {initials(name)}
        </text>
        {pos.map(({ node, x, y, a }) => {
          // Labels sit beside nodes on the left and right, and above or below them at the top and bottom.
          const vertical = Math.abs(Math.cos(a)) < 0.4;
          const right = x >= cx;
          const lx = vertical ? x : x + (right ? 24 : -24);
          const ly = vertical ? (Math.sin(a) > 0 ? y + 36 : y - 38) : y - 2;
          const anchor = vertical ? "middle" : right ? "start" : "end";
          return (
            <a key={node.key} href={node.href} className="cg-node">
              <title>{`${node.name}${node.sub ? ` · ${node.sub}` : ""}`}</title>
              <circle cx={x} cy={y} r="17" fill="#0b1d22" stroke={node.tone} strokeWidth="1.6" />
              <text x={x} y={y + 4} textAnchor="middle" className="cg-i" fill={node.tone}>
                {initials(node.name)}
              </text>
              <text x={lx} y={ly} textAnchor={anchor} className="cg-t">
                {clip(node.name)}
              </text>
              <text x={lx} y={ly + 15} textAnchor={anchor} className="cg-s">
                {node.kind}
              </text>
            </a>
          );
        })}
      </svg>
    </figure>
  );
}

export function Avatar({ name, tone }: { name: string; tone: string }) {
  return (
    <span className="av" style={{ ["--c" as string]: tone }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
