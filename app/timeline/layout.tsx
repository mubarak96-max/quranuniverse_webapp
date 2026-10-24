import "maplibre-gl/dist/maplibre-gl.css";
import "./timeline.css";
import "./atlas.css";
import "./panels.css";
import "./villains.css";
import "./library.css";
import "./stage.css";
import "./cards.css";

// Timeline styles load only on timeline pages.
export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
