"use client";

import { useEffect } from "react";
import { setLastRead } from "./store";

// Remembers the verse nearest the top of the screen while the reader scrolls a surah, so "Continue reading" lands
// where they actually stopped. Rows carry data-key and data-href.
export function SurahProgress({ surah }: { surah: string }) {
  useEffect(() => {
    const rows = [...document.querySelectorAll<HTMLElement>(".verse-list > li[data-key]")];
    if (rows.length === 0) return;
    const visible = new Set<HTMLElement>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target as HTMLElement);
          else visible.delete(e.target as HTMLElement);
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          // Only once the reader has moved past the opening verse; opening a surah alone does not move their place.
          const top = rows.find((r) => visible.has(r));
          if (!top || (top === rows[0] && window.scrollY < 200)) return;
          setLastRead({ key: top.dataset.key!, href: top.dataset.href!, surah });
        }, 800);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    rows.forEach((r) => io.observe(r));
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [surah]);
  return null;
}
