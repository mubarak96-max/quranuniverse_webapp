// Draws a verse as a square-ish share image (made for WhatsApp and Instagram) entirely in the browser.
// Fonts are read from the page, so the image uses the same Arabic and display faces the reader sees.

const W = 1080;
const PAD = 96;
const MAX_H = 1350; // 4:5, the tallest shape Instagram shows uncropped; longer verses grow past it
const COLORS = { bg: "#f6f5ef", page: "#fffef9", fg: "#233735", muted: "#62716b", idea: "#22665e", gold: "#b49661" };

type Input = { arabic: string; english: string; eyebrow: string; site: string };

function fontOf(selector: string, fallback: string) {
  const el = document.querySelector(selector);
  return el ? getComputedStyle(el).fontFamily : fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export async function drawVerseImage({ arabic, english, eyebrow, site }: Input): Promise<Blob> {
  const arFont = fontOf(".verse-ar", "serif");
  const enFont = fontOf(".verse-en", "Georgia, serif");
  const uiFont = getComputedStyle(document.body).fontFamily;
  await Promise.all([document.fonts.load(`48px ${arFont}`, arabic), document.fonts.load(`32px ${enFont}`, english)]).catch(() => {});

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const inner = W - PAD * 2;

  // Shrink the text until the layout fits 4:5; past the smallest sizes the canvas grows instead.
  let ar = 64;
  let en = 38;
  let layout: { arLines: string[]; enLines: string[]; arLh: number; enLh: number; h: number };
  for (;;) {
    ctx.font = `${ar}px ${arFont}`;
    ctx.direction = "rtl";
    const arLines = wrap(ctx, arabic, inner);
    ctx.font = `${en}px ${enFont}`;
    ctx.direction = "ltr";
    const enLines = wrap(ctx, english, inner);
    const arLh = ar * 1.9;
    const enLh = en * 1.45;
    const h = PAD + 60 + 70 + arLines.length * arLh + 60 + enLines.length * enLh + 90 + PAD;
    layout = { arLines, enLines, arLh, enLh, h };
    if (h <= MAX_H || (ar <= 34 && en <= 24)) break;
    ar = Math.max(34, ar - 4);
    en = Math.max(24, en - 2);
  }

  const H = Math.max(1080, Math.ceil(layout.h));
  canvas.width = W;
  canvas.height = H;

  // Background, card and a thin gold frame.
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.page;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 40, W - 80, H - 80, 28);
  ctx.fill();
  ctx.stroke();

  // Center the block vertically when the image is taller than its content.
  let y = PAD + (H - layout.h) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = COLORS.gold;
  ctx.font = `600 26px ${uiFont}`;
  ctx.direction = "ltr";
  ctx.fillText(eyebrow.toUpperCase(), W / 2, y + 30);
  y += 60;
  ctx.strokeStyle = COLORS.gold;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 40, y + 20);
  ctx.lineTo(W / 2 + 40, y + 20);
  ctx.stroke();
  y += 70;

  ctx.fillStyle = COLORS.idea;
  ctx.font = `${ar}px ${arFont}`;
  ctx.direction = "rtl";
  for (const line of layout.arLines) {
    ctx.fillText(line, W / 2, y + layout.arLh / 2);
    y += layout.arLh;
  }
  y += 60;

  ctx.fillStyle = COLORS.fg;
  ctx.font = `${en}px ${enFont}`;
  ctx.direction = "ltr";
  for (const line of layout.enLines) {
    ctx.fillText(line, W / 2, y + layout.enLh / 2);
    y += layout.enLh;
  }

  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 24px ${uiFont}`;
  ctx.fillText(`Quran Universe · ${site}`, W / 2, H - 40 - 52);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
}
