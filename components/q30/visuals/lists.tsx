// Visuals laid out in HTML: steps, timelines, ledgers, tiles, panels, flows, decisions, trees, spectrums, stars.
import type { Visual } from "@/lib/q30-types";
import { Icon } from "../Icons";

type Of<K extends Visual["kind"]> = Extract<Visual, { kind: K }>;

const Ref = ({ r }: { r?: string }) => (r ? <small className="vz-ref">{r}</small> : null);

export function LadderViz({ v }: { v: Of<"ladder"> }) {
  return (
    <ol className="vz-ladder">
      {v.items.map((it, i) => (
        <li key={i}>
          <i>{i + 1}</i>
          <div>
            <b>{it.label}</b>
            {it.text && <p>{it.text}</p>}
            <Ref r={it.ref} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function TimelineViz({ v }: { v: Of<"timeline"> }) {
  return (
    <ol className="vz-timeline">
      {v.items.map((it, i) => (
        <li key={i} className={it.mark ? "is-mark" : undefined}>
          <time>{it.at}</time>
          <div>
            <b>{it.label}</b>
            {it.text && <p>{it.text}</p>}
            <Ref r={it.ref} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LedgerViz({ v }: { v: Of<"ledger"> }) {
  return (
    <div className="vz-ledger">
      {[v.left, v.right].map((side, s) => (
        <section key={s} className={s ? "is-right" : "is-left"}>
          <h4>{side.title}</h4>
          <ul>
            {side.items.map((it, i) => (
              <li key={i}>
                <b>{it.label}</b>
                {it.text && <span>{it.text}</span>}
                <Ref r={it.ref} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function GalleryViz({ v }: { v: Of<"gallery"> }) {
  return (
    <ul className="vz-gallery">
      {v.items.map((it, i) => (
        <li key={i}>
          <Icon name={it.icon} />
          <b>{it.label}</b>
          {it.text && <span>{it.text}</span>}
          <Ref r={it.ref} />
        </li>
      ))}
    </ul>
  );
}

export function PanelsViz({ v }: { v: Of<"panels"> }) {
  return (
    <ol className="vz-panels" style={{ "--n": v.items.length } as React.CSSProperties}>
      {v.items.map((it, i) => (
        <li key={i}>
          <div className="vz-panel-art">
            <Icon name={it.icon} />
          </div>
          <b>{it.label}</b>
          {it.text && <p>{it.text}</p>}
          <Ref r={it.ref} />
        </li>
      ))}
    </ol>
  );
}

export function FlowViz({ v }: { v: Of<"flow"> }) {
  return (
    <ol className="vz-flow">
      {v.items.map((it, i) => (
        <li key={i} className={i === v.here ? "is-here" : i < v.here ? "is-past" : undefined}>
          <i>{i === v.here ? "You are here" : i + 1}</i>
          <b>{it.label}</b>
          {it.text && <p>{it.text}</p>}
          <Ref r={it.ref} />
        </li>
      ))}
    </ol>
  );
}

export function DecisionViz({ v }: { v: Of<"decision"> }) {
  return (
    <ol className="vz-decision">
      {v.items.map((it, i) => (
        <li key={i}>
          <p className="vz-q">
            {it.q} <Ref r={it.ref} />
          </p>
          <div className="vz-branches">
            <span className="is-yes">
              <em>Yes</em> {it.yes}
            </span>
            {it.no && (
              <span className="is-no">
                <em>No</em> {it.no}
              </span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

type TreeItem = Of<"tree">["items"][number];

function Branch({ node, all }: { node: TreeItem; all: TreeItem[] }) {
  const kids = all.filter((k) => k.parent === node.id);
  return (
    <li className={node.mark ? "is-mark" : undefined}>
      <span>
        <b>{node.label}</b>
        {node.text && <em>{node.text}</em>}
      </span>
      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <Branch key={k.id} node={k} all={all} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TreeViz({ v }: { v: Of<"tree"> }) {
  return (
    <ul className="vz-tree">
      {v.items
        .filter((i) => !i.parent)
        .map((root) => (
          <Branch key={root.id} node={root} all={v.items} />
        ))}
    </ul>
  );
}

export function SpectrumViz({ v }: { v: Of<"spectrum"> }) {
  const items = [...v.items].sort((a, b) => a.at - b.at);
  return (
    <div className="vz-spectrum">
      <div className="vz-ends">
        <span>{v.from}</span>
        <span>{v.to}</span>
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <div className="vz-gauge">
              <i style={{ left: `${it.at * 100}%` }} />
            </div>
            <b>{it.label}</b>
            {it.text && <span>{it.text}</span>}
            <Ref r={it.ref} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ConstellationViz({ v }: { v: Of<"constellation"> }) {
  return (
    <ul className="vz-stars">
      {v.items.map((it, i) => (
        <li key={i} className={it.bright ? "is-bright" : undefined}>
          <Icon name="spark" />
          <div>
            <b>{it.label}</b>
            {it.text && <span>{it.text}</span>}
            <Ref r={it.ref} />
          </div>
        </li>
      ))}
    </ul>
  );
}
