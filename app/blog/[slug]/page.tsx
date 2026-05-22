import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { unstable_cache } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { blogApi } from "../../../src/api/blog";
import { songsApi, localizedTitle } from "../../../src/api/songs";
import ClientShell from "../../_components/ClientShell";

// Shared across blog-post regenerations so each ISR miss doesn't pay a
// Supabase round-trip just for the songs rail.
const getRecentSongsForBlog = unstable_cache(
  async () => {
    try {
      return (await songsApi.listPublished("en")).slice(0, 4);
    } catch {
      return [];
    }
  },
  ["blog-related-songs-top4"],
  { revalidate: 600, tags: ["songs-list"] },
);

export const revalidate = 300;

const BASE = "https://jwstudy.org";

// Cached Supabase reads so ISR regen + generateMetadata don't pay a cold
// Supabase round-trip on every miss. Cache per slug so each post has its
// own invalidation tag.
const getPostBySlug = (slug: string) =>
  unstable_cache(
    async () => {
      try {
        return await blogApi.getBySlug(slug);
      } catch {
        return null;
      }
    },
    ["blog-post-by-slug", slug],
    { revalidate: 300, tags: [`blog-slug-${slug}`, "blog-list"] },
  )();

const getAllPublished = unstable_cache(
  async () => {
    try {
      return await blogApi.listPublished(null);
    } catch {
      return [];
    }
  },
  ["blog-list-all"],
  { revalidate: 300, tags: ["blog-list"] },
);

// Pre-render all published blog posts at build time; new posts fall back to ISR
export async function generateStaticParams() {
  try {
    const posts = await getAllPublished();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);
    if (!post) return {};

    const lang = (post as any).lang ?? "en";
    const pairedSlug = (post as any).translations?.paired_slug ?? null;

    const desc =
      post.excerpt ||
      stripHtml(post.content).slice(0, 160) ||
      `Read "${post.title}" on JW Study`;

    // hreflang: point each post to its own language + the paired translation
    const languages: Record<string, string> = {
      [lang]: `${BASE}/blog/${slug}`,
      "x-default": lang === "en" ? `${BASE}/blog/${slug}` : (pairedSlug ? `${BASE}/blog/${pairedSlug}` : `${BASE}/blog/${slug}`),
    };
    if (pairedSlug) {
      const otherLang = lang === "en" ? "es" : "en";
      languages[otherLang] = `${BASE}/blog/${pairedSlug}`;
    }

    const metadata: Record<string, unknown> = {
      title: `${post.title} | JW Study`,
      description: desc,
      alternates: {
        canonical: `${BASE}/blog/${slug}`,
        languages,
      },
      // Emit content-language so crawlers index it in the right language index
      other: { "content-language": (lang ?? "en").trim() },
      openGraph: {
        title: post.title,
        description: desc,
        type: "article",
        publishedTime: post.created_at,
        locale: lang === "es" ? "es_ES" : "en_US",
        ...(pairedSlug && {
          alternateLocale: lang === "es" ? "en_US" : "es_ES",
        }),
        authors: post.profiles?.display_name ? [post.profiles.display_name] : [],
        // opengraph-image.tsx drives og:image — don't set here
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: desc,
        // opengraph-image.tsx also drives twitter:image
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
  const { slug } = await params;
  const queryClient = new QueryClient();

  const [post, allPosts, recentSongs] = await Promise.all([
    getPostBySlug(slug).catch(() => null),
    getAllPublished().catch(() => []),
    getRecentSongsForBlog(),
    queryClient
      .prefetchQuery({
        queryKey: ["blog", "post", slug],
        queryFn: () => getPostBySlug(slug),
      })
      .catch(() => {}),
    queryClient
      .prefetchQuery({
        queryKey: ["blog", "published", null],
        queryFn: () => getAllPublished(),
      })
      .catch(() => {}),
  ]) as [any, any[], Awaited<ReturnType<typeof getRecentSongsForBlog>>, ...unknown[]];

  const lang = post?.lang ?? "en";

  // Pick up to 5 other posts for internal links in the SSR fallback
  const relatedPosts = (allPosts ?? [])
    .filter((p) => p.slug !== slug)
    .slice(0, 5);

  const schemaArticle = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `${BASE}/blog/${post.slug}#article`,
        headline: post.title,
        description: post.excerpt || stripHtml(post.content).slice(0, 160),
        datePublished: post.created_at,
        dateModified: post.updated_at ?? post.created_at,
        inLanguage: lang,
        author: post.profiles?.display_name
          ? { "@type": "Person", name: post.profiles.display_name, url: `${BASE}/about` }
          : { "@type": "Person", name: "Alexi", "@id": `${BASE}/#creator`, url: `${BASE}/about` },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${BASE}/blog/${post.slug}`,
        },
        publisher: {
          "@type": "Organization",
          "@id": `${BASE}/#organization`,
          name: "JW Study",
          logo: {
            "@type": "ImageObject",
            url: `${BASE}/icon-512.png`,
            width: 512,
            height: 512,
          },
        },
        wordCount: post.content
          ? post.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length
          : undefined,
        url: `${BASE}/blog/${post.slug}`,
        image: post.cover_url || `${BASE}/blog/${post.slug}/opengraph-image`,
      }
    : null;

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
      ...(post ? [{ "@type": "ListItem", position: 3, name: post.title, item: `${BASE}/blog/${post.slug}` }] : []),
    ],
  };

  // Safely embed JSON-LD — JSON.stringify doesn't escape `<`, so user titles
  // containing `</script>` could break out. Escape `<` to its unicode form.
  const safeJson = (obj: unknown) => JSON.stringify(obj).replace(/</g, "\\u003c");

  return (
    <>
      {schemaArticle && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaArticle) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schemaBreadcrumb) }} />
      {post && (
        <div id="ssr-fallback" lang={lang} suppressHydrationWarning>
          <article>
            <h1>{post.title}</h1>
            <p>
              {post.profiles?.display_name && <>By {post.profiles.display_name} · </>}
              <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>
            </p>
            {post.excerpt && <p>{post.excerpt}</p>}
            {post.content && (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, { ADD_ATTR: ["target", "rel"] }) }} />
            )}
          </article>

          {/* Internal links to other posts — helps Google crawl and distribute PageRank */}
          {relatedPosts.length > 0 && (
            <nav aria-label="More articles">
              <h2>More from the JW Study Blog</h2>
              <ul>
                {relatedPosts.map((p) => (
                  <li key={p.slug}>
                    <a href={`/blog/${p.slug}`}>{p.title}</a>
                    {p.excerpt && <p>{p.excerpt}</p>}
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label="Related resources">
            <h2>Explore Bible Books on JW Study</h2>
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
            {recentSongs.length > 0 && (
              <>
                <h2>JW Music — Original Songs Inspired by Scripture</h2>
                <ul>
                  {recentSongs.map((s) => (
                    <li key={s.slug}>
                      <a href={`/songs/${s.slug}`}>{localizedTitle(s, "en")}</a>
                    </li>
                  ))}
                  <li><a href="/songs">Browse all JW Study songs</a></li>
                </ul>
              </>
            )}
          </nav>
        </div>
      )}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
