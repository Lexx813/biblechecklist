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
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Bible Study Topics</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Explore key Bible topics from the New World Translation perspective — covering doctrine,
          prophecy, and practical Christian living.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {STUDY_TOPICS.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={`/study-topics/${topic.slug}`}
                className="block rounded-md border border-slate-200 p-4 hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                <div className="font-semibold">{topic.title}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{topic.subtitle}</div>
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
