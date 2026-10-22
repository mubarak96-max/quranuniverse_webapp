import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { TimelineApp } from "@/components/timeline/TimelineApp";
import { TimelineIndex } from "@/components/timeline/TimelineIndex";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";
import { getSeed, getTimeline } from "@/lib/timeline";

const title = "Islamic History Timeline: The Story of the World from Adam to Today";
const description =
  "An interactive map of world history through the Quran: the prophets from Adam to Muhammad ﷺ, the caliphates, Baghdad, Cordoba, the Ottomans and the modern Muslim world, told in over 200 moments.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["islamic history timeline", "prophets timeline", "history of islam map", "timeline of prophets in islam", "muslim empires map"],
  alternates: { canonical: "/timeline" },
  openGraph: { type: "website", title, description, url: "/timeline", siteName: SITE.name },
};

export default function TimelinePage() {
  const data = getTimeline();
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: title,
          description,
          url: absUrl("/timeline"),
          isPartOf: { "@id": `${SITE.url}/#website` },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
          ]),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: data.chapters.length,
            itemListElement: data.chapters.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${c.title} (${c.span})`,
              url: absUrl(`/timeline/chapter-${c.id}`),
            })),
          },
        }}
      />
      <TimelineApp seed={getSeed()} initialView="intro" />
      <TimelineIndex data={data} />
    </>
  );
}
