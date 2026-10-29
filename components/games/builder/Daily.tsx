"use client";

import { useRef, useState } from "react";
import { Stage, sfx as effects } from "../Stage";
import { DailyStats, ShareBar } from "../DailyResult";
import type { dailyStats } from "../useDaily";
import { Board } from "./Board";
import { deal, type SurahRef, type Verse } from "./plan";
import { builderArt } from "./Play";

export type DailySaved = { placed: number; mistakes: number; done: boolean };

export function DailyPlay(p: {
  verse: Verse;
  label: string;
  shareLabel: string;
  surahs: SurahRef[];
  saved?: DailySaved;
  practice: boolean;
  stats: ReturnType<typeof dailyStats>;
  muted: boolean;
  onMute: () => void;
  onSave?: (r: DailySaved) => void;
  onPractice: () => void;
  onClose: () => void;
}) {
  // The daily verse has no decoys and keeps the meanings behind a hint, so it suits every player on the same day.
  const [tiles] = useState(() => deal(p.verse, [], 0));
  const [mistakes, setMistakes] = useState(p.saved?.mistakes ?? 0);
  // A hint slips and places a word in one tap, so the save after it must see the new count before React re-renders.
  const slips = useRef(mistakes);
  const [placed, setPlaced] = useState(p.saved?.placed ?? 0);
  const sfx = effects(p.muted);
  const surah = p.surahs[p.verse.s - 1];
  const n = p.verse.w.length;
  const slip = () => {
    setMistakes(++slips.current);
    p.onSave?.({ placed, mistakes: slips.current, done: false });
  };

  return (
    <Stage
      label={p.label}
      art={builderArt(1)}
      progress={placed / n}
      muted={p.muted}
      onMute={p.onMute}
      onClose={p.onClose}
      screen={p.label}
      status={
        <>
          <span className="gs-lv">{p.label}</span>
          <span className="gs-xp">
            <b>{mistakes}</b> slip{mistakes === 1 ? "" : "s"}
          </span>
        </>
      }
    >
      <Board
        verse={p.verse}
        tiles={tiles}
        surah={surah}
        glosses={false}
        guide
        initial={p.saved?.placed}
        onRight={() => sfx.hit(Math.min(placed, 9))}
        onWrong={() => {
          sfx.miss();
          slip();
        }}
        onHint={slip}
        onPlaced={(k) => {
          setPlaced(k);
          p.onSave?.({ placed: k, mistakes: slips.current, done: k >= n });
        }}
        onSolved={sfx.win}
        after={
          <div className="ab-daily-result">
            {!p.practice && (
              <>
                <DailyStats {...p.stats} />
                <ShareBar
                  text={`${p.shareLabel} · ${surah.name} ${p.verse.s}:${p.verse.a}\n${"🟩".repeat(n)}${"🟥".repeat(Math.min(mistakes, 9))}\nquranuniverse.app/games/ayah-builder`}
                />
              </>
            )}
            <button type="button" className="gs-ghost" onClick={p.onPractice}>
              {p.practice ? "Another practice verse" : "Practice with a random verse"}
            </button>
          </div>
        }
      />
    </Stage>
  );
}
