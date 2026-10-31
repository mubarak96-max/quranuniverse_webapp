import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { dayPages } from "@/components/q30/day";
import { Reader } from "@/components/q30/Reader";
import { getDay, getDayNumbers, getSummary } from "@/lib/q30";
import { BASE, coverSrc, dayHref } from "@/lib/q30-types";
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
  const description = `${d.question} ${d.summary}`.slice(0, 158);
  const url = dayHref(d.day);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url, siteName: SITE.name, images: [{ url: coverSrc(d.day), width: 1600, height: 1067 }] },
    twitter: { card: "summary_large_image", title, description, images: [coverSrc(d.day)] },
  };
}

export default async function DayPage({ params }: { params: Params }) {
  const d = getDay(numberOf((await params).day));
  if (!d) notFound();
  const next = getSummary(d.day + 1);
  const url = dayHref(d.day);
  const pages = dayPages(d, next);
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
          timeRequired: `PT${d.minutes}M`,
          isPartOf: { "@type": "Course", name: "Quran in 30 Days", url: absUrl(BASE) },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Quran in 30 Days", path: BASE },
            { name: `Day ${d.day}`, path: url },
          ]),
        }}
      />
      <Reader
        titles={pages.map(({ title, kind }) => ({ title, kind }))}
        pages={pages.map((p, i) => <Fragment key={i}>{p.node}</Fragment>)}
        label={`Day ${d.day} · ${d.title}`}
        day={d.day}
        closeHref={BASE}
      />
    </>
  );
}
