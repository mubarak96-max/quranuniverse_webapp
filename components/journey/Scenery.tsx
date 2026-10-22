import type { Piece } from "./sets";

const WHISPERS = ["the tree of eternity", "a kingdom that never decays", "you could become angels", "you would live forever", "I am only advising you"];

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function Tree({ whisper }: { whisper: boolean }) {
  return (
    <>
      <svg className="pc-tree-art" viewBox="0 0 400 420" aria-hidden="true">
        <path className="pc-trunk" d="M182 420 C186 370 184 320 190 268 C176 250 150 240 128 222 L134 214 C156 230 178 240 194 250 C198 226 214 206 246 196 L250 204 C226 214 210 232 206 262 C204 320 210 372 220 420 Z" />
        <g className="pc-canopy">
          <ellipse cx="200" cy="170" rx="150" ry="110" />
          <ellipse cx="110" cy="200" rx="80" ry="62" />
          <ellipse cx="292" cy="196" rx="86" ry="64" />
          <ellipse cx="200" cy="96" rx="104" ry="70" />
        </g>
        <g className="pc-fruit">
          {[
            [140, 170],
            [236, 140],
            [282, 214],
            [184, 222],
            [116, 222],
            [214, 82],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="7" />
          ))}
        </g>
      </svg>
      {whisper && (
        <div className="pc-whispers">
          {WHISPERS.map((w, i) => (
            <span key={w} style={{ "--i": i } as React.CSSProperties}>
              {w}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

// Static scenery behind the text. It remounts with each set, so its entrance animations replay.
export function Scenery({ piece, set }: { piece?: Piece; set: string }) {
  if (!piece) return null;
  let body: React.ReactNode;
  switch (piece) {
    case "vessel":
      body = (
        <>
          <i className="pc-ring" />
          <span className="pc-orbit">
            <b />
          </span>
        </>
      );
      break;
    case "assembly":
      body = range(33).map((i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />);
      break;
    case "bow":
      body = range(13).map((i) => <i key={i} className={i === 9 ? "pc-refuse" : undefined} style={{ "--i": i } as React.CSSProperties} />);
      break;
    case "tree":
      body = <Tree whisper={set === "whisper"} />;
      break;
    case "clouds":
      body = range(5).map((i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />);
      break;
    case "horizon":
      body = (
        <>
          <i className="pc-sun" />
          <svg className="pc-land" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 50 C120 26 240 34 360 46 C480 58 600 22 720 28 C840 34 920 50 1000 42 L1000 200 L0 200 Z" />
            <path className="pc-near" d="M0 110 C160 90 300 100 460 108 C620 116 780 90 1000 100 L1000 200 L0 200 Z" />
          </svg>
        </>
      );
      break;
    case "mountain":
      body = (
        <>
          <i className="pc-sun" />
          <svg className="pc-land" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <path d="M0 80 C200 76 360 78 430 70 C470 42 486 22 500 18 C516 22 534 42 572 70 C650 78 800 76 1000 80 L1000 200 L0 200 Z" />
          </svg>
          <b className="pc-seeker pc-l" />
          <b className="pc-seeker pc-r" />
        </>
      );
      break;
    case "altars":
      body = (
        <>
          <span className="pc-altar pc-taken">
            <i className="pc-smoke" />
            <i className="pc-fire" />
          </span>
          <span className="pc-altar">
            <i className="pc-smoke" />
          </span>
        </>
      );
      break;
    case "dig":
      body = (
        <>
          <i className="pc-ground" />
          {range(6).map((i) => (
            <b key={i} className="pc-dust" style={{ "--i": i } as React.CSSProperties} />
          ))}
        </>
      );
      break;
    case "split":
      body = (
        <>
          <i className="pc-left" />
          <i className="pc-right" />
        </>
      );
      break;
    case "pillars":
      body = range(7).map((i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />);
      break;
    case "river":
      body = (
        <svg className="pc-river-art" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 120 C200 90 380 150 560 118 C740 86 860 130 1000 110 L1000 200 L0 200 Z" />
          <path className="pc-flow" d="M0 140 C200 110 380 170 560 138 C740 106 860 150 1000 130" />
        </svg>
      );
      break;
    case "sea":
      body = (
        <>
          <i className="pc-wall pc-wl" />
          <i className="pc-wall pc-wr" />
        </>
      );
      break;
    case "chasm":
      body = (
        <>
          <i className="pc-earth" />
          <i className="pc-crack" />
          {range(5).map((i) => (
            <b key={i} className="pc-sink" style={{ "--i": i } as React.CSSProperties} />
          ))}
        </>
      );
      break;
    case "birds":
      body = range(16).map((i) => (
        <svg key={i} className="pc-bird" viewBox="0 0 24 10" style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
          <path d="M0 6 C5 0 9 2 12 7 C15 2 19 0 24 6" />
        </svg>
      ));
      break;
    case "minaret":
      body = (
        <svg className="pc-tower" viewBox="0 0 60 300" aria-hidden="true">
          <path d="M30 0 L36 22 L34 24 L34 60 L40 66 L40 72 L36 74 L36 290 L24 290 L24 74 L20 72 L20 66 L26 60 L26 24 L24 22 Z" />
        </svg>
      );
      break;
    case "gate":
      body = (
        <>
          <i className="pc-light" />
          <svg className="pc-arch" viewBox="0 0 200 240" aria-hidden="true">
            <path fillRule="evenodd" d="M0 240 V0 H200 V240 Z M50 240 V110 C50 70 74 46 100 46 C126 46 150 70 150 110 V240 Z" />
          </svg>
        </>
      );
      break;
    default:
      body = <i />;
  }
  return (
    <div className={`jr-piece pc-${piece}`} data-set={set} aria-hidden="true">
      {body}
    </div>
  );
}
