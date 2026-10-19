import Link from "next/link";
import { getSurahs } from "@/lib/data";

export default function Home() {
  const surahs = getSurahs();
  return (
    <>
      <section className="intro">
        <h1>Every verse, made easy to understand</h1>
        <p>
          Each verse has a card with the setting it came down in, where it shows up in your life today, and one small
          thing to try.
        </p>
      </section>
      <ol className="surah-grid">
        {surahs.map((s) => (
          <li key={s.id}>
            <Link href={`/surah/${s.id}`} className="surah-tile">
              <span className="num">{s.id}</span>
              <span className="names">
                <b>{s.transliteration}</b>
                <small>
                  {s.type === "meccan" ? "Makkah" : "Madinah"} · {s.total_verses} verses
                </small>
              </span>
              <span className="ar" lang="ar" dir="rtl">
                {s.name}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
