import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkList } from "@/components/reader/BookmarkList";

export const metadata: Metadata = {
  title: "Your Bookmarks",
  description: "The Quran verses you have saved on Quran Universe.",
  alternates: { canonical: "/bookmarks" },
  robots: { index: false, follow: true },
};

export default function BookmarksPage() {
  return (
    <div className="reader bookmarks">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Surahs</Link>
        <span aria-hidden="true">/</span>
        <span>Bookmarks</span>
      </nav>
      <header className="surah-head">
        <h1>Your bookmarks</h1>
        <p className="meta">Verses you saved to come back to</p>
      </header>
      <BookmarkList />
    </div>
  );
}
