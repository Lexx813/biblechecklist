export interface BookSchemaProps {
  name: string;
  url: string;
  description?: string;
  numberOfPages?: number;
  inLanguage?: string;
  author?: string;
}

export function BookSchema(props: BookSchemaProps) {
  const { name, url, description, numberOfPages, inLanguage, author } = props;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name,
    url,
    ...(description ? { description } : {}),
    ...(numberOfPages ? { numberOfPages } : {}),
    ...(inLanguage ? { inLanguage } : {}),
    ...(author ? { author: { '@type': 'Person', name: author } } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
