"use client";

import { useState } from "react";

// The phone's share sheet where there is one; elsewhere the link is copied.
export function Share({ title, text, path, label = "Share" }: { title: string; text?: string; path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // dismissed the sheet
      }
      return;
    }
    await navigator.clipboard.writeText(text ? `${text} ${url}` : url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={`share${copied ? " done" : ""}`} onClick={share}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.5v8.5M4.8 4.6 8 1.5l3.2 3.1M3 8.5v5h10v-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span aria-live="polite">{copied ? "Link copied" : label}</span>
    </button>
  );
}
