import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getPage } from "@/lib/articles";
import { SITE, absUrl, breadcrumbs } from "@/lib/site";

// About, contact and legal pages: markdown in content/pages/<slug>.md, one thin route file each.
export function staticPageMetadata(slug: string): Metadata {
  const p = getPage(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/${slug}` },
    openGraph: { type: "website", title: p.title, description: p.description, url: `/${slug}`, siteName: SITE.name },
  };
}

export function StaticPage({ slug, type = "WebPage" }: { slug: string; type?: string }) {
  const p = getPage(slug);
  if (!p) notFound();
  return (
    <article className="article-page static-page">
      <JsonLd
        data={{
          "@type": type,
          name: p.title,
          description: p.description,
          url: absUrl(`/${slug}`),
          dateModified: p.updated,
          isPartOf: { "@id": `${SITE.url}/#website` },
          breadcrumb: breadcrumbs([
            { name: "Home", path: "/" },
            { name: p.title, path: `/${slug}` },
          ]),
        }}
      />
      <header className="article-head">
        <h1>{p.title}</h1>
        <p className="byline">
          Last updated <time dateTime={p.updated}>{p.updated}</time>
        </p>
      </header>
      <div className="article-body" dangerouslySetInnerHTML={{ __html: p.html }} />
    </article>
  );
}
