# Quran Universe — SEO & AI-Citation Content Plan

Research date: 2026-10-25. Keyword data: Ubersuggest, United States, English, monthly search volume (Vol) and SEO difficulty (SD, 0–100, lower is easier). This plan proposes 55 new articles. None of them repeats the 25 articles already in `content/articles/`.

## How to use this file

- Each article lists its slug, category, primary keyword with metrics, secondary keywords for the `keywords:` frontmatter, audience, the angle that earns citations or links, an outline, and internal links.
- Article frontmatter follows the existing format (`title`, `description`, `keywords`, `category`, `published`).
- Articles go under `/learn/<slug>`. Internal link targets that already exist: `/names/<slug>`, `/surah/<n>`, `/timeline`, the five journeys (`adam`, `firaun`, `qarun`, `abraha`, `dajjal`), and the existing `/learn` articles.

## Data caveats

- **Ubersuggest suppresses some sensitive terms.** "jihad", "what is jihad", "prophet muhammad" and "who was prophet muhammad" all returned 0 volume, in both the US and UK, even though real demand is clearly large (global "muhammad" = 450,000/mo). Treat these as high-demand topics that have no reliable numbers.
- Some seeds returned only long-tail data (for example, "dua for anxiety" returned 0, while "dua for stress and anxiety" returned 2,900). The plan uses the variant that has data.
- Volumes are US only. Global demand for Islamic terms is usually 3–10× higher (UK, Canada, India, Pakistan, Nigeria, Malaysia).

---

## Writing rules for AI citations, research visibility and natural backlinks

These rules apply to every article. They matter more than any single keyword.

1. **Answer first.** Open with a 40–60 word direct answer that can be quoted on its own (the existing articles already do this well). AI Overviews, ChatGPT and Perplexity lift this paragraph.
2. **Key takeaways block.** Use 4–6 factual bullets, each a complete claim with a source.
3. **Primary-source citations everywhere.** Cite Quran verses as `Surah:Ayah` and link them to the site's own `/surah/` pages, so every article pushes authority to the Quran section. Cite hadith with collection and number (for example, Sahih al-Bukhari 6410). Researchers and journalists link to pages that cite properly; content farms don't.
4. **State scholarly differences plainly.** On fiqh questions (music, dogs, hijab, polygamy), set out the majority view and the main alternative views with named schools or scholars. Balanced pages get cited by universities, interfaith groups and Wikipedia editors. One-sided pages don't.
5. **Definitions in bold, with the Arabic term.** For example: **Tawakkul (توكل)** means reliance on God. Clean entity definitions are what LLMs extract.
6. **FAQ section with FAQPage schema.** Pull the questions from the secondary keywords listed for each article.
7. **Tables for comparisons** (Sunni vs Shia, Islam vs Christianity, major vs minor signs). Tables are the format AI answers and featured snippets reuse most.
8. **Show the author and reviewer.** Add an author byline and a "reviewed by" line naming a qualified person where possible. E-E-A-T matters heavily for YMYL religious content.
9. **Respectful tone for outsiders.** Readers in the "exploring" and "misinformation" groups leave quickly if a page reads as preaching. Explain first and invite second.

## Linkable assets (original-data pages that earn backlinks)

These pages are built from the site's own Quran data (`quran.json`, `names*.json`, tafsir files). Original statistics are what bloggers, students and AI systems cite, so these attract natural links better than any article.

| Asset                                                                                 | Built from                   | Target keyword                                               | Why it earns links                                                     |
| ------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| How often each Name of Allah appears in the Quran (sortable table)                    | `quran.json` + `names*.json` | "how many times is allah mentioned in the quran" (90, SD 26) | Original count that is hard to find elsewhere and gets cited in essays |
| Every dua in the Quran (all Rabbana duas, with verse links)                           | `quran.json`                 | "rabbana duas" (720, SD 19), "duas from the quran"           | Reference list that Islamic schools and blogs link to                  |
| Quran word and theme statistics (mercy vs punishment, words for "heart", and similar) | `quran.json`                 | long tail                                                    | Journalists and researchers quote numbers                              |
| Prophets in the Quran: mention counts per prophet                                     | existing article + data      | "how many times is jesus/moses mentioned in the quran"       | Expands the existing `prophets-in-the-quran` piece into a data table   |
| Interactive timeline (`/timeline`)                                                    | existing feature             | "islamic golden age", "al-andalus"                           | Teachers link to visual timelines. Articles 50–51 below feed it        |

Recommendation: build the first two assets before the long tail of articles. They also strengthen articles 3, 4 and 23.

---

## Topic clusters (24)

| #   | Cluster                                     | Audience                              | Articles     |
| --- | ------------------------------------------- | ------------------------------------- | ------------ |
| 1   | Allah & the Names of Allah                  | All                                   | 1–5          |
| 2   | Everyday Islamic phrases                    | Muslims, curious non-Muslims          | 6–11         |
| 3   | Becoming Muslim                             | Explorers, converts                   | 12–14        |
| 4   | Prayer & purification                       | New Muslims, practising Muslims       | 15–19        |
| 5   | Dua                                         | Muslims                               | 20–23        |
| 6   | Death & the afterlife                       | All, spiritual seekers                | 24–26        |
| 7   | The unseen (jinn, angels, evil eye, dreams) | Muslims, curious                      | 27–30        |
| 8   | Existence of God                            | Seekers, sceptics                     | 31–33        |
| 9   | Meaning & purpose                           | People searching for purpose          | 34–35        |
| 10  | Spiritual virtues & heart work              | Muslims, seekers                      | 36–39        |
| 11  | Sharia, jihad & peace                       | Western readers facing misinformation | 40–42        |
| 12  | Women in Islam                              | Western readers, Muslim women         | 43–45        |
| 13  | Halal & haram questions                     | Young Muslims, curious                | 46–48        |
| 14  | Comparative religion                        | Christians, explorers                 | 49–50        |
| 15  | Sunni & Shia                                | All, students                         | 51           |
| 16  | Hadith & sources                            | Students, researchers                 | 52           |
| 17  | Fasting                                     | All                                   | 53           |
| 18  | Charity                                     | Muslims                               | 54           |
| 19  | Pilgrimage & the Kaaba                      | All                                   | 55           |
| 20  | Islamic civilisation                        | Researchers, students                 | 56–57        |
| 21  | The Prophet Muhammad ﷺ                      | All                                   | 58           |
| 22  | Mental health & faith                       | Muslims, seekers                      | 21, 37, 38   |
| 23  | Human nature (fitrah)                       | Seekers                               | 34 (section) |
| 24  | End times                                   | Muslims, curious                      | 26           |

---

## Cluster 1 — Allah & the Names of Allah

### 1. Who Is Allah? The God of Islam Explained

- **Slug:** `who-is-allah` · **Category:** Exploring Islam
- **Primary:** "who is allah" — 18,100 · SD 33
- **Secondary:** what does allah mean, allah meaning, is allah a name or title, allah in arabic
- **Audience:** explorers, Western readers
- **Angle:** The definitive entity page for "Allah" on the site. AI answers need a clean, citable definition, and this page is the hub for all Names of Allah pages.
- **Outline:**
  - Direct answer: Allah is the Arabic word for the one God, used by Muslims and by Arab Christians and Jews
  - Etymology (al-ilah) and why the word has no plural or gender
  - How the Quran describes Allah: Surah al-Ikhlas (112), Ayat al-Kursi (2:255), the end of Surah al-Hashr (59:22–24)
  - What Allah is _not_ in Islamic belief (no son, no partner, no human form)
  - Allah's attributes through His Names: link the Names index
  - Arab Christians use "Allah" in their Bibles (a cited fact that builds bridges)
  - FAQ
