import { useState } from "react";
import {
  useToggleLike, useDeletePost,
  usePostComments, useAddComment, useDeleteComment,
} from "../../../hooks/useGroups";
import { GroupPost } from "../../../api/groups";
import { toast } from "../../../lib/toast";
import { sanitizeRich } from "../../../lib/sanitize";
import Avatar from "./Avatar";
import { timeAgo } from "./utils";

interface Props {
  post: GroupPost;
  userId: string;
  isAdmin: boolean;
  groupId: string;
}

export default function PostCard({ post, userId, isAdmin, groupId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(expanded ? post.id : undefined);
  const toggleLike = useToggleLike(groupId);
  const deletePost = useDeletePost(groupId);
  const addComment = useAddComment(groupId);
  const deleteComment = useDeleteComment(groupId);
  const isOwn = post.author_id === userId;

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate(
      { postId: post.id, content: commentText.trim() },
      {
        onSuccess: () => setCommentText(""),
        onError: () => toast.error("Failed to add comment."),
      }
    );
  }

  return (
    <div className={`grp-post${post.is_announcement ? " grp-post--announcement" : ""}`}>
      {post.is_announcement && (
        <div className="grp-post-announcement-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
          Announcement
        </div>
      )}
      <div className="grp-post-header">
        <Avatar src={post.author?.avatar_url} name={post.author?.display_name} size={34} />
        <div className="grp-post-meta">
          <span className="grp-post-author">{post.author?.display_name || "Unknown"}</span>
          <span className="grp-post-time">{timeAgo(post.created_at)}</span>
        </div>
        {(isOwn || isAdmin) && (
          <button
            className="grp-post-delete"
            onClick={() => deletePost.mutate(post.id, { onError: () => toast.error("Failed to delete post.") })}
            aria-label="Delete post"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        )}
      </div>
      <div className="grp-post-content editor-render" dangerouslySetInnerHTML={{ __html: sanitizeRich(post.content ?? "") }} />
      {post.media_urls?.length > 0 && (
        <div className="grp-post-media">
          {post.media_urls.map((url, i) => (
            <img key={i} src={url} alt="" className="grp-post-img" loading="lazy" />
          ))}
        </div>
      )}
      <div className="grp-post-actions">
        <button
          className={`grp-post-like${post.liked_by_me ? " grp-post-like--active" : ""}`}
          onClick={() => toggleLike.mutate(post.id, { onError: () => toast.error("Failed to update like.") })}
          aria-label={post.liked_by_me ? "Unlike" : "Like"}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill={post.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {post.like_count > 0 && post.like_count}
        </button>
        <button className="grp-post-comment-btn" onClick={() => setExpanded(v => !v)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          {post.comment_count > 0 ? post.comment_count : "Comment"}
        </button>
      </div>

      {expanded && (
        <div className="grp-comments">
          {commentsLoading ? (
            <p className="grp-comments-loading">Loading…</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="grp-comment">
                <Avatar src={c.author?.avatar_url} name={c.author?.display_name} size={26} />
                <div className="grp-comment-body">
                  <div className="grp-comment-header">
                    <span className="grp-comment-author">{c.author?.display_name || "Unknown"}</span>
                    <span className="grp-comment-time">{timeAgo(c.created_at)}</span>
                    {(c.author_id === userId || isAdmin) && (
                      <button
                        className="grp-comment-delete"
                        onClick={() => deleteComment.mutate(
                          { commentId: c.id, postId: post.id },
                          { onError: () => toast.error("Failed to delete comment.") }
                        )}
                        aria-label="Delete comment"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                  <p className="grp-comment-content">{c.content}</p>
                </div>
              </div>
            ))
          )}
          <form className="grp-comment-form" onSubmit={submitComment}>
            <input
              className="grp-comment-input"
              placeholder="Write a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              maxLength={1000}
              aria-label="Write a comment"
            />
            <button type="submit" className="grp-comment-send" disabled={!commentText.trim() || addComment.isPending} aria-label="Send">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
