"use client";

import { MOODS, moodColor, type Act, type Scene } from "@/lib/journey-types";

const W = 1000;
const H = 48;
const PAD = 8;

// The journey's emotional arc: one point per scene, high for light moments and low for dark ones.
export function HeartLine({ scenes, acts, index, onJump }: { scenes: Scene[]; acts: Act[]; index: number; onJump: (i: number) => void }) {
  const gap = (W - PAD * 2) / (scenes.length - 1);
  const pts = scenes.map((s, i) => [PAD + i * gap, H / 2 - MOODS[s.mood] * (H / 2 - 6)] as const);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  const [cx, cy] = pts[index];

  function jump(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    onJump(Math.max(0, Math.min(scenes.length - 1, Math.round((x - PAD) / gap))));
  }

  return (
    <div className="jr-heart" onClick={jump} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="jr-mood" x1="0" x2={W} gradientUnits="userSpaceOnUse">
            {scenes.map((s, i) => (
              <stop key={s.id} offset={pts[i][0] / W} stopColor={moodColor(s.mood)} />
            ))}
          </linearGradient>
          <clipPath id="jr-past">
            <rect width={cx} height={H} />
          </clipPath>
        </defs>
        {acts.slice(1).map((a) => (
          <line key={a.start} x1={pts[a.start][0] - gap / 2} x2={pts[a.start][0] - gap / 2} y1="4" y2={H - 4} className="jr-tick" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={d} className="jr-arc" vectorEffect="non-scaling-stroke" />
        <path d={d} className="jr-arc jr-past" clipPath="url(#jr-past)" vectorEffect="non-scaling-stroke" />
      </svg>
      <i className="jr-now" style={{ left: `${(cx / W) * 100}%`, top: `${(cy / H) * 100}%`, background: moodColor(scenes[index].mood) }} />
    </div>
  );
}
