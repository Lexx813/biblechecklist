import { useFullProfile } from "../../hooks/useAdmin";
import { usePublishedVideos } from "../../hooks/useVideos";
import "../../styles/videos.css";

function formatDur(sec: number | null): string {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function VideoCardSkeleton() {
  return (
    <div className="video-card-skeleton">
      <div className="video-card-skeleton-thumb skeleton" />
      <div className="video-card-skeleton-body">
        <div className="skeleton" style={{ height: 14, borderRadius: 4, width: "80%" }} />
        <div className="skeleton" style={{ height: 10, borderRadius: 4, width: "50%" }} />
      </div>
    </div>
  );
}

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

export default function VideosPage({ user, onSelectVideo, onBack, onPostClick, navigate, ...sharedNav }: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: videos = [], isLoading } = usePublishedVideos();
  const canPost = profile?.is_approved_creator || profile?.is_admin;

  return (
    <div className="videos-wrap">
<nav className="videos-nav">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem" }} aria-label="Back">← Back</button>
        <span className="videos-nav-title">Videos</span>
        {canPost
          ? <button className="videos-post-btn" onClick={onPostClick}>+ Post a Video</button>
          : user
            ? <button className="videos-post-btn" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }} onClick={() => navigate("creatorRequest")}>Apply to post</button>
            : <span />
        }
      </nav>
      <div className="videos-feed">
        {isLoading && [0,1,2,3].map(i => <VideoCardSkeleton key={i} />)}
        {!isLoading && videos.length === 0 && (
          <div className="videos-empty">No videos yet.{canPost ? " Be the first to post one!" : ""}</div>
        )}
        {!isLoading && (videos as any[]).map(video => (
          <div
            key={video.id}
            className="video-card"
            onClick={() => onSelectVideo(video.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onSelectVideo(video.slug)}
          >
            <div className="video-card-thumb">
              {video.thumbnail_url
                ? <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
                : <div className="video-card-play"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white"/></svg></div>
              }
              {video.duration_sec && <span className="video-card-dur">{formatDur(video.duration_sec)}</span>}
            </div>
            <div className="video-card-body">
              <div className="video-card-title">{video.title}</div>
              <div className="video-card-meta">{video.profiles?.display_name ?? "Unknown"} · {video.likes_count} likes</div>
              {video.description && <div className="video-card-desc">{video.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
