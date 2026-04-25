import Link from "next/link";
import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";
import { BOOKS, OT_COUNT } from "../../src/data/books";

export const revalidate = false;

const BASE = "https://jwstudy.org";

function bookToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const metadata = {
  title: "All 66 Books of the Bible — NWT Study Guides | JW Study",
  description:
    "Explore study guides for all 66 books of the New World Translation — from Genesis to Revelation. Key themes, key verses, and reading plans for every book.",
  alternates: {
    canonical: `${BASE}/books`,
    languages: { en: `${BASE}/books`, "x-default": `${BASE}/books` },
  },
  openGraph: {
    title: "All 66 Bible Books — NWT Study Guides | JW Study",
    description:
      "Study guides for every book of the New World Translation. Track your reading progress with JW Study.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "All 66 Bible Books — NWT Study Guides | JW Study",
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
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All 66 Books of the Bible</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Explore study guides for every book in the New World Translation. Track your reading progress
          through all 66 books with JW Study — the free Bible reading tracker for Jehovah&apos;s Witnesses.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Hebrew Scriptures · 39 Books</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {hebrewBooks.map((b) => (
              <li key={b.name}>
                <Link
                  href={`/books/${bookToSlug(b.name)}`}
                  className="block rounded-md border border-slate-200 px-3 py-2 hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.chapters} chapters</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Christian Greek Scriptures · 27 Books</h2>
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {greekBooks.map((b) => (
              <li key={b.name}>
                <Link
                  href={`/books/${bookToSlug(b.name)}`}
                  className="block rounded-md border border-slate-200 px-3 py-2 hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-slate-500">{b.chapters} chapters</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <p>
            JW Study is a free Bible reading tracker built specifically for Jehovah&apos;s Witnesses.
            Track your reading through every chapter of the New World Translation, follow structured
            reading plans, take study notes, and connect with fellow publishers.
          </p>
          <Link href="/" className="mt-3 inline-block font-semibold text-violet-700 hover:underline dark:text-violet-300">
            Open the tracker →
          </Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
