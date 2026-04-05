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
    url: "https://nwtprogress.com/forum",
    title: "Community Forum | NWT Progress",
    description:
      "Join Bible discussions, ask questions, and share insights with the NWT Progress community.",
    images: [{ url: "https://nwtprogress.com/og-image.jpg", width: 1200, height: 630, alt: "NWT Progress — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Forum | NWT Progress",
    description:
      "Join Bible discussions, ask questions, and share insights with the NWT Progress community.",
    images: [{ url: "https://nwtprogress.com/og-image.jpg", width: 1200, height: 630, alt: "NWT Progress — Bible Reading Tracker" }],
  },
};

const schemaForum = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://nwtprogress.com/forum",
  name: "Community Forum | NWT Progress",
  description: "Join Bible discussions, ask questions, and share insights with the NWT Progress community.",
  url: "https://nwtprogress.com/forum",
  publisher: { "@type": "Organization", "@id": "https://nwtprogress.com/#organization" },
  inLanguage: ["en", "es", "pt", "fr", "tl", "zh"],
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
    { "@type": "ListItem", position: 2, name: "Forum", item: "https://nwtprogress.com/forum" },
  ],
};

export default async function ForumIndexPage() {
  const queryClient = new QueryClient();

  const results = await Promise.allSettled([
    forumApi.listCategories(),
    forumApi.listTopThreads(4),
    queryClient.prefetchQuery({ queryKey: ["forum", "categories"], queryFn: () => forumApi.listCategories() }),
    queryClient.prefetchQuery({ queryKey: ["forum", "top", 4],     queryFn: () => forumApi.listTopThreads(4) }),
  ]);
  const categories = results[0].status === "fulfilled" ? results[0].value : [];
  const topThreads = results[1].status === "fulfilled" ? results[1].value : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaForum) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {(categories?.length > 0 || topThreads?.length > 0) && (
        <div id="ssr-fallback" suppressHydrationWarning>
          <h1>NWT Progress Community Forum</h1>
          <p>Join Bible discussions, ask questions, and share insights with Jehovah&apos;s Witnesses worldwide.</p>
          {categories?.length > 0 && (
            <ul>
              {categories.map(cat => (
                <li key={cat.id}>
                  <a href={`/forum/${cat.id}`}><strong>{cat.name}</strong></a>
                  {cat.description && <p>{cat.description}</p>}
                </li>
              ))}
            </ul>
          )}
          {topThreads?.length > 0 && (
            <section>
              <h2>Recent Discussions</h2>
              <ul>
                {topThreads.map(thread => (
                  <li key={thread.id}>
                    <a href={`/forum/${thread.category_id}/${thread.id}`}>{thread.title}</a>
                  </li>
                ))}
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
