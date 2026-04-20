import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { blogApi } from "../../../src/api/blog";
import ClientShell from "../../_components/ClientShell";

export const revalidate = 60;

const BASE = "https://jwstudy.org";

// Pre-render all published blog posts at build time; new posts fall back to ISR
export async function generateStaticParams() {
  try {
    const posts = await blogApi.listPublished();
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
    const post = await blogApi.getBySlug(slug);
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

  const [post, allPosts] = await Promise.all([
    blogApi.getBySlug(slug).catch(() => null),
    blogApi.listPublished(null).catch(() => []),
    queryClient
      .prefetchQuery({
        queryKey: ["blog", "post", slug],
        queryFn: () => blogApi.getBySlug(slug),
      })
      .catch(() => {}),
    queryClient
      .prefetchQuery({
        queryKey: ["blog", "published", null],
        queryFn: () => blogApi.listPublished(),
      })
      .catch(() => {}),
  ]) as [any, any[], ...unknown[]];

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
          ? { "@type": "Person", name: post.profiles.display_name }
          : { "@type": "Organization", "@id": `${BASE}/#organization`, name: "JW Study" },
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

  return (
    <>
      {schemaArticle && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaArticle) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
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
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
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
          </nav>
        </div>
      )}
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClientShell />
      </HydrationBoundary>
    </>
  );
}
