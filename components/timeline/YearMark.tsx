"use client";

import { toAh } from "@/lib/timeline-types";

const DIGITS = [..."0123456789"];

// Each digit is a strip of 0-9 that slides to its value, so the year rolls like an odometer as time moves.
function Digit({ d }: { d: number }) {
  return (
    <span className="ym-d">
      <span style={{ transform: `translateY(${-d * 10}%)` }}>
        {DIGITS.map((n) => (
          <i key={n}>{n}</i>
        ))}
      </span>
    </span>
  );
}

// `ah` comes from the data when a moment has an exact Hijri year; otherwise it is estimated from the solar year.
export function YearMark({ year, ah, approx, caption }: { year: number; ah?: number; approx?: boolean; caption?: string }) {
  const hijri = ah ?? (year >= 622 ? toAh(year) : undefined);
  const digits = [...String(Math.abs(year))].map(Number);
  return (
    <div className="ym" aria-live="off">
      <p className="ym-year" aria-label={`${approx ? "about " : ""}${Math.abs(year)} ${year < 0 ? "BCE" : "CE"}`}>
        {approx && <small className="ym-c">c.</small>}
        <span className="ym-digits" aria-hidden="true">
          {digits.map((d, i) => (
            <Digit key={digits.length - i} d={d} />
          ))}
        </span>
        <small className="ym-era">{year < 0 ? "BCE" : "CE"}</small>
      </p>
      <p className="ym-sub">
        {hijri !== undefined && <b>{hijri} AH</b>}
        {caption && <span>{caption}</span>}
      </p>
    </div>
  );
}
