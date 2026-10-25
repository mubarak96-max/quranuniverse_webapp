import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { TimelineArticle } from "@/components/timeline/TimelineArticle";
import { getTimeline } from "@/lib/timeline";
import { timelineEntry } from "@/lib/timeline-entry";
import { absUrl, breadcrumbs } from "@/lib/site";

type Params = Promise<{ id: string }>;
export const dynamicParams = false;
export function generateStaticParams() { return getTimeline().prophets.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const card = timelineEntry(getTimeline(), { t: "prophet", id });
  if (!card) return {};
  return { title: `${card.name}: Islamic History`, description: card.story, alternates: { canonical: `/timeline/prophets/${id}` } };
}
export default async function ProphetPage({ params }: { params: Params }) {
  const { id } = await params;
  const card = timelineEntry(getTimeline(), { t: "prophet", id });
  if (!card) notFound();
  const path = `/timeline/prophets/${id}`;
  return <>
    <JsonLd data={{ "@type": "WebPage", name: card.name, description: card.story, url: absUrl(path), breadcrumb: breadcrumbs([{ name: "Home", path: "/" }, { name: "Timeline", path: "/timeline" }, { name: card.name, path }]) }} />
    <TimelineArticle card={card} />
  </>;
}
