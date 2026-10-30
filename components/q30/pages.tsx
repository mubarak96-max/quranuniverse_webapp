// Turns one day into its booklet pages: cover, intro, passages (two a page), visual, word, remember, quiz, back cover.
import Link from "next/link";
import { LABELS, PARTS, dayHref, type Day, type DaySummary, type Label, type Passage } from "@/lib/q30-types";
import { CoverArt } from "./Cover";
import { Icon } from "./Icons";
import { Quiz } from "./Quiz";
import { Reflect } from "./Reflect";
import { Visual } from "./visuals/Visual";

export function Tag({ label }: { label: Label }) {
  return <span className={`lb lb-${label}`}>{LABELS[label]}</span>;
}

type PageProps = { head: [string, string]; kind: string; folio: number; part?: number; children: React.ReactNode };

export function Page({ head, kind, folio, part, children }: PageProps) {
  return (
    <article className={`pg pg-${kind}`} data-part={part}>
      <header className="pg-head">
        <span>{head[0]}</span>
        <span>{head[1]}</span>
      </header>
      <div className="pg-body">{children}</div>
      <footer className="pg-folio">{folio}</footer>
    </article>
  );
}

function Sheet({ day, kind, folio, children }: { day: Day; kind: string; folio: number; children: React.ReactNode }) {
  return (
    <Page head={[`Day ${day.day}`, day.title]} kind={kind} folio={folio} part={day.part}>
      {children}
    </Page>
  );
}

function Cover({ day }: { day: Day }) {
  const part = PARTS[day.part - 1];
  return (
    <article className="pg pg-cover" data-part={day.part}>
      <CoverArt day={day.day} emblem={day.emblem} className="pg-art" />
      <div className="pg-cover-top">
        <span>Quran in 30 Days</span>
        <span>
          Part {part.n} · {part.title}
        </span>
      </div>
      <div className="pg-cover-text">
        <p className="pg-daynum">Day {day.day}</p>
        <h1>{day.title}</h1>
        <p className="pg-question">{day.question}</p>
      </div>
    </article>
  );
}

function JuzStrip({ juz }: { juz: number[] }) {
  return (
    <figure className="juz">
      <ol aria-hidden="true">
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i} className={juz.includes(i + 1) ? "is-lit" : undefined}>
            {i + 1}
          </li>
        ))}
      </ol>
      <figcaption>
        Where today&apos;s passages sit: juz {juz.join(", ")} of 30. One theme, read across the whole Quran.
      </figcaption>
    </figure>
  );
}

const DIGITS = "٠١٢٣٤٥٦٧٨٩";
const ayahMark = (key: string) => `﴿${key.split(":")[1].replace(/\d/g, (d) => DIGITS[+d])}﴾`;
const arabic = (p: Passage) => p.lines.map((l) => `${l.ar} ${ayahMark(l.key)}`).join(" ");

function PassageBlock({ p }: { p: Passage }) {
  return (
    <section className="ps">
      <div className="ps-top">
        <Link href={p.href} className="ps-ref">
          {p.ref}
        </Link>
        <Tag label={p.label} />
      </div>
      {p.lines.some((l) => l.ar) && (
        <p className="ps-ar ar" lang="ar" dir="rtl">
          {arabic(p)}
        </p>
      )}
      <blockquote className="ps-en">
        {p.lines.map((l) => (
          <span key={l.key}>{l.en} </span>
        ))}
      </blockquote>
      <p className="ps-context">
        <b>Context</b> {p.context}
      </p>
      <p className="ps-point">{p.point}</p>
      {p.note && <p className={`ps-note is-${p.label}`}>{p.note}</p>}
    </section>
  );
}

function Root({ letters }: { letters: string[] }) {
  return (
    <ol className="wd-root" dir="rtl" aria-label="Root letters">
      {letters.map((l, i) => (
        <li key={i} className="ar" lang="ar">
          {l}
        </li>
      ))}
    </ol>
  );
}

function Refs({ links }: { links: { ref: string; href: string }[] }) {
  return (
    <span className="refs">
      {links.map((l) => (
        <Link key={l.ref} href={l.href}>
          {l.ref}
        </Link>
      ))}
    </span>
  );
}

