import type { ReactNode } from "react";

const TAG = /\{(idea|trap|reward)\}([\s\S]*?)\{\/\1\}/g;

// Card text marks key phrases with {idea}..{/idea}, {trap}..{/trap}, {reward}..{/reward}.
export function Rich({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TAG)) {
    const start = m.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    out.push(
      <span key={start} className={`hl hl-${m[1]}`}>
        {m[2]}
      </span>,
    );
    last = start + m[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
