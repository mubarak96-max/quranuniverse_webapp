import { ImageResponse } from "next/og";
import { getTimeline, getVillain } from "@/lib/timeline";

export const alt = "Villains of Islamic History";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getTimeline().villains.map((v) => ({ id: v.id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const v = getVillain((await params).id)!;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #120708 0%, #2a0e0c 55%, #4a1a12 100%)",
          color: "#f4efe4",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#e2836b" }}>
          Villains of Islamic History · {v.when}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, lineHeight: 1.05 }}>{v.name}</div>
          <div style={{ fontSize: 38, marginTop: 12, color: "#d9c9b0" }}>{v.title}</div>
        </div>
        {v.relied && v.undone ? (
          <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 470 }}>
              <span style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: "#a89a86" }}>Relied on</span>
              <span>{v.relied}</span>
            </div>
            <span style={{ fontSize: 44, color: "#e2836b" }}>→</span>
            <div style={{ display: "flex", flexDirection: "column", maxWidth: 470 }}>
              <span style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: "#a89a86" }}>Undone by</span>
              <span style={{ color: "#ffb39c" }}>{v.undone}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 30, color: "#d9c9b0", maxWidth: 1000 }}>{v.lesson}</div>
        )}
      </div>
    ),
    size,
  );
}
