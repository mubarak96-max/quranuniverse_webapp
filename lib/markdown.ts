// Renders the small markdown subset used by content/articles and content/pages:
// ## / ### headings, paragraphs, - and 1. lists, > blockquotes, **bold**, *italic*, [links](url).
// Kept in-house so articles need no markdown dependency; anything outside the subset renders as text.

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const slugify = (s: string) =>
  s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function inline(s: string): string {
  return escape(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text, href) => {
      const external = /^https?:\/\//.test(href);
      return `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ""}>${text}</a>`;
    });
}

export type Heading = { level: 2 | 3; text: string; id: string };

export function renderMarkdown(md: string): { html: string; headings: Heading[] } {
  const out: string[] = [];
  const headings: Heading[] = [];
  // Headings always stand alone, even when an author forgot the blank lines around them.
  const blocks = md
    .replace(/\r\n/g, "\n")
    .replace(/^(#{2,3}\s.*)$/gm, "\n$1\n")
    .trim()
    .split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split("\n");
    const first = lines[0];
    const h = /^(#{2,3})\s+(.*)$/.exec(first);
    if (h && lines.length === 1) {
      const level = h[1].length as 2 | 3;
      const text = h[2].trim();
      const id = slugify(text);
      headings.push({ level, text, id });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
    } else if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      out.push(`<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("")}</ul>`);
    } else if (lines.every((l) => /^\s*\d+\.\s+/.test(l))) {
      out.push(`<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+\.\s+/, ""))}</li>`).join("")}</ol>`);
    } else if (lines.every((l) => l.startsWith(">"))) {
      const paras = lines
        .map((l) => l.replace(/^>\s?/, ""))
        .join("\n")
        .split(/\n\s*\n/)
        .map((p) => `<p>${inline(p.replace(/\n/g, " "))}</p>`);
      out.push(`<blockquote>${paras.join("")}</blockquote>`);
    } else {
      out.push(`<p>${inline(lines.join(" "))}</p>`);
    }
  }
  return { html: out.join("\n"), headings };
}

export function parseFrontmatter(src: string): { data: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: m[2] };
}
