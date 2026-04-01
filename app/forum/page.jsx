import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { forumApi } from "../../src/api/forum";
import ClientShell from "../_components/ClientShell";

export const revalidate = 300;

export const metadata = {
  title: "Community Forum | NWT Progress",
  description:
    "Join Bible discussions, ask questions, and share insights with the NWT Progress community.",
  alternates: { canonical: "https://nwtprogress.com/forum" },
  openGraph: {
    title: "Community Forum | NWT Progress",
    description:
      "Join Bible discussions, ask questions, and share insights with the NWT Progress community.",
  },
  twitter: {
    card: "summary",
    title: "Community Forum | NWT Progress",
    description:
      "Join Bible discussions, ask questions, and share insights with the NWT Progress community.",
  },
};

export default async function ForumIndexPage() {
  const queryClient = new QueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["forum", "categories"],
      queryFn: () => forumApi.listCategories(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["forum", "top", 4],
      queryFn: () => forumApi.listTopThreads(4),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientShell />
    </HydrationBoundary>
  );
}
