// Wrap @username occurrences in rendered HTML with highlight spans
export function renderMentions(html) {
  if (!html) return html;
  return html.replace(/@([\w.-]+)/g, '<span class="mention-highlight">@$1</span>');
}

// Extract unique @username strings from plain text
export function extractMentions(text) {
  if (!text) return [];
  const matches = text.match(/@([\w.-]+)/g) ?? [];
  return [...new Set(matches.map(m => m.slice(1)))];
}
