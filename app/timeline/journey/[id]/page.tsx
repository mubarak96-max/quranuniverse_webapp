import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { JourneyPlayer } from "@/components/journey/JourneyPlayer";
import { getJourney, getJourneyIds } from "@/lib/journey";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

type Params = Promise<{ id: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getJourneyIds().map((id) => ({ id }));
}

const titleOf = (name: string) => `The Story of ${name}, Scene by Scene: Islamic History Timeline`;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const j = getJourney((await params).id);
  if (!j) return {};
  const title = titleOf(j.name);
  const url = `/timeline/journey/${j.id}`;
  return {
    title,
    description: j.description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description: j.description, url, siteName: SITE.name },
    twitter: { card: "summary", title, description: j.description },
  };
}

export default async function JourneyPage({ params }: { params: Params }) {
  const j = getJourney((await params).id);
  if (!j) notFound();
  const path = `/timeline/journey/${j.id}`;
  return (
    <>
      <JsonLd
        data={{
          "@type": "WebPage",
          name: titleOf(j.name),
          description: j.description,
          url: absUrl(path),
          isPartOf: { "@id": `${SITE.url}/#website` },
          about: { "@type": "Person", name: j.name },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
            { name: j.name, path },
          ]),
        }}
      />
      <JourneyPlayer journey={j} />
    </>
  );
}
