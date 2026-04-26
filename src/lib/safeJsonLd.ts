/**
 * Safely serialize an object for embedding inside a <script type="application/ld+json">
 * via dangerouslySetInnerHTML.
 *
 * JSON.stringify escapes quotes/backslashes but does NOT escape `<`, so a string
 * value containing `</script>` would close the host tag and allow HTML injection.
 * Escaping `<` to its Unicode form `<` produces valid JSON that browsers and
 * search-engine crawlers parse identically, but eliminates the script-tag breakout.
 */
export function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
