// Line icons for covers, panels and galleries, drawn on a 24-unit grid. Names match ICONS in lib/q30-types.ts.
// No faces or figures: people appear only as an assembly of dots.
import type { Icon as IconName } from "@/lib/q30-types";

const P: Record<IconName, React.ReactNode> = {
  star: <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z" />,
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </>
  ),
  flame: (
    <>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.4 2.6-5.3 3.6-8.4.7 1.9 1.9 2.9 2.9 3.3.2-2.6 1.4-4.9 3.4-6.8.4 3.6 3.1 6.1 3.1 10.2 0 4.3-2.6 7.8-6.5 7.8z" />
      <path d="M12 21c-1.7 0-2.9-1.2-2.9-2.9 0-1.9 1.5-2.7 2.1-4.4 1.6 1 3.7 2.4 3.7 4.6 0 1.6-1.2 2.7-2.9 2.7z" />
    </>
  ),
  drop: <path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" />,
  book: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
      <path d="M12 6.5v13" />
    </>
  ),
  scroll: (
    <>
      <path d="M7 4h11a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1z" />
      <path d="M7 16h8M10 8h4M10 11.5h4" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10M5 7h14" />
      <path d="M5 7l-2.5 6a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />
    </>
  ),
  tree: (
    <>
      <path d="M12 21v-7M12 14l-3-3M12 12.5l2.5-2.5" />
      <path d="M12 3c3.6 0 6.5 2.8 6.5 6.3 0 3.1-2.6 5.2-6.5 5.2s-6.5-2.1-6.5-5.2C5.5 5.8 8.4 3 12 3z" />
    </>
  ),
  mountain: <path d="M2.5 20l7-12 4 6.5 2.5-3.5 5.5 9zM8 10.6l1.5 1.4 1.5-1.4" />,
  ship: <path d="M3 15h18l-2.5 4.5h-13zM12 3v12M12 4l6 8.5h-6M12 6l-4.5 6.5H12" />,
  wave: (
    <path d="M2.5 9c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5M2.5 14c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5M2.5 19c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 3-1.5" />
  ),
  cave: <path d="M2.5 20C3.5 11 7 5 12 5s8.5 6 9.5 15zM8 20c0-4.4 1.8-7.5 4-7.5s4 3.1 4 7.5" />,
  wall: (
    <path d="M3 6h18v13H3zM3 10.3h18M3 14.6h18M9 6v4.3M15 6v4.3M6 10.3v4.3M12 10.3v4.3M18 10.3v4.3M9 14.6V19M15 14.6V19" />
  ),
  ant: (
    <>
      <circle cx="6.5" cy="12" r="2" />
      <circle cx="12" cy="12" r="1.6" />
      <ellipse cx="17.5" cy="12" rx="3" ry="2.4" />
      <path d="M11 10.5l-2-4M13 10.5l1.5-4M11 13.5l-2 4M13 13.5l1.5 4M5.5 10.2L4 7.5M7 10.2l.5-3" />
    </>
  ),
  bird: <path d="M2.5 10c3-1 6 0 9.5 4 3.5-4 6.5-5 9.5-4M9 12.4c1-.9 2-1.4 3-1.4s2 .5 3 1.4" />,
  fish: (
    <>
      <path d="M3 12c3-4.5 9-6 14-2l4-3v10l-4-3c-5 4-11 2.5-14-2z" />
      <circle cx="7.5" cy="11" r=".6" />
    </>
  ),
  camel: (
    <path d="M3 19v-4.5c0-2 1-3 2.5-3.5L7 7.5c.4-1 1.6-1 2 0l1.5 3.5c.8-2.5 2-4 3.5-4s2.5 1.3 3 3.5l.5 2h1.5c.8 0 1.5-.6 1.5-1.4V8.5l1-.5v4c0 1.5-1 3-2.5 3l-.5 4M7 19v-3.5M15 19v-3.5" />
  ),
  staff: <path d="M10 21V7a3.5 3.5 0 0 1 7 0v1.5" />,
  well: <path d="M5 11h14v9H5zM5 14.5h14M3.5 11h17M6 11V5h12v6M6 5l6-2 6 2M12 5v4" />,
  crown: <path d="M3.5 18l-1-10 5.5 4L12 5l4 7 5.5-4-1 10zM4 21h16" />,
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M18 12v3M15.5 12v2.5" />
    </>
  ),
  lamp: (
    <path d="M3.5 14.5c0-1.8 2.7-3 7-3h3c2 0 3.5-.8 4.5-2.2l2.5.6c-.6 3-2.8 5.1-7 5.1M3.5 14.5c0 1.8 2.2 3.5 5.5 3.5h4c2.5 0 4-1.2 4.5-3M14.5 11.5c-.5-2 0-4 1.5-5.5.3 1.5 1.2 2.5 2 3M8 21h8" />
  ),
  gate: <path d="M4 21V9a8 8 0 0 1 16 0v12M8 21v-9a4 4 0 0 1 8 0v9M2.5 21h19" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  seed: <path d="M12 21v-8M12 13c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5zM12 15c0-3.5-2-5.5-6-5.5 0 3.7 2 5.5 6 5.5zM8 21h8" />,
  cloud: <path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.5A3.3 3.3 0 0 0 7 18.5z" />,
  wind: <path d="M3 9h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h7" />,
  river: <path d="M8 3c-2 3 3 5 1 8s-5 4-3 10M16 3c-2 3 3 5 1 8s-5 4-3 10" />,
  cup: <path d="M5 5h14l-1.5 11a3 3 0 0 1-3 2.5h-5a3 3 0 0 1-3-2.5zM5.5 9h13M9 21h6M12 18.5V21" />,
  jar: <path d="M8 3h8M9 3v3c-2.5 1-4 3.5-4 6.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5c0-3-1.5-5.5-4-6.5V3M5 13h14" />,
  cube: <path d="M12 3l8.5 4.5v9L12 21l-8.5-4.5v-9zM3.5 7.5L12 12l8.5-4.5M12 12v9M3.5 10.5L12 15l8.5-4.5" />,
  minaret: <path d="M9 21V9h6v12M8 9h8M10 9V6.5a2 2 0 0 1 4 0V9M12 4.5v-2M7 21h10M11 13h2v2h-2z" />,
  shield: <path d="M12 3l7.5 3v6c0 4.5-3.2 7.7-7.5 9-4.3-1.3-7.5-4.5-7.5-9V6z" />,
  tent: <path d="M2.5 20L12 4l9.5 16zM12 4v16M9 20l3-6 3 6" />,
  pen: <path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11zM14 6.5l3.5 3.5M4 20h7" />,
  feather: <path d="M20 4C11 4 6 10 5 19M20 4c0 6-3 11-10 12H6.5M16 8l-6 6" />,
  hourglass: <path d="M6 3h12M6 21h12M7 3c0 4.5 5 5.5 5 9s-5 4.5-5 9M17 3c0 4.5-5 5.5-5 9s5 4.5 5 9" />,
  horn: <path d="M3 10v4h3l11 5V5L6 10zM6 14l1 5h2.5L9 15M19.5 9.5a3.5 3.5 0 0 1 0 5" />,
  city: <path d="M3 21V11h5v10M8 21V6h8v15M16 21V9h5v12M2 21h20M11 9h2M11 12h2M11 15h2" />,
  palm: (
    <path d="M12 21c0-5 .5-9 1-12M13 9c-1-3-4-4.5-7.5-4 2 .5 3.5 1.8 4 3.5M13 9c1.5-3 4.5-4 8-3-2 .5-3.5 1.5-4.5 3.2M13 9c-3-.5-6 .8-7.5 3.5M13 9c3-.3 5.5 1.2 6.5 4" />
  ),
  grapes: (
    <>
      <circle cx="9" cy="10" r="2" />
      <circle cx="13" cy="10" r="2" />
      <circle cx="11" cy="13.5" r="2" />
      <circle cx="15" cy="13.5" r="2" />
      <circle cx="13" cy="17" r="2" />
      <path d="M11 8c0-2 1-3.5 3-4.5" />
    </>
  ),
  wheat: (
    <path d="M12 21V5M12 8c-2-1-3-2.5-3-4.5 2 .5 3 2 3 4.5zM12 8c2-1 3-2.5 3-4.5-2 .5-3 2-3 4.5zM12 12.5c-2-1-3-2.5-3-4.5 2 .5 3 2 3 4.5zM12 12.5c2-1 3-2.5 3-4.5-2 .5-3 2-3 4.5zM12 17c-2-1-3-2.5-3-4.5 2 .5 3 2 3 4.5zM12 17c2-1 3-2.5 3-4.5-2 .5-3 2-3 4.5z" />
  ),
  coin: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  chain: (
    <path d="M10 14a4 4 0 0 1 0-5.7l2.3-2.3a4 4 0 0 1 5.7 5.7l-1.2 1.2M14 10a4 4 0 0 1 0 5.7l-2.3 2.3A4 4 0 0 1 6 12.3l1.2-1.2" />
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5v-3a4 4 0 0 1 8 0v3M12 14.5V17" />
    </>
  ),
  rays: (
    <>
      <circle cx="12" cy="14" r="2" />
      <path d="M12 21v-5M12 12V3M10.6 12.6L5 5M13.4 12.6L19 5M10 14H3M14 14h7" />
    </>
  ),
  seat: <path d="M7 3h10v8H7zM5 11h14v3H5zM6.5 14v7M17.5 14v7M6.5 18h11" />,
  table: <path d="M2.5 9.5h19M4.5 9.5v10M19.5 9.5v10M7 9.5C7 7.5 9.2 6 12 6s5 1.5 5 3.5M12 4v2" />,
  web: <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4M12 7l3.5 1.5L17 12l-1.5 3.5L12 17l-3.5-1.5L7 12l1.5-3.5z" />,
  people: (
    <>
      <circle cx="6" cy="8" r="1.8" />
      <circle cx="12" cy="6" r="1.8" />
      <circle cx="18" cy="8" r="1.8" />
      <circle cx="9" cy="13" r="1.8" />
      <circle cx="15" cy="13" r="1.8" />
      <circle cx="12" cy="18" r="1.8" />
    </>
  ),
  path: (
    <>
      <path d="M4.5 20.5c1-3 4-4.5 8-5.5s6.5-3.5 7.5-7" strokeDasharray="2 2.2" />
      <circle cx="20" cy="5" r="2" />
    </>
  ),
  home: <path d="M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5" />,
  spark: <path d="M12 3c.6 4.8 3.2 7.4 8 8-4.8.6-7.4 3.2-8 8-.6-4.8-3.2-7.4-8-8 4.8-.6 7.4-3.2 8-8z" />,
  door: (
    <>
      <path d="M6 21V4h12v17M3.5 21h17" />
      <circle cx="15" cy="12.5" r=".7" />
    </>
  ),
  hand: <path d="M4 11c0 4.5 3 8 8 8s8-3.5 8-8zM8 11V8M12 11V7M16 11V8" />,
  bridge: <path d="M2.5 17h19M4 17c2-5 5-7.5 8-7.5s6 2.5 8 7.5M7 17v-3.5M12 17V9.5M17 17v-3.5" />,
  garden: (
    <path d="M7 21v-5M7 16c-2.2 0-3.5-1.5-3.5-3.5S5 9 7 9s3.5 1.5 3.5 3.5S9.2 16 7 16zM16 21v-9M16 12c-2.8 0-4.5-2-4.5-4.5S13.2 3 16 3s4.5 2 4.5 4.5S18.8 12 16 12zM2.5 21c3-1.5 6-1.5 9.5 0s6.5 1.5 9.5 0" />
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}

// For drawing an icon inside a larger SVG (covers), placed at x,y with a given size.
export function IconAt({ name, x, y, size }: { name: IconName; x: number; y: number; size: number }) {
  const k = size / 24;
  return (
    <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${k})`} fill="none" stroke="currentColor" strokeWidth={2.4 / k} strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </g>
  );
}
