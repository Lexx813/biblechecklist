export interface ProfilePageSchemaProps {
  name: string;
  url: string;
  description?: string;
  image?: string;
}

export function ProfilePageSchema(props: ProfilePageSchemaProps) {
  const { name, url, description, image } = props;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name,
      url,
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
