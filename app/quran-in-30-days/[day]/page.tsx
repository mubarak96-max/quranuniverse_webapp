import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Booklet } from "@/components/q30/Booklet";
import { dayPages } from "@/components/q30/pages";
import { getDay, getDayNumbers, getSummaries } from "@/lib/q30";
import { BASE, dayHref } from "@/lib/q30-types";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

type Params = Promise<{ day: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return getDayNumbers().map((n) => ({ day: `day-${n}` }));
}

const numberOf = (slug: string) => Number(/^day-(\d+)$/.exec(slug)?.[1]);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = getDay(numberOf((await params).day));
  if (!d) return {};
  const title = `Day ${d.day}: ${d.title} · Quran in 30 Days`;
  const description = `${d.question} ${d.intro[0]}`.slice(0, 158);
  const url = dayHref(d.day);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, siteName: SITE.name },
    twitter: { card: "summary", title, description },
  };
}

export default async function DayPage({ params }: { params: Params }) {
  const d = getDay(numberOf((await params).day));
  if (!d) notFound();
  const next = getSummaries().find((s) => s.day === d.day + 1);
  const url = dayHref(d.day);
  return (
    <>
      <JsonLd
        data={{
          "@type": "LearningResource",
          name: `Day ${d.day}: ${d.title}`,
          description: d.question,
          url: absUrl(url),
          learningResourceType: "Lesson",
          educationalLevel: "Beginner",
          inLanguage: "en",
          timeRequired: "PT20M",
          isPartOf: { "@type": "Course", name: "Quran in 30 Days", url: absUrl(BASE) },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Quran in 30 Days", path: BASE },
            { name: `Day ${d.day}`, path: url },
          ]),
        }}
      />
      <Booklet pages={dayPages(d, next)} label={`Day ${d.day} · ${d.title}`} day={d.day} closeHref={BASE} />
    </>
  );
}
