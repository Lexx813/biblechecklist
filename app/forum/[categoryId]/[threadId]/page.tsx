import Link from "next/link";
import { forumApi } from "../../../../src/api/forum";
import PublicNav from "../../../_components/PublicNav";
import PublicFooter from "../../../_components/PublicFooter";

export const revalidate = 30;

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }) {
  try {
    const { categoryId, threadId } = await params;
    const thread = await forumApi.getThread(threadId);
    if (!thread) return {};

    const desc =
      stripHtml(thread.content).slice(0, 160) ||
      `Read "${thread.title}" in the JW Study community forum`;

    return {
      title: `${thread.title} | JW Study Forum`,
      description: desc,
      alternates: { canonical: `https://jwstudy.org/forum/${categoryId}/${threadId}` },
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
  const { categoryId, threadId } = await params;

  const [thread, replies] = await Promise.all([
    forumApi.getThread(threadId).catch(() => null),
    forumApi.listReplies(threadId).catch(() => [] as Awaited<ReturnType<typeof forumApi.listReplies>>),
  ]);

  const threadUrl = `https://jwstudy.org/forum/${categoryId}/${threadId}`;

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
          "@id": "https://jwstudy.org/#organization",
          name: "JW Study",
        },
      }
    : null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
      { "@type": "ListItem", position: 2, name: "Forum", item: "https://jwstudy.org/forum" },
      ...(thread ? [{ "@type": "ListItem", position: 3, name: thread.title, item: threadUrl }] : []),
    ],
  };

  return (
    <>
      {schemaPosting && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaPosting) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <PublicNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/forum" className="hover:underline">← Forum</Link>
        </nav>
        {thread ? (
          <>
            <article className="prose prose-slate dark:prose-invert max-w-none">
              <h1>{thread.title}</h1>
              {thread.profiles?.display_name && (
                <p className="not-prose text-sm text-slate-500">Posted by {thread.profiles.display_name}</p>
              )}
              {thread.content && (
                <div dangerouslySetInnerHTML={{ __html: thread.content }} />
              )}
            </article>
            {replies.length > 0 && (
              <section className="mt-10">
                <h2 className="text-lg font-semibold">Replies</h2>
                <ul className="mt-4 space-y-4">
                  {replies.map((r) => (
                    <li key={r.id} className="rounded-md border border-slate-200 p-4 dark:border-white/10">
                      {r.profiles?.display_name && (
                        <div className="mb-2 text-xs text-slate-500">{r.profiles.display_name}</div>
                      )}
                      {r.content && (
                        <div className="prose prose-slate dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: r.content }} />
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="mt-10 text-sm text-slate-500">
              <Link href="/" className="font-semibold text-violet-700 hover:underline dark:text-violet-300">
                Open the app →
              </Link>{" "}
              to reply.
            </p>
          </>
        ) : (
          <p className="text-slate-500">Thread not found.</p>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
