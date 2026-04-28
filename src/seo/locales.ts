// SEO locales = languages with shipped, crawlable content (blog, study topics,
// etc. exist in this language). Distinct from the UI translation set, which
// covers EN/ES/PT/FR/TL/ZH but where most non-EN/ES content falls back to EN.
// Adding a locale here without shipped content creates thin-content + hreflang
// mismatch flags, so keep this narrow until translations land.
export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const SITE_ORIGIN = 'https://jwstudy.org';
