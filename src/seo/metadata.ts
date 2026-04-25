import type { Metadata } from 'next';
import { SITE_ORIGIN, DEFAULT_LOCALE, type Locale } from './locales';

export interface BuildMetadataInput {
  route: string;
  title: string;
  description: string;
  ogImage?: string;
  ogImageAlt?: string;
  locale?: Locale;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  noindex?: boolean;
  /**
   * Opt-in hreflang. Provide a map of locale → absolute URL when a route has
   * genuinely per-locale URLs (e.g. paired blog posts). Omit when the same
   * URL serves all locales (most routes — i18n is client-side via i18next).
   * `x-default` is auto-derived from `localizedPaths.en` if not provided.
   */
  localizedPaths?: Partial<Record<Locale | 'x-default', string>>;
}

const DEFAULT_OG_IMAGE = '/og-image.jpg';
const DEFAULT_OG_ALT = 'JW Study — Bible Reading Tracker';
const SITE_NAME = 'JW Study';

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    route,
    title,
    description,
    ogImage = DEFAULT_OG_IMAGE,
    ogImageAlt = DEFAULT_OG_ALT,
    locale = DEFAULT_LOCALE,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors,
    noindex,
    localizedPaths,
  } = input;

  const path = route.startsWith('/') ? route : `/${route}`;
  const canonical = `${SITE_ORIGIN}${path}`;

  const languages = localizedPaths
    ? {
        ...localizedPaths,
        ...(localizedPaths['x-default'] || !localizedPaths.en
          ? {}
          : { 'x-default': localizedPaths.en }),
      }
    : undefined;

  const meta: Metadata = {
    metadataBase: new URL(SITE_ORIGIN),
    title,
    description,
    alternates: {
      canonical,
      ...(languages ? { languages } : {}),
    },
    openGraph: {
      type,
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogImageAlt }],
      ...(type === 'article' && publishedTime ? { publishedTime } : {}),
      ...(type === 'article' && modifiedTime ? { modifiedTime } : {}),
      ...(type === 'article' && authors ? { authors } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: ogImage, alt: ogImageAlt }],
    },
    robots: noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  };

  return meta;
}
