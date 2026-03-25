import { useState, useMemo, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeRich } from "../../lib/sanitize";
import PageNav from "../PageNav";
import ReportModal from "../ReportModal";
import BookmarkButton from "../bookmarks/BookmarkButton";
import MentionAutocomplete from "../mentions/MentionAutocomplete";
import { usePublishedPosts, usePostBySlug, useComments, useCreateComment, useDeleteComment, useDeletePost, useUserBlogLikes, useToggleBlogLike } from "../../hooks/useBlog";
import { toast } from "../../lib/toast";
import { useSubmitReport } from "../../hooks/useReports";
import "../../styles/blog.css";
import "../../styles/editor.css";
import "../../styles/mentions.css";

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

function authorName(post) {
  return post.profiles?.display_name || post.profiles?.email?.split("@")[0] || "Anonymous";
}

function authorInitial(post) {
  return (post.profiles?.display_name || post.profiles?.email || "A")[0].toUpperCase();
}

function renderContent(text) {
  if (!text) return null;
  // Legacy plain text → wrap in paragraphs
  const html = /<[a-z][\s\S]*>/i.test(text)
    ? text
    : text.split(/\n\n+/).map(p => `<p>${p}</p>`).join("");
  return (
    <div
      className="rich-content"
      dangerouslySetInnerHTML={{ __html: sanitizeRich(html) }}
    />
  );
}

