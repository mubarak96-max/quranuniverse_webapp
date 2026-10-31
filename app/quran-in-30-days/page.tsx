import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { hasImage } from "@/components/q30/blocks";
import { Journey } from "@/components/q30/Journey";
import { getSummaries } from "@/lib/q30";
import { BASE, coverSrc, dayHref } from "@/lib/q30-types";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

const title = "Learn the Quran in 30 Days: A Free Guided Course, 15 Minutes a Day";
const description =
  "A free 30-day course that maps the whole Quran: Allah, the prophets, the unseen, the Hereafter, its laws and its ethics. Each day told as story, close reading, scholarship and reflection, with Arabic, English and a quiz.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: BASE },
  openGraph: { type: "website", title, description, url: BASE, siteName: SITE.name, images: [{ url: "/q30/home.webp", width: 1600, height: 1067 }] },
  twitter: { card: "summary_large_image", title, description, images: ["/q30/home.webp"] },
};

export default function Q30Home() {
  const days = getSummaries();
  const thumbs = Object.fromEntries(
    days.map((d) => [d.day, hasImage(coverSrc(d.day)) ? coverSrc(d.day).replace(".webp", "-sm.webp") : undefined]),
  );
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
          hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: "PT15M" },
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD", category: "Free" },
          hasPart: days.map((d) => ({ "@type": "LearningResource", name: `Day ${d.day}: ${d.title}`, url: absUrl(dayHref(d.day)) })),
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Quran in 30 Days", path: BASE },
          ]),
        }}
      />
      <Journey days={days} thumbs={thumbs} hero={hasImage("/q30/home.webp") ? "/q30/home.webp" : undefined} urls={urls} />
    </>
  );
}
