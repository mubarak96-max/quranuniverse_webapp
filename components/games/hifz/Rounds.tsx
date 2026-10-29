"use client";

import { useRef, useState } from "react";
import { bare, opening, shuffle, type Ref, type Step, type Verse } from "./plan";

export type RoundProps = {
  verses: Verse[];
  name: string;
  translation: boolean;
  onHit: (r: Ref) => void;
  onMiss: (r: Ref) => void;
  onHint: () => void;
  onDone: () => void;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// The end-of-verse sign with the verse number in Arabic digits, as printed in the mushaf.
const mark = (n: number) => `۝${n.toLocaleString("ar-EG")}`;

function Ayah({ v, verse, children, dim }: { v: number; verse?: Verse; children?: React.ReactNode; dim?: boolean }) {
  return (
    <p className={cx("hz-ayah", dim && "is-dim")} lang="ar" dir="rtl">
      {children ?? verse!.w.join(" ")} <span className="hz-mark">{mark(v + 1)}</span>
    </p>
  );
}

function Translation({ en, shown, onShow }: { en: string; shown: boolean; onShow: () => void }) {
  return shown ? (
    <p className="hz-en">{en}</p>
  ) : (
    <button type="button" className="gs-hint" onClick={onShow}>
      Show translation <small>counts as one mistake</small>
    </button>
  );
}

function Feedback({ right, children, onDone }: { right: boolean; children: React.ReactNode; onDone: () => void }) {
  return (
    <div className={cx("gs-feedback", right ? "is-right" : "is-wrong")} role="status">
      {children}
      <button type="button" className="gs-cta" onClick={onDone} autoFocus>
        Continue
      </button>
    </div>
  );
}

export function ReadThrough({ verses, name, from, to, onDone }: { verses: Verse[]; name: string; from: number; to: number; onDone: () => void }) {
  const [en, setEn] = useState(false);
  return (
    <div className="gs-round hz-read">
      <p className="gs-kicker" tabIndex={-1}>Recite it once first</p>
      <h2 className="hz-read-title">
        {name} <small>{from === to ? `verse ${from + 1}` : `verses ${from + 1}–${to + 1}`}</small>
      </h2>
      <div className="hz-passage">
        {verses.slice(from, to + 1).map((v, k) => (
          <div key={k}>
            <Ayah v={from + k} verse={v} />
            {en && <p className="hz-en">{v.en}</p>}
          </div>
        ))}
      </div>
      <button type="button" className="hz-toggle" onClick={() => setEn(!en)}>
        {en ? "Hide" : "Show"} the meaning
      </button>
      <button type="button" className="gs-cta" onClick={onDone}>
        I have recited it · start the test
      </button>
    </div>
  );
}

export function Fill({ step, verses, translation, onHit, onMiss, onHint, onDone }: RoundProps & { step: Extract<Step, { kind: "fill" }> }) {
  const r = { s: step.s, v: step.v };
  const verse = verses[step.v];
  const [at, setAt] = useState(0);
  const [got, setGot] = useState<boolean[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [letter, setLetter] = useState(false);
  const [en, setEn] = useState(translation);
  const done = at >= step.blanks.length;
  const clean = done && got.every(Boolean);

  const choose = (o: string) => {
    if (done) return;
    const right = o === bare(verse.w[step.blanks[at]]);
    if (right) onHit(r);
    else {
      onMiss(r);
      setWrong(o);
      setTimeout(() => setWrong(null), 450);
    }
    const g = [...got, right];
    setGot(g);
    setAt(at + 1);
    setLetter(false);
    if (at + 1 >= step.blanks.length && g.every(Boolean)) setTimeout(onDone, 900);
  };

  return (
    <div className="gs-round is-centred">
      <p className="gs-kicker" tabIndex={-1}>
        {step.blanks.length === 1 ? "Fill in the missing word" : `Fill in ${step.blanks.length} missing words`}
      </p>
      <Ayah v={step.v}>
        {verse.w.map((w, i) => {
          const b = step.blanks.indexOf(i);
          if (b < 0) return <span key={i}>{w} </span>;
          const filled = b < at;
          return (
            <span key={i}>
              <span className={cx("hz-gap", b === at && "is-now", filled && (got[b] ? "is-right" : "is-missed"))}>
                {filled ? bare(w) : b === at && letter ? `${[...bare(w)][0]}…` : <span className="hz-gap-fill">ـــــ</span>}
              </span>{" "}
            </span>
          );
        })}
      </Ayah>
      <Translation en={verse.en} shown={en} onShow={() => { onHint(); setEn(true); }} />
      {!done && (
        <>
          <ul className="gs-options is-ar">
            {step.options[at].map((o) => (
              <li key={o}>
                <button type="button" lang="ar" dir="rtl" className={cx("gs-option ar", wrong === o && "is-wrong")} onClick={() => choose(o)}>
                  {o}
                </button>
              </li>
            ))}
          </ul>
          {!letter && (
            <button type="button" className="gs-hint" onClick={() => { onHint(); setLetter(true); }}>
              Show the first letter <small>counts as one mistake</small>
            </button>
          )}
        </>
      )}
      {done && !clean && (
        <Feedback right={false} onDone={onDone}>
          <p>The missed word is marked. Recite the whole verse once more before you go on.</p>
        </Feedback>
      )}
    </div>
  );
}

export function NextOrFirst({ step, verses, translation, onHit, onMiss, onHint, onDone }: RoundProps & { step: Extract<Step, { kind: "next" | "first" }> }) {
  const r = { s: step.s, v: step.kind === "next" ? step.v + 1 : step.v };
  const answer = step.kind === "next" ? step.v + 1 : step.v;
  const [pick, setPick] = useState<number | null>(null);
  const [en, setEn] = useState(translation);
  const settled = pick !== null;
  const shown = (i: number) => (step.kind === "next" ? opening(verses[i], 5) : opening(verses[i], 2));

  const choose = (i: number) => {
    if (settled) return;
    setPick(i);
    if (i === answer) {
      onHit(r);
      setTimeout(onDone, 900);
    } else onMiss(r);
  };

  const context = step.kind === "next" ? step.v : step.v - 1;
  return (
    <div className="gs-round is-centred">
      <p className="gs-kicker" tabIndex={-1}>{step.kind === "next" ? "Which verse comes next?" : `How does verse ${step.v + 1} begin?`}</p>
      <Ayah v={context} verse={verses[context]} dim={step.kind === "first"} />
      {step.kind === "first" && <Translation en={verses[step.v].en} shown={en} onShow={() => { onHint(); setEn(true); }} />}
      <ul className="gs-options">
        {step.options.map((o) => (
          <li key={o}>
            <button
              type="button"
              lang="ar"
              dir="rtl"
              className={cx(
                "gs-option ar hz-line",
                settled && o === answer && "is-right",
                settled && o === pick && o !== answer && "is-wrong",
                settled && o !== answer && o !== pick && "is-faded",
              )}
              disabled={settled}
              onClick={() => choose(o)}
            >
              {shown(o)}
            </button>
          </li>
        ))}
      </ul>
      {settled && pick !== answer && (
        <Feedback right={false} onDone={onDone}>
          <Ayah v={answer} verse={verses[answer]} />
        </Feedback>
      )}
    </div>
  );
}

export function Order({ step, verses, onHit, onMiss, onDone }: RoundProps & { step: Extract<Step, { kind: "order" }> }) {
  const [tiles] = useState(() => shuffle(step.verses));
  const [placed, setPlaced] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const missed = useRef(new Set<number>());
  const text = (i: number) => verses[i].w.map(bare).join(" ");
  const long = (i: number) => (verses[i].w.length > 14 ? opening(verses[i], 10) : verses[i].w.join(" "));

  const tap = (i: number) => {
    const want = step.verses[placed.length];
    // Identical verses are interchangeable, so compare the words, not the position.
    if (text(i) === text(want)) {
      const next = [...placed, i];
      setPlaced(next);
      if (!missed.current.has(want)) onHit({ s: step.s, v: want });
      if (next.length === step.verses.length) setTimeout(onDone, 900);
    } else {
      if (!missed.current.has(want)) onMiss({ s: step.s, v: want });
      missed.current.add(want);
      setWrong(i);
      setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="gs-round is-centred">
      <p className="gs-kicker" tabIndex={-1}>Put the verses in order</p>
      <ol className="hz-placed">
        {placed.map((i, k) => (
          <li key={k} className="is-on">
            <Ayah v={step.verses[k]}>{long(i)}</Ayah>
          </li>
        ))}
        {placed.length < step.verses.length && (
          <li>
            <span className="hz-slot">
              {placed.length === 0 ? "Tap the first verse" : `Verse ${placed.length + 1} of ${step.verses.length}`}
            </span>
          </li>
        )}
      </ol>
      <ul className="gs-options">
        {tiles.map((i) => (
          <li key={i}>
            <button
              type="button"
              lang="ar"
              dir="rtl"
              className={cx("gs-option ar hz-line", placed.includes(i) && "is-gone", wrong === i && "is-wrong")}
              disabled={placed.includes(i)}
              onClick={() => tap(i)}
            >
              {long(i)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Spot({ step, verses, translation, onHit, onMiss, onHint, onDone }: RoundProps & { step: Extract<Step, { kind: "spot" }> }) {
  const r = { s: step.s, v: step.v };
  const verse = verses[step.v];
  const [tried, setTried] = useState<number | null>(null);
  const [en, setEn] = useState(translation);
  const settled = tried !== null;

  const tap = (i: number) => {
    if (settled) return;
    setTried(i);
    if (i === step.at) {
      onHit(r);
      setTimeout(onDone, 1300);
    } else onMiss(r);
  };

  return (
    <div className="gs-round is-centred">
      <p className="gs-kicker" tabIndex={-1}>One word has been changed. Tap it.</p>
      <p className="hz-ayah hz-spot" lang="ar" dir="rtl">
        {verse.w.map((w, i) => (
          <button
            key={i}
            type="button"
            className={cx("hz-word", settled && i === step.at && "is-fixed", settled && i === tried && i !== step.at && "is-wrong")}
            disabled={settled}
            onClick={() => tap(i)}
          >
            {i === step.at ? (settled ? bare(w) : step.fake) : w}
            {settled && i === step.at && <small aria-label={`not ${step.fake}`}>{step.fake}</small>}
          </button>
        ))}
        <span className="hz-mark">{mark(step.v + 1)}</span>
      </p>
      <Translation en={verse.en} shown={en} onShow={() => { onHint(); setEn(true); }} />
      {settled && tried !== step.at && (
        <Feedback right={false} onDone={onDone}>
          <p>
            The changed word was <b className="ar" lang="ar">{step.fake}</b>. The verse says <b className="ar" lang="ar">{bare(verse.w[step.at])}</b>.
          </p>
        </Feedback>
      )}
    </div>
  );
}
