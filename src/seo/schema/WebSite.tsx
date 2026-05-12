import { SITE_ORIGIN } from '../locales';
import { safeJsonLd } from '../../lib/safeJsonLd';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  name: 'JW Study',
  url: `${SITE_ORIGIN}/`,
  publisher: { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization` },
  inLanguage: ['en', 'es', 'pt', 'fr', 'tl', 'zh', 'ja', 'ko', 'yo'],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export function WebSiteSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
