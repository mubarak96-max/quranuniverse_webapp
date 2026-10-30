import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { CoverArt } from "@/components/q30/Cover";
import { guidePages } from "@/components/q30/guide";
import { Shelf } from "@/components/q30/Shelf";
import { getSummaries } from "@/lib/q30";
import { BASE, dayHref } from "@/lib/q30-types";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

const title = "Learn the Quran in 30 Days: A Guided Course in 30 Short Booklets";
const description =
  "A free 30-day course that maps the whole Quran: Allah, the prophets, the unseen, the Hereafter, its laws and its ethics. One illustrated booklet a day with Arabic, English, a quiz and a verse to memorise.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: BASE },
  openGraph: { type: "website", title, description, url: BASE, siteName: SITE.name },
  twitter: { card: "summary", title, description },
};

export default function Q30Home() {
  const days = getSummaries();
  const covers = Object.fromEntries(days.map((d) => [d.day, <CoverArt key={d.day} day={d.day} emblem={d.emblem} />]));
  const urls = [BASE, `${BASE}/reference`, ...days.map((d) => dayHref(d.day))];
  return (
    <>
      <JsonLd
        data={{
          "@type": "Course",
          name: "The Quran in 30 Days",
          description,
          url: absUrl(BASE),
          provider: { "@id": `${SITE.url}/#organization` },
          inLanguage: "en",
          isAccessibleForFree: true,
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT20M" },
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD", category: "Free" },
          hasPart: days.map((d) => ({ "@type": "LearningResource", name: `Day ${d.day}: ${d.title}`, url: absUrl(dayHref(d.day)) })),
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Quran in 30 Days", path: BASE },
          ]),
        }}
      />
      <Shelf days={days} covers={covers} guide={guidePages()} urls={urls} />
    </>
  );
}
