import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORIES, getArticles } from "@/lib/articles";
import { slugify } from "@/lib/markdown";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

const title = "Learn About the Quran and Islam: Clear Guides for Everyone";
const description =
  "Plain-English guides to the Quran and Islam: what the Quran is, how to read it, the five pillars, Jesus in the Quran, Ayat al-Kursi, Surah Yasin and more.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/learn" },
  openGraph: { type: "website", title, description, url: "/learn", siteName: SITE.name },
};

export default function LearnIndex() {
  const articles = getArticles();
  return (
    <div className="learn">
      <JsonLd
        data={{
          "@type": "CollectionPage",
          name: title,
          description,
          url: absUrl("/learn"),
          isPartOf: { "@id": `${SITE.url}/#website` },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: "Learn", path: "/learn" },
          ]),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: articles.map((a, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: absUrl(`/learn/${a.slug}`),
              name: a.title,
            })),
          },
        }}
      />
      <header className="page-head">
        <p className="eyebrow">Learn</p>
        <h1>Understand the Quran and Islam</h1>
        <p className="lede">
          Short, clear guides for Muslims who want to understand what they recite and for anyone exploring Islam for
          the first time. Every guide links straight to the verses it discusses.
        </p>
      </header>
      {CATEGORIES.map((cat) => {
        const list = articles.filter((a) => a.category === cat);
        if (list.length === 0) return null;
        return (
          <section key={cat} className="learn-group" aria-labelledby={slugify(cat)}>
            <h2 id={slugify(cat)}>{cat}</h2>
            <ul className="article-grid">
              {list.map((a) => (
                <li key={a.slug}>
                  <Link href={`/learn/${a.slug}`} className="article-tile">
                    <b>{a.title}</b>
                    <small>{a.description}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
