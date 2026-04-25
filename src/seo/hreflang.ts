import { LOCALES, DEFAULT_LOCALE, SITE_ORIGIN, type Locale } from './locales';

type HreflangMap = Record<Locale | 'x-default', string>;

/**
 * Returns a full hreflang map for a route across every supported locale plus
 * x-default (= the DEFAULT_LOCALE URL). The app's i18n is currently driven by
 * a `?lang=` query string; this is consistent with how blog post pairs are
 * handled in app/sitemap.ts.
 */
export function getHreflangMap(route: string): HreflangMap {
  const path = route.startsWith('/') ? route : `/${route}`;
  const map = {} as HreflangMap;
  for (const loc of LOCALES) {
    const url = loc === DEFAULT_LOCALE ? `${SITE_ORIGIN}${path}` : `${SITE_ORIGIN}${path}?lang=${loc}`;
    map[loc] = url;
  }
  map['x-default'] = `${SITE_ORIGIN}${path}`;
  return map;
}
