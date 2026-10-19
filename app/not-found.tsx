import Link from "next/link";

export default function NotFound() {
  return (
    <section className="lost">
      <h1>Page not found</h1>
      <p>That surah or verse doesn&rsquo;t exist. Pick one from the index.</p>
      <Link href="/">Browse surahs</Link>
    </section>
  );
}
