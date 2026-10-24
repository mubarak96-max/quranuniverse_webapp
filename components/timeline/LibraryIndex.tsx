import Link from "next/link";
import { GROUP_LABEL, refHref, type PersonGroup, type TimelineData } from "@/lib/timeline-types";

const GROUPS: PersonGroup[] = ["quran", "unseen", "family", "companion", "hadith", "scholar", "ruler"];

// Plain list of every library entry under the interactive view: crawlable links, and a fallback when scripts fail.
export function LibraryIndex({ data, current }: { data: TimelineData; current?: string }) {
  const cols = [
    ...GROUPS.map((g) => ({
      title: GROUP_LABEL[g],
      items: data.people.filter((p) => p.group === g).map((p) => ({ id: p.id, href: refHref({ t: "person", id: p.id }), name: p.name, sub: p.role })),
    })),
    { title: "Nations of the Quran", items: data.nations.map((n) => ({ id: n.id, href: refHref({ t: "nation", id: n.id }), name: n.name, sub: undefined })) },
    { title: "Empires", items: data.states.map((s) => ({ id: s.id, href: refHref({ t: "polity", id: s.id }), name: s.name, sub: undefined })) },
    { title: "Places", items: data.sites.map((s) => ({ id: s.id, href: refHref({ t: "place", id: s.id }), name: s.name, sub: undefined })) },
  ]
    .filter((c) => c.items.length)
    // An entry page lists only its own shelf, which keeps each of the hundreds of static pages small.
    .filter((c) => !current || c.items.some((i) => i.id === current));
  return (
    <section className="tl-index" aria-labelledby="lb-index-h">
      <h2 id="lb-index-h">Everyone and everything in the timeline</h2>
      <p className="tl-index-note">
        People named in the Quran and the hadith, the Prophet&apos;s ﷺ family and Companions, scholars, rulers, the nations of the
        Quran, the world&apos;s empires and the places where it all happened. Where scholars differ, each entry says so.
      </p>
      <div className="tl-index-cols">
        {cols.map((c) => (
          <div key={c.title}>
            <h3>{c.title}</h3>
            <ul>
              {c.items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} aria-current={i.id === current ? "page" : undefined}>
                    {i.name}
                    {i.sub && <time> · {i.sub}</time>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
