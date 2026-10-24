import { ImageResponse } from "next/og";
import { getStop, getTimeline } from "@/lib/timeline";
import { OG_SIZE, OgCard } from "@/lib/timeline-og";
import { toAh } from "@/lib/timeline-types";

export const alt = "Islamic History Timeline";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return getTimeline().stops.map((s) => ({ id: s.id }));
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, s.lastIndexOf(" ", n))}…` : s);

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const s = getStop((await params).id)!;
  const chapter = getTimeline().chapters[s.chapter];
  const dated = s.year !== undefined && s.precision !== "unknown";
  const ah = s.ah ?? (dated && s.year! >= 622 ? toAh(s.year!) : undefined);
  return new ImageResponse(
    (
      <OgCard
        year={dated ? `${s.precision === "exact" ? "" : "c. "}${Math.abs(s.year!)}` : undefined}
        era={dated ? (s.year! < 0 ? "BCE" : "CE") : undefined}
        ah={ah !== undefined ? `${ah} AH` : undefined}
        eyebrow={`Chapter ${chapter.n} · ${chapter.title}`}
        title={s.title}
        lines={[clip(s.what, 150)]}
        place={s.place?.name}
      />
    ),
    size,
  );
}
