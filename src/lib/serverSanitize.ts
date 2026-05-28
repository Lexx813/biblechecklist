const DANGEROUS_BLOCK_TAGS =
  /<\s*(script|style|iframe|object|embed|svg|math|template|form|input|button|textarea|select|option|link|meta|base)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi;
const DANGEROUS_SINGLE_TAGS =
  /<\s*\/?\s*(script|style|iframe|object|embed|svg|math|template|form|input|button|textarea|select|option|link|meta|base)\b[^>]*>/gi;
const EVENT_HANDLER_ATTRS = /\s+on[a-z0-9:-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const URL_ATTRS = /\s+(href|src|xlink:href|action|formaction)\s*=\s*(["'])(.*?)\2/gi;
const STYLE_ATTRS = /\s+style\s*=\s*(["'])(.*?)\1/gi;
const SAFE_STYLE_PROPS = new Set(["color", "background-color", "text-align", "text-decoration"]);

function decodeHtmlEntities(value: string) {
  return value.replace(/&#(x?[0-9a-f]+);?/gi, (_match, code: string) => {
    const radix = code.toLowerCase().startsWith("x") ? 16 : 10;
    const digits = radix === 16 ? code.slice(1) : code;
    const point = Number.parseInt(digits, radix);
    return Number.isFinite(point) ? String.fromCodePoint(point) : "";
  });
}

function isSafeUrl(rawValue: string) {
  const value = decodeHtmlEntities(rawValue)
    .replace(/[\u0000-\u001f\u007f\s]+/g, "")
    .toLowerCase();
  return !/^(?:javascript|data|vbscript|file):/.test(value);
}

function sanitizeStyle(rawStyle: string) {
  const safe = rawStyle
    .split(";")
    .map((part) => part.split(":"))
    .filter(([property, ...rest]) => {
      const value = rest.join(":").trim().toLowerCase();
      return SAFE_STYLE_PROPS.has(property.trim().toLowerCase()) && !/url\s*\(|expression\s*\(/.test(value);
    })
    .map(([property, ...rest]) => `${property.trim().toLowerCase()}:${rest.join(":").trim()}`)
    .filter(Boolean);

  return safe.length ? ` style="${safe.join(";")}"` : "";
}

/**
 * Server-only rich HTML sanitizer for SSR fallbacks.
 *
 * Browser/app rendering still uses DOMPurify. These public SSR pages only need
 * a conservative pass that avoids Vercel's jsdom/isomorphic-dompurify runtime
 * path while preventing executable markup from landing in dangerouslySetHTML.
 */
export function sanitizeServerRichHtml(html: string | null | undefined) {
  if (!html) return "";
  return html
    .replace(/\u0000/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(DANGEROUS_BLOCK_TAGS, "")
    .replace(DANGEROUS_SINGLE_TAGS, "")
    .replace(EVENT_HANDLER_ATTRS, "")
    .replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(URL_ATTRS, (match, attr: string, quote: string, value: string) =>
      isSafeUrl(value) ? ` ${attr.toLowerCase()}=${quote}${value}${quote}` : "",
    )
    .replace(STYLE_ATTRS, (_match, _quote: string, value: string) => sanitizeStyle(value));
}
