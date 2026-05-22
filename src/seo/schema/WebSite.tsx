import { SITE_ORIGIN } from '../locales';
import { safeJsonLd } from '../../lib/safeJsonLd';

// Sitelinks search box (SearchAction) intentionally omitted: no /search
// route exists, so declaring potentialAction would let Google show a
// search box whose submits would 404.
const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_ORIGIN}/#website`,
  name: 'JW Study',
  url: `${SITE_ORIGIN}/`,
  publisher: { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization` },
  inLanguage: ['en', 'es'],
};

export function WebSiteSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
