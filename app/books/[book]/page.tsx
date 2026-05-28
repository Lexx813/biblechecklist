import { notFound } from "next/navigation";
import PublicNav from "../../_components/PublicNav";
import PublicFooter from "../../_components/PublicFooter";
import IndependenceDisclaimer from "../../_components/IndependenceDisclaimer";
import { BOOKS, OT_COUNT } from "../../../src/data/books";
import { BOOK_INFO } from "../../../src/data/bookInfo";
import { BOOK_EXTRAS } from "../../../src/data/bookExtras";
import { PLAN_TEMPLATES } from "../../../src/data/readingPlanTemplates";
import { STUDY_TOPICS } from "../../../src/data/studyTopics";
import { safeJsonLd } from "../../../src/lib/safeJsonLd";

export const revalidate = false;

const BASE = "https://jwstudy.org";
// Set once at build time. The route's revalidate is `false` (build-only),
// so this value pins dateModified to the actual last-deploy timestamp.
const BUILD_DATE_ISO = new Date().toISOString().split("T")[0];

function bookToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function getBook(slug) {
  const idx = BOOKS.findIndex((b) => bookToSlug(b.name) === slug);
  if (idx === -1) return null;
  const name = BOOKS[idx].name;
  return { ...BOOKS[idx], ...BOOK_INFO[idx], ...(BOOK_EXTRAS[name] ?? {}), index: idx };
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
    alternates: {
      canonical: `${BASE}/books/${slug}`,
      languages: { en: `${BASE}/books/${slug}`, "x-default": `${BASE}/books/${slug}` },
    },
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

  const scriptureSection = book.index < OT_COUNT ? "Hebrew Scriptures" : "Christian Greek Scriptures";
  const relatedPlans = plansForBook(book.index);
  const prevBook = book.index > 0 ? BOOKS[book.index - 1] : null;
  const nextBook = book.index < BOOKS.length - 1 ? BOOKS[book.index + 1] : null;

  // Full article body for schema — all paragraphs concatenated, including
  // the hand-written "Why this book matters today" block where present so
  // the schema's articleBody reflects what's actually on the page.
  const whyItMattersToday = (book as { whyItMattersToday?: string }).whyItMattersToday;
  const bookFaqs = ((book as { faqs?: { question: string; answer: string }[] }).faqs) ?? [];
  const articleBody = [
    book.summary,
    ...(whyItMattersToday ? [whyItMattersToday] : []),
    ...book.notablePassages.map((p) => `${p.ref}: ${p.note}`),
    ...book.questions,
    ...bookFaqs.flatMap((f) => [f.question, f.answer]),
  ].join(" ");

  const schemaArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE}/books/${slug}#article`,
    headline: `Book of ${book.name} — NWT Study Guide`,
    description: book.summary,
    articleBody,
    wordCount: articleBody.split(/\s+/).filter(Boolean).length,
    articleSection: scriptureSection,
    keywords: [book.name, "New World Translation", scriptureSection, "Bible study", book.theme].join(", "),
    url: `${BASE}/books/${slug}`,
    datePublished: "2025-11-01",
    // dateModified is the build-time timestamp, not a hardcoded date. The
    // ISR revalidate cadence on this route is `false` (build-only), so this
    // value updates whenever the book content actually changes (a new deploy).
    dateModified: BUILD_DATE_ISO,
    image: {
      "@type": "ImageObject",
      url: "https://jwstudy.org/og-image.jpg",
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Person",
      "@id": `${BASE}/#creator`,
      name: "Alexi",
      url: `${BASE}/about`,
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
    isAccessibleForFree: true,
  };

  // FAQPage schema — only emit when hand-written FAQs exist. Generating
  // identical Q&A across all 66 books would trigger Google's deceptive-FAQ
  // pattern detection.
  const schemaFaq = bookFaqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${BASE}/books/${slug}#faq`,
        mainEntity: bookFaqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Bible Books", item: `${BASE}/books` },
      { "@type": "ListItem", position: 3, name: `Book of ${book.name}`, item: `${BASE}/books/${slug}` },
    ],
  };

  const schemaBook = {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${BASE}/books/${slug}#book`,
    name: book.name,
    alternateName: `Book of ${book.name}`,
    url: `${BASE}/books/${slug}`,
    inLanguage: "en",
    position: book.index + 1,
    isPartOf: {
      "@type": "Book",
      name: "New World Translation of the Holy Scriptures",
      url: "https://www.jw.org/en/library/bible/study-bible/books/",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "JW Study",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaBook) }} />
      {schemaFaq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schemaFaq) }} />
      )}
      <PublicNav />
      <main className="prose prose-slate dark:prose-invert mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="not-prose">
          <IndependenceDisclaimer />
        </div>
        <h1>Book of {book.name} — New World Translation Study Guide</h1>
        <p>
          <strong>Section:</strong> {scriptureSection} · <strong>Chapters:</strong> {book.chapters} ·{" "}
          <strong>Written by:</strong> {book.author} · <strong>Approximate date:</strong> {book.date} ·{" "}
          <strong>Theme:</strong> {book.theme}
        </p>

        <h2>Summary of the Book of {book.name}</h2>
        <p>{book.summary}</p>

        {whyItMattersToday && (
          <>
            <h2>Why the Book of {book.name} Matters Today</h2>
            <p>{whyItMattersToday}</p>
          </>
        )}

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

        {bookFaqs.length > 0 && (
          <>
            <h2>Frequently Asked Questions About {book.name}</h2>
            <dl>
              {bookFaqs.map((f, i) => (
                <div key={i}>
                  <dt><strong>{f.question}</strong></dt>
                  <dd>{f.answer}</dd>
                </div>
              ))}
            </dl>
          </>
        )}

        <h2>How to Study {book.name} with JW Study</h2>
        <p>
          Track your progress through all {book.chapters} chapters of {book.name} in the New
          World Translation, mark completed chapters as you read, save personal notes on key
          passages, and build a consistent daily Bible reading habit. Use it alongside JW Library
          and the publications available at wol.jw.org to deepen your understanding of
          Jehovah&apos;s Word.
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

        <h2>Continue Reading the {scriptureSection}</h2>
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
      </main>
      <PublicFooter />
    </>
  );
}
