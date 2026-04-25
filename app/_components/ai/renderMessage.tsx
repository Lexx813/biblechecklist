/**
 * Lightweight markdown renderer for AI chat output.
 * Mirrors the bubble's renderer (src/components/AIStudyBubble.tsx) but exposed
 * here for reuse on the /ai page. Supports headings, bold, italic, links,
 * bare URLs, bulleted/numbered lists, blockquotes, paragraphs.
 */

import type { ReactNode } from "react";

export function renderMessage(text: string): ReactNode {
  if (!text) return null;
  return <>{renderBlocks(text)}</>;
}

function renderBlocks(text: string): ReactNode[] {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") { i++; continue; }

    // Headings
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) { out.push(<h2 key={key++} className="mt-5 mb-2 text-lg font-bold tracking-tight">{renderInline(h1[1])}</h2>); i++; continue; }
    if (h2) { out.push(<h3 key={key++} className="mt-5 mb-2 text-base font-bold tracking-tight">{renderInline(h2[1])}</h3>); i++; continue; }
    if (h3) { out.push(<h4 key={key++} className="mt-4 mb-1.5 text-sm font-bold">{renderInline(h3[1])}</h4>); i++; continue; }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      out.push(
        <blockquote key={key++} className="my-4 border-l-2 border-violet-300 pl-4 italic text-slate-600 dark:border-violet-500/40 dark:text-slate-300">
          {quoteLines.map((q, idx) => <p key={idx}>{renderInline(q)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Bulleted list
    if (/^[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(<li key={items.length}>{renderInline(lines[i].replace(/^[-*]\s+/, ""))}</li>);
        i++;
      }
      out.push(<ul key={key++} className="my-3 ml-5 list-disc space-y-1">{items}</ul>);
      continue;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(<li key={items.length}>{renderInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>);
        i++;
      }
      out.push(<ol key={key++} className="my-3 ml-5 list-decimal space-y-1">{items}</ol>);
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      out.push(<hr key={key++} className="my-4 border-slate-200 dark:border-white/10" />);
      i++;
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-special lines
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,3}\s/.test(lines[i]) &&
      !lines[i].startsWith("> ") &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      <p key={key++} className="my-3 leading-relaxed">
        {renderInline(para.join(" "))}
      </p>
    );
  }

  return out;
}

function renderInline(text: string): ReactNode[] {
  // Tokenize: links, bold, italic, code, then bare URLs
  const out: ReactNode[] = [];
  let key = 0;
  let rest = text;

  // Pattern catches: [text](url) | **bold** | *italic* | `code` | bare http(s)://...
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(https?:\/\/[^\s)]+)/;
  while (rest) {
    const m = re.exec(rest);
    if (!m) {
      out.push(<span key={key++}>{rest}</span>);
      break;
    }
    if (m.index > 0) out.push(<span key={key++}>{rest.slice(0, m.index)}</span>);
    if (m[1]) out.push(<a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" className="underline">{m[1]}</a>);
    else if (m[3]) out.push(<strong key={key++}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={key++}>{m[4]}</em>);
    else if (m[5]) out.push(<code key={key++} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] dark:bg-white/10">{m[5]}</code>);
    else if (m[6]) out.push(<a key={key++} href={m[6]} target="_blank" rel="noopener noreferrer" className="underline">{m[6]}</a>);
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}
