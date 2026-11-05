"use client";

import { useEffect, useRef, useState } from "react";
import { AR_STEPS, DEFAULT_SETTINGS, EN_STEPS, setSettings, useSettings } from "./store";

function Stepper({ label, steps, value, onChange }: { label: string; steps: number[]; value: number; onChange: (v: number) => void }) {
  const i = Math.max(0, steps.indexOf(value));
  return (
    <div className="rs-row">
      <span>{label}</span>
      <div className="rs-stepper" role="group" aria-label={`${label} size`}>
        <button type="button" aria-label={`Smaller ${label}`} disabled={i === 0} onClick={() => onChange(steps[i - 1])}>
          A−
        </button>
        <output aria-live="polite">{Math.round(value * 100)}%</output>
        <button type="button" aria-label={`Larger ${label}`} disabled={i === steps.length - 1} onClick={() => onChange(steps[i + 1])}>
          A+
        </button>
      </div>
    </div>
  );
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="rs-row rs-toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function ReadingSettings() {
  const s = useSettings() ?? DEFAULT_SETTINGS;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className="rs" ref={root}>
      <button
        type="button"
        className="theme-toggle rs-button"
        aria-expanded={open}
        aria-controls="rs-panel"
        aria-label="Reading settings"
        title="Reading settings"
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true">Aa</span>
      </button>
      {open && (
        <div id="rs-panel" className="rs-panel" role="dialog" aria-label="Reading settings">
          <p className="rs-title">Reading settings</p>
          <Stepper label="Arabic" steps={AR_STEPS} value={s.ar} onChange={(ar) => setSettings({ ar })} />
          <Stepper label="English" steps={EN_STEPS} value={s.en} onChange={(en) => setSettings({ en })} />
          <Toggle label="Transliteration" on={s.translit} onChange={(translit) => setSettings({ translit })} />
          <Toggle label="Translation" on={s.translation} onChange={(translation) => setSettings({ translation })} />
          <button type="button" className="rs-reset" onClick={() => setSettings(DEFAULT_SETTINGS)}>
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
