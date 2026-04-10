import { useState, useMemo, memo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeRich } from "../../lib/sanitize";
import TopBar from "../../components/TopBar";
import ReportModal from "../../components/ReportModal";
import BookmarkButton from "../../components/bookmarks/BookmarkButton";
import ShareButtons from "../../components/ShareButtons";
import "../../styles/share-buttons.css";
import "../../styles/social.css";
import "../../styles/forum.css";
import MentionAutocomplete from "../../components/mentions/MentionAutocomplete";
import { usePublishedPosts, usePostBySlug, useComments, useCreateComment, useDeleteComment, useDeletePost, useUserBlogLikes, useToggleBlogLike } from "../../hooks/useBlog";
import { toast } from "../../lib/toast";
import { useSubmitReport } from "../../hooks/useReports";
import { useBlocks, useBlockUser, useUnblockUser } from "../../hooks/useBlocks";
import { useMeta } from "../../hooks/useMeta";
import { useGetOrCreateDM } from "../../hooks/useMessages";
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

const RichContent = memo(function RichContent({ text }: { text: string }) {
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
  const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
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

      {isLoading ? (
        <div aria-busy="true">
          {[0, 1, 2].map(i => (
            <div key={i} className="blog-comment" style={{ opacity: 0.5 }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ height: 11, width: "28%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, width: "85%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, width: "60%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="blog-comments-empty">{t("blog.commentsNone")}</p>
      ) : (
        <div className="blog-comments-list">
          {comments.filter(c => !blockedSet.has(c.author_id)).map(c => (
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
                    <>
                      <button
                        className="forum-report-btn"
                        onClick={() => setReportTarget({ id: c.id, preview: c.content?.slice(0, 80) ?? "" })}
                        title={t("report.flag")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                      </button>
                      <button
                        className="forum-report-btn"
                        onClick={() => {
                          if (blockedSet.has(c.author_id)) {
                            unblockUser.mutate(c.author_id);
                          } else {
                            blockUser.mutate(c.author_id);
                          }
                        }}
                        title={blockedSet.has(c.author_id) ? "Unblock user" : "Block user"}
                        aria-label={blockedSet.has(c.author_id) ? "Unblock user" : "Block user"}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                      </button>
                    </>
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
  const { data: allPosts = [] } = usePublishedPosts(null);
  const { data: likedIds = [] } = useUserBlogLikes(user?.id);
  const toggleLike = useToggleBlogLike(user?.id);
  const deletePost = useDeletePost(user?.id);
  const { t } = useTranslation();
  const isAdmin = profile?.is_admin;
  const getOrCreateDM = useGetOrCreateDM();
  const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();

  // Increment view count once per post view
  useEffect(() => {
    if (post?.id) {
      import("../../api/blog").then(({ blogApi }) => blogApi.incrementViewCount(post.id));
    }
  }, [post?.id]);

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

  if (isLoading) return (
    <div className="blog-post-view">
      <div className="skeleton" style={{ width: "100%", height: 220 }} />
      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ height: 28, width: "70%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: 180, borderRadius: 6 }} />
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "90%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "60%", borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
  if (!post) return (
    <div className="blog-not-found">
      <p>{t("blog.notFound")}</p>
      <button className="back-btn" onClick={onBack}>{t("blog.backToBlog")}</button>
    </div>
  );

  return (
    <div className="blog-post-view">
      {!user && (
        <TopBar
          navigate={(page) => { if (page === "home") onBack(); else onBack(); }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={null}
          currentPage="blog"
          onSearchClick={() => {}}
          onLogout={null}
        />
      )}
      <div className="blog-post-hero">
        <img
          src={post.cover_url || getFallbackImage(post.id)}
          className="blog-post-hero-img"
          alt={displayTitle}
          fetchPriority="high"
          onError={(e) => { e.currentTarget.src = getFallbackImage(post.id); }}
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
              {post.view_count > 0 && <><span className="blog-dot">·</span><span>{post.view_count.toLocaleString()} views</span></>}
            </div>
            <ShareButtons path={`/blog/${post.slug}`} title={displayTitle} type="blog" />
          </div>
        </div>
      </div>

      <div className="blog-post-body">
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
              className="blog-author-msg-btn"
              disabled={getOrCreateDM.isPending}
              onClick={() => getOrCreateDM.mutate(post.author_id, {
                onSuccess: (cid) => navigate("messages", {
                  conversationId: cid,
                  otherDisplayName: authorName(post),
                  otherAvatarUrl: post.profiles?.avatar_url ?? null,
                }),
              })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Message
            </button>
          )}
          {user && post.author_id !== user.id && (
            <button
              className="blog-author-msg-btn"
              onClick={() => {
                if (blockedSet.has(post.author_id)) {
                  unblockUser.mutate(post.author_id);
                } else {
                  blockUser.mutate(post.author_id);
                }
              }}
              disabled={blockUser.isPending || unblockUser.isPending}
            >
              {blockedSet.has(post.author_id) ? "Unblock" : "Block"}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> <span className="blog-like-count">{post.like_count ?? 0}</span>
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

        {/* Bottom share prompt — shown after reading */}
        <div className="blog-share-prompt">
          <p className="blog-share-prompt-text">Found this helpful? Share it.</p>
          <ShareButtons path={`/blog/${post.slug}`} title={displayTitle} type="blog" />
        </div>

        {user
          ? <PostComments postId={post.id} postAuthorId={post.author_id} postSlug={post.slug} user={user} profile={profile} navigate={navigate} />
          : (
            <div className="blog-guest-cta">
              <p>Want to join the conversation? <a href="/" onClick={e => { e.preventDefault(); history.pushState(null, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}>Sign in</a> or <a href="/" onClick={e => { e.preventDefault(); history.pushState(null, "", "/"); window.dispatchEvent(new PopStateEvent("popstate")); }}>create a free account</a> to leave a comment.</p>
            </div>
          )
        }
      </div>

      <PostNav allPosts={allPosts} currentPost={post} onSelect={onSelectPost} />
      <RelatedPosts currentPost={post} onSelect={onSelectPost || onBack} navigate={navigate} user={user} />
    </div>
  );
}

// ── Post navigation (prev / next) ─────────────────────────────────────────────
function PostNav({ allPosts, currentPost, onSelect }) {
  const idx = allPosts.findIndex(p => p.id === currentPost?.id);
  if (idx < 0 || allPosts.length < 2) return null;
  // allPosts is newest-first: lower index = newer, higher index = older
  const prevPost = idx > 0 ? allPosts[idx - 1] : null;            // newer
  const nextPost = idx < allPosts.length - 1 ? allPosts[idx + 1] : null; // older

  return (
    <div className="blog-post-nav">
      <div className="blog-post-nav-inner">
        {prevPost ? (
          <button className="blog-post-nav-btn blog-post-nav-btn--prev" onClick={() => onSelect(prevPost.slug)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="blog-post-nav-label">
              <span className="blog-post-nav-dir">Previous</span>
              <span className="blog-post-nav-title">{prevPost.title}</span>
            </span>
          </button>
        ) : <span />}
        {nextPost ? (
          <button className="blog-post-nav-btn blog-post-nav-btn--next" onClick={() => onSelect(nextPost.slug)}>
            <span className="blog-post-nav-label">
              <span className="blog-post-nav-dir">Next</span>
              <span className="blog-post-nav-title">{nextPost.title}</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ) : <span />}
      </div>
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
                onError={(e) => { e.currentTarget.src = getFallbackImage(post.id); }}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
const PostCard = memo(function PostCard({ post, onSelect, navigate, user, lang }: { post: any; onSelect: any; navigate: any; user: any; lang: string }) {
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
          onError={(e) => { e.currentTarget.src = getFallbackImage(post.id); }}
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
            <span className="blog-card-likes"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:"middle"}}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> {post.like_count}</span>
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
  const { data: posts = [], isLoading } = usePublishedPosts(userLang);
  const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);

  useMeta(!slug ? { title: "Blog", description: "Reflections, studies, and insights from the JW Study community." } : {});

  if (slug) {
    return <PostView
      slug={slug}
      onBack={() => onSelectPost ? onSelectPost(null) : onBack()}
      onSelectPost={onSelectPost || onBack}
      user={user}
      profile={profile}
      navigate={navigate}
      darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} onLogout={onLogout} onUpgrade={onUpgrade}
    />;
  }

  const visiblePosts = posts.filter(p => !blockedSet.has(p.author_id)).slice(0, visibleCount);
  const hasMore = visibleCount < posts.filter(p => !blockedSet.has(p.author_id)).length;

  return (
    <div className="blog-wrap">
      {/* Show full TopBar for unauthenticated visitors so they can sign in / toggle dark mode */}
      {!user ? (
        <TopBar
          navigate={(page) => { if (page === "home") onBack(); else onBack(); }}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={null}
          currentPage="blog"
          onSearchClick={() => {}}
          onLogout={null}
        />
      ) : (
        <nav className="blog-nav">
          <div className="blog-nav-left" />
          <div className="blog-nav-right">
            {(profile?.can_blog || profile?.is_admin) && (
              <button className="blog-write-btn" onClick={onWriteClick}>{t("blog.myPosts")}</button>
            )}
          </div>
        </nav>
      )}

      <h1 className="page-section-title">{t("blog.title")}</h1>

      {/* Posts */}
      <div className="blog-content">
        {isLoading ? (
          <div className="blog-grid">
            {[0,1,2,3,4,5].map(i => (
              <article key={i} className="blog-card" style={{ pointerEvents: "none" }}>
                <div className="blog-card-cover">
                  <div className="skeleton" style={{ width: "100%", height: "100%" }} />
                </div>
                <div className="blog-card-body">
                  <div className="skeleton" style={{ height: 13, width: "90%", borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 18, width: "70%", borderRadius: 6, marginTop: 8 }} />
                  <div className="blog-card-footer" style={{ marginTop: 12 }}>
                    <div className="skeleton" style={{ width: 24, height: 24, borderRadius: "50%" }} />
                    <div className="skeleton" style={{ height: 11, width: 100, borderRadius: 6 }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="blog-empty">
            <div className="blog-empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></div>
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
