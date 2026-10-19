import { StaticPage, staticPageMetadata } from "@/components/StaticPage";

export const metadata = staticPageMetadata("disclaimer");

export default function DisclaimerPage() {
  return <StaticPage slug="disclaimer" />;
}