- **Links:** `/names`, `/learn/ayatul-kursi`, `/learn/four-quls`, article 2

### 2. Is Allah the Same God Christians and Jews Worship?

- **Slug:** `is-allah-the-same-god` · **Category:** Exploring Islam
- **Primary:** "is allah the same god" — 5,400 · SD 33
- **Secondary:** do muslims and christians worship the same god, why do muslims call god allah (110), allah vs god, allah vs yahweh
- **Audience:** Christians, interfaith readers
- **Angle:** Interfaith and academic sites link to balanced treatments. Quote Quran 29:46 and set out both Christian theological positions fairly.
- **Outline:**
  - Short answer from the Islamic perspective (the same God of Abraham, understood differently)
  - Quran 29:46 and 2:136
  - Shared ground: one creator, Abraham, Moses, Jesus as prophet
  - Real differences: the Trinity, the divinity of Jesus, how God is known
  - What Christian denominations say (cite sources, without pushing a view)
  - The word "Allah" in Arabic Bibles
  - Comparison table
- **Links:** article 1, `/learn/quran-vs-bible`, `/learn/christians-and-jews-in-the-quran`, article 49

### 3. How to Learn and Memorise the 99 Names of Allah

- **Slug:** `how-to-learn-99-names-of-allah` · **Category:** Names of Allah (new)
- **Primary:** "99 names of allah with meaning" — 2,900 · SD 19
- **Secondary:** how to learn 99 names of allah, memorize 99 names of allah, 99 names of allah in order, 99 names of allah pdf (1,300), 99 names of allah quiz, list the 99 names of allah (390)
- **Audience:** Muslims, parents, teachers
- **Angle:** A practical method page plus a printable or PDF list targets the 1,300/mo "pdf" query. Teachers link to printables.
- **Outline:**
  - The hadith on "whoever enumerates them enters Paradise" (Bukhari 2736) and what _ihsā'_ (enumerating) actually means
  - A 10-week plan grouped by meaning (mercy names, power names, knowledge names)
  - Memory techniques: pair each Name with its verse, daily dua use, flashcards
  - Full table: Arabic, transliteration, meaning, link to each `/names/` page
  - Downloadable PDF (one page plus a detailed version)
  - FAQ: order of the names, is the list fixed, are there more than 99
- **Links:** `/names`, every `/names/<slug>`

### 4. Where Do the 99 Names of Allah Come From? Quran, Hadith and the Famous List

