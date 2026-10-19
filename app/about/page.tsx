import { StaticPage, staticPageMetadata } from "@/components/StaticPage";

export const metadata = staticPageMetadata("about");

export default function AboutPage() {
  return <StaticPage slug="about" type="AboutPage" />;
}
