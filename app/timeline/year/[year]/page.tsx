import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TimelineApp } from "@/components/timeline/TimelineApp";
import { SITE } from "@/lib/site";
import { getSeed, getTimeline } from "@/lib/timeline";
import { refHref, toAh } from "@/lib/timeline-types";
import { meanwhile, YEAR_PAGES } from "@/lib/timeline-world";

type Params = Promise<{ year: string }>;

export const dynamicParams = false;

// One page per recent year, so "your birth year in Islamic history" has a link worth sharing.
export function generateStaticParams() {
  const { now } = getTimeline();
  return Array.from({ length: now - YEAR_PAGES.from + 1 }, (_, i) => ({ year: String(YEAR_PAGES.from + i) }));
}

const NEAR_YEARS = 40;

function yearData(year: number) {
  const data = getTimeline();
  const ah = toAh(year);
  const world = meanwhile(data, year, undefined, 4);
  const near = data.stops
    .filter((s) => s.type === "event" && s.year !== undefined && Math.abs(s.year - year) <= NEAR_YEARS)
    .sort((a, b) => a.year! - b.year!);
  return { data, ah, world, near };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const year = Number((await params).year);
  const { ah, world } = yearData(year);
  const title = `The world in ${year} (${ah}–${ah + 1} AH): Islamic History Timeline`;
  const description = `What was happening in ${year}, the year ${ah} AH began: ${world.map((m) => `${m.title} in ${m.region}`).join(", ")}.`;
  const url = `/timeline/year/${year}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // Share pages for a personal hook; thin on their own, so they stay out of the index.
    robots: { index: false, follow: true },
    openGraph: { type: "website", title, description, url, siteName: SITE.name },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TimelineYearPage({ params }: { params: Params }) {
  const year = Number((await params).year);
  if (!Number.isInteger(year)) notFound();
  const { ah, world, near } = yearData(year);
  return (
    <>
      <h1 className="sr-only">
        The world in {year}, {ah}–{ah + 1} AH
      </h1>
      <TimelineApp seed={getSeed()} initialView="explore" initialYear={year} />
      <section className="tl-index" aria-labelledby="tl-year-h">
        <h2 id="tl-year-h">
          The world in {year} · {ah}–{ah + 1} AH
        </h2>
        <p className="tl-index-note">
          {year - 622} years after the Hijra. Around the world that year and the decades around it:
        </p>
        <ul>
          {world.map((m) => (
            <li key={m.ref.id}>
              <Link href={refHref(m.ref)}>
                {m.region}: {m.title} ({m.when})
              </Link>
            </li>
          ))}
          {near.map((s) => (
            <li key={s.id}>
              <Link href={`/timeline/${s.id}`}>
                <time>{s.label.split(" · ")[0]}</time> {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
