import { StaticPage, staticPageMetadata } from "@/components/StaticPage";

export const metadata = staticPageMetadata("terms");

export default function TermsPage() {
  return <StaticPage slug="terms" />;
}
