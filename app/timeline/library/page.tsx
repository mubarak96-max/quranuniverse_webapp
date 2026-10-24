import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { LibraryIndex } from "@/components/timeline/LibraryIndex";
import { TimelineApp } from "@/components/timeline/TimelineApp";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";
import { getSeed, getTimeline } from "@/lib/timeline";

const title = "People of the Quran, Companions, Scholars and Empires: The Islamic History Library";
const description =
  "Luqman, Harut and Marut, Dhul-Qarnayn, the Companions, the Mothers of the Believers, the great scholars, the caliphs and sultans, the nations of the Quran and the empires of the world, each with what the Quran and hadith say.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["people in the quran", "people mentioned in the quran", "companions of the prophet", "islamic scholars", "list of caliphs", "nations in the quran"],
  alternates: { canonical: "/timeline/library" },
  openGraph: { type: "website", title, description, url: "/timeline/library", siteName: SITE.name },
};

export default function LibraryPage() {
  const data = getTimeline();
  return (
    <>
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: title,
          description,
          url: absUrl("/timeline/library"),
          isPartOf: { "@id": `${SITE.url}/#website` },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Timeline", path: "/timeline" },
            { name: "Library", path: "/timeline/library" },
          ]),
        }}
      />
      <h1 className="sr-only">{title}</h1>
      <TimelineApp seed={getSeed()} initialView="library" />
      <LibraryIndex data={data} />
    </>
  );
}
