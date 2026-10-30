// The painted-style cover for a day: the part's sky, a seeded landscape, a starfield, a geometric veil and the
// day's emblem in a gold medallion. Seeded by day, so every cover is distinct but stable between builds.
import { partOf, type Icon as IconName } from "@/lib/q30-types";
import { IconAt } from "./Icons";

const GOLD = "#d8b86a";

function rng(seed: number) {
  let a = seed * 9301 + 49297;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ridge(r: () => number, base: number, amp: number, steps: number) {
  const w = 300 / steps;
  let d = `M0 ${base + (r() - 0.5) * amp}`;
  for (let i = 1; i <= steps; i++) {
    const x = i * w;
    const y = base + (r() - 0.5) * amp;
    d += ` Q${x - w / 2} ${y + (r() - 0.5) * amp} ${x} ${y}`;
  }
  return `${d} L300 420 L0 420 Z`;
}

export function CoverArt({ day, emblem, className }: { day: number; emblem: IconName; className?: string }) {
  const part = partOf(day);
  const r = rng(day);
  const id = `cv${day}`;
  const stars = Array.from({ length: 46 }, () => ({ x: r() * 300, y: r() * 230, s: 0.4 + r() * 1.3, o: 0.25 + r() * 0.7 }));
  const orb = { x: 40 + r() * 220, y: 50 + r() * 50 };
  const far = ridge(r, 300, 40, 5);
  const mid = ridge(r, 338, 34, 4);
  const near = ridge(r, 376, 26, 3);
  return (
    <svg className={className} viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={part.sky[0]} />
          <stop offset="0.62" stopColor={part.sky[1]} />
          <stop offset="0.86" stopColor={part.sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="0.5" cy="0.4" r="0.5">
          <stop offset="0" stopColor={part.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={part.glow} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${id}p`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M20 4l4.7 11.3L36 20l-11.3 4.7L20 36l-4.7-11.3L4 20l11.3-4.7zM0 0l8 8M40 0l-8 8M0 40l8-8M40 40l-8-8"
            fill="none"
            stroke={GOLD}
            strokeWidth="0.6"
          />
        </pattern>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}m`}>
          <rect width="300" height="420" fill={`url(#${id}f)`} />
        </mask>
      </defs>
      <rect width="300" height="420" fill={`url(#${id}s)`} />
      <rect width="300" height="420" fill={`url(#${id}p)`} mask={`url(#${id}m)`} opacity="0.22" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="#fff" opacity={s.o} />
      ))}
      <circle cx={orb.x} cy={orb.y} r="9" fill={part.glow} opacity="0.85" />
      <circle cx={orb.x} cy={orb.y} r="22" fill={part.glow} opacity="0.12" />
      <ellipse cx="150" cy="170" rx="150" ry="120" fill={`url(#${id}g)`} />
      <path d={far} fill={part.land} opacity="0.45" />
      <path d={mid} fill={part.land} opacity="0.75" />
      <path d={near} fill={part.land} />
      <g style={{ color: part.glow }}>
        <circle cx="150" cy="170" r="64" fill={part.sky[0]} fillOpacity="0.35" stroke={GOLD} strokeWidth="1.2" />
        <circle cx="150" cy="170" r="57" fill="none" stroke={GOLD} strokeWidth="0.6" strokeDasharray="1.5 3" />
        <IconAt name={emblem} x={150} y={170} size={62} />
      </g>
      <rect x="9" y="9" width="282" height="402" rx="4" fill="none" stroke={GOLD} strokeOpacity="0.4" />
      {[
        [9, 9],
        [291, 9],
        [9, 411],
        [291, 411],
      ].map(([x, y]) => (
        <path key={`${x}${y}`} d={`M${x} ${y - 6}l6 6-6 6-6-6z`} fill={GOLD} opacity="0.7" />
      ))}
    </svg>
  );
}
