// The share image for timeline moments and years: a parchment card with a big year and a small globe. Rendered by
// next/og, so layout is flexbox only and every element with children needs display: flex.

export const OG_SIZE = { width: 1200, height: 630 };

const INK = "#2b2117";
const GOLD = "#a87a26";
const MUTED = "#76664f";

type Props = { year?: string; era?: string; ah?: string; eyebrow: string; title: string; lines: string[]; place?: string };

export function OgCard({ year, era, ah, eyebrow, title, lines, place }: Props) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: "56px 64px",
        background: "radial-gradient(120% 100% at 20% 0%, #f8f1e0 0%, #ece2cc 60%, #dccdab 100%)",
        color: INK,
        fontFamily: "serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 40 }}>
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: GOLD }}>{eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {year && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <span style={{ fontSize: 150, lineHeight: 1, letterSpacing: -6 }}>{year}</span>
              {era && <span style={{ fontSize: 40, color: MUTED }}>{era}</span>}
            </div>
          )}
          {ah && <div style={{ display: "flex", fontSize: 34, color: GOLD, marginTop: 4 }}>{ah}</div>}
          <div style={{ display: "flex", fontSize: 52, lineHeight: 1.1, marginTop: 16, maxWidth: 700 }}>{title}</div>
          {lines.map((l) => (
            <div key={l} style={{ display: "flex", fontSize: 25, lineHeight: 1.35, color: MUTED, marginTop: 8, maxWidth: 700 }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: MUTED }}>Quran Universe · Islamic History Timeline</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 330 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 300,
            height: 300,
            borderRadius: 150,
            background: "radial-gradient(circle at 35% 30%, #c9d3cf 0%, #8fa6ad 45%, #4f6670 100%)",
            boxShadow: `0 0 0 6px #f8f1e0, 0 0 0 8px ${GOLD}, 0 30px 60px -20px rgba(58,38,16,0.55)`,
          }}
        >
          <div style={{ display: "flex", width: 34, height: 34, borderRadius: 17, background: "#a5352a", boxShadow: "0 0 0 6px rgba(248,241,224,0.9), 0 0 0 18px rgba(165,53,42,0.25)" }} />
        </div>
        {place && <div style={{ display: "flex", marginTop: 34, fontSize: 26, color: INK, textAlign: "center", maxWidth: 320 }}>{place}</div>}
      </div>
    </div>
  );
}
