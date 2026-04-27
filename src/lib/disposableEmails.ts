/**
 * Mirror of the disposable-email blocklist enforced by the
 * `block_disposable_email_signup` Postgres trigger on `auth.users`.
 *
 * Kept client-side so the user gets an inline "this provider isn't supported"
 * error before submitting, instead of Supabase's generic "Database error
 * saving new user" — which is what auth surfaces when any BEFORE INSERT
 * trigger raises.
 *
 * If you add a domain to `public.blocked_email_domains` in the DB, mirror
 * it here too. Out-of-sync = the only failure mode here is "we let a domain
 * through client-side that the DB then rejects" — same UX bug we're fixing,
 * not a security gap.
 */

const DISPOSABLE_DOMAINS = new Set<string>([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.com",
  "tempmail.io",
  "tempmail.net",
  "tempmailo.com",
  "tmpmail.org",
  "tmpmail.net",
  "yopmail.com",
  "yopmail.net",
  "throwaway.email",
  "maildrop.cc",
  "getairmail.com",
  "trashmail.com",
  "trashmail.de",
  "dispostable.com",
  "mailnesia.com",
  "mintemail.com",
  "emailondeck.com",
  "moakt.com",
  "mohmal.com",
  "getnada.com",
  "nada.email",
  "mail.tm",
  "spam4.me",
  "fakemail.net",
  "fakeinbox.com",
  "fakermail.com",
  "discard.email",
  "discardmail.com",
  "mailcatch.com",
  "mt2015.com",
  "inboxbear.com",
  "mvrht.com",
  "boximail.com",
  "emltmp.com",
  "etranquil.com",
  "harakirimail.com",
  "mailpoof.com",
  "emailfake.com",
  "emailtemporanea.net",
  "emkei.cz",
  "mailforspam.com",
  "inboxkitten.com",
  "byom.de",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "byebyemail.com",
  "cool.fr.nf",
  "jetable.fr.nf",
  "nospam.ze.tc",
  "nomail.xl.cx",
]);

export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}
