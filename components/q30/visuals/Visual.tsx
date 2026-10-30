// Picks the renderer for a day's signature visual.
import type { Anatomy, Visual as V } from "@/lib/q30-types";
import { AnatomyViz, ArcViz, ColumnsViz, CycleViz, RingViz, RingsViz, SharesViz } from "./charts";
import {
  ConstellationViz,
  DecisionViz,
  FlowViz,
  GalleryViz,
  LadderViz,
  LedgerViz,
  PanelsViz,
  SpectrumViz,
  TimelineViz,
  TreeViz,
} from "./lists";

export function Visual({ v, anatomy }: { v: V; anatomy?: Anatomy }) {
  switch (v.kind) {
    case "anatomy":
      return anatomy ? <AnatomyViz data={anatomy} /> : null;
    case "ring":
      return <RingViz v={v} />;
    case "cycle":
      return <CycleViz v={v} />;
    case "rings":
      return <RingsViz v={v} />;
    case "arc":
      return <ArcViz v={v} />;
    case "columns":
      return <ColumnsViz v={v} />;
    case "shares":
      return <SharesViz v={v} />;
    case "ladder":
      return <LadderViz v={v} />;
    case "timeline":
      return <TimelineViz v={v} />;
    case "ledger":
      return <LedgerViz v={v} />;
    case "gallery":
      return <GalleryViz v={v} />;
    case "panels":
      return <PanelsViz v={v} />;
    case "flow":
      return <FlowViz v={v} />;
    case "decision":
      return <DecisionViz v={v} />;
    case "tree":
      return <TreeViz v={v} />;
    case "spectrum":
      return <SpectrumViz v={v} />;
    case "constellation":
      return <ConstellationViz v={v} />;
  }
}
