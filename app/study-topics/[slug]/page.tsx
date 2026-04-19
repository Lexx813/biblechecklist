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
  const description = (topic.subtitle || firstParagraph).slice(0, 160);

  return {
    title: `${topic.title} | JW Study Bible Study`,
    description,
    alternates: { canonical: `https://jwstudy.org/study-topics/${topic.slug}` },
    openGraph: {
      title: `${topic.title} | JW Study`,
      description,
      type: "article",
      publishedTime: topic.publishedAt,
      modifiedTime: topic.updatedAt,
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
    "@id": `https://jwstudy.org/study-topics/${topic.slug}#article`,
    headline: topic.title,
    description: topic.subtitle,
    articleBody: allParagraphs.join(" "),
    url: `https://jwstudy.org/study-topics/${topic.slug}`,
    datePublished: topic.publishedAt,
    dateModified: topic.updatedAt,
    image: "https://jwstudy.org/og-image.jpg",
    author: {
      "@type": "Person",
      "@id": "https://jwstudy.org/#creator",
      name: "Alexi",
    },
    publisher: {
      "@type": "Organization",
      "@id": "https://jwstudy.org/#organization",
      name: "JW Study",
      logo: {
        "@type": "ImageObject",
        url: "https://jwstudy.org/icon-512.png",
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
      { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
      { "@type": "ListItem", position: 2, name: "Study Topics", item: "https://jwstudy.org/study-topics" },
      { "@type": "ListItem", position: 3, name: topic.title, item: `https://jwstudy.org/study-topics/${topic.slug}` },
    ],
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": topic.sections.map(s => ({
      "@type": "Question",
      "name": s.heading,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": s.paragraphs.join(" ")
      }
    }))
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
      {/* Server-rendered body for SEO — hidden visually, the SPA renders the actual UI */}
      <div style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        <h1>{topic.title}</h1>
        <p>{topic.subtitle}</p>
        <p><small>Written by Alexi, a Jehovah&apos;s Witness and Bible student.</small></p>
        <p className="text-xs text-gray-500 mt-1">{topic.disclaimer}</p>
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
              <a href={`https://jwstudy.org/study-topics/${t.slug}`}>
                {t.title} — {t.subtitle}
              </a>
            </li>
          ))}
        </ul>

        <h2>Explore JW Study</h2>
        <ul>
          <li><a href="https://jwstudy.org/books">All 66 Bible Books</a></li>
          <li><a href="https://jwstudy.org/plans">All Reading Plans</a></li>
          <li><a href="https://jwstudy.org/study-topics">All Study Topics</a></li>
          <li><a href="https://jwstudy.org/blog">JW Study Blog</a></li>
        </ul>
      </div>
      <ClientShell />
    </>
  );
}
