import { SITE_ORIGIN } from '../locales';

export interface ArticleSchemaProps {
  headline: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  image?: string;
  description?: string;
}

export function ArticleSchema(props: ArticleSchemaProps) {
  const { headline, url, datePublished, dateModified, author, image, description } = props;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished,
    ...(dateModified ? { dateModified } : {}),
    author: { '@type': 'Person', name: author },
    publisher: { '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization` },
    ...(image ? { image } : {}),
    ...(description ? { description } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
