import { StaticPage, staticPageMetadata } from "@/components/StaticPage";

export const metadata = staticPageMetadata("contact");

export default function ContactPage() {
  return <StaticPage slug="contact" type="ContactPage" />;
}
