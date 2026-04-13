import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { sanitizeRich } from "../../lib/sanitize";
import ConfirmModal from "../../components/ConfirmModal";
const RichTextEditor = lazy(() => import("../../components/RichTextEditor"));
import ReportModal from "../../components/ReportModal";
import BookmarkButton from "../../components/bookmarks/BookmarkButton";
import ShareButtons from "../../components/ShareButtons";
import { forumApi } from "../../api/forum";
import {
  useThread, useReplies,
  useCreateReply, useUpdateThread, useUpdateReply, useDeleteThread, useDeleteReply,
  usePinThread, useLockThread,
  useUserForumLikes, useToggleThreadLike, useToggleReplyLike,
  useMarkSolution,
  useUserWatches, useToggleWatch,
  useThreadReactions, useToggleReaction,
} from "../../hooks/useForum";
import { toast } from "../../lib/toast";
import { useSubmitReport } from "../../hooks/useReports";
import { useBlocks, useBlockUser, useUnblockUser } from "../../hooks/useBlocks";
import { useSubscription } from "../../hooks/useSubscription";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import { useMeta } from "../../hooks/useMeta";
import {
  displayName, timeAgo, Avatar, BadgeChip, ModBadge, ReactionsBar,
  IconPin, IconLock, IconEye, IconLink, IconBell, IconBellOff, IconThumbsUp, IconFlag, IconBan, IconQuote,
} from "./forumShared";

const REPLIES_PER_PAGE = 20;

