import Link from "next/link";
import Image from "next/image";
import { blogApi } from "../../src/api/blog";
import PublicNav from "../_components/PublicNav";
import PublicFooter from "../_components/PublicFooter";

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
  "@id": "https://jwstudy.org/blog#blog",
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

// Self-hosted brand-violet fallback. Using a single SVG instead of 8 third-party
// Unsplash photos: kills cross-origin DNS+TLS+download cost, removes generic
// stock-photo E-E-A-T penalty, and the SVG is ~700 bytes from our edge.
const FALLBACK_IMAGE = "/blog-fallback.svg";

function fallbackImage(_id: string) {
  return FALLBACK_IMAGE;
}

function formatDate(s: string | undefined) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function BlogListPage() {
  const [postsResult, featuredResult] = await Promise.allSettled([
    blogApi.listPublished(),
    blogApi.getFeaturedPost(),
  ]);
  const posts = postsResult.status === "fulfilled" ? (postsResult.value ?? []) : [];
  const featuredPost = featuredResult.status === "fulfilled" ? featuredResult.value : null;

  // De-dupe: don't render the featured post twice in the grid.
  // Cap initial render to keep DOM + image weight reasonable for LCP.
  const INITIAL_POST_LIMIT = 12;
  const dedupedPosts = featuredPost
    ? posts.filter((p) => p.id !== (featuredPost as { id: string }).id)
    : posts;
  const gridPosts = dedupedPosts.slice(0, INITIAL_POST_LIMIT);
  const remainingCount = Math.max(0, dedupedPosts.length - INITIAL_POST_LIMIT);

  const schemaItemList = posts.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": "https://jwstudy.org/blog#list",
    name: "JW Study Blog Posts",
    itemListElement: posts.slice(0, 30).map((post, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://jwstudy.org/blog/${post.slug}`,
      name: post.title,
    })),
  } : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBlog) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
      {schemaItemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }} />
      )}
      <PublicNav />

      {/* Hero band */}
      <header className="border-b border-slate-200 bg-violet-50/50 dark:border-white/10 dark:bg-violet-950/20">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
            Community blog
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
            Bible study, written by the community
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Spiritual reflections, scripture insights, and study notes from publishers worldwide.
            Aligned with the New World Translation and the publications at wol.jw.org.
          </p>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {featuredPost && (
          <Link
            href={`/blog/${(featuredPost as { slug: string }).slug}`}
            className="group grid overflow-hidden rounded-md border border-slate-200 transition hover:border-violet-400 hover:shadow-[0_8px_32px_-12px_rgba(124,58,237,0.25)] sm:grid-cols-5 dark:border-white/10"
          >
            <div className="sm:col-span-3">
              <Image
                src={(featuredPost as { cover_url?: string }).cover_url || fallbackImage((featuredPost as { id: string }).id)}
                alt={(featuredPost as { title: string }).title}
                width={1200}
                height={675}
                priority
                sizes="(min-width: 640px) 60vw, 100vw"
                style={{ aspectRatio: "16 / 9", width: "100%", height: "auto", objectFit: "cover" }}
              />
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 sm:col-span-2 sm:p-8">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
                <span className="text-violet-700 dark:text-violet-300">Featured</span>
                {(featuredPost as { tags?: string[] }).tags?.[0] && (
                  <>
                    <span className="text-slate-300 dark:text-white/20">·</span>
                    <span className="text-slate-500 dark:text-slate-400">{(featuredPost as { tags: string[] }).tags[0]}</span>
                  </>
                )}
              </div>
              <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 group-hover:text-violet-700 sm:text-3xl dark:text-slate-50 dark:group-hover:text-violet-300">
                {(featuredPost as { title: string }).title}
              </h2>
              {(featuredPost as { excerpt?: string }).excerpt && (
                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                  {(featuredPost as { excerpt: string }).excerpt}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{(featuredPost as { profiles?: { display_name?: string } }).profiles?.display_name ?? "Anonymous"}</span>
                <span aria-hidden>·</span>
                <span>{formatDate((featuredPost as { created_at?: string }).created_at)}</span>
              </div>
            </div>
          </Link>
        )}

        {gridPosts.length > 0 && (
          <ul className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="overflow-hidden rounded-md border border-slate-200 dark:border-white/10">
                    <Image
                      src={(post as { cover_url?: string }).cover_url || fallbackImage((post as { id: string }).id)}
                      alt={post.title}
                      width={1200}
                      height={675}
                      loading="lazy"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      style={{ aspectRatio: "16 / 9", width: "100%", height: "auto", objectFit: "cover" }}
                      className="transition group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-4">
                    {(post as { tags?: string[] }).tags?.[0] && (
                      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
                        {(post as { tags: string[] }).tags[0]}
                      </div>
                    )}
                    <h3 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-violet-700 dark:text-slate-50 dark:group-hover:text-violet-300">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{(post as { profiles?: { display_name?: string } }).profiles?.display_name ?? "Anonymous"}</span>
                      <span aria-hidden>·</span>
                      <span>{formatDate((post as { created_at?: string }).created_at)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {posts.length === 0 && (
          <p className="mt-10 text-slate-500">No articles published yet.</p>
        )}

        {remainingCount > 0 && (
          <div className="mt-16 flex justify-center">
            <Link
              href="/blog/all"
              prefetch={false}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 dark:hover:text-violet-300"
            >
              View all {dedupedPosts.length} posts
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
