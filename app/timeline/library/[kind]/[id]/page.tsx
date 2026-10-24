import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { LibraryIndex } from "@/components/timeline/LibraryIndex";
import { TimelineApp } from "@/components/timeline/TimelineApp";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";
import { getCardSeed, getLibraryRefs, getTimeline } from "@/lib/timeline";
import { buildCard } from "@/lib/timeline-graph";
import { SLUG, fromSlug, refHref, type Ref } from "@/lib/timeline-types";

type Params = Promise<{ kind: string; id: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getLibraryRefs().map((r) => ({ kind: SLUG[r.t]!, id: r.id }));
}

async function refOf(params: Params): Promise<Ref | undefined> {
  const { kind, id } = await params;
  const t = fromSlug(kind);
  return t ? { t, id } : undefined;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const ref = await refOf(params);
  const card = ref && buildCard(getTimeline(), ref);
  if (!ref || !card) return {};
  const title = `${card.name}${card.role ? `, ${card.role}` : ""}: ${card.kind} in Islamic History`;
  const description = [card.line, card.story].filter(Boolean).join(" ").slice(0, 300) || card.name;
  const url = refHref(ref);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, siteName: SITE.name },
    twitter: { card: "summary", title, description },
  };
}

export default async function LibraryEntryPage({ params }: { params: Params }) {
  const ref = await refOf(params);
  const card = ref && buildCard(getTimeline(), ref);
  if (!ref || !card) notFound();
  const url = refHref(ref);
  return (
    <>
      <JsonLd
        data={{
          "@type": "WebPage",
          name: card.name,
          description: card.line ?? card.story,
          url: absUrl(url),
          isPartOf: { "@id": `${SITE.url}/#website` },
          about: { "@type": ref.t === "person" ? "Person" : ref.t === "place" ? "Place" : "Thing", name: card.name },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
            { name: "Library", path: "/timeline/library" },
            { name: card.name, path: url },
          ]),
        }}
      />
      <h1 className="sr-only">
        {card.name}
        {card.role ? `, ${card.role}` : ""}
      </h1>
      {/* Keyed so a link from the index below starts the app fresh at that entry. */}
      <TimelineApp key={url} seed={getCardSeed(ref)} initialView="entity" initialRef={ref} />
      <LibraryIndex data={getTimeline()} current={ref.id} />
    </>
  );
}
