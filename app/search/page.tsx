import type { Metadata } from "next";
import { Search } from "@/components/search/Search";

export const metadata: Metadata = {
  title: "Search the Quran in English",
  description:
    "Search every verse of the Quran in English by word or topic, plus the 99 Names of Allah, the prophets, the timeline and articles.",
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return (
    <div className="reader search-page">
      <header className="surah-head">
        <h1>Search the Quran</h1>
        <p className="meta">Every verse in English, plus names, prophets, topics and lessons</p>
      </header>
      <Search />
    </div>
  );
}
