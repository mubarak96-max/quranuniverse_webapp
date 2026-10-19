// Articles live as markdown in content/articles/<slug>.md; legal and about pages in content/pages/<slug>.md.
import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter, renderMarkdown, type Heading } from "./markdown";

const ROOT = process.cwd();
const ARTICLES = path.join(ROOT, "content", "articles");
const PAGES = path.join(ROOT, "content", "pages");

export const CATEGORIES = ["Understanding the Quran", "Exploring Islam", "Surahs & Verses"] as const;

export type Article = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  published: string;
  updated: string;
  html: string;
  headings: Heading[];
  faq: { q: string; a: string }[];
  words: number;
};

// The FAQ section is the visible source for FAQPage JSON-LD, so the two never drift apart.
function extractFaq(body: string): { q: string; a: string }[] {
  const at = body.search(/^## Frequently asked questions\s*$/im);
  if (at < 0) return [];
  const section = body.slice(at).replace(/\r\n/g, "\n").split(/\n## /)[0];
  return [...section.matchAll(/^### (.+)\n+([\s\S]*?)(?=\n### |\s*(?![\s\S]))/gm)].map((m) => ({
    q: m[1].trim(),
    a: m[2].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*+/g, "").replace(/\s+/g, " "),
  }));
}

const cache = new Map<string, Article>();

function load(dir: string, slug: string): Article | undefined {
  const key = `${dir}/${slug}`;
  if (cache.has(key)) return cache.get(key);
  const file = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(file)) return undefined;
  const { data, body } = parseFrontmatter(fs.readFileSync(file, "utf8"));
  const { html, headings } = renderMarkdown(body);
  const article: Article = {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    keywords: (data.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    category: data.category ?? CATEGORIES[0],
    published: data.published ?? "2026-10-20",
    updated: data.updated ?? data.published ?? "2026-10-20",
    html,
    headings,
    faq: extractFaq(body),
    words: body.split(/\s+/).filter(Boolean).length,
  };
  cache.set(key, article);
  return article;
}

const slugsIn = (dir: string) =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort() : [];

export const getArticles = () => slugsIn(ARTICLES).map((s) => load(ARTICLES, s)!);
export const getArticle = (slug: string) => load(ARTICLES, slug);
export const getPage = (slug: string) => load(PAGES, slug);

export function relatedArticles(a: Article, n = 3): Article[] {
  const linked = new Set([...a.html.matchAll(/href="\/learn\/([a-z0-9-]+)"/g)].map((m) => m[1]));
  const others = getArticles().filter((o) => o.slug !== a.slug);
  const score = (o: Article) => (linked.has(o.slug) ? 2 : 0) + (o.category === a.category ? 1 : 0);
  return others.sort((x, y) => score(y) - score(x)).slice(0, n);
}
