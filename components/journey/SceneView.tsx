"use client";

import Link from "next/link";
import { moodColor, moodLabel, type Journey, type Scene } from "@/lib/journey-types";

// Parts of a scene appear one after another; a tap shows them all at once.
const FIRST_S = 0.35;
const STAGGER_S = 0.9;

const hasSources = (s: Scene) => s.refs.length > 0 || !!s.scholars;
const quoteWaits = (s: Scene) => s.interact?.type === "answer";

export function revealMs(s: Scene): number {
  if (s.cover || s.end) return 1200;
  const parts = 1 + s.lines.length + (s.interact ? 1 : 0) + (s.ayah && !quoteWaits(s) ? 1 : 0) + (s.hadith ? 1 : 0) + (hasSources(s) ? 1 : 0);
  return (FIRST_S + parts * STAGGER_S + 0.6) * 1000;
}

const at = (k: number) => ({ "--d": `${FIRST_S + k * STAGGER_S}s` }) as React.CSSProperties;

function Quote({ scene, style, className }: { scene: Scene; style?: React.CSSProperties; className: string }) {
  const a = scene.ayah!;
  return (
    <blockquote className={`jr-ayah ${className}`} style={style}>
      {a.ar && (
        <p className="ar" lang="ar" dir="rtl">
          {a.ar}
        </p>
      )}
      <p className="jr-tr">{a.text}</p>
      <cite>
        <Link href={a.href}>Quran {a.ref}</Link>
      </cite>
    </blockquote>
  );
}

function Flow({ scene, taps, onTap }: { scene: Scene; taps: number[]; onTap: (i: number) => void }) {
  const it = scene.interact!;
  switch (it.type) {
    case "names":
      return (
        <p className="jr-hint">
          {it.hint} · {taps.length} / {it.items.length}
        </p>
      );
    case "reveal":
      return (
        <div className="jr-reveal">
          {taps.length < it.items.length && <p className="jr-hint">{it.hint}</p>}
          {it.items.slice(0, taps.length).map((item) => (
            <p key={item.text} className="jr-said jr-arrive">
              {item.text}
            </p>
          ))}
        </div>
      );
    case "answer": {
      const [question, reply] = it.items;
      return (
        <div className="jr-answer">
          <p className="jr-question">{question.text}</p>
          {taps.length === 0 ? (
            <button type="button" className="jr-reply" onClick={() => onTap(0)}>
              <span className="ar" lang="ar">
                {reply.text}
              </span>
              <small>{reply.en}</small>
            </button>
          ) : (
            <p className="jr-said jr-arrive">Every soul answered.</p>
          )}
        </div>
      );
    }
    case "contrast":
      return (
        <div className="jr-contrast">
          {it.items.map((item) => (
            <figure key={item.who}>
              <figcaption>{item.who}</figcaption>
              <p>{item.text}</p>
              {item.href && <Link href={item.href}>Quran {item.ref}</Link>}
            </figure>
          ))}
        </div>
      );
  }
}

type Props = {
  journey: Journey;
  scene: Scene;
  taps: number[];
  onTap: (i: number) => void;
  onBegin: () => void;
  onRestart: () => void;
};

export function SceneView({ journey, scene, taps, onTap, onBegin, onRestart }: Props) {
  if (scene.cover) {
    return (
      <div className="jr-cover">
        <p className="jr-big-ar ar" lang="ar">
          {journey.arabic}
        </p>
        <h2 className="jr-name">{journey.name}</h2>
        {!journey.villain && <p className="jr-pbuh">peace be upon him</p>}
        <p className="jr-tag">{journey.tagline}</p>
        <button type="button" className="jr-btn jr-primary" onClick={onBegin}>
          Begin
        </button>
        <p className="jr-meta">
          {journey.scenes.length - 2} scenes · Quran, hadith and the classical scholars
        </p>
      </div>
    );
  }

  if (scene.end) {
    return (
      <div className="jr-cover">
        <p className="jr-big-ar ar" lang="ar">
          {journey.arabic}
        </p>
        <h2 className="jr-name">{journey.name}</h2>
        <p className="jr-tag">{journey.outro ?? "The story of humanity goes on."}</p>
        <div className="jr-actions">
          {journey.next && (
            <Link href={`/timeline/${journey.next.stop}`} className="jr-btn jr-primary">
              Continue the timeline: {journey.next.title} →
            </Link>
          )}
          <Link href={`/timeline/${journey.stop}`} className="jr-btn">
            Back to the timeline
          </Link>
          <button type="button" className="jr-btn" onClick={onRestart}>
            Live it again
          </button>
        </div>
      </div>
    );
  }

  let k = 0;
  const answered = quoteWaits(scene) && taps.length > 0;
  return (
    <>
      <p className="jr-eye rv" style={at(k++)}>
        <i style={{ background: moodColor(scene.mood) }} />
        {moodLabel(scene.mood)}
        {scene.lens && <span> · {scene.lens}</span>}
      </p>
      {scene.lines.map((line) => (
        <p key={line} className="jr-line rv" style={at(k++)}>
          {line}
        </p>
      ))}
      {scene.interact && (
        <div className="rv" style={at(k++)}>
          <Flow scene={scene} taps={taps} onTap={onTap} />
        </div>
      )}
      {scene.ayah && !quoteWaits(scene) && <Quote scene={scene} className="rv" style={at(k++)} />}
      {answered && <Quote scene={scene} className="jr-arrive" />}
      {scene.hadith && (
        <blockquote className="jr-hadith rv" style={at(k++)}>
          {scene.hadith.text && <p>{scene.hadith.text}</p>}
          <cite>{scene.hadith.cite}</cite>
        </blockquote>
      )}
      {hasSources(scene) && (
        <p className="jr-src rv" style={at(k++)}>
          {scene.refs.map((r) => (
            <Link key={r.ref} href={r.href}>
              Quran {r.ref}
            </Link>
          ))}
          {scene.scholars && <span>Reported by {scene.scholars}</span>}
        </p>
      )}
    </>
  );
}
