import { useState, useEffect, useRef, useMemo } from "react";
import { marked } from "marked";
import { sanitizeRich } from "../../lib/sanitize";
import { useRelatedPosts, useToggleBlogLike, useUserBlogLikes } from "../../hooks/useBlog";
import { blogApi } from "../../api/blog";
import { formatDate, authorName as authorNameUtil } from "../../utils/formatters";
import VerseTooltip from "../../components/blog/VerseTooltip";
import "../../styles/post-read.css";

function renderContent(raw: string): string {
  if (!raw) return "";
  const html = /<[a-z][\s\S]*>/i.test(raw) ? raw : marked.parse(raw) as string;
  return sanitizeRich(html);
}

function extractHeadings(html: string): Array<{ id: string; text: string }> {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches.map((m, i) => ({
    id: `pr-section-${i}`,
    text: m[1].replace(/<[^>]*>/g, ""),
  }));
}

function injectHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<h2([^>]*)>/gi, () => `<h2 id="pr-section-${i++}"$1>`);
}

interface PostProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  subtitle?: string | null;
  content: string;
  cover_url: string | null;
  created_at: string;
  author_id: string;
  like_count: number;
  read_time_minutes: number;
  tags: string[];
  profiles: PostProfile | null;
}

interface Props {
  post: Post;
  user: { id: string } | null;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function PostReadView({ post, user, navigate }: Props) {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const articleRef = useRef<HTMLDivElement>(null);
  const { data: relatedPosts = [] } = useRelatedPosts(post.id, post.tags ?? []);
  const { data: likedIds = [] } = useUserBlogLikes(user?.id);
  const toggleLike = useToggleBlogLike(user?.id);
  const liked = (likedIds as string[]).includes(post.id);

  const renderedHtml = useMemo(() => injectHeadingIds(renderContent(post.content)), [post.content]);
  const headings = useMemo(() => extractHeadings(renderedHtml), [renderedHtml]);

  useEffect(() => {
    blogApi.incrementViewCount(post.id);
  }, [post.id]);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const pct = Math.min(100, Math.max(0, Math.round(((viewH - top) / (height + viewH)) * 100)));
      setScrollPct(pct);
      for (const { id } of headings) {
        const headingEl = document.getElementById(id);
        if (headingEl && headingEl.getBoundingClientRect().top <= 120) {
          setActiveSection(id);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const displayName = post.profiles?.display_name ?? "Anonymous";
  const authorInitial = displayName[0].toUpperCase();
  const displayDate = formatDate(post.created_at, "long");
  const primaryTag = post.tags?.[0] ?? "";

  return (
    <div className="pr-wrap">
      <div className="pr-progress-bar" style={{ width: `${scrollPct}%` }} />

      <div className="pr-layout">
        {/* Left: ToC */}
        {headings.length > 0 && (
          <aside className="pr-toc">
            <div className="pr-toc-label">Contents</div>
            {headings.map(({ id, text }) => (
              <button
                key={id}
                className={`pr-toc-item${activeSection === id ? " active" : ""}`}
                onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              >{text}</button>
            ))}
          </aside>
        )}
        {headings.length === 0 && <div />}

        {/* Center: Article */}
        <article className="pr-article" ref={articleRef}>
          {primaryTag && <span className="pr-tag-pill">{primaryTag}</span>}
          <h1 className="pr-title">{post.title}</h1>

          <div className="pr-meta">
            <div
              className="pr-avatar"
              onClick={() => navigate("publicProfile", { userId: post.author_id })}
            >
              {post.profiles?.avatar_url
                ? <img src={post.profiles.avatar_url} alt={displayName} />
                : authorInitial
              }
            </div>
            <div className="pr-meta-text">
              <strong>{displayName}</strong><br />
              {displayDate}
            </div>
            {post.read_time_minutes > 0 && (
              <span className="pr-read-time">☕ {post.read_time_minutes} min</span>
            )}
          </div>

          {post.cover_url && (
            <img className="pr-cover" src={post.cover_url} alt={post.title} />
          )}

          <div className="pr-body">
            <VerseTooltip html={renderedHtml} />
          </div>

          {post.tags?.length > 0 && (
            <div className="pr-tags-row">
              {post.tags.map(tag => <span key={tag} className="pr-tag">{tag}</span>)}
            </div>
          )}
        </article>

        {/* Right: Sidebar */}
        <aside className="pr-sidebar">
          <div className="pr-widget pr-progress-widget">
            <div className="pr-widget-label">Progress</div>
            <div className="pr-pct">{scrollPct}%</div>
            <div className="pr-pct-sub">through this article</div>
            <div className="pr-pct-track">
              <div className="pr-pct-fill" style={{ width: `${scrollPct}%` }} />
            </div>
          </div>

          <div className="pr-widget">
            <div className="pr-widget-label">Actions</div>
            <button
              className="pr-action-btn"
              onClick={() => user && toggleLike.mutate(post.id)}
            >
              {liked ? "❤️" : "🤍"} Like ({post.like_count})
            </button>
            <button className="pr-action-btn">🔖 Bookmark</button>
            <button className="pr-action-btn">📤 Share</button>
          </div>

          {relatedPosts.length > 0 && (
            <div className="pr-widget">
              <div className="pr-widget-label">Related Posts</div>
              {(relatedPosts as unknown as Post[]).map(rp => (
                <button
                  key={rp.id}
                  className="pr-related-link"
                  onClick={() => navigate("blog", { slug: rp.slug })}
                >
                  {rp.title}
                  {rp.read_time_minutes > 0 && (
                    <div className="pr-related-meta">☕ {rp.read_time_minutes} min</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      <button
        className={`pr-back-top${scrollPct > 10 ? " visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑ Top <span className="pr-back-top-pct">{scrollPct}%</span>
      </button>
    </div>
  );
}
