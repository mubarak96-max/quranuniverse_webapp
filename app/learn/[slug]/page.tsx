import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getArticle, getArticles, relatedArticles, type Article } from "@/lib/articles";
import { SITE, absUrl, breadcrumbs, organization } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  const url = `/learn/${a.slug}`;
  return {
    title: a.title,
    description: a.description,
    keywords: a.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: a.title,
      description: a.description,
      url,
      siteName: SITE.name,
      publishedTime: a.published,
      modifiedTime: a.updated,
      section: a.category,
      tags: a.keywords,
    },
    twitter: { card: "summary", title: a.title, description: a.description },
  };
}

function articleJsonLd(a: Article) {
  const url = absUrl(`/learn/${a.slug}`);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: a.title,
      description: a.description,
      url,
      mainEntityOfPage: url,
      datePublished: a.published,
      dateModified: a.updated,
      inLanguage: "en",
      articleSection: a.category,
      keywords: a.keywords.join(", "),
      wordCount: a.words,
      isAccessibleForFree: true,
      author: { "@id": organization["@id"] },
      publisher: { "@id": organization["@id"] },
      image: absUrl("/apple-icon.png"),
      about: [{ "@type": "Thing", name: "Quran" }, { "@type": "Thing", name: "Islam" }],
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: "Learn", path: "/learn" },
      { name: a.title, path: `/learn/${a.slug}` },
    ]),
  ];
  if (a.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: a.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return { "@graph": graph };
}

const date = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function ArticlePage({ params }: { params: Params }) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const toc = a.headings.filter((h) => h.level === 2);
  const related = relatedArticles(a);

  return (
    <article className="article-page">
      <JsonLd data={articleJsonLd(a)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/learn">Learn</Link>
        <span aria-hidden="true">/</span>
        <span>{a.category}</span>
      </nav>
      <header className="article-head">
        <h1>{a.title}</h1>
        <p className="lede">{a.description}</p>
        <p className="byline">
          By the {SITE.name} team · Updated <time dateTime={a.updated}>{date(a.updated)}</time> ·{" "}
          {Math.max(1, Math.round(a.words / 220))} min read
        </p>
      </header>

      {toc.length > 2 && (
        <details className="drawer toc" open>
          <summary>On this page</summary>
          <ol>
            {toc.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ol>
        </details>
      )}

      <div className="article-body" dangerouslySetInnerHTML={{ __html: a.html }} />

      <aside className="article-cta">
        <h2>Read it in the Quran</h2>
        <p>
          Every verse on Quran Universe has the Arabic, the Sahih International translation, a word-by-word breakdown,
          a plain-English card and the full Tafsir Ibn Kathir.
        </p>
        <Link href="/" className="text-link">
          Browse all 114 surahs <span aria-hidden="true">→</span>
        </Link>
      </aside>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related-title">
          <h2 id="related-title">Keep reading</h2>
          <ul className="article-grid">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/learn/${r.slug}`} className="article-tile">
                  <b>{r.title}</b>
                  <small>{r.description}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
