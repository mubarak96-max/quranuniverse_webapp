import type { Metadata } from "next";
import { Booklet } from "@/components/q30/Booklet";
import { referencePages } from "@/components/q30/guide";
import { getReference } from "@/lib/q30";
import { BASE } from "@/lib/q30-types";
import { SITE } from "@/lib/site";

const title = "Quran in 30 Days: Key Arabic Words and Every Verse Studied";
const description = "The reference booklet for the Quran in 30 Days course: the 30 key Arabic words with their roots, and every passage studied, grouped by surah.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE}/reference` },
  openGraph: { type: "website", title, description, url: `${BASE}/reference`, siteName: SITE.name },
};

export default function ReferencePage() {
  return <Booklet pages={referencePages(getReference())} label="Key words and verses" closeHref={BASE} />;
}
