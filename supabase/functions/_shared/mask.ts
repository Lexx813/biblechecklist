/**
 * Mask an email address for logging so full PII isn't persisted in edge-function logs.
 * "alice@example.com" -> "a***@example.com"
 * "lo@ex.com"         -> "l***@ex.com"
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "[none]";
  const s = String(email);
  const at = s.indexOf("@");
  if (at <= 0) return "[invalid]";
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}
