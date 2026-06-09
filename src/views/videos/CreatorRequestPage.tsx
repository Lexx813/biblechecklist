import { useState } from "react";
import { useTranslation } from "react-i18next";
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

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending:  "videos.statusPending",
  approved: "videos.statusApproved",
  denied:   "videos.statusDenied",
};

export default function CreatorRequestPage({ user, onBack, navigate, ...sharedNav }: Props) {
  const { t } = useTranslation();
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
    if (!displayName.trim() || !topicDesc.trim()) { toast(t("videos.nameTopicRequired")); return; }
    try {
      await submitRequest.mutateAsync({ display_name: displayName.trim(), topic_description: topicDesc.trim(), sample_url: sampleUrl.trim() || undefined });
      toast(t("videos.requestSubmitted"));
    } catch (err: any) {
      toast(err.message ?? t("videos.failedSubmitShort"));
    }
  }

  return (
    <div className="videos-wrap">
      <div className="creator-request-wrap">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem", marginBottom: 16 }}>← {t("videos.back")}</button>
        <div className="creator-request-card">
          <div className="creator-request-title">{t("videos.creatorTitle")}</div>
          <div className="creator-request-sub">{t("videos.creatorSubtitle")}</div>
          {existingRequest ? (
            <div className={`creator-request-status ${existingRequest.status}`}>
              {STATUS_LABEL_KEYS[existingRequest.status] ? t(STATUS_LABEL_KEYS[existingRequest.status]) : existingRequest.status}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="video-composer-field" style={{ marginTop: 16 }}>
                <label className="video-composer-label">{t("videos.fieldDisplayName")}</label>
                <input className="video-composer-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Reductio" maxLength={60} />
              </div>
              <div className="video-composer-field">
                <label className="video-composer-label">{t("videos.fieldTopics")}</label>
                <textarea className="video-composer-textarea" value={topicDesc} onChange={e => setTopicDesc(e.target.value)} placeholder={t("videos.phTopics")} maxLength={500} />
              </div>
              <div className="video-composer-field">
                <label className="video-composer-label">{t("videos.fieldSampleUrl")}</label>
                <input className="video-composer-input" value={sampleUrl} onChange={e => setSampleUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
              </div>
              <button type="submit" className="video-composer-submit" disabled={submitRequest.isPending} style={{ marginTop: 4 }}>
                {submitRequest.isPending ? t("videos.submitting") : t("videos.submitRequest")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
