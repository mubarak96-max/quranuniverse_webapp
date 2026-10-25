import Link from "next/link";
import { CERTAINTY, refHref, type Stop } from "@/lib/timeline-types";
import type { TimelineEntry } from "@/lib/timeline-entry";

export function TimelineArticle({ card, previous, next, stop }: { card: TimelineEntry; previous?: Stop; next?: Stop; stop?: Stop }) {
  const back = card.year !== undefined ? `/timeline#explore=${card.year}` : "/timeline";
  const sections = [
    ["How it connects to Islam", card.tie],
    ["What happened next", card.end],
    ["Historical context", card.archaeology],
    ["Legacy", card.legacy],
    ["The lesson", card.lesson],
  ];
  return (
    <article className="tr-article">
      <nav className="tr-breadcrumb" aria-label="Breadcrumb"><Link href={back}>← Back to the timeline</Link><span>{card.kind}</span></nav>
      <header className="tr-header">
        <p className="tr-kind">{card.kind}</p>
        <h1>{card.name}</h1>
        {card.arabic && <p className="tr-arabic" lang="ar" dir="rtl">{card.arabic}</p>}
        {card.role && <p className="tr-role">{card.role}</p>}
        <div className="tr-meta">
          {card.when && <span>{card.when}</span>}
          {card.place && <span>{card.place.name}</span>}
          {card.precision && card.precision !== "exact" && <span>{CERTAINTY[card.precision]}</span>}
        </div>
      </header>
      <div className="tr-body">
        {card.line && <p className="tr-lede">{card.line}</p>}
        {card.story && <p>{card.story}</p>}
        {card.sections?.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        {sections.map(([title, text]) => text && <section key={title}><h2>{title}</h2><p>{text}</p></section>)}
        {card.quote?.text && <blockquote><p>{card.quote.text}</p><cite><Link href={card.quote.href}>Quran {card.quote.ref}</Link></cite></blockquote>}
        {card.verses.length > 0 && <section><h2>In the Quran</h2><div className="tr-links">{card.verses.map((verse) => <Link href={verse.href} key={verse.ref}>Quran {verse.ref}</Link>)}</div></section>}
        {card.hadith.length > 0 && <section><h2>Hadith references</h2><ul className="tr-references">{card.hadith.map((hadith) => <li key={hadith.url}><a href={hadith.url} target="_blank" rel="noreferrer">{hadith.label} ↗</a></li>)}</ul></section>}
        {stop?.who && stop.who.some((person) => !person.ref) && <section><h2>Also in this story</h2><p>{stop.who.filter((person) => !person.ref).map((person) => person.name).join(", ")}</p></section>}
        {(stop?.article || stop?.journey) && <div className="tr-links">
          {stop.article && <Link href={`/learn/${stop.article}`}>Read the guide</Link>}
          {stop.journey && <Link href={`/timeline/journey/${stop.journey}`}>Follow the illustrated story</Link>}
        </div>}
        {card.journey && <div className="tr-links"><Link href={`/timeline/journey/${card.journey}`}>Follow the illustrated story</Link></div>}
        {card.note && <aside className="tr-note"><h2>A note on the sources</h2><p>{card.note}</p></aside>}
        {(card.source || card.wiki) && <footer className="tr-source">
          {card.source && <p>Source: {card.source === "quran" ? "The Quran" : card.source}</p>}
          {card.wiki && <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(card.wiki.replace(/ /g, "_"))}`} target="_blank" rel="noreferrer">Further reading on Wikipedia ↗</a>}
        </footer>}
        {card.groups.map((group) => <section className="tr-related" key={group.q}>
          <h2>{group.q}</h2>
          <ul>{group.items.map((item) => <li key={`${item.ref.t}:${item.ref.id}`}><Link href={refHref(item.ref)}><span>{item.name}{item.sub && <small>{item.sub}</small>}</span><span aria-hidden="true">→</span></Link></li>)}</ul>
        </section>)}
      </div>
      {(previous || next) && <nav className="tr-pagination" aria-label="Continue reading">
        {previous ? <Link href={`/timeline/${previous.id}`}><small>Previous</small>{previous.title}</Link> : <span />}
        {next && <Link href={`/timeline/${next.id}`}><small>Next</small>{next.title}</Link>}
      </nav>}
    </article>
  );
}
