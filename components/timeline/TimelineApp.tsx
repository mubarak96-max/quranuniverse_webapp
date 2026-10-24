"use client";

import { useEffect, useState } from "react";
import type { Ref, TimelineData, TimelineSeed } from "@/lib/timeline-types";
import { EntityPanel } from "./EntityPanel";
import { IntroPanel } from "./IntroPanel";
import { LibraryHint } from "./LibraryHint";
import { StoryPanel } from "./StoryPanel";
import { TimelineMain, type View } from "./TimelineMain";
import { VillainLine } from "./VillainLine";
import { VillainPanel } from "./VillainPanel";
import { prefetchLand } from "./useBorders";

let cached: TimelineData | undefined;
let pending: Promise<TimelineData> | undefined;

function useTimelineData() {
  const [data, setData] = useState(cached);
  useEffect(() => {
    if (cached) return;
    prefetchLand();
    pending ??= fetch("/timeline/data.json").then((r) => r.json() as Promise<TimelineData>);
    pending.then((d) => {
      cached = d;
      setData(d);
    });
  }, []);
  return data;
}

const noop = () => undefined;

// Pages ship only their own moment. The full dataset is one shared, cached file; until it arrives the server-rendered
// panel is shown as is, so the content is readable at once and indexable without scripts.
export function TimelineApp({
  seed,
  initialView,
  initialStop,
  initialVillain,
  initialRef,
  initialYear,
}: {
  seed: TimelineSeed;
  initialView: View;
  initialStop?: string;
  initialVillain?: string;
  initialRef?: Ref;
  initialYear?: number;
}) {
  const data = useTimelineData();
  if (data)
    return (
      <TimelineMain data={data} initialView={initialView} initialStop={initialStop} initialVillain={initialVillain} initialRef={initialRef} initialYear={initialYear} />
    );

  const { stop, chapters, villains, card } = seed;
  const view = villains ? "villains" : card ? "entity" : initialView === "library" || initialView === "explore" ? initialView : stop ? "story" : "intro";
  return (
    <div className={`tl-app view-${view} is-loading`}>
      <div className="tl-stage">
        {villains && <VillainLine villains={villains.list} ages={villains.ages} signs={villains.signs} selected={initialVillain} onSelect={noop} />}
      </div>
      <div className="tl-side">
        {card ? (
          <EntityPanel card={card} trail={[]} onOpen={noop} onTrail={noop} />
        ) : view === "library" ? (
          <LibraryHint view="library" />
        ) : view === "explore" ? null : villains ? (
          <VillainPanel villains={villains.list} selected={initialVillain} onSelect={noop} onProphet={noop} onOpenStop={noop} />
        ) : stop ? (
          <StoryPanel
            stop={stop}
            chapter={chapters[stop.chapter]}
            chapters={chapters.length}
            position={seed.position}
            rule={[]}
            world={[]}
            now={seed.now}
            playing={false}
            readMs={0}
            atStart
            atEnd
            onPrev={noop}
            onNext={noop}
            onTogglePlay={noop}
            onExplore={noop}
            villains={[]}
            onVillain={noop}
            linked={[]}
            onOpen={noop}
          />
        ) : (
          <IntroPanel chapters={chapters} moments={seed.moments} now={seed.now} onWatch={noop} onStart={noop} onResume={noop} onBirth={noop} onMore={noop} />
        )}
      </div>
    </div>
  );
}
