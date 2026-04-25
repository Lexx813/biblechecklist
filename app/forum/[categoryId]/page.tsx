import Link from "next/link";
import { forumApi } from "../../../src/api/forum";
import PublicNav from "../../_components/PublicNav";
import PublicFooter from "../../_components/PublicFooter";

export const revalidate = 60;

// Pre-render all forum categories at build time
export async function generateStaticParams() {
  try {
    const categories = await forumApi.listCategories();
    return categories.map((c) => ({ categoryId: c.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  try {
    const { categoryId } = await params;
    const categories = await forumApi.listCategories();
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return {};
    const name = category.name;
    return {
      title: `${name} | JW Study Forum`,
      description:
        category.description ||
        `Browse discussions in ${name} on JW Study`,
      alternates: {
        canonical: `https://jwstudy.org/forum/${categoryId}`,
      },
      openGraph: {
        title: `${name} | JW Study Forum`,
        description:
          category.description ||
          `Browse discussions in ${name} on JW Study`,
        url: `https://jwstudy.org/forum/${categoryId}`,
      },
    };
  } catch {
    return {};
  }
}

export default async function ForumCategoryPage({ params }) {
  const { categoryId } = await params;

  let category = null;
  let threads: { id: string; title: string; forum_replies?: { count: number }[] }[] = [];
  try {
    const results = await Promise.allSettled([
      forumApi.listCategories(),
      forumApi.listThreads(categoryId, 30, null),
    ]);
    const categories = results[0].status === "fulfilled" ? results[0].value : [];
    category = categories.find((c) => c.id === categoryId) ?? null;
    threads = results[1].status === "fulfilled" ? results[1].value : [];
  } catch {}

  const categoryName = category?.name ?? "Category";
  const categoryDescription = category?.description ?? null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
      { "@type": "ListItem", position: 2, name: "Forum", item: "https://jwstudy.org/forum" },
      { "@type": "ListItem", position: 3, name: categoryName, item: `https://jwstudy.org/forum/${categoryId}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <PublicNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/forum" className="hover:underline">← Forum</Link>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{categoryName}</h1>
        {categoryDescription && (
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">{categoryDescription}</p>
        )}

        {threads.length > 0 ? (
          <ul className="mt-8 divide-y divide-slate-200 rounded-md border border-slate-200 dark:divide-white/10 dark:border-white/10">
            {threads.map((thread) => {
              const replyCount = thread.forum_replies?.[0]?.count ?? 0;
              return (
                <li key={thread.id}>
                  <Link
                    href={`/forum/${categoryId}/${thread.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-violet-50 dark:hover:bg-white/5"
                  >
                    <span className="font-medium">{thread.title}</span>
                    {replyCount > 0 && (
                      <span className="text-xs text-slate-500">{replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-8 text-slate-500">No discussions yet.</p>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
