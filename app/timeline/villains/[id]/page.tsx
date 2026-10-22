import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { TimelineApp } from "@/components/timeline/TimelineApp";
import { VillainIndex } from "@/components/timeline/VillainIndex";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";
import { getTimeline, getVillain, getVillainSeed } from "@/lib/timeline";
import type { Villain } from "@/lib/timeline-types";

type Params = Promise<{ id: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getTimeline().villains.map((v) => ({ id: v.id }));
}

// Iblis, the Dajjal and Yajuj and Majuj are not ordinary people, so they are described as things, not persons.
const isPerson = (v: Villain) => v.age !== "unseen" && v.age !== "end" && !v.group;

const titleOf = (v: Villain) => `Who Was ${v.name}? ${v.title} in Islamic History`;
const descriptionOf = (v: Villain) => `${v.deed} ${v.end}`;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const v = getVillain((await params).id);
  if (!v) return {};
  const title = titleOf(v);
  const description = descriptionOf(v);
  const url = `/timeline/villains/${v.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, siteName: SITE.name },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function VillainPage({ params }: { params: Params }) {
  const { id } = await params;
  const v = getVillain(id);
  if (!v) notFound();
  const { villains, villainAges } = getTimeline();
  const path = `/timeline/villains/${v.id}`;
  return (
    <>
      <JsonLd
        data={{
          "@type": "WebPage",
          name: titleOf(v),
          description: descriptionOf(v),
          url: absUrl(path),
          isPartOf: { "@id": `${SITE.url}/#website` },
          about: { "@type": isPerson(v) ? "Person" : "Thing", name: v.name, alternateName: v.arabic, description: v.title },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
            { name: "Villains", path: "/timeline/villains" },
            { name: v.name, path },
          ]),
        }}
      />
      <h1 className="sr-only">{titleOf(v)}</h1>
      {/* Keyed so a link from the index below starts the app fresh at that villain. */}
      <TimelineApp key={id} seed={getVillainSeed()} initialView="villains" initialVillain={id} />
      <VillainIndex villains={villains} ages={villainAges} current={id} />
    </>
  );
}
