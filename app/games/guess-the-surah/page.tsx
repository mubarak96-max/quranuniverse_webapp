import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { GameFaq, MoreGames, gameJsonLd, type Faq } from "@/components/games/GamePage";
import { GuessTheSurah, type SurahPick } from "@/components/games/GuessTheSurah";
import { getSurahs, surahHref } from "@/lib/data";
import { GAMES, gameHref } from "@/lib/games";
import { SITE } from "@/lib/site";
import { surahMeaning } from "@/lib/surah-meta";
import "./guess.css";

const game = GAMES.find((g) => g.slug === "guess-the-surah")!;
const title = "Guess the Surah: A Quran Quiz Game With Levels and a Daily Verse";

export const metadata: Metadata = {
  title,
  description: game.description,
  keywords: game.keywords,
  alternates: { canonical: gameHref(game) },
  openGraph: { type: "website", title, description: game.description, url: gameHref(game), siteName: SITE.name },
  twitter: { card: "summary", title, description: game.description },
};

export default function GuessTheSurahPage() {
  const surahs = getSurahs();
  const picks: SurahPick[] = surahs.map((s) => ({
    id: s.id,
    name: s.name,
    transliteration: s.transliteration,
    meaning: surahMeaning(s.id),
    place: s.type === "meccan" ? "Makkah" : "Madinah",
    verses: s.total_verses,
    href: surahHref(s.id),
  }));
  const makkan = surahs.filter((s) => s.type === "meccan").length;
  const verses = surahs.reduce((n, s) => n + s.total_verses, 0);
  const longest = surahs.reduce((a, b) => (b.total_verses > a.total_verses ? b : a));
  const shortest = surahs.reduce((a, b) => (b.total_verses < a.total_verses ? b : a));

  const faq: Faq[] = [
    {
      q: "What is Guess the Surah?",
      a: "Guess the Surah is a free Quran quiz game. You read a verse in Arabic with its English meaning and name the surah it comes from. The journey has 60 levels in six chapters, from Juz Amma and Al-Fatihah to the whole Quran, and there is also one daily verse that everyone plays with six guesses.",
    },
    {
      q: "How many surahs are in the Quran?",
      a: `The Quran has 114 surahs and ${verses.toLocaleString("en")} verses. ${makkan} surahs are Makkan, revealed before the Hijrah, and ${114 - makkan} are Madinan. The longest is ${longest.transliteration} with ${longest.total_verses} verses and the shortest is ${shortest.transliteration} with ${shortest.total_verses}.`,
    },
    {
      q: "When does a new puzzle start?",
      a: "A new verse unlocks every day at midnight in your own time zone. Everyone who plays on the same date gets the same verse, so you can compare results with friends.",
    },
    {
      q: "Can I play more than once a day?",
      a: "Yes. The daily verse is one puzzle a day, but the journey levels can be played and replayed at any time. After the daily verse you can also practise with random verses; practice does not change your daily result.",
    },
    {
      q: "Which English translation does the game use?",
      a: "Every verse is shown in the original Arabic with the Sahih International translation under it. In the last chapters the translation becomes a hint you can open. Every answer links to the full verse with Tafsir Ibn Kathir.",
    },
    {
      q: "Is it respectful to play a game with the Quran?",
      a: "The game is a way to learn the Quran better. The verse is always shown complete and unaltered, nothing in the game makes fun of it, and every round ends with a link to read the verse in context with its tafsir.",
    },
  ];

  return (
    <div className="game-page">
      <JsonLd data={gameJsonLd(game, faq)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/games">Games</Link>
        <span aria-hidden="true">/</span>
        <span>{game.name}</span>
      </nav>
      <header className="game-head">
        <h1>Guess the Surah</h1>
        <p className="lede">
          Read the ayah, open a hint if you need one, and name its surah. Start with the short surahs you pray with and
          climb to the whole Quran. A new daily verse unlocks every day.
        </p>
      </header>

      <GuessTheSurah surahs={picks} />

      <section className="game-section" aria-labelledby="how-title">
        <h2 id="how-title">How to play</h2>
        <ol className="game-steps">
          <li>Read the verse in Arabic, with its English meaning underneath, and decide which surah it comes from.</li>
          <li>
            In the first levels you choose from a few surah cards. From level 21 you type any of the 114 names, with
            suggestions as you type.
          </li>
          <li>
            Stuck? Open a hint: where it was revealed, its juz, the length of the surah, the meaning of its name, its first
            letter, and finally the verse before or after it. Each hint costs a few points.
          </li>
          <li>
            A wrong guess tells you how close you are and whether the answer comes earlier or later in the Quran.
          </li>
          <li>
            Each level has three to five verses. Score well for three stars; every surah you name joins your collection of
            114. Levels get harder as you go: more choices, fewer free hints, less famous verses and, at the end, no
            translation.
          </li>
          <li>The daily verse gives everyone the same ayah, six guesses and a new hint after each miss.</li>
        </ol>
      </section>

      <section className="game-section" aria-labelledby="tips-title">
        <h2 id="tips-title">Tips for guessing which surah a verse is from</h2>
        <p>
          <b>Read the style first.</b> Makkan verses tend to be short and rhythmic, and speak about the oneness of Allah,
          the Day of Judgment and the stories of earlier prophets. Madinan verses are often longer and deal with law,
          family, fasting, war and the hypocrites, and they often address &ldquo;O you who have believed.&rdquo;
        </p>
        <p>
          <b>Listen for refrains.</b> Some surahs repeat one line. &ldquo;So which of the favors of your Lord would you
          deny?&rdquo; appears 31 times in <Link href={surahHref(55)}>Ar-Rahman</Link>. &ldquo;Woe, that Day, to the
          deniers&rdquo; repeats through <Link href={surahHref(77)}>Al-Mursalat</Link>, and &ldquo;Indeed in that is a
          sign, but most of them were not to be believers&rdquo; closes each story in{" "}
          <Link href={surahHref(26)}>Ash-Shu&rsquo;ara</Link>.
        </p>
        <p>
          <b>Use the order of the Quran.</b> Long Madinan surahs come first and the short Makkan ones gather at the end
          in Juz Amma. Start in the middle with a guess around 50 to 60, then follow the arrows.
        </p>
        <p>
          <b>Names and stories narrow it down.</b> A verse about Yusuf and his brothers points to{" "}
          <Link href={surahHref(12)}>Surah Yusuf</Link>, the sleepers in the cave to{" "}
          <Link href={surahHref(18)}>Al-Kahf</Link>, and Maryam and the birth of Isa to{" "}
          <Link href={surahHref(19)}>Surah Maryam</Link>.
        </p>
      </section>

      <section className="game-section" aria-labelledby="facts-title">
        <h2 id="facts-title">The Quran in numbers</h2>
        <dl className="game-facts">
          <div><dt>Surahs</dt><dd>114</dd></div>
          <div><dt>Verses</dt><dd>{verses.toLocaleString("en")}</dd></div>
          <div><dt>Makkan surahs</dt><dd>{makkan}</dd></div>
          <div><dt>Madinan surahs</dt><dd>{114 - makkan}</dd></div>
          <div><dt>Longest</dt><dd><Link href={surahHref(longest.id)}>{longest.transliteration}</Link> · {longest.total_verses}</dd></div>
          <div><dt>Shortest</dt><dd><Link href={surahHref(shortest.id)}>{shortest.transliteration}</Link> · {shortest.total_verses}</dd></div>
        </dl>
        <p>
          Want to study before you play? <Link href="/">Browse all 114 surahs</Link> with translation, word-by-word
          meaning and tafsir, or start with <Link href="/learn/ayatul-kursi">Ayatul Kursi</Link>, the greatest verse in
          the Quran.
        </p>
      </section>

      <GameFaq faq={faq} />
      <MoreGames current={game.slug} />
    </div>
  );
}
