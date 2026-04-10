import { notFound } from "next/navigation";
import ClientShell from "../../_components/ClientShell";
import { BOOKS, OT_COUNT } from "../../../src/data/books";
import { BOOK_INFO } from "../../../src/data/bookInfo";
import { PLAN_TEMPLATES } from "../../../src/data/readingPlanTemplates";
import { STUDY_TOPICS } from "../../../src/data/studyTopics";

export const revalidate = false;

const BASE = "https://jwstudy.org";
const SEO_HIDE = {
  position: "absolute" as const, width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};

function bookToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function getBook(slug) {
  const idx = BOOKS.findIndex((b) => bookToSlug(b.name) === slug);
  if (idx === -1) return null;
  return { ...BOOKS[idx], ...BOOK_INFO[idx], index: idx };
}

// Plans that include this book index
function plansForBook(bookIndex) {
  return PLAN_TEMPLATES.filter((p) => p.bookIndices.includes(bookIndex));
}

export async function generateStaticParams() {
  return BOOKS.map((b) => ({ book: bookToSlug(b.name) }));
}

export async function generateMetadata({ params }) {
  const { book: slug } = await params;
  const book = getBook(slug);
  if (!book) return {};

  const description = `${book.summary.slice(0, 130)} Track your ${book.name} reading with JW Study.`;

  return {
    title: `Book of ${book.name} — NWT Study Guide | JW Study`,
    description,
    alternates: { canonical: `${BASE}/books/${slug}` },
    openGraph: {
      title: `Book of ${book.name} — NWT Study Guide | JW Study`,
      description,
      type: "article",
      url: `${BASE}/books/${slug}`,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Book of ${book.name} | JW Study`,
      description,
    },
  };
}

export default async function BookPage({ params }) {
  const { book: slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  const testament = book.index < OT_COUNT ? "Hebrew Scriptures" : "Christian Greek Scriptures";
  const relatedPlans = plansForBook(book.index);
  const prevBook = book.index > 0 ? BOOKS[book.index - 1] : null;
  const nextBook = book.index < BOOKS.length - 1 ? BOOKS[book.index + 1] : null;

  // Full article body for schema — all paragraphs concatenated
  const articleBody = [
    book.summary,
    `The book of ${book.name} contains ${book.chapters} chapters and belongs to the ${testament}. It was written by ${book.author} approximately ${book.date}. The central theme of ${book.name} is ${book.theme.toLowerCase()}.`,
    ...book.notablePassages.map((p) => `${p.ref}: ${p.note}`),
    ...book.questions,
  ].join(" ");

  const schemaArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE}/books/${slug}#article`,
    headline: `Book of ${book.name} — NWT Study Guide`,
    description: book.summary,
    articleBody,
    url: `${BASE}/books/${slug}`,
    datePublished: "2025-11-01",
    dateModified: "2026-04-01",
    image: "https://jwstudy.org/og-image.jpg",
    author: {
      "@type": "Organization",
      "@id": "https://jwstudy.org/#organization",
      name: "JW Study",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
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
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Bible Books", item: `${BASE}/books` },
      { "@type": "ListItem", position: 3, name: `Book of ${book.name}`, item: `${BASE}/books/${slug}` },
    ],
  };

  // FAQ schema built from the book's study questions
  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: book.questions.map((q) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Discover the answer in the book of ${book.name}. Read ${book.name} in the New World Translation and track your study with JW Study.`,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
      <div style={SEO_HIDE}>
        <h1>Book of {book.name} — New World Translation Study Guide</h1>
        <p>
          <strong>Testament:</strong> {testament} · <strong>Chapters:</strong> {book.chapters} ·{" "}
          <strong>Written by:</strong> {book.author} · <strong>Approximate date:</strong> {book.date} ·{" "}
          <strong>Theme:</strong> {book.theme}
        </p>

        <h2>Summary of the Book of {book.name}</h2>
        <p>{book.summary}</p>
        <p>
          The book of {book.name} is part of the {testament} and contains {book.chapters}{" "}
          chapters. It was written by {book.author} approximately {book.date}. The central theme
          running throughout {book.name} is {book.theme.toLowerCase()} — a foundational message
          for Jehovah&apos;s people as they pursue pure worship and grow in knowledge of
          Jehovah&apos;s purposes.
        </p>

        <h2>Key Verses in {book.name}</h2>
        <ul>
          {book.keyVerses.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>

        <h2>Notable Passages in {book.name}</h2>
        {book.notablePassages.map((p) => (
          <div key={p.ref}>
            <h3>{p.ref}</h3>
            <p>{p.note}</p>
          </div>
        ))}

        <h2>Study Questions for {book.name}</h2>
        <p>
          As you read the book of {book.name}, reflect on these questions to deepen your
          understanding and appreciation of Jehovah&apos;s Word:
        </p>
        <ol>
          {book.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>

        <h2>How to Study {book.name} with JW Study</h2>
        <p>
          JW Study is a free Bible reading tracker built for Jehovah&apos;s Witnesses. Track
          your progress through all {book.chapters} chapters of {book.name} in the New World
          Translation, mark completed chapters, take personal study notes, and build a consistent
          daily Bible reading habit. Use it alongside JW Library and the publications available at{" "}
          wol.jw.org to deepen your understanding of Jehovah&apos;s Word.
        </p>
        <p>
          Consider reading {book.name} as part of your personal study routine, family worship
          night, or alongside the weekly meeting schedule. Taking notes on each chapter helps you
          retain key points and apply the lessons in your ministry.
        </p>

        {relatedPlans.length > 0 && (
          <>
            <h2>Reading Plans That Include {book.name}</h2>
            <p>
              The book of {book.name} is covered in the following structured reading plans on NWT
              Progress. Each plan divides the reading evenly across a set number of days to help
              you stay consistent.
            </p>
            <ul>
              {relatedPlans.map((p) => (
                <li key={p.key}>
                  <a href={`${BASE}/plans/${p.key}`}>
                    {p.name} — {p.description} ({p.totalDays} days, {p.totalChapters} chapters)
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2>Related Bible Study Topics</h2>
        <p>
          Deepen your study of the Bible with these related topics from JW Study:
        </p>
        <ul>
          {STUDY_TOPICS.map((t) => (
            <li key={t.slug}>
              <a href={`${BASE}/study-topics/${t.slug}`}>
                {t.title} — {t.subtitle}
              </a>
            </li>
          ))}
        </ul>

        <h2>Continue Reading the {testament}</h2>
        <ul>
          {prevBook && (
            <li>
              Previous book:{" "}
              <a href={`${BASE}/books/${bookToSlug(prevBook.name)}`}>
                Book of {prevBook.name}
              </a>
            </li>
          )}
          {nextBook && (
            <li>
              Next book:{" "}
              <a href={`${BASE}/books/${bookToSlug(nextBook.name)}`}>
                Book of {nextBook.name}
              </a>
            </li>
          )}
          <li>
            <a href={`${BASE}/books`}>All 66 Bible Books</a>
          </li>
          <li>
            <a href={`${BASE}/plans`}>All Reading Plans</a>
          </li>
          <li>
            <a href={`${BASE}/blog`}>JW Study Blog</a>
          </li>
        </ul>
      </div>
      <ClientShell />
    </>
  );
}
