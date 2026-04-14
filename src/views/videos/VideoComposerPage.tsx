import { useState, useRef } from "react";
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
  onUpgrade?: () => void;
  currentPage?: string;
  onSearchClick?: () => void;
}

export default function VideoComposerPage({ user, onBack, navigate, ...sharedNav }: Props) {
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
      if (url.length > 10) setLinkError("Only YouTube, TikTok (full URL), and Rumble links are supported. For TikTok, open the video in a browser and copy the full URL (e.g. tiktok.com/@user/video/…).");
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
    if (!title.trim()) { toast("Title is required."); return; }
    try {
      setUploading(true);
      if (tab === "link") {
        if (!embedUrl) { toast("Enter a valid YouTube, TikTok, or Rumble link."); return; }
        await createVideo.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          embed_url: embedUrl,
          scripture_tag: formatScriptureTag(scriptureBook, scriptureChapter),
        });
        toast("Video posted!");
        onBack();
        return;
      }
      if (!file) { toast("Please select a video file."); return; }
      // Lazy-load compression — not in the initial bundle
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
      toast("Video posted!");
      onBack();
    } catch (err: any) {
      toast(err.message ?? "Failed to submit. Please try again.");
    } finally {
      setUploading(false);
      setCompressProgress(null);
    }
  }

  const isCompressing = compressProgress !== null && compressProgress.ratio < 1;
  const submitLabel = isCompressing
    ? `Compressing… ${Math.round((compressProgress?.ratio ?? 0) * 100)}%`
    : uploading ? "Uploading…"
    : "Post";
  const canSubmit = !isCompressing && !uploading && !!title.trim() && (tab === "link" ? !!embedUrl : !!file);

  return (
    <div className="videos-wrap">
      <div className="video-composer-wrap">
        <div className="video-composer">
          <div className="video-composer-header">
            <VideoIcon />
            <h2>Post a Video</h2>
            <button className="video-composer-close" onClick={onBack} aria-label="Back">✕</button>
          </div>
          <div className="video-composer-tabs">
            <button className={`video-composer-tab${tab === "link" ? " active" : ""}`} onClick={() => setTab("link")}>Paste Link</button>
            <button className={`video-composer-tab${tab === "upload" ? " active" : ""}`} onClick={() => setTab("upload")}>Upload File</button>
          </div>
          <div className="video-composer-body">
            <div className="video-composer-field">
              <label className="video-composer-label">Title *</label>
              <input className="video-composer-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Is the Angel of Jehovah God?" maxLength={200} />
            </div>
            <div className="video-composer-field">
              <label className="video-composer-label">Description (optional)</label>
              <textarea className="video-composer-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description…" maxLength={1000} />
            </div>
            <div className="video-composer-field">
              <label className="video-composer-label">Scripture Tag (optional)</label>
              <div className="video-scripture-row">
                <input
                  className="video-composer-input"
                  value={scriptureBook}
                  onChange={e => setScriptureBook(e.target.value)}
                  placeholder="Book  e.g. John"
                  maxLength={30}
                />
                <input
                  className="video-composer-input"
                  value={scriptureChapter}
                  onChange={e => setScriptureChapter(e.target.value)}
                  placeholder="Ch.  e.g. 3"
                  maxLength={5}
                  type="text"
                  inputMode="numeric"
                />
              </div>
              <div className="video-scripture-hint">Shows as a badge on the reel. Leave blank if not applicable.</div>
            </div>

            {tab === "link" ? (
              <div className="video-composer-field">
                <label className="video-composer-label">YouTube, TikTok, or Rumble URL</label>
                <input className="video-composer-input" value={linkUrl} onChange={e => handleLinkChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
                {embedUrl && <div className="video-embed-badge">✓ Valid link detected</div>}
                {linkError && <div className="video-error-msg">{linkError}</div>}
              </div>
            ) : (
              <>
                {!file ? (
                  <div className="video-dropzone" onClick={() => fileInputRef.current?.click()} onDrop={handleFileDrop} onDragOver={e => e.preventDefault()}>
                    <div className="video-dropzone-text">
                      <strong>Drop video here</strong> or click to browse<br />
                      <span style={{ fontSize: "0.68rem", opacity: 0.6 }}>MP4, MOV, WebM · max 50 MB</span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }} />
                  </div>
                ) : compressProgress ? (
                  <div className="video-progress-panel">
                    <div className="video-progress-label">{compressProgress.ratio < 1 ? `Compressing… ${Math.round(compressProgress.ratio * 100)}%` : "Compression complete"}</div>
                    <div className="video-progress-bar"><div className="video-progress-fill" style={{ width: `${Math.round(compressProgress.ratio * 100)}%` }} /></div>
                    <div className="video-progress-stats">
                      <span>Original: {compressProgress.originalMB.toFixed(0)} MB</span>
                      <span style={{ color: "#34d399" }}>~{compressProgress.compressedMB.toFixed(0)} MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="video-progress-panel" style={{ cursor: "pointer" }} onClick={() => { setFile(null); setFileError(""); }}>
                    <div className="video-progress-label">📁 {file.name}</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(240,234,255,0.45)", marginTop: 2 }}>{(file.size / (1024 * 1024)).toFixed(0)} MB · Click to remove</div>
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
