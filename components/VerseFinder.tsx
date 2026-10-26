"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { matchSurahs, type SurahEntry } from "./SurahIndex";

export function VerseFinder({ surahs }: { surahs: SurahEntry[] }) {
  const router = useRouter();
  const [id, setId] = useState(1);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [ayah, setAyah] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const verseInput = useRef<HTMLInputElement>(null);

  const surah = surahs.find((s) => s.id === id)!;
  const shown = matchSurahs(surahs, query);
  const n = Number(ayah);
  const valid = ayah === "" || (n >= 1 && n <= surah.verses);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openList = () => {
    setQuery("");
    setActive(Math.max(0, surahs.findIndex((s) => s.id === id)));
    setOpen(true);
  };

  const choose = (s: SurahEntry) => {
    setId(s.id);
    setOpen(false);
    if (Number(ayah) > s.verses) setAyah("");
    verseInput.current?.focus();
  };

  const step = (by: number) => setAyah(String(Math.min(surah.verses, Math.max(1, (n || 0) + by))));

  return (
    <form
      className="verse-finder"
      aria-label="Go to a verse"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) router.push(ayah === "" ? surah.href : `${surah.href}/${n}`);
      }}
    >
      <div className="finder-field finder-surah" ref={root}>
        <span id="finder-surah-label">Surah</span>
        <div className={open ? "finder-combo is-open" : "finder-combo"}>
          <span className="num" aria-hidden="true">
            <span>{surah.id}</span>
          </span>
          <input
            role="combobox"
            aria-labelledby="finder-surah-label"
            aria-expanded={open}
            aria-controls="finder-surah-list"
            aria-activedescendant={open && shown[active] ? `finder-opt-${shown[active].id}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search name or number"
            value={open ? query : surah.transliteration}
            onFocus={openList}
            onClick={() => !open && openList()}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                if (!open) return openList();
                const d = e.key === "ArrowDown" ? 1 : -1;
                setActive((a) => Math.min(shown.length - 1, Math.max(0, a + d)));
              } else if (e.key === "Enter" && open) {
                e.preventDefault();
                if (shown[active]) choose(shown[active]);
              } else if (e.key === "Escape" || e.key === "Tab") {
                setOpen(false);
              }
            }}
          />
          <span className="finder-ar ar" lang="ar" dir="rtl" aria-hidden="true">
            {surah.name}
          </span>
          <svg className="finder-chevron" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {open && (
          <ul className="finder-list" id="finder-surah-list" role="listbox" ref={list} aria-labelledby="finder-surah-label">
            {shown.map((s, i) => (
              <li
                key={s.id}
                id={`finder-opt-${s.id}`}
                data-index={i}
                role="option"
                aria-selected={s.id === id}
                className={i === active ? "is-active" : undefined}
                onPointerDown={(e) => e.preventDefault()}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(s)}
              >
                <span className="num">
                  <span>{s.id}</span>
                </span>
                <span className="finder-opt-name">
                  <b>{s.transliteration}</b>
                  <small>{s.verses} verses</small>
                </span>
                <span className="ar" lang="ar" dir="rtl">
                  {s.name}
                </span>
              </li>
            ))}
            {shown.length === 0 && <li className="finder-empty">No surah matches &ldquo;{query}&rdquo;</li>}
          </ul>
        )}
      </div>
      <div className="finder-field finder-ayah">
        <label htmlFor="finder-ayah-input">Verse</label>
        <div className="finder-stepper">
          <button type="button" aria-label="Previous verse" onClick={() => step(-1)} disabled={n <= 1}>
            −
          </button>
          <input
            id="finder-ayah-input"
            ref={verseInput}
            inputMode="numeric"
            autoComplete="off"
            placeholder={`1–${surah.verses}`}
            value={ayah}
            onChange={(e) => setAyah(e.target.value.replace(/\D/g, "").slice(0, 3))}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                step(e.key === "ArrowUp" ? 1 : -1);
              }
            }}
            aria-invalid={!valid}
            aria-describedby="finder-hint"
          />
          <button type="button" aria-label="Next verse" onClick={() => step(1)} disabled={n >= surah.verses}>
            +
          </button>
        </div>
      </div>
      <button type="submit" className="finder-go" disabled={!valid}>
        Go <span aria-hidden="true">→</span>
      </button>
      <p id="finder-hint" className={valid ? "finder-hint" : "finder-hint is-error"} role="status">
        {valid
          ? `${surah.transliteration} has ${surah.verses} verses. Leave verse empty to open the whole surah.`
          : `${surah.transliteration} has only ${surah.verses} verses.`}
      </p>
    </form>
  );
}
