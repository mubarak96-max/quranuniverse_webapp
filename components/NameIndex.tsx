"use client";

import Link from "next/link";
import { useState } from "react";

export type NameEntry = { number: number; arabic: string; transliteration: string; meaning: string; href: string };

const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function NameIndex({ names }: { names: NameEntry[] }) {
  const [query, setQuery] = useState("");
  const q = fold(query);
  const shown = q
    ? names.filter(
        (n) =>
          String(n.number) === q ||
          fold(n.transliteration).includes(q) ||
          fold(n.meaning).includes(q) ||
          n.arabic.includes(query.trim()),
      )
    : names;

  return (
    <section className="index" aria-labelledby="names-title">
      <div className="index-head">
        <h2 id="names-title">All 99 names</h2>
        <label className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            placeholder="Search by name, meaning or number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the names of Allah"
          />
        </label>
      </div>
      {shown.length > 0 ? (
        <ol className="name-grid">
          {shown.map((n) => (
            <li key={n.number}>
              <Link href={n.href} className="name-tile">
                <span className="name-num num"><span>{n.number}</span></span>
                <span className="ar" lang="ar" dir="rtl">
                  {n.arabic}
                </span>
                <b>{n.transliteration}</b>
                <small>{n.meaning}</small>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">No name matches &ldquo;{query}&rdquo;.</p>
      )}
    </section>
  );
}
