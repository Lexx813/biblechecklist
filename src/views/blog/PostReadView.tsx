import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { marked } from "marked";
import { sanitizeRich } from "../../lib/sanitize";
import { useRelatedPosts, useToggleBlogLike, useUserBlogLikes } from "../../hooks/useBlog";
import { blogApi } from "../../api/blog";
import { formatDate, authorName as authorNameUtil } from "../../utils/formatters";
import VerseTooltip from "../../components/blog/VerseTooltip";
import BookmarkButton from "../../components/bookmarks/BookmarkButton";
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
  children?: ReactNode;
}

export default function PostReadView({ post, user, navigate, children }: Props) {
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
    const scroller = document.querySelector<HTMLElement>(".home-feed, .al-content") ?? window;
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
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [headings]);

  const [showShare, setShowShare] = useState(false);

  const shareUrl = `${window.location.origin}/blog/${post.slug}`;
  const shareText = encodeURIComponent(post.title);
  const shareLinks = [
    { label: "Copy link", icon: "🔗", action: () => { navigator.clipboard.writeText(shareUrl); setShowShare(false); } },
    { label: "Share on X", icon: "𝕏", href: `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}` },
    { label: "WhatsApp", icon: "💬", href: `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}` },
    { label: "Facebook", icon: "📘", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
  ];

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
          <button className="pr-back-link" onClick={() => navigate("blog")}>← All Posts</button>
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

          {/* JW Resources footer — always defer to jw.org for deeper knowledge */}
          <div className="pr-jw-footer">
            <div className="pr-jw-footer-header">
              <span className="pr-jw-footer-icon">📖</span>
              <div>
                <div className="pr-jw-footer-title">For Deeper Study, Visit jw.org</div>
                <div className="pr-jw-footer-sub">The official website of Jehovah's Witnesses is the primary source for accurate Bible teaching. Take the next step below.</div>
              </div>
            </div>
            <div className="pr-jw-footer-links">
              <a className="pr-jw-link pr-jw-link--primary" href="https://hub.jw.org/request-visit/en/request" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">✉️</span>
                <span>
                  <strong>Request a Free Bible Study</strong>
                  <small>hub.jw.org — one of Jehovah's Witnesses will be glad to contact you</small>
                </span>
              </a>
              <a className="pr-jw-link pr-jw-link--primary" href="https://hub.jw.org/meetings/en?q=%7B%22meetingType%22:%22meetings%22,%22location%22:%22%22%7D" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">🏛️</span>
                <span>
                  <strong>Find a Meeting Near You</strong>
                  <small>hub.jw.org — attend a Kingdom Hall meeting in your area</small>
                </span>
              </a>
              <a className="pr-jw-link" href="https://www.jw.org" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">🌐</span>
                <span>
                  <strong>jw.org — Official Website</strong>
                  <small>Books, videos, magazines & Bible study articles</small>
                </span>
              </a>
              <a className="pr-jw-link" href="https://wol.jw.org" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">🔍</span>
                <span>
                  <strong>Watchtower ONLINE Library</strong>
                  <small>wol.jw.org — full publication archive</small>
                </span>
              </a>
              <a className="pr-jw-link" href="https://www.jw.org/en/online-help/jw-library/" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">📱</span>
                <span>
                  <strong>JW Library App</strong>
                  <small>Bibles, publications & meeting materials — iOS &amp; Android</small>
                </span>
              </a>
            </div>
          </div>

          {children && <div className="pr-comments-wrap">{children}</div>}
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
            <BookmarkButton userId={user?.id} postId={post.id} className="pr-action-btn pr-bookmark-btn" />
            <button className="pr-action-btn" onClick={() => setShowShare(s => !s)}>📤 Share</button>
            {showShare && (
              <div className="pr-share-sheet">
                {shareLinks.map(({ label, icon, action, href }) =>
                  href ? (
                    <a key={label} className="pr-share-item" href={href} target="_blank" rel="noopener noreferrer" onClick={() => setShowShare(false)}>
                      <span className="pr-share-icon">{icon}</span>{label}
                    </a>
                  ) : (
                    <button key={label} className="pr-share-item" onClick={action}>
                      <span className="pr-share-icon">{icon}</span>{label}
                    </button>
                  )
                )}
              </div>
            )}
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

          <div className="pr-widget pr-jw-widget">
            <div className="pr-widget-label">Official JW Resources</div>
            <a className="pr-jw-widget-link" href="https://www.jw.org" target="_blank" rel="noopener noreferrer">
              🌐 <span>jw.org</span>
            </a>
            <a className="pr-jw-widget-link" href="https://wol.jw.org" target="_blank" rel="noopener noreferrer">
              🔍 <span>WOL Research Library</span>
            </a>
            <a className="pr-jw-widget-link" href="https://www.jw.org/en/online-help/jw-library/" target="_blank" rel="noopener noreferrer">
              📱 <span>JW Library App</span>
            </a>
          </div>
        </aside>
      </div>

      <button
        className={`pr-back-top${scrollPct > 10 ? " visible" : ""}`}
        onClick={() => {
          const feed = document.querySelector<HTMLElement>(".home-feed, .al-content");
          if (feed) feed.scrollTo({ top: 0, behavior: "smooth" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        ↑ Top <span className="pr-back-top-pct">{scrollPct}%</span>
      </button>
    </div>
  );
}
