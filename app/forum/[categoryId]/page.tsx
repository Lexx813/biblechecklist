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
      title: `${name} | NWT Progress Forum`,
      description:
        category.description ||
        `Browse discussions in ${name} on NWT Progress`,
      alternates: {
        canonical: `https://nwtprogress.com/forum/${categoryId}`,
      },
      openGraph: {
        title: `${name} | NWT Progress Forum`,
        description:
          category.description ||
          `Browse discussions in ${name} on NWT Progress`,
        url: `https://nwtprogress.com/forum/${categoryId}`,
      },
    };
  } catch {
    return {};
  }
}

export default async function ForumCategoryPage({ params }) {
  const { categoryId } = await params;
  const queryClient = new QueryClient();

  let categoryName = null;
  try {
    const categories = await forumApi.listCategories();
    categoryName = categories.find((c) => c.id === categoryId)?.name ?? null;
  } catch {}

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["forum", "categories"],
      queryFn: () => forumApi.listCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["forum", "threads", categoryId, 20, null],
      queryFn: () => forumApi.listThreads(categoryId, 20, null),
    }),
  ]);

  const schemaBreadcrumb = categoryName ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
      { "@type": "ListItem", position: 2, name: "Forum", item: "https://nwtprogress.com/forum" },
      { "@type": "ListItem", position: 3, name: categoryName, item: `https://nwtprogress.com/forum/${categoryId}` },
    ],
  } : null;

  return (
    <>
      {schemaBreadcrumb && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      )}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
