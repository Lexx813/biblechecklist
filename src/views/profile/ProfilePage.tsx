import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../../components/EmojiPickerPopup";
import CustomSelect from "../../components/CustomSelect";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import { useMeta } from "../../hooks/useMeta";
import { BOOKS } from "../../data/books";
import { useFullProfile, useUpdateProfile, useUploadAvatar } from "../../hooks/useAdmin";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "../../hooks/useNotes";
import { useProgress, useReadingStreak } from "../../hooks/useProgress";
import { useQuizProgress } from "../../hooks/useQuiz";
import { useFollowCounts, useIsFollowing, useToggleFollow, useFollowers, useFollowing } from "../../hooks/useFollows";
import { useUserForumStats } from "../../hooks/useForum";
import { useUserPosts, useCreatePost, useDeletePost } from "../../hooks/usePosts";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import { useSubscription } from "../../hooks/useSubscription";
import { useBadges } from "../../hooks/useBadges";
import { BADGES } from "../../data/badges";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "../../styles/profile.css";
import "../../styles/social.css";
import "../../styles/gamification.css";
import { formatDate } from "../../utils/formatters";
import ReferralPanel from "../../components/ReferralPanel";
import { FriendRequestButton } from "../../components/FriendRequestButton";
import { friendsApi } from "../../api/friends";
import ProfileFriendsTab from "./ProfileFriendsTab";
import { useBlocks, useMyBlocks, useBlockUser, useUnblockUser } from "../../hooks/useBlocks";

const TOTAL_CHAPTERS = BOOKS.reduce((s, b) => s + b.chapters, 0);

const LEVEL_BADGES = [
  { level: 1,  emoji: "📖" }, { level: 2,  emoji: "📚" },
  { level: 3,  emoji: "🌱" }, { level: 4,  emoji: "👨‍👩‍👦" },
  { level: 5,  emoji: "🏺" }, { level: 6,  emoji: "⚔️" },
  { level: 7,  emoji: "🎵" }, { level: 8,  emoji: "📯" },
  { level: 9,  emoji: "🕊️" }, { level: 10, emoji: "🌍" },
  { level: 11, emoji: "🔮" }, { level: 12, emoji: "👑" },
];

const OT_COUNT = 39;

function Initials({ name, email }) {
  const str = name || email || "?";
  return str[0].toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────
function Avatar({ profile, userId, editable }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar(userId);
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    upload.mutate(file, { onSettled: () => setPreview(null) });
  }

  const src = preview ?? profile?.avatar_url;

  if (!editable) {
    return (
      <div className="pf-avatar-wrap pf-avatar-wrap--static">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="avatar" className="pf-avatar-img" width={80} height={80} loading="lazy" />
          : <span className="pf-avatar-initials"><Initials name={profile?.display_name} email={profile?.email} /></span>
        }
      </div>
    );
  }

  return (
    <div
      className="pf-avatar-wrap"
      onClick={() => fileRef.current?.click()}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileRef.current?.click(); } }}
      role="button"
      tabIndex={0}
      title="Change photo"
      aria-label="Change profile photo"
    >
      {src
        ? <img src={src} alt="avatar" className="pf-avatar-img" width={80} height={80} loading="lazy" />
        : <span className="pf-avatar-initials"><Initials name={profile?.display_name} email={profile?.email} /></span>
      }
      <div className="pf-avatar-overlay">
        {upload.isPending
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        }
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

// ── Display name ──────────────────────────────────────────
function DisplayName({ profile, userId, editable }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const update = useUpdateProfile(userId);
  const { t } = useTranslation();

  function startEdit() {
    setValue(profile?.display_name || "");
    setEditing(true);
  }

  function save() {
    if (value.trim()) update.mutate({ display_name: value.trim() });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="pf-name-edit">
        <input
          id="pf-name-input"
          name="display_name"
          className="pf-name-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          maxLength={40}
          aria-label="Display name"
        />
        <button className="pf-name-save" onClick={save}>{t("common.save")}</button>
        <button className="pf-name-cancel" onClick={() => setEditing(false)} aria-label="Close">✕</button>
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="pf-name-row">
        <h2 className="pf-name">{profile?.display_name || profile?.email?.split("@")[0]}</h2>
      </div>
    );
  }

  return (
    <div className="pf-name-row">
      <h2 className="pf-name">{profile?.display_name || profile?.email?.split("@")[0]}</h2>
      <button className="pf-edit-icon" onClick={startEdit} title={t("common.edit")} aria-label="Edit profile"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
    </div>
  );
}

