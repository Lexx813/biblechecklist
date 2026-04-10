import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  useGroup, useGroupMembers, useGroupPosts, useCreatePost, useDeletePost, useToggleLike,
  usePostComments, useAddComment, useDeleteComment,
  useGroupEvents, useCreateEvent, useDeleteEvent, useSetRsvp, useRemoveRsvp,
  useGroupFiles, useUploadFile, useDeleteFile,
  useLeaveGroup, useRemoveMember, useDeleteGroup,
  useApproveJoinRequest, useDenyJoinRequest, useUpdateMemberRole,
} from "../../hooks/useGroups";
import { groupsApi, GroupPost, GroupMember, GroupEvent, GroupFile } from "../../api/groups";
import ConfirmModal from "../../components/ConfirmModal";
import RichTextEditor from "../../components/RichTextEditor";
import { toast } from "../../lib/toast";
import "../../styles/groups.css";

// ── Time helpers ──────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Avatar({ src, name, size = 36 }: { src?: string | null; name?: string | null; size?: number }) {
  const initial = (name || "?")[0].toUpperCase();
  return src
    ? <img src={src} alt={name ?? ""} className="grp-avatar" style={{ width: size, height: size }} loading="lazy" />
    : <span className="grp-avatar grp-avatar--fallback" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initial}</span>;
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({ post, userId, isAdmin, groupId }: { post: GroupPost; userId: string; isAdmin: boolean; groupId: string }) {
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
      <div className="grp-post-content editor-render" dangerouslySetInnerHTML={{ __html: post.content }} />
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

// ── Compose box ───────────────────────────────────────────────────────────────

function ComposeBox({ groupId, isAdmin }: { groupId: string; isAdmin: boolean }) {
  const [content, setContent] = useState("");
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost(groupId);

  function plainFromHtml(html: string) {
    return html.replace(/<[^>]*>/g, "").trim();
  }

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
    const hasText = plainFromHtml(content).length > 0;
    if (!hasText && mediaUrls.length === 0) return;
    createPost.mutate(
      { content: hasText ? content : "", isAnnouncement: isAdmin && isAnnouncement, mediaUrls },
      {
        onSuccess: () => { setContent(""); setIsAnnouncement(false); setMediaUrls([]); },
        onError: () => toast.error("Failed to post."),
      }
    );
  }

  const hasText = plainFromHtml(content).length > 0;

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
              <button type="button" className="grp-compose-media-remove" onClick={() => removeImage(url)} aria-label="× Remove image">×</button>
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
          style={{ display: "none" }}
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          className="grp-btn grp-btn--sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "📷 Add image"}
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

// ── Create event modal ────────────────────────────────────────────────────────

function CreateEventModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const createEvent = useCreateEvent(groupId);
  const [form, setForm] = useState({ title: "", description: "", location: "", starts_at: "", ends_at: "" });
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.starts_at) return;
    setError("");
    createEvent.mutate(
      { title: form.title.trim(), description: form.description.trim() || undefined, location: form.location.trim() || undefined, starts_at: form.starts_at, ends_at: form.ends_at || undefined },
      { onSuccess: () => onClose(), onError: (err: Error) => setError(err.message) }
    );
  }

  return createPortal(
    <div className="grp-modal-overlay" onClick={onClose}>
      <div className="grp-modal" onClick={e => e.stopPropagation()}>
        <div className="grp-modal-header">
          <h2 className="grp-modal-title">Create Event</h2>
          <button className="grp-modal-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form className="grp-modal-body" onSubmit={submit}>
          <label className="grp-field"><span>Title</span><input className="grp-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Meeting title" maxLength={120} required autoFocus /></label>
          <label className="grp-field"><span>Description <span className="grp-optional">(optional)</span></span><textarea className="grp-input grp-textarea" value={form.description} onChange={e => set("description", e.target.value)} maxLength={500} rows={2} /></label>
          <label className="grp-field"><span>Location <span className="grp-optional">(optional)</span></span><input className="grp-input" value={form.location} onChange={e => set("location", e.target.value)} placeholder="Address or meeting link" maxLength={200} /></label>
          <label className="grp-field"><span>Starts at</span><input className="grp-input" type="datetime-local" value={form.starts_at} onChange={e => set("starts_at", e.target.value)} required /></label>
          <label className="grp-field"><span>Ends at <span className="grp-optional">(optional)</span></span><input className="grp-input" type="datetime-local" value={form.ends_at} onChange={e => set("ends_at", e.target.value)} /></label>
          {error && <p className="grp-error">{error}</p>}
          <div className="grp-modal-actions">
            <button type="button" className="grp-btn grp-btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="grp-btn grp-btn--primary" disabled={createEvent.isPending || !form.title.trim() || !form.starts_at}>
              {createEvent.isPending ? "Creating…" : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event, isAdmin, groupId }: { event: GroupEvent; isAdmin: boolean; groupId: string }) {
  const setRsvp = useSetRsvp(groupId);
  const removeRsvp = useRemoveRsvp(groupId);
  const deleteEvent = useDeleteEvent(groupId);
  const isPast = new Date(event.starts_at) < new Date();

  function handleRsvp(status: "going" | "maybe" | "not_going") {
    if (event.my_rsvp === status) {
      removeRsvp.mutate(event.id, { onError: () => toast.error("Failed to update RSVP.") });
    } else {
      setRsvp.mutate({ eventId: event.id, status }, { onError: () => toast.error("Failed to update RSVP.") });
    }
  }

  return (
    <div className={`grp-event${isPast ? " grp-event--past" : ""}`}>
      <div className="grp-event-date">
        <span className="grp-event-month">{new Date(event.starts_at).toLocaleDateString(undefined, { month: "short" })}</span>
        <span className="grp-event-day">{new Date(event.starts_at).getDate()}</span>
      </div>
      <div className="grp-event-info">
        <div className="grp-event-title-row">
          <h4 className="grp-event-title">{event.title}</h4>
          {isAdmin && (
            <button className="grp-post-delete" onClick={() => deleteEvent.mutate(event.id, { onError: () => toast.error("Failed to delete event.") })} aria-label="Delete event">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          )}
        </div>
        <div className="grp-event-meta">
          <span>{formatDate(event.starts_at)}</span>
          {event.location && <span>· {event.location}</span>}
        </div>
        {event.description && <p className="grp-event-desc">{event.description}</p>}
        <div className="grp-event-rsvp">
          <span className="grp-event-rsvp-count">{event.rsvp_count} going</span>
          {!isPast && (
            <div className="grp-rsvp-btns">
              {(["going", "maybe", "not_going"] as const).map(s => (
                <button
                  key={s}
                  className={`grp-rsvp-btn${event.my_rsvp === s ? " grp-rsvp-btn--active" : ""}`}
                  onClick={() => handleRsvp(s)}
                >
                  {s === "going" ? "Going" : s === "maybe" ? "Maybe" : "Can't go"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Members tab ───────────────────────────────────────────────────────────────

function MembersTab({ groupId, userId, isAdmin, isOwner }: { groupId: string; userId: string; isAdmin: boolean; isOwner: boolean }) {
  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const approve = useApproveJoinRequest(groupId);
  const deny = useDenyJoinRequest(groupId);
  const remove = useRemoveMember(groupId);
  const updateRole = useUpdateMemberRole(groupId);

  const pending = (members as GroupMember[]).filter(m => m.status === "pending");
  const active = (members as GroupMember[]).filter(m => m.status === "member");

  if (isLoading) return <div className="grp-tab-loading">Loading members…</div>;

  return (
    <div className="grp-members-tab">
      {isAdmin && pending.length > 0 && (
        <div className="grp-pending-section">
          <h3 className="grp-section-label">Join Requests <span className="grp-tab-count">{pending.length}</span></h3>
          {pending.map(m => (
            <div key={m.id} className="grp-member-row grp-member-row--pending">
              <Avatar src={m.avatar_url} name={m.display_name} size={36} />
              <span className="grp-member-name">{m.display_name || "Unknown"}</span>
              <div className="grp-member-actions">
                <button className="grp-btn grp-btn--sm grp-btn--primary" onClick={() => approve.mutate({ requestId: m.id, userId: m.user_id }, { onError: () => toast.error("Failed to approve.") })}>Approve</button>
                <button className="grp-btn grp-btn--sm grp-btn--ghost" onClick={() => deny.mutate(m.id, { onError: () => toast.error("Failed to deny.") })}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h3 className="grp-section-label">Members <span className="grp-tab-count">{active.length}</span></h3>
      {active.map(m => (
        <div key={m.id} className="grp-member-row">
          <Avatar src={m.avatar_url} name={m.display_name} size={36} />
          <div className="grp-member-info">
            <span className="grp-member-name">{m.display_name || "Unknown"}</span>
            <span className="grp-member-role">{m.role}</span>
          </div>
          {isAdmin && m.user_id !== userId && m.role !== "owner" && (
            <div className="grp-member-actions">
              {isOwner && (
                <button className="grp-btn grp-btn--sm grp-btn--ghost" onClick={() => updateRole.mutate(
                  { memberId: m.id, role: m.role === "admin" ? "member" : "admin" },
                  { onError: () => toast.error("Failed to update role.") }
                )}>
                  {m.role === "admin" ? "Remove admin" : "Make admin"}
                </button>
              )}
              <button className="grp-btn grp-btn--sm grp-btn--danger" onClick={() => remove.mutate(m.id, { onError: () => toast.error("Failed to remove member.") })}>Remove</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Files tab ─────────────────────────────────────────────────────────────────

function FilesTab({ groupId, userId, isAdmin }: { groupId: string; userId: string; isAdmin: boolean }) {
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

  function fileIcon(mime: string) {
    if (mime.startsWith("image/")) return "🖼";
    if (mime.startsWith("video/")) return "🎬";
    if (mime.includes("pdf")) return "📄";
    if (mime.includes("word") || mime.includes("document")) return "📝";
    if (mime.includes("sheet") || mime.includes("excel")) return "📊";
    return "📎";
  }

  return (
    <div className="grp-files-tab">
      <div className="grp-files-header">
        <h3 className="grp-section-label">Shared Files</h3>
        <button className="grp-btn grp-btn--sm grp-btn--primary" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? "Uploading…" : "Upload file"}
        </button>
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.mp3" />
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

// ── Main GroupDetail ──────────────────────────────────────────────────────────

type Tab = "feed" | "members" | "events" | "files";

export default function GroupDetail({ groupId, user, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const [tab, setTab] = useState<Tab>("feed");
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { data: group, isLoading: groupLoading, isError: groupError } = useGroup(groupId);
  const { data: posts = [], isLoading: postsLoading } = useGroupPosts(tab === "feed" ? groupId : undefined);
  const { data: events = [], isLoading: eventsLoading } = useGroupEvents(tab === "events" ? groupId : undefined);
  const leaveGroup = useLeaveGroup();
  const deleteGroup = useDeleteGroup();

  const myRole = group?.myRole;
  const myStatus = group?.myStatus;
  const isAdmin = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";
  const isMember = myStatus === "member";

  function handleLeave() {
    leaveGroup.mutate(groupId, {
      onSuccess: () => navigate("groups"),
      onError: () => toast.error("Failed to leave group."),
    });
  }

  function handleDelete() {
    deleteGroup.mutate(groupId, {
      onSuccess: () => navigate("groups"),
      onError: () => toast.error("Failed to delete group."),
    });
  }

  if (groupLoading) {
    return (
      <div className="grp-detail-page">
        <div className="grp-detail-header-skeleton">
          <div className="skeleton" style={{ height: 26, width: "50%", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: "30%" }} />
        </div>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="grp-detail-page">
        <p className="grp-error">Group not found or you don't have access.</p>
        <button className="grp-btn grp-btn--ghost" onClick={() => navigate("groups")}>← Back to groups</button>
      </div>
    );
  }

  // Pending users see a waiting screen
  if (myStatus === "pending") {
    return (
      <div className="grp-detail-page grp-pending-page">
        <div className="grp-hero grp-hero--sm">
          {group.cover_url ? <img src={group.cover_url} alt={group.name} className="grp-hero-img" loading="lazy" /> : <div className="grp-hero-placeholder"><span>{(group.name||"?")[0].toUpperCase()}</span></div>}
          <button className="grp-back-btn grp-back-btn--overlay" onClick={() => navigate("groups")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg> Groups</button>
        </div>
        <div className="grp-detail-info"><div className="grp-detail-info-main"><div><h1 className="grp-detail-title">{group.name}</h1></div></div></div>
        <div className="grp-pending-banner">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <h3>Request pending</h3>
          <p>An admin needs to approve your request before you can see the group.</p>
          <button className="grp-btn grp-btn--ghost" onClick={handleLeave}>Cancel request</button>
        </div>
      </div>
    );
  }

  // Non-members of private groups see locked
  if (!isMember && group.privacy === "private") {
    return (
      <div className="grp-detail-page grp-pending-page">
        <div className="grp-hero grp-hero--sm">
          {group.cover_url ? <img src={group.cover_url} alt={group.name} className="grp-hero-img" loading="lazy" /> : <div className="grp-hero-placeholder"><span>{(group.name||"?")[0].toUpperCase()}</span></div>}
          <button className="grp-back-btn grp-back-btn--overlay" onClick={() => navigate("groups")}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg> Groups</button>
        </div>
        <div className="grp-detail-info"><div className="grp-detail-info-main"><div><h1 className="grp-detail-title">{group.name}</h1></div></div></div>
        <div className="grp-pending-banner">
          <p>{group.description}</p>
          <p className="grp-pending-banner-sub">{group.member_count} members</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="grp-detail-page">
        {/* Hero banner */}
        <div className="grp-hero">
          {group.cover_url
            ? <img src={group.cover_url} alt={group.name} className="grp-hero-img" loading="lazy" />
            : <div className="grp-hero-placeholder"><span>{(group.name || "?")[0].toUpperCase()}</span></div>}
          <button className="grp-back-btn grp-back-btn--overlay" onClick={() => navigate("groups")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            Groups
          </button>
        </div>

        {/* Group info row */}
        <div className="grp-detail-info">
          <div className="grp-detail-info-main">
            <div>
              <div className="grp-detail-title-row">
                <h1 className="grp-detail-title">{group.name}</h1>
                {group.privacy === "private" && <span className="grp-badge grp-badge--private">Private</span>}
              </div>
              {group.description && <p className="grp-detail-desc">{group.description}</p>}
              <p className="grp-detail-meta">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </p>
            </div>
            <div className="grp-detail-header-actions">
              {!isOwner && (
                <button className="grp-btn grp-btn--ghost grp-btn--sm" onClick={() => setShowLeaveConfirm(true)}>Leave</button>
              )}
              {isOwner && (
                <button className="grp-btn grp-btn--danger grp-btn--sm" onClick={() => setShowDeleteConfirm(true)}>Delete group</button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grp-tabs grp-tabs--detail">
          {(["feed", "members", "events", "files"] as Tab[]).map(t => (
            <button key={t} className={`grp-tab${tab === t ? " grp-tab--active" : ""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Feed */}
        {tab === "feed" && (
          <div className="grp-feed">
            <ComposeBox groupId={groupId} isAdmin={isAdmin} />
            {postsLoading ? (
              <div className="grp-posts-skeleton">
                {[0, 1, 2].map(i => <div key={i} className="skeleton grp-post-skeleton" />)}
              </div>
            ) : (posts as GroupPost[]).length === 0 ? (
              <div className="grp-empty-state grp-empty-state--sm">
                <p>No posts yet. Be the first to share something!</p>
              </div>
            ) : (
              (posts as GroupPost[]).map(p => (
                <PostCard key={p.id} post={p} userId={user.id} isAdmin={isAdmin} groupId={groupId} />
              ))
            )}
          </div>
        )}

        {/* Members */}
        {tab === "members" && (
          <MembersTab groupId={groupId} userId={user.id} isAdmin={isAdmin} isOwner={isOwner} />
        )}

        {/* Events */}
        {tab === "events" && (
          <div className="grp-events-tab">
            {isAdmin && (
              <div className="grp-events-header">
                <button className="grp-btn grp-btn--primary grp-btn--sm" onClick={() => setShowCreateEvent(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Create event
                </button>
              </div>
            )}
            {eventsLoading ? (
              <p className="grp-tab-loading">Loading events…</p>
            ) : (events as GroupEvent[]).length === 0 ? (
              <div className="grp-empty-state grp-empty-state--sm">
                <p>{isAdmin ? "No events yet. Create one above." : "No events scheduled yet."}</p>
              </div>
            ) : (
              (events as GroupEvent[]).map(e => (
                <EventCard key={e.id} event={e} isAdmin={isAdmin} groupId={groupId} />
              ))
            )}
          </div>
        )}

        {/* Files */}
        {tab === "files" && <FilesTab groupId={groupId} userId={user.id} isAdmin={isAdmin} />}
      </div>
      {showCreateEvent && <CreateEventModal groupId={groupId} onClose={() => setShowCreateEvent(false)} />}
      {showLeaveConfirm && (
        <ConfirmModal
          title="Leave group"
          message={`Leave ${group.name}? You'll need to rejoin to see it again.`}
          confirmLabel="Leave"
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
          danger
        />
      )}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete group"
          message={`Permanently delete "${group.name}" and all its content? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          danger
        />
      )}
    </>
  );
}
