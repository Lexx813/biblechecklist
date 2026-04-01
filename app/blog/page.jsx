import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { blogApi } from "../../src/api/blog";
import ClientShell from "../_components/ClientShell";

export const revalidate = 120;

export const metadata = {
  title: "Blog | NWT Progress",
  description:
    "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  alternates: { canonical: "https://nwtprogress.com/blog" },
  openGraph: {
    title: "Blog | NWT Progress",
    description:
      "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  },
  twitter: {
    card: "summary",
    title: "Blog | NWT Progress",
    description:
      "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  },
};

const schemaBlog = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://nwtprogress.com/blog",
  name: "NWT Progress Blog",
  description: "Spiritual insights, Bible study articles, and community reflections from the NWT Progress community.",
  url: "https://nwtprogress.com/blog",
  publisher: { "@type": "Organization", "@id": "https://nwtprogress.com/#organization" },
  inLanguage: "en",
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://nwtprogress.com/blog" },
  ],
};

export default async function BlogListPage() {
  const queryClient = new QueryClient();

  await queryClient
    .prefetchQuery({
      queryKey: ["blog", "published", null],
      queryFn: () => blogApi.listPublished(),
    })
    .catch(() => {});

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBlog) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