// ── Add / Edit note form ──────────────────────────────────
function NoteForm({ userId, initial = null, onDone }: { userId: any; initial?: any; onDone: any }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] ?? "en";
  const [bookIndex, setBookIndex] = useState(initial?.book_index ?? 0);
  const [chapter, setChapter] = useState(initial?.chapter ?? 1);
  const [verse, setVerse] = useState(initial?.verse ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [showNoteEmoji, setShowNoteEmoji] = useState(false);
  const noteRef = useRef(null);

  const createNote = useCreateNote(userId);
  const updateNote = useUpdateNote(userId);
  const busy = createNote.isPending || updateNote.isPending;
  const maxChapter = BOOKS[bookIndex]?.chapters ?? 1;

  const insertNoteEmoji = useCallback((em) => {
    const next = insertEmojiAtCursor(noteRef.current, content, em);
    setContent(next);
    setShowNoteEmoji(false);
    requestAnimationFrame(() => {
      const el = noteRef.current;
      if (!el) return;
      const pos = (el.selectionStart ?? content.length) + em.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }, [content]);

  function handleBookChange(val) {
    setBookIndex(Number(val));
    setChapter(1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const payload = { book_index: bookIndex, chapter, verse: verse.trim() || null, content: content.trim(), lang };
    if (initial) {
      updateNote.mutate({ noteId: initial.id, updates: payload }, { onSuccess: onDone });
    } else {
      createNote.mutate(payload, { onSuccess: onDone });
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="note-form-row">
        <div className="note-form-field">
          <label className="note-form-label">{t("profile.bookLabel")}</label>
          <CustomSelect
            value={bookIndex}
            onChange={handleBookChange}
            options={BOOKS.map((b, i) => ({ value: i, label: t(`bookNames.${i}`, b.name) }))}
            searchable
          />
        </div>
        <div className="note-form-field note-form-field--sm">
          <label className="note-form-label">{t("profile.chapterLabel")}</label>
          <CustomSelect
            value={chapter}
            onChange={setChapter}
            options={Array.from({ length: maxChapter }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
            className="cs-wrap--sm"
          />
        </div>
        <div className="note-form-field note-form-field--sm">
          <label htmlFor="note-verse" className="note-form-label">{t("profile.verseLabel")} <span className="note-form-optional">{t("profile.verseOptional")}</span></label>
          <input
            id="note-verse"
            name="verse"
            className="note-form-select"
            type="text"
            placeholder="—"
            value={verse}
            onChange={e => setVerse(e.target.value)}
          />
        </div>
      </div>
      <div style={{ position: "relative" }}>
        <textarea
          ref={noteRef}
          id="note-content"
          name="content"
          className="note-form-textarea"
          placeholder={t("profile.notePlaceholder")}
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          required
        />
        <button type="button" className="textarea-emoji-btn" onClick={() => setShowNoteEmoji(v => !v)} title="Emoji">😊</button>
        {showNoteEmoji && <EmojiPickerPopup onSelect={insertNoteEmoji} onClose={() => setShowNoteEmoji(false)} align="right" />}
      </div>
      <div className="note-form-actions">
        <button type="button" className="note-form-cancel" onClick={onDone}>{t("common.cancel")}</button>
        <button type="submit" className="note-form-submit" disabled={busy || !content.trim()}>
          {busy ? t("common.saving") : initial ? t("profile.updateNote") : t("profile.saveNote")}
        </button>
      </div>
    </form>
  );
}

// ── Note card ─────────────────────────────────────────────
function NoteCard({ note, userId }) {
  const [editing, setEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const deleteNote = useDeleteNote(userId);
  const { t } = useTranslation();
  const isOT = note.book_index < OT_COUNT;
  const bookName = t(`bookNames.${note.book_index}`, BOOKS[note.book_index]?.name);

  if (editing) {
    return (
      <div className="note-card note-card--editing">
        <NoteForm userId={userId} initial={note} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={`note-card ${isOT ? "note-card--ot" : "note-card--nt"}`}>
      <div className="note-card-header">
        <div className="note-card-ref">
          <span className="note-book-badge">{bookName}</span>
          <span className="note-ref-text">
            {t("profile.chAbbr")} {note.chapter}{note.verse ? ` · ${t("profile.verseAbbr")} ${note.verse}` : ""}
          </span>
        </div>
        <div className="note-card-actions">
          <button className="note-action-btn" onClick={() => setEditing(true)} title={t("common.edit")}>✏️</button>
          <button
            className="note-action-btn note-action-btn--delete"
            onClick={() => setShowConfirm(true)}
            title={t("common.delete")}
          >✕</button>
        </div>
      </div>
      <p className="note-content">{note.content}</p>
      <div className="note-date">{formatDate(note.created_at)}</div>
      {showConfirm && (
        <ConfirmModal
          message={t("profile.deleteNoteConfirm")}
          onConfirm={() => { deleteNote.mutate(note.id); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// ── Info tooltip ──────────────────────────────────────────
function InfoTip({ text }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  function handleMouseEnter() {
    const rect = iconRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setVisible(true);
  }

  return (
    <span
      ref={iconRef}
      className="pf-infotip"
      aria-label={text}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
    >
      ℹ
      {visible && createPortal(
        <span className="pf-infotip-bubble" style={{ top: pos.top, left: pos.left }}>
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

// ── Posts section ─────────────────────────────────────────
const MAX_POST = 500;

function PostsSection({ profileId, isOwner, t }) {
  const { data: posts = [], isLoading } = useUserPosts(profileId);
  const createPost = useCreatePost(profileId);
  const deletePost = useDeletePost(profileId);
  const [draft, setDraft] = useState("");
  const [showPostEmoji, setShowPostEmoji] = useState(false);
  const postRef = useRef(null);

  const insertPostEmoji = useCallback((em) => {
    const next = insertEmojiAtCursor(postRef.current, draft, em).slice(0, MAX_POST);
    setDraft(next);
    setShowPostEmoji(false);
    requestAnimationFrame(() => {
      const el = postRef.current;
      if (!el) return;
      const pos = Math.min((el.selectionStart ?? draft.length) + em.length, MAX_POST);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }, [draft]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > MAX_POST) return;
    createPost.mutate(trimmed, { onSuccess: () => setDraft("") });
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="pf-section">
      <div className="pf-section-header">
        <h2>💬 {t("posts.sectionTitle")} <InfoTip text={t("profile.postsTip")} /></h2>
      </div>

      {isOwner && (
        <form className="post-composer" onSubmit={handleSubmit}>
          <div style={{ position: "relative" }}>
            <textarea
              ref={postRef}
              id="post-composer"
              name="content"
              className="post-composer-input"
              placeholder={t("posts.placeholder")}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={MAX_POST}
              rows={3}
            />
            <button type="button" className="textarea-emoji-btn" onClick={() => setShowPostEmoji(v => !v)} title="Emoji">😊</button>
            {showPostEmoji && <EmojiPickerPopup onSelect={insertPostEmoji} onClose={() => setShowPostEmoji(false)} align="right" />}
          </div>
          <div className="post-composer-footer">
            <span className={`post-composer-count${draft.length > MAX_POST - 50 ? " post-composer-count--warn" : ""}`}>
              {draft.length}/{MAX_POST}
            </span>
            <button
              className="post-composer-btn"
              type="submit"
              disabled={!draft.trim() || createPost.isPending}
            >
              {createPost.isPending ? t("common.saving") : t("posts.share")}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="post-list">
          {[0, 1, 2].map(i => (
            <div key={i} className="post-card" style={{ pointerEvents: "none" }}>
              <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 13, width: "80%", borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="pf-empty">{isOwner ? t("posts.emptyOwner") : t("posts.emptyOther")}</p>
      ) : (
        <div className="post-list">
          {posts.map(post => (
            <div key={post.id} className="post-card">
              <p className="post-card-content">{post.content}</p>
              <div className="post-card-footer">
                <span className="post-card-date">{formatDate(post.created_at)}</span>
                {isOwner && (
                  <button
                    className="post-card-delete"
                    onClick={() => deletePost.mutate(post.id)}
                    disabled={deletePost.isPending}
                    title={t("common.delete")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Message button ─────────────────────────────────────────
function MessageButton({ targetId, otherDisplayName, otherAvatarUrl, navigate, isPremium, onUpgrade }) {
  const getOrCreate = useGetOrCreateDM();
  async function handleClick() {
    if (!isPremium) {
      const canMessage = await friendsApi.canMessageUser(targetId, isPremium);
      if (!canMessage) { onUpgrade?.(); return; }
    }
    getOrCreate.mutate(targetId, {
      onSuccess: (conversationId) => navigate("messages", {
        conversationId,
        otherDisplayName,
        otherAvatarUrl,
      }),
    });
  }
  return (
    <button
      className={`pf-msg-btn${!isPremium ? " pf-msg-btn--locked" : ""}`}
      onClick={handleClick}
      disabled={getOrCreate.isPending}
    >
      {getOrCreate.isPending ? <span className="btn-spin" /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pf-msg-icon"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
      Message{!isPremium && <span className="msg-btn-pro-badge">✦</span>}
    </button>
  );
}

// ── Followers / Following modal list ──────────────────────
function FollowListModal({ targetId, mode, currentUserId, onClose, navigate, t, isPremium, onUpgrade }) {
  const { data: followers = [] } = useFollowers(mode === "followers" ? targetId : null);
  const { data: following = [] } = useFollowing(mode === "following" ? targetId : null);
  const list = (mode === "followers" ? followers : following) as any[];
  const getOrCreate = useGetOrCreateDM();

  return createPortal(
    <div className="pf-follow-modal-backdrop" onClick={onClose}>
      <div className="pf-follow-modal" role="dialog" aria-modal="true" aria-label="Followers and following" onClick={e => e.stopPropagation()}>
        <div className="pf-follow-modal-header">
          <span>{mode === "followers" ? t("follow.followers") : t("follow.following")}</span>
          <button className="pf-follow-modal-close" onClick={onClose} aria-label="✕ Close">✕</button>
        </div>
        <div className="pf-follow-modal-list">
          {list.length === 0 && (
            <p className="pf-follow-modal-empty">
              {mode === "followers" ? t("follow.noFollowers", "No followers yet.") : t("follow.noFollowing", "Not following anyone yet.")}
            </p>
          )}
          {list.map(u => (
            <div key={u.id} className="pf-follow-modal-row">
              <button className="pf-follow-modal-avatar" onClick={() => { onClose(); navigate("publicProfile", { userId: u.id }); }}>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={u.display_name || "User"} width={38} height={38} />
                  : <span className="pf-follow-modal-initial">{(u.display_name || "?")[0].toUpperCase()}</span>
                }
              </button>
              <button className="pf-follow-modal-name" onClick={() => { onClose(); navigate("publicProfile", { userId: u.id }); }}>
                {u.display_name || t("profile.anonymous", "Anonymous")}
              </button>
              {u.id !== currentUserId && (
                <button
                  className={`pf-follow-modal-msg${!isPremium ? " pf-follow-modal-msg--locked" : ""}`}
                  disabled={getOrCreate.isPending}
                  onClick={isPremium
                    ? () => getOrCreate.mutate(u.id, {
                        onSuccess: (cid) => { onClose(); navigate("messages", { conversationId: cid, otherDisplayName: u.display_name, otherAvatarUrl: u.avatar_url }); },
                      })
                    : () => { onClose(); onUpgrade?.(); }
                  }
                >
                  Message{!isPremium && <span className="msg-btn-pro-badge">✦</span>}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Follow button + counts ─────────────────────────────────
function FollowSection({ currentUserId, targetId, t, extraAction, navigate, isPremium, onUpgrade }) {
  const { data: counts = { followers: 0, following: 0 } } = useFollowCounts(targetId);
  const { data: isFollowing = false } = useIsFollowing(currentUserId, targetId);
  const toggle = useToggleFollow(currentUserId, targetId);
  const [listModal, setListModal] = useState(null); // "followers" | "following" | null

  return (
    <div className="pf-follow-section">
      <div className="pf-follow-counts">
        <button className="pf-follow-count-item pf-follow-count-btn" onClick={() => setListModal("followers")}>
          <span className="pf-follow-count-num">{counts.followers}</span>
          <span className="pf-follow-count-label">{t("follow.followers")}</span>
        </button>
        <div className="pf-follow-count-divider" />
        <button className="pf-follow-count-item pf-follow-count-btn" onClick={() => setListModal("following")}>
          <span className="pf-follow-count-num">{counts.following}</span>
          <span className="pf-follow-count-label">{t("follow.following")}</span>
        </button>
      </div>
      {currentUserId !== targetId && (
        <div className="pf-action-btns">
          <button
            className={`pf-follow-btn ${isFollowing ? "pf-follow-btn--following" : "pf-follow-btn--follow"}`}
            onClick={() => toggle.mutate()}
            disabled={toggle.isPending}
          >
            {isFollowing ? t("follow.unfollow") : t("follow.follow")}
          </button>
          {extraAction}
        </div>
      )}
      {listModal && (
        <FollowListModal
          targetId={targetId}
          mode={listModal}
          currentUserId={currentUserId}
          onClose={() => setListModal(null)}
          navigate={navigate}
          t={t}
          isPremium={isPremium}
          onUpgrade={onUpgrade}
        />
      )}
    </div>
  );
}

// ── About Me ──────────────────────────────────────────────
const BIO_MAX = 300;
function AboutMe({ profile, userId, isOwner, t }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bioRef = useRef(null);
  const update = useUpdateProfile(userId);

  const insertEmoji = useCallback((em) => {
    const next = insertEmojiAtCursor(bioRef.current, value, em).slice(0, BIO_MAX);
    setValue(next);
    setShowEmoji(false);
    requestAnimationFrame(() => {
      const el = bioRef.current;
      if (!el) return;
      const pos = Math.min((el.selectionStart ?? value.length) + em.length, BIO_MAX);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }, [value]);

  function startEdit() {
    setValue(profile?.bio ?? "");
    setEditing(true);
  }

  function save() {
    update.mutate({ bio: value.trim() || null }, { onSuccess: () => setEditing(false) });
  }

  return (
    <div className="pf-section pf-about">
      <div className="pf-section-header">
        <h2>{t("profile.aboutTitle")}</h2>
        {isOwner && !editing && (
          <button className="pf-add-note-btn" onClick={startEdit}>
            {profile?.bio ? t("common.edit") : t("profile.aboutAdd")}
          </button>
        )}
      </div>
      {editing ? (
        <div className="pf-about-edit">
          <div style={{ position: "relative" }}>
            <textarea
              ref={bioRef}
              id="pf-about-textarea"
              name="bio"
              className="pf-about-textarea"
              value={value}
              onChange={e => setValue(e.target.value)}
              maxLength={BIO_MAX}
              rows={4}
              placeholder={t("profile.aboutPlaceholder")}
              autoFocus
            />
            <button type="button" className="textarea-emoji-btn" onClick={() => setShowEmoji(v => !v)} title="Emoji">😊</button>
            {showEmoji && <EmojiPickerPopup onSelect={insertEmoji} onClose={() => setShowEmoji(false)} align="right" />}
          </div>
          <div className="pf-about-footer">
            <span className={`pf-about-count${value.length > BIO_MAX - 30 ? " pf-about-count--warn" : ""}`}>
              {value.length}/{BIO_MAX}
            </span>
            <div className="pf-about-actions">
              <button className="note-form-cancel" onClick={() => setEditing(false)}>{t("common.cancel")}</button>
              <button className="note-form-submit" onClick={save} disabled={update.isPending}>
                {update.isPending ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      ) : profile?.bio ? (
        <p className="pf-about-text">{profile.bio}</p>
      ) : (
        <p className="pf-about-empty">{t("profile.aboutEmpty")}</p>
      )}
    </div>
  );
}

// ── Reading Goal ───────────────────────────────────────────
const TOTAL_CH = 1189;
function ReadingGoal({ profile, chaptersRead, totalDays, isOwner, t }) {
  const update = useUpdateProfile(profile?.id);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(undefined);

  const goalDate = profile?.reading_goal_date ?? null;

  // Projected completion
  const projection = useMemo(() => {
    if (!chaptersRead || !totalDays) return null;
    const pace = chaptersRead / totalDays;
    const remaining = TOTAL_CH - chaptersRead;
    if (remaining <= 0) return null;
    const daysLeft = Math.ceil(remaining / pace);
    const projected = new Date();
    projected.setDate(projected.getDate() + daysLeft);
    return { projected, daysLeft, pace: pace.toFixed(1) };
  }, [chaptersRead, totalDays]);

  function openEditor() {
    setSelected(goalDate ? new Date(goalDate + "T00:00:00") : undefined);
    setEditing(true);
  }

  function saveGoal() {
    let dateStr = null;
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, "0");
      const d = String(selected.getDate()).padStart(2, "0");
      dateStr = `${y}-${m}-${d}`;
    }
    update.mutate({ reading_goal_date: dateStr });
    setEditing(false);
  }

  const onTrack = goalDate && projection
    ? new Date(projection.projected) <= new Date(goalDate)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="pf-goal">
      <div className="pf-goal-row">
        {goalDate ? (
          <>
            <span className="pf-goal-chip">
              🎯 {t("profile.goalTarget")}: <strong>{new Date(goalDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
            </span>
            {onTrack !== null && (
              <span className={`pf-goal-status ${onTrack ? "pf-goal-status--good" : "pf-goal-status--behind"}`}>
                {onTrack ? `✓ ${t("profile.goalOnTrack")}` : `⚠ ${t("profile.goalBehind")}`}
              </span>
            )}
          </>
        ) : isOwner ? (
          <span className="pf-goal-empty">{t("profile.goalNotSet")}</span>
        ) : null}
        {isOwner && !editing && (
          <button className={goalDate ? "pf-goal-edit-btn" : "pf-goal-set-btn"} onClick={openEditor}>
            {goalDate ? t("common.edit") : t("profile.goalSet")}
          </button>
        )}
      </div>
      {editing && (
        <div className="pf-goal-form">
          <div className="pf-goal-calendar-wrap">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={setSelected}
              disabled={{ before: today }}
              showOutsideDays
              className="pf-goal-calendar"
            />
          </div>
          <div className="pf-goal-form-actions">
            <button className="pf-goal-save-btn" onClick={saveGoal} disabled={!selected}>{t("common.save")}</button>
            {goalDate && (
              <button className="pf-goal-remove-btn" onClick={() => { update.mutate({ reading_goal_date: null }); setEditing(false); }}>
                {t("profile.goalRemove")}
              </button>
            )}
            <button className="pf-goal-cancel-btn" onClick={() => setEditing(false)}>{t("common.cancel")}</button>
          </div>
        </div>
      )}
      {projection && (
        <div className="pf-goal-projection">
          📈 {t("profile.goalPace", { pace: projection.pace })} · {t("profile.goalProjected")}: <strong>{projection.projected.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
        </div>
      )}
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────
export default function ProfilePage({ user, viewedUserId, isOwner = true, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade, defaultTab = "overview" }) {
  const profileId = viewedUserId ?? user.id;
  const { isPremium } = useSubscription(user.id);
  const { data: blockedSet = new Set<string>() } = useBlocks(user.id);
  const { data: myBlocks = [] } = useMyBlocks(user.id);
  const blockUser = useBlockUser();
  const unblockUser = useUnblockUser();
  const { data: profile, isLoading: profileLoading } = useFullProfile(profileId);
  const { data: notes = [], isLoading: notesLoading } = useNotes(isOwner ? profileId : null);
  const { data: readingProgress = {} } = useProgress(profileId);
  const { data: quizProgress = [] } = useQuizProgress(profileId);
  const { data: streak = { current_streak: 0, longest_streak: 0, total_days: 0 } } = useReadingStreak(profileId);
  const { data: forumStats = { threads: 0, replies: 0 } } = useUserForumStats(profileId);
  const { t } = useTranslation();
  useMeta({ title: profile?.display_name ? `${profile.display_name}'s Profile` : "Profile" });

  // Bible reading stats
  const { chaptersRead, booksComplete, pct } = useMemo(() => {
    let chaptersRead = 0, booksComplete = 0;
    BOOKS.forEach((b, bi) => {
      const done = Object.values(readingProgress[bi] || {}).filter(Boolean).length;
      chaptersRead += done;
      if (done === b.chapters) booksComplete++;
    });
    const pct = TOTAL_CHAPTERS > 0 ? Math.round((chaptersRead / TOTAL_CHAPTERS) * 100) : 0;
    return { chaptersRead, booksComplete, pct };
  }, [readingProgress]);

  // Quiz stats
  const quizProgressMap = useMemo(
    () => Object.fromEntries(quizProgress.map(p => [p.level, p])),
    [quizProgress]
  );
  const levelsCompleted = quizProgress.filter(p => p.badge_earned).length;
  const highestUnlocked = quizProgress.filter(p => p.unlocked).reduce((max, p) => Math.max(max, p.level), 0);

  // Milestone badges
  const { data: earnedBadges = [] } = useBadges(user?.id);
  const earnedKeys = new Set(earnedBadges.map((b) => b.badge_key));
  const earnedMap = Object.fromEntries(earnedBadges.map((b) => [b.badge_key, b.earned_at]));
  const earnedCount = earnedKeys.size;

  useEffect(() => {
    const name = profile?.display_name || profile?.email?.split("@")[0];
    if (name) document.title = `${name} — JW Study`;
    return () => { document.title = "JW Study"; };
  }, [profile?.display_name, profile?.email]);

  const isViewedUserBlocked = !isOwner && blockedSet.has(profileId);

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterBook, setFilterBook] = useState("all");
  const [search, setSearch] = useState("");

  const booksWithNotes = useMemo(
    () => [...new Set(notes.map(n => n.book_index))].sort((a, b) => a - b),
    [notes]
  );

  const filtered = useMemo(() => notes.filter(n => {
    if (filterBook !== "all" && n.book_index !== Number(filterBook)) return false;
    if (search && !n.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [notes, filterBook, search]);

  if (profileLoading) {
    return (
      <div className="pf-wrap">
        <div className="pf-content">
          <div className="pf-card">
            <div className="pf-card-banner" />
            <div className="pf-card-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div className="skeleton" style={{ width: 72, height: 72, borderRadius: "50%" }} />
              <div className="skeleton" style={{ height: 18, width: 140, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 13, width: 100, borderRadius: 6 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      <div className="pf-content">

        {/* Profile card */}
        <div className="pf-card">
          <div className="pf-card-banner">
            {isOwner && (
              <button className="pf-settings-cog" onClick={() => navigate("settings")} aria-label={t("settings.openSettings")} title={t("settings.openSettings")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            )}
          </div>
          <div className="pf-card-body">
            <Avatar profile={profile} userId={profileId} editable={isOwner} />
            <DisplayName profile={profile} userId={profileId} editable={isOwner} />
            {isOwner && <p className="pf-email">{user.email}</p>}
            <p className="pf-since">{t("profile.memberSince", { date: profile ? formatDate(profile.created_at) : "—" })}</p>
            <FollowSection
              currentUserId={user.id}
              targetId={profileId}
              t={t}
              navigate={navigate}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
              extraAction={!isOwner ? (
                <>
                  <FriendRequestButton
                    currentUserId={user.id}
                    targetId={viewedUserId ?? user.id}
                  />
                  <MessageButton
                    targetId={profileId}
                    otherDisplayName={profile?.display_name || profile?.email?.split("@")[0] || "User"}
                    otherAvatarUrl={profile?.avatar_url ?? null}
                    navigate={navigate}
                    isPremium={isPremium}
                    onUpgrade={onUpgrade}
                  />
                  <button
                    className="pf-block-btn"
                    onClick={() => {
                      if (blockedSet.has(profileId)) {
                        unblockUser.mutate(profileId);
                      } else {
                        blockUser.mutate(profileId);
                      }
                    }}
                    disabled={blockUser.isPending || unblockUser.isPending}
                  >
                    {blockedSet.has(profileId) ? "Unblock" : "Block"}
                  </button>
                </>
              ) : null}
            />
            {isOwner && (
              <div className="pf-stats-row">
                <div className="pf-stat"><strong>{notes.length}</strong> {t("profile.notesCount", { count: notes.length }).split(" ")[1]}</div>
                <div className="pf-stat-divider" />
                <div className="pf-stat"><strong>{booksWithNotes.length}</strong> {t("profile.booksAnnotated", { count: booksWithNotes.length }).replace(/^\d+ /, "")}</div>
              </div>
            )}
          </div>
        </div>

        {isViewedUserBlocked && (
          <div className="pf-blocked-banner">
            {myBlocks.some(b => b.id === profileId)
              ? "You've blocked this user."
              : "This user has blocked you."}
          </div>
        )}

        {/* Tab bar — owner only */}
        {isOwner && (
          <div className="pf-tabs">
            <button className={`pf-tab-btn${activeTab === "overview" ? " pf-tab-btn--active" : ""}`} onClick={() => setActiveTab("overview")}>Overview</button>
            <button className={`pf-tab-btn${activeTab === "friends" ? " pf-tab-btn--active" : ""}`} onClick={() => setActiveTab("friends")}>Friends</button>
            <button className={`pf-tab-btn${activeTab === "notes" ? " pf-tab-btn--active" : ""}`} onClick={() => setActiveTab("notes")}>Notes</button>
          </div>
        )}

        {/* Friends tab */}
        {isOwner && activeTab === "friends" && (
          <ProfileFriendsTab user={user} navigate={navigate} isPremium={isPremium} onUpgrade={onUpgrade} />
        )}

        {/* Overview tab content */}
        {(!isOwner || activeTab === "overview") && !isViewedUserBlocked && (
          <>
        {/* About Me */}
        {(isOwner || profile?.bio) && (
          <AboutMe profile={profile} userId={profileId} isOwner={isOwner} t={t} />
        )}

        {/* Bible Reading Progress */}
        <div className="pf-section pf-section--stats">
          <div className="pf-section-header">
            <h2><span className="pf-section-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></span>{t("profile.bibleProgress")}</h2>
          </div>
          <div className="pf-reading-stats">
            <div className="pf-reading-bar-wrap">
              <div className="pf-reading-bar">
                <div className="pf-reading-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="pf-reading-pct">{pct}%</span>
            </div>
            <div className="pf-reading-meta">
              <span><strong>{chaptersRead.toLocaleString()}</strong> / {TOTAL_CHAPTERS.toLocaleString()} {t("profile.chapters")}</span>
              <span className="pf-dot">·</span>
              <span><strong>{booksComplete}</strong> / 66 {t("profile.booksComplete")}</span>
            </div>
          </div>
          <ReadingGoal
            profile={profile}
            chaptersRead={chaptersRead}
            totalDays={streak.total_days}
            isOwner={isOwner}
            t={t}
          />
        </div>

        {/* Reading Streak */}
        <div className="pf-section pf-section--stats">
          <div className="pf-section-header">
            <h2><span className="pf-section-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg></span>{t("profile.readingStreak")}</h2>
          </div>
          <div className="pf-streak-row">
            <div className="pf-streak-card pf-streak-card--primary">
              <span className="pf-streak-val">{streak.current_streak}</span>
              <span className="pf-streak-label">{t("profile.currentStreak")}</span>
              <div className="pf-streak-bar"><div className="pf-streak-bar-fill" style={{ width: streak.longest_streak > 0 ? `${Math.min(streak.current_streak / streak.longest_streak * 100, 100)}%` : "100%" }} /></div>
            </div>
            <div className="pf-streak-card">
              <span className="pf-streak-val">{streak.longest_streak}</span>
              <span className="pf-streak-label">{t("profile.longestStreak")}</span>
              <div className="pf-streak-bar"><div className="pf-streak-bar-fill" style={{ width: "100%" }} /></div>
            </div>
            <div className="pf-streak-card">
              <span className="pf-streak-val">{streak.total_days}</span>
              <span className="pf-streak-label">{t("profile.totalDays")}</span>
            </div>
          </div>
        </div>

        {/* Forum Stats */}
        {(forumStats.threads > 0 || forumStats.replies > 0) && (
          <div className="pf-section pf-section--stats">
            <div className="pf-section-header">
              <h2><span className="pf-section-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>{t("profile.forumActivity")}</h2>
            </div>
            <div className="pf-streak-row">
              <div className="pf-streak-card">
                <span className="pf-streak-val">{Number(forumStats.threads).toLocaleString()}</span>
                <span className="pf-streak-label">{t("profile.forumThreads")}</span>
              </div>
              <div className="pf-streak-card">
                <span className="pf-streak-val">{Number(forumStats.replies).toLocaleString()}</span>
                <span className="pf-streak-label">{t("profile.forumReplies")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Progress */}
        <div className="pf-section pf-section--stats">
          <div className="pf-section-header">
            <h2><span className="pf-section-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="8 17 8 21"/><polyline points="16 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M6 21h12"/><path d="M8 17h8a4 4 0 0 0 4-4V5H4v8a4 4 0 0 0 4 4z"/><path d="M4 5H2"/><path d="M20 5h2"/></svg></span>{t("profile.quizProgress")}</h2>
            {highestUnlocked > 0 && (
              <span className="pf-quiz-meta">{levelsCompleted} / 12 {t("profile.levelsComplete")}</span>
            )}
          </div>
          {highestUnlocked === 0 ? (
            <p className="pf-empty">{t("profile.quizNotStarted")}</p>
          ) : (
            <div className="pf-quiz-badges">
              {LEVEL_BADGES.map(({ level, emoji }) => {
                const prog = quizProgressMap[level];
                const earned = prog?.badge_earned === true;
                const unlocked = level === 1 || prog?.unlocked === true;
                return (
                  <div
                    key={level}
                    className={`pf-quiz-badge${earned ? " pf-quiz-badge--earned" : unlocked ? " pf-quiz-badge--unlocked" : " pf-quiz-badge--locked"}`}
                    title={earned ? `${t(`quiz.theme${level}`)} — ${t(`quiz.badgeName${level}`)}` : unlocked ? t("quiz.unlocked") : t("quiz.locked")}
                  >
                    <span className="pf-quiz-badge-emoji">{emoji}</span>
                    <span className="pf-quiz-badge-level">{level}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements / Milestone Badges */}
        <div className="achievements-section">
          <h3 className="achievements-title">
            Achievements ({earnedCount} / {BADGES.length})
          </h3>
          <div className="badge-grid">
            {BADGES.map((badge) => {
              const earned = earnedKeys.has(badge.key);
              const earnedAt = earnedMap[badge.key];
              return (
                <div
                  key={badge.key}
                  className={`badge-card ${earned ? "badge-card--earned" : "badge-card--locked"}`}
                  title={badge.description + (earnedAt ? `\nEarned ${new Date(earnedAt).toLocaleDateString()}` : "")}
                >
                  <span className="badge-emoji" role="img" aria-label={badge.label}>
                    {badge.emoji}
                  </span>
                  <span className="badge-label">{badge.label}</span>
                  {earned && earnedAt && (
                    <span className="badge-earned-date">
                      {new Date(earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Public posts / status updates */}
        <PostsSection profileId={profileId} isOwner={isOwner} t={t} />

        {/* Referral program — owner only */}
        {isOwner && <ReferralPanel userId={profileId} />}
          </>
        )}

        {/* Notes section — owner only */}
        {isOwner && activeTab === "notes" && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2>{t("profile.myNotes")} <InfoTip text={t("profile.notesTip")} /></h2>
              <button className="pf-add-note-btn" onClick={() => setShowAddForm(v => !v)} aria-expanded={showAddForm}>
                {showAddForm ? t("common.cancel") : t("profile.addNote")}
              </button>
            </div>

            {showAddForm && (
              <div className="pf-add-form-wrap">
                <NoteForm userId={profileId} onDone={() => setShowAddForm(false)} />
              </div>
            )}

            <div className="pf-filters">
              <CustomSelect
                value={filterBook}
                onChange={(v) => setFilterBook(String(v))}
                options={[
                  { value: "all", label: t("profile.allBooks") },
                  ...booksWithNotes.map(i => ({ value: i, label: t(`bookNames.${i}`, BOOKS[i]?.name) })),
                ]}
              />
              <input
                id="pf-notes-search"
                name="q"
                className="pf-filter-search"
                type="text"
                placeholder={t("profile.searchNotes")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search notes"
              />
            </div>

            {notesLoading ? (
              <div className="pf-notes-list">
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="skeleton" style={{ height: 12, width: "30%", borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 13, width: "100%", borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 13, width: "75%", borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="pf-empty">
                {notes.length === 0 ? t("profile.noNotes") : t("profile.noNotesFilter")}
              </div>
            ) : (
              <div className="pf-notes-list">
                {filtered.map(note => (
                  <NoteCard key={note.id} note={note} userId={profileId} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
