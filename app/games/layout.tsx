import "./games.css";
import "./stage.css";
import "./map.css";

// Games styles load only on the games pages; each game adds its own stylesheet.
export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
