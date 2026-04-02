import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { blogApi } from "../../../src/api/blog";
import ClientShell from "../../_components/ClientShell";

export const revalidate = 60;

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  try {
    const post = await blogApi.getBySlug(slug);
    if (!post) return {};

    const desc =
      post.excerpt ||
      stripHtml(post.content).slice(0, 160) ||
      `Read "${post.title}" on NWT Progress`;

    const metadata = {
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

    if (slug === "2026-04-01-test-insight") {
      return { ...metadata, robots: { index: false, follow: false } };
    }

    return metadata;
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
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://nwtprogress.com/blog/${post.slug}`,
        },
        publisher: {
          "@type": "Organization",
          "@id": "https://nwtprogress.com/#organization",
          name: "NWT Progress",
          logo: {
            "@type": "ImageObject",
            url: "https://nwtprogress.com/icon-512.png",
            width: 512,
            height: 512,
          },
        },
        wordCount: post.content
          ? post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
          : undefined,
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
      {post && (
        <div id="ssr-fallback">
          <article>
            <h1>{post.title}</h1>
            {post.excerpt && <p>{post.excerpt}</p>}
            {post.content && (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            )}
          </article>
          <nav aria-label="Related resources">
            <h2>Explore Bible Books on NWT Progress</h2>
            <ul>
              <li><a href="/books">All 66 Books of the Bible — NWT Study Guides</a></li>
              <li><a href="/books/genesis">Genesis</a></li>
              <li><a href="/books/psalms">Psalms</a></li>
              <li><a href="/books/proverbs">Proverbs</a></li>
              <li><a href="/books/isaiah">Isaiah</a></li>
              <li><a href="/books/matthew">Matthew</a></li>
              <li><a href="/books/john">John</a></li>
              <li><a href="/books/acts">Acts</a></li>
              <li><a href="/books/romans">Romans</a></li>
              <li><a href="/books/revelation">Revelation</a></li>
            </ul>
            <h2>Bible Reading Plans</h2>
            <ul>
              <li><a href="/plans">All Bible Reading Plans for Jehovah&apos;s Witnesses</a></li>
            </ul>
            <h2>Study Topics</h2>
            <ul>
              <li><a href="/study-topics">Bible Study Topics</a></li>
            </ul>
            <h2>More from the Blog</h2>
            <ul>
              <li><a href="/blog">NWT Progress Blog</a></li>
            </ul>
          </nav>
        </div>
      )}
      {/* Runs synchronously during HTML parse — hides fallback before first paint so users never see it */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var e=document.getElementById('ssr-fallback');if(e)e.style.display='none';}())` }} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
