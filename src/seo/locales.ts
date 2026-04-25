export const LOCALES = ['en', 'es', 'pt', 'fr', 'tl', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export const SITE_ORIGIN = 'https://jwstudy.org';
