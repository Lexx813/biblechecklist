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
      alternates: { canonical: `https://nwtprogress.com/forum/${params.categoryId}/${params.threadId}` },
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

  const [thread] = await Promise.all([
    forumApi.getThread(params.threadId).catch(() => null),
    queryClient
      .prefetchQuery({
        queryKey: ["forum", "thread", params.threadId],
        queryFn: () => forumApi.getThread(params.threadId),
      })
      .catch(() => {}),
    queryClient
      .prefetchQuery({
        queryKey: ["forum", "replies", params.threadId],
        queryFn: () => forumApi.listReplies(params.threadId),
      })
      .catch(() => {}),
    queryClient
      .prefetchQuery({
        queryKey: ["forum", "categories"],
        queryFn: () => forumApi.listCategories(),
      })
      .catch(() => {}),
  ]);

  const threadUrl = `https://nwtprogress.com/forum/${params.categoryId}/${params.threadId}`;

  const schemaPosting = thread
    ? {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        "@id": `${threadUrl}#posting`,
        headline: thread.title,
        text: stripHtml(thread.content).slice(0, 500),
        datePublished: thread.created_at,
        dateModified: thread.updated_at ?? thread.created_at,
        url: threadUrl,
        author: thread.profiles?.display_name
          ? { "@type": "Person", name: thread.profiles.display_name }
          : undefined,
        publisher: {
          "@type": "Organization",
          "@id": "https://nwtprogress.com/#organization",
          name: "NWT Progress",
        },
      }
    : null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
      { "@type": "ListItem", position: 2, name: "Forum", item: "https://nwtprogress.com/forum" },
      ...(thread ? [{ "@type": "ListItem", position: 3, name: thread.title, item: threadUrl }] : []),
    ],
  };

  return (
    <>
      {schemaPosting && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaPosting) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {thread && (
        <div id="ssr-fallback">
          <article>
            <h1>{thread.title}</h1>
            {thread.profiles?.display_name && <p>Posted by {thread.profiles.display_name}</p>}
            {thread.content && (
              <div dangerouslySetInnerHTML={{ __html: thread.content }} />
            )}
          </article>
        </div>
      )}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var e=document.getElementById('ssr-fallback');if(e)e.style.display='none';}())` }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
