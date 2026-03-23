import { useState, useRef, useEffect } from "react";
import ConfirmModal from "../ConfirmModal";
import {
  useCategories, useThreads, useThread, useReplies,
  useCreateThread, useCreateReply,
  useUpdateThread, useDeleteThread, useDeleteReply,
  usePinThread, useLockThread,
} from "../../hooks/useForum";
import "../../styles/forum.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
function displayName(profile) {
  return profile?.display_name || profile?.email?.split("@")[0] || "Anonymous";
}

function initial(profile) {
  return (profile?.display_name || profile?.email || "A")[0].toUpperCase();
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function Avatar({ profile, size = "md" }) {
  if (profile?.avatar_url) {
    return <img className={`forum-avatar forum-avatar--${size}`} src={profile.avatar_url} alt="" />;
  }
  return <div className={`forum-avatar forum-avatar--${size} forum-avatar--fallback`}>{initial(profile)}</div>;
}

// ── Thread View ───────────────────────────────────────────────────────────────
function ThreadView({ threadId, user, profile, onBack, categoryId }) {
  const { data: thread, isLoading: threadLoading } = useThread(threadId);
  const { data: replies = [], isLoading: repliesLoading } = useReplies(threadId);
  const createReply = useCreateReply(threadId);
  const deleteReply = useDeleteReply(threadId);
  const updateThread = useUpdateThread(threadId);
  const deleteThread = useDeleteThread(categoryId);
  const pinThread    = usePinThread(categoryId);
  const lockThread   = useLockThread(categoryId);

  const [replyText, setReplyText]   = useState("");
  const [replyError, setReplyError] = useState("");
  const [editing, setEditing]       = useState(false);
  const [editTitle, setEditTitle]   = useState("");
  const [editContent, setEditContent] = useState("");
  const [confirm, setConfirm] = useState(null); // { message, onConfirm }
  const bottomRef = useRef(null);

  const isAdmin  = profile?.is_admin;
  const isAuthor = thread?.author_id === user.id;
  const isLocked = thread?.locked;

  function startEdit() {
    if (!thread) return;
    setEditTitle(thread.title);
    setEditContent(thread.content);
    setEditing(true);
  }

  function handleSaveEdit(e) {
    e.preventDefault();
    if (!editTitle.trim() || !editContent.trim()) return;
    updateThread.mutate({ title: editTitle.trim(), content: editContent.trim() }, {
      onSuccess: () => setEditing(false),
    });
  }

  function handleReply(e) {
    e.preventDefault();
    setReplyError("");
    if (!replyText.trim()) return setReplyError("Reply cannot be empty.");
    createReply.mutate({ userId: user.id, content: replyText.trim() }, {
      onSuccess: () => {
        setReplyText("");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      },
      onError: (err) => setReplyError(err.message),
    });
  }

  function handleDeleteThread() {
    setConfirm({
      message: "Delete this thread and all its replies? This cannot be undone.",
      onConfirm: () => deleteThread.mutate(threadId, { onSuccess: onBack }),
    });
  }

  if (threadLoading) return <div className="forum-loading"><div className="forum-spinner" /></div>;
  if (!thread) return <div className="forum-empty"><p>Thread not found.</p></div>;

  return (
    <div className="forum-thread-view">
      {/* Thread header */}
      <div className="forum-thread-header">
        <button className="forum-back-btn" onClick={onBack}>← Back</button>
        <div className="forum-thread-header-badges">
          {thread.pinned && <span className="forum-badge forum-badge--pin">📌 Pinned</span>}
          {thread.locked && <span className="forum-badge forum-badge--lock">🔒 Locked</span>}
        </div>
        <div className="forum-admin-tools">
          {isAdmin && (
            <>
              <button className="forum-tool-btn" onClick={() => pinThread.mutate({ threadId, value: !thread.pinned })}>
                {thread.pinned ? "Unpin" : "Pin"}
              </button>
              <button className="forum-tool-btn" onClick={() => lockThread.mutate({ threadId, value: !thread.locked })}>
                {thread.locked ? "Unlock" : "Lock"}
              </button>
            </>
          )}
          {(isAdmin || isAuthor) && !editing && (
            <button className="forum-tool-btn" onClick={startEdit}>Edit</button>
          )}
          {(isAdmin || isAuthor) && (
            <button className="forum-tool-btn forum-tool-btn--danger" onClick={handleDeleteThread}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Original post */}
      <div className="forum-post forum-post--op">
        <div className="forum-post-aside">
          <Avatar profile={thread.profiles} />
          <span className="forum-post-author">{displayName(thread.profiles)}</span>
          <span className="forum-post-time">{timeAgo(thread.created_at)}</span>
          <span className="forum-post-badge forum-post-badge--op">OP</span>
        </div>
        <div className="forum-post-body">
          {editing ? (
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                className="forum-input"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                disabled={updateThread.isPending}
              />
              <textarea
                className="forum-textarea"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={6}
                disabled={updateThread.isPending}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="forum-submit-btn" type="submit" disabled={updateThread.isPending}>
                  {updateThread.isPending ? "Saving…" : "Save"}
                </button>
                <button type="button" className="forum-delete-btn" onClick={() => setEditing(false)} style={{ alignSelf: "center" }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="forum-post-title">{thread.title}</h2>
              <div className="forum-post-content">{thread.content}</div>
            </>
          )}
        </div>
      </div>

      {/* Replies */}
      {repliesLoading ? (
        <div className="forum-loading"><div className="forum-spinner" /></div>
      ) : (
        <div className="forum-replies">
          {replies.length > 0 && (
            <div className="forum-replies-count">{replies.length} {replies.length === 1 ? "reply" : "replies"}</div>
          )}
          {replies.map((reply, i) => {
            const canDelete = isAdmin || reply.author_id === user.id;
            return (
              <div key={reply.id} className="forum-post">
                <div className="forum-post-aside">
                  <Avatar profile={reply.profiles} />
                  <span className="forum-post-author">{displayName(reply.profiles)}</span>
                  <span className="forum-post-time">{timeAgo(reply.created_at)}</span>
                  <span className="forum-post-num">#{i + 1}</span>
                </div>
                <div className="forum-post-body">
                  <div className="forum-post-content">{reply.content}</div>
                  {canDelete && (
                    <button
                      className="forum-delete-btn"
                      onClick={() => setConfirm({
                        message: "Delete this reply? This cannot be undone.",
                        onConfirm: () => deleteReply.mutate(reply.id),
                      })}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Reply form */}
      {isLocked ? (
        <div className="forum-locked-msg">🔒 This thread is locked. No new replies.</div>
      ) : (
        <form className="forum-reply-form" onSubmit={handleReply}>
          <div className="forum-reply-form-inner">
            <Avatar profile={profile} size="sm" />
            <div className="forum-reply-input-wrap">
              <textarea
                className="forum-reply-textarea"
                placeholder="Write a reply…"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                disabled={createReply.isPending}
                rows={3}
              />
              {replyError && <div className="forum-reply-error">{replyError}</div>}
              <div className="forum-reply-actions">
                <button className="forum-reply-btn" type="submit" disabled={createReply.isPending || !replyText.trim()}>
                  {createReply.isPending ? "Posting…" : "Post Reply"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// ── Thread List ───────────────────────────────────────────────────────────────
function ThreadList({ category, user, profile, onSelectThread, onBack }) {
  const { data: threads = [], isLoading } = useThreads(category.id);
  const createThread = useCreateThread(category.id);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]     = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    setFormError("");
    if (!title.trim())   return setFormError("Title is required.");
    if (!content.trim()) return setFormError("Content is required.");
    createThread.mutate({ userId: user.id, title: title.trim(), content: content.trim() }, {
      onSuccess: (thread) => {
        setTitle(""); setContent(""); setShowForm(false);
        onSelectThread(thread.id);
      },
      onError: (err) => setFormError(err.message),
    });
  }

  return (
    <div className="forum-thread-list">
      {/* Header */}
      <div className="forum-list-header">
        <div className="forum-list-header-left">
          <button className="forum-back-btn" onClick={onBack}>← Forums</button>
          <span className="forum-list-category-icon">{category.icon}</span>
          <h2 className="forum-list-title">{category.name}</h2>
        </div>
        <button className="forum-new-btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? "Cancel" : "+ New Thread"}
        </button>
      </div>

      {/* New thread form */}
      {showForm && (
        <form className="forum-new-thread-form" onSubmit={handleCreate}>
          <input
            className="forum-input"
            placeholder="Thread title…"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={createThread.isPending}
          />
          <textarea
            className="forum-textarea"
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
            disabled={createThread.isPending}
            rows={5}
          />
          {formError && <div className="forum-form-error">{formError}</div>}
          <div className="forum-form-actions">
            <button className="forum-submit-btn" type="submit" disabled={createThread.isPending}>
              {createThread.isPending ? "Posting…" : "Post Thread"}
            </button>
          </div>
        </form>
      )}

      {/* Thread rows */}
      {isLoading ? (
        <div className="forum-loading"><div className="forum-spinner" /></div>
      ) : threads.length === 0 ? (
        <div className="forum-empty">
          <div className="forum-empty-icon">💬</div>
          <h3>No threads yet</h3>
          <p>Be the first to start a discussion.</p>
        </div>
      ) : (
        <div className="forum-rows">
          {threads.map(thread => {
            const replyCount = thread.forum_replies?.[0]?.count ?? 0;
            return (
              <div
                key={thread.id}
                className={`forum-row${thread.pinned ? " forum-row--pinned" : ""}`}
                onClick={() => onSelectThread(thread.id)}
              >
                <div className="forum-row-left">
                  <Avatar profile={thread.profiles} size="sm" />
                </div>
                <div className="forum-row-mid">
                  <div className="forum-row-title">
                    {thread.pinned && <span className="forum-badge forum-badge--pin">📌</span>}
                    {thread.locked && <span className="forum-badge forum-badge--lock">🔒</span>}
                    {thread.title}
                  </div>
                  <div className="forum-row-meta">
                    <span>{displayName(thread.profiles)}</span>
                    <span className="forum-dot">·</span>
                    <span>{timeAgo(thread.updated_at)}</span>
                  </div>
                </div>
                <div className="forum-row-right">
                  <div className="forum-row-stat">
                    <span className="forum-row-stat-val">{replyCount}</span>
                    <span className="forum-row-stat-label">replies</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Category List ─────────────────────────────────────────────────────────────
function CategoryList({ onSelectCategory, onBack }) {
  const { data: categories = [], isLoading } = useCategories();

  const totalThreads = categories.reduce((sum, c) => sum + (c.forum_threads?.[0]?.count ?? 0), 0);

  return (
    <div className="forum-categories">
      {/* Hero */}
      <div className="forum-hero">
        <div className="forum-hero-glow forum-hero-glow--1" />
        <div className="forum-hero-glow forum-hero-glow--2" />
        <div className="forum-hero-inner">
          <button className="forum-hero-back" onClick={onBack}>← Back to App</button>
          <div className="forum-hero-badge">✦ Community</div>
          <h1 className="forum-hero-title">Community Forum</h1>
          <p className="forum-hero-sub">Connect, ask questions and grow together</p>
          {totalThreads > 0 && (
            <p className="forum-hero-count">{totalThreads} {totalThreads === 1 ? "thread" : "threads"} across {categories.length} categories</p>
          )}
        </div>
      </div>

      {/* Category cards */}
      <div className="forum-cat-grid">
        {isLoading ? (
          <div className="forum-loading"><div className="forum-spinner" /></div>
        ) : categories.map(cat => {
          const threadCount = cat.forum_threads?.[0]?.count ?? 0;
          return (
            <div key={cat.id} className="forum-cat-card" onClick={() => onSelectCategory(cat)}>
              <div className="forum-cat-icon">{cat.icon}</div>
              <div className="forum-cat-body">
                <div className="forum-cat-name">{cat.name}</div>
                <div className="forum-cat-desc">{cat.description}</div>
              </div>
              <div className="forum-cat-stats">
                <span className="forum-cat-stat">{threadCount} threads</span>
                <span className="forum-cat-arrow">›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ForumPage ────────────────────────────────────────────────────────────
export default function ForumPage({ user, profile, onBack }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeThreadId, setActiveThreadId] = useState(null);

  if (activeThreadId) {
    return (
      <ThreadView
        threadId={activeThreadId}
        user={user}
        profile={profile}
        categoryId={activeCategory?.id}
        onBack={() => setActiveThreadId(null)}
      />
    );
  }

  if (activeCategory) {
    return (
      <ThreadList
        category={activeCategory}
        user={user}
        profile={profile}
        onSelectThread={setActiveThreadId}
        onBack={() => setActiveCategory(null)}
      />
    );
  }

  return <CategoryList onSelectCategory={setActiveCategory} onBack={onBack} />;
}