export function ForumThreadDetail({ threadId, user, profile, onBack, categoryId, categoryName, navigate, onUpgrade }: {
  threadId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: any;
  onBack: () => void;
  categoryId: string;
  categoryName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigate: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpgrade: any;
}) {
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
  const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const { isPremium } = useSubscription(user?.id);
  const getOrCreateDM = useGetOrCreateDM();
  const { t } = useTranslation();

  const isWatching = watches.includes(threadId);
  const replies = allReplies.slice(0, visibleReplies);
  const hasMoreReplies = visibleReplies < allReplies.length;

  const [replyText, setReplyText]         = useState(() => {
    try { return localStorage.getItem(`forum-draft-reply-${threadId}`) || ""; } catch { return ""; }
  });
  const [replyError, setReplyError]       = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mentionedIds, setMentionedIds]   = useState<any[]>([]);
  const [editing, setEditing]             = useState(false);
  const [editTitle, setEditTitle]         = useState("");
  const [editContent, setEditContent]     = useState("");
  const [editingReplyId, setEditingReplyId]       = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent]   = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [confirm, setConfirm] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reportTarget, setReportTarget]   = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadId) forumApi.incrementView(threadId).catch(() => {});
  }, [threadId]);

  useEffect(() => {
    try { localStorage.setItem(`forum-draft-reply-${threadId}`, replyText); } catch {}
  }, [replyText, threadId]);

  function handleReport(reason: string) {
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

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    updateThread.mutate({ title: editTitle.trim(), content: editContent.trim() }, {
      onSuccess: () => setEditing(false),
    });
  }

  function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setReplyError("");
    if (!replyText.trim()) return setReplyError(t("forum.replyEmptyError"));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createReply.mutate({ userId: user.id, content: replyText.trim(), mentionedUserIds: mentionedIds } as any, {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleQuote(reply: any) {
    const authorText = displayName(reply.profiles);
    const plainText = reply.content?.replace(/<[^>]*>/g, "").slice(0, 200) ?? "";
    const quoteHtml = `<blockquote><p><strong>${authorText}:</strong></p><p>${plainText}</p></blockquote><p></p>`;
    setReplyText(quoteHtml);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function isEdited(item: any) {
    if (!item?.updated_at || !item?.created_at) return false;
    return new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 60000;
  }

  useMeta({ title: thread?.title, description: thread?.content?.replace(/<[^>]*>/g, "").slice(0, 140) });

  if (threadLoading) return (
    <div className="forum-thread-view">
      <div style={{ padding: "12px 0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ height: 13, width: 220, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 26, width: "65%", borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 13, width: 180, borderRadius: 6 }} />
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 13, width: "75%", borderRadius: 6 }} />
        </div>
      </div>
    </div>
  );
  if (!thread) return <div className="forum-empty"><p>{t("forum.threadNotFound")}</p></div>;

  return (
    <div className="forum-thread-view">
      <nav className="forum-breadcrumb">
        <button className="forum-breadcrumb-item" onClick={() => navigate("forum")}>{t("forum.breadcrumbForum")}</button>
        <span className="forum-breadcrumb-sep">›</span>
        <button className="forum-breadcrumb-item" onClick={onBack}>{categoryName}</button>
        <span className="forum-breadcrumb-sep">›</span>
        <span className="forum-breadcrumb-current">{thread.title}</span>
      </nav>

      <div className="forum-thread-header">
        <div className="forum-thread-header-badges">
          {thread.pinned && <span className="forum-badge forum-badge--pin"><IconPin /> Pinned</span>}
          {thread.locked && <span className="forum-badge forum-badge--lock"><IconLock /> Locked</span>}
          {thread.view_count > 0 && <span className="forum-view-count"><IconEye /> {thread.view_count.toLocaleString()}</span>}
        </div>
        <div className="forum-admin-tools">
          <button className="forum-tool-btn" onClick={handleShare} title={t("forum.share")}><IconLink /> {t("forum.share")}</button>
          <button
            className={`forum-tool-btn${isWatching ? " forum-tool-btn--active" : ""}`}
            onClick={() => toggleWatch.mutate()}
            disabled={toggleWatch.isPending}
            title={isWatching ? t("forum.unwatch") : t("forum.watch")}
          >
            {isWatching ? <IconBell /> : <IconBellOff />} {isWatching ? t("forum.watching") : t("forum.watch")}
          </button>
          <BookmarkButton userId={user.id} threadId={threadId} />
          {canModerate && (
            <>
              <button className="forum-tool-btn" onClick={() => pinThread.mutate({ threadId, value: !thread.pinned })} disabled={pinThread.isPending}>
                {thread.pinned ? t("forum.unpin") : t("forum.pin")}
              </button>
              <button className="forum-tool-btn" onClick={() => lockThread.mutate({ threadId, value: !thread.locked })} disabled={lockThread.isPending}>
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

      <div className="forum-post forum-post--op">
        <div className="forum-post-aside">
          <Avatar profile={thread.profiles} onClick={() => navigate("publicProfile", { userId: thread.author_id })} />
        </div>
        <div className="forum-post-body">
          <div className="forum-post-header">
            <div className="forum-post-header-left">
              <span className="forum-post-author" onClick={() => navigate("publicProfile", { userId: thread.author_id })}>
                {displayName(thread.profiles)}
              </span>
              <BadgeChip level={thread.profiles?.top_badge_level} />
              <ModBadge profile={thread.profiles} />
              <span className="forum-post-badge forum-post-badge--op" data-tooltip={t("forum.opTooltip", "Original Poster")} title={t("forum.opTooltip", "Original Poster")}>{t("forum.op")}</span>
            </div>
            <div className="forum-post-header-right">
              <span className="forum-post-time">
                {timeAgo(thread.created_at, t)}
                {isEdited(thread) && <span className="forum-edited-tag"> · {t("forum.edited")}</span>}
              </span>
            </div>
          </div>
          {editing ? (
            <form className="forum-edit-form" onSubmit={handleSaveEdit}>
              <label htmlFor="forum-edit-title" className="forum-edit-label">{t("forum.threadTitlePlaceholder")}</label>
              <input
                id="forum-edit-title"
                name="title"
                className="forum-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                disabled={updateThread.isPending}
              />
              <Suspense fallback={<div style={{ height: 80 }} />}>
                <RichTextEditor content={editContent} onChange={setEditContent} minimal disabled={updateThread.isPending} />
              </Suspense>
              <div className="forum-edit-actions">
                <button className="forum-submit-btn" type="submit" disabled={updateThread.isPending}>
                  {updateThread.isPending ? t("common.saving") : t("common.save")}
                </button>
                <button type="button" className="forum-delete-btn" onClick={() => setEditing(false)}>
                  {t("common.cancel")}
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="forum-post-title">{thread.title}</h2>
              <ShareButtons path={`/forum/${thread.category_id}/${thread.id}`} title={thread.title} type="forum" />
              <div className="forum-post-content rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRich(thread.content ?? "") }} />
              <div className="forum-post-actions">
                <button
                  className={`forum-like-btn${forumLikes.threads?.includes(threadId) ? " liked" : ""}`}
                  aria-label={t("forum.like") + (thread.like_count ? ` (${thread.like_count})` : "")}
                  aria-pressed={forumLikes.threads?.includes(threadId)}
                  onClick={() => toggleThreadLike.mutate(threadId, { onError: () => toast(t("forum.likeError")) })}
                  disabled={toggleThreadLike.isPending}
                >
                  <IconThumbsUp /> <span className="forum-like-count">{thread.like_count ?? 0}</span>
                </button>
                <ReactionsBar
                  contentType="thread"
                  contentId={threadId}
                  reactions={reactions}
                  onToggle={(ct, cid, emoji) => toggleReaction.mutate({ contentType: ct, contentId: cid, emoji })}
                />
                {thread.author_id !== user.id && (
                  <>
                    <button
                      className={`forum-msg-btn${!isPremium ? " forum-msg-btn--locked" : ""}`}
                      disabled={getOrCreateDM.isPending}
                      onClick={isPremium
                        ? () => getOrCreateDM.mutate(thread.author_id, {
                            onSuccess: (cid) => navigate("messages", { conversationId: cid, otherDisplayName: displayName(thread.profiles), otherAvatarUrl: thread.profiles?.avatar_url ?? null }),
                          })
                        : onUpgrade
                      }
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      {t("common.message", "Message")}{!isPremium && <span className="msg-btn-pro-badge">✦</span>}
                    </button>
                    <button
                      className="forum-report-btn"
                      onClick={e => { e.stopPropagation(); setReportTarget({ type: "thread", id: thread.id, preview: thread.title }); }}
                      title={t("report.flag")} aria-label={t("report.flag")}
                    ><IconFlag /></button>
                    <button
                      className="forum-report-btn"
                      onClick={() => {
                        if (blockedSet.has(thread.author_id)) {
                          unblockUser.mutate(thread.author_id);
                        } else {
                          setConfirm({
                            message: `Block ${displayName(thread.profiles)}? Their posts will be hidden from you, and yours from them.`,
                            onConfirm: () => blockUser.mutate(thread.author_id),
                          });
                        }
                      }}
                      title={blockedSet.has(thread.author_id) ? "Unblock user" : "Block user"}
                      aria-label={blockedSet.has(thread.author_id) ? "Unblock user" : "Block user"}
                    ><IconBan /></button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {repliesLoading ? (
        <div className="forum-replies">
          {[0,1,2].map(i => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="skeleton" style={{ height: 13, width: "30%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, width: "80%", borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
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
                </div>
                <div className="forum-post-body">
                  <div className="forum-post-header">
                    <div className="forum-post-header-left">
                      <span className="forum-post-author" onClick={() => navigate("publicProfile", { userId: reply.author_id })}>
                        {displayName(reply.profiles)}
                      </span>
                      <BadgeChip level={reply.profiles?.top_badge_level} />
                      <ModBadge profile={reply.profiles} />
                      {reply.is_solution
                        ? <span className="forum-solution-badge" data-tooltip={t("forum.solutionTooltip", "Marked as solution")} title={t("forum.solutionTooltip", "Marked as solution")}>✓ {t("forum.solution")}</span>
                        : <span className="forum-post-num">#{i + 1}</span>
                      }
                    </div>
                    <div className="forum-post-header-right">
                      <span className="forum-post-time">
                        {timeAgo(reply.created_at, t)}
                        {isEdited(reply) && <span className="forum-edited-tag"> · {t("forum.edited")}</span>}
                      </span>
                    </div>
                  </div>
                  {isEditingThis ? (
                    <div className="forum-edit-form">
                      <Suspense fallback={<div style={{ height: 60 }} />}>
                        <RichTextEditor content={editReplyContent} onChange={setEditReplyContent} minimal compact disabled={updateReply.isPending} />
                      </Suspense>
                      <div className="forum-edit-actions">
                        <button
                          className="forum-submit-btn"
                          disabled={updateReply.isPending || !editReplyContent || editReplyContent === "<p></p>"}
                          onClick={() => updateReply.mutate(
                            { replyId: reply.id, content: editReplyContent },
                            { onSuccess: () => setEditingReplyId(null) }
                          )}
                        >
                          {updateReply.isPending ? t("common.saving") : t("forum.saveReply")}
                        </button>
                        <button type="button" className="forum-delete-btn" onClick={() => setEditingReplyId(null)}>
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="forum-post-content rich-content" dangerouslySetInnerHTML={{ __html: sanitizeRich(reply.content ?? "") }} />
                  )}
                  {!isEditingThis && (
                    <div className="forum-post-actions">
                      <button
                        className={`forum-like-btn${forumLikes.replies?.includes(reply.id) ? " liked" : ""}`}
                        aria-label={t("forum.like") + (reply.like_count ? ` (${reply.like_count})` : "")}
                        aria-pressed={forumLikes.replies?.includes(reply.id)}
                        onClick={() => toggleReplyLike.mutate(reply.id, { onError: () => toast(t("forum.likeError")) })}
                        disabled={toggleReplyLike.isPending}
                      >
                        <IconThumbsUp /> <span className="forum-like-count">{reply.like_count ?? 0}</span>
                      </button>
                      <ReactionsBar
                        contentType="reply"
                        contentId={reply.id}
                        reactions={reactions}
                        onToggle={(ct, cid, emoji) => toggleReaction.mutate({ contentType: ct, contentId: cid, emoji })}
                      />
                      {!isLocked && (
                        <button className="forum-quote-btn" onClick={() => handleQuote(reply)} title={t("forum.quote")} aria-label={t("forum.quote")}>
                          <IconQuote /> {t("forum.quote")}
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
                          <button className="forum-edit-btn" onClick={() => { setEditingReplyId(reply.id); setEditReplyContent(reply.content ?? ""); }}>
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
                        <>
                          <button
                            className={`forum-msg-btn${!isPremium ? " forum-msg-btn--locked" : ""}`}
                            disabled={getOrCreateDM.isPending}
                            onClick={isPremium
                              ? () => getOrCreateDM.mutate(reply.author_id, {
                                  onSuccess: (cid) => navigate("messages", { conversationId: cid, otherDisplayName: displayName(reply.profiles), otherAvatarUrl: reply.profiles?.avatar_url ?? null }),
                                })
                              : onUpgrade
                            }
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            {t("common.message", "Message")}{!isPremium && <span className="msg-btn-pro-badge">✦</span>}
                          </button>
                          <button
                            className="forum-report-btn"
                            onClick={e => { e.stopPropagation(); setReportTarget({ type: "reply", id: reply.id, preview: reply.content?.replace(/<[^>]*>/g, "").slice(0, 80) ?? "" }); }}
                            title={t("report.flag")} aria-label={t("report.flag")}
                          ><IconFlag /></button>
                          <button
                            className="forum-report-btn"
                            onClick={e => {
                              e.stopPropagation();
                              if (blockedSet.has(reply.author_id)) {
                                unblockUser.mutate(reply.author_id);
                              } else {
                                setConfirm({
                                  message: `Block ${displayName(reply.profiles)}? Their posts will be hidden from you, and yours from them.`,
                                  onConfirm: () => blockUser.mutate(reply.author_id),
                                });
                              }
                            }}
                            title={blockedSet.has(reply.author_id) ? "Unblock user" : "Block user"}
                            aria-label={blockedSet.has(reply.author_id) ? "Unblock user" : "Block user"}
                          ><IconBan /></button>
                        </>
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
        <ReportModal onSubmit={handleReport} onClose={() => setReportTarget(null)} isPending={submitReport.isPending} />
      )}

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
