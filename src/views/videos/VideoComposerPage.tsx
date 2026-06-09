import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useCreateVideo } from "../../hooks/useVideos";
import { validateVideoFile, parseEmbedUrl, formatScriptureTag } from "../../utils/videoEmbed";
import { videosApi } from "../../api/videos";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

const VideoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
);

interface Props {
  user: { id: string } | null;
  onBack: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: any;
  onLogout?: (() => void) | null;
  currentPage?: string;
  onSearchClick?: () => void;
}

export default function VideoComposerPage({ user, onBack, navigate, ...sharedNav }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [linkError, setLinkError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [compressProgress, setCompressProgress] = useState<{ ratio: number; originalMB: number; compressedMB: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scriptureBook, setScriptureBook] = useState("");
  const [scriptureChapter, setScriptureChapter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createVideo = useCreateVideo(user?.id);

  function handleLinkChange(url: string) {
    setLinkUrl(url);
    setLinkError("");
    if (!url.trim()) { setEmbedUrl(null); return; }
    const embed = parseEmbedUrl(url.trim());
    if (embed) {
      setEmbedUrl(embed);
    } else {
      setEmbedUrl(null);
      if (url.length > 10) setLinkError(t("videos.unsupportedLink"));
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }

  function selectFile(f: File) {
    setFileError("");
    const err = validateVideoFile(f);
    if (err) { setFileError(err); return; }
    setFile(f);
  }

  async function handleSubmit() {
    if (!user) return;
    if (!title.trim()) { toast(t("videos.titleRequired")); return; }
    try {
      setUploading(true);
      if (tab === "link") {
        if (!embedUrl) { toast(t("videos.enterValidLink")); return; }
        await createVideo.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          embed_url: embedUrl,
          scripture_tag: formatScriptureTag(scriptureBook, scriptureChapter),
        });
        toast(t("videos.videoPosted"));
        onBack();
        return;
      }
      if (!file) { toast(t("videos.selectVideoFile")); return; }
      // Lazy-load compression, not in the initial bundle
      const { compressVideo } = await import("../../lib/videoCompress");
      let compressed: File;
      try {
        compressed = await compressVideo(file, setCompressProgress);
      } catch (compressErr: any) {
        if (compressErr.message?.includes("SharedArrayBuffer")) {
          compressed = file;
        } else {
          throw compressErr;
        }
      }
      const storage_path = await videosApi.uploadFile(user.id, compressed);
      await createVideo.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        storage_path,
        scripture_tag: formatScriptureTag(scriptureBook, scriptureChapter),
      });
      toast(t("videos.videoPosted"));
      onBack();
    } catch (err: any) {
      toast(err.message ?? t("videos.failedSubmit"));
    } finally {
      setUploading(false);
      setCompressProgress(null);
    }
  }

  const isCompressing = compressProgress !== null && compressProgress.ratio < 1;
  const submitLabel = isCompressing
    ? t("videos.compressingPct", { pct: Math.round((compressProgress?.ratio ?? 0) * 100) })
    : uploading ? t("videos.uploading")
    : t("videos.post");
  const canSubmit = !isCompressing && !uploading && !!title.trim() && (tab === "link" ? !!embedUrl : !!file);

  return (
    <div className="videos-wrap">
      <div className="video-composer-wrap">
        <div className="video-composer">
          <div className="video-composer-header">
            <VideoIcon />
            <h2>{t("videos.composerTitle")}</h2>
            <button className="video-composer-close" onClick={onBack} aria-label={t("videos.ariaBack")}>✕</button>
          </div>
          <div className="video-composer-tabs">
            <button className={`video-composer-tab${tab === "link" ? " active" : ""}`} onClick={() => setTab("link")}>{t("videos.tabPasteLink")}</button>
            <button className={`video-composer-tab${tab === "upload" ? " active" : ""}`} onClick={() => setTab("upload")}>{t("videos.tabUploadFile")}</button>
          </div>
          <div className="video-composer-body">
            <div className="video-composer-field">
              <label className="video-composer-label">{t("videos.fieldTitle")}</label>
              <input className="video-composer-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={t("videos.phQuestion")} maxLength={200} />
            </div>
            <div className="video-composer-field">
              <label className="video-composer-label">{t("videos.fieldDescription")}</label>
              <textarea className="video-composer-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder={t("videos.phDescription")} maxLength={1000} />
            </div>
            <div className="video-composer-field">
              <label className="video-composer-label">{t("videos.fieldScriptureTag")}</label>
              <div className="video-scripture-row">
                <input
                  className="video-composer-input"
                  value={scriptureBook}
                  onChange={e => setScriptureBook(e.target.value)}
                  placeholder={t("videos.phBook")}
                  maxLength={30}
                />
                <input
                  className="video-composer-input"
                  value={scriptureChapter}
                  onChange={e => setScriptureChapter(e.target.value)}
                  placeholder={t("videos.phChapter")}
                  maxLength={5}
                  type="text"
                  inputMode="numeric"
                />
              </div>
              <div className="video-scripture-hint">{t("videos.scriptureHint")}</div>
            </div>

            {tab === "link" ? (
              <div className="video-composer-field">
                <label className="video-composer-label">{t("videos.fieldUrl")}</label>
                <input className="video-composer-input" value={linkUrl} onChange={e => handleLinkChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
                {embedUrl && <div className="video-embed-badge">✓ {t("videos.validLinkDetected")}</div>}
                {linkError && <div className="video-error-msg">{linkError}</div>}
              </div>
            ) : (
              <>
                {!file ? (
                  <div
                    className="video-dropzone"
                    role="button"
                    tabIndex={0}
                    aria-label={t("videos.dropVideoHere")}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                    onDrop={handleFileDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    <div className="video-dropzone-text">
                      <strong>{t("videos.dropVideoHere")}</strong> {t("videos.orClickToBrowse")}<br />
                      <span style={{ fontSize: "0.68rem", opacity: 0.6 }}>{t("videos.fileFormatsHint")}</span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }} />
                  </div>
                ) : compressProgress ? (
                  <div className="video-progress-panel">
                    <div className="video-progress-label">{compressProgress.ratio < 1 ? t("videos.compressingPct", { pct: Math.round(compressProgress.ratio * 100) }) : t("videos.compressionComplete")}</div>
                    <div className="video-progress-bar"><div className="video-progress-fill" style={{ width: `${Math.round(compressProgress.ratio * 100)}%` }} /></div>
                    <div className="video-progress-stats">
                      <span>{t("videos.originalMB", { mb: compressProgress.originalMB.toFixed(0) })}</span>
                      <span style={{ color: "#34d399" }}>{t("videos.compressedMB", { mb: compressProgress.compressedMB.toFixed(0) })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="video-progress-panel" style={{ cursor: "pointer" }} onClick={() => { setFile(null); setFileError(""); }}>
                    <div className="video-progress-label">📁 {file.name}</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(240,234,255,0.45)", marginTop: 2 }}>{t("videos.fileSizeRemove", { mb: (file.size / (1024 * 1024)).toFixed(0) })}</div>
                  </div>
                )}
                {fileError && <div className="video-error-msg">{fileError}</div>}
              </>
            )}

            <button className="video-composer-submit" onClick={handleSubmit} disabled={!canSubmit}>{submitLabel}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
