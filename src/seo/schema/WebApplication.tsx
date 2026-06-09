import { SITE_ORIGIN } from '../locales';
import { safeJsonLd } from '../../lib/safeJsonLd';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  '@id': `${SITE_ORIGIN}/#webapp`,
  name: 'JW Study',
  description:
    "A spiritual growth companion that teaches Jehovah's Witnesses how to study God's word, with reading tracking, meeting prep, quizzes, AI study tools, and a worldwide community.",
  url: SITE_ORIGIN,
  image: `${SITE_ORIGIN}/og-image.jpg`,
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  browserRequirements: 'Requires JavaScript. Requires a modern browser.',
  // `availability` belongs on Offer, not WebApplication — Google's structured-
  // data validator flags it at the top level. The Offer below already declares
  // it, which is the correct location.
  inLanguage: ['en', 'es', 'pt', 'fr', 'tl', 'zh'],
  screenshot: `${SITE_ORIGIN}/og-image.jpg`,
  featureList:
    'Bible reading progress tracker for all 66 books of the New World Translation, Meeting prep checklists for CLAM and Watchtower study, AI study assistant for deep Bible study, Bible knowledge quizzes with badge rewards, Structured reading plans with streak tracking, Personal study notes tied to any passage or chapter, Community forum, blog, and study groups, Offline support via PWA, 6-language support',
  offers: [
    {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      name: 'Free',
      description:
        'Every feature included: Bible reading tracker, reading plans, study notes, meeting prep, direct messaging, study groups, community forum, blog, and quizzes. Free forever.',
      availability: 'https://schema.org/OnlineOnly',
    },
  ],
};

export function WebApplicationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
