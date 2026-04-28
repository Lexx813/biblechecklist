import { notFound } from "next/navigation";
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
    alternates: {
      canonical: `https://jwstudy.org/study-topics/${topic.slug}`,
      languages: {
        en: `https://jwstudy.org/study-topics/${topic.slug}`,
        "x-default": `https://jwstudy.org/study-topics/${topic.slug}`,
      },
    },
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

  // Only treat real questions (headings ending in "?") as FAQ entries.
  // Wrapping non-question section headings as Q&A risks Google's "deceptive
  // FAQ markup" manual action, so the schema is omitted entirely when no
  // section in the topic is phrased as a question.
  const faqSections = topic.sections.filter(s => s.heading.trim().endsWith("?"));
  const schemaFAQ = faqSections.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqSections.map(s => ({
      "@type": "Question",
      "name": s.heading,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": s.paragraphs.join(" ")
      }
    }))
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {schemaFAQ && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
      )}
      <main className="mx-auto max-w-3xl px-4 py-12 text-[var(--lp-text)] sm:px-6 sm:py-16">
        <nav className="mb-8 text-sm">
          <a href="/" className="text-brand-600 hover:underline">← Home</a>
          {" / "}
          <a href="/study-topics" className="text-brand-600 hover:underline">Study Topics</a>
        </nav>
        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 id={`topic-${topic.slug}`} className="mb-2 text-4xl font-semibold tracking-tight sm:text-5xl">{topic.title}</h1>
          <p className="text-lg text-[var(--lp-muted)]">{topic.subtitle}</p>
          <p className="mt-2 text-sm text-[var(--lp-muted)]">
            <small>
              Written by{" "}
              <a href="/about" className="font-medium text-brand-600 hover:underline">Alexi</a>
              , a Jehovah&apos;s Witness and Bible student. Published{" "}
              <time dateTime={topic.publishedAt}>
                {new Date(topic.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </time>
              {topic.updatedAt && topic.updatedAt !== topic.publishedAt && (
                <>
                  {" · Updated "}
                  <time dateTime={topic.updatedAt}>
                    {new Date(topic.updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </time>
                </>
              )}
              .
            </small>
          </p>
          {topic.disclaimer && (
            <p className="mt-3 text-xs text-[var(--lp-muted)]">{topic.disclaimer}</p>
          )}
          {topic.sections.map((section, i) => {
            const sectionId = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return (
              <section key={i} id={sectionId} className="mt-10">
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
            );
          })}

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
                <a href={`/study-topics/${t.slug}`} className="text-brand-600 hover:underline">
                  {t.title}
                </a>{" "}— {t.subtitle}
              </li>
            ))}
          </ul>

          <h2>Explore JW Study</h2>
          <ul>
            <li><a href="/books" className="text-brand-600 hover:underline">All 66 Bible Books</a></li>
            <li><a href="/plans" className="text-brand-600 hover:underline">All Reading Plans</a></li>
            <li><a href="/study-topics" className="text-brand-600 hover:underline">All Study Topics</a></li>
            <li><a href="/blog" className="text-brand-600 hover:underline">JW Study Blog</a></li>
          </ul>

          <div className="mt-10">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Open JW Study →
            </a>
          </div>
        </article>
      </main>
    </>
  );
}