- **Slug:** `origin-of-the-99-names-of-allah` · **Category:** Names of Allah
- **Primary:** "what are 99 names of allah" — 320 · SD 31
- **Secondary:** why are there 99 names of allah, 99 names of allah hadith, 99 names of allah quran, where are the 99 names of allah from, meaning of the 99 names of allah and benefits (320)
- **Audience:** students, researchers
- **Angle:** A research-grade page. Explain that the common list comes from the Tirmidhi narration, how scholars graded it, and how alternative lists differ (Ibn Hajar, Ibn Uthaymin). Almost no consumer site covers this, so researchers will cite it.
- **Outline:**
  - The two hadith (Bukhari/Muslim on the number; Tirmidhi 3507 for the list) and their grading
  - Names that appear verbatim in the Quran vs names derived from it
  - Different scholarly lists compared in a table
  - Why "99" doesn't limit God's names (the hadith of Ibn Mas'ud: "names You kept in the knowledge of the unseen")
  - Claimed "benefits" of reciting specific names: which are authentic and which are folk practice
  - Link the frequency-data asset
- **Links:** `/names`, article 3, `/learn/what-is-tafsir`

### 5. What Is Tawheed? The Oneness of God in Islam

- **Slug:** `what-is-tawheed` · **Category:** Exploring Islam
- **Primary:** "tawheed" — 1,900 · SD 41
- **Secondary:** tawhid meaning, types of tawheed, what is shirk, oneness of god in islam
- **Audience:** Muslims, students
- **Angle:** Core concept definition, with Surah al-Ikhlas as the anchor text.
- **Outline:**
  - Definition, and Arabic root w-h-d
  - The three categories scholars use (rububiyyah, uluhiyyah, asma wa sifat), noting that this is a teaching framework
  - Shirk: definition and its major and minor forms
  - Tawheed in daily life (trust, fear, hope, worship)
  - Quranic evidence: 112, 2:163, 21:22
- **Links:** `/learn/four-quls`, article 1, `/names`

## Cluster 2 — Everyday Islamic phrases (high volume, low difficulty)

These are the biggest quick wins in the dataset: high volume, SD in the 20s, and simple definitional intent that AI answers quote word for word. Use one template for all six: meaning, Arabic and transliteration, origin in the Quran or hadith, when to say it, how to reply, common mistakes, and related phrases.

### 6. Inshallah Meaning: What It Means and When to Say It

- **Slug:** `inshallah-meaning` · **Primary:** "inshallah meaning" — 74,000 · SD 28
- **Secondary:** inshallah in arabic, how to spell inshallah, inshallah vs in sha allah, inshallah reply
- **Outline:** meaning ("if God wills") · Quran 18:23–24 (the story behind the verse) · correct spelling (إن شاء الله, and why "insha'Allah" is written as three words) · when to say it · the cultural "inshallah means no" stereotype, explained respectfully · how to reply · FAQ
- **Links:** `/learn/surah-al-kahf-benefits`, article 38 (tawakkul)

### 7. Mashallah Meaning: What It Means, When to Say It, and Mashallah vs Tabarakallah

- **Slug:** `mashallah-meaning` · **Primary:** "mashallah meaning" — 60,500 · SD 23
- **Secondary:** mashallah vs inshallah, tabarakallah meaning, mashallah evil eye, mashallah in arabic
- **Outline:** meaning ("what God has willed") · Quran 18:39 (the garden owner) · saying it to protect against envy and the evil eye · mashallah vs inshallah table · tabarakallah · FAQ
- **Links:** article 29 (evil eye), article 6

### 8. Alhamdulillah Meaning: Praise and Gratitude in Islam

- **Slug:** `alhamdulillah-meaning` · **Primary:** "alhamdulillah meaning" — 33,100 · SD 28
- **Secondary:** alhamdulillah in arabic, how to reply to alhamdulillah, alhamdulillah after sneezing, why do muslims say alhamdulillah after sneezing (50)
- **Outline:** meaning · first verse after the basmala in al-Fatihah (1:2) · hamd vs shukr · the sneezing etiquette hadith · "alhamdulillah in every situation" · the gratitude science sidebar (cited psychology research, which bridges to a general audience)
- **Links:** `/learn/surah-al-fatihah-meaning`, article 36 (dhikr)

### 9. Bismillah Meaning: "In the Name of God, the Most Merciful"

- **Slug:** `bismillah-meaning` · **Primary:** "bismillah meaning" — 33,100 · SD 32
- **Secondary:** bismillah ir rahman ir rahim meaning, bismillah in arabic, why do muslims say bismillah before eating (70), basmala
- **Outline:** full phrase and word-by-word meaning · ar-Rahman vs ar-Raheem (link both name pages) · it opens 113 of 114 surahs (why Surah at-Tawbah doesn't) · the 114th occurrence in 27:30 (a strong trivia hook for citations) · when Muslims say it
- **Links:** `/names/ar-rahman`, `/names/ar-raheem`, `/learn/how-many-surahs-and-verses-in-the-quran`

### 10. SubhanAllah Meaning and When Muslims Say It

- **Slug:** `subhanallah-meaning` · **Primary:** "subhanallah meaning" — 12,100 · SD 21
- **Secondary:** subhanallah in arabic, subhanallah wa bihamdihi, tasbih
- **Outline:** meaning (declaring God free of imperfection) · Quran uses · tasbih after prayer (33×) · the "two phrases light on the tongue" hadith (Bukhari 6406) · amazement usage
- **Links:** article 36, article 8

### 11. Astaghfirullah Meaning: Seeking Forgiveness in Islam

- **Slug:** `astaghfirullah-meaning` · **Primary:** "astaghfirullah meaning" — 12,100 · SD 21
- **Secondary:** astaghfirullah in arabic, sayyidul istighfar, istighfar benefits
- **Outline:** meaning · Quran 71:10–12 (istighfar and provision) · Sayyid al-Istighfar text (Bukhari 6306) · the Prophet's 70–100 times daily · misuse as an exclamation
- **Links:** article 22, `/names/al-ghaffar`

## Cluster 3 — Becoming Muslim

### 12. The Shahada: Meaning of the Islamic Declaration of Faith

- **Slug:** `shahada-meaning` · **Category:** Exploring Islam
- **Primary:** "shahada" — 40,500 · SD 25
- **Secondary:** meaning of shahada (6,600), what is shahada (3,600), shahada arabic (3,600), shahada english (1,600), shahada symbol / flag of shahada (1,000), 7 conditions of shahada (70), shahada in quran
- **Audience:** explorers, converts, students
- **Angle:** A big keyword with low SD and a clean definitional page. Address the "shahada flag" searches neutrally: the shahada appears on national flags (Saudi Arabia, Afghanistan) and has been misused by extremist groups. Explaining that is exactly what the "misinformation" audience needs.
- **Outline:**
  - Text in Arabic, transliteration and translation
  - Word-by-word meaning
  - The two halves: belief in one God, and Muhammad as messenger
  - First of the five pillars
  - The seven conditions scholars list
  - The shahada on flags and in art; misuse by extremists, and why mainstream Muslims reject it
  - Audio pronunciation
- **Links:** `/learn/five-pillars-of-islam`, article 13, article 5

### 13. How to Convert to Islam: A Step-by-Step Guide

- **Slug:** `how-to-convert-to-islam` · **Category:** Exploring Islam
- **Primary:** "how to convert to islam" — 1,300 · SD 31
- **Secondary:** how to take shahada (260), how to convert to islam as a woman (210), do you need witnesses to take shahada (70), how to take your shahada at home, what to do after saying the shahada (40), can you be muslim without taking your shahada
- **Audience:** explorers ready to commit
- **Angle:** High-intent and emotionally significant. Mosques and revert organisations link to clear, non-pressuring guides.
- **Outline:**
  - What converting actually requires (sincere belief and the shahada; no fee, no ceremony required)
  - Witnesses: recommended, not required
  - Doing it at home vs at a mosque
  - The first 30 days: ghusl, learning salah, Al-Fatihah, finding community
  - Name change is optional (answers "why do muslims change their name")
  - Family conversations and common fears
  - FAQ, plus links to revert support organisations
- **Links:** article 12, article 15, article 16, `/learn/how-to-read-the-quran`

### 14. What Do Muslims Believe? The Six Articles of Faith

- **Slug:** `what-do-muslims-believe` · **Category:** Exploring Islam
- **Primary:** "what do muslims believe" — 14,800 · SD 43
- **Secondary:** six articles of faith, iman, muslim beliefs, articles of faith islam
- **Audience:** explorers, students (GCSE and A-level religious studies use this framework, which makes it a backlink source)
- **Angle:** Hadith of Jibril as the spine, with each article linking to a deeper cluster page. It's the main hub page for belief.
- **Outline:** hadith of Jibril (Muslim 8) · God · angels · books · prophets · Day of Judgement · qadar · iman vs islam vs ihsan · summary table
- **Links:** articles 1, 28, `/learn/what-is-the-quran`, `/learn/prophets-in-the-quran`, 24, 26, `/learn/what-is-islam`

## Cluster 4 — Prayer & purification

### 15. How to Pray Salah Step by Step (With Words and Translation)

- **Slug:** `how-to-pray-salah` · **Category:** Practice (new)
- **Primary:** "how to pray salah" — 1,000 · SD 27
- **Secondary:** how to pray salah step by step (260), how to pray salah for women (90), how to pray salah for beginners, how to pray salah step by step pdf (110), what to say in salah
- **Audience:** new Muslims, returning Muslims
- **Angle:** Illustrated steps with Arabic, transliteration and meaning for every recitation. Mention madhhab differences briefly so the page is usable by all schools.
- **Outline:** prerequisites (wudu, qibla, intention, covering) · rak'ah by rak'ah walkthrough · every recitation in 3 formats · rakat count table for the five prayers · men vs women differences (by madhhab) · common mistakes · printable PDF
- **Links:** article 16, article 17, `/learn/surah-al-fatihah-meaning`, `/surah/1`

### 16. How to Perform Wudu Step by Step

- **Slug:** `how-to-perform-wudu` · **Primary:** "how to perform wudu" — 1,000 · SD 35
- **Secondary:** how to perform wudu women (590, SD 13), how to perform wudu step by step (390), dua after wudu (3,600), what breaks wudu, wudu without water / tayammum (30), wudu in shower
- **Outline:** Quran 5:6 · obligatory vs sunnah steps · step list · dua after wudu · women-specific questions (hijab, makeup, nail polish) · what breaks wudu · tayammum · wiping over socks
- **Links:** article 15

### 17. Why Do Muslims Pray Five Times a Day?

- **Slug:** `why-muslims-pray-five-times-a-day` · **Category:** Exploring Islam
- **Primary:** "why do muslims pray 5 times a day" — 1,000 · SD 28
- **Secondary:** five daily prayers (390), names of the 5 prayers, why do muslims pray towards mecca (260), why do muslims pray on a rug, why do muslims face east when praying
- **Audience:** non-Muslim colleagues, students
- **Angle:** Answers the curious-outsider questions in one place, and it's very shareable by workplace diversity teams.
- **Outline:** the Night Journey (isra' and mi'raj) origin story · the five prayers with times · qibla and the Kaaba · why a prayer rug · praying at work and school · the spiritual purpose (Quran 29:45, 20:14)
- **Links:** article 15, article 55, `/timeline`

### 18. Tahajjud: The Night Prayer, How to Pray It and Its Virtues

- **Slug:** `tahajjud-prayer` · **Primary:** "tahajjud" — 4,400 · SD 32 (peaks to 9,900 in Ramadan)
- **Secondary:** how to pray tahajjud, tahajjud time, tahajjud dua, tahajjud benefits
- **Outline:** definition · Quran 17:79, 73:1–6 · time (last third of the night) · how many rakat · how to wake up · the descent hadith (Bukhari 1145) · tahajjud vs qiyam vs witr
- **Links:** article 20 (dua for witr: 4,400)

### 19. Salat al-Istikhara: How to Pray It, the Dua and What to Expect

- **Slug:** `istikhara-prayer` · **Primary:** "istikhara" — 6,600 · SD 24
- **Secondary:** dua for salatul istikhara (2,900), dua for istikhara in english (2,400), istikhara for marriage, signs after istikhara
- **Angle:** Correct the myths (that you must see a dream, or that a sheikh must do it for you). That nuance is what distinguishes a citable page.
- **Outline:** what it is · the hadith (Bukhari 1162) · how to pray it step by step · the dua (Arabic, transliteration, English) · myths about dreams and signs · istikhara for marriage and jobs
- **Links:** article 30 (dreams), article 38

## Cluster 5 — Dua

### 20. Daily Duas Every Muslim Should Know (Morning to Night)

- **Slug:** `daily-duas` · **Category:** Dua (new)
- **Primary:** "dua for travel" — 14,800 · SD 47; "dua for breaking fast" — 12,100 · SD 17
- **Secondary (each a jump-link section):** dua for the morning (5,400), dua for waking up (5,400), dua after eating (5,400), dua before eating (3,600), dua for sleep (3,600), dua for bathroom (2,900), dua for entering mosque (2,900), dua after azan (2,900), dua for leaving home (2,400), dua for entering home (2,400), dua for driving (1,600), dua for suhoor (1,600)
- **Angle:** One hub with anchor-linked sections captures dozens of 1k–15k queries. Each dua gets Arabic, transliteration, translation and the hadith source. Consider splitting "dua for travel" and "dua for breaking fast" into standalone pages once this hub ranks.
- **Outline:** a section per dua in daily order, each with its source · printable sheet · etiquette of dua
- **Links:** article 23 (Quran duas asset), article 53

### 21. Dua for Anxiety and Stress: Quranic Verses and Prophetic Duas for a Troubled Heart

- **Slug:** `dua-for-anxiety-and-stress` · **Category:** Faith & Wellbeing (new)
- **Primary:** "dua for stress and anxiety" — 2,900 · SD 24
- **Secondary:** anxiety islam (110), islam and depression (260), quran verses for anxiety, dua for pain (2,400), how to deal with stress islam
- **Audience:** Muslims struggling, spiritual seekers
- **Angle:** Pair the duas with responsible guidance that faith and therapy are compatible. Cite Muslim mental-health organisations (Khalil Center, Muslim Youth Helpline). Those organisations link to pages like this.
- **Outline:** the Prophet's dua against worry and grief (Bukhari 6369) · dua of Yunus (21:87) · Quran 13:28 "in the remembrance of God hearts find rest" · Quran 94:5–6 · practical routine · Islam's view of seeking therapy and medication · when to get urgent help (crisis lines)
- **Links:** article 36, article 37, `/names/as-salam`, `/surah/94`

### 22. Does God Forgive All Sins? Tawbah and the Dua for Forgiveness in Islam

- **Slug:** `does-god-forgive-all-sins` · **Category:** Faith & Wellbeing
- **Primary:** "does god forgive all sins" — 4,400 · SD 27; "dua for forgiveness" — 4,400 · SD 34
- **Secondary:** how to repent in islam (320), tawbah, sayyidul istighfar, can allah forgive shirk
- **Audience:** Muslims carrying guilt, and seekers from every background (the general query is mostly Christian, which gives a cross-audience opportunity)
- **Angle:** One of the most hopeful verses in scripture (39:53) is the hook. Readers share emotional pages like this.
- **Outline:** direct answer citing 39:53 · conditions of tawbah · shirk and 4:48 explained in context · the hadith of the man who killed 100 · duas for forgiveness · "I keep repeating the same sin" · the names al-Ghafur, at-Tawwab, al-'Afuww
- **Links:** `/names/al-ghafur`, `/names/at-tawwab`, `/names/al-afuww`, article 11

### 23. Rabbana Duas: Every Dua in the Quran (Full List With Translation)

- **Slug:** `rabbana-duas-from-the-quran` · **Category:** Dua
- **Primary:** "rabbana duas" — 720 · SD 19 (spikes to 1,900 in Ramadan)
- **Secondary:** duas from the quran, 40 rabbana duas, dua for parents (2,400), dua for jannah (210)
- **Angle:** **A linkable asset.** Build it from `quran.json`. It's a complete list with verse links, which turns it into a reference page that others link to.
- **Outline:** what "Rabbana" means · table of all duas by theme (forgiveness, parents, guidance, patience) · the 40 Rabbana duas · Prophets' duas in the Quran
- **Links:** `/surah/*`, `/learn/last-two-verses-of-surah-al-baqarah`, article 20

## Cluster 6 — Death & the afterlife

### 24. What Happens When You Die? The Islamic View of Death and the Afterlife

- **Slug:** `what-happens-when-you-die-in-islam` · **Category:** Exploring Islam
- **Primary:** "what happens when you die" — 60,500 · SD 32
- **Secondary:** what happens after death in islam, barzakh, questioning in the grave, dua for the dead (3,600), dua for death (2,900)
- **Audience:** everyone (one of the most-searched spiritual questions)
- **Angle:** Win the general query with an "Islamic perspective" page that still answers the universal question first, then gives the Islamic account. The secular counterpart pages are medical, so a religious-tradition page is a distinct result type.
- **Outline:** short answer · the soul's departure (hadith of al-Bara' ibn 'Azib) · barzakh · questioning in the grave · resurrection · judgement · Paradise and Hell · what Muslims do when someone dies (janazah, dua for the deceased, "inna lillahi") · comfort for the grieving
- **Links:** article 25, article 26, `/learn/surah-al-mulk`, `/surah/56`

### 25. Jannah in Islam: Meaning, Levels, Gates and What Paradise Is Like

- **Slug:** `jannah-in-islam` · **Primary:** "jannah meaning" — 2,400 · SD 31
- **Secondary:** jannah islam (1,300), what is in jannah (720), levels of jannah (210), 8 gates of jannah (140), jannah al firdaus (320), do animals go to jannah (110), what does jannah look like, jannah and jahannam (320), may allah grant him jannah (390)
- **Outline:** meaning · Quranic descriptions (Surah ar-Rahman, al-Waqiah) · levels and al-Firdaus · the 8 gates and who enters each · "what no eye has seen" hadith · common questions (animals, family, boredom) · Jahannam briefly · what to say when someone dies ("may Allah grant them Jannah")
- **Links:** `/learn/surah-ar-rahman`, `/learn/surah-al-waqiah`, article 24

### 26. Signs of the Day of Judgement in Islam: Major and Minor Signs

- **Slug:** `signs-of-the-day-of-judgement` · **Primary:** "islamic signs of the day of judgement" — 880 · SD 26
- **Secondary:** signs of the day of judgement (720), 10 major signs (320), minor signs (260), how many signs are left (170), signs that have happened, dajjal (18,100)
- **Angle:** Use a table of the 10 major signs with hadith sources. Link heavily to the existing Dajjal journey, which turns the journey into a ranking asset.
- **Outline:** what the Hour is (Quran 7:187: only God knows) · minor signs (fulfilled vs ongoing) · 10 major signs (Muslim 2901) · Dajjal · return of Jesus · Gog and Magog · how Muslims should relate to this (action, not fear or date-setting)
- **Links:** Dajjal journey, `/learn/jesus-in-the-quran`, `/learn/surah-al-kahf-benefits`

## Cluster 7 — The unseen

### 27. What Are Jinn? Jinn in Islam and the Quran

- **Slug:** `what-are-jinn` · **Primary:** "what are jinn" — 12,100 · SD 39
- **Secondary:** jinn islam (3,600), what is jinn in islam (1,300), are jinn real (1,000), what do jinn look like (720), what are jinn scared of (720), jinn vs demons, Surah al-Jinn (4,400)
- **Note:** Head term "jinn" (33,100) is polluted by Star Wars (Qui-Gon Jinn). Target the question forms.
- **Outline:** definition (created from smokeless fire, 55:15) · free will and accountability (51:56) · Iblis · Surah al-Jinn summary · jinn vs demons vs genies (Western pop culture) · protection (Ayat al-Kursi, the Quls) · possession claims and the balanced view (medical care first)
- **Links:** `/surah/72`, `/learn/ayatul-kursi`, `/learn/four-quls`, Adam journey

### 28. Angels in Islam: Who They Are, Their Names and Roles

- **Slug:** `angels-in-islam` · **Primary:** "angels in islam" — 1,900 · SD 29
- **Secondary:** names of angels in islam, jibril, mikail, israfil, angel of death, kiraman katibin
- **Outline:** belief in angels as an article of faith · created from light · named angels and roles (table) · the recording angels · angels vs jinn · comparison with Christian angelology
- **Links:** article 14, article 27

### 29. The Evil Eye in Islam: Is It Real and How to Protect Yourself

- **Slug:** `evil-eye-in-islam` · **Primary:** "evil eye in islam" — 1,000 · SD 6 (very easy)
- **Secondary:** dua for evil eye (2,900, SD 5), dua for protection from evil eye (1,600), dua for protection (2,900), signs of evil eye, evil eye bracelet haram
- **Outline:** the hadith "the evil eye is real" (Muslim 2188) · how it differs from the Nazar amulet culture (why amulets are rejected) · protective duas and recitations · saying mashallah · ruqyah · balance (not blaming everything on the evil eye)
- **Links:** article 7, `/learn/four-quls`

### 30. Dreams in Islam: Types, Meaning and Islamic Dream Interpretation

- **Slug:** `dreams-in-islam` · **Primary:** "islamic dream interpretation" — 6,600 · SD 29
- **Secondary:** dreams in islam, seeing the prophet in a dream, bad dreams islam, ibn sirin dream interpretation
- **Angle:** Most results are dream dictionaries. A principled page (three types of dreams, etiquette, caution about dictionaries) is the authoritative alternative that gets cited.
- **Outline:** three types of dreams (Bukhari 7017) · what to do after a good or bad dream · Prophet Yusuf's dreams (Surah Yusuf) · Ibn Sirin and the reliability of attributed books · why "dream dictionaries" mislead · dreams after istikhara
- **Links:** `/surah/12`, article 19

## Cluster 8 — Existence of God

### 31. Does God Exist? Rational Arguments from an Islamic Perspective

- **Slug:** `does-god-exist` · **Category:** Big Questions (new)
- **Primary:** "does god exist" — 8,100 · SD 49
- **Secondary:** proof of god existence (4,400), proof of god existing (2,400), is there proof of god (1,900), proof of god in science (1,300), logical proof of god (880), cosmological proof of god (320), proof of god in nature, avicenna proof of god
- **Audience:** sceptics, seekers, students
- **Angle:** Present the arguments philosophers actually discuss (al-Ghazali's kalam argument, Ibn Sina's contingency argument, fine-tuning, consciousness, morality, fitrah) with academic citations. The Islamic origin of the kalam argument is a fact most pages miss, and a citable hook for philosophy students.
- **Outline:** framing (evidence vs proof) · Quran 52:35–36 (the Quran's own argument) · kalam cosmological argument (al-Ghazali → William Lane Craig) · contingency (Ibn Sina) · design and fine-tuning · consciousness · objective morality · fitrah (innate belief; cite cognitive science of religion research) · common objections answered · summary table
- **Links:** article 32, article 33, `/names/al-khaliq`

### 32. Who Created God? The Question Answered

- **Slug:** `who-created-god` · **Category:** Big Questions
- **Primary:** "who created god" — 18,100 · SD 29
- **Secondary:** how does god exist without a creator, what was before god, who made allah
- **Angle:** High volume with low SD. A short, sharp answer is ideal for AI extraction.
- **Outline:** direct answer (an uncreated First Cause is logically required, and an infinite regress is impossible) · the hadith that predicts this question (Muslim 134) · Surah al-Ikhlas · al-Awwal (the First) · analogies · FAQ
- **Links:** `/names/al-awwal`, `/learn/four-quls`, article 31

### 33. Why Does God Allow Suffering? An Islamic Answer to the Problem of Evil

- **Slug:** `why-does-god-allow-suffering` · **Category:** Big Questions
- **Primary:** "why does god allow suffering" — 4,400 · SD 34
- **Secondary:** problem of evil islam, why do bad things happen to good people, qadr, predestination in islam (140)
- **Audience:** grieving people, sceptics
- **Angle:** One of the most important pages for people searching for purpose. Combine theology (tests, 67:2; 2:155–157) with compassion. Philosophy courses cite well-sourced theodicy pages.
- **Outline:** the honest question · life as a test (67:2) · this world isn't the final scale (justice in the hereafter) · suffering as purification (hadith on thorns, Bukhari 5641) · free will and moral evil · the story of Musa and al-Khidr (18:60–82), hidden wisdom · qadr explained · what to _do_ when suffering (sabr, dua) · the names al-Hakim and al-Latif
- **Links:** `/learn/surah-al-kahf-benefits`, `/learn/surah-al-mulk`, article 37, `/names/al-hakim`, `/names/al-latif`

## Cluster 9 — Meaning & purpose

### 34. What Is the Meaning of Life? The Islamic Answer

- **Slug:** `meaning-of-life-in-islam` · **Category:** Big Questions
- **Primary:** "what is the meaning of life" — 40,500 · SD 45
- **Secondary:** purpose of life islam (260), what is the purpose of life islam (110), how to find purpose in life (1,600), fitrah (1,000), why did god create us
- **Audience:** people seeking purpose (the core audience for this cluster)
- **Angle:** Open with the universal question, survey briefly how philosophy has answered it (nihilism, existentialism), then give the Quranic answer (51:56, 67:2, 23:115). Comparative framing earns links from philosophy and self-development blogs.
- **Outline:** why humans ask · the main secular answers in one paragraph each · the Quran's answer: knowing and worshipping God (51:56) and broad meaning of 'ibadah · life as a test (67:2) · khalifah: stewardship (2:30) · fitrah: the innate pull toward God (30:30) · what this looks like on a Tuesday (work, family, kindness as worship) · reflection questions
- **Links:** article 35, `/learn/what-is-islam`, Adam journey

### 35. How to Get Closer to God: Practical Steps from the Quran and Sunnah

- **Slug:** `how-to-get-closer-to-god` · **Category:** Faith & Wellbeing
- **Primary:** "how to get closer to god" — 6,600 · SD 23
- **Secondary:** how to find inner peace (880), how to get closer to allah, how to strengthen iman, spiritual growth islam
- **Audience:** seekers of every faith, and lapsed Muslims
- **Angle:** Universal query, low SD. The hadith qudsi "if he comes walking, I come running" (Bukhari 7405) is a memorable, shareable hook.
- **Outline:** God is near (2:186, 50:16) · the hadith qudsi · prayer · dhikr · Quran with reflection · night prayer · dua · service and charity · avoiding what hardens the heart · a 7-day starter plan
- **Links:** articles 18, 36, `/learn/how-to-read-the-quran`, `/names/al-qarib`

## Cluster 10 — Spiritual virtues

### 36. Dhikr: The Remembrance of God, Its Forms and Benefits

- **Slug:** `what-is-dhikr` · **Primary:** "dhikr" — 6,600 · SD 17
- **Secondary:** dhikr meaning, morning and evening adhkar, best dhikr, tasbih
- **Outline:** definition · 13:28 · the best dhikr (la ilaha illallah) · morning and evening adhkar · counting on the fingers vs tasbih beads · dhikr and calm (cite mindfulness research cautiously)
- **Links:** articles 8, 10, 11, 21

### 37. Sabr: The Meaning of Patience in Islam

- **Slug:** `sabr-patience-in-islam` · **Primary:** "sabr" — 8,100 · SD 55
- **Secondary:** sabr meaning, patience in islam quotes, quran verses about patience, types of sabr
- **Outline:** meaning (restraint, not passivity) · three types of sabr · Quran 2:153, 2:155–157, 39:10 · Prophet Ayyub and Prophet Yaqub (sabrun jameel) · patience at the first shock (Bukhari 1283) · sabr vs giving up
- **Links:** article 33, `/names/as-sabur`, `/learn/prophets-in-the-quran`

### 38. Tawakkul: What It Means to Trust God in Islam

- **Slug:** `tawakkul-trust-in-god` · **Primary:** "tawakkul" — 4,400 · SD 32
- **Secondary:** tawakkul meaning, tie your camel hadith, trust in allah quotes, hasbunallahu wa ni'mal wakeel
- **Outline:** meaning · "tie your camel" (Tirmidhi 2517): effort and trust together · 65:3 · the bird hadith · tawakkul vs fatalism · hasbunallah (3:173) · anxiety and tawakkul
- **Links:** article 21, `/names/al-wakil`, article 6

### 39. What Is Fitrah? Human Nature and the Innate Knowledge of God

- **Slug:** `fitrah-human-nature-in-islam` · **Category:** Big Questions
- **Primary:** "fitrah" — 1,000 · SD 18
- **Secondary:** fitrah meaning, every child is born muslim, innate belief in god
- **Angle:** Connect to the cognitive science of religion (Justin Barrett, "Born Believers"). That academic bridge earns research citations.
- **Outline:** meaning · 30:30 · hadith "every child is born upon fitrah" (Bukhari 1385) · the covenant of 7:172 · cognitive science of religion findings · why people say Muslims "revert" rather than "convert"
- **Links:** article 34, article 31, article 13

## Cluster 11 — Sharia, jihad & peace

These pages directly answer Western misinformation. Write them with academic sources (Oxford Islamic Studies, Esposito, Pew), not polemics. That's what makes journalists, universities and Wikipedia cite them.

### 40. What Is Sharia Law? A Clear Explanation Beyond the Headlines

- **Slug:** `what-is-sharia-law` · **Category:** Islam & Misconceptions (new)
- **Primary:** "sharia law" — 246,000 · SD 40 (the largest opportunity in this research; spikes to 550k around news cycles)
- **Secondary:** what is sharia, sharia law meaning, sharia vs fiqh, why do muslims want sharia law in the west (70), sharia law countries
- **Outline:** direct answer (sharia = "the path"; God's guidance as a whole, of which law is a small part) · sharia vs fiqh (human interpretation) · sources: Quran, Sunnah, consensus, analogy · the five objectives (maqasid: life, faith, intellect, family, property) · what it covers (mostly worship, ethics, contracts) · criminal punishments: the strict evidentiary conditions, and how rarely they're applied historically · sharia in Muslim-minority countries (personal religious practice, not state law) · polling data on what Muslims mean by it (Pew) · myths vs facts table
- **Links:** article 52 (hadith), article 41, `/learn/what-is-islam`

### 41. What Does Jihad Really Mean?

- **Slug:** `what-does-jihad-mean` · **Category:** Islam & Misconceptions
- **Primary:** "jihad" — _no data (term suppressed by Ubersuggest; real demand is high)_
- **Secondary:** jihad meaning, jihad al-nafs, greater and lesser jihad, holy war, jihad in the quran
- **Outline:** literal meaning (striving) · forms: of the self, the tongue, the pen, and armed defence · the rules of war in Islam (no harming non-combatants, women, children, monks, trees: Abu Bakr's instructions) · Quran 2:190, 5:32, read in context · why "holy war" is a mistranslation · how extremist groups distort it, and the scholarly refutations (Open Letter to al-Baghdadi, Amman Message)
- **Links:** article 42, article 40

### 42. Is Islam a Religion of Peace? What the Quran and History Actually Say

- **Slug:** `is-islam-a-religion-of-peace` · **Category:** Islam & Misconceptions
- **Primary:** "is islam a religion of peace" — 1,900 · SD 53
- **Secondary:** does the quran promote violence, islam and terrorism, the sword verse, islam meaning peace
- **Outline:** the word islam (s-l-m) · as-Salam as a name of God · verses quoted out of context (9:5) read with 9:6 · Quran 5:32, 60:8 · the Charter of Medina · history: coexistence and conflict, told honestly · data on Muslim attitudes to violence (Pew, Gallup) · mainstream scholarly condemnations of terrorism
- **Links:** `/names/as-salam`, `/timeline`, article 41, `/learn/christians-and-jews-in-the-quran`

## Cluster 12 — Women in Islam

### 43. Why Do Muslim Women Wear the Hijab?

- **Slug:** `why-do-muslim-women-wear-hijab` · **Category:** Islam & Misconceptions
- **Primary:** "why do women in islam wear hijab" — 4,400 · SD 27; "meaning of the hijab" — 8,100 · SD 34
- **Secondary:** what is a hijab (5,400), hijab definition (3,600), why do muslims cover their hair (4,400), burka or hijab (6,600), niqab or hijab (2,400), is it haram to not wear hijab (140), why do muslims wear burqa
- **Angle:** One page that answers "what is it" and "why" for outsiders, with a visual comparison of hijab, niqab, burqa, chador and khimar. That image is a strong backlink magnet.
- **Outline:** meaning (a barrier, and modesty for men _and_ women) · Quran 24:30–31, 33:59 · visual guide to the types · why women choose it (cite women's own voices and surveys) · coercion and choice, both directions (forced wearing and bans) · scholarly positions
- **Links:** `/learn/women-in-the-quran`, article 44

### 44. Women's Rights in Islam: What the Quran Grants Women

- **Slug:** `womens-rights-in-islam` · **Category:** Islam & Misconceptions
- **Primary:** "women's rights in islam" — 1,300 · SD 34
- **Secondary:** women in islam, inheritance for women in islam, can muslim women work, divorce rights women islam
- **Outline:** spiritual equality (33:35) · rights in 7th-century context (property, inheritance, consent, mahr, divorce) · Khadijah and Aisha as examples · the inheritance verses explained · where Muslim cultures fall short of the text (honest section) · Muslim women scholars through history
- **Links:** `/learn/women-in-the-quran`, `/learn/mary-in-the-quran`, article 43, article 45

### 45. Polygamy in Islam: How Many Wives Can a Muslim Have, and Why?

- **Slug:** `polygamy-in-islam` · **Category:** Islam & Misconceptions
- **Primary:** "how many wives can a muslim have" — 1,900 · SD 31
- **Secondary:** why do muslims have multiple wives (140), polygamy in islam, quran 4:3
- **Outline:** direct answer (up to four, under strict conditions; most Muslims are monogamous) · 4:3 and 4:129 in context (revealed after Uhud, orphans and widows) · the condition of justice · the wife's right to stipulate monogamy in the marriage contract · prevalence data · the law in Western countries
- **Links:** article 44

## Cluster 13 — Halal & haram questions

### 46. Why Don't Muslims Eat Pork?

- **Slug:** `why-dont-muslims-eat-pork` · **Category:** Islam & Misconceptions
- **Primary:** "why do muslims not eat pork" — 5,400 · SD 34
- **Secondary:** why is it haram to eat pork (110), why do muslims and jews not eat pork (210), why do muslims not drink alcohol (140), why do muslims eat halal (90), what is halal
- **Outline:** direct answer (a divine command, 2:173) · obedience as the primary reason, and health theories as secondary and uncertain · shared with Judaism (Leviticus 11) · what "halal" means more broadly · alcohol · exceptions under necessity
- **Links:** `/learn/quran-vs-bible`

### 47. Dogs in Islam: Can Muslims Have Dogs?

- **Slug:** `dogs-in-islam` · **Category:** Islam & Misconceptions
- **Primary:** "why do muslims hate dogs" — 1,900 · SD 52; "is it haram to have a dog" — 590 · SD 33
- **Secondary:** why do muslims not like dogs (1,000), is it haram to touch a dog (110), is it haram to own a dog (110), why do muslims love cats (70)
- **Angle:** Correct the "hate" framing. The dog in Surah al-Kahf, and the hadith of the man forgiven for giving water to a thirsty dog (Bukhari 2363), are surprising, citable facts.
- **Outline:** direct answer (Muslims don't hate dogs) · purity rulings by madhhab (Maliki vs others) · permitted purposes (guarding, hunting, guide dogs) · the dog of the Companions of the Cave (18:18) · the thirsty-dog hadith · kindness to animals in Islam · cats and Abu Hurayrah
- **Links:** `/learn/surah-al-kahf-benefits`

### 48. Is Music Haram in Islam? The Scholarly Views Explained

- **Slug:** `is-music-haram` · **Category:** Islam & Misconceptions
- **Primary:** "is it haram to listen to music" — 720 · SD 30
- **Secondary:** is music haram, is it haram to listen to music in ramadan (170), is it haram to sing (70), nasheed
- **Angle:** A genuinely contested question. A neutral, well-sourced survey of views (majority view vs Ibn Hazm, al-Ghazali and contemporary scholars) is what other sites will link to as "the explainer".
- **Outline:** the question · evidence cited by the prohibiting view (hadith of al-Bukhari on ma'azif, 31:6) · evidence cited by the permitting view · the middle positions (instruments vs voice, content-based) · the duff at weddings · nasheeds · how to approach differences of opinion
- **Links:** article 52 (hadith)

## Cluster 14 — Comparative religion

### 49. Islam vs Christianity: Key Similarities and Differences

- **Slug:** `islam-vs-christianity` · **Category:** Exploring Islam
- **Primary:** "islam vs christianity" — 8,100 · SD 25
- **Secondary:** differences between islam and christianity, why do muslims and christians disagree (50), do muslims believe in jesus, why do muslims not celebrate christmas (110)
- **Outline:** comparison table (God, Jesus, scripture, salvation, prophets, afterlife, worship) · shared heritage · core disagreements explained respectfully · relations through history · FAQ
- **Links:** `/learn/quran-vs-bible`, `/learn/jesus-in-the-quran`, `/learn/mary-in-the-quran`, articles 2, 50

### 50. Is Jesus God? What Islam Teaches About Jesus' Nature

- **Slug:** `is-jesus-god-islamic-view` · **Category:** Exploring Islam
- **Primary:** "is jesus god" — 33,100 · SD 42
- **Secondary:** why do muslims not believe jesus is god (70), why do muslims believe jesus was not crucified (90), why do muslims call jesus isa (50), did jesus claim to be god
- **Angle:** Huge volume, mostly Christian searchers. Offer a respectful Islamic perspective page that complements the existing "Jesus in the Quran". Cite Quran 5:116–117, 4:171, 19:30, and the scholarly debate on the Christological councils (Nicaea).
- **Outline:** the Islamic answer · how the Quran describes Jesus · Jesus' own words in the Quran (19:30, 5:116–117) · verses Christians cite, and the Muslim reading · history of the doctrine (Nicaea 325) · common ground: love and honour for Jesus
- **Links:** `/learn/jesus-in-the-quran`, article 49, article 26 (his return)

## Cluster 15 — Sunni & Shia

### 51. Sunni vs Shia: The Real Differences Explained

- **Slug:** `sunni-vs-shia` · **Category:** Exploring Islam
- **Primary:** "sunni vs shia" — 60,500 · SD 28 (huge and easy)
- **Secondary:** sunni vs shia differences (4,400), sunni vs shia map (3,600), sunni vs shia population (480), sunni vs shia beliefs (390), which countries are sunni vs shia (390), sufi vs sunni vs shia (170), sunni vs shia prayer
- **Angle:** Include a map plus a population chart (Pew data) and a differences table. Maps and charts are strong backlink magnets. Keep it neutral, because both communities will read it.
- **Outline:** short answer (succession after the Prophet) · history: Saqifah, Ali, Karbala (link the timeline) · shared beliefs (the large majority) · differences table (leadership, hadith collections, practices, prayer) · population and world map · Sufism (a spiritual path, not a sect) · politics vs theology (Iran and Saudi Arabia)
- **Links:** `/timeline`, article 52

## Cluster 16 — Hadith & sources

### 52. What Is Hadith? How Muslims Preserved the Prophet's Teachings

- **Slug:** `what-is-hadith` · **Category:** Understanding the Quran
- **Primary:** "hadith" — 18,100 · SD 34
- **Secondary:** what is a hadith, hadith vs quran, sahih bukhari, types of hadith, hadith qudsi
- **Angle:** A research-grade explanation of isnad, grading and the six books. University syllabi and researchers link to clear methodology pages.
- **Outline:** definition · Quran vs hadith vs sunnah · isnad and matn · grading (sahih, hasan, da'if, mawdu') · the six canonical collections · hadith qudsi · Western academic views (Goldziher, Motzki) summarised fairly · how to check a hadith
- **Links:** `/learn/what-is-the-quran`, `/learn/what-is-tafsir`, article 4

## Cluster 17 — Fasting

### 53. Why Do Muslims Fast During Ramadan?

- **Slug:** `why-do-muslims-fast-during-ramadan` · **Category:** Exploring Islam
- **Primary:** "why do muslims fast for ramadan" — 2,900 · SD 40; "why do muslims fast" — 2,400 · SD 24
- **Secondary:** ramadan (246,000, SD 71: too hard as a primary keyword, so use it as an entity), dua for breaking fast (12,100), dua for suhoor, why do muslims break fast with dates (210), dua for taraweeh (4,400), why do muslims celebrate eid
- **Angle:** Publish 6–8 weeks before Ramadan 2027 (expected around 8 February 2027). Search demand rises 6× in February.
- **Outline:** direct answer (2:183, taqwa) · what fasting involves · who is exempt · suhoor and iftar (link the duas) · why dates · Laylat al-Qadr · taraweeh · Eid al-Fitr · how non-Muslims can support colleagues
- **Links:** `/learn/laylatul-qadr`, article 20, `/learn/five-pillars-of-islam`

## Cluster 18 — Charity

### 54. What Is Zakat? How It Works and Who Must Pay

- **Slug:** `what-is-zakat` · **Primary:** "zakat" — 18,100 · SD 50 (CPC $51, which signals charity-sector competition)
- **Secondary:** what is zakat and why do muslims practice it (140), how to calculate zakat, nisab, zakat vs sadaqah, zakat al-fitr
- **Outline:** meaning (purification) · 9:60 (the eight categories of recipients) · who pays (nisab, hawl) · worked calculation example · zakat vs sadaqah vs zakat al-fitr · its economic and social purpose
- **Links:** `/learn/five-pillars-of-islam`, article 53

## Cluster 19 — Pilgrimage & the Kaaba

### 55. What Is the Kaaba? History, Meaning and Why Muslims Face It

- **Slug:** `what-is-the-kaaba` · **Category:** Exploring Islam
- **Primary:** "what is the kaaba" — 5,400 · SD 50
- **Secondary:** why do muslims worship a cube (110), why do muslims circle the kaaba (70), why do muslims go to mecca (210), hajj (40,500), what is hajj, black stone
- **Angle:** Correct the "worship a cube" misconception. Tie in Abraham and Ishmael (2:125–127) and the Abraha journey (the Year of the Elephant).
- **Outline:** direct answer · built by Ibrahim and Isma'il · the Year of the Elephant (link the Abraha journey) · the Black Stone (Umar's statement) · qibla · tawaf · Hajj overview and its rites · Umrah vs Hajj
- **Links:** Abraha journey, `/timeline`, article 17, `/surah/105`

## Cluster 20 — Islamic civilisation

### 56. The Islamic Golden Age: Science, Medicine and Ideas That Shaped the World

- **Slug:** `islamic-golden-age` · **Category:** Islamic History (new)
- **Primary:** "islamic golden age" — 9,900 · SD 48
- **Secondary:** islamic contributions to science (170), house of wisdom, al-khwarizmi algebra, ibn al-haytham optics, quran and science (320)
- **Audience:** students, researchers, Western readers (strong backlink potential from education sites)
- **Outline:** dates and definition (and the scholarly debate over the term) · the House of Wisdom · major figures table (al-Khwarizmi, Ibn Sina, Ibn al-Haytham, al-Zahrawi, al-Biruni) · how the Quran's call to reflect motivated inquiry (3:190–191) · transmission to Europe · why the age declined (Mongols, other theories)
- **Links:** `/timeline`, article 57

### 57. Al-Andalus: The History of Muslim Spain (711–1492)

- **Slug:** `al-andalus-muslim-spain` · **Category:** Islamic History
- **Primary:** "al-andalus" — 22,200 · SD 38
- **Secondary:** muslim spain, cordoba caliphate, alhambra history, convivencia, fall of granada
- **Angle:** High volume with modest SD. Pair the article with timeline events.
- **Outline:** arrival in 711 · the Umayyad emirate and caliphate of Córdoba · convivencia, and the debate over how harmonious it was · science and philosophy (Ibn Rushd, Maimonides) · the taifas · Granada and 1492 · legacy in language and architecture
- **Links:** `/timeline`, article 56

## Cluster 21 — The Prophet Muhammad ﷺ

### 58. Who Was the Prophet Muhammad? A Short Biography

- **Slug:** `prophet-muhammad-biography` · **Category:** Exploring Islam
- **Primary:** "prophet muhammad" — _no data (suppressed by Ubersuggest); global "muhammad" = 450,000_
- **Secondary:** life of prophet muhammad, prophet muhammad biography, when was prophet muhammad born, how did the prophet receive revelation, why do muslims say peace be upon him (390), why do muslims believe in muhammad (110), can the prophet be depicted, prophet muhammad in the bible
- **Angle:** The site has prophet content and a timeline but no biography of the Prophet ﷺ himself, which is the biggest entity gap. Use a timeline-driven layout.
- **Outline:** summary · Mecca before Islam · early life and character (al-Amin) · first revelation (96:1–5) · persecution and Ta'if · the Hijrah · Medina and the Charter · the conquest of Mecca and its amnesty · the Farewell Sermon · his death · his character in hadith · non-Muslim historians on Muhammad (Michael Hart, Montgomery Watt, Karen Armstrong) · why Muslims say ﷺ · why images are avoided
- **Links:** `/timeline`, `/surah/96`, `/learn/who-wrote-the-quran`, `/learn/meccan-and-medinan-surahs`

---

## Priority order

Ranked by (volume ÷ difficulty) × audience fit, with linkable assets first.

**Wave 1: quick wins and assets (weeks 1–4)**

1. Asset: Every dua in the Quran (23)
2. Asset: Frequency of the Names of Allah
3. Inshallah (6), Mashallah (7), Alhamdulillah (8), Bismillah (9), SubhanAllah (10), Astaghfirullah (11)
4. Shahada (12), Sunni vs Shia (51), Who created God (32), Who is Allah (1)

**Wave 2: big questions and misinformation (weeks 5–10)** 5. Sharia law (40), What happens when you die (24), Meaning of life (34), Is Jesus God (50) 6. Does God exist (31), Why does God allow suffering (33), How to get closer to God (35) 7. Jihad (41), Religion of peace (42), Hijab (43), Islam vs Christianity (49), Is Allah the same God (2)

**Wave 3: practice and devotion (weeks 11–16, before Ramadan 2027)** 8. Daily duas (20), Ramadan (53), Tahajjud (18), Istikhara (19), Salah (15), Wudu (16), Five prayers (17) 9. Anxiety (21), Forgiveness (22), Dhikr (36), Sabr (37), Tawakkul (38)

**Wave 4: depth and authority (weeks 17+)** 10. Jinn (27), Angels (28), Evil eye (29), Dreams (30), Day of Judgement (26), Jannah (25) 11. Hadith (52), Origin of the 99 Names (4), Learn the 99 Names (3), Tawheed (5), Fitrah (39), What Muslims believe (14), Convert (13) 12. Prophet Muhammad (58), Golden Age (56), Al-Andalus (57), Kaaba (55), Zakat (54) 13. Women's rights (44), Polygamy (45), Pork (46), Dogs (47), Music (48)

## Categories to add

The existing categories are Exploring Islam, Surahs & Verses and Understanding the Quran. This plan adds:

- **Names of Allah**
- **Practice** (prayer and purification)
- **Dua**
- **Faith & Wellbeing**
- **Big Questions**
- **Islam & Misconceptions**
- **Islamic History**

## Off-page actions for natural backlinks

- Mark up every article with Article plus FAQPage schema, and the dua pages with HowTo where the format fits.
