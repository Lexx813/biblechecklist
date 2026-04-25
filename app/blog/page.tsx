import Link from "next/link";
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

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1455541504462-57ebb2a9cec1?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80",
];

function fallbackImage(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK_IMAGES[h % FALLBACK_IMAGES.length];
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

  // De-dupe: don't render the featured post twice in the grid
  const gridPosts = featuredPost
    ? posts.filter((p) => p.id !== (featuredPost as { id: string }).id)
    : posts;

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
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">JW Study Blog</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
            Written by the community, for the community.
          </p>
        </header>

        {featuredPost && (
          <Link
            href={`/blog/${(featuredPost as { slug: string }).slug}`}
            className="mt-10 grid overflow-hidden rounded-lg border border-slate-200 transition hover:border-violet-400 sm:grid-cols-2 dark:border-white/10"
          >
            <img
              src={(featuredPost as { cover_url?: string }).cover_url || fallbackImage((featuredPost as { id: string }).id)}
              alt={(featuredPost as { title: string }).title}
              width={1200}
              height={675}
              fetchPriority="high"
              style={{ aspectRatio: "16 / 9", width: "100%", height: "auto", objectFit: "cover" }}
            />
            <div className="p-6">
              {(featuredPost as { tags?: string[] }).tags?.[0] && (
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  {(featuredPost as { tags: string[] }).tags[0]}
                </div>
              )}
              <h2 className="mt-2 text-xl font-semibold sm:text-2xl">
                {(featuredPost as { title: string }).title}
              </h2>
              {(featuredPost as { excerpt?: string }).excerpt && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {(featuredPost as { excerpt: string }).excerpt}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span>{(featuredPost as { profiles?: { display_name?: string } }).profiles?.display_name ?? "Anonymous"}</span>
                <span>·</span>
                <span>{formatDate((featuredPost as { created_at?: string }).created_at)}</span>
              </div>
            </div>
          </Link>
        )}

        {gridPosts.length > 0 && (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {gridPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block overflow-hidden rounded-lg border border-slate-200 transition hover:border-violet-400 dark:border-white/10"
                >
                  <img
                    src={(post as { cover_url?: string }).cover_url || fallbackImage((post as { id: string }).id)}
                    alt={post.title}
                    width={1200}
                    height={675}
                    loading="lazy"
                    style={{ aspectRatio: "16 / 9", width: "100%", height: "auto", objectFit: "cover" }}
                  />
                  <div className="p-4">
                    {(post as { tags?: string[] }).tags?.[0] && (
                      <div className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                        {(post as { tags: string[] }).tags[0]}
                      </div>
                    )}
                    <h3 className="mt-2 line-clamp-2 font-semibold">{post.title}</h3>
                    {post.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{post.excerpt}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span>{(post as { profiles?: { display_name?: string } }).profiles?.display_name ?? "Anonymous"}</span>
                      <span>·</span>
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
      </main>
      <PublicFooter />
    </>
  );
}
