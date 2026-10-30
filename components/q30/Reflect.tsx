"use client";

// The reflection note: saved on the device as the reader types; printed copies get ruled lines instead.
import { useEffect, useState } from "react";
import { patchDay, read } from "./progress";

export function Reflect({ day, prompt }: { day: number; prompt: string }) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => setNote(read().days[day]?.note ?? ""), [day]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <div className="rf">
      <label htmlFor={`rf-${day}`} className="rf-prompt">
        {prompt}
      </label>
      <textarea
        id={`rf-${day}`}
        value={note}
        rows={4}
        placeholder="Write a few lines. Only you can see this; it stays on this device."
        onChange={(e) => {
          setNote(e.target.value);
          patchDay(day, { note: e.target.value });
          setSaved(true);
        }}
      />
      <span className="rf-saved" aria-live="polite">
        {saved ? "Saved" : ""}
      </span>
      <div className="rf-lines" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
}
