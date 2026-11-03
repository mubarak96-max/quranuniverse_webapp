"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LAST_KEY, readSeen, SEEN_KEY, store } from "./useTimelineData";

// The hero buttons of an entry page. Also remembers the page as "continue reading" and counts it as explored.
export function EntryActions({ refKey, name, mapUrl, mapped }: { refKey: string; name: string; mapUrl: string; mapped: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    store.set(LAST_KEY, refKey);
    const seen = readSeen();
    if (!seen.has(refKey)) store.set(SEEN_KEY, JSON.stringify([...seen.add(refKey)]));
  }, [refKey]);

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <div className="en-actions">
      <Link href={mapUrl} className="en-btn en-btn-map">
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" />
          <path d="M2.5 10h15M10 2.5c2.6 2.4 2.6 12.6 0 15M10 2.5c-2.6 2.4-2.6 12.6 0 15" />
        </svg>
        {mapped ? "See it on the map" : "Open its chapter on the map"}
      </Link>
      <button type="button" className="en-btn" onClick={share}>
        {copied ? "Link copied" : "Share"}
      </button>
    </div>
  );
}
