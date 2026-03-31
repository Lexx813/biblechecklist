import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeRich } from "../../lib/sanitize";
import { useAISkill } from "../../hooks/useAISkill";
import "../../styles/ai-tools.css";
import ConfirmModal from "../../components/ConfirmModal";
const RichTextEditor = lazy(() => import("../../components/RichTextEditor"));
import ReportModal from "../../components/ReportModal";
import PageNav from "../../components/PageNav";
import LoadingSpinner from "../../components/LoadingSpinner";
import BookmarkButton from "../../components/bookmarks/BookmarkButton";
import { forumApi } from "../../api/forum";
import {
  useCategories, useThreads, useThread, useReplies,
  useTopThreads,
  useCreateThread, useCreateReply,
  useUpdateThread, useUpdateReply, useDeleteThread, useDeleteReply,
  usePinThread, useLockThread,
  useUserForumLikes, useToggleThreadLike, useToggleReplyLike,
  useMarkSolution,
  useUserWatches, useToggleWatch,
  useThreadReactions, useToggleReaction,
} from "../../hooks/useForum";
import { toast } from "../../lib/toast";
import { useSubmitReport } from "../../hooks/useReports";
import { useSubscription } from "../../hooks/useSubscription";
import { useMeta } from "../../hooks/useMeta";
import "../../styles/forum.css";
import "../../styles/social.css";

const REACTION_EMOJIS = ["🙏", "❤️", "💡"];

const LEVEL_EMOJIS = [null,"📖","📚","🌱","👨‍👩‍👦","🏺","⚔️","🎵","📯","🕊️","🌍","🔮","👑"];
function BadgeChip({ level }) {
  if (!level || level < 1) return null;
  return (
    <span className="forum-badge-chip" title={`Level ${level}`}>
      {LEVEL_EMOJIS[Math.min(level, 12)]}
    </span>
  );
}

