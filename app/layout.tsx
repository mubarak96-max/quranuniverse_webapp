import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Inter, Newsreader, Scheherazade_New } from "next/font/google";
import { PalettePicker } from "@/components/PalettePicker";
import { getTheme } from "@/lib/data";
import "./globals.css";

const inter = Inter({ variable: "--font-ui", subsets: ["latin"] });
const newsreader = Newsreader({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"] });
const arabic = Scheherazade_New({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Quran Universe",
  description: "Every verse of the Quran with a card that gives context, perspective and one thing to try.",
};

// Palettes live in content/theme.json so the web and mobile apps share one source of colors.
function themeCss() {
  const { palettes, default: fallback } = getTheme();
  const vars = (p: Record<string, string>) =>
    Object.entries(p)
      .map(([k, v]) => `--${k}:${v}`)
      .join(";");
  const base = `:root{${vars(palettes[fallback])}}`;
  const named = Object.entries(palettes)
    .map(([name, p]) => `:root[data-palette="${name}"]{${vars(p)}}`)
    .join("\n");
  return `${base}\n${named}`;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = getTheme();
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body className={`${inter.variable} ${newsreader.variable} ${arabic.variable}`}>
        <header className="site-header">
          <Link href="/" className="brand">
            <Image src="/brand/logo-mark.svg" alt="" width={30} height={30} priority unoptimized />
            <span>
              Quran <em>Universe</em>
            </span>
          </Link>
          <PalettePicker names={Object.keys(theme.palettes)} fallback={theme.default} />
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
