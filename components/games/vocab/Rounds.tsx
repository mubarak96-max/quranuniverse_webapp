"use client";

import { useEffect, useRef, useState } from "react";
import { shuffle, type SurahRef, type Verse, type Word } from "./plan";

export type RoundProps = {
  words: Word[];
  onHit: (word: number) => void;
  onMiss: (word: number) => void;
  onDone: () => void;
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function VerseLine({ verse, mark, glosses, onTap, wrong }: {
  verse: Verse;
  mark: number[];
  glosses: "none" | "all" | number[];
  onTap?: (i: number) => void;
  wrong?: number | null;
}) {
  return (
    <p className="wq-verse" lang="ar" dir="rtl">
      {verse.w.map((w, i) => {
        const shown = glosses === "all" || (Array.isArray(glosses) && glosses.includes(i));
        const body = (
          <>
            <span className="wq-vw-ar">{w}</span>
            {shown && <span className="wq-vw-en" lang="en" dir="ltr">{verse.g[i]}</span>}
          </>
        );
        const cls = cx("wq-vw", mark.includes(i) && "is-mark", wrong === i && "is-wrong", shown && "has-gloss");
        return onTap ? (
          <button key={i} type="button" className={cx(cls, "is-tap")} onClick={() => onTap(i)}>
            {body}
          </button>
        ) : (
          <span key={i} className={cls}>
            {body}
          </span>
        );
      })}
    </p>
  );
}

export function VerseRef({ verse, surahs }: { verse: Verse; surahs: SurahRef[] }) {
  const s = surahs[verse.s - 1];
  return (
    <a className="wq-ref" href={`${s.href}/${verse.a}`} target="_blank" rel="noopener">
      {s.name} {verse.s}:{verse.a} <span aria-hidden="true">↗</span>
    </a>
  );
}

// New words, one card each, each shown inside a real verse before the player is tested on it.
export function Intro({ words, ids, verses, surahs, onDone, tap }: {
  words: Word[];
  ids: number[];
  verses: Record<number, Verse[]>;
  surahs: SurahRef[];
  onDone: () => void;
  tap: () => void;
}) {
  const [i, setI] = useState(0);
  const w = words[ids[i]];
  const verse = verses[ids[i]]?.[0];
  const next = () => {
    tap();
    if (i + 1 < ids.length) setI(i + 1);
    else onDone();
  };
  return (
    <div className="gs-round wq-intro">
      <p className="gs-kicker" tabIndex={-1}>New word {i + 1} of {ids.length}</p>
      <div className="wq-card-stack" key={i}>
        <div className="wq-hero-card">
          <span className="wq-hero-ar ar" lang="ar" dir="rtl">{w.ar}</span>
          <span className="wq-hero-en">{w.en}</span>
          <span className="wq-hero-n">Appears {w.n.toLocaleString("en")} times in the Quran</span>
        </div>
        {verse && (
          <figure className="wq-example">
            <VerseLine verse={verse} mark={verse.hit} glosses={verse.hit} />
            <figcaption>
              <span>{verse.en}</span>
              <VerseRef verse={verse} surahs={surahs} />
            </figcaption>
          </figure>
        )}
      </div>
      <div className="gs-dots" aria-hidden="true">
        {ids.map((_, d) => (
          <i key={d} className={cx(d === i && "is-on", d < i && "is-past")} />
        ))}
      </div>
      <button type="button" className="gs-cta" onClick={next} autoFocus>
        {i + 1 < ids.length ? "Next word" : "Start the challenge"}
      </button>
    </div>
  );
}

export function Match({ words, ids, onHit, onMiss, onDone }: RoundProps & { ids: number[] }) {
  const [left] = useState(() => shuffle(ids));
  const [right] = useState(() => shuffle(ids));
  const [pick, setPick] = useState<{ side: "ar" | "en"; id: number } | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [pop, setPop] = useState<number | null>(null);

  const choose = (side: "ar" | "en", id: number) => {
    if (!pick || pick.side === side) {
      setPick(pick?.side === side && pick.id === id ? null : { side, id });
      return;
    }
    const ar = side === "ar" ? id : pick.id;
    const en = side === "en" ? id : pick.id;
    setPick(null);
    if (words[ar].en.toLowerCase() === words[en].en.toLowerCase()) {
      const next = [...done, ar, en];
      setDone(next);
      setPop(ar);
      onHit(ar);
      if (ids.every((i) => next.includes(i))) setTimeout(onDone, 650);
    } else {
      onMiss(ar);
      setWrong([`ar${ar}`, `en${en}`]);
      setTimeout(() => setWrong([]), 450);
    }
  };

  const tile = (side: "ar" | "en", id: number) => (
    <li key={id}>
      <button
        type="button"
        lang={side === "ar" ? "ar" : undefined}
        dir={side === "ar" ? "rtl" : undefined}
        className={cx(
          "gs-tile",
          side === "ar" && "ar",
          pick?.side === side && pick.id === id && "is-picked",
          done.includes(id) && "is-done",
          pop === id && side === "ar" && "is-pop",
          wrong.includes(`${side}${id}`) && "is-wrong",
        )}
        disabled={done.includes(id)}
        aria-pressed={pick?.side === side && pick.id === id}
        onClick={() => choose(side, id)}
      >
        {side === "ar" ? words[id].ar : words[id].en}
      </button>
    </li>
  );

  return (
    <div className="gs-round is-centred">
      <p className="gs-kicker" tabIndex={-1}>Match each word to its meaning</p>
      <div className="wq-match">
        <ul aria-label="Arabic words">{left.map((id) => tile("ar", id))}</ul>
        <ul aria-label="Meanings">{right.map((id) => tile("en", id))}</ul>
      </div>
    </div>
  );
}

export function Choice({ words, word, options, reverse, seconds, onHit, onMiss, onDone }: RoundProps & {
  word: number;
  options: number[];
  reverse: boolean;
  seconds: number | null;
}) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [late, setLate] = useState(false);
  const settled = useRef(false);
  const deadline = useRef<ReturnType<typeof setTimeout>>(undefined);

  const settle = (pick: number | null) => {
    if (settled.current) return;
    settled.current = true;
    clearTimeout(deadline.current);
    setAnswer(pick);
    if (pick === word) {
      onHit(word);
      setTimeout(onDone, 800);
    } else {
      onMiss(word);
    }
  };

  useEffect(() => {
    if (!seconds) return;
    deadline.current = setTimeout(() => {
      setLate(true);
      settle(null);
    }, seconds * 1000);
    return () => clearTimeout(deadline.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one timer per question
  }, []);

  const w = words[word];
  const answered = settled.current;
  return (
    <div className="gs-round is-centred wq-choice">
      <p className="gs-kicker" tabIndex={-1}>{reverse ? "Which Arabic word means" : "What does this word mean?"}</p>
      <div className={cx("gs-prompt", !reverse && "ar")} lang={reverse ? undefined : "ar"} dir={reverse ? undefined : "rtl"}>
        {reverse ? `“${w.en}”` : w.ar}
      </div>
      {seconds && (
        <div className="gs-timer" aria-hidden="true">
          <i style={{ animationDuration: `${seconds}s`, animationPlayState: answered ? "paused" : "running" }} />
        </div>
      )}
      <ul className={cx("gs-options", reverse && "is-ar")}>
        {options.map((o) => (
          <li key={o}>
            <button
              type="button"
              lang={reverse ? "ar" : undefined}
              dir={reverse ? "rtl" : undefined}
              className={cx(
                "gs-option",
                reverse && "ar",
                answered && o === word && "is-right",
                answered && o === answer && o !== word && "is-wrong",
                answered && o !== word && o !== answer && "is-faded",
              )}
              disabled={answered}
              onClick={() => settle(o)}
            >
              {reverse ? words[o].ar : words[o].en}
            </button>
          </li>
        ))}
      </ul>
      {answered && answer !== word && (
        <div className="gs-feedback is-wrong" role="status">
          <p>
            {late ? "Out of time. " : ""}
            <b className="ar" lang="ar">{w.ar}</b> means <b>{w.en}</b>
          </p>
          <button type="button" className="gs-cta" onClick={onDone} autoFocus>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

// The player finds the word inside a real verse; a wrong tap teaches that word's meaning instead of just failing.
export function VerseHunt({ words, word, verse, translation, surahs, onHit, onMiss, onDone, onHint }: RoundProps & {
  word: number;
  verse: Verse;
  translation: boolean;
  surahs: SurahRef[];
  onHint: () => void;
}) {
  const [tried, setTried] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const [found, setFound] = useState(false);
  const [showEn, setShowEn] = useState(translation);
  const solved = found || tried.length >= 2;

  const tap = (i: number) => {
    if (solved) return;
    if (verse.hit.includes(i)) {
      setFound(true);
      onHit(word);
      return;
    }
    if (tried.includes(i)) return;
    onMiss(word);
    setTried([...tried, i]);
    setWrong(i);
    setTimeout(() => setWrong(null), 450);
  };

  return (
    <div className="gs-round is-centred wq-hunt">
      <p className="gs-kicker" tabIndex={-1}>Find it in the verse</p>
      <p className="wq-ask">
        Tap the word that means <b>“{words[word].en}”</b>
      </p>
      <VerseLine
        verse={verse}
        mark={solved ? verse.hit : []}
        glosses={solved ? "all" : tried}
        wrong={wrong}
        onTap={solved ? undefined : tap}
      />
      {showEn || solved ? (
        <p className="wq-translation">{verse.en}</p>
      ) : (
        <button
          type="button"
          className="gs-hint"
          onClick={() => {
            onHint();
            setShowEn(true);
          }}
        >
          Show translation <small>counts as one mistake</small>
        </button>
      )}
      {solved && (
        <div className={cx("gs-feedback", found ? "is-right" : "is-wrong")} role="status">
          <p>
            {found ? "Found it. " : "Here it is. "}Every word now shows its meaning.
          </p>
          <VerseRef verse={verse} surahs={surahs} />
          <button type="button" className="gs-cta" onClick={onDone} autoFocus>
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
