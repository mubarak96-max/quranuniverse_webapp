import type { ReactNode } from "react";

// Pieces of the journey map every game shares. Styles live in app/games/map.css.

// Progress ring for the map summary; `children` is the figure shown in its centre.
export function Ring({ fraction, label, children }: { fraction: number; label: string; children: ReactNode }) {
  const r = 52;
  const len = 2 * Math.PI * r;
  return (
    <div className="gs-ring" role="img" aria-label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r={r} className="gs-ring-track" />
        {fraction > 0 && <circle cx="60" cy="60" r={r} className="gs-ring-fill" strokeDasharray={`${fraction * len} ${len}`} />}
        <g className="gs-ring-star">
          <rect x="41" y="41" width="38" height="38" rx="2" />
          <rect x="41" y="41" width="38" height="38" rx="2" transform="rotate(45 60 60)" />
        </g>
      </svg>
      <span>{children}</span>
    </div>
  );
}

type Banner = {
  art: string;
  ar?: string;
  kicker: ReactNode;
  name: string;
  line: ReactNode;
  // Top-left corner: the chapter's stars as text ("12/30"), or a game's own badge as children.
  stars?: string;
  children?: ReactNode;
  locked?: boolean;
  expanded: boolean;
  onToggle: () => void;
};

// The illustrated header of one chapter; tapping it opens or closes the chapter's level path.
export function ChapterBanner({ art, ar, kicker, name, line, stars, children, locked = false, expanded, onToggle }: Banner) {
  return (
    <button
      type="button"
      className="gs-banner"
      style={{ backgroundImage: `url(${art})` }}
      onClick={onToggle}
      aria-expanded={locked ? undefined : expanded}
      disabled={locked}
    >
      {ar && <span className="gs-banner-ar ar" lang="ar" dir="rtl">{ar}</span>}
      <span className="gs-banner-n">{kicker}</span>
      <b>{name}</b>
      <span className="gs-banner-line">{line}</span>
      {stars && <span className="gs-banner-stars">★ {stars}</span>}
      {children}
    </button>
  );
}

