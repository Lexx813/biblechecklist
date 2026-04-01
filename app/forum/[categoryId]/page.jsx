import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { forumApi } from "../../../src/api/forum";
import ClientShell from "../../_components/ClientShell";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  try {
    const categories = await forumApi.listCategories();
    const category = categories.find((c) => c.id === params.categoryId);
    if (!category) return {};
    const name = category.name;
    return {
      title: `${name} | NWT Progress Forum`,
      description:
        category.description ||
        `Browse discussions in ${name} on NWT Progress`,
      openGraph: {
        title: `${name} | NWT Progress Forum`,
        description:
          category.description ||
          `Browse discussions in ${name} on NWT Progress`,
      },
    };
  } catch {
    return {};
  }
}

export default async function ForumCategoryPage({ params }) {
  const queryClient = new QueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["forum", "categories"],
      queryFn: () => forumApi.listCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["forum", "threads", params.categoryId, 20, null],
      queryFn: () => forumApi.listThreads(params.categoryId, 20, null),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientShell />
    </HydrationBoundary>
  );
}
