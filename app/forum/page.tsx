import Link from "next/link";
import { forumApi } from "../../src/api/forum";
import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";

export const revalidate = 300;

export const metadata = {
  title: "Community Forum | JW Study",
  description:
    "Join Bible discussions, ask questions, and share insights with the JW Study community.",
  alternates: { canonical: "https://jwstudy.org/forum" },
  openGraph: {
    url: "https://jwstudy.org/forum",
    title: "Community Forum | JW Study",
    description:
      "Join Bible discussions, ask questions, and share insights with the JW Study community.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Forum | JW Study",
    description:
      "Join Bible discussions, ask questions, and share insights with the JW Study community.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
};

const schemaForum = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://jwstudy.org/forum#collectionpage",
  name: "Community Forum | JW Study",
  description: "Join Bible discussions, ask questions, and share insights with the JW Study community.",
  url: "https://jwstudy.org/forum",
  publisher: { "@type": "Organization", "@id": "https://jwstudy.org/#organization" },
  inLanguage: ["en", "es", "pt", "fr", "tl", "zh"],
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
    { "@type": "ListItem", position: 2, name: "Forum", item: "https://jwstudy.org/forum" },
  ],
};

export default async function ForumIndexPage() {
  const results = await Promise.allSettled([
    forumApi.listCategories(),
    forumApi.listTopThreads(8),
  ]);
  const categories = results[0].status === "fulfilled" ? results[0].value : [];
  const topThreads = results[1].status === "fulfilled" ? results[1].value : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaForum) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Community Forum</h1>
        <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
          Bible discussions, questions, and insights from the JW Study community worldwide.
        </p>

        {categories?.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-semibold">Categories</h2>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/forum/${cat.id}`}
                    className="block rounded-md border border-slate-200 p-4 hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <div className="font-semibold">{cat.name}</div>
                    {cat.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{cat.description}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {topThreads?.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">Recent Discussions</h2>
            <ul className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-white/10 dark:border-white/10">
              {topThreads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/forum/${thread.category_id}/${thread.id}`}
                    className="block px-4 py-3 hover:bg-violet-50 dark:hover:bg-white/5"
                  >
                    <span className="font-medium">{thread.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-sm text-slate-500">
          <Link href="/" className="font-semibold text-violet-700 hover:underline dark:text-violet-300">
            Open the app →
          </Link>{" "}
          to post, reply, and follow categories.
        </p>
      </main>
      <PublicFooter />
    </>
  );
}
