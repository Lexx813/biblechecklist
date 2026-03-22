import { useState } from "react";
import { usePublishedPosts, usePostBySlug } from "../../hooks/useBlog";
import "../../styles/blog.css";

const GRADIENTS = [
  "linear-gradient(135deg, #341C5C 0%, #6A3DAA 100%)",
  "linear-gradient(135deg, #4F2D85 0%, #9B59B6 100%)",
  "linear-gradient(135deg, #1A1035 0%, #4F2D85 100%)",
  "linear-gradient(135deg, #6A3DAA 0%, #C084FC 100%)",
  "linear-gradient(135deg, #2D1B4E 0%, #8E44AD 100%)",
  "linear-gradient(135deg, #3B1F6E 0%, #7B2FBE 100%)",
];

function getGradient(id) {
  return GRADIENTS[(id?.charCodeAt(0) ?? 0) % GRADIENTS.length];
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function readTime(content) {
  const words = (content || "").split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function authorName(post) {
  return post.profiles?.display_name || post.profiles?.email?.split("@")[0] || "Anonymous";
}

function authorInitial(post) {
  return (post.profiles?.display_name || post.profiles?.email || "A")[0].toUpperCase();
}

function renderContent(text) {
  if (!text) return null;
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="blog-post-para">{para}</p>
  ));
}

// ── Single post view ─────────────────────────────────────────────────────────
function PostView({ slug, onBack }) {
  const { data: post, isLoading } = usePostBySlug(slug);

  if (isLoading) return (
    <div className="blog-loading"><div className="blog-spinner" /></div>
  );
  if (!post) return (
    <div className="blog-not-found">
      <p>Post not found.</p>
      <button className="blog-back-btn" onClick={onBack}>← Back to Blog</button>
    </div>
  );

  return (
    <div className="blog-post-view">
      <div
        className="blog-post-hero"
        style={{ background: post.cover_url ? undefined : getGradient(post.id) }}
      >
        {post.cover_url && <img src={post.cover_url} className="blog-post-hero-img" alt="" />}
        <div className="blog-post-hero-overlay">
          <button className="blog-post-back-btn" onClick={onBack}>← Back to Blog</button>
          <div className="blog-post-hero-meta">
            <h1 className="blog-post-hero-title">{post.title}</h1>
            <div className="blog-post-hero-byline">
              <div className="blog-author-avatar blog-author-avatar--sm">
                {post.profiles?.avatar_url
                  ? <img src={post.profiles.avatar_url} alt="" />
                  : authorInitial(post)
                }
              </div>
              <span>{authorName(post)}</span>
              <span className="blog-dot">·</span>
              <span>{formatDate(post.created_at)}</span>
              <span className="blog-dot">·</span>
              <span>{readTime(post.content)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-post-body">
        {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
        <div className="blog-post-content">{renderContent(post.content)}</div>

        <div className="blog-author-card">
          <div className="blog-author-avatar blog-author-avatar--lg">
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt="" />
              : authorInitial(post)
            }
          </div>
          <div>
            <div className="blog-author-card-name">{authorName(post)}</div>
            <div className="blog-author-card-email">{post.profiles?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Post listing card ─────────────────────────────────────────────────────────
function PostCard({ post, onSelect }) {
  return (
    <article className="blog-card" onClick={() => onSelect(post.slug)}>
      <div
        className="blog-card-cover"
        style={{ background: post.cover_url ? undefined : getGradient(post.id) }}
      >
        {post.cover_url && <img src={post.cover_url} className="blog-card-cover-img" alt="" />}
        <div className="blog-card-cover-shine" />
      </div>
      <div className="blog-card-body">
        <p className="blog-card-excerpt">{post.excerpt || "Click to read more…"}</p>
        <h2 className="blog-card-title">{post.title}</h2>
        <div className="blog-card-footer">
          <div className="blog-author-avatar blog-author-avatar--xs">
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt="" />
              : authorInitial(post)
            }
          </div>
          <span className="blog-card-author">{authorName(post)}</span>
          <span className="blog-dot">·</span>
          <span className="blog-card-date">{formatDate(post.created_at)}</span>
          <span className="blog-card-readtime">{readTime(post.content)}</span>
        </div>
      </div>
    </article>
  );
}

// ── Main Blog Page ────────────────────────────────────────────────────────────
export default function BlogPage({ user, profile, onBack, onWriteClick }) {
  const [activeSlug, setActiveSlug] = useState(null);
  const { data: posts = [], isLoading } = usePublishedPosts();

  if (activeSlug) {
    return <PostView slug={activeSlug} onBack={() => setActiveSlug(null)} />;
  }

  return (
    <div className="blog-wrap">
      {/* Nav */}
      <nav className="blog-nav">
        <button className="blog-back-btn" onClick={onBack}>← Bible App</button>
        <div className="blog-nav-right">
          {(profile?.can_blog || profile?.is_admin) && (
            <button className="blog-write-btn" onClick={onWriteClick}>✏ My Posts</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="blog-hero">
        <div className="blog-hero-glow blog-hero-glow--1" />
        <div className="blog-hero-glow blog-hero-glow--2" />
        <div className="blog-hero-glow blog-hero-glow--3" />
        <div className="blog-hero-inner">
          <div className="blog-hero-badge">✦ Community</div>
          <h1 className="blog-hero-title">The Blog</h1>
          <p className="blog-hero-sub">Reflections, studies and insights from our community</p>
          {posts.length > 0 && (
            <p className="blog-hero-count">{posts.length} {posts.length === 1 ? "post" : "posts"} published</p>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="blog-content">
        {isLoading ? (
          <div className="blog-loading"><div className="blog-spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="blog-empty">
            <div className="blog-empty-icon">📝</div>
            <h3>No posts yet</h3>
            <p>Be the first to share a reflection or study.</p>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onSelect={setActiveSlug} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
