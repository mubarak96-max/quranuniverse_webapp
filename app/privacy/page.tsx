import { StaticPage, staticPageMetadata } from "@/components/StaticPage";

export const metadata = staticPageMetadata("privacy");

export default function PrivacyPage() {
  return <StaticPage slug="privacy" />;
}
