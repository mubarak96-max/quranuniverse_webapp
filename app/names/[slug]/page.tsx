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
    <div className="verse-page name-page">
      <JsonLd data={nameJsonLd(name, page)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/names">Names of Allah</Link>
        <span aria-hidden="true">/</span>
        <span>{t}</span>
      </nav>

      <section className="verse-block name-hero">
        <span className="vkey">Name {name.number} of 99</span>
        <p className="ar name-ar" lang="ar" dir="rtl">
          {name.arabic}
        </p>
        <h1 className="translit name-translit">
          {t} <span>· {name.meaning}</span>
        </h1>
        <p className="name-intro">{pageDescription(name, page)}</p>
        <div className="name-meta">
          {page && (
            <p className="name-root">
              <span className="lab">Root</span>
              <span className="ar" lang="ar" dir="rtl">
                {page.root.letters}
              </span>
              <span>{page.root.sense}</span>
            </p>
          )}
          {verses.length > 0 && <NameVerses name={t} verses={verses} />}
        </div>
      </section>

      {page ? (
        <article className="card name-card">
          <div className="card-top">
            <span className="eyebrow">
              {t} · {name.arabic}
            </span>
            <span className="pill">Name {name.number}</span>
          </div>
          <h2 className="card-title">{page.title}</h2>
          <p className="card-sub">{page.subtitle}</p>
          <hr />

          <div className="dia">
            <div className="lab">{page.picture.label}</div>
            <BoxRow row={page.picture.row} />
          </div>
          <div className="dia">
            <div className="lab">{page.key.label}</div>
            <BoxRow row={page.key.row} />
          </div>

          <section className="name-part">
            <h2>Who He is as {t}</h2>
            <div className="text">
              <Paras paras={page.knowing} story />
            </div>
          </section>

          <section className="name-part">
            <h2>Where you see {t} at work</h2>
            <div className="text">
              <Paras paras={page.seeing} />
            </div>
          </section>

          <section className="name-part">
            <h2>Handing your affairs to Him</h2>
            <div className="text">
              <Paras paras={page.trusting} />
              <p className="story">
                <Rich text={page.now} />
              </p>
              <div className="shift">
                <p className="old">{page.old}</p>
                <p className="new">{page.new}</p>
              </div>
            </div>
          </section>

          <section className="name-part">
            <h2>Why the heart loves Him for it</h2>
            <div className="text">
              <Paras paras={page.loving} />
            </div>
          </section>

          <div className="name-dua">
            <div className="lab">Call on Him</div>
            <p>{page.dua.text}</p>
            <small>{page.dua.note}</small>
          </div>

          <div className="try">
            <div className="lab">Try this today</div>
            <p>{page.try}</p>
          </div>

          {page.pairs.length > 0 && (
            <div className="name-pairs">
              <div className="lab">Read it with</div>
              <ul>
                {page.pairs.map((p) => {
                  const other = getNameBySlug(p.slug)!;
                  return (
                    <li key={p.slug}>
                      <Link href={nameHref(other)}>
                        <span className="ar" lang="ar" dir="rtl">
                          {other.arabic}
                        </span>
                        <b>{other.transliteration}</b>
                        <small>{p.why}</small>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="card-foot">
            <span>
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
            </span>
            {page.meta.status !== "approved" && <span className="status">{page.meta.status}</span>}
          </div>
        </article>
      ) : (
        <section className="name-part">
          <h2>Meaning</h2>
          <p>{name.description}</p>
        </section>
      )}

      {page && (
        <section className="name-faq">
          <h2>Questions about {t}</h2>
          {page.faq.map((f) => (
            <details key={f.q} className="drawer">
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
      )}

      <details className="drawer">
        <summary>Explanation in Arabic</summary>
        <p className="ar name-ar-text" lang="ar" dir="rtl">
          {name.meaningAr}
        </p>
      </details>

      <nav className="pager" aria-label="Name navigation">
        {prev ? (
          <Link href={nameHref(prev)} className="prev">
            <small>← Previous</small>
            <b>{prev.transliteration}</b>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={nameHref(next)} className="next">
            <small>Next →</small>
            <b>{next.transliteration}</b>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
