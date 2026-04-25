import Link from "next/link";
import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";
import { STUDY_TOPICS } from "../../src/data/studyTopics";

export const revalidate = false; // static

export const metadata = {
  title: "Bible Study Topics | JW Study",
  description:
    "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
  alternates: {
    canonical: "https://jwstudy.org/study-topics",
    languages: { en: "https://jwstudy.org/study-topics", "x-default": "https://jwstudy.org/study-topics" },
  },
  openGraph: {
    title: "Bible Study Topics | JW Study",
    description:
      "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bible Study Topics | JW Study",
    description:
      "Explore key Bible topics from the New World Translation perspective — including the nature of God, Jesus, the soul, death, God's Kingdom, and more.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
    { "@type": "ListItem", position: 2, name: "Study Topics", item: "https://jwstudy.org/study-topics" },
  ],
};

const schemaItemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": "https://jwstudy.org/study-topics#list",
  name: "Bible Study Topics",
  itemListElement: STUDY_TOPICS.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://jwstudy.org/study-topics/${t.slug}`,
    name: t.title,
  })),
};

export default function StudyTopicsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      <PublicNav />

      <header className="border-b border-slate-200 bg-violet-50/50 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            {STUDY_TOPICS.length} topics
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Bible study topics
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Doctrinal explanations grounded in the New World Translation, with scripture references throughout.
          </p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ul className="grid gap-x-5 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {STUDY_TOPICS.map((topic, i) => (
            <li key={topic.slug}>
              <Link
                href={`/study-topics/${topic.slug}`}
                className="group flex h-full flex-col rounded-md border border-slate-200 p-5 transition hover:border-violet-400 hover:shadow-[0_8px_32px_-12px_rgba(124,58,237,0.25)] dark:border-white/10"
              >
                <div className="font-mono text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h2 className="mt-2 text-lg font-semibold leading-tight tracking-tight text-slate-900 group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300">
                  {topic.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300">{topic.subtitle}</p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-violet-700 opacity-0 transition group-hover:opacity-100 dark:text-violet-300">
                  Read
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <PublicFooter />
    </>
  );
}

export async function generateStaticParams() {
  return STUDY_TOPICS.map((t) => ({ slug: t.slug }));
}
