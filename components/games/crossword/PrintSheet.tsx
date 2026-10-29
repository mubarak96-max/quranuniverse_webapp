import { cellKey, clueOrder, solutionOf, type Puzzle } from "./grid";

// A plain black-and-white copy of a grid and its clues, shown only when printing.
export function PrintSheet({ puzzle, title, answers }: { puzzle: Puzzle; title: string; answers: boolean }) {
  const solution = solutionOf(puzzle);
  const numbers = new Map(puzzle.words.map((w) => [cellKey(w.r, w.c), w.n]));
  const order = clueOrder(puzzle);
  return (
    <section className="cw-print-sheet" aria-hidden="true">
      <h2>{title}{answers ? " · Answers" : ""}</h2>
      <div className="cw-print-grid" style={{ gridTemplateColumns: `repeat(${puzzle.w}, 1fr)` }}>
        {Array.from({ length: puzzle.h * puzzle.w }, (_, i) => {
          const key = cellKey(Math.floor(i / puzzle.w), i % puzzle.w);
          if (!solution.has(key)) return <span key={key} className="is-block" />;
          return (
            <span key={key}>
              {numbers.has(key) && <small>{numbers.get(key)}</small>}
              {answers && <b>{solution.get(key)}</b>}
            </span>
          );
        })}
      </div>
      <div className="cw-print-clues">
        {(["a", "d"] as const).map((d) => (
          <div key={d}>
            <h3>{d === "a" ? "Across" : "Down"}</h3>
            <ol>
              {order
                .filter((w) => w.d === d)
                .map((w) => (
                  <li key={w.n}>
                    <b>{w.n}</b> {w.clue} ({w.len})
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
