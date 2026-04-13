import React from "react";
import { BOOKS } from "../../data/books";
import { wolChapterUrl } from "../../utils/wol";

// ── Constants ────────────────────────────────────────────────────────────────

export const REACTION_EMOJIS = ["👍","❤️","😂","😮","😢","🔥","🙏","👏"];

export const THEME_COLORS = [
  { label: "Teal", value: null },
  { label: "Purple", value: "#7c3aed" },
  { label: "Blue", value: "#2563eb" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
  { label: "Emerald", value: "#059669" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Pink", value: "#db2777" },
];

export const DISAPPEAR_OPTIONS = [
  { label: "Off", value: null },
  { label: "24 hours", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
];

export const PUSH_DISMISS_KEY = "nwt-push-prompt-dismissed";

// ── Time helpers ────────────────────────────────────────────────────────────

export function timeAgo(iso: string | null | undefined, t?: (key: string) => string) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return t ? t("messages.justNow") : "just now";
  if (m < 60) return `${m}${t ? t("messages.minutesAgo") : "m"}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${t ? t("messages.hoursAgo") : "h"}`;
  return `${Math.floor(h / 24)}${t ? t("messages.daysAgo") : "d"}`;
}

export function initial(name: string | null | undefined) { return (name || "?")[0].toUpperCase(); }

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatDay(date: Date, t?: (key: string) => string) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return t ? t("messages.today") : "Today";
  if (date.toDateString() === yesterday.toDateString()) return t ? t("messages.yesterday") : "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function groupByDay(messages: Array<{ created_at: string } & Record<string, unknown>>, t?: (key: string) => string) {
  const items: Array<Record<string, unknown>> = [];
  let lastDay: string | null = null;
  for (const msg of messages) {
    const day = new Date(msg.created_at).toDateString();
    if (day !== lastDay) {
      items.push({ type: "day", label: formatDay(new Date(msg.created_at), t), key: "day-" + day });
      lastDay = day;
    }
    items.push({ type: "message", ...msg });
  }
  return items;
}

export function groupReactions(
  reactions: Array<{ message_id: string; emoji: string; user_id: string }>,
  messageId: string
): Record<string, { count: number; users: string[] }> {
  const grouped: Record<string, { count: number; users: string[] }> = {};
  reactions.filter(r => r.message_id === messageId).forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user_id);
  });
  return grouped;
}

// ── Message content renderer ─────────────────────────────────────────────────

const URL_RE = /https?:\/\/[^\s<>"]+/g;
const BOLD_RE = /\*([^*]+)\*/g;
const ITALIC_RE = /_([^_]+)_/g;
const WOL_BOOK_RE = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1\s?Samuel|2\s?Samuel|1\s?Kings|2\s?Kings|1\s?Chronicles|2\s?Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1\s?Corinthians|2\s?Corinthians|Galatians|Ephesians|Philippians|Colossians|1\s?Thessalonians|2\s?Thessalonians|1\s?Timothy|2\s?Timothy|Titus|Philemon|Hebrews|James|1\s?Peter|2\s?Peter|1\s?John|2\s?John|3\s?John|Jude|Revelation)\s+(\d+):(\d+)/gi;

export function renderFormattedContent(text: string | null | undefined): React.ReactNode {
  if (!text) return null;
  const parts: Array<{ type: string; value: string }> = [];
  let lastIndex = 0;
  const urls = [...text.matchAll(URL_RE)];

  for (const m of urls) {
    if (m.index! > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, m.index) });
    }
    parts.push({ type: "url", value: m[0] });
    lastIndex = m.index! + m[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });

  return parts.map((part, i) => {
    if (part.type === "url") {
      return <a key={i} href={part.value} target="_blank" rel="noopener noreferrer" className="fc-msg-link">{part.value}</a>;
    }
    const segments: React.ReactNode[] = [];
    let src = part.value;

    src = src.replace(WOL_BOOK_RE, (match, book, ch) => {
      const bookIdx = BOOKS.findIndex(b => b.name.toLowerCase() === book.trim().toLowerCase());
      if (bookIdx < 0) return match;
      const url = wolChapterUrl(bookIdx, parseInt(ch));
      return `\x00WOL\x01${url}\x02${match}\x03`;
    });

    const wolParts = src.split(/\x00WOL\x01(.*?)\x02(.*?)\x03/g);
    for (let j = 0; j < wolParts.length; j++) {
      if (j % 3 === 0) {
        const txt = wolParts[j];
        const boldParts = txt.split(BOLD_RE);
        boldParts.forEach((bp, bi) => {
          if (bi % 2 === 1) {
            segments.push(<strong key={`${i}-${j}-${bi}`}>{bp}</strong>);
          } else {
            const italicParts = bp.split(ITALIC_RE);
            italicParts.forEach((ip, ii) => {
              if (ii % 2 === 1) segments.push(<em key={`${i}-${j}-${bi}-${ii}`}>{ip}</em>);
              else if (ip) segments.push(<span key={`${i}-${j}-${bi}-${ii}`}>{ip}</span>);
            });
          }
        });
      } else if (j % 3 === 2) {
        const wolUrl = wolParts[j - 1];
        segments.push(
          <a key={`${i}-wol-${j}`} href={wolUrl} target="_blank" rel="noopener noreferrer" className="fc-msg-link fc-wol-link">
            {wolParts[j]}
          </a>
        );
      }
    }
    return <span key={i}>{segments}</span>;
  });
}
