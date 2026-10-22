"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Journey } from "@/lib/journey-types";
import { Atmosphere } from "./Atmosphere";
import { Field } from "./Field";
import { HeartLine } from "./HeartLine";
import { Scenery } from "./Scenery";
import { SceneView, revealMs } from "./SceneView";
import { SETS } from "./sets";
import { Transcript } from "./Transcript";

const SWIPE_PX = 50;
// Taps on the left edge go back, like turning a page.
const BACK_ZONE = 0.25;

export function JourneyPlayer({ journey }: { journey: Journey }) {
  const { scenes, acts } = journey;
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);
  const [open, setOpen] = useState(true);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const scene = scenes[index];
  const set = SETS[scene.set];

  const go = useCallback(
    (i: number, instant = false) => {
      setIndex(Math.max(0, Math.min(scenes.length - 1, i)));
      setDone(instant);
      setTaps([]);
    },
    [scenes.length],
  );

  const next = useCallback(() => {
    if (!done) setDone(true);
    else if (index < scenes.length - 1) go(index + 1);
  }, [done, index, scenes.length, go]);

  const prev = useCallback(() => {
    if (index > 0) go(index - 1, true);
  }, [index, go]);

  useEffect(() => {
    const i = scenes.findIndex((s) => s.id === decodeURIComponent(location.hash.slice(1)));
    if (i > 0) go(i, true);
  }, [scenes, go]);

  useEffect(() => {
    const url = index === 0 ? location.pathname : `#${scene.id}`;
    history.replaceState(history.state, "", url);
  }, [index, scene.id]);

  useEffect(() => {
    if (done) return;
    const timer = setTimeout(() => setDone(true), revealMs(scene));
    return () => clearTimeout(timer);
  }, [done, scene]);

  useEffect(() => {
    document.documentElement.classList.toggle("jr-lock", open);
    return () => document.documentElement.classList.remove("jr-lock");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const onButton = (e.target as HTMLElement).closest("a, button");
      if (e.key === "ArrowRight" || e.key === "PageDown" || (!onButton && (e.key === " " || e.key === "Enter"))) next();
      else if (e.key === "ArrowLeft" || e.key === "PageUp") prev();
      else if (e.key === "Escape") setOpen(false);
      else return;
      e.preventDefault();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, next, prev]);

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if ((e.target as HTMLElement).closest("a, button, .jr-top, .jr-foot")) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width * BACK_ZONE) prev();
    else next();
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "touch") swipe.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: React.PointerEvent) {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) {
      swiped.current = true;
      if (dx < 0) next();
      else prev();
    }
  }

  function readText() {
    setOpen(false);
    requestAnimationFrame(() => document.getElementById("journey-text")?.scrollIntoView());
  }

  const tap = (i: number) => setTaps((t) => [...t, i]);
  const answered = scene.interact?.type === "answer" && taps.length > 0;
  const act = acts[scene.act];

  return (
    <>
      <noscript>
        <style>{".jr{display:none}"}</style>
      </noscript>
      <div
        className={`jr${done ? " is-done" : ""}${answered ? " is-answered" : ""}${scene.cover || scene.end ? " is-card" : ""}`}
        style={{ "--j1": set.sky[0], "--j2": set.sky[1], "--j3": set.sky[2] } as React.CSSProperties}
        hidden={!open}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        role="region"
        aria-label={`The journey of ${journey.name}`}
      >
        <Atmosphere motes={set.motes} />
        <Scenery key={set.piece} piece={set.piece} set={scene.set} />
        <Field key={scene.id} scene={scene} taps={taps} onTap={tap} />
        <div className="jr-scrim" />

        <header className="jr-top">
          <Link href={`/timeline/${journey.stop}`} className="jr-icon" aria-label="Leave the journey">
            ✕
          </Link>
          {!scene.cover && !scene.end && (
            <p className="jr-act">
              <span>{scene.act + 1}</span>
              {act.title}
            </p>
          )}
          <button type="button" className="jr-icon jr-textbtn" onClick={readText}>
            Text
          </button>
        </header>

        <div className="jr-text" key={scene.id} aria-live="polite">
          <SceneView journey={journey} scene={scene} taps={taps} onTap={tap} onBegin={() => go(1)} onRestart={() => go(0)} />
        </div>

        <footer className="jr-foot">
          <button type="button" className="jr-icon" onClick={prev} disabled={index === 0} aria-label="Previous scene">
            ←
          </button>
          <HeartLine scenes={scenes} acts={acts} index={index} onJump={(i) => go(i, true)} />
          <button type="button" className="jr-icon" onClick={next} disabled={index === scenes.length - 1} aria-label="Next scene">
            →
          </button>
        </footer>
      </div>
      <Transcript journey={journey} onExperience={() => setOpen(true)} />
    </>
  );
}
