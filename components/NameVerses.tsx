"use client";

import Link from "next/link";
import { useRef } from "react";

export type NameVerseEntry = { ref: string; surah: string; href: string; arabic: string; english: string };

// The verses sit behind a button so the page stays about the name, not a list of citations.
export function NameVerses({ name, verses }: { name: string; verses: NameVerseEntry[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();

  return (
    <>
      <button type="button" className="nv-open" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        <span>In the Quran</span>
        <b>
          {verses.length} {verses.length === 1 ? "verse" : "verses"}
        </b>
      </button>
      <dialog
        ref={ref}
        className="nv"
        aria-label={`Verses that mention ${name}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="nv-body">
          <header className="nv-head">
            <p className="lab">{name} in the Quran</p>
            <button type="button" className="nv-close" onClick={close} aria-label="Close">
              ×
            </button>
          </header>
          <ol className="nv-list">
            {verses.map((v) => (
              <li key={v.ref}>
                <p className="ar" lang="ar" dir="rtl">
                  {v.arabic}
                </p>
                <p className="nv-en">{v.english}</p>
                <Link href={v.href} className="nv-ref">
                  {v.surah} {v.ref} →
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </dialog>
    </>
  );
}
