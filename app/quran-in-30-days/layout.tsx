import type { Metadata } from "next";
import "./q30.css";
import "./pages.css";
import "./visuals.css";
import "./guide.css";

// The manifest is scoped to this section, so "Add to home screen" installs the course, not the whole site.
export const metadata: Metadata = { manifest: "/q30.webmanifest" };

export default function Q30Layout({ children }: { children: React.ReactNode }) {
  return children;
}
