import { useState, useRef } from "react";
import { useCreatePost } from "../../../hooks/useGroups";
import { groupsApi } from "../../../api/groups";
import { toast } from "../../../lib/toast";
import { stripHtml } from "../../../lib/sanitize";
import RichTextEditor from "../../../components/RichTextEditor";

interface Props {
  groupId: string;
  isAdmin: boolean;
}

export default function ComposeBox({ groupId, isAdmin }: Props) {
  const [content, setContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost(groupId);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        const url = await groupsApi.uploadPostImage(groupId, f);
        urls.push(url);
      }
      setMediaUrls(prev => [...prev, ...urls]);
    } catch {
      toast.error("Image upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setMediaUrls(prev => prev.filter(u => u !== url));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const hasText = stripHtml(content).length > 0;
    if (!hasText && mediaUrls.length === 0) return;
    createPost.mutate(
      { content: hasText ? content : "", isAnnouncement: isAdmin && isAnnouncement, mediaUrls },
      {
        onSuccess: () => { setContent(""); setIsAnnouncement(false); setMediaUrls([]); },
        onError: () => toast.error("Failed to post."),
      }
    );
  }

  const hasText = stripHtml(content).length > 0;

  return (
    <form className="grp-compose" onSubmit={submit}>
      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Share something with the group…"
        minimal
        allowMentions
      />
      {mediaUrls.length > 0 && (
        <div className="grp-compose-media">
          {mediaUrls.map(url => (
            <div key={url} className="grp-compose-media-item">
              <img src={url} alt="" />
              <button type="button" className="grp-compose-media-remove" onClick={() => removeImage(url)} aria-label="Remove image">×</button>
            </div>
          ))}
        </div>
      )}
      <div className="grp-compose-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          className="grp-btn grp-btn--sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "Add image"}
        </button>
        {isAdmin && (
          <label className="grp-compose-announce">
            <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} />
            Pin as announcement
          </label>
        )}
        <button type="submit" className="grp-btn grp-btn--primary grp-btn--sm" disabled={(!hasText && mediaUrls.length === 0) || createPost.isPending || uploading}>
          {createPost.isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
