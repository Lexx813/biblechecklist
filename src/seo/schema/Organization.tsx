import { SITE_ORIGIN } from '../locales';
import { safeJsonLd } from '../../lib/safeJsonLd';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: 'JW Study',
  url: SITE_ORIGIN,
  logo: {
    '@type': 'ImageObject',
    '@id': `${SITE_ORIGIN}/#logo`,
    url: `${SITE_ORIGIN}/icon-512.png`,
    width: 512,
    height: 512,
    caption: 'JW Study',
  },
  description:
    "A spiritual growth companion for Jehovah's Witnesses: Bible reading tracker, meeting prep, study tools, and worldwide community.",
  email: 'support@jwstudy.org',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@jwstudy.org',
    contactType: 'customer service',
    availableLanguage: ['English', 'Spanish', 'Portuguese', 'French', 'Tagalog', 'Chinese'],
  },
  sameAs: [
    'https://www.tiktok.com/@laqjw',
    'https://www.facebook.com/lexx.seise',
    'https://www.instagram.com/lexx813/',
  ],
  // Inline the Person rather than a bare @id ref. The Person node only lives
  // on /about; referencing /#creator from every page would leave a dangling
  // @id everywhere except /about. Inline keeps the entity graph self-contained
  // on each page while the canonical Person URL on /about is still emitted.
  founder: {
    '@type': 'Person',
    '@id': `${SITE_ORIGIN}/#creator`,
    name: 'Alexi',
    url: `${SITE_ORIGIN}/about`,
  },
};

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
