import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { blogApi } from "../../src/api/blog";
import ClientShell from "../_components/ClientShell";

export const revalidate = 120;

export const metadata = {
  title: "Bible Study Blog for Jehovah's Witnesses | JW Study",
  description:
    "Spiritual insights, Bible study articles, scripture reflections, and community encouragement for Jehovah's Witnesses and NWT readers.",
  alternates: { canonical: "https://jwstudy.org/blog" },
  openGraph: {
    url: "https://jwstudy.org/blog",
    title: "Bible Study Blog for Jehovah's Witnesses | JW Study",
    description:
      "Spiritual insights, Bible study articles, scripture reflections, and community encouragement for Jehovah's Witnesses and NWT readers.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bible Study Blog for Jehovah's Witnesses | JW Study",
    description:
      "Spiritual insights, Bible study articles, scripture reflections, and community encouragement for Jehovah's Witnesses and NWT readers.",
    images: [{ url: "https://jwstudy.org/og-image.jpg", width: 1200, height: 630, alt: "JW Study — Bible Reading Tracker" }],
  },
};

const schemaBlog = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": "https://jwstudy.org/blog",
  name: "JW Study Blog",
  description: "Spiritual insights, Bible study articles, and community reflections from the JW Study community.",
  url: "https://jwstudy.org/blog",
  publisher: { "@type": "Organization", "@id": "https://jwstudy.org/#organization" },
  inLanguage: "en",
};

const schemaBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://jwstudy.org" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://jwstudy.org/blog" },
  ],
};

export default async function BlogListPage() {
  const queryClient = new QueryClient();

  const results = await Promise.allSettled([
    blogApi.listPublished(),
    queryClient.prefetchQuery({
      queryKey: ["blog", "published", null],
      queryFn: () => blogApi.listPublished(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["blog", "featured"],
      queryFn: () => blogApi.getFeaturedPost(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["blog", "trending"],
      queryFn: () => blogApi.getTrendingPosts(),
    }),
  ]);
  const posts = results[0].status === "fulfilled" ? (results[0].value ?? []) : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBlog) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {posts?.length > 0 && (
        <noscript>
          <h1>JW Study Blog</h1>
          <p>Spiritual insights, Bible study articles, and community reflections.</p>
          <ul>
            {posts.map(post => (
              <li key={post.slug}>
                <a href={`/blog/${post.slug}`}><strong>{post.title}</strong></a>
                {post.excerpt && <p>{post.excerpt}</p>}
              </li>
            ))}
          </ul>
        </noscript>
      )}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
