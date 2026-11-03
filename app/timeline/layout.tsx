import "maplibre-gl/dist/maplibre-gl.css";
import "./atlas.css";
import "./entry.css";
import "./entry-modules.css";

// Timeline styles load only on timeline pages.
export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
