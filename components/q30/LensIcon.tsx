// One small line icon per lens, so a chapter's voice can be recognised at a glance in lists and on the slider.
import type { Lens } from "@/lib/q30-types";

const P: Record<Lens, React.ReactNode> = {
  story: (
    <>
      <path d="M7 4h11a2 2 0 0 1 0 4h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1 0-4h1z" />
      <path d="M7 16h8M10 8h4M10 11.5h4" />
    </>
  ),
  text: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
      <path d="M12 6.5v13" />
    </>
  ),
  scholar: <path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11zM14 6.5l3.5 3.5M4 20h7" />,
  reason: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />,
  life: <path d="M12 21v-8M12 13c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5zM12 15c0-3.5-2-5.5-6-5.5 0 3.7 2 5.5 6 5.5zM8 21h8" />,
};

export function LensIcon({ lens }: { lens: Lens }) {
  return (
    <svg className="lens-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[lens]}
    </svg>
  );
}
