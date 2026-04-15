import { useState } from "react";
import { useMyCreatorRequest, useSubmitCreatorRequest } from "../../hooks/useVideos";
import { useFullProfile } from "../../hooks/useAdmin";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

interface Props {
  user: { id: string } | null;
  onBack: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: { language?: string };
  onLogout?: (() => void) | null;
  currentPage?: string;
  onSearchClick?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending:  "Pending review — usually 24–48 hrs",
  approved: "Approved — you can now post videos!",
  denied:   "Request denied. Contact support for more information.",
};

export default function CreatorRequestPage({ user, onBack, navigate, ...sharedNav }: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: existingRequest, isLoading } = useMyCreatorRequest(user?.id);
  const submitRequest = useSubmitCreatorRequest(user?.id);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [topicDesc, setTopicDesc] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");

  if (!isLoading && profile?.is_approved_creator) {
    navigate("videos");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !topicDesc.trim()) { toast("Display name and topic description are required."); return; }
    try {
      await submitRequest.mutateAsync({ display_name: displayName.trim(), topic_description: topicDesc.trim(), sample_url: sampleUrl.trim() || undefined });
      toast("Request submitted! We'll review it within 24–48 hours.");
    } catch (err: any) {
      toast(err.message ?? "Failed to submit.");
    }
  }

  return (
    <div className="videos-wrap">
      <div className="creator-request-wrap">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem", marginBottom: 16 }}>← Back</button>
        <div className="creator-request-card">
          <div className="creator-request-title">Apply to Upload Videos</div>
          <div className="creator-request-sub">Approved creators can post YouTube/TikTok/Rumble embeds and MP4 uploads. All videos are reviewed before appearing in the feed.</div>
          {existingRequest ? (
            <div className={`creator-request-status ${existingRequest.status}`}>
              {STATUS_LABELS[existingRequest.status] ?? existingRequest.status}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="video-composer-field" style={{ marginTop: 16 }}>
                <label className="video-composer-label">Your display name *</label>
                <input className="video-composer-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Reductio" maxLength={60} />
              </div>
              <div className="video-composer-field">
                <label className="video-composer-label">What topics will you cover? *</label>
                <textarea className="video-composer-textarea" value={topicDesc} onChange={e => setTopicDesc(e.target.value)} placeholder="Theology, biblical Greek, JW studies…" maxLength={500} />
              </div>
              <div className="video-composer-field">
                <label className="video-composer-label">Sample video URL (optional)</label>
                <input className="video-composer-input" value={sampleUrl} onChange={e => setSampleUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
              </div>
              <button type="submit" className="video-composer-submit" disabled={submitRequest.isPending} style={{ marginTop: 4 }}>
                {submitRequest.isPending ? "Submitting…" : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