// ── Comments ──────────────────────────────────────────────────────────────────
function PostComments({ postId, postAuthorId, postSlug, user, profile, navigate }) {
  const { t } = useTranslation();
  const { data: comments = [], isLoading } = useComments(postId);
  const createComment = useCreateComment(postId, postAuthorId, postSlug);
  const deleteComment = useDeleteComment(postId);
  const submitReport = useSubmitReport();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [reportTarget, setReportTarget] = useState(null); // { id, preview }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!text.trim()) return setError(t("blog.commentEmptyError"));
    createComment.mutate({ userId: user.id, content: text.trim() }, {
      onSuccess: () => setText(""),
      onError: (err) => setError(err.message),
    });
  }

  function handleReport(reason) {
    if (!reportTarget) return;
    submitReport.mutate(
      { reporterId: user.id, contentType: "comment", contentId: reportTarget.id, contentPreview: reportTarget.preview, reason },
      { onSuccess: () => setReportTarget(null), onError: () => setReportTarget(null) }
    );
  }

  return (
    <div className="blog-comments">
      <h3 className="blog-comments-title">
        {t("blog.commentsTitle")}
        {comments.length > 0 && <span className="blog-comments-count">{comments.length}</span>}
      </h3>

      {isLoading ? null : comments.length === 0 ? (
        <p className="blog-comments-empty">{t("blog.commentsNone")}</p>
      ) : (
        <div className="blog-comments-list">
          {comments.map(c => (
            <div key={c.id} className="blog-comment">
              <div className="blog-comment-avatar blog-avatar--clickable" onClick={() => navigate("publicProfile", { userId: c.author_id })}>
                {c.profiles?.avatar_url
                  ? <img src={c.profiles.avatar_url} alt={c.profiles?.display_name || c.profiles?.email?.split("@")[0] || "User"} />
                  : (c.profiles?.display_name || c.profiles?.email || "?")[0].toUpperCase()
                }
              </div>
              <div className="blog-comment-body">
                <div className="blog-comment-meta">
                  <span className="blog-comment-author">
                    {c.profiles?.display_name || c.profiles?.email?.split("@")[0] || "Anonymous"}
                  </span>
                  <span className="blog-comment-time">
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="blog-comment-content">{c.content}</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {(c.author_id === user?.id || profile?.is_admin) && (
                    <button className="blog-comment-delete" onClick={() => deleteComment.mutate(c.id)}>
                      {t("common.delete")}
                    </button>
                  )}
                  {c.author_id !== user?.id && (
                    <button
                      className="forum-report-btn"
                      onClick={() => setReportTarget({ id: c.id, preview: c.content?.slice(0, 80) ?? "" })}
                      title={t("report.flag")}
                    >
                      🚩
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reportTarget && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setReportTarget(null)}
          isPending={submitReport.isPending}
        />
      )}

      <form className="blog-comment-form" onSubmit={handleSubmit}>
        <MentionAutocomplete
          className="blog-comment-input"
          placeholder={t("blog.commentPlaceholder")}
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          disabled={createComment.isPending}
        />
        {error && <div className="blog-comment-error">{error}</div>}
        <div className="blog-comment-actions">
          <button className="blog-comment-btn" type="submit" disabled={createComment.isPending || !text.trim()}>
            {createComment.isPending ? t("blog.commentPosting") : t("blog.commentPost")}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Single post view ─────────────────────────────────────────────────────────
function PostView({ slug, onBack, user, profile, navigate, darkMode, setDarkMode, i18n, onLogout, ...rest }) {
  const { data: post, isLoading } = usePostBySlug(slug);
  const { data: likedIds = [] } = useUserBlogLikes(user?.id);
  const toggleLike = useToggleBlogLike(user?.id);
  const deletePost = useDeletePost(user?.id);
  const { t } = useTranslation();
  const isAdmin = profile?.is_admin;

  const minRead = useMemo(() => {
    const words = (post?.content || "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [post?.content]);

  const sanitizedContent = useMemo(() => {
    if (!post?.content) return "";
    const html = /<[a-z][\s\S]*>/i.test(post.content)
      ? post.content
      : post.content.split(/\n\n+/).map(p => `<p>${p}</p>`).join("");
    return sanitizeRich(html);
  }, [post?.content]);

  useEffect(() => {
    if (post?.title) document.title = `${post.title} — NWT Progress`;
    return () => { document.title = "NWT Progress"; };
  }, [post?.title]);

  if (isLoading) return (
    <div className="blog-loading"><div className="blog-spinner" /></div>
  );
  if (!post) return (
    <div className="blog-not-found">
      <p>{t("blog.notFound")}</p>
      <button className="blog-back-btn" onClick={onBack}>{t("blog.backToBlog")}</button>
    </div>
  );

  return (
    <div className="blog-post-view">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
      <div
        className="blog-post-hero"
        style={{ background: post.cover_url ? undefined : getGradient(post.id) }}
      >
        {post.cover_url && <img src={post.cover_url} className="blog-post-hero-img" alt={post.title} />}
        <div className="blog-post-hero-overlay">
          <button className="blog-post-back-btn" onClick={onBack}>{t("blog.backToBlog")}</button>
          <div className="blog-post-hero-meta">
            <h1 className="blog-post-hero-title">{post.title}</h1>
            <div className="blog-post-hero-byline">
              <div className="blog-author-avatar blog-author-avatar--sm blog-avatar--clickable" onClick={() => navigate("publicProfile", { userId: post.author_id })}>
                {post.profiles?.avatar_url
                  ? <img src={post.profiles.avatar_url} alt={authorName(post)} />
                  : authorInitial(post)
                }
              </div>
              <span>{authorName(post)}</span>
              <span className="blog-dot">·</span>
              <span>{formatDate(post.created_at)}</span>
              <span className="blog-dot">·</span>
              <span>{t("blog.minRead", { count: minRead })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-post-body">
        {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
        <div className="blog-post-content">
          {sanitizedContent && <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />}
        </div>


        <div className="blog-author-card">
          <div className="blog-author-avatar blog-author-avatar--lg blog-avatar--clickable" onClick={() => navigate("publicProfile", { userId: post.author_id })}>
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt={authorName(post)} />
              : authorInitial(post)
            }
          </div>
          <div>
            <div className="blog-author-card-name">{authorName(post)}</div>
            <div className="blog-author-card-email">{post.profiles?.email}</div>
          </div>
        </div>

        {user && (
          <div className="blog-like-row">
            <button
              className={`blog-like-btn${likedIds.includes(post.id) ? " liked" : ""}`}
              onClick={() => toggleLike.mutate(post.id, { onError: () => toast(t("blog.likeError")) })}
              disabled={toggleLike.isPending}
            >
              👍 <span className="blog-like-count">{post.like_count ?? 0}</span>
            </button>
            <BookmarkButton userId={user.id} postId={post.id} />
            {(isAdmin || post.author_id === user.id) && (
              <button
                className="blog-comment-delete"
                style={{ marginLeft: "auto" }}
                onClick={() => deletePost.mutate(post.id, { onSuccess: onBack })}
                disabled={deletePost.isPending}
              >
                {deletePost.isPending ? t("common.deleting") : t("common.delete")} {t("blog.deletePost")}
              </button>
            )}
          </div>
        )}

        {user && <PostComments postId={post.id} postAuthorId={post.author_id} postSlug={post.slug} user={user} profile={profile} navigate={navigate} />}
      </div>
    </div>
  );
}

// ── Post listing card ─────────────────────────────────────────────────────────
const PostCard = memo(function PostCard({ post, onSelect, navigate, user }) {
  const { t } = useTranslation();
  const minRead = useMemo(() => {
    const words = (post.content || "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [post.content]);

  return (
    <article className="blog-card" onClick={() => onSelect(post.slug)}>
      <div
        className="blog-card-cover"
        style={{ background: post.cover_url ? undefined : getGradient(post.id) }}
      >
        {post.cover_url && <img src={post.cover_url} className="blog-card-cover-img" alt={post.title} />}
        <div className="blog-card-cover-shine" />
      </div>
      <div className="blog-card-body">
        <p className="blog-card-excerpt">{post.excerpt || t("blog.readMore")}</p>
        <h2 className="blog-card-title">{post.title}</h2>
        <div className="blog-card-footer">
          <div className="blog-author-avatar blog-author-avatar--xs blog-avatar--clickable" onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: post.author_id }); }}>
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt={authorName(post)} />
              : authorInitial(post)
            }
          </div>
          <span className="blog-card-author">{authorName(post)}</span>
          <span className="blog-dot">·</span>
          <span className="blog-card-date">{formatDate(post.created_at)}</span>
          <span className="blog-card-readtime">{t("blog.minRead", { count: minRead })}</span>
          {post.like_count > 0 && (
            <span className="blog-card-likes">👍 {post.like_count}</span>
          )}
          {user && <BookmarkButton userId={user.id} postId={post.id} />}
        </div>
      </div>
    </article>
  );
});

// ── Main Blog Page ────────────────────────────────────────────────────────────
export default function BlogPage({ user, profile, onBack, onWriteClick, slug, onSelectPost, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { data: posts = [], isLoading } = usePublishedPosts();
  const { t } = useTranslation();

  useEffect(() => {
    if (!slug) document.title = "Blog — NWT Progress";
    return () => { document.title = "NWT Progress"; };
  }, [slug]);

  if (slug) {
    return <PostView slug={slug} onBack={() => onSelectPost(null)} user={user} profile={profile} navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} />;
  }

  return (
    <div className="blog-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
      {/* Nav */}
      <nav className="blog-nav">
        <button className="blog-back-btn" onClick={onBack}>{t("blog.backToBible")}</button>
        <div className="blog-nav-right">
          {(profile?.can_blog || profile?.is_admin) && (
            <button className="blog-write-btn" onClick={onWriteClick}>{t("blog.myPosts")}</button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="blog-hero">
        <div className="blog-hero-glow blog-hero-glow--1" />
        <div className="blog-hero-glow blog-hero-glow--2" />
        <div className="blog-hero-glow blog-hero-glow--3" />
        <div className="blog-hero-inner">
          <div className="blog-hero-badge">{t("blog.badge")}</div>
          <h1 className="blog-hero-title">{t("blog.title")}</h1>
          <p className="blog-hero-sub">{t("blog.subtitle")}</p>
          {posts.length > 0 && (
            <p className="blog-hero-count">{t("blog.postCount", { count: posts.length })}</p>
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
            <h3>{t("blog.noPosts")}</h3>
            <p>{t("blog.noPostsSub")}</p>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map(post => (
              <PostCard key={post.id} post={post} onSelect={onSelectPost} navigate={navigate} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
