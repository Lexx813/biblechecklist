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

  const [posts] = await Promise.allSettled([
    blogApi.listPublished(),
    queryClient.prefetchQuery({
      queryKey: ["blog", "published", null],
      queryFn: () => blogApi.listPublished(),
    }),
  ]).then(r => r.map(r => r.status === "fulfilled" ? r.value : null));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBlog) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {posts?.length > 0 && (
        <div id="ssr-fallback">
          <h1>NWT Progress Blog</h1>
          <p>Spiritual insights, Bible study articles, and community reflections.</p>
          <ul>
            {posts.map(post => (
              <li key={post.slug}>
                <a href={`/blog/${post.slug}`}><strong>{post.title}</strong></a>
                {post.excerpt && <p>{post.excerpt}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var e=document.getElementById('ssr-fallback');if(e)e.style.display='none';}())` }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