function ModBadge({ profile }) {
  if (profile?.is_admin) return <span className="forum-role-chip forum-role-chip--admin" title="Admin">⚙️</span>;
  if (profile?.is_moderator) return <span className="forum-role-chip forum-role-chip--mod" title="Moderator">🛡️</span>;
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function displayName(profile) {
  return profile?.display_name || profile?.email?.split("@")[0] || "Anonymous";
}

function initial(profile) {
  return (profile?.display_name || profile?.email || "A")[0].toUpperCase();
}

function timeAgo(iso, t) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return t("forum.timeJustNow");
  if (m < 60) return t("forum.timeMinutes", { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t("forum.timeHours", { count: h });
  const d = Math.floor(h / 24);
  if (d < 30) return t("forum.timeDays", { count: d });
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const AVATAR_PX = { lg: 40, md: 36, sm: 28 };
function Avatar({ profile, size = "md", onClick }) {
  const cls = `forum-avatar forum-avatar--${size}${onClick ? " forum-avatar--clickable" : ""}`;
  const px = AVATAR_PX[size] ?? 36;
  if (profile?.avatar_url) {
    return <img className={cls} src={profile.avatar_url} alt={displayName(profile)} width={px} height={px} loading="lazy" onClick={onClick} />;
  }
  return <div className={`${cls} forum-avatar--fallback`} onClick={onClick}>{initial(profile)}</div>;
}

// ── Reactions bar ─────────────────────────────────────────────────────────────
function ReactionsBar({ contentType, contentId, reactions, onToggle }) {
  const key = (emoji) => `${contentType}:${contentId}:${emoji}`;
  return (
    <div className="forum-reactions">
      {REACTION_EMOJIS.map(emoji => {
        const k = key(emoji);
        const count = reactions?.counts?.[k] ?? 0;
        const active = reactions?.mine?.includes(k) ?? false;
        return (
          <button
            key={emoji}
            className={`forum-reaction-btn${active ? " forum-reaction-btn--active" : ""}`}
            onClick={() => onToggle(contentType, contentId, emoji)}
            title={emoji}
          >
            {emoji} {count > 0 && <span className="forum-reaction-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Thread View ───────────────────────────────────────────────────────────────
const REPLIES_PER_PAGE = 20;

function ThreadView({ threadId, user, profile, onBack, categoryId, categoryName, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { data: thread, isLoading: threadLoading } = useThread(threadId);
  const { data: allReplies = [], isLoading: repliesLoading } = useReplies(threadId);
  const [visibleReplies, setVisibleReplies] = useState(REPLIES_PER_PAGE);
  const createReply = useCreateReply(threadId, thread?.author_id, categoryId);
  const updateReply = useUpdateReply(threadId);
  const deleteReply = useDeleteReply(threadId);
  const updateThread = useUpdateThread(threadId);
  const deleteThread = useDeleteThread(categoryId);
  const pinThread    = usePinThread(categoryId);
  const lockThread   = useLockThread(categoryId);
  const markSolution = useMarkSolution(threadId);
  const { data: forumLikes = { threads: [], replies: [] } } = useUserForumLikes(user.id);
  const toggleThreadLike = useToggleThreadLike(user.id, categoryId);
  const toggleReplyLike  = useToggleReplyLike(user.id, threadId);
  const { data: watches = [] } = useUserWatches(user.id);
  const toggleWatch = useToggleWatch(user.id, threadId);
  const { data: reactions = { counts: {}, mine: [] } } = useThreadReactions(threadId, user.id);
  const toggleReaction = useToggleReaction(user.id, threadId);
  const submitReport = useSubmitReport();
  const { t } = useTranslation();

  const isWatching = watches.includes(threadId);
  const replies = allReplies.slice(0, visibleReplies);
  const hasMoreReplies = visibleReplies < allReplies.length;

  const [replyText, setReplyText]         = useState(() => {
    try { return localStorage.getItem(`forum-draft-reply-${threadId}`) || ""; } catch { return ""; }
  });
  const [replyError, setReplyError]       = useState("");
  const [mentionedIds, setMentionedIds]   = useState([]);
  const [editing, setEditing]             = useState(false);
  const [editTitle, setEditTitle]         = useState("");
  const [editContent, setEditContent]     = useState("");
  const [editingReplyId, setEditingReplyId]       = useState(null);
  const [editReplyContent, setEditReplyContent]   = useState("");
  const [confirm, setConfirm] = useState(null);
  const [reportTarget, setReportTarget]   = useState(null); // { type, id, preview }
  const bottomRef = useRef(null);

  // Increment view count on mount
  useEffect(() => {
    if (threadId) forumApi.incrementView(threadId).catch(() => {});
  }, [threadId]);

  // Persist reply draft
  useEffect(() => {
    try { localStorage.setItem(`forum-draft-reply-${threadId}`, replyText); } catch {}
  }, [replyText, threadId]);

  function handleReport(reason) {
    if (!reportTarget) return;
    submitReport.mutate(
      { reporterId: user.id, contentType: reportTarget.type, contentId: reportTarget.id, contentPreview: reportTarget.preview, reason },
      { onSuccess: () => setReportTarget(null), onError: () => setReportTarget(null) }
    );
  }

  const isAdmin      = profile?.is_admin;
  const canModerate  = isAdmin || profile?.is_moderator;
  const isAuthor     = thread?.author_id === user.id;
  const isLocked     = thread?.locked;

  function startEdit() {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditing(true);
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    updateThread.mutate({ title: editTitle.trim(), content: editContent.trim() }, {
      onSuccess: () => setEditing(false),
    });
  }

  function handleReply(e) {
    e.preventDefault();
    setReplyError("");
    if (!replyText.trim()) return setReplyError(t("forum.replyEmptyError"));
    createReply.mutate({ userId: user.id, content: replyText.trim(), mentionedUserIds: mentionedIds }, {
      onSuccess: () => {
        setReplyText("");
        try { localStorage.removeItem(`forum-draft-reply-${threadId}`); } catch {}
        setMentionedIds([]);
        setVisibleReplies(v => v + 1);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      },
      onError: (err) => setReplyError(err.message),
    });
  }

  function handleDeleteThread() {
    setConfirm({
      message: t("forum.deleteThreadConfirm"),
      onConfirm: () => deleteThread.mutate(threadId, { onSuccess: onBack }),
    });
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}#forum/${categoryId}/${threadId}`;
    navigator.clipboard?.writeText(url).then(() => toast(t("forum.linkCopied"))).catch(() => {});
  }

  function handleQuote(reply) {
    const authorText = displayName(reply.profiles);
    const plainText = reply.content?.replace(/<[^>]*>/g, "").slice(0, 200) ?? "";
    const quoteHtml = `<blockquote><p><strong>${authorText}:</strong></p><p>${plainText}</p></blockquote><p></p>`;
    setReplyText(quoteHtml);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function isEdited(item) {
    if (!item?.updated_at || !item?.created_at) return false;
    return new Date(item.updated_at) - new Date(item.created_at) > 60000;
  }

  useMeta({ title: thread?.title, description: thread?.content?.replace(/<[^>]*>/g, "").slice(0, 140) });

  if (threadLoading) return <LoadingSpinner />;
  if (!thread) return <div className="forum-empty"><p>{t("forum.threadNotFound")}</p></div>;

  return (
    <div className="forum-thread-view">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>

      {/* Breadcrumb */}
      <nav className="forum-breadcrumb">
        <button className="forum-breadcrumb-item" onClick={() => navigate("forum")}>{t("forum.breadcrumbForum")}</button>
        <span className="forum-breadcrumb-sep">›</span>
        <button className="forum-breadcrumb-item" onClick={onBack}>{categoryName}</button>
        <span className="forum-breadcrumb-sep">›</span>
        <span className="forum-breadcrumb-current">{thread.title}</span>
      </nav>

      {/* Thread header */}
      <div className="forum-thread-header">
        <div className="forum-thread-header-badges">
          {thread.pinned && <span className="forum-badge forum-badge--pin">📌 Pinned</span>}
          {thread.locked && <span className="forum-badge forum-badge--lock">🔒 Locked</span>}
          {thread.view_count > 0 && <span className="forum-view-count">👁 {thread.view_count.toLocaleString()}</span>}
        </div>
        <div className="forum-admin-tools">
          <button className="forum-tool-btn" onClick={handleShare} title={t("forum.share")}>🔗 {t("forum.share")}</button>
          <button
            className={`forum-tool-btn${isWatching ? " forum-tool-btn--active" : ""}`}
            onClick={() => toggleWatch.mutate()}
            title={isWatching ? t("forum.unwatch") : t("forum.watch")}
          >
            {isWatching ? "🔔" : "🔕"} {isWatching ? t("forum.watching") : t("forum.watch")}
          </button>
          <BookmarkButton userId={user.id} threadId={threadId} />
          {canModerate && (
            <>
              <button className="forum-tool-btn" onClick={() => pinThread.mutate({ threadId, value: !thread.pinned })}>
                {thread.pinned ? t("forum.unpin") : t("forum.pin")}
              </button>
              <button className="forum-tool-btn" onClick={() => lockThread.mutate({ threadId, value: !thread.locked })}>
                {thread.locked ? t("forum.unlock") : t("forum.lock")}
              </button>
            </>
          )}
          {(canModerate || isAuthor) && !editing && (
            <button className="forum-tool-btn" onClick={startEdit}>{t("common.edit")}</button>
          )}
          {(canModerate || isAuthor) && (
            <button className="forum-tool-btn forum-tool-btn--danger" onClick={handleDeleteThread}>
              {t("common.delete")}
            </button>
          )}
        </div>
      </div>

      {/* Original post */}
      <div className="forum-post forum-post--op">
        <div className="forum-post-aside">
          <Avatar profile={thread.profiles} onClick={() => navigate("publicProfile", { userId: thread.author_id })} />
          <span className="forum-post-author">
            {displayName(thread.profiles)}
            <BadgeChip level={thread.profiles?.top_badge_level} />
            <ModBadge profile={thread.profiles} />
          </span>
          <span className="forum-post-time">
            {timeAgo(thread.created_at, t)}
            {isEdited(thread) && <span className="forum-edited-tag"> · {t("forum.edited")}</span>}
          </span>
          <span className="forum-post-badge forum-post-badge--op">{t("forum.op")}</span>
        </div>
        <div className="forum-post-body">
          {editing ? (
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                id="forum-edit-title"
                name="title"
                className="forum-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                disabled={updateThread.isPending}
              />
              <Suspense fallback={<div style={{ height: 80 }} />}>
                <RichTextEditor
                  content={editContent}
                  onChange={setEditContent}
                  minimal
                  disabled={updateThread.isPending}
                />
              </Suspense>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="forum-submit-btn" type="submit" disabled={updateThread.isPending}>
                  {updateThread.isPending ? t("common.saving") : t("common.save")}
                </button>
                <button type="button" className="forum-delete-btn" onClick={() => setEditing(false)} style={{ alignSelf: "center" }}>
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="forum-post-title">{thread.title}</h2>
              <div
                className="forum-post-content rich-content"
                dangerouslySetInnerHTML={{ __html: sanitizeRich(thread.content ?? "") }}
              />
              <div className="forum-post-actions">
                <button
                  className={`forum-like-btn${forumLikes.threads?.includes(threadId) ? " liked" : ""}`}
                  onClick={() => toggleThreadLike.mutate(threadId, { onError: () => toast(t("forum.likeError")) })}
                  disabled={toggleThreadLike.isPending}
                >
                  👍 <span className="forum-like-count">{thread.like_count ?? 0}</span>
                </button>
                <ReactionsBar
                  contentType="thread"
                  contentId={threadId}
                  reactions={reactions}
                  onToggle={(ct, cid, emoji) => toggleReaction.mutate({ contentType: ct, contentId: cid, emoji })}
                />
                {thread.author_id !== user.id && (
                  <button
                    className="forum-report-btn"
                    onClick={e => { e.stopPropagation(); setReportTarget({ type: "thread", id: thread.id, preview: thread.title }); }}
                    title={t("report.flag")}
                  >
                    🚩
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Replies */}
      {repliesLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="forum-replies">
          {allReplies.length > 0 && (
            <div className="forum-replies-count">{t("forum.replyCount", { count: allReplies.length })}</div>
          )}
          {replies.map((reply, i) => {
            const canModify = canModerate || reply.author_id === user.id;
            const isEditingThis = editingReplyId === reply.id;
            return (
              <div key={reply.id} className={`forum-post${reply.is_solution ? " forum-post--solution" : ""}`}>
                <div className="forum-post-aside">
                  <Avatar profile={reply.profiles} onClick={() => navigate("publicProfile", { userId: reply.author_id })} />
                  <span className="forum-post-author">
                    {displayName(reply.profiles)}
                    <BadgeChip level={reply.profiles?.top_badge_level} />
                    <ModBadge profile={reply.profiles} />
                  </span>
                  <span className="forum-post-time">
                    {timeAgo(reply.created_at, t)}
                    {isEdited(reply) && <span className="forum-edited-tag"> · {t("forum.edited")}</span>}
                  </span>
                  {reply.is_solution
                    ? <span className="forum-solution-badge">✓ {t("forum.solution")}</span>
                    : <span className="forum-post-num">#{i + 1}</span>
                  }
                </div>
                <div className="forum-post-body">
                  {isEditingThis ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <Suspense fallback={<div style={{ height: 60 }} />}>
                        <RichTextEditor
                          content={editReplyContent}
                          onChange={setEditReplyContent}
                          minimal
                          compact
                          disabled={updateReply.isPending}
                        />
                      </Suspense>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="forum-submit-btn"
                          disabled={updateReply.isPending || !editReplyContent || editReplyContent === "<p></p>"}
                          onClick={() => {
                            updateReply.mutate(
                              { replyId: reply.id, content: editReplyContent },
                              { onSuccess: () => setEditingReplyId(null) }
                            );
                          }}
                        >
                          {updateReply.isPending ? t("common.saving") : t("forum.saveReply")}
                        </button>
                        <button type="button" className="forum-delete-btn" style={{ alignSelf: "center" }} onClick={() => setEditingReplyId(null)}>
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="forum-post-content rich-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeRich(reply.content ?? "") }}
                    />
                  )}
                  {!isEditingThis && (
                    <div className="forum-post-actions">
                      <button
                        className={`forum-like-btn${forumLikes.replies?.includes(reply.id) ? " liked" : ""}`}
                        onClick={() => toggleReplyLike.mutate(reply.id, { onError: () => toast(t("forum.likeError")) })}
                        disabled={toggleReplyLike.isPending}
                      >
                        👍 <span className="forum-like-count">{reply.like_count ?? 0}</span>
                      </button>
                      <ReactionsBar
                        contentType="reply"
                        contentId={reply.id}
                        reactions={reactions}
                        onToggle={(ct, cid, emoji) => toggleReaction.mutate({ contentType: ct, contentId: cid, emoji })}
                      />
                      {!isLocked && (
                        <button className="forum-quote-btn" onClick={() => handleQuote(reply)} title={t("forum.quote")}>
                          💬 {t("forum.quote")}
                        </button>
                      )}
                      {(isAuthor || canModerate) && (
                        <button
                          className={`forum-solution-btn${reply.is_solution ? " forum-solution-btn--active" : ""}`}
                          onClick={() => markSolution.mutate({ replyId: reply.id, value: !reply.is_solution })}
                          disabled={markSolution.isPending}
                          title={reply.is_solution ? t("forum.unmarkSolution") : t("forum.markSolution")}
                        >
                          {reply.is_solution ? "✓ " + t("forum.solution") : "✓ " + t("forum.markSolution")}
                        </button>
                      )}
                      {canModify && (
                        <>
                          <button
                            className="forum-delete-btn"
                            onClick={() => { setEditingReplyId(reply.id); setEditReplyContent(reply.content ?? ""); }}
                          >
                            {t("forum.editReply")}
                          </button>
                          <button
                            className="forum-delete-btn"
                            onClick={() => setConfirm({
                              message: t("forum.deleteReplyConfirm"),
                              onConfirm: () => deleteReply.mutate(reply.id),
                            })}
                          >
                            {t("common.delete")}
                          </button>
                        </>
                      )}
                      {reply.author_id !== user.id && (
                        <button
                          className="forum-report-btn"
                          onClick={e => { e.stopPropagation(); setReportTarget({ type: "reply", id: reply.id, preview: reply.content?.replace(/<[^>]*>/g, "").slice(0, 80) ?? "" }); }}
                          title={t("report.flag")}
                        >
                          🚩
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {hasMoreReplies && (
            <button className="forum-load-more" onClick={() => setVisibleReplies(v => v + REPLIES_PER_PAGE)}>
              {t("forum.loadMoreReplies", { count: allReplies.length - visibleReplies })}
            </button>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {reportTarget && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setReportTarget(null)}
          isPending={submitReport.isPending}
        />
      )}

      {/* Reply form */}
      {isLocked ? (
        <div className="forum-locked-msg">{t("forum.lockedMsg")}</div>
      ) : (
        <form className="forum-reply-form" onSubmit={handleReply}>
          <div className="forum-reply-form-inner">
            <Avatar profile={profile} size="sm" />
            <div className="forum-reply-input-wrap">
              <Suspense fallback={<div style={{ height: 60 }} />}>
                <RichTextEditor
                  content={replyText}
                  onChange={setReplyText}
                  onMention={(u) => setMentionedIds(prev => prev.includes(u.id) ? prev : [...prev, u.id])}
                  placeholder={t("forum.replyPlaceholder")}
                  minimal
                  compact
                  disabled={createReply.isPending}
                  allowMentions
                />
              </Suspense>
              {replyError && <div className="forum-reply-error">{replyError}</div>}
              <div className="forum-reply-actions">
                <button className="forum-reply-btn" type="submit" disabled={createReply.isPending || !replyText || replyText === "<p></p>"}>
                  {createReply.isPending && <span className="btn-spin" />}{createReply.isPending ? t("forum.posting") : t("forum.postReply")}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Forum Post Assistant ──────────────────────────────────────────────────────

function ForumPostAssistant({ topic, draft }) {
  const { text, loading, error, run, reset } = useAISkill();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (ref.current && text) ref.current.scrollTop = ref.current.scrollHeight; }, [text]);

  function handleAssist() {
    if (!topic.trim() || loading) return;
    const cleanDraft = draft?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    run("forum_post", { topic: topic.trim(), draft: cleanDraft || undefined });
  }

  return (
    <div className="ait-inline" style={{ marginTop: "0.5rem" }}>
      <div className="ait-inline-header" onClick={() => setOpen(o => !o)}>
        <span className="ait-inline-title">✨ AI Post Assistant</span>
        <span className={`ait-inline-chevron${open ? " ait-inline-chevron--open" : ""}`}>▼</span>
      </div>
      {open && (
        <div className="ait-inline-body">
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted,#888)", margin: "0 0 0.75rem" }}>
            Get help crafting a warm, scripturally-grounded forum post based on your topic and draft.
          </p>
          <button
            className="ait-submit-btn"
            type="button"
            onClick={handleAssist}
            disabled={loading || !topic.trim()}
          >
            {loading ? "Writing…" : "✦ Help Me Write This Post"}
          </button>
          {(loading || text || error) && (
            <div className="ait-result" style={{ marginTop: "0.75rem" }}>
              <div className="ait-result-header">
                <span className="ait-result-label">AI Suggestion</span>
                {!loading && (text || error) && <button className="ait-result-clear" type="button" onClick={reset}>Clear</button>}
              </div>
              <div className="ait-result-body" ref={ref}>
                {loading && !text && (
                  <div className="ait-loading">
                    <span className="ait-dot" /><span className="ait-dot" /><span className="ait-dot" />
                    <span className="ait-loading-label">Thinking…</span>
                  </div>
                )}
                {error && <div className="ait-error">{error}</div>}
                {text && <div className="ait-response-text">{text}{loading && <span className="ait-cursor" />}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Thread List ───────────────────────────────────────────────────────────────
const THREADS_PER_PAGE = 20;
const SORT_OPTIONS = ["latest", "liked", "replied", "unanswered", "solved"];

function ThreadList({ category, user, onSelectThread, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription(user?.id);
  const userLang = i18n?.language?.split("-")[0] ?? "en";
  const [limit, setLimit] = useState(THREADS_PER_PAGE);
  const [langFilter, setLangFilter] = useState(userLang);
  const [sort, setSort] = useState("latest");
  const [search, setSearch] = useState("");
  const { data: rawThreads = [], isLoading } = useThreads(category.id, limit, langFilter);
  const createThread = useCreateThread(category.id);

  const draftKey = `forum-draft-thread-${category.id}`;
  const formKey = `forum-form-open-${category.id}`;
  const [showForm, setShowForm] = useState(() => {
    try { return sessionStorage.getItem(formKey) === "1"; } catch { return false; }
  });
  const [title, setTitle]   = useState(() => { try { return JSON.parse(localStorage.getItem(draftKey) || "{}").title || ""; } catch { return ""; } });
  const [content, setContent] = useState(() => { try { return JSON.parse(localStorage.getItem(draftKey) || "{}").content || ""; } catch { return ""; } });
  const [formError, setFormError] = useState("");

  const isDirty = title.trim().length > 0 || (content && content !== "<p></p>");

  // Warn on page unload when form has content
  useEffect(() => {
    if (!isDirty || !showForm) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, showForm]);

  // Persist thread draft and form open state
  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ title, content })); } catch {}
  }, [title, content, draftKey]);

  useEffect(() => {
    try {
      if (showForm) sessionStorage.setItem(formKey, "1");
      else sessionStorage.removeItem(formKey);
    } catch {}
  }, [showForm, formKey]);

  // Filter + sort threads client-side
  const threads = useCallback(() => {
    let list = [...rawThreads];
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(th => th.title?.toLowerCase().includes(q));
    }
    // Sort (pinned always first)
    const pinned = list.filter(th => th.pinned);
    let rest = list.filter(th => !th.pinned);
    if (sort === "liked") rest.sort((a, b) => (b.like_count ?? 0) - (a.like_count ?? 0));
    else if (sort === "replied") rest.sort((a, b) => (b.forum_replies?.[0]?.count ?? 0) - (a.forum_replies?.[0]?.count ?? 0));
    else if (sort === "unanswered") rest = rest.filter(th => (th.forum_replies?.[0]?.count ?? 0) === 0 && !th.locked);
    else if (sort === "solved") rest = rest.filter(th => th.has_solution);
    return [...pinned, ...rest];
  }, [rawThreads, search, sort])();

  function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    if (!title.trim()) return setFormError(t("forum.errorTitleRequired"));
    if (!content || content === "<p></p>") return setFormError(t("forum.errorContentRequired"));
    createThread.mutate({ userId: user.id, title: title.trim(), content: content.trim(), lang: userLang }, {
      onSuccess: (thread) => {
        setTitle(""); setContent(""); setShowForm(false);
        try { localStorage.removeItem(draftKey); } catch {}
        onSelectThread(thread.id);
      },
      onError: (err) => setFormError(err.message),
    });
  }

  return (
    <div className="forum-thread-list">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>

      {/* Breadcrumb */}
      <nav className="forum-breadcrumb">
        <button className="forum-breadcrumb-item" onClick={() => navigate("forum")}>{t("forum.breadcrumbForum")}</button>
        <span className="forum-breadcrumb-sep">›</span>
        <span className="forum-breadcrumb-current">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="forum-list-header">
        <div className="forum-list-header-left">
          <button className="back-btn" onClick={onBack}>{t("forum.backToForums")}</button>
          <span className="forum-list-category-icon">{category.icon}</span>
          <h2 className="forum-list-title">{category.name}</h2>
        </div>
        <button className="forum-new-btn" onClick={() => {
          if (showForm && isDirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
          if (showForm) { setTitle(""); setContent(""); }
          setShowForm(v => !v);
        }}>
          {showForm ? t("common.cancel") : t("forum.newThread")}
        </button>
      </div>

      {/* Search */}
      <div className="forum-search-bar">
        <input
          className="forum-search-input"
          type="search"
          placeholder={t("forum.searchPlaceholder")}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Sort tabs */}
      <div className="forum-sort-tabs">
        {SORT_OPTIONS.map(s => (
          <button
            key={s}
            className={`forum-sort-tab${sort === s ? " forum-sort-tab--active" : ""}`}
            onClick={() => setSort(s)}
          >
            {t(`forum.sort_${s}`)}
          </button>
        ))}
      </div>

      {/* Language filter pills */}
      <div className="forum-lang-filter">
        <button
          className={`forum-lang-pill${langFilter === userLang ? " forum-lang-pill--active" : ""}`}
          onClick={() => { setLangFilter(userLang); setLimit(THREADS_PER_PAGE); }}
        >
          {t("forum.myLanguage")}
        </button>
        <button
          className={`forum-lang-pill${langFilter === null ? " forum-lang-pill--active" : ""}`}
          onClick={() => { setLangFilter(null); setLimit(THREADS_PER_PAGE); }}
        >
          {t("forum.allLanguages")}
        </button>
      </div>

      {/* New thread form */}
      {showForm && (
        <form className="forum-new-thread-form" onSubmit={handleCreate}>
          <input
            id="forum-new-title"
            name="title"
            className="forum-input"
            placeholder={t("forum.threadTitlePlaceholder")}
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={createThread.isPending}
          />
          <Suspense fallback={<div style={{ height: 120 }} />}>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder={t("forum.threadContentPlaceholder")}
              minimal
              disabled={createThread.isPending}
            />
          </Suspense>
          {isPremium && <ForumPostAssistant topic={title} draft={content} />}
          {formError && <div className="forum-form-error">{formError}</div>}
          <div className="forum-form-actions">
            <button className="forum-submit-btn" type="submit" disabled={createThread.isPending}>
              {createThread.isPending && <span className="btn-spin" />}{createThread.isPending ? t("forum.posting") : t("forum.postThread")}
            </button>
          </div>
        </form>
      )}

      {/* Thread rows */}
      {isLoading ? (
        <LoadingSpinner />
      ) : threads.length === 0 ? (
        <div className="forum-empty">
          <div className="forum-empty-icon">💬</div>
          <h3>{search ? t("forum.noResults") : t("forum.noThreads")}</h3>
          <p>{search ? "" : t("forum.noThreadsSub")}</p>
          {!search && (
            <button className="forum-empty-cta" onClick={() => setShowForm(true)}>
              {t("forum.beFirstThread")}
            </button>
          )}
        </div>
      ) : (
        <div className="forum-rows">
          {threads.map(thread => {
            const replyCount = thread.forum_replies?.[0]?.count ?? 0;
            return (
              <div
                key={thread.id}
                className={`forum-row${thread.pinned ? " forum-row--pinned" : ""}`}
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="forum-row-left">
                  <Avatar profile={thread.profiles} size="sm" onClick={e => { e.stopPropagation(); navigate("publicProfile", { userId: thread.author_id }); }} />
                </div>
                <div className="forum-row-mid">
                  <div className="forum-row-title">
                    {thread.pinned && <span className="forum-badge forum-badge--pin">📌</span>}
                    {thread.locked && <span className="forum-badge forum-badge--lock">🔒</span>}
                    {thread.has_solution && <span className="forum-badge forum-badge--solved">✓</span>}
                    {thread.title}
                  </div>
                  <div className="forum-row-meta">
                    <span>
                      {displayName(thread.profiles)}
                      <BadgeChip level={thread.profiles?.top_badge_level} />
                    </span>
                    <span className="forum-dot">·</span>
                    <span>{timeAgo(thread.updated_at, t)}</span>
                    {thread.view_count > 0 && (
                      <><span className="forum-dot">·</span><span>👁 {thread.view_count}</span></>
                    )}
                  </div>
                </div>
                <div className="forum-row-right">
                  <div className="forum-row-stat">
                    <span className="forum-row-stat-val">{replyCount}</span>
                    <span className="forum-row-stat-label">{t("forum.replyCount", { count: replyCount }).split(" ")[1]}</span>
                  </div>
                  {thread.like_count > 0 && (
                    <div className="forum-row-likes">👍 {thread.like_count}</div>
                  )}
                  <BookmarkButton userId={user.id} threadId={thread.id} />
                </div>
              </div>
            );
          })}
          {rawThreads.length === limit && (
            <button
              className="forum-load-more"
              onClick={() => setLimit(l => l + THREADS_PER_PAGE)}
            >
              {t("forum.loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Category List ─────────────────────────────────────────────────────────────
function CategoryList({ onSelectCategory, onBack, navigate, darkMode, setDarkMode, i18n, user, onLogout, onSelectThread, onUpgrade }) {
  const { data: categories = [], isLoading } = useCategories();
  const { data: trending = [] } = useTopThreads(5);
  const { t } = useTranslation();

  useMeta({ title: "Forum", description: "Join community discussions about Bible reading, faith, and spiritual growth." });
  const lang = i18n.language.split("-")[0];

  const totalThreads = categories.reduce((sum, c) => sum + (c.forum_threads?.[0]?.count ?? 0), 0);

  return (
    <div className="forum-categories">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout}  onUpgrade={onUpgrade}/>
      {/* Hero */}
      <div className="forum-hero">
        <div className="forum-hero-glow forum-hero-glow--1" />
        <div className="forum-hero-glow forum-hero-glow--2" />
        <div className="forum-hero-inner">
          <button className="back-btn forum-hero-back" onClick={onBack}>{t("forum.backToApp")}</button>
          <div className="forum-hero-badge">{t("forum.badge")}</div>
          <h1 className="forum-hero-title">{t("forum.title")}</h1>
          <p className="forum-hero-sub">{t("forum.subtitle")}</p>
          {totalThreads > 0 && (
            <p className="forum-hero-count">{t("forum.threadCount", { count: totalThreads, cats: categories.length })}</p>
          )}
        </div>
      </div>

      {/* Trending threads */}
      {trending.length > 0 && (
        <div className="forum-trending">
          <div className="forum-trending-header">
            <span className="forum-trending-label">🔥 {t("forum.trending")}</span>
          </div>
          <div className="forum-trending-list">
            {trending.map(thread => (
              <button
                key={thread.id}
                className="forum-trending-row"
                onClick={() => onSelectThread(thread.category_id, thread.id)}
              >
                <span className="forum-trending-title">{thread.title}</span>
                <div className="forum-trending-stats">
                  {thread.like_count > 0 && <span>👍 {thread.like_count}</span>}
                  <span>💬 {thread.forum_replies?.[0]?.count ?? 0}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category cards */}
      <div className="forum-cat-grid">
        {isLoading ? (
          <LoadingSpinner />
        ) : categories.map(cat => {
          const threadCount = cat.forum_threads?.[0]?.count ?? 0;
          const tx = cat.forum_category_translations?.find(t => t.lang === lang);
          return (
            <div key={cat.id} className="forum-cat-card" onClick={() => onSelectCategory(cat)}>
              <div className="forum-cat-icon">{cat.icon}</div>
              <div className="forum-cat-body">
                <div className="forum-cat-name">{tx?.name ?? cat.name}</div>
                <div className="forum-cat-desc">{tx?.description ?? cat.description}</div>
              </div>
              <div className="forum-cat-stats">
                <span className="forum-cat-stat">{t("forum.threadStat", { count: threadCount })}</span>
                <span className="forum-cat-arrow">›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ForumPage ────────────────────────────────────────────────────────────
export default function ForumPage({ user, profile, onBack, categoryId, threadId, onNavigate, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const activeCategory = categoryId ? categories.find(c => c.id === categoryId) ?? null : null;

  const navProps = { navigate, darkMode, setDarkMode, i18n, user, onLogout };

  if (threadId && categoryId) {
    return (
      <ThreadView
        threadId={threadId}
        user={user}
        profile={profile}
        categoryId={categoryId}
        categoryName={activeCategory?.name ?? ""}
        onBack={() => onNavigate(categoryId, null)}
        onUpgrade={onUpgrade}
        {...navProps}
      />
    );
  }

  if (categoryId) {
    if (catsLoading && !activeCategory) return <LoadingSpinner />;
    if (activeCategory) return (
      <ThreadList
        category={activeCategory}
        user={user}
        onSelectThread={(id) => onNavigate(categoryId, id)}
        onBack={() => onNavigate(null, null)}
        onUpgrade={onUpgrade}
        {...navProps}
      />
    );
  }

  return <CategoryList onSelectCategory={(cat) => onNavigate(cat.id, null)} onSelectThread={(catId, threadId) => onNavigate(catId, threadId)} onBack={onBack} onUpgrade={onUpgrade} {...navProps} />;
}
