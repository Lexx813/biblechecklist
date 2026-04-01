import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { blogApi } from "../../../src/api/blog";
import ClientShell from "../../_components/ClientShell";

export const revalidate = 60;

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }) {
  try {
    const post = await blogApi.getBySlug(params.slug);
    if (!post) return {};

    const desc =
      post.excerpt ||
      stripHtml(post.content).slice(0, 160) ||
      `Read "${post.title}" on NWT Progress`;

    return {
      title: `${post.title} | NWT Progress`,
      description: desc,
      alternates: { canonical: `https://nwtprogress.com/blog/${post.slug}` },
      openGraph: {
        title: post.title,
        description: desc,
        type: "article",
        publishedTime: post.created_at,
        authors: post.profiles?.display_name ? [post.profiles.display_name] : [],
        images: post.cover_url
          ? [{ url: post.cover_url, width: 1200, height: 630 }]
          : [{ url: "/og-image.webp", width: 1200, height: 630 }],
      },
      twitter: {
        card: post.cover_url ? "summary_large_image" : "summary",
        title: post.title,
        description: desc,
        images: post.cover_url ? [post.cover_url] : [],
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }) {
  const queryClient = new QueryClient();

  const [post] = await Promise.all([
    blogApi.getBySlug(params.slug).catch(() => null),
    queryClient
      .prefetchQuery({
        queryKey: ["blog", "post", params.slug],
        queryFn: () => blogApi.getBySlug(params.slug),
      })
      .catch(() => {}),
    queryClient
      .prefetchQuery({
        queryKey: ["blog", "published", null],
        queryFn: () => blogApi.listPublished(),
      })
      .catch(() => {}),
  ]);

  const schemaArticle = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `https://nwtprogress.com/blog/${post.slug}#article`,
        headline: post.title,
        description:
          post.excerpt || stripHtml(post.content).slice(0, 160),
        datePublished: post.created_at,
        dateModified: post.updated_at ?? post.created_at,
        author: post.profiles?.display_name
          ? { "@type": "Person", name: post.profiles.display_name }
          : { "@type": "Organization", "@id": "https://nwtprogress.com/#organization", name: "NWT Progress" },
        publisher: {
          "@type": "Organization",
          "@id": "https://nwtprogress.com/#organization",
          name: "NWT Progress",
        },
        url: `https://nwtprogress.com/blog/${post.slug}`,
        image: post.cover_url || "https://nwtprogress.com/og-image.webp",
      }
    : null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nwtprogress.com" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://nwtprogress.com/blog" },
      ...(post ? [{ "@type": "ListItem", position: 3, name: post.title, item: `https://nwtprogress.com/blog/${post.slug}` }] : []),
    ],
  };

  return (
    <>
      {schemaArticle && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
