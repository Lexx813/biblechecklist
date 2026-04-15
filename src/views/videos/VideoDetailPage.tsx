import { useState } from "react";
import { useVideoBySlug, useVideoComments, useCreateVideoComment, useDeleteVideoComment, useUserLikedVideoIds, useToggleVideoLike } from "../../hooks/useVideos";
import { useFullProfile } from "../../hooks/useAdmin";
import { formatDate } from "../../utils/formatters";
import { toast } from "../../lib/toast";
import type { VideoComment } from "../../api/videos";
import "../../styles/videos.css";

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const BookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

interface Props {
  user: { id: string } | null;
  slug: string;
  onBack: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: { language?: string };
  onLogout?: (() => void) | null;
  currentPage?: string;
  onSearchClick?: () => void;
}

export default function VideoDetailPage({ user, slug, onBack, navigate }: Props) {
  const { data: video, isLoading } = useVideoBySlug(slug);
  const { data: comments = [] } = useVideoComments(video?.id);
  const { data: likedIds = [] } = useUserLikedVideoIds(user?.id);
  const { data: profile } = useFullProfile(user?.id);
  const toggleLike = useToggleVideoLike(user?.id);
  const createComment = useCreateVideoComment(video?.id);
  const deleteComment = useDeleteVideoComment(video?.id);
  const [commentText, setCommentText] = useState("");
  const liked = video ? (likedIds as string[]).includes(video.id) : false;

  async function handleLike() {
    if (!user) { toast("Sign in to like videos."); return; }
    if (!video) return;
    await toggleLike.mutateAsync(video.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim() || !video) return;
    try {
      await createComment.mutateAsync({ userId: user.id, content: commentText.trim() });
      setCommentText("");
    } catch (err: any) {
      toast(err.message ?? "Failed to post comment.");
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/videos/${encodeURIComponent(slug)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast("Link copied!"))
      .catch(() => toast("Could not copy link."));
  }

  if (isLoading) {
    return (
      <div className="video-detail-page">
        <div className="video-detail-hero">
          <button className="video-detail-back" onClick={onBack}>← All videos</button>
          <div className="skeleton" style={{ width: "100%", maxWidth: 860, aspectRatio: "16/9" }} />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="video-detail-page">
        <div className="video-player-wrap">
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)" }}>Video not found.</div>
          <button onClick={onBack} style={{ marginTop: 12, background: "none", border: "none", color: "#a78bfa", cursor: "pointer" }}>← All videos</button>
        </div>
      </div>
    );
  }

  const creatorName = video.profiles?.display_name ?? "Unknown";
  const isTikTok = video.embed_url?.includes("tiktok.com") ?? false;
  const frameClass = `video-player-frame${isTikTok ? " portrait" : ""}`;

  return (
    <div className="video-detail-page">
      {/* ── Dark hero band with player ── */}
      <div className="video-detail-hero">
        <button className="video-detail-back" onClick={onBack}>← All videos</button>
        <div className={frameClass}>
          {video.embed_url ? (
            <iframe src={video.embed_url} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={video.title} />
          ) : video.playback_url ? (
            <video controls preload="metadata" poster={video.thumbnail_url ?? undefined}>
              <source src={video.playback_url} type="video/mp4" />
            </video>
          ) : null}
        </div>
      </div>

      {/* ── Content body ── */}
      <div className="video-player-wrap">
        {video.scripture_tag && (
          <div className="detail-scripture-badge">
            <BookIcon />
            {video.scripture_tag}
          </div>
        )}

        <h1 className="video-player-title">{video.title}</h1>
        <div className="video-player-meta">{creatorName} · {formatDate(video.created_at, "long")}</div>
        {video.description && <div className="video-player-desc">{video.description}</div>}

        <div className="video-player-actions">
          <button className={`video-like-btn${liked ? " liked" : ""}`} onClick={handleLike} aria-label={liked ? "Unlike" : "Like"}>
            <HeartIcon filled={liked} />
            {video.likes_count} {video.likes_count === 1 ? "like" : "likes"}
          </button>
          <button className="video-share-btn" onClick={handleShare} aria-label="Share">
            <ShareIcon />
            Share
          </button>
        </div>

        <div className="video-comments">
          <div className="video-comments-title">{comments.length} {comments.length === 1 ? "comment" : "comments"}</div>
          {(comments as VideoComment[]).map(c => (
            <div key={c.id} className="video-comment">
              <div className="video-comment-avatar">
                {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt={c.profiles?.display_name ?? "?"} /> : (c.profiles?.display_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="video-comment-body">
                <div className="video-comment-author">{c.profiles?.display_name ?? "Anonymous"}</div>
                <div className="video-comment-text">{c.content}</div>
                <div className="video-comment-date">{formatDate(c.created_at)}</div>
              </div>
              {(user?.id === c.author_id || profile?.is_admin) && (
                <button onClick={() => deleteComment.mutate(c.id)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.7rem", alignSelf: "flex-start", marginTop: 2 }} aria-label="Delete comment">✕</button>
              )}
            </div>
          ))}
          {user ? (
            <form className="video-comment-form" onSubmit={handleComment}>
              <input className="video-comment-input" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…" maxLength={1000} />
              <button type="submit" className="video-comment-submit" disabled={!commentText.trim() || createComment.isPending}>Post</button>
            </form>
          ) : (
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 8 }}>
              <button onClick={() => navigate("home")} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: "inherit" }}>Sign in</button> to comment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
