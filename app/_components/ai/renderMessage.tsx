/**
 * Lightweight markdown renderer for AI chat output.
 * Mirrors the bubble's renderer (src/components/AIStudyBubble.tsx) but exposed
 * here for reuse on the /ai page. Supports headings, bold, italic, links,
 * bare URLs, bulleted/numbered lists, blockquotes, paragraphs.
 *
 * Also detects Bible references (e.g. "John 3:16", "1 Cor 13:4-7") and renders
 * them as tappable violet chips that open wol.jw.org. Aligns with the project's
 * "jw.org primacy" rule for deeper study.
 */

import type { ReactNode } from "react";
import { parseScriptureRef, wolRefUrl } from "../../../src/utils/wol";

// Permissive candidate matcher — case the parser will then validate.
// Catches: "John 3:16", "1 Corinthians 13:4-7", "Gen 1:1", "Jude 9", "1 Tim 2:5".
// Limited to ~25-char book name to avoid greedy false positives in long sentences.
const SCRIPTURE_CANDIDATE_RE =
  /\b(\d\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s(\d{1,3}):(\d{1,3})(?:[–\-]\d{1,3})?\b|\b(\d\s)?([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s(\d{1,3})\b(?=[\s,.;]|$)/g;

function ScriptureChip({ ref }: { ref: string }) {
  const url = wolRefUrl(ref);
  if (!url) return <>{ref}</>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-violet-300/40 bg-violet-50 px-1.5 py-0.5 text-[0.92em] font-semibold text-violet-700 no-underline transition hover:border-violet-500 hover:bg-violet-100 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-200 dark:hover:border-violet-400 dark:hover:bg-violet-500/25"
      title={`Open ${ref} on wol.jw.org`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      {ref}
    </a>
  );
}

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
      // No more markdown tokens — pass remainder through scripture detection
      out.push(...renderWithScriptureChips(rest, key));
      key += 1000; // bump to avoid collisions; React only requires uniqueness within siblings
      break;
    }
    if (m.index > 0) {
      out.push(...renderWithScriptureChips(rest.slice(0, m.index), key));
      key += 1000;
    }
    if (m[1]) out.push(<a key={key++} href={m[2]} target="_blank" rel="noopener noreferrer" className="underline">{m[1]}</a>);
    else if (m[3]) out.push(<strong key={key++}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={key++}>{m[4]}</em>);
    else if (m[5]) out.push(<code key={key++} className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] dark:bg-white/10">{m[5]}</code>);
    else if (m[6]) out.push(<a key={key++} href={m[6]} target="_blank" rel="noopener noreferrer" className="underline">{m[6]}</a>);
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

// Walk a plain-text run, swap any valid scripture refs for ScriptureChip.
function renderWithScriptureChips(text: string, baseKey: number): ReactNode[] {
  if (!text) return [];
  const out: ReactNode[] = [];
  let key = baseKey;
  let lastIndex = 0;
  // Reset regex state — global flag means stateful between calls otherwise
  SCRIPTURE_CANDIDATE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SCRIPTURE_CANDIDATE_RE.exec(text)) !== null) {
    const candidate = m[0];
    const parsed = parseScriptureRef(candidate);
    if (!parsed) continue; // permissive matcher hit a false positive, skip
    if (m.index > lastIndex) {
      out.push(<span key={key++}>{text.slice(lastIndex, m.index)}</span>);
    }
    out.push(<ScriptureChip key={key++} ref={candidate} />);
    lastIndex = m.index + candidate.length;
  }
  if (lastIndex < text.length) {
    out.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }
  return out.length ? out : [<span key={baseKey}>{text}</span>];
}
