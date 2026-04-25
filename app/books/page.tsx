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

      <header className="border-b border-slate-200 bg-violet-50/50 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            66 books · NWT
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Every book of the Bible
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Study guides for all 66 books of the New World Translation. Key themes, key verses,
            and the reading plans that cover each one.
          </p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <BookSection
          eyebrow="Hebrew Scriptures"
          count={39}
          books={hebrewBooks}
        />

        <BookSection
          eyebrow="Christian Greek Scriptures"
          count={27}
          books={greekBooks}
          className="mt-16"
        />

        <section className="mt-20 rounded-md border border-violet-200/70 bg-violet-50/50 p-6 sm:p-8 dark:border-violet-500/20 dark:bg-violet-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
                Track your progress
              </div>
              <p className="mt-2 text-base text-slate-700 dark:text-slate-300">
                Mark each chapter, build a streak, take notes — free, no card required.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 self-start rounded-md bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 sm:self-auto"
            >
              Open the tracker
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

function BookSection({
  eyebrow,
  count,
  books,
  className = "",
}: {
  eyebrow: string;
  count: number;
  books: typeof BOOKS;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            {eyebrow}
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {count} books
          </h2>
        </div>
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {books.map((b, i) => (
          <li key={b.name}>
            <Link
              href={`/books/${bookToSlug(b.name)}`}
              className="group flex items-baseline justify-between gap-2 rounded-md border border-slate-200 px-3 py-2.5 transition hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <span className="flex items-baseline gap-2.5">
                <span className="font-mono text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-semibold text-slate-900 group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300">
                  {b.name}
                </span>
              </span>
              <span className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                {b.chapters}ch
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
