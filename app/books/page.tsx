// @ts-nocheck
import ClientShell from "../_components/ClientShell";
import { BOOKS, OT_COUNT } from "../../src/data/books";

export const revalidate = false;

const BASE = "https://nwtprogress.com";
const SEO_HIDE = {
  position: "absolute", width: 1, height: 1,
  overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};

function bookToSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const metadata = {
  title: "All 66 Books of the Bible — NWT Study Guides | NWT Progress",
  description:
    "Explore study guides for all 66 books of the New World Translation — from Genesis to Revelation. Key themes, key verses, and reading plans for every book.",
  alternates: { canonical: `${BASE}/books` },
  openGraph: {
    title: "All 66 Bible Books — NWT Study Guides | NWT Progress",
    description:
      "Study guides for every book of the New World Translation. Track your reading progress with NWT Progress.",
    images: [{ url: "/og-image.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All 66 Bible Books — NWT Study Guides | NWT Progress",
    description: "Study guides for every book of the New World Translation.",
  },
};

export default function BooksPage() {
  const hebrewBooks = BOOKS.slice(0, OT_COUNT);
  const greekBooks = BOOKS.slice(OT_COUNT);

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "All 66 Books of the Bible — NWT Study Guides",
    description: "Study guides for every book in the New World Translation",
    url: `${BASE}/books`,
    numberOfItems: 66,
    itemListElement: BOOKS.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Book of ${b.name}`,
      url: `${BASE}/books/${bookToSlug(b.name)}`,
    })),
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Bible Books", item: `${BASE}/books` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <div style={SEO_HIDE}>
        <h1>All 66 Books of the Bible — NWT Study Guides</h1>
        <p>
          Explore study guides for every book in the New World Translation. Track your reading
          progress through all 66 books with NWT Progress — the free Bible reading tracker for
          Jehovah&apos;s Witnesses.
        </p>

        <h2>Hebrew Scriptures (Old Testament) — 39 Books</h2>
        <ul>
          {hebrewBooks.map((b) => (
            <li key={b.name}>
              <a href={`/books/${bookToSlug(b.name)}`}>
                {b.name} ({b.chapters} chapters)
              </a>
            </li>
          ))}
        </ul>

        <h2>Christian Greek Scriptures (New Testament) — 27 Books</h2>
        <ul>
          {greekBooks.map((b) => (
            <li key={b.name}>
              <a href={`/books/${bookToSlug(b.name)}`}>
                {b.name} ({b.chapters} chapters)
              </a>
            </li>
          ))}
        </ul>

        <h2>About NWT Progress</h2>
        <p>
          NWT Progress is a free Bible reading tracker built specifically for Jehovah&apos;s
          Witnesses. Track your reading through every chapter of the New World Translation, follow
          structured reading plans, take study notes, and connect with fellow publishers in your
          congregation.
        </p>
      </div>
      <ClientShell />
    </>
  );
}
