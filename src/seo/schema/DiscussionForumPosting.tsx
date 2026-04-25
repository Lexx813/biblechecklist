export interface DiscussionForumPostingSchemaProps {
  headline: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  author: string;
  text: string;
  commentCount?: number;
}

export function DiscussionForumPostingSchema(props: DiscussionForumPostingSchemaProps) {
  const { headline, url, datePublished, dateModified, author, text, commentCount } = props;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline,
    url,
    datePublished,
    ...(dateModified ? { dateModified } : {}),
    author: { '@type': 'Person', name: author },
    text,
    ...(commentCount != null ? { commentCount } : {}),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
