export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export interface HowToSchemaProps {
  name: string;
  description?: string;
  steps: HowToStep[];
  totalTime?: string;
}

export function HowToSchema(props: HowToSchemaProps) {
  const { name, description, steps, totalTime } = props;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    ...(description ? { description } : {}),
    ...(totalTime ? { totalTime } : {}),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
