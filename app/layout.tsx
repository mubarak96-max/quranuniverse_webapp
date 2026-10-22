import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Script from "next/script";
import { Geist, Newsreader, Scheherazade_New } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { ThemeToggle, themeScript } from "@/components/ThemeToggle";
import { getTheme } from "@/lib/data";
import { SITE, organization } from "@/lib/site";
import "./globals.css";
import "./card.css";
import "./content.css";
import "./home.css";

const geist = Geist({ variable: "--font-ui", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
const arabic = Scheherazade_New({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Quran Universe · Read and Understand the Quran in English",
    template: "%s | Quran Universe",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "quran",
    "quran online",
    "quran in english",
    "quran translation",
    "quran with tafsir",
    "tafsir ibn kathir",
    "understand the quran",
    "surah",
    "islam for beginners",
  ],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: SITE.name, locale: "en_US", url: "/" },
  twitter: { card: "summary" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  verification: { google: "DPfuvFbxN91o3jOkC7wh6PhPL0upqnkspZ9lCPe0kns" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: getTheme().palettes.light.bg },
    { media: "(prefers-color-scheme: dark)", color: getTheme().palettes.dark.bg },
  ],
};

// Palettes live in content/theme.json so the web and mobile apps share one source of colors.
// The media query is the no-JS fallback; themeScript sets data-theme before paint otherwise.
function themeCss() {
  const { light, dark } = getTheme().palettes;
  const vars = (p: Record<string, string>) =>
    Object.entries(p)
      .map(([k, v]) => `--${k}:${v}`)
      .join(";");
  return [
    `:root{${vars(light)};color-scheme:light}`,
    `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){${vars(dark)};color-scheme:dark}}`,
    `:root[data-theme="dark"]{${vars(dark)};color-scheme:dark}`,
  ].join("\n");
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body className={`${geist.variable} ${newsreader.variable} ${arabic.variable}`}>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <header className="site-header">
          <div className="bar">
            <Link href="/" className="brand" aria-label="Quran Universe home">
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG; two variants swap by theme */}
              <img src="/brand/logo-mark.svg" alt="" width={34} height={34} className="logo logo-light" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo-mark-white.svg" alt="" width={34} height={34} className="logo logo-dark" />
              <span>
                Quran <em>Universe</em>
              </span>
            </Link>
            <nav className="nav">
              <Link href="/">Surahs</Link>
              <Link href="/learn">Learn</Link>
              <Link href="/timeline">Timeline</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="main" className="site-main">
          {children}
        </main>
        <footer className="site-footer">
          <nav className="footer-nav" aria-label="Footer">
            <Link href="/learn">Learn</Link>
            <Link href="/timeline">Timeline</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </nav>
          <p>
            Cards are simplified reflections. For scholarship, read the tafsir of Ibn Kathir included on every verse.
          </p>
          <p className="fine">Quran Universe · English translation: Sahih International</p>
        </footer>
        <JsonLd
          data={{
            "@graph": [
              organization,
              {
                "@type": "WebSite",
                "@id": `${SITE.url}/#website`,
                name: SITE.name,
                url: SITE.url,
                description: SITE.description,
                inLanguage: "en",
                publisher: { "@id": organization["@id"] },
              },
            ],
          }}
        />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-H760ZN0QXF" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-H760ZN0QXF');`}
        </Script>
      </body>
    </html>
  );
}
