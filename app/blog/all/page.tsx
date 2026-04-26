import Link from "next/link";
import { blogApi } from "../../../src/api/blog";
import PublicNav from "../../_components/PublicNav";
import PublicFooter from "../../_components/PublicFooter";

export const revalidate = 300;

export const metadata = {
  title: "All Articles, JW Study Blog",
  description: "Every article published on the JW Study community blog.",
  alternates: { canonical: "https://jwstudy.org/blog/all" },
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

export default async function AllBlogPostsPage() {
  const result = await blogApi.listPublished().catch(() => []);
  const posts = result ?? [];

  return (
    <>
      <PublicNav />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <nav className="mb-4 text-sm text-slate-500">
          <Link href="/blog" className="hover:underline">← Blog</Link>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All articles</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">{posts.length} posts</p>

        {posts.length > 0 ? (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
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
        ) : (
          <p className="mt-10 text-slate-500">No articles published yet.</p>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
