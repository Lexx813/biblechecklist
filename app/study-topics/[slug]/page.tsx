import { notFound } from "next/navigation";
import ClientShell from "../../_components/ClientShell";
import { STUDY_TOPICS, getTopicBySlug } from "../../../src/data/studyTopics";

export const revalidate = false; // static

export async function generateStaticParams() {
  return STUDY_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const topic = getTopicBySlug(params.slug);
  if (!topic) return {};

  const firstParagraph = topic.sections?.[0]?.paragraphs?.[0] ?? "";
  const description = firstParagraph.slice(0, 160) || topic.subtitle;

  return {
    title: `${topic.title} | NWT Progress Bible Study`,
    description,
    alternates: { canonical: `https://nwtprogress.com/study-topics/${topic.slug}` },
    openGraph: {
      title: `${topic.title} | NWT Progress`,
      description,
      type: "article",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.title} | NWT Progress`,
      description,
    },
  };
}

export default function StudyTopicPage({ params }) {
  const topic = getTopicBySlug(params.slug);
  if (!topic) notFound();

  const allParagraphs = topic.sections.flatMap((s) => s.paragraphs);
  const allScriptures = topic.sections.flatMap((s) => s.scriptures ?? []);

  const schemaArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://nwtprogress.com/study-topics/${topic.slug}#article`,
    headline: topic.title,
    description: topic.subtitle,
    articleBody: allParagraphs.join(" "),
    url: `https://nwtprogress.com/study-topics/${topic.slug}`,
    datePublished: "2025-11-01",
    dateModified: "2026-01-01",
    image: "https://nwtprogress.com/og-image.jpg",
    author: {
      "@type": "Organization",
      "@id": "https://nwtprogress.com/#organization",
      name: "NWT Progress",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://nwtprogress.com/#organization",
      name: "NWT Progress",
      logo: {
        "@type": "ImageObject",
        url: "https://nwtprogress.com/icon-512.png",
        width: 512,
        height: 512,
      },
    },
    inLanguage: "en",
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
      { "@type": "ListItem", position: 2, name: "Study Topics", item: "https://nwtprogress.com/study-topics" },
      { "@type": "ListItem", position: 3, name: topic.title, item: `https://nwtprogress.com/study-topics/${topic.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {/* Server-rendered body for SEO — hidden visually, the SPA renders the actual UI */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        <h1>{topic.title}</h1>
        <p>{topic.subtitle}</p>
        {topic.sections.map((section, i) => (
          <section key={i}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
            {section.scriptures?.length > 0 && (
              <ul>
                {section.scriptures.map((s, k) => (
                  <li key={k}><strong>{s.ref}</strong>: {s.text}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <ClientShell />
    </>
  );
}
