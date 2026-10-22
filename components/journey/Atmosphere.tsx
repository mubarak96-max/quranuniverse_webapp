"use client";

import { useEffect, useRef } from "react";
import type { Motes } from "./sets";

// Positions are fractions of the canvas, so a resize never scatters the scene.
type Mote = { x: number; y: number; vx: number; vy: number; r: number; c: string; ph: number; life: number; dying: boolean; m: Motes };

// The scene's focal point: centred above the text on phones, right of it on wide screens (see scenery.css).
let CX = 0.5;
let CY = 0.42;
const FADE_S = 1.2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function spawn(m: Motes, fresh: boolean): Mote {
  const p: Mote = { x: Math.random(), y: Math.random(), vx: 0, vy: 0, r: rand(...m.size), c: m.colors[(Math.random() * m.colors.length) | 0], ph: rand(0, 6.28), life: 0, dying: false, m };
  const a = rand(0, Math.PI * 2);
  if (m.mode === "converge") {
    const d = fresh ? rand(0.05, 0.8) : rand(0.6, 0.85);
    p.x = CX + Math.cos(a) * d;
    p.y = CY + Math.sin(a) * d;
  } else if (m.mode === "emanate") {
    const d = fresh ? rand(0, 0.7) : 0;
    p.x = CX + Math.cos(a) * d;
    p.y = CY + Math.sin(a) * d;
    p.vx = Math.cos(a) * m.speed * rand(0.4, 1.2);
    p.vy = Math.sin(a) * m.speed * rand(0.4, 1.2);
  } else if (m.mode === "swirl") {
    p.vx = a;
    p.vy = rand(0.12, 0.6);
  } else {
    p.vx = rand(-1, 1) * m.speed;
    p.vy = rand(-1, 1) * m.speed;
  }
  return p;
}

function step(p: Mote, dt: number, t: number) {
  const { mode, speed } = p.m;
  switch (mode) {
    case "twinkle":
    case "drift":
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      break;
    case "rise":
      p.y -= speed * dt * (0.5 + p.r / 3);
      p.x += Math.sin(t * 0.7 + p.ph) * 0.004 * dt;
      if (p.y < -0.05) Object.assign(p, { y: 1.05, x: Math.random() });
      return;
    case "fall":
      p.y += speed * dt * (0.5 + p.r / 4);
      p.x += Math.sin(t * 0.9 + p.ph) * 0.03 * dt;
      if (p.y > 1.05) Object.assign(p, { y: -0.05, x: Math.random() });
      return;
    case "converge": {
      const dx = CX - p.x;
      const dy = CY - p.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.015) Object.assign(p, spawn(p.m, false), { life: p.life, dying: p.dying });
      else {
        p.x += (dx / d) * speed * dt * (0.4 + d);
        p.y += (dy / d) * speed * dt * (0.4 + d);
      }
      return;
    }
    case "emanate":
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -0.05 || p.x > 1.05 || p.y < -0.05 || p.y > 1.05) Object.assign(p, spawn(p.m, false), { life: p.life, dying: p.dying });
      return;
    case "swirl":
      p.vx += speed * dt * (1.2 - p.vy);
      p.x = CX + Math.cos(p.vx) * p.vy * 0.9;
      p.y = CY + Math.sin(p.vx) * p.vy * 0.55;
      return;
  }
  if (p.x < 0) p.x += 1;
  if (p.x > 1) p.x -= 1;
  if (p.y < 0) p.y += 1;
  if (p.y > 1) p.y -= 1;
}

// A canvas of drifting motes. When the set changes the old motes fade out while the new ones fade in.
// Sets are constants, so scenes that share a set keep their motes.
export function Atmosphere({ motes }: { motes: Motes }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pool = useRef<Mote[]>([]);
  const shown = useRef<Motes>(undefined);

  useEffect(() => {
    if (shown.current === motes) return;
    shown.current = motes;
    for (const p of pool.current) p.dying = true;
    for (let i = 0; i < motes.n; i++) pool.current.push(spawn(motes, true));
  }, [motes]);

  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = el.clientWidth;
      h = el.clientHeight;
      [CX, CY] = w >= 900 ? [0.7, 0.5] : [0.5, 0.42];
      el.width = w * dpr;
      el.height = h * dpr;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      const t = now / 1000;
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const live: Mote[] = [];
      for (const p of pool.current) {
        p.life = Math.max(0, Math.min(1, p.life + (p.dying ? -dt : dt) / FADE_S));
        if (p.dying && p.life === 0) continue;
        live.push(p);
        if (!still) step(p, dt, t);
        const tw = p.m.mode === "twinkle" ? 0.55 + 0.45 * Math.sin(t * 1.3 + p.ph * 3) : 0.85;
        const x = p.x * w;
        const y = p.y * h;
        ctx.globalAlpha = p.life * tw;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.m.glow) {
          ctx.globalAlpha = p.life * tw * 0.12;
          ctx.beginPath();
          ctx.arc(x, y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      pool.current = live;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="jr-canvas" aria-hidden="true" />;
}
