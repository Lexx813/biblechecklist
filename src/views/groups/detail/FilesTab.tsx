import { useRef } from "react";
import { useGroupFiles, useUploadFile, useDeleteFile } from "../../../hooks/useGroups";
import { groupsApi, GroupFile } from "../../../api/groups";
import { toast } from "../../../lib/toast";
import { timeAgo, formatFileSize } from "./utils";

interface Props {
  groupId: string;
  userId: string;
  isAdmin: boolean;
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return "🖼";
  if (mime.startsWith("video/")) return "🎬";
  if (mime.includes("pdf")) return "📄";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("sheet") || mime.includes("excel")) return "📊";
  return "📎";
}

export default function FilesTab({ groupId, userId, isAdmin }: Props) {
  const { data: files = [], isLoading } = useGroupFiles(groupId);
  const upload = useUploadFile(groupId);
  const deleteFile = useDeleteFile(groupId);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) { toast.error("File must be under 50 MB."); return; }
    upload.mutate(f, { onError: () => toast.error("Failed to upload file.") });
    e.target.value = "";
  }

  return (
    <div className="grp-files-tab">
      <div className="grp-files-header">
        <h3 className="grp-section-label">Shared Files</h3>
        <button className="grp-btn grp-btn--sm grp-btn--primary" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? "Uploading…" : "Upload file"}
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp3" />
      </div>

      {isLoading ? (
        <p className="grp-tab-loading">Loading files…</p>
      ) : (files as GroupFile[]).length === 0 ? (
        <div className="grp-empty-state grp-empty-state--sm">
          <p>No files yet. Upload one to share with the group.</p>
        </div>
      ) : (
        <div className="grp-file-list">
          {(files as GroupFile[]).map(f => (
            <div key={f.id} className="grp-file-row">
              <span className="grp-file-icon" aria-hidden="true">{fileIcon(f.mime_type)}</span>
              <div className="grp-file-info">
                <a href={groupsApi.getFileUrl(f.storage_path)} target="_blank" rel="noopener noreferrer" className="grp-file-name">{f.file_name}</a>
                <span className="grp-file-meta">{formatFileSize(f.file_size)} · {f.uploader?.display_name || "Unknown"} · {timeAgo(f.created_at)}</span>
              </div>
              {(f.uploaded_by === userId || isAdmin) && (
                <button className="grp-post-delete" onClick={() => deleteFile.mutate({ fileId: f.id, storagePath: f.storage_path }, { onError: () => toast.error("Failed to delete file.") })} aria-label="Delete file">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
