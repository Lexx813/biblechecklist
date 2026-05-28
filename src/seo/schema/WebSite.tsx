import { SITE_ORIGIN } from '../locales';
import { safeJsonLd } from '../../lib/safeJsonLd';

// SearchAction targets /search?q=… — the SPA search route resolves the query
// param and renders semantic search results. This unlocks the Google sitelinks
// search box.
const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  name: 'JW Study',
  alternateName: 'jwstudy.org',
  url: `${SITE_ORIGIN}/`,
  publisher: { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization` },
  inLanguage: ['en', 'es'],
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
