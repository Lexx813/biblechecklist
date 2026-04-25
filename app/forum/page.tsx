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

      <header className="border-b border-slate-200 bg-violet-50/50 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Community
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Forum
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Bible discussions, questions, and insights from publishers worldwide.
            Aligned with JW publications and the New World Translation.
          </p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {categories?.length > 0 && (
            <section className="lg:col-span-2">
              <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Categories</h2>
                <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">{categories.length} total</span>
              </div>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/forum/${cat.id}`}
                      className="group flex h-full flex-col rounded-md border border-slate-200 p-5 transition hover:border-violet-400 hover:bg-violet-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <h3 className="font-semibold text-slate-900 group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{cat.description}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <aside className="lg:col-span-1">
            {topThreads?.length > 0 && (
              <>
                <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4 dark:border-white/10">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Recent</h2>
                </div>
                <ul className="mt-6 space-y-2">
                  {topThreads.map((thread) => (
                    <li key={thread.id}>
                      <Link
                        href={`/forum/${thread.category_id}/${thread.id}`}
                        className="group block rounded-md border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-violet-50 dark:hover:border-white/10 dark:hover:bg-white/5"
                      >
                        <span className="line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-violet-700 dark:text-slate-200 dark:group-hover:text-violet-300">
                          {thread.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="mt-10 rounded-md border border-violet-200/70 bg-violet-50/50 p-5 dark:border-violet-500/20 dark:bg-violet-950/20">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Open the app to post, reply, and follow categories.
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
              >
                Sign in
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
