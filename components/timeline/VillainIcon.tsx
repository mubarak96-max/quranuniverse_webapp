import type { VillainSymbol } from "@/lib/timeline-types";

// Symbols stand in for faces, which are never drawn.
const PATHS: Record<VillainSymbol, string> = {
  flame: "M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 2 3 0-3 0-5 1-7z",
  fire: "M3 20h18M7 17c-1-2 0-4 1-5 0 2 1 2 2 3 0-3 1-5 2-6 1 3 3 4 3 8M16 17c0-2 1-3 2-4 1 2 1 3 0 4",
  blade: "M20 4l-1 5-9 9-3-3 9-9zM7 15l-3 3 2 2 3-3M5 13l6 6",
  crown: "M4 18h16M4 18 3 8l5 4 4-7 4 7 5-4-1 10",
  tower: "M8 21V8l4-5 4 5v13M5 21h14M11 11h2M11 15h2",
  coins: "M5 7a7 3 0 1 0 14 0 7 3 0 1 0-14 0M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5",
  calf: "M4 5c0 3 2 5 5 5h6c3 0 5-2 5-5M8 10l1 7c0 2 1.5 3 3 3s3-1 3-3l1-7M10 14h.01M14 14h.01",
  shield: "M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM12 8v8M8 12h8",
  elephant: "M5 18v-7a6 6 0 0 1 6-6h3a6 6 0 0 1 6 6v3c0 2-1 3-2 3s-1-1-1-2M9 18v-3M14 18v-3M5 14h10M9 9h.01",
  spear: "M4 20 16 8M13 5l6-1-1 6-2-3zM6 15l3 3",
  chain: "M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1",
  scroll: "M8 4h10a2 2 0 0 1 0 4h-2v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h2zM8 16h6M11 9h3M11 12h3",
  mask: "M4 5c3 1.3 13 1.3 16 0v6c0 5-4 9-8 9s-8-4-8-9zM8 10h2M14 10h2M9 15c2 1 4 1 6 0",
  kaaba: "M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10M4 10.5l8 4 8-4",
  arrow: "M5 19 19 5M13 5h6v6M5 19l-1-3M5 19l3 1M8 16l-3-1M8 16l1 3",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
  wall: "M3 6h18v12H3zM3 10h18M3 14h18M9 6v4M15 6v4M6 10v4M12 10v4M18 10v4M9 14v4M15 14v4",
};

export function VillainIcon({ symbol, className }: { symbol: VillainSymbol; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[symbol]} />
    </svg>
  );
}
