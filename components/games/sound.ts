// Small synthesised chimes, so the game ships no audio files. Correct answers climb a pentatonic scale with the combo.

let ctx: AudioContext | null = null;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

function tone(freq: number, at: number, length: number, type: OscillatorType, volume: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + at;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}

// Browsers only allow audio after a user gesture; every call here follows a tap.
function ready() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return false;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return true;
}

const note = (step: number) => 523.25 * 2 ** (SCALE[Math.min(step, SCALE.length - 1)] / 12);

export const sound = {
  hit(combo: number) {
    if (!ready()) return;
    tone(note(combo), 0, 0.35, "sine", 0.18);
    tone(note(combo) * 2, 0.04, 0.25, "triangle", 0.05);
  },
  miss() {
    if (!ready()) return;
    tone(196, 0, 0.22, "triangle", 0.12);
    tone(155.56, 0.08, 0.3, "triangle", 0.1);
    navigator.vibrate?.(60);
  },
  tap() {
    if (!ready()) return;
    tone(880, 0, 0.06, "sine", 0.04);
  },
  win() {
    if (!ready()) return;
    [0, 2, 4, 5, 7].forEach((s, i) => tone(note(s), i * 0.11, 0.6, "sine", 0.16));
  },
};
