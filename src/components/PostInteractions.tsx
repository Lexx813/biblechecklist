import { useState, useRef, useEffect } from "react";
import {
  usePostComments,
  useAddComment,
  useDeleteComment,
  usePostReactions,
  useToggleReaction,
  useMyCommentLikes,
  useToggleCommentLike,
} from "../hooks/usePosts";
import { assertNoPII } from "../lib/pii";

// ── Comment row (used for both top-level comments and replies) ─────────────
function CommentRow({ c, userId, liked, navigate, onLike, onReply, onDelete, deletePending, isReply }: {
  c: { id: string; author_id: string; content: string; created_at: string; like_count: number; author: { id: string; display_name: string | null; avatar_url: string | null } | null };
  userId?: string;
  liked: boolean;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  onLike: () => void;
  onReply: () => void;
  onDelete: () => void;
  deletePending: boolean;
  isReply?: boolean;
}) {
  const cName = c.author?.display_name || "Someone";
  const avatarSize = isReply ? "size-6" : "size-7";
  return (
    <div className="group/comment flex gap-2">
      <div className={`mt-0.5 shrink-0 cursor-pointer ${avatarSize}`} onClick={() => navigate("publicProfile", { userId: c.author_id })}>
        {c.author?.avatar_url
          ? <img src={c.author.avatar_url} alt="" className={`${avatarSize} rounded-full object-cover`} loading="lazy" />
          : <div className={`flex ${avatarSize} items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white`}>{cName[0].toUpperCase()}</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="inline-block rounded-2xl bg-[var(--hover-bg)] px-3 py-1.5">
          <span className="cursor-pointer text-xs font-bold text-[var(--text-primary)] hover:underline" onClick={() => navigate("publicProfile", { userId: c.author_id })}>
            {cName}
          </span>
          <p className="m-0 text-[13px] leading-snug text-[var(--text-primary)]">{c.content}</p>
        </div>
        {/* Actions row */}
        <div className="mt-0.5 flex items-center gap-3 pl-1">
          <span className="text-[11px] text-[var(--text-muted)]">{timeAgo(c.created_at)}</span>
          {/* Like */}
          <button
            className={`flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[11px] font-semibold transition-colors duration-150 ${liked ? "text-red-400" : "text-[var(--text-muted)] hover:text-red-400"}`}
            onClick={() => { if (userId) onLike(); }}
            aria-label="Like comment"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {c.like_count > 0 && <span>{c.like_count}</span>}
          </button>
          {/* Reply — only on top-level */}
          {!isReply && (
            <button
              className="cursor-pointer border-none bg-transparent p-0 text-[11px] font-semibold text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)]"
              onClick={onReply}
            >
              Reply
            </button>
          )}
          {/* Delete */}
          {c.author_id === userId && (
            <button
              className="cursor-pointer border-none bg-transparent p-0 text-[11px] font-semibold text-[var(--text-muted)] opacity-0 transition-opacity duration-150 hover:text-red-400 group-hover/comment:opacity-100"
              onClick={onDelete}
              disabled={deletePending}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quick-react emoji palette ───────────────────────────────────────────────
const EMOJI_PALETTE = ["❤️", "😂", "😮", "😢", "🙏", "👏"];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface Props {
  postId: string;
  userId?: string;
  commentCount: number;
  reactionCounts: Record<string, number>;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function PostInteractions({ postId, userId, commentCount, reactionCounts, navigate }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [replyText, setReplyText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const replyRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: comments = [], isLoading: commentsLoading } = usePostComments(showComments ? postId : null);
  const addComment = useAddComment(postId);
  const deleteComment = useDeleteComment(postId);
  const { data: reactions = [] } = usePostReactions(postId);
  const toggleReaction = useToggleReaction(postId);
  const { data: likedCommentIds = [] } = useMyCommentLikes(showComments ? postId : null);
  const toggleCommentLike = useToggleCommentLike(postId);

  const likedSet = new Set(likedCommentIds);

  // Which emojis has the current user reacted with?
  const myReactions = new Set(reactions.filter(r => r.user_id === userId).map(r => r.emoji));

  // Close emoji picker on outside click
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  function handleSubmitComment() {
    const text = commentText.trim();
    if (!text || !userId) return;
    setCommentError("");
    try { assertNoPII(text); } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : "Invalid content");
      return;
    }
    addComment.mutate({ content: text }, {
      onSuccess: () => { setCommentText(""); setCommentError(""); },
      onError: (err) => setCommentError(err.message),
    });
  }

  function handleSubmitReply() {
    const text = replyText.trim();
    if (!text || !userId || !replyingTo) return;
    setCommentError("");
    try { assertNoPII(text); } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : "Invalid content");
      return;
    }
    addComment.mutate({ content: text, parentId: replyingTo.id }, {
      onSuccess: () => { setReplyText(""); setReplyingTo(null); setCommentError(""); },
      onError: (err) => setCommentError(err.message),
    });
  }

  function startReply(commentId: string, name: string) {
    setReplyingTo({ id: commentId, name });
    setTimeout(() => replyRef.current?.focus(), 80);
  }

  // Build display reactions from reactionCounts (fast, from denormalized column)
  const displayReactions = Object.entries(reactionCounts).filter(([, count]) => count > 0);
  const totalReactions = displayReactions.reduce((sum, [, c]) => sum + c, 0);

  return (
    <div className="border-t border-[var(--border)]">
      {/* ── Reaction summary row ── */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 px-4 pt-2.5 pb-1">
          <div className="flex -space-x-0.5">
            {displayReactions.slice(0, 5).map(([emoji]) => (
              <span key={emoji} className="text-sm leading-none">{emoji}</span>
            ))}
          </div>
          <span className="text-xs text-[var(--text-muted)]">{totalReactions}</span>
        </div>
      )}

      {/* ── Action buttons row (Like / Comment) ── */}
      <div className="flex items-center border-t border-[var(--border)] px-1">
        {/* React button */}
        <div className="relative flex-1" ref={pickerRef}>
          <button
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent py-2.5 text-[13px] font-semibold text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            onClick={() => {
              if (!userId) return;
              setShowEmojiPicker(!showEmojiPicker);
            }}
            aria-label="React to post"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            React
          </button>

          {/* Emoji picker popover */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-1/2 z-30 mb-2 flex -translate-x-1/2 gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 shadow-lg backdrop-blur-sm">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  className={`flex size-9 cursor-pointer items-center justify-center rounded-lg border-none text-xl transition-all duration-150 hover:scale-110 hover:bg-[var(--hover-bg)] ${myReactions.has(emoji) ? "bg-brand-600/15 ring-1 ring-brand-600/40" : "bg-transparent"}`}
                  onClick={() => {
                    toggleReaction.mutate(emoji);
                    setShowEmojiPicker(false);
                  }}
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment button */}
        <button
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-none bg-transparent py-2.5 text-[13px] font-semibold text-[var(--text-muted)] transition-colors duration-150 hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments) setTimeout(() => inputRef.current?.focus(), 100);
          }}
          aria-label="Comment on post"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          Comment{commentCount > 0 ? ` (${commentCount})` : ""}
        </button>
      </div>

      {/* ── Inline reactions (clickable pills below action bar) ── */}
      {displayReactions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {displayReactions.map(([emoji, count]) => (
            <button
              key={emoji}
              className={`flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors duration-150 ${
                myReactions.has(emoji)
                  ? "border-brand-600/40 bg-brand-600/15 text-[var(--text-primary)]"
                  : "border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-brand-600/30 hover:bg-brand-600/10"
              }`}
              onClick={() => { if (userId) toggleReaction.mutate(emoji); }}
              aria-label={`${emoji} ${count}`}
            >
              <span>{emoji}</span>
              <span>{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Comments section ── */}
      {showComments && (
        <div className="border-t border-[var(--border)] px-4 pb-3 pt-2">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="size-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            </div>
          ) : comments.length === 0 ? (
            <p className="py-3 text-center text-xs text-[var(--text-muted)]">No comments yet. Be the first!</p>
          ) : (
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto py-1" style={{ scrollbarWidth: "thin" }}>
              {comments
                .filter((c: any) => !c.parent_id)
                .map((c: any) => {
                  const replies = comments.filter((r: any) => r.parent_id === c.id);
                  return (
                    <div key={c.id}>
                      <CommentRow
                        c={c} userId={userId} liked={likedSet.has(c.id)}
                        navigate={navigate}
                        onLike={() => toggleCommentLike.mutate(c.id)}
                        onReply={() => startReply(c.id, c.author?.display_name || "Someone")}
                        onDelete={() => deleteComment.mutate(c.id)}
                        deletePending={deleteComment.isPending}
                      />
                      {/* Replies */}
                      {replies.length > 0 && (
                        <div className="ml-9 mt-2 flex flex-col gap-2 border-l-2 border-[var(--border)] pl-3">
                          {replies.map((r: any) => (
                            <CommentRow
                              key={r.id} c={r} userId={userId} liked={likedSet.has(r.id)}
                              navigate={navigate}
                              onLike={() => toggleCommentLike.mutate(r.id)}
                              onReply={() => startReply(c.id, c.author?.display_name || "Someone")}
                              onDelete={() => deleteComment.mutate(r.id)}
                              deletePending={deleteComment.isPending}
                              isReply
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Reply input */}
          {replyingTo && userId && (
            <div className="mt-2">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">↩ Replying to <strong className="text-[var(--text-primary)]">{replyingTo.name}</strong></span>
                <button
                  className="ml-1 cursor-pointer border-none bg-transparent p-0 text-[11px] text-[var(--text-muted)] hover:text-red-400"
                  onClick={() => { setReplyingTo(null); setReplyText(""); }}
                >✕ Cancel</button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={replyRef}
                  type="text"
                  className="min-h-[36px] flex-1 rounded-full border border-[var(--accent)] bg-[var(--hover-bg)] px-3.5 py-1.5 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  placeholder={`Reply to ${replyingTo.name}…`}
                  maxLength={2000}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitReply(); } }}
                />
                <button
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--accent)] text-white transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || addComment.isPending}
                  aria-label="Send reply"
                >
                  {addComment.isPending
                    ? <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
                </button>
              </div>
            </div>
          )}

          {/* Main comment input */}
          {userId ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                className="min-h-[36px] flex-1 rounded-full border border-[var(--border)] bg-[var(--hover-bg)] px-3.5 py-1.5 text-[13px] text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
                placeholder="Write a comment…"
                maxLength={2000}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
              />
              <button
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[var(--accent)] text-white transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || addComment.isPending}
                aria-label="Send comment"
              >
                {addComment.isPending
                  ? <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Sign in to comment</p>
          )}
          {commentError && <p className="mt-1 text-xs text-red-400">{commentError}</p>}
        </div>
      )}
    </div>
  );
}
