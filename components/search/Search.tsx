"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { prepare, run, termPattern, terms, type Prepared } from "@/lib/search";
import type { SearchIndex } from "@/lib/search-types";

const PAGE = 30;

let loading: Promise<Prepared> | undefined;
function loadIndex(): Promise<Prepared> {
  loading ??= fetch("/search-index.json")
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<SearchIndex>;
    })
    .then(prepare)
    .catch((e) => {
      loading = undefined;
      throw e;
    });
  return loading;
}

function Highlight({ text, q }: { text: string; q: string }) {
  const ts = terms(q);
  if (!ts.length) return <>{text}</>;
  const re = new RegExp(`\\b(${ts.map(termPattern).join("|")})`, "gi");
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    // Mark the whole word the term starts, so "pray" lights up all of "prayer".
    const end = m.index + (text.slice(m.index).match(/^[\w'’-]+/)?.[0].length ?? m[0].length);
    out.push(text.slice(last, m.index), <mark key={m.index}>{text.slice(m.index, end)}</mark>);
    last = end;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

const SUGGESTIONS = ["patience", "parents", "mercy", "Musa", "paradise", "forgiveness", "Ayat al-Kursi", "2:255"];

export function Search() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<Prepared | null>(null);
  const [error, setError] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [settled, setSettled] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initial = new URLSearchParams(location.search).get("q") ?? "";
    setQ(initial);
    setSettled(initial);
    loadIndex().then(setData, () => setError(true));
  }, []);

  // Debounced so typing stays smooth; the URL follows, so a search can be shared or reopened.
  useEffect(() => {
    const t = setTimeout(() => {
      setSettled(q);
      setShown(PAGE);
      const url = q ? `?q=${encodeURIComponent(q)}` : location.pathname;
      history.replaceState(history.state, "", url);
    }, 160);
    return () => clearTimeout(t);
  }, [q]);

  const result = useMemo(() => (data && settled.trim() ? run(data, settled) : null), [data, settled]);
  const surahs = data?.index.surahs;

  return (
    <div className="search">
      <form role="search" className="search-form" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search-input" className="sr-only">
          Search the Quran
        </label>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <input
          id="search-input"
          ref={input}
          type="search"
          autoFocus
          autoComplete="off"
          placeholder="Search verses, topics, names, prophets…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => void loadIndex().catch(() => {})}
        />
      </form>

      {error && (
        <p className="search-empty">
          Search could not load. Check your connection and{" "}
          <button type="button" className="linklike" onClick={() => location.reload()}>
            try again
          </button>
          .
        </p>
      )}

      {!settled.trim() && (
        <div className="search-suggest">
          <span>Try</span>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => (setQ(s), input.current?.focus())}>
              {s}
            </button>
          ))}
        </div>
      )}

      {settled.trim() && !data && !error && <p className="search-empty">Loading search…</p>}

      {result && surahs && (
        <div className="search-results" aria-live="polite">
          {result.direct.length > 0 && (
            <section>
              <h2>Go to</h2>
              <ul className="search-list">
                {result.direct.map((d) => (
                  <li key={d.href}>
                    <Link href={d.href}>
                      <b>{d.label}</b>
                      <small>{d.sub}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.pages.length > 0 && (
            <section>
              <h2>Topics and pages</h2>
              <ul className="search-list">
                {result.pages.slice(0, 8).map((p) => (
                  <li key={p.href}>
                    <Link href={p.href}>
                      <span className="search-kind">{p.kind}</span>
                      <b>
                        <Highlight text={p.title} q={settled} />
                      </b>
                      <small>
                        <Highlight text={p.blurb} q={settled} />
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2>
              Verses <span className="search-count">{result.verses.length.toLocaleString()}</span>
            </h2>
            {result.verses.length === 0 ? (
              <p className="search-empty">
                No verses match &ldquo;{settled}&rdquo;. Try fewer or different words, such as &ldquo;patience&rdquo; instead of
                &ldquo;being patient&rdquo;.
              </p>
            ) : (
              <ul className="search-list">
                {result.verses.slice(0, shown).map(({ s, a }) => {
                  const [slug, tr] = surahs[s - 1];
                  const key = `${s}:${a}`;
                  const title = data!.index.titles[key];
                  return (
                    <li key={key}>
                      <Link href={`/surah/${slug}/${a}`}>
                        <span className="search-kind">
                          {tr} · {key}
                        </span>
                        {title && (
                          <b>
                            <Highlight text={title} q={settled} />
                          </b>
                        )}
                        <small className="search-verse">
                          <Highlight text={data!.index.verses[s - 1][a - 1]} q={settled} />
                        </small>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {result.verses.length > shown && (
              <button type="button" className="search-more" onClick={() => setShown(shown + PAGE)}>
                Show more verses
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
