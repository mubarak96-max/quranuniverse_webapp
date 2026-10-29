"use client";

import Link from "next/link";
import { useState } from "react";

export type SurahEntry = { id: number; name: string; transliteration: string; place: string; verses: number; href: string };

// Folds "Al-Baqarah", "al baqara" and "baqarah" onto the same search key.
const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function matchSurahs<T extends SurahEntry>(surahs: T[], query: string): T[] {
  const q = fold(query);
  return q
    ? surahs.filter((s) => String(s.id) === q || fold(s.transliteration).includes(q) || s.name.includes(query.trim()))
    : surahs;
}

export function SurahIndex({ surahs }: { surahs: SurahEntry[] }) {
  const [query, setQuery] = useState("");
  const shown = matchSurahs(surahs, query);

  return (
    <section className="index" aria-labelledby="index-title">
      <div className="index-head">
        <h2 id="index-title">Explore the surahs</h2>
        <label className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
          <input
            type="search"
            placeholder="Search by name or number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search surahs"
          />
        </label>
      </div>
      {shown.length > 0 ? (
        <ol className="surah-grid">
          {shown.map((s) => (
            <li key={s.id}>
              <Link href={s.href} className="surah-tile">
                <span className="num">
                  <span>{s.id}</span>
                </span>
                <span className="names">
                  <b>{s.transliteration}</b>
                  <small>
                    {s.place} · {s.verses} verses
                  </small>
                </span>
                <span className="ar" lang="ar" dir="rtl">
                  {s.name}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty">No surah matches &ldquo;{query}&rdquo;.</p>
      )}
    </section>
  );
}
