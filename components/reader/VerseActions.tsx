"use client";

import { useEffect, useRef, useState } from "react";
import { setLastRead, toggleBookmark, useBookmarks } from "./store";
import { drawVerseImage } from "./verse-image";

type Props = { verseKey: string; href: string; surah: string; arabic: string; english: string };

const ICONS = {
  bookmark: "M6 3h12v18l-6-4.5L6 21Z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v12M7 8l5-5 5 5",
  image: "M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 9.5a1 1 0 1 0 0-.01",
};

function Icon({ name, filled }: { name: keyof typeof ICONS; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={filled ? "is-filled" : undefined}>
      <path d={ICONS[name]} />
    </svg>
  );
}

export function VerseActions({ verseKey, href, surah, arabic, english }: Props) {
  const bookmarks = useBookmarks();
  const saved = !!bookmarks?.some((b) => b.key === verseKey);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setLastRead({ key: verseKey, href, surah }), [verseKey, href, surah]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const flash = (msg: string) => {
    setNote(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(""), 2400);
  };

  const url = () => `${location.origin}${href}`;
  const ref = `Quran ${surah} ${verseKey}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${arabic}\n\n${english}\n\n(${ref})\n${url()}`);
      flash("Verse copied");
    } catch {
      flash("Could not copy");
    }
  }

  async function shareLink() {
    const text = `“${english}” (${ref})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: ref, text, url: url() });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url()}`);
      flash("Link copied");
    } catch (e) {
      if ((e as Error).name !== "AbortError") flash("Could not share");
    }
  }

  async function shareImage() {
    setBusy(true);
    try {
      const blob = await drawVerseImage({ arabic, english, eyebrow: `Surah ${surah} · ${verseKey}`, site: location.host });
      const name = `quran-${verseKey.replace(":", "-")}.png`;
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: ref, text: `${ref}\n${url()}` });
        } catch (e) {
          if ((e as Error).name !== "AbortError") throw e;
        }
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        flash("Image downloaded");
      }
    } catch {
      flash("Could not make the image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="verse-actions">
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => flash(toggleBookmark({ key: verseKey, href, surah, text: english.slice(0, 220) }) ? "Bookmarked" : "Bookmark removed")}
      >
        <Icon name="bookmark" filled={saved} />
        <span>{saved ? "Saved" : "Bookmark"}</span>
      </button>
      <button type="button" onClick={copy}>
        <Icon name="copy" />
        <span>Copy</span>
      </button>
      <button type="button" onClick={shareLink}>
        <Icon name="share" />
        <span>Share</span>
      </button>
      <button type="button" onClick={shareImage} disabled={busy}>
        <Icon name="image" />
        <span>{busy ? "Making…" : "Image"}</span>
      </button>
      <p className="verse-actions-note" role="status" aria-live="polite">
        {note}
      </p>
    </div>
  );
}
