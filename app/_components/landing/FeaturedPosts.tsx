import Image from "next/image";
import MotionDiv from "./MotionDiv";

// Brand-violet local SVG fallback. Replaces 5 cross-origin Unsplash URLs
// that cost each fallback a DNS+TLS+download to a third-party origin
// (Speed Insights LCP regression). The SVG is ~700 bytes from our edge.
const FALLBACK_IMAGE = "/blog-fallback.svg";

function getFallbackImage(_id: string) {
  return FALLBACK_IMAGE;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_url: string | null;
}

export default function FeaturedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-y border-[var(--lp-border)] bg-[var(--lp-bg-alt)] py-16 max-md:py-12">
      <div className="mx-auto max-w-[1080px] px-6">
        <MotionDiv variant="fadeUp" className="mb-10 text-center">
          <h2 className="m-0 mb-2.5 font-display text-[clamp(26px,4vw,38px)] font-semibold tracking-tight text-[var(--lp-text)]">From the Blog</h2>
          <p className="m-0 text-[15px] text-[var(--lp-muted)]">Bible study insights for Jehovah&apos;s Witnesses</p>
        </MotionDiv>
        <div className="grid gap-5 md:grid-cols-3 max-md:mx-auto max-md:max-w-[440px] max-md:grid-cols-1">
          {posts.map((post, i) => (
            <MotionDiv key={post.slug} variant="fadeUp" delay={i * 0.12}>
              <a href={`/blog/${post.slug}`} className="group flex cursor-pointer flex-col overflow-hidden rounded-[14px] border border-[var(--lp-card-border)] bg-[var(--lp-card-bg)] text-inherit no-underline shadow-[var(--lp-card-shadow)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[var(--lp-primary)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[var(--lp-pill-bg)]">
                  <Image
                    src={post.cover_url || getFallbackImage(post.id)}
                    alt={post.title}
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    {...(i === 0 && post.cover_url
                      ? { priority: true, fetchPriority: "high" as const }
                      : { loading: "lazy" as const })}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 px-5 pb-5 pt-[18px]">
                  <h3 className="m-0 line-clamp-2 text-[15px] font-bold leading-[1.45] text-[var(--lp-text)]">{post.title}</h3>
                  {post.excerpt && <p className="m-0 line-clamp-3 flex-1 text-[13px] leading-relaxed text-[var(--lp-muted)]">{post.excerpt}</p>}
                  <span className="mt-1 text-[13px] font-semibold text-[var(--lp-primary)]">Read article →</span>
                </div>
              </a>
            </MotionDiv>
          ))}
        </div>
        <MotionDiv variant="fadeUp" delay={0.3} className="mt-9 text-center">
          <a href="/blog" className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--lp-primary)] px-6 py-[11px] text-sm font-semibold text-[var(--lp-primary)] no-underline transition-all duration-150 hover:bg-[var(--lp-primary)] hover:text-white">
            View all articles
          </a>
        </MotionDiv>
      </div>
    </section>
  );
}
