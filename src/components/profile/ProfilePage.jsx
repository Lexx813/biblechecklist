import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../EmojiPickerPopup";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../ConfirmModal";
import PageNav from "../PageNav";
import LoadingSpinner from "../LoadingSpinner";
import { useMeta } from "../../hooks/useMeta";
import { BOOKS } from "../../data/books";
import { useFullProfile, useUpdateProfile, useUploadAvatar } from "../../hooks/useAdmin";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "../../hooks/useNotes";
import { useProgress, useReadingStreak } from "../../hooks/useProgress";
import { useQuizProgress } from "../../hooks/useQuiz";
import { useFollowCounts, useIsFollowing, useToggleFollow } from "../../hooks/useFollows";
import { useUserPosts, useCreatePost, useDeletePost } from "../../hooks/usePosts";
import { useGetOrCreateDM } from "../../hooks/useMessages";
import { isDev } from "../../lib/devOnly";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "../../styles/profile.css";
import "../../styles/social.css";

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

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Initials({ name, email }) {
  const str = name || email || "?";
  return str[0].toUpperCase();
}

// ── Avatar ────────────────────────────────────────────────
function Avatar({ profile, userId, editable }) {
  const fileRef = useRef();
  const upload = useUploadAvatar(userId);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    upload.mutate(file);
  }

  if (!editable) {
    return (
      <div className="pf-avatar-wrap pf-avatar-wrap--static">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="avatar" className="pf-avatar-img" />
          : <span className="pf-avatar-initials"><Initials name={profile?.display_name} email={profile?.email} /></span>
        }
      </div>
    );
  }

  return (
    <div className="pf-avatar-wrap" onClick={() => fileRef.current.click()} title="Change photo">
      {profile?.avatar_url
        ? <img src={profile.avatar_url} alt="avatar" className="pf-avatar-img" />
        : <span className="pf-avatar-initials"><Initials name={profile?.display_name} email={profile?.email} /></span>
      }
      <div className="pf-avatar-overlay">
        {upload.isPending ? "⏳" : "📷"}
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
        />
        <button className="pf-name-save" onClick={save}>{t("common.save")}</button>
        <button className="pf-name-cancel" onClick={() => setEditing(false)}>✕</button>
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
      <button className="pf-edit-icon" onClick={startEdit} title={t("common.edit")}>✏️</button>
    </div>
  );
}

