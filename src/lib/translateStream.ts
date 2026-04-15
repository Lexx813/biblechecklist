export interface TranslationFields {
  title: string;
  excerpt: string;
  content: string;
}

/**
 * Parses Claude's streamed translation output into discrete fields.
 * Works at any point mid-stream — call it after each chunk is appended.
 *
 * Expected format from Claude:
 *   ---TITLE---
 *   [title text]
 *   ---EXCERPT---
 *   [excerpt text]
 *   ---CONTENT---
 *   [full HTML content]
 */
export function parseTranslationStream(text: string): TranslationFields {
  const titleMatch   = text.match(/---TITLE---\n?([\s\S]*?)(?=---EXCERPT---|---CONTENT---|$)/);
  const excerptMatch = text.match(/---EXCERPT---\n?([\s\S]*?)(?=---CONTENT---|$)/);
  const contentMatch = text.match(/---CONTENT---\n?([\s\S]*)$/);

  return {
    title:   titleMatch?.[1]?.trim()   ?? "",
    excerpt: excerptMatch?.[1]?.trim() ?? "",
    content: contentMatch?.[1]         ?? "",
  };
}
