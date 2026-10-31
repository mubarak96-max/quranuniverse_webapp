import type { Metadata } from "next";
import "./reader.css";
import "./content.css";
import "./journey.css";

// The manifest is scoped to this section, so "Add to home screen" installs the course, not the whole site.
export const metadata: Metadata = { manifest: "/q30.webmanifest" };

export default function Q30Layout({ children }: { children: React.ReactNode }) {
  return children;
}
