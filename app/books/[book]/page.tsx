// @ts-nocheck
import { notFound } from "next/navigation";
import ClientShell from "../../_components/ClientShell";
import { BOOKS, OT_COUNT } from "../../../src/data/books";
import { BOOK_INFO } from "../../../src/data/bookInfo";

export const revalidate = false;

const BASE = "https://nwtprogress.com";
const SEO_HIDE = {
  position: "absolute", width: 1, height: 1,
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

export async function generateStaticParams() {
  return BOOKS.map((b) => ({ book: bookToSlug(b.name) }));
}

export async function generateMetadata({ params }) {
  const { book: slug } = await params;
  const book = getBook(slug);
  if (!book) return {};

  const testament = book.index < OT_COUNT ? "Hebrew Scriptures" : "Christian Greek Scriptures";
  const description = `${book.summary.slice(0, 130)} Track your ${book.name} reading with NWT Progress.`;

  return {
    title: `Book of ${book.name} — NWT Study Guide | NWT Progress`,
    description,
    alternates: { canonical: `${BASE}/books/${slug}` },
    openGraph: {
      title: `Book of ${book.name} — NWT Study Guide | NWT Progress`,
      description,
      type: "article",
      images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Book of ${book.name} | NWT Progress`,
      description,
    },
  };
}

export default async function BookPage({ params }) {
  const { book: slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  const testament = book.index < OT_COUNT ? "Hebrew Scriptures" : "Christian Greek Scriptures";

  const schemaArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE}/books/${slug}#article`,
    headline: `Book of ${book.name} — NWT Study Guide`,
    description: book.summary,
    articleBody: `${book.summary} Written by ${book.author} approximately ${book.date}. Theme: ${book.theme}. Key verses: ${book.keyVerses.join(", ")}. The book of ${book.name} contains ${book.chapters} chapters and is part of the ${testament}.`,
    url: `${BASE}/books/${slug}`,
    datePublished: "2025-11-01",
    dateModified: "2026-01-01",
    image: "https://nwtprogress.com/og-image.webp",
    author: {
      "@type": "Organization",
      "@id": "https://nwtprogress.com/#organization",
      name: "NWT Progress",
    },
    publisher: {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
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
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Bible Books", item: `${BASE}/books` },
      { "@type": "ListItem", position: 3, name: `Book of ${book.name}`, item: `${BASE}/books/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <div style={SEO_HIDE}>
        <h1>Book of {book.name} — NWT Bible Study Guide</h1>
        <p>
          {testament} · {book.chapters} chapters · Written by {book.author} · {book.date} · Theme: {book.theme}
        </p>
        <h2>Summary</h2>
        <p>{book.summary}</p>
        <h2>Key Verses in {book.name}</h2>
        <ul>
          {book.keyVerses.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <h2>How to Study {book.name} with NWT Progress</h2>
        <p>
          NWT Progress is a free Bible reading tracker for Jehovah's Witnesses. Track your progress
          through all {book.chapters} chapters of {book.name} in the New World Translation, mark
          completed chapters, take study notes, and build a consistent daily reading habit.
        </p>
        <p>
          The book of {book.name} is part of the {testament}. You can read it as part of a
          structured reading plan — such as the NWT in 1 Year plan — or study it at your own pace.
        </p>
        <p>
          Join thousands of Jehovah's Witnesses who use NWT Progress to stay consistent with their
          personal Bible reading and family worship.
        </p>
      </div>
      <ClientShell />
    </>
  );
}
