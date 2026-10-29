"use client";

import { useMemo, useRef, useState } from "react";
import { matchSurahs } from "@/components/SurahIndex";
import { BAND_LABEL, band, choices, hints, POINTS, type QuestVerse, type SurahPick } from "./quest";

export type RoundSettings = {
  choices: number;
  tries: number;
  free: number;
  translation: boolean;
  nearby: number;
  // Daily play opens the next hint after each miss; the journey lets the player buy hints with points.
  hintsOnMiss: boolean;
};

export type RoundOutcome = { solved: boolean; hints: number; misses: number; guesses: number[] };

type Effects = { hit: (combo: number) => void; miss: () => void; tap: () => void };

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function VerseRound({ kicker, verse, surahs, settings, initial, sfx, onGuess, onDone, cta }: {
  kicker: string;
  verse: QuestVerse;
  surahs: SurahPick[];
  settings: RoundSettings;
  initial?: number[];
  sfx: Effects;
  onGuess?: (guesses: number[]) => void;
  onDone: (o: RoundOutcome) => void;
  cta: string;
}) {
  const answer = surahs[verse.s - 1];
  const ladder = useMemo(() => hints(verse, answer, settings.translation), [verse, answer, settings.translation]);
  const cards = useMemo(
    () => (settings.choices ? choices(answer.id, settings.choices, settings.nearby) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dealt once per verse
    [verse],
  );
  const [guesses, setGuesses] = useState<number[]>(initial ?? []);
  const [bought, setBought] = useState(0);

  const misses = guesses.filter((g) => g !== answer.id).length;
  const solved = guesses.includes(answer.id);
  const over = solved || guesses.length >= settings.tries;
  const opened = Math.min(ladder.length, settings.free + (settings.hintsOnMiss ? misses : bought));
  const shown = over ? ladder : ladder.slice(0, opened);
  const englishShown = settings.translation || shown.some((h) => h.key === "en");

  const guess = (id: number) => {
    if (over || guesses.includes(id)) return;
    const next = [...guesses, id];
    setGuesses(next);
    onGuess?.(next);
    if (id === answer.id) sfx.hit(2);
    else sfx.miss();
  };

  return (
    <div className="gs-round gq-round">
      <p className="gs-kicker" tabIndex={-1}>{kicker}</p>

      <figure className="gq-verse">
        <p className="gq-ar ar" lang="ar" dir="rtl">{verse.ar}</p>
        {englishShown && <figcaption className="gq-en">{verse.en}</figcaption>}
      </figure>

      <div className="gq-tries" aria-label={`${settings.tries - guesses.length} of ${settings.tries} guesses left`}>
        {Array.from({ length: settings.tries }, (_, i) => (
          <i key={i} className={cx(i < guesses.length && (guesses[i] === answer.id ? "is-hit" : "is-miss"))} />
        ))}
      </div>

      {shown.filter((h) => h.key !== "en").length > 0 && (
        <ul className="gq-hints" aria-live="polite">
          {shown
            .filter((h) => h.key !== "en")
            .map((h) => (
              <li key={h.key} className={h.key === "nb" ? "is-wide" : undefined}>
                <b>{h.label}</b>
                <span>{h.body}</span>
              </li>
            ))}
        </ul>
      )}

      {!over && !settings.hintsOnMiss && opened < ladder.length && (
        <button
          type="button"
          className="gs-hint"
          onClick={() => {
            sfx.tap();
            setBought(bought + 1);
          }}
        >
          {ladder[opened].key === "en" ? "Show the translation" : `Hint: ${ladder[opened].label.toLowerCase()}`}
          <small>−{POINTS.hint} points</small>
        </button>
      )}

      {guesses.filter((g) => g !== answer.id).length > 0 && (
        <ol className="gq-misses" aria-label="Your wrong guesses">
          {guesses
            .filter((g) => g !== answer.id)
            .map((g) => (
              <Miss key={g} guess={surahs[g - 1]} answer={answer} />
            ))}
        </ol>
      )}

      {over ? (
        <Reveal verse={verse} answer={answer} solved={solved} cta={cta} onContinue={() => onDone({ solved, hints: bought, misses, guesses })} />
      ) : settings.choices ? (
        <ul className="gq-cards">
          {cards.map((id) => (
            <li key={id}>
              <button
                type="button"
                className={cx("gs-option", "gq-card", guesses.includes(id) && "is-wrong")}
                disabled={guesses.includes(id)}
                onClick={() => guess(id)}
              >
                <span className="gq-card-n">{id}</span>
                <b>{surahs[id - 1].transliteration}</b>
                <span className="gq-card-ar ar" lang="ar" dir="rtl">{surahs[id - 1].name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Picker surahs={surahs} used={guesses} onPick={guess} />
      )}
    </div>
  );
}

function Miss({ guess, answer }: { guess: SurahPick; answer: SurahPick }) {
  const d = answer.id - guess.id;
  const b = band(Math.abs(d));
  return (
    <li className={`gq-miss is-${b}`}>
      <span className="gq-miss-name">
        <b>{guess.transliteration}</b>
        <small>Surah {guess.id} · {guess.place}</small>
      </span>
      <span className="gq-chip">{BAND_LABEL[b]}</span>
      <span className="gq-dir">{d > 0 ? "Later ↓" : "Earlier ↑"}</span>
    </li>
  );
}

function Reveal({ verse, answer, solved, cta, onContinue }: {
  verse: QuestVerse;
  answer: SurahPick;
  solved: boolean;
  cta: string;
  onContinue: () => void;
}) {
  return (
    <div className={cx("gs-feedback", "gq-reveal", solved ? "is-right" : "is-wrong")} role="status">
      <p className="gq-reveal-tag">{solved ? "Correct" : "The answer"}</p>
      <h3>
        {answer.transliteration} <span className="ar" lang="ar" dir="rtl">{answer.name}</span>
      </h3>
      <p className="gq-reveal-meta">
        “{answer.meaning}” · verse {verse.s}:{verse.a} · {answer.place} · {answer.verses} verses
      </p>
      <a className="gq-link" href={`${answer.href}/${verse.a}`} target="_blank" rel="noopener">
        Read this verse with tafsir <span aria-hidden="true">↗</span>
      </a>
      <button type="button" className="gs-cta" onClick={onContinue} autoFocus>
        {cta}
      </button>
    </div>
  );
}

function Picker({ surahs, used, onPick }: { surahs: SurahPick[]; used: number[]; onPick: (id: number) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const options = useMemo(
    () => (query.trim() ? matchSurahs(surahs, query).filter((s) => !used.includes(s.id)).slice(0, 6) : []),
    [surahs, used, query],
  );

  const pick = (s: SurahPick | undefined) => {
    if (!s) return;
    onPick(s.id);
    setQuery("");
    setActive(0);
    input.current?.focus();
  };

  return (
    <div className="gq-picker">
      <label htmlFor="gq-input" className="gq-label">Your guess</label>
      <input
        id="gq-input"
        ref={input}
        role="combobox"
        aria-expanded={options.length > 0}
        aria-controls="gq-options"
        aria-activedescendant={options[active] ? `gq-opt-${options[active].id}` : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Type a surah name or number"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const step = e.key === "ArrowDown" ? 1 : -1;
            setActive((a) => Math.min(options.length - 1, Math.max(0, a + step)));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(options[active]);
          }
        }}
      />
      {options.length > 0 && (
        <ul id="gq-options" role="listbox" className="gq-options">
          {options.map((s, i) => (
            <li
              key={s.id}
              id={`gq-opt-${s.id}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "is-active" : ""}
              onPointerDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
            >
              <span className="gq-opt-n">{s.id}</span>
              <b>{s.transliteration}</b>
              <small>{s.meaning}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
