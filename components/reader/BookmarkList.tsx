"use client";

import Link from "next/link";
import { removeBookmark, useBookmarks, useLastRead } from "./store";

export function BookmarkList() {
  const bookmarks = useBookmarks();
  const last = useLastRead();
  if (bookmarks === undefined) return <p className="bm-empty">Loading your bookmarks…</p>;
  return (
    <>
      {last && (
        <Link href={last.href} className="continue-main bm-last">
          <small>Continue reading</small>
          <b>
            {last.surah} · {last.key}
          </b>
          <span aria-hidden="true">→</span>
        </Link>
      )}
      {bookmarks.length === 0 ? (
        <p className="bm-empty">
          No bookmarks yet. Open any verse and tap <b>Bookmark</b> to keep it here.
        </p>
      ) : (
        <ul className="bm-list">
          {bookmarks.map((b) => (
            <li key={b.key}>
              <Link href={b.href}>
                <span className="vnum">{b.key}</span>
                <b>Surah {b.surah}</b>
                <span className="bm-text">{b.text}</span>
              </Link>
              <button type="button" onClick={() => removeBookmark(b.key)} aria-label={`Remove bookmark ${b.key}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="bm-note">Bookmarks are saved in this browser only.</p>
    </>
  );
}
