"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { sound } from "./sound";

// The full-screen play stage every game shares: chapter art behind, close / progress / mute on top,
// a status line, and the current screen. Styles live in app/games/stage.css.

const silent = { hit() {}, miss() {}, tap() {}, win() {} };
export const sfx = (muted: boolean) => (muted ? silent : sound);

type Props = {
  label: string;
  art?: string;
  progress: number;
  muted: boolean;
  onMute: () => void;
  onClose: () => void;
  status: ReactNode;
  // Changing the screen key replays the entry animation and moves focus to the new screen's heading.
  screen: string | number;
  children: ReactNode;
};

export function Stage({ label, art, progress, muted, onMute, onClose, status, screen, children }: Props) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    document.addEventListener("keydown", key);
    document.documentElement.classList.add("gs-lock");
    return () => {
      document.removeEventListener("keydown", key);
      document.documentElement.classList.remove("gs-lock");
    };
  }, []);

  const body = useRef<HTMLElement>(null);
  useEffect(() => {
    body.current?.querySelector<HTMLElement>(".gs-kicker")?.focus();
  }, [screen]);

  return (
    <div className="gs-stage" role="dialog" aria-modal="true" aria-label={label}>
      {art && <div className="gs-backdrop" style={{ backgroundImage: `url(${art})` }} />}
      <div className="gs-play">
        <header className="gs-hud">
          <button type="button" className="gs-icon" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div className="gs-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
            <i style={{ width: `${progress * 100}%` }} />
          </div>
          <button type="button" className="gs-icon" onClick={onMute} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9h4l5-4v14l-5-4H4z" />
              {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <path d="M17 8.5a5 5 0 010 7M19.5 6a8.5 8.5 0 010 12" />}
            </svg>
          </button>
        </header>
        <div className="gs-status">{status}</div>
        <main className="gs-body" key={screen} ref={body}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Animated 1–3 star rating for a result screen.
export function Stars({ stars }: { stars: number }) {
  return (
    <div className="gs-stars" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((s) => (
        <svg key={s} viewBox="0 0 48 48" className={s <= stars ? "is-on" : ""} style={{ animationDelay: `${s * 0.18}s` }} aria-hidden="true">
          <path d="M24 3l5.6 12.9 13.9.9-10.7 9 3.4 13.6L24 32l-12.2 7.4 3.4-13.6-10.7-9 13.9-.9z" />
        </svg>
      ))}
    </div>
  );
}
