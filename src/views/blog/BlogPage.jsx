import { useState, useMemo, memo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeRich } from "../../lib/sanitize";
import PageNav from "../../components/PageNav";
import LoadingSpinner from "../../components/LoadingSpinner";
import ReportModal from "../../components/ReportModal";
import BookmarkButton from "../../components/bookmarks/BookmarkButton";
import MentionAutocomplete from "../../components/mentions/MentionAutocomplete";
import { usePublishedPosts, usePostBySlug, useComments, useCreateComment, useDeleteComment, useDeletePost, useUserBlogLikes, useToggleBlogLike } from "../../hooks/useBlog";
import { toast } from "../../lib/toast";
import { useSubmitReport } from "../../hooks/useReports";
import { useMeta } from "../../hooks/useMeta";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import { useSubscription } from "../../hooks/useSubscription";
import "../../styles/blog.css";
import "../../styles/editor.css";
import "../../styles/mentions.css";
import { formatDate, authorName as authorNameUtil } from "../../utils/formatters";

// Curated Unsplash fallback images for posts without a cover photo.
// All are bible / nature / faith themed and freely available via the CDN.
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80", // open Bible on table
  "https://images.unsplash.com/photo-1455541504462-57ebb2a9cec1?auto=format&fit=crop&w=800&q=80", // Middle East landscape
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80", // mountain valley
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80", // golden sunrise over water
  "https://images.unsplash.com/photo-1476820865390-c52aeebb9891?auto=format&fit=crop&w=800&q=80", // dramatic sunset over lake
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80", // rolling green hills
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80", // misty mountain peaks
  "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=800&q=80", // starry night sky
  "https://images.unsplash.com/photo-1519817914152-22d216bb9170?auto=format&fit=crop&w=800&q=80", // desert landscape
  "https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=800&q=80", // ancient stone pathway
];

