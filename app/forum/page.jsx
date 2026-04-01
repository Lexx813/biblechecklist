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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaForum) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
