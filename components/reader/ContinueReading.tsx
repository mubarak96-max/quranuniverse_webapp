"use client";

import Link from "next/link";
import { useBookmarks, useLastRead } from "./store";

// Shown on the home page to returning readers only; first-time visitors see nothing, and neither does the static HTML.
export function ContinueReading() {
  const last = useLastRead();
  const bookmarks = useBookmarks();
  if (!last && !bookmarks?.length) return null;
  return (
    <section className="continue" aria-label="Your reading">
      {last && (
        <Link href={last.href} className="continue-main">
          <small>Continue reading</small>
          <b>
            {last.surah} · {last.key}
          </b>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      {!!bookmarks?.length && (
        <Link href="/bookmarks" className="continue-saved">
          <small>Bookmarks</small>
          <b>
            {bookmarks.length} saved {bookmarks.length === 1 ? "verse" : "verses"}
          </b>
        </Link>
      )}
    </section>
  );
}
