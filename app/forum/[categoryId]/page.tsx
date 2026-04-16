import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { forumApi } from "../../../src/api/forum";
import ClientShell from "../../_components/ClientShell";

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
  const queryClient = new QueryClient();

  let category = null;
  let threads: { id: string; title: string; forum_replies?: { count: number }[] }[] = [];
  try {
    const results = await Promise.allSettled([
      forumApi.listCategories(),
      forumApi.listThreads(categoryId, 20, null),
    ]);
    const categories = results[0].status === "fulfilled" ? results[0].value : [];
    category = categories.find((c) => c.id === categoryId) ?? null;
    threads = results[1].status === "fulfilled" ? results[1].value : [];

    // Seed the query cache with already-fetched data
    queryClient.setQueryData(["forum", "categories"], categories);
    queryClient.setQueryData(["forum", "threads", categoryId, 20, null], threads);
  } catch {}

  const categoryName = category?.name ?? null;
  const categoryDescription = category?.description ?? null;

  const schemaBreadcrumb = categoryName ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
      { "@type": "ListItem", position: 2, name: "Forum", item: "https://jwstudy.org/forum" },
      { "@type": "ListItem", position: 3, name: categoryName, item: `https://jwstudy.org/forum/${categoryId}` },
    ],
  } : null;

  return (
    <>
      {schemaBreadcrumb && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      )}
      {(categoryName || threads.length > 0) && (
        <div id="ssr-fallback" suppressHydrationWarning>
          {categoryName && <h1>{categoryName}</h1>}
          {categoryDescription && <p>{categoryDescription}</p>}
          {threads.length > 0 && (
            <section>
              <h2>Discussions</h2>
              <ul>
                {threads.map((thread) => {
                  const replyCount = thread.forum_replies?.[0]?.count ?? 0;
                  return (
                    <li key={thread.id}>
                      <a href={`/forum/${categoryId}/${thread.id}`}>{thread.title}</a>
                      {replyCount > 0 && <span> ({replyCount} {replyCount === 1 ? "reply" : "replies"})</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var e=document.getElementById('ssr-fallback');if(e)e.style.display='none';}())` }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
