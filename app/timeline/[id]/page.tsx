import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { TimelineArticle } from "@/components/timeline/TimelineArticle";
import { timelineEntry } from "@/lib/timeline-entry";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";
import { getStop, getTimeline } from "@/lib/timeline";

type Params = Promise<{ id: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getTimeline().stops.map((s) => ({ id: s.id }));
}

function titleOf(id: string) {
  const s = getStop(id)!;
  return s.type === "chapter" ? `${s.title} (${s.label})` : `${s.title}, ${s.label.split(" · ")[0]}`;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const s = getStop(id);
  if (!s) return {};
  const title = `${titleOf(id)}: Islamic History Timeline`;
  const description = s.place?.name && s.type === "event" ? `${s.place.name}. ${s.what}` : s.what;
  const url = `/timeline/${id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, siteName: SITE.name },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TimelineStopPage({ params }: { params: Params }) {
  const { id } = await params;
  const s = getStop(id);
  if (!s) notFound();
  const data = getTimeline();
  const card = timelineEntry(data, { t: "event", id })!;
  const index = data.stops.findIndex((stop) => stop.id === id);
  return (
    <>
      <JsonLd
        data={{
          "@type": "WebPage",
          name: titleOf(id),
          description: s.what,
          url: absUrl(`/timeline/${id}`),
          isPartOf: { "@id": `${SITE.url}/#website` },
          about: { "@type": "Thing", name: s.title },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
            { name: s.title, path: `/timeline/${id}` },
          ]),
        }}
      />
      <TimelineArticle card={card} stop={s} previous={data.stops[index - 1]} next={data.stops[index + 1]} />
    </>
  );
}
