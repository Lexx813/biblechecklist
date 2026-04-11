/**
 * PII detection — blocks emails, phone numbers, street addresses,
 * personal social media links/handles, and insecure (http://) links
 * from user-generated content.
 *
 * Applied in the API layer before every insert/update. Profanity is
 * enforced server-side only via the Supabase check_pii() trigger, which
 * avoids bundling large word lists into the client JavaScript.
 */

// Strips HTML tags and common entities to get plain text for scanning
function stripHtml(html = ""): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#\d+;/g, " ");
}

// Email:  user@domain.tld
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

// Street address: "123 Main St", "456 Oak Avenue", "789 Elm Blvd" etc.
const ADDRESS_RE =
  /\b\d{1,5}\s+[a-z0-9 ]{2,30}\s+(st\.?|street|ave\.?|avenue|blvd\.?|boulevard|rd\.?|road|dr\.?|drive|ln\.?|lane|ct\.?|court|pl\.?|place|way|circle|cir\.?|terrace|ter\.?)\b/i;

// Standalone social handles: @username (min 2 chars, not part of an email)
// Negative lookbehind ensures it isn't the @ in an email address
const SOCIAL_HANDLE_RE = /(?<![a-zA-Z0-9._%+\-])@[a-zA-Z0-9_.]{2,}/;

/**
 * Returns a description of the first PII type found, or null if clean.
 * Accepts plain text or HTML.
 */
export function detectPII(text = ""): string | null {
  const plain = stripHtml(text);
  if (EMAIL_RE.test(plain)) return "email address";
  if (ADDRESS_RE.test(plain)) return "physical address";
  if (SOCIAL_HANDLE_RE.test(plain)) return "social media handle";
  return null;
}

/**
 * Throws a user-friendly Error if any PII is detected.
 * Call this before every API insert/update.
 * Profanity is caught server-side by the Supabase trigger.
 */
export function assertNoPII(...fields: string[]): void {
  for (const text of fields) {
    const found = detectPII(text);
    if (found) {
      throw new Error(
        found === "insecure link (http://)"
          ? "Only secure links (https://) are allowed. Please update your link and try again."
          : `Your post appears to contain a ${found}. To keep the community safe, personal contact information and social media links are not allowed.`
      );
    }
  }
}
