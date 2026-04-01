import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { forumApi } from "../../../../src/api/forum";
import ClientShell from "../../../_components/ClientShell";

export const revalidate = 30;

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }) {
  try {
    const thread = await forumApi.getThread(params.threadId);
    if (!thread) return {};

    const desc =
      stripHtml(thread.content).slice(0, 160) ||
      `Read "${thread.title}" in the NWT Progress community forum`;

    return {
      title: `${thread.title} | NWT Progress Forum`,
      description: desc,
      openGraph: {
        title: thread.title,
        description: desc,
        type: "article",
        publishedTime: thread.created_at,
        authors: thread.profiles?.display_name
          ? [thread.profiles.display_name]
          : [],
      },
      twitter: {
        card: "summary",
        title: thread.title,
        description: desc,
      },
    };
  } catch {
    return {};
  }
}

export default async function ForumThreadPage({ params }) {
  const queryClient = new QueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["forum", "thread", params.threadId],
      queryFn: () => forumApi.getThread(params.threadId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["forum", "replies", params.threadId],
      queryFn: () => forumApi.listReplies(params.threadId),
    }),
    queryClient.prefetchQuery({
      queryKey: ["forum", "categories"],
      queryFn: () => forumApi.listCategories(),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientShell />
    </HydrationBoundary>
  );
}
