// The pieces a chapter is written in: prose with inline verse links, verses in Arabic and English, quotes, notes,
// lists, illustrations, figures and the day's key word. Rendered on the server.
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { refHref } from "@/lib/q30";
import { imageSrc, type Anatomy, type DayBlock, type Figure, type Verse, type Word } from "@/lib/q30-types";

const DIGITS = "٠١٢٣٤٥٦٧٨٩";
const ayahMark = (key: string) => `﴿${key.split(":")[1].replace(/\d/g, (d) => DIGITS[+d])}﴾`;

const REF = /\b\d{1,3}:\d{1,3}(?:-\d{1,3})?\b/g;

function refs(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(REF)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <Link key={`${key}-${m.index}`} href={refHref(m[0])} className="rf-link">
        {m[0]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// *italic*, **bold** and verse references; nothing else, so content stays plain text.
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((s, i) => {
        if (s.startsWith("**") && s.endsWith("**")) return <strong key={i}>{refs(s.slice(2, -2), `b${i}`)}</strong>;
        if (s.startsWith("*") && s.endsWith("*") && s.length > 2) return <em key={i}>{refs(s.slice(1, -1), `i${i}`)}</em>;
        return <span key={i}>{refs(s, `t${i}`)}</span>;
      })}
    </>
  );
}

export function VerseView({ v, size }: { v: Verse; size?: "carry" }) {
  const ar = v.lines.filter((l) => l.ar);
  return (
    <figure className={`vs${size ? ` vs-${size}` : ""}`}>
      {ar.length > 0 && (
        <p className="vs-ar ar" lang="ar" dir="rtl">
          {ar.map((l) => `${l.ar} ${ayahMark(l.key)}`).join(" ")}
        </p>
      )}
      <blockquote className="vs-en">
        {v.cut && "… "}
        {v.lines.map((l) => l.en).join(" ")}
        {v.cut && " …"}
      </blockquote>
      <figcaption>
        <Link href={v.href}>
          {v.name} · {v.ref}
        </Link>
      </figcaption>
    </figure>
  );
}

function WordView({ w }: { w: Word }) {
  return (
    <aside className="wd">
      <p className="wd-ar ar" lang="ar" dir="rtl">
        {w.ar}
      </p>
      <div className="wd-body">
        <p className="wd-tr">
          <i>{w.tr}</i>
          <span>{w.meaning}</span>
        </p>
        <ol className="wd-root" dir="rtl" aria-label="Root letters">
          {w.root.map((l, i) => (
            <li key={i} className="ar" lang="ar">
              {l}
            </li>
          ))}
        </ol>
        <p className="wd-nuance">
          <Inline text={w.nuance} />
        </p>
      </div>
    </aside>
  );
}

function AnatomyView({ data }: { data: Anatomy }) {
  const max = Math.max(...data.map((s) => s.verses));
  const w = 4;
  const h = 120;
  return (
    <svg className="fg-anatomy" viewBox={`0 0 ${data.length * w} ${h + 14}`} role="img" aria-label="Bar chart of all 114 surahs by number of verses">
      {data.map((s, i) => {
        const bh = Math.max(2, (s.verses / max) * h);
        return (
          <rect key={s.id} x={i * w + 0.5} y={h - bh} width={w - 1} height={bh} rx="0.8" className={s.makki ? "is-makki" : "is-madani"}>
            <title>{`${s.id}. ${s.name}: ${s.verses} verses, ${s.makki ? "Makkan" : "Madinan"}`}</title>
          </rect>
        );
      })}
      {[1, 18, 36, 67, 114].map((n) => (
        <text key={n} x={(n - 0.5) * w} y={h + 12} textAnchor={n === 1 ? "start" : n === 114 ? "end" : "middle"}>
          {n}
        </text>
      ))}
    </svg>
  );
}

function FigureView({ f, anatomy }: { f: Figure; anatomy?: Anatomy }) {
  let body: React.ReactNode = null;
  if (f.kind === "anatomy" && anatomy) {
    body = (
      <>
        <AnatomyView data={anatomy} />
        <p className="fg-key">
          <span className="is-makki">Makkan</span>
          <span className="is-madani">Madinan</span>
          <span>Each bar is one surah, in the order of the mushaf, by number of verses.</span>
        </p>
      </>
    );
  }
  if (f.kind === "timeline") {
    body = (
      <ol className="fg-timeline">
        {f.items.map((it, i) => (
          <li key={i}>
            <time>{it.at}</time>
            <b>{it.label}</b>
            {it.text && (
              <p>
                <Inline text={it.text} />
              </p>
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (f.kind === "steps") {
    body = (
      <ol className="fg-steps">
        {f.items.map((it, i) => (
          <li key={i}>
            <b>{it.label}</b>
            {it.text && (
              <p>
                <Inline text={it.text} />
              </p>
            )}
          </li>
        ))}
      </ol>
    );
  }
  if (f.kind === "compare") {
    body = (
      <div className="fg-compare">
        {[f.left, f.right].map((side, s) => (
          <section key={s}>
            <h4>{side.title}</h4>
            <ul>
              {side.items.map((it, i) => (
                <li key={i}>
                  <Inline text={it} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
  if (f.kind === "facts") {
    body = (
      <dl className="fg-facts">
        {f.items.map((it, i) => (
          <div key={i}>
            <dt>{it.value}</dt>
            <dd>{it.label}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <figure className={`fg fg-k-${f.kind}`}>
      <figcaption className="fg-title">{f.title}</figcaption>
      {body}
    </figure>
  );
}

const PUBLIC = path.join(process.cwd(), "public");
// Illustrations are painted separately (tools/q30-images.mjs), so a new prompt can ship before its picture does.
export const hasImage = (src: string) => fs.existsSync(path.join(PUBLIC, src));

export function BlockView({ b, anatomy }: { b: DayBlock; anatomy?: Anatomy }) {
  if ("p" in b)
    return (
      <p>
        <Inline text={b.p} />
      </p>
    );
  if ("h" in b) return <h3 className="ch-h">{b.h}</h3>;
  if ("verse" in b) return <VerseView v={b.verse} />;
  if ("quote" in b)
    return (
      <figure className="qt">
        <blockquote>
          <Inline text={b.quote} />
        </blockquote>
        <figcaption>{b.by}</figcaption>
      </figure>
    );
  if ("note" in b)
    return (
      <aside className="nt">
        {b.title && <b>{b.title}</b>}
        <p>
          <Inline text={b.note} />
        </p>
      </aside>
    );
  if ("list" in b)
    return (
      <ul className="ls">
        {b.list.map((it, i) => (
          <li key={i}>
            <Inline text={it} />
          </li>
        ))}
      </ul>
    );
  if ("image" in b) {
    const src = imageSrc(b.image);
    if (!hasImage(src)) return null;
    return (
      <figure className="im">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export serves pre-sized WebP files */}
        <img src={src} alt={b.alt} loading="lazy" decoding="async" width={1600} height={1067} />
        {b.caption && <figcaption>{b.caption}</figcaption>}
      </figure>
    );
  }
  if ("figure" in b) return <FigureView f={b.figure} anatomy={anatomy} />;
  if ("word" in b) return <WordView w={b.word} />;
  return null;
}
