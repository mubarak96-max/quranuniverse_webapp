import { ImageResponse } from "next/og";
import { getTimeline } from "@/lib/timeline";
import { OG_SIZE, OgCard } from "@/lib/timeline-og";
import { toAh } from "@/lib/timeline-types";
import { meanwhile, YEAR_PAGES } from "@/lib/timeline-world";

export const alt = "The world in this year, in Islamic history";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  const { now } = getTimeline();
  return Array.from({ length: now - YEAR_PAGES.from + 1 }, (_, i) => ({ year: String(YEAR_PAGES.from + i) }));
}

export default async function Image({ params }: { params: Promise<{ year: string }> }) {
  const year = Number((await params).year);
  const ah = toAh(year);
  const world = meanwhile(getTimeline(), year, undefined, 2);
  return new ImageResponse(
    (
      <OgCard
        year={String(year)}
        era="CE"
        ah={`${ah}–${ah + 1} AH`}
        eyebrow="Your year in Islamic history"
        title={`${(year - 622).toLocaleString("en-US")} years after the Hijra`}
        lines={world.map((m) => `In ${m.region}: ${m.title}`)}
      />
    ),
    size,
  );
}