// ── Add / Edit note form ──────────────────────────────────
function NoteForm({ userId, initial, onDone }) {
  const [bookIndex, setBookIndex] = useState(initial?.book_index ?? 0);
  const [chapter, setChapter] = useState(initial?.chapter ?? 1);
  const [verse, setVerse] = useState(initial?.verse ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [showNoteEmoji, setShowNoteEmoji] = useState(false);
  const noteRef = useRef(null);
  const { t } = useTranslation();

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

  function handleBookChange(e) {
    setBookIndex(Number(e.target.value));
    setChapter(1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const payload = { book_index: bookIndex, chapter, verse: verse.trim() || null, content: content.trim() };
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
          <label htmlFor="note-book" className="note-form-label">{t("profile.bookLabel")}</label>
          <select id="note-book" name="book" className="note-form-select" value={bookIndex} onChange={handleBookChange}>
            {BOOKS.map((b, i) => (
              <option key={i} value={i}>{t(`bookNames.${i}`, b.name)}</option>
            ))}
          </select>
        </div>
        <div className="note-form-field note-form-field--sm">
          <label htmlFor="note-chapter" className="note-form-label">{t("profile.chapterLabel")}</label>
          <select id="note-chapter" name="chapter" className="note-form-select" value={chapter} onChange={e => setChapter(Number(e.target.value))}>
            {Array.from({ length: maxChapter }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
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
        <LoadingSpinner />
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

// ── Message button (dev-only) ──────────────────────────────
function MessageButton({ targetId, otherDisplayName, otherAvatarUrl, navigate }) {
  const getOrCreate = useGetOrCreateDM();
  function handleClick() {
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
      className="pf-follow-btn"
      onClick={handleClick}
      disabled={getOrCreate.isPending}
    >
      💬 Message
    </button>
  );
}

// ── Follow button + counts ─────────────────────────────────
function FollowSection({ currentUserId, targetId, t }) {
  const { data: counts = { followers: 0, following: 0 } } = useFollowCounts(targetId);
  const { data: isFollowing = false } = useIsFollowing(currentUserId, targetId);
  const toggle = useToggleFollow(currentUserId, targetId);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div className="pf-follow-counts">
        <div className="pf-follow-count-item">
          <span className="pf-follow-count-num">{counts.followers}</span>
          <span className="pf-follow-count-label">{t("follow.followers")}</span>
        </div>
        <div className="pf-follow-count-item">
          <span className="pf-follow-count-num">{counts.following}</span>
          <span className="pf-follow-count-label">{t("follow.following")}</span>
        </div>
      </div>
      {currentUserId !== targetId && (
        <button
          className={`pf-follow-btn ${isFollowing ? "pf-follow-btn--following" : "pf-follow-btn--follow"}`}
          onClick={() => toggle.mutate()}
          disabled={toggle.isPending}
        >
          {isFollowing ? t("follow.unfollow") : t("follow.follow")}
        </button>
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
export default function ProfilePage({ user, viewedUserId, isOwner = true, onBack, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const profileId = viewedUserId ?? user.id;
  const { data: profile, isLoading: profileLoading } = useFullProfile(profileId);
  const { data: notes = [], isLoading: notesLoading } = useNotes(isOwner ? profileId : null);
  const { data: readingProgress = {} } = useProgress(profileId);
  const { data: quizProgress = [] } = useQuizProgress(profileId);
  const { data: streak = { current_streak: 0, longest_streak: 0, total_days: 0 } } = useReadingStreak(profileId);
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

  useEffect(() => {
    const name = profile?.display_name || profile?.email?.split("@")[0];
    if (name) document.title = `${name} — NWT Progress`;
    return () => { document.title = "NWT Progress"; };
  }, [profile?.display_name, profile?.email]);

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
        <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="pf-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
      {/* Header */}
      <header className="pf-header">
        <div className="pf-header-inner">
          <button className="pf-back-btn" onClick={onBack}>{t("common.back")}</button>
          <h1 className="pf-header-title">{isOwner ? t("profile.title") : (profile?.display_name || profile?.email?.split("@")[0] || t("profile.title"))}</h1>
          {isOwner && <button className="pf-settings-btn" onClick={() => navigate("settings")}>{t("settings.openSettings")}</button>}
        </div>
      </header>

      <div className="pf-content">

        {/* Profile card */}
        <div className="pf-card">
          <div className="pf-card-banner" />
          <div className="pf-card-body">
            <Avatar profile={profile} userId={profileId} editable={isOwner} />
            <DisplayName profile={profile} userId={profileId} editable={isOwner} />
            {isOwner && <p className="pf-email">{user.email}</p>}
            <p className="pf-since">{t("profile.memberSince", { date: profile ? formatDate(profile.created_at) : "—" })}</p>
            <FollowSection currentUserId={user.id} targetId={profileId} t={t} />
            {isDev && !isOwner && (
              <MessageButton
                targetId={profileId}
                otherDisplayName={profile?.display_name || profile?.email?.split("@")[0] || "User"}
                otherAvatarUrl={profile?.avatar_url ?? null}
                navigate={navigate}
              />
            )}
            {isOwner && (
              <div className="pf-stats-row">
                <div className="pf-stat"><strong>{notes.length}</strong> {t("profile.notesCount", { count: notes.length }).split(" ")[1]}</div>
                <div className="pf-stat-divider" />
                <div className="pf-stat"><strong>{booksWithNotes.length}</strong> {t("profile.booksAnnotated", { count: booksWithNotes.length }).replace(/^\d+ /, "")}</div>
              </div>
            )}
          </div>
        </div>

        {/* About Me */}
        {(isOwner || profile?.bio) && (
          <AboutMe profile={profile} userId={profileId} isOwner={isOwner} t={t} />
        )}

        {/* Bible Reading Progress */}
        <div className="pf-section pf-section--stats">
          <div className="pf-section-header">
            <h2>📖 {t("profile.bibleProgress")}</h2>
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
            <h2>🔥 {t("profile.readingStreak")}</h2>
          </div>
          <div className="pf-streak-row">
            <div className="pf-streak-card">
              <span className="pf-streak-val">{streak.current_streak}</span>
              <span className="pf-streak-label">{t("profile.currentStreak")}</span>
            </div>
            <div className="pf-streak-card">
              <span className="pf-streak-val">{streak.longest_streak}</span>
              <span className="pf-streak-label">{t("profile.longestStreak")}</span>
            </div>
            <div className="pf-streak-card">
              <span className="pf-streak-val">{streak.total_days}</span>
              <span className="pf-streak-label">{t("profile.totalDays")}</span>
            </div>
          </div>
        </div>

        {/* Quiz Progress */}
        <div className="pf-section pf-section--stats">
          <div className="pf-section-header">
            <h2>🏆 {t("profile.quizProgress")}</h2>
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

        {/* Public posts / status updates */}
        <PostsSection profileId={profileId} isOwner={isOwner} t={t} />

        {/* Notes section — owner only */}
        {isOwner && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2>{t("profile.myNotes")} <InfoTip text={t("profile.notesTip")} /></h2>
              <button className="pf-add-note-btn" onClick={() => setShowAddForm(v => !v)}>
                {showAddForm ? t("common.cancel") : t("profile.addNote")}
              </button>
            </div>

            {showAddForm && (
              <div className="pf-add-form-wrap">
                <NoteForm userId={profileId} onDone={() => setShowAddForm(false)} />
              </div>
            )}

            <div className="pf-filters">
              <select
                id="pf-filter-book"
                name="filter_book"
                className="pf-filter-select"
                value={filterBook}
                onChange={e => setFilterBook(e.target.value)}
              >
                <option value="all">{t("profile.allBooks")}</option>
                {booksWithNotes.map(i => (
                  <option key={i} value={i}>{t(`bookNames.${i}`, BOOKS[i]?.name)}</option>
                ))}
              </select>
              <input
                id="pf-notes-search"
                name="q"
                className="pf-filter-search"
                type="text"
                placeholder={t("profile.searchNotes")}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {notesLoading ? (
              <LoadingSpinner />
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