export function dayPages(day: Day, next?: DaySummary): React.ReactNode[] {
  const pages: React.ReactNode[] = [<Cover key="cover" day={day} />];
  let folio = 2;
  const sheet = (kind: string, body: React.ReactNode) => (
    <Sheet key={`${kind}${folio}`} day={day} kind={kind} folio={folio++}>
      {body}
    </Sheet>
  );

  pages.push(
    sheet(
      "intro",
      <>
        <p className="pg-eyebrow">Today</p>
        <h2 className="pg-h">{day.question}</h2>
        {day.intro.map((p, i) => (
          <p key={i} className="pg-lede">
            {p}
          </p>
        ))}
        <JuzStrip juz={day.juz} />
        {day.review && (
          <p className="pg-review">
            A sensitive topic. This lesson is a draft awaiting review by a qualified scholar; where readings differ, the
            main views are shown.
          </p>
        )}
      </>,
    ),
  );

  for (let i = 0; i < day.passages.length; i += 2) {
    pages.push(
      sheet(
        "passages",
        <>
          {i === 0 && <p className="pg-eyebrow">What the Quran says</p>}
          {day.passages.slice(i, i + 2).map((p) => (
            <PassageBlock key={p.ref} p={p} />
          ))}
        </>,
      ),
    );
  }

  pages.push(
    sheet(
      "visual",
      <>
        <p className="pg-eyebrow">See it</p>
        <h2 className="pg-h">{day.visual.title}</h2>
        {day.visual.label && <Tag label={day.visual.label} />}
        <div className={`vz vz-k-${day.visual.kind}`}>
          <Visual v={day.visual} anatomy={day.anatomy} />
        </div>
        <p className="vz-caption">{day.visual.caption}</p>
      </>,
    ),
  );

  pages.push(
    sheet(
      "word",
      <>
        <p className="pg-eyebrow">The key word</p>
        <div className="wd">
          <p className="wd-ar ar" lang="ar" dir="rtl">
            {day.word.ar}
          </p>
          <p className="wd-tr">
            <i>{day.word.tr}</i> · {day.word.meaning}
          </p>
          <Root letters={day.word.root} />
          <p className="wd-nuance">{day.word.nuance}</p>
          <Refs links={day.word.links} />
        </div>
        <div className="mx">
          <p className="pg-eyebrow">A common mix-up</p>
          <p className="mx-myth">{day.mixup.myth}</p>
          <p className="mx-truth">{day.mixup.truth}</p>
          <Refs links={day.mixup.links} />
        </div>
      </>,
    ),
  );

  const m = day.memorize;
  pages.push(
    sheet(
      "remember",
      <>
        <p className="pg-eyebrow">Remember</p>
        <ol className="rm">
          {day.remember.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
        <figure className="mz">
          <p className="pg-eyebrow">Carry one verse</p>
          {m.lines.some((l) => l.ar) && (
            <p className="mz-ar ar" lang="ar" dir="rtl">
              {arabic(m)}
            </p>
          )}
          <blockquote className="mz-en">{m.lines.map((l) => l.en).join(" ")}</blockquote>
          <figcaption>
            <Link href={m.href}>{m.ref}</Link>
            <Link href="/games/quran-memorization-test">Practise memorising</Link>
          </figcaption>
        </figure>
      </>,
    ),
  );

  const quiz = day.recall ? [...day.quiz, day.recall] : day.quiz;
  pages.push(
    sheet(
      "quiz",
      <>
        <p className="pg-eyebrow">Check yourself</p>
        <Quiz day={day.day} items={quiz} />
        <ol className="qz-print">
          {quiz.map((q, i) => (
            <li key={i}>
              <p>{q.q}</p>
              <ol type="A">
                {q.options.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ol>
            </li>
          ))}
          <li className="qz-key">Answers: {quiz.map((q, i) => `${i + 1}${String.fromCharCode(65 + q.answer)}`).join(" · ")}</li>
        </ol>
      </>,
    ),
  );

  pages.push(
    sheet(
      "back",
      <>
        <p className="pg-eyebrow">Before you close</p>
        <Reflect day={day.day} prompt={day.reflect} />
        <div className="seal">
          <Icon name="spark" />
          <span>Day {day.day} complete</span>
        </div>
        {next && (
          <Link href={dayHref(next.day)} className="next-day">
            <CoverArt day={next.day} emblem={next.emblem} className="next-art" />
            <span>
              <small>Tomorrow · Day {next.day}</small>
              <b>{next.title}</b>
            </span>
          </Link>
        )}
        {day.connections.length > 0 && (
          <p className="back-row">
            <b>Connects to</b>
            {day.connections.map((c) => (
              <Link key={c} href={dayHref(c)}>
                Day {c}
              </Link>
            ))}
          </p>
        )}
        <p className="back-row">
          <b>Go deeper</b>
          <Refs links={day.deeper} />
        </p>
        <p className="back-row">
          <b>Read more</b>
          {day.links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </p>
        <p className="back-fine">
          Translation: Sahih International. Lesson status: {day.status}
          {day.status !== "approved" ? ", not yet reviewed by a scholar" : ""}.
        </p>
      </>,
    ),
  );
  return pages;
}