// Deterministic hash so the same post always gets the same fallback image
function hashId(id) {
  let h = 0;
  for (const c of (id ?? "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

function getFallbackImage(id) {
  return FALLBACK_IMAGES[hashId(id) % FALLBACK_IMAGES.length];
}

// BlogPage uses long month format and a post-shaped object
function formatDateLong(iso) { return formatDate(iso, "long"); }
function authorName(post) { return authorNameUtil(post); }

function authorInitial(post) {
  return (post.profiles?.display_name || post.profiles?.email || "A")[0].toUpperCase();
}

const RichContent = memo(function RichContent({ text }) {
  if (!text) return null;
  const html = useMemo(() => {
    const h = /<[a-z][\s\S]*>/i.test(text)
      ? text
      : text.split(/\n\n+/).map(p => `<p>${p}</p>`).join("");
    return sanitizeRich(h);
  }, [text]);
  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />;
});

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
                  ? <img src={c.profiles.avatar_url} alt={c.profiles?.display_name || c.profiles?.email?.split("@")[0] || "User"} width={36} height={36} loading="lazy" />
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
function PostView({ slug, onBack, onSelectPost, user, profile, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade, ...rest }) {
  const { data: post, isLoading } = usePostBySlug(slug);
  const { data: likedIds = [] } = useUserBlogLikes(user?.id);
  const toggleLike = useToggleBlogLike(user?.id);
  const deletePost = useDeletePost(user?.id);
  const { t } = useTranslation();
  const isAdmin = profile?.is_admin;
  const { isPremium } = useSubscription(user?.id);
  const getOrCreateDM = useGetOrCreateDM();

  // Language toggle: auto-use Spanish if user's language is es and translation exists
  const currentLang = i18n?.language?.split("-")[0] ?? "en";
  const hasEsTranslation = !!(post?.translations?.es);
  const [showEs, setShowEs] = useState(false);
  useEffect(() => {
    setShowEs(currentLang === "es" && hasEsTranslation);
  }, [currentLang, hasEsTranslation]);

  const displayTitle   = (showEs && post?.translations?.es?.title)   || post?.title;
  const displayExcerpt = (showEs && post?.translations?.es?.excerpt) || post?.excerpt;
  const displayContent = (showEs && post?.translations?.es?.content) || post?.content;

  const minRead = useMemo(() => {
    const words = (displayContent || "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [displayContent]);

  const sanitizedContent = useMemo(() => {
    if (!displayContent) return "";
    const html = /<[a-z][\s\S]*>/i.test(displayContent)
      ? displayContent
      : displayContent.split(/\n\n+/).map(p => `<p>${p}</p>`).join("");
    return sanitizeRich(html);
  }, [displayContent]);

  useMeta({
    title: displayTitle,
    description: displayExcerpt,
    image: post?.cover_url || undefined,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!post) return (
    <div className="blog-not-found">
      <p>{t("blog.notFound")}</p>
      <button className="back-btn" onClick={onBack}>{t("blog.backToBlog")}</button>
    </div>
  );

  return (
    <div className="blog-post-view">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>
      <div className="blog-post-hero">
        <img
          src={post.cover_url || getFallbackImage(post.id)}
          className="blog-post-hero-img"
          alt={displayTitle}
        />
        <div className="blog-post-hero-overlay">
          <button className="back-btn" onClick={onBack}>{t("blog.backToBlog")}</button>
          <div className="blog-post-hero-meta">
            <h1 className="blog-post-hero-title">{displayTitle}</h1>
            <div className="blog-post-hero-byline">
              <div className="blog-author-avatar blog-author-avatar--sm blog-avatar--clickable" onClick={() => navigate("publicProfile", { userId: post.author_id })}>
                {post.profiles?.avatar_url
                  ? <img src={post.profiles.avatar_url} alt={authorName(post)} width={32} height={32} loading="lazy" />
                  : authorInitial(post)
                }
              </div>
              <span>{authorName(post)}</span>
              <span className="blog-dot">·</span>
              <span>{formatDateLong(post.created_at)}</span>
              <span className="blog-dot">·</span>
              <span>{t("blog.minRead", { count: minRead })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="blog-post-body">
        {hasEsTranslation && (
          <div className="blog-lang-toggle">
            <button
              className={`blog-lang-toggle-btn${!showEs ? " active" : ""}`}
              onClick={() => setShowEs(false)}
            >🇺🇸 English</button>
            <button
              className={`blog-lang-toggle-btn${showEs ? " active" : ""}`}
              onClick={() => setShowEs(true)}
            >🇪🇸 Español</button>
          </div>
        )}
        {displayExcerpt && <p className="blog-post-excerpt">{displayExcerpt}</p>}
        <div className="blog-post-content">
          {sanitizedContent && <div className="rich-content" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />}
        </div>


        <div className="blog-author-card">
          <div className="blog-author-avatar blog-author-avatar--lg blog-avatar--clickable" onClick={() => navigate("publicProfile", { userId: post.author_id })}>
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt={authorName(post)} width={48} height={48} loading="lazy" />
              : authorInitial(post)
            }
          </div>
          <div className="blog-author-card-info">
            <div className="blog-author-card-name">{authorName(post)}</div>
            <div className="blog-author-card-email">{post.profiles?.email}</div>
          </div>
          {user && post.author_id !== user.id && (
            <button
              className={`blog-author-msg-btn${!isPremium ? " blog-author-msg-btn--locked" : ""}`}
              disabled={getOrCreateDM.isPending}
              onClick={isPremium
                ? () => getOrCreateDM.mutate(post.author_id, {
                    onSuccess: (cid) => navigate("messages", {
                      conversationId: cid,
                      otherDisplayName: authorName(post),
                      otherAvatarUrl: post.profiles?.avatar_url ?? null,
                    }),
                  })
                : onUpgrade
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Message{!isPremium && <span className="msg-btn-pro-badge">✦</span>}
            </button>
          )}
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

        {user
          ? <PostComments postId={post.id} postAuthorId={post.author_id} postSlug={post.slug} user={user} profile={profile} navigate={navigate} />
          : (
            <div className="blog-guest-cta">
              <p>Want to join the conversation? <a href="/" onClick={e => { e.preventDefault(); history.pushState(null, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}>Sign in</a> or <a href="/" onClick={e => { e.preventDefault(); history.pushState(null, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}>create a free account</a> to leave a comment.</p>
            </div>
          )
        }
      </div>

      <RelatedPosts currentPost={post} onSelect={onSelectPost || onBack} navigate={navigate} user={user} />
    </div>
  );
}

// ── Related posts ─────────────────────────────────────────────────────────────
function RelatedPosts({ currentPost, onSelect, navigate, user }) {
  const { t } = useTranslation();
  const { data: allPosts = [] } = usePublishedPosts();

  const related = useMemo(() => {
    const others = allPosts.filter(p => p.id !== currentPost.id);
    const byAuthor = others.filter(p => p.author_id === currentPost.author_id);
    const rest = others.filter(p => p.author_id !== currentPost.author_id);
    return [...byAuthor, ...rest].slice(0, 3);
  }, [allPosts, currentPost]);

  if (related.length === 0) return null;

  const sameAuthor = related.some(p => p.author_id === currentPost.author_id);

  return (
    <div className="blog-related">
      <h3 className="blog-related-title">
        {sameAuthor
          ? t("blog.moreByAuthor", { name: authorName(currentPost) })
          : t("blog.morePosts")}
      </h3>
      <div className="blog-related-grid">
        {related.map(post => (
          <article key={post.id} className="blog-related-card" onClick={() => onSelect(post.slug)}>
            <div className="blog-related-cover">
              <img
                src={post.cover_url || getFallbackImage(post.id)}
                alt={post.title}
                loading="lazy"
              />
            </div>
            <div className="blog-related-body">
              <p className="blog-related-author">{authorName(post)}</p>
              <h4 className="blog-related-title-text">{post.title}</h4>
              <p className="blog-related-excerpt">{post.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── Post listing card ─────────────────────────────────────────────────────────
const PostCard = memo(function PostCard({ post, onSelect, navigate, user, lang }) {
  const { t } = useTranslation();
  const showEs = lang === "es" && !!post.translations?.es;
  const displayTitle   = (showEs && post.translations?.es?.title)   || post.title;
  const displayExcerpt = (showEs && post.translations?.es?.excerpt) || post.excerpt;

  const minRead = useMemo(() => {
    const words = (post.content || "").split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [post.content]);

  return (
    <article className="blog-card" onClick={() => onSelect(post.slug)}>
      <div className="blog-card-cover">
        <img
          src={post.cover_url || getFallbackImage(post.id)}
          className="blog-card-cover-img"
          alt={displayTitle}
          loading="lazy"
        />
        <div className="blog-card-cover-shine" />
      </div>
      <div className="blog-card-body">
        <p className="blog-card-excerpt">{displayExcerpt || t("blog.readMore")}</p>
        <h2 className="blog-card-title">{displayTitle}</h2>
        <div className="blog-card-footer">
          <div className="blog-author-avatar blog-author-avatar--xs blog-avatar--clickable" onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: post.author_id }); }}>
            {post.profiles?.avatar_url
              ? <img src={post.profiles.avatar_url} alt={authorName(post)} width={24} height={24} loading="lazy" />
              : authorInitial(post)
            }
          </div>
          <span className="blog-card-author">{authorName(post)}</span>
          <span className="blog-dot">·</span>
          <span className="blog-card-date">{formatDateLong(post.created_at)}</span>
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
export default function BlogPage({ user, profile, onBack, onWriteClick, slug, onSelectPost, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const userLang = i18n?.language?.split("-")[0] ?? "en";
  const [visibleCount, setVisibleCount] = useState(9);
  const [langFilter, setLangFilter] = useState(userLang);
  const { data: posts = [], isLoading } = usePublishedPosts(langFilter);

  useMeta(!slug ? { title: "Blog", description: "Reflections, studies, and insights from the NWT Progress community." } : {});

  if (slug) {
    const toLanding = () => onBack();
    return <PostView
      slug={slug}
      onBack={user ? () => onSelectPost(null) : toLanding}
      onSelectPost={user ? onSelectPost : toLanding}
      user={user}
      profile={profile}
      navigate={user ? navigate : () => toLanding()}
      darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} onUpgrade={onUpgrade}
    />;
  }

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  return (
    <div className="blog-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>
      {/* Nav */}
      <nav className="blog-nav">
        <button className="back-btn" onClick={onBack}>{t("blog.backToBible")}</button>
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

      {/* Language filter pills */}
      <div className="blog-lang-filter">
        <button
          className={`blog-lang-pill${langFilter === userLang ? " blog-lang-pill--active" : ""}`}
          onClick={() => { setLangFilter(userLang); setVisibleCount(9); }}
        >
          {t("forum.myLanguage")}
        </button>
        <button
          className={`blog-lang-pill${langFilter === null ? " blog-lang-pill--active" : ""}`}
          onClick={() => { setLangFilter(null); setVisibleCount(9); }}
        >
          {t("forum.allLanguages")}
        </button>
      </div>

      {/* Posts */}
      <div className="blog-content">
        {isLoading ? (
          <LoadingSpinner />
        ) : posts.length === 0 ? (
          <div className="blog-empty">
            <div className="blog-empty-icon">📝</div>
            <h3>{t("blog.noPosts")}</h3>
            <p>{t("blog.noPostsSub")}</p>
          </div>
        ) : (
          <>
            <div className="blog-grid">
              {visiblePosts.map(post => (
                <PostCard key={post.id} post={post} onSelect={onSelectPost} navigate={navigate} user={user} lang={userLang} />
              ))}
            </div>
            {hasMore && (
              <div className="blog-load-more">
                <button className="blog-load-more-btn" onClick={() => setVisibleCount(c => c + 9)}>
                  {t("blog.loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
