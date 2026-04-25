import { SITE_ORIGIN } from '../locales';

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
    "A spiritual growth companion for Jehovah's Witnesses — Bible reading tracker, meeting prep, study tools, and worldwide community.",
  email: 'support@jwstudy.org',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@jwstudy.org',
    contactType: 'customer service',
    availableLanguage: ['English', 'Spanish', 'Portuguese', 'French', 'Tagalog', 'Chinese', 'Japanese'],
  },
};

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
