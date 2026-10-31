// Turns one day into the reader's pages: an illustrated opening, one page per chapter, a page to check yourself,
// and a closing page that always offers the next step.
import Link from "next/link";
import { LENSES, PARTS, coverSrc, dayHref, type Day, type DaySummary } from "@/lib/q30-types";
import { BlockView, VerseView, hasImage } from "./blocks";
import { Finish } from "./Finish";
import { LensIcon } from "./LensIcon";
import { Quiz } from "./Quiz";
import { Reflect } from "./Reflect";

export type ReaderPage = { title: string; kind: string; node: React.ReactNode };

function Opening({ day }: { day: Day }) {
  const part = PARTS[day.part - 1];
  const src = coverSrc(day.day);
  return (
    <div className="op">
      {hasImage(src) && (
        // eslint-disable-next-line @next/next/no-img-element -- static export serves pre-sized WebP files
        <img className="op-art" src={src} alt={day.cover.alt} width={1600} height={1067} fetchPriority="high" />
      )}
      <div className="op-text">
        <p className="op-part">
          Part {part.n} · {part.title}
        </p>
        <p className="op-day">Day {day.day}</p>
        <h1>{day.title}</h1>
        <p className="op-q">{day.question}</p>
        <p className="op-meta">
          About {day.minutes} minutes · {day.chapters.length} chapters
        </p>
        <ol className="op-inside">
          {day.chapters.map((c, i) => (
            <li key={i}>
              <button type="button" data-goto={i + 1}>
                <LensIcon lens={c.lens} />
                <span>{c.title}</span>
                <small>{LENSES[c.lens]}</small>
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className="op-begin" data-goto={1}>
          Begin reading
        </button>
        {day.review && (
          <p className="op-review">
            This day covers a sensitive subject. It is a draft awaiting review by a qualified scholar; where readings
            differ, the main views are given.
          </p>
        )}
      </div>
    </div>
  );
}

export function dayPages(day: Day, next?: DaySummary): ReaderPage[] {
  const pages: ReaderPage[] = [{ title: "Opening", kind: "opening", node: <Opening day={day} /> }];

  day.chapters.forEach((c, i) => {
    pages.push({
      title: c.title,
      kind: c.lens,
      node: (
        <article className="ch" data-lens={c.lens}>
          <p className="ch-n">
            <LensIcon lens={c.lens} />
            {i + 1} of {day.chapters.length}
          </p>
          <h2 className="ch-title">{c.title}</h2>
          <div className="ch-body">
            {c.blocks.map((b, j) => (
              <BlockView key={j} b={b} anatomy={day.anatomy} />
            ))}
          </div>
        </article>
      ),
    });
  });

  const quiz = day.recall ? [...day.quiz, day.recall] : day.quiz;
  pages.push({
    title: "Check your understanding",
    kind: "quiz",
    node: (
      <article className="ch" data-lens="quiz">
        <h2 className="ch-title">Check your understanding</h2>
        <Quiz day={day.day} items={quiz} />
        <h3 className="ch-h">A verse to carry today</h3>
        <VerseView v={day.carry} size="carry" />
        <p className="carry-tip">
          Read it aloud three times, then once more before you sleep.{" "}
          <Link href="/games/quran-memorization-test">Practise memorising</Link>
        </p>
      </article>
    ),
  });

  pages.push({
    title: "Before you go",
    kind: "end",
    node: (
      <article className="ch" data-lens="end">
        <h2 className="ch-title">Before you go</h2>
        <Reflect day={day.day} prompt={day.reflect} />
        <Finish
          day={day.day}
          next={
            next && {
              href: dayHref(next.day),
              day: next.day,
              title: next.title,
              question: next.question,
              image: hasImage(coverSrc(next.day)) ? coverSrc(next.day).replace(".webp", "-sm.webp") : undefined,
            }
          }
        />
        <div className="dm">
          {day.connections.length > 0 && (
            <p>
              <b>Related days</b>
              {day.connections.map((c) => (
                <Link key={c} href={dayHref(c)}>
                  Day {c}
                </Link>
              ))}
            </p>
          )}
          <p>
            <b>Keep reading</b>
            {day.deeper.map((l) => (
              <Link key={l.ref} href={l.href}>
                {l.ref}
              </Link>
            ))}
          </p>
          {day.links.length > 0 && (
            <p>
              <b>Learn more</b>
              {day.links.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </p>
          )}
          <p className="dm-fine">
            English: Sahih International. Every reference opens the full verse with its tafsir.
            {day.status !== "approved" && " This lesson has not yet been reviewed by a scholar."}
          </p>
        </div>
      </article>
    ),
  });
  return pages;
}
