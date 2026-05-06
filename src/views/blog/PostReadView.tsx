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
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
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
      });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [headings]);

  const [showShare, setShowShare] = useState(false);

  const shareUrl = `${window.location.origin}/blog/${post.slug}`;
  const shareText = encodeURIComponent(post.title);
  const LinkIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  );
  const XIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
    </svg>
  );
  const WhatsAppIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
    </svg>
  );
  const FacebookIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073"/>
    </svg>
  );
  const shareLinks = [
    { label: "Copy link", icon: LinkIcon, action: () => { navigator.clipboard.writeText(shareUrl); setShowShare(false); } },
    { label: "Share on X", icon: XIcon, href: `https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}` },
    { label: "WhatsApp", icon: WhatsAppIcon, href: `https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}` },
    { label: "Facebook", icon: FacebookIcon, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
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
              <span className="pr-read-time" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {post.read_time_minutes} min
              </span>
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

          {/* JW Resources footer, always defer to jw.org for deeper knowledge */}
          <div className="pr-jw-footer">
            <div className="pr-jw-footer-header">
              <span className="pr-jw-footer-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </span>
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
                  <small>hub.jw.org, one of Jehovah's Witnesses will be glad to contact you</small>
                </span>
              </a>
              <a className="pr-jw-link pr-jw-link--primary" href="https://hub.jw.org/meetings/en?q=%7B%22meetingType%22:%22meetings%22,%22location%22:%22%22%7D" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">🏛️</span>
                <span>
                  <strong>Find a Meeting Near You</strong>
                  <small>hub.jw.org, attend a Kingdom Hall meeting in your area</small>
                </span>
              </a>
              <a className="pr-jw-link" href="https://www.jw.org" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">🌐</span>
                <span>
                  <strong>jw.org, Official Website</strong>
                  <small>Books, videos, magazines & Bible study articles</small>
                </span>
              </a>
              <a className="pr-jw-link" href="https://wol.jw.org" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">🔍</span>
                <span>
                  <strong>Watchtower ONLINE Library</strong>
                  <small>wol.jw.org, full publication archive</small>
                </span>
              </a>
              <a className="pr-jw-link" href="https://www.jw.org/en/online-help/jw-library/" target="_blank" rel="noopener noreferrer">
                <span className="pr-jw-link-icon">📱</span>
                <span>
                  <strong>JW Library App</strong>
                  <small>Bibles, publications & meeting materials, iOS &amp; Android</small>
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
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Like ({post.like_count})
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
                    <div className="pr-related-meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {rp.read_time_minutes} min
                    </div>
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
