import type { Metadata } from "next";
import Link from "next/link";
import { getReference } from "@/lib/q30";
import { BASE, dayHref } from "@/lib/q30-types";
import { SITE } from "@/lib/site";

const title = "Quran in 30 Days: Key Arabic Words and Every Verse Studied";
const description = "The reference for the Quran in 30 Days course: the key Arabic words with their roots, and every passage studied, grouped by surah.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${BASE}/reference` },
  openGraph: { type: "website", title, description, url: `${BASE}/reference`, siteName: SITE.name },
};

export default function ReferencePage() {
  const { words, verses } = getReference();
  return (
    <div className="rf">
      <Link href={BASE} className="rf-back">
        ← All days
      </Link>
      <h1>Key words and verses</h1>
      <p className="rf-lede">Every Arabic word the course teaches, and every passage it reads, grouped by surah.</p>
      <h2>The key words</h2>
      <ul className="rf-words">
        {words.map((w) => (
          <li key={`${w.day}${w.tr}`}>
            <span className="ar" lang="ar" dir="rtl">
              {w.ar}
            </span>
            <span>
              <b>{w.tr}</b>
              <span>{w.meaning}</span>
            </span>
            <span className="ar rf-root" lang="ar" dir="rtl">
              {w.root.join(" ")}
            </span>
            <Link href={dayHref(w.day)}>Day {w.day}</Link>
          </li>
        ))}
      </ul>
      <h2>Every passage, by surah</h2>
      <dl className="rf-verses">
        {verses.map((s) => (
          <div key={s.surah}>
            <dt>
              {s.surah}. {s.name}
            </dt>
            <dd>
              {s.refs.map((r) => (
                <Link key={`${r.ref}${r.day}`} href={r.href}>
                  {r.ref} <small>Day {r.day}</small>
                </Link>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
