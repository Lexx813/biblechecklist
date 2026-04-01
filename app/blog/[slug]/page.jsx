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
      openGraph: {
        title: post.title,
        description: desc,
        type: "article",
        publishedTime: post.created_at,
        authors: post.profiles?.display_name ? [post.profiles.display_name] : [],
        images: post.cover_url
          ? [{ url: post.cover_url, width: 1200, height: 630 }]
          : [],
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

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ["blog", "post", params.slug],
      queryFn: () => blogApi.getBySlug(params.slug),
    }),
    queryClient.prefetchQuery({
      queryKey: ["blog", "published", null],
      queryFn: () => blogApi.listPublished(),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientShell />
    </HydrationBoundary>
  );
}
