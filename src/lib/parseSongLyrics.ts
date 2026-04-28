/**
 * Markdown → song lyrics JSON.
 *
 * Mirrors the parser in scripts/seed-songs.mjs so the admin "Add Song" form
 * can accept the same MD format the vault uses. Sections are split on
 * `### [Section] — note` headings.
 *
 * Pure function, no I/O.
 */

import type { SongLyrics, SongSectionType } from "../api/songs";

const SECTION_TYPE_MAP: Array<[string, SongSectionType]> = [
  ["intro", "intro"],
  ["pre-chorus", "pre-chorus"],
  ["pre chorus", "pre-chorus"],
  ["final chorus", "final-chorus"],
  ["chorus", "chorus"],
  ["bridge", "bridge"],
  ["toast section", "toast"],
  ["toast", "toast"],
  ["breakdown / toast", "breakdown"],
  ["breakdown/toast", "breakdown"],
  ["breakdown", "breakdown"],
  ["outro", "outro"],
  ["verse", "verse"],
];

function classifySection(label: string): SongSectionType {
  const l = label.toLowerCase().trim();
  for (const [needle, type] of SECTION_TYPE_MAP) {
    if (l.startsWith(needle)) return type;
  }
  return "verse";
}

export function parseSongLyrics(mdText: string): SongLyrics {
  // Strip frontmatter
  const fmEnd = mdText.indexOf("\n---", 4);
  const afterFm = fmEnd >= 0 ? mdText.slice(fmEnd + 4) : mdText;

  // Restrict to the `## Lyrics` block
  const lyricsHeadingMatch = afterFm.match(/^##\s+Lyrics\s*$/m);
  let body: string;
  if (lyricsHeadingMatch && lyricsHeadingMatch.index !== undefined) {
    const start = lyricsHeadingMatch.index + lyricsHeadingMatch[0].length;
    const after = afterFm.slice(start);
    const nextH2 = after.match(/^##\s+(?!#)/m);
    body = nextH2 && nextH2.index !== undefined ? after.slice(0, nextH2.index) : after;
  } else {
    body = afterFm;
  }

  const headingRe = /^###\s+\[([^\]]+)\](?:\s*[—–-]\s*(.+))?$/gm;
  const matches = [...body.matchAll(headingRe)];
  const sections: SongLyrics["sections"] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.index === undefined) continue;
    const label = m[1].trim();
    const note = m[2]?.trim() ?? null;
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? body.length : body.length;
    const sectionBody = body.slice(start, end);

    const lines = sectionBody
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => {
        if (l.startsWith(">") && /^>\s*\(.+\)$/.test(l)) return false;
        return true;
      })
      .map((l) => (l.startsWith(">") ? l.replace(/^>\s?/, "") : l));

    while (lines.length && lines[0] === "") lines.shift();
    while (lines.length && lines[lines.length - 1] === "") lines.pop();

    sections.push({
      type: classifySection(label),
      label,
      note: note ?? undefined,
      lines,
    });
  }

  return { sections };
}
