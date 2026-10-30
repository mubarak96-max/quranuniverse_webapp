// The two booklets that are not days: the first-visit guide, and the reference booklet of key words and verses.
import Link from "next/link";
import { LABELS, PARTS, dayHref, type Label } from "@/lib/q30-types";
import type { getReference } from "@/lib/q30";
import { Icon } from "./Icons";
import { Page, Tag } from "./pages";

const STEPS: [string, string][] = [
  ["Cover", "the day's big question"],
  ["Today", "a short introduction and where the passages sit in the Quran"],
  ["What the Quran says", "the key passages in Arabic and English, two to a page"],
  ["See it", "one picture that holds the whole idea"],
  ["The key word", "one Arabic word, its root, and a common mix-up"],
  ["Remember", "three points and one verse to carry"],
  ["Check yourself", "a few questions, one from an earlier day"],
  ["Before you close", "a reflection only you can see"],
];

const MEANS: Record<Label, string> = {
  stated: "The verse itself says this.",
  explained: "An explanation from scholars, hadith or history, not the verse's own words.",
  unspecified: "The Quran is silent on the details people often assume.",
  differ: "Scholars hold different readings; the main views are named.",
};

export function guidePages(): React.ReactNode[] {
  const head: [string, string] = ["Quran in 30 Days", "How it works"];
  return [
    <Page key="g1" head={head} kind="guide" folio={1}>
      <p className="pg-eyebrow">Welcome</p>
      <h2 className="pg-h pg-h-big">A map of the Quran in 30 short booklets</h2>
      <p className="pg-lede">
        Each day is one booklet of about nine pages, around 20 minutes. By day 30 you will know the Quran&apos;s shape,
        its great themes, its people and stories, its laws, and where to go deeper.
      </p>
      <p className="pg-lede">
        It will not make you a scholar. It gives you the map, so the rest of your reading has somewhere to land.
      </p>
      <ul className="gd-parts">
        {PARTS.map((p) => (
          <li key={p.n} style={{ "--a": p.sky[1], "--b": p.sky[2] } as React.CSSProperties}>
            <b>{p.title}</b>
            <span>{p.from === p.to ? `Day ${p.from}` : `Days ${p.from}–${p.to}`}</span>
          </li>
        ))}
      </ul>
    </Page>,
    <Page key="g2" head={head} kind="guide" folio={2}>
      <p className="pg-eyebrow">Inside every booklet</p>
      <ol className="gd-steps">
        {STEPS.map(([t, d]) => (
          <li key={t}>
            <b>{t}</b>
            <span>{d}</span>
          </li>
        ))}
      </ol>
      <p className="pg-note">Swipe, tap the edge of the page, or use the arrow keys to turn pages.</p>
    </Page>,
    <Page key="g3" head={head} kind="guide" folio={3}>
      <p className="pg-eyebrow">Four labels you will see</p>
      <h2 className="pg-h">What the text says, and what people say about it</h2>
      <ul className="gd-labels">
        {(Object.keys(LABELS) as Label[]).map((l) => (
          <li key={l}>
            <Tag label={l} />
            <span>{MEANS[l]}</span>
          </li>
        ))}
      </ul>
      <p className="pg-note">The English is Sahih International throughout. Every reference opens the full verse with its tafsir.</p>
    </Page>,
    <Page key="g4" head={head} kind="guide" folio={4}>
      <p className="pg-eyebrow">Your progress</p>
      <h2 className="pg-h">Read in any order. Missed days never count against you.</h2>
      <ul className="gd-perks">
        <li>
          <Icon name="key" /> Your place, notes and scores stay on this device. No account.
        </li>
        <li>
          <Icon name="book" /> Close a booklet any time; it opens again where you stopped.
        </li>
        <li>
          <Icon name="scroll" /> Print any day, or save it as a PDF, from the top bar.
        </li>
        <li>
          <Icon name="home" /> Add it to your home screen and save it for reading offline.
        </li>
      </ul>
      <Link href={dayHref(1)} className="gd-start">
        Open Day 1
      </Link>
    </Page>,
  ];
}

type Reference = ReturnType<typeof getReference>;

const chunk = <T,>(list: T[], n: number) => Array.from({ length: Math.ceil(list.length / n) }, (_, i) => list.slice(i * n, i * n + n));

export function referencePages(ref: Reference): React.ReactNode[] {
  const pages: React.ReactNode[] = [];
  let folio = 1;
  chunk(ref.words, 6).forEach((words, i) => {
    pages.push(
      <Page key={`w${i}`} head={["Reference", "Key words"]} kind="ref" folio={folio++}>
        {i === 0 && <p className="pg-eyebrow">The 30 key words</p>}
        <ul className="rf-words">
          {words.map((w) => (
            <li key={w.day}>
              <span className="ar" lang="ar" dir="rtl">
                {w.ar}
              </span>
              <b>{w.tr}</b>
              <span>{w.meaning}</span>
              <Link href={dayHref(w.day)}>Day {w.day}</Link>
            </li>
          ))}
        </ul>
      </Page>,
    );
  });
  chunk(ref.verses, 9).forEach((group, i) => {
    pages.push(
      <Page key={`v${i}`} head={["Reference", "Verses by surah"]} kind="ref" folio={folio++}>
        {i === 0 && <p className="pg-eyebrow">Every passage, by surah</p>}
        <dl className="rf-verses">
          {group.map((s) => (
            <div key={s.surah}>
              <dt>
                {s.surah}. {s.name}
              </dt>
              <dd>
                {s.refs.map((r) => (
                  <Link key={`${r.ref}${r.day}`} href={r.href}>
                    {r.ref} <small>D{r.day}</small>
                  </Link>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Page>,
    );
  });
  return pages;
}
