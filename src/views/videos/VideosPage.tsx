import { useState, useRef } from "react";
import { usePublishedVideos } from "../../hooks/useVideos";
import {
  useToggleVideoLike,
  useUserLikedVideoIds,
  useVideoComments,
  useCreateVideoComment,
} from "../../hooks/useVideos";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

// ── Helpers ────────────────────────────────────────────────────

function formatDur(sec: number | null): string {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// ── Icons ──────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
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
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────

interface Video {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  creator_id: string;
  embed_url: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  likes_count: number;
  created_at: string;
  scripture_tag: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

// ── ReelItem ───────────────────────────────────────────────────

interface ReelItemProps {
  video: Video;
  liked: boolean;
  onLike: () => void;
  onExpand: () => void;
  onComment: () => void;
  onShare: () => void;
}

function ReelItem({ video, liked, onLike, onExpand, onComment, onShare }: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const isUpload = !video.embed_url && !!video.storage_path;
  const creatorName = video.profiles?.display_name ?? "Creator";
  const initials = (creatorName[0] ?? "?").toUpperCase();

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(v.currentTime / v.duration);
  }

  return (
    <div className="reel-item">
      {/* ── Video layer ── */}
      {video.embed_url ? (
        <iframe
          className="reel-iframe"
          src={video.embed_url}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : isUpload ? (
        /* Uploaded videos show placeholder in feed — tap expand to watch with signed URL */
        <div className="reel-bg-placeholder">
          <PlayIcon />
        </div>
      ) : (
        <div className="reel-bg-placeholder">
          <PlayIcon />
        </div>
      )}

      <div className="reel-gradient" />

      {/* ── Expand button ── */}
      <button className="reel-expand-btn" onClick={onExpand} aria-label="Open full view">
        ↗ Full view
      </button>

      {/* ── Right rail ── */}
      <div className="reel-rail">
        <div className="rail-item">
          <button
            className={`rail-btn like${liked ? " liked" : ""}`}
            onClick={onLike}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <HeartIcon filled={liked} />
          </button>
          <span className="rail-count">{video.likes_count}</span>
        </div>
        <div className="rail-item">
          <button className="rail-btn comment" onClick={onComment} aria-label="Open comments">
            <CommentIcon />
          </button>
        </div>
        <div className="rail-item">
          <button className="rail-btn share" onClick={onShare} aria-label="Share">
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* ── Bottom overlay ── */}
      <div className="reel-overlay-text">
        {video.scripture_tag && (
          <div className="reel-scripture-badge">
            <BookIcon />
            {video.scripture_tag}
          </div>
        )}
        <div className="reel-title">{video.title}</div>
        <div className="reel-creator-row">
          <div className="reel-creator-avatar">
            {video.profiles?.avatar_url
              ? <img src={video.profiles.avatar_url} alt={creatorName} />
              : initials}
          </div>
          <span className="reel-creator-name">{creatorName}</span>
          {video.duration_sec && (
            <span className="reel-duration">{formatDur(video.duration_sec)}</span>
          )}
        </div>
        {video.description && (
          <div className="reel-desc-snippet">
            {video.description.slice(0, 80)}{video.description.length > 80 ? "…" : ""}
          </div>
        )}
      </div>

      {/* ── Progress bar (uploaded videos only — when playing in future) ── */}
      {isUpload && (
        <div className="reel-progress">
          <div className="reel-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

// ── CommentDrawer ──────────────────────────────────────────────

interface CommentDrawerProps {
  videoId: string;
  user: { id: string } | null;
  onClose: () => void;
}

function CommentDrawer({ videoId, user, onClose }: CommentDrawerProps) {
  const { data: comments = [] } = useVideoComments(videoId);
  const createComment = useCreateVideoComment(videoId);
  const [text, setText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    try {
      await createComment.mutateAsync({ userId: user.id, content: text.trim() });
      setText("");
    } catch (err: any) {
      toast(err.message ?? "Failed to post comment.");
    }
  }

  return (
    <div className="reel-drawer-backdrop" onClick={onClose}>
      <div className="reel-comment-drawer" onClick={e => e.stopPropagation()}>
        <div className="reel-drawer-handle" />
        <div className="reel-drawer-header">
          <span className="reel-drawer-title">
            {(comments as any[]).length} {(comments as any[]).length === 1 ? "comment" : "comments"}
          </span>
          <button className="reel-drawer-close" onClick={onClose} aria-label="Close comments">✕</button>
        </div>
        <div className="reel-drawer-comments">
          {(comments as any[]).length === 0 && (
            <div className="reel-drawer-empty">
              No comments yet — your words of encouragement are always welcome here.
            </div>
          )}
          {(comments as any[]).map(c => (
            <div key={c.id} className="video-comment">
              <div className="video-comment-avatar">
                {c.profiles?.avatar_url
                  ? <img src={c.profiles.avatar_url} alt={c.profiles?.display_name ?? "?"} />
                  : (c.profiles?.display_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="video-comment-body">
                <div className="video-comment-author">{c.profiles?.display_name ?? "Anonymous"}</div>
                <div className="video-comment-text">{c.content}</div>
              </div>
            </div>
          ))}
        </div>
        {user ? (
          <form className="video-comment-form" style={{ padding: "0 16px 16px" }} onSubmit={handleSubmit}>
            <input
              className="video-comment-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
              autoFocus
            />
            <button
              type="submit"
              className="video-comment-submit"
              disabled={!text.trim() || createComment.isPending}
            >
              Post
            </button>
          </form>
        ) : (
          <div style={{ padding: "0 16px 16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Sign in to comment.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────

interface Props {
  user: { id: string } | null;
  profile?: any;
  slug?: string | null;
  onSelectVideo: (slug: string) => void;
  onBack: () => void;
  onPostClick: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: any;
  onLogout?: (() => void) | null;
  onUpgrade?: () => void;
  currentPage?: string;
  onSearchClick?: () => void;
}

// ── Main component ─────────────────────────────────────────────

export default function VideosPage({ user, onSelectVideo, onPostClick }: Props) {
  const { data: videos = [], isLoading } = usePublishedVideos();
  const { data: likedIds = [] } = useUserLikedVideoIds(user?.id);
  const toggleLike = useToggleVideoLike(user?.id);
  // All signed-in users can post — no creator approval required
  const canPost = !!user;

  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);

  function handleLike(videoId: string) {
    if (!user) { toast("Sign in to like videos."); return; }
    toggleLike.mutate(videoId);
  }

  function handleShare(slug: string) {
    const url = `${window.location.origin}/videos/${encodeURIComponent(slug)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast("Link copied!"))
      .catch(() => toast("Could not copy link."));
  }

  return (
    <>
      <div className="reel-feed">
        {isLoading && [0, 1, 2].map(i => <div key={i} className="reel-skeleton" />)}
        {!isLoading && (videos as unknown as Video[]).length === 0 && (
          <div className="reel-empty">
            {canPost
              ? "Every heart has something worth sharing.\nYours could be exactly what someone needs today."
              : "Something beautiful is on its way.\nCheck back soon — great things take a little time."}
          </div>
        )}
        {!isLoading && (videos as unknown as Video[]).map(video => (
          <ReelItem
            key={video.id}
            video={video}
            liked={(likedIds as string[]).includes(video.id)}
            onLike={() => handleLike(video.id)}
            onExpand={() => onSelectVideo(video.slug)}
            onComment={() => setCommentVideoId(video.id)}
            onShare={() => handleShare(video.slug)}
          />
        ))}
      </div>

      {/* FAB visible to all signed-in users — no approval gate */}
      {canPost && (
        <button className="reel-fab" onClick={onPostClick} aria-label="Post a video">
          + Post
        </button>
      )}

      {commentVideoId && (
        <CommentDrawer
          videoId={commentVideoId}
          user={user}
          onClose={() => setCommentVideoId(null)}
        />
      )}
    </>
  );
}
