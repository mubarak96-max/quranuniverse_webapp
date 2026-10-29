import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoxRow } from "@/components/BoxRow";
import { JsonLd } from "@/components/JsonLd";
import { NameVerses } from "@/components/NameVerses";
import { Rich } from "@/components/Rich";
import { getSurah, getTranslation, surahHref } from "@/lib/data";
import {
  getNameBySlug,
  getNameLessons,
  getNamePage,
  getNames,
  nameHref,
  verseRef,
  type AllahName,
  type NamePage as Page,
} from "@/lib/names";
import { SITE, absUrl, breadcrumbs, organization } from "@/lib/site";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getNames().map((n) => ({ slug: n.slug }));
}

const pageTitle = (n: AllahName) => `${n.transliteration} (${n.arabic}) Meaning: ${n.meaning}`;
const pageDescription = (n: AllahName, page?: Page) =>
  page?.intro ?? `${n.transliteration} is name ${n.number} of the 99 Names of Allah. ${n.description}`.slice(0, 300);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const name = getNameBySlug((await params).slug);
  if (!name) return {};
  const title = pageTitle(name);
  const description = pageDescription(name, getNamePage(name.slug));
  const url = nameHref(name);
  return {
    title,
    description,
    keywords: [name.transliteration, `${name.transliteration} meaning`, name.arabic, "99 names of allah", "asma ul husna"],
    alternates: { canonical: url },
    openGraph: { type: "article", title, description, url },
    twitter: { card: "summary", title, description },
  };
}

function nameJsonLd(name: AllahName, page?: Page) {
  const url = absUrl(nameHref(name));
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: pageTitle(name),
      description: pageDescription(name, page),
      url,
      mainEntityOfPage: url,
      dateModified: page?.meta.updated,
      inLanguage: "en",
      isAccessibleForFree: true,
      author: { "@id": organization["@id"] },
      publisher: { "@id": organization["@id"] },
      image: absUrl("/apple-icon.png"),
      isPartOf: { "@id": `${SITE.url}/#website` },
      about: {
        "@type": "DefinedTerm",
        name: name.transliteration,
        alternateName: name.arabic,
        description: name.meaning,
        inDefinedTermSet: { "@type": "DefinedTermSet", name: "The 99 Names of Allah", url: absUrl("/names") },
      },
    },
    breadcrumbs([
      { name: "Home", path: "/" },
      { name: "Names of Allah", path: "/names" },
      { name: name.transliteration, path: nameHref(name) },
    ]),
  ];
  if (page?.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return { "@graph": graph };
}

function Paras({ paras, story }: { paras: string[]; story?: boolean }) {
  return paras.map((p, i) => (
    <p key={i} className={story && i === 0 ? "story" : undefined}>
      <Rich text={p} />
    </p>
  ));
}

export default async function NamePage({ params }: { params: Params }) {
  const name = getNameBySlug((await params).slug);
  if (!name) notFound();

  const page = getNamePage(name.slug);
  const names = getNames();
  const prev = names[name.number - 2];
  const next = names[name.number];
  const t = name.transliteration;

  const verses = name.verses.map((v) => {
    const ayahs = Array.from({ length: (v.to ?? v.ayah) - v.ayah + 1 }, (_, i) => v.ayah + i);
    const surah = getSurah(v.surah)!;
    return {
      ref: verseRef(v),
      surah: surah.transliteration,
      href: surahHref(v.surah, v.ayah),
      arabic: ayahs.map((a) => surah.verses.find((x) => x.id === a)?.text ?? "").join(" "),
      english: ayahs.map((a) => getTranslation(`${v.surah}:${a}`)).join(" "),
    };
  });

  return (
    <article className="paper name-page">
      <JsonLd data={nameJsonLd(name, page)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/names">Names of Allah</Link>
        <span aria-hidden="true">/</span>
        <span>{t}</span>
      </nav>

      <header className="paper-head">
        <p className="kicker">Name {name.number} of 99</p>
        <p className="ar name-ar" lang="ar" dir="rtl">
          {name.arabic}
        </p>
        <h1>{t}</h1>
        <p className="name-meaning">{name.meaning}</p>
        <p className="name-intro">{pageDescription(name, page)}</p>
        {(page || verses.length > 0) && (
          <p className="name-facts">
            {page && (
              <span>
                Root{" "}
                <span className="ar" lang="ar" dir="rtl">
                  {page.root.letters}
                </span>{" "}
                {page.root.sense}
              </span>
            )}
            {verses.length > 0 && <NameVerses name={t} verses={verses} />}
          </p>
        )}
      </header>

      {page ? (
        <>
          <hr className="rule" />
          <h2 className="name-title">{page.title}</h2>
          <p className="name-sub">{page.subtitle}</p>

          <div className="name-figure">
            <p className="lab">{page.picture.label}</p>
            <BoxRow row={page.picture.row} />
          </div>
          <div className="name-figure">
            <p className="lab">{page.key.label}</p>
            <BoxRow row={page.key.row} />
          </div>

          <section>
            <h2>Who He is as {t}</h2>
            <Paras paras={page.knowing} story />
          </section>

          <section>
            <h2>Where you see {t} at work</h2>
            <Paras paras={page.seeing} />
          </section>

          <section>
            <h2>Handing your affairs to Him</h2>
            <Paras paras={page.trusting} />
            <p>
              <Rich text={page.now} />
            </p>
            <p className="old">{page.old}</p>
            <p className="new">{page.new}</p>
          </section>

          <section>
            <h2>Why the heart loves Him for it</h2>
            <Paras paras={page.loving} />
          </section>

          <blockquote className="name-dua">
            <p className="lab">Call on Him</p>
            <p>{page.dua.text}</p>
            <small>{page.dua.note}</small>
          </blockquote>

          <p className="name-try">
            <span className="lab">Try this today</span>
            {page.try}
          </p>

          {page.pairs.length > 0 && (
            <section>
              <h2>Read it with</h2>
              <ul className="name-pairs">
                {page.pairs.map((p) => {
                  const other = getNameBySlug(p.slug)!;
                  return (
                    <li key={p.slug}>
                      <Link href={nameHref(other)}>
                        <b>{other.transliteration}</b>{" "}
                        <span className="ar" lang="ar" dir="rtl">
                          {other.arabic}
                        </span>
                      </Link>
                      <span>{p.why}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="name-faq">
            <h2>Questions about {t}</h2>
            {page.faq.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </section>
        </>
      ) : (
        <section>
          <h2>Meaning</h2>
          <p>{name.description}</p>
        </section>
      )}

      <details className="name-arabic">
        <summary>Explanation in Arabic</summary>
        <p className="ar" lang="ar" dir="rtl">
          {name.meaningAr}
        </p>
      </details>

      {page && (
        <footer className="name-source">
          Drawn from the book Asma al Husna
          {page.lessons.length > 0 && (
            <>
              {" "}
              and Ustadh Hisham Abu Yusuf&rsquo;s lessons:{" "}
              {getNameLessons(page.lessons).map((l, i) => (
                <span key={l.n}>
                  {i > 0 && ", "}
                  <a href={`https://www.youtube.com/watch?v=${l.video}`} rel="noopener" target="_blank">
                    {l.title}
                  </a>
                </span>
              ))}
            </>
          )}
          {page.meta.status !== "approved" && <span className="status"> · {page.meta.status}</span>}
        </footer>
      )}

      <nav className="paper-pager" aria-label="Name navigation">
        {prev ? (
          <Link href={nameHref(prev)}>
            <small>← Previous</small>
            {prev.transliteration}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={nameHref(next)} className="next">
            <small>Next →</small>
            {next.transliteration}
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
