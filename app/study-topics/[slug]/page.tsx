import { notFound } from "next/navigation";
import ClientShell from "../../_components/ClientShell";
import { STUDY_TOPICS, getTopicBySlug } from "../../../src/data/studyTopics";

export const revalidate = false; // static

export async function generateStaticParams() {
  return STUDY_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};

  const firstParagraph = topic.sections?.[0]?.paragraphs?.[0] ?? "";
  const description = firstParagraph.slice(0, 160) || topic.subtitle;

  return {
    title: `${topic.title} | JW Study Bible Study`,
    description,
    alternates: { canonical: `https://nwtprogress.com/study-topics/${topic.slug}` },
    openGraph: {
      title: `${topic.title} | JW Study`,
      description,
      type: "article",
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${topic.title} | JW Study`,
      description,
    },
  };
}

export default async function StudyTopicPage({ params }) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const allParagraphs = topic.sections.flatMap((s) => s.paragraphs);
  const otherTopics = STUDY_TOPICS.filter((t) => t.slug !== topic.slug);

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
      name: "JW Study",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://nwtprogress.com/#organization",
      name: "JW Study",
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

        <h2>Keep Studying with JW Study</h2>
        <p>
          JW Study is a free Bible reading tracker for Jehovah&apos;s Witnesses. Read {topic.title} in the
          New World Translation, take personal study notes, and build a consistent reading habit.
          For deeper research, use the Insight on the Scriptures volumes and publications available
          at wol.jw.org alongside JW Library.
        </p>

        <h2>Other Study Topics</h2>
        <ul>
          {otherTopics.map((t) => (
            <li key={t.slug}>
              <a href={`https://nwtprogress.com/study-topics/${t.slug}`}>
                {t.title} — {t.subtitle}
              </a>
            </li>
          ))}
        </ul>

        <h2>Explore JW Study</h2>
        <ul>
          <li><a href="https://nwtprogress.com/books">All 66 Bible Books</a></li>
          <li><a href="https://nwtprogress.com/plans">All Reading Plans</a></li>
          <li><a href="https://nwtprogress.com/study-topics">All Study Topics</a></li>
          <li><a href="https://nwtprogress.com/blog">JW Study Blog</a></li>
        </ul>
      </div>
      <ClientShell />
    </>
  );
}
