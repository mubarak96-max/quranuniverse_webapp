import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { TimelineApp } from "@/components/timeline/TimelineApp";
import { VillainIndex } from "@/components/timeline/VillainIndex";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";
import { getTimeline, getVillainSeed } from "@/lib/timeline";

const title = "Villains of Islamic History: From Iblis to the Dajjal";
const description =
  "Pharaoh, Qarun, Namrud, Abu Jahl, Abu Lahab, the Dajjal and every major villain of Islamic history, from the Quran, authentic hadith and the historians: what each one relied on, and what undid them.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["villains in islam", "enemies of the prophet", "pharaoh in the quran", "qarun", "abu jahl", "dajjal in islam", "tyrants in the quran"],
  alternates: { canonical: "/timeline/villains" },
  openGraph: { type: "website", title, description, url: "/timeline/villains", siteName: SITE.name },
};

export default function VillainsPage() {
  const { villains, villainAges } = getTimeline();
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: title,
          description,
          url: absUrl("/timeline/villains"),
          isPartOf: { "@id": `${SITE.url}/#website` },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
            { name: "Villains", path: "/timeline/villains" },
          ]),
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: villains.length,
            itemListElement: villains.map((v, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${v.name}, ${v.title.toLowerCase()}`,
              url: absUrl(`/timeline/villains/${v.id}`),
            })),
          },
        }}
      />
      <h1 className="sr-only">{title}</h1>
      <TimelineApp seed={getVillainSeed()} initialView="villains" />
      <VillainIndex villains={villains} ages={villainAges} />
    </>
  );
}
