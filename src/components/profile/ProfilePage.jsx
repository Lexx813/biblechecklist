import { useState, useRef, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../ConfirmModal";
import PageNav from "../PageNav";
import LoadingSpinner from "../LoadingSpinner";
import { useMeta } from "../../hooks/useMeta";
import { BOOKS } from "../../data/books";
import { useFullProfile, useUpdateProfile, useUploadAvatar } from "../../hooks/useAdmin";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "../../hooks/useNotes";
import { useProgress } from "../../hooks/useProgress";
import { useQuizProgress } from "../../hooks/useQuiz";
import { useFollowCounts, useIsFollowing, useToggleFollow } from "../../hooks/useFollows";
import { useUserPosts, useCreatePost, useDeletePost } from "../../hooks/usePosts";
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
  const { t } = useTranslation();

  const createNote = useCreateNote(userId);
  const updateNote = useUpdateNote(userId);
  const busy = createNote.isPending || updateNote.isPending;
  const maxChapter = BOOKS[bookIndex]?.chapters ?? 1;

  function handleBookChange(e) {
    setBookIndex(Number(e.target.value));
    setChapter(1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    const payload = { book_index: bookIndex, chapter, verse: verse ? Number(verse) : null, content: content.trim() };
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
          <select className="note-form-select" value={bookIndex} onChange={handleBookChange}>
            {BOOKS.map((b, i) => (
              <option key={i} value={i}>{t(`bookNames.${i}`, b.name)}</option>
            ))}
          </select>
        </div>
        <div className="note-form-field note-form-field--sm">
          <label className="note-form-label">{t("profile.chapterLabel")}</label>
          <select className="note-form-select" value={chapter} onChange={e => setChapter(Number(e.target.value))}>
            {Array.from({ length: maxChapter }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <div className="note-form-field note-form-field--sm">
          <label className="note-form-label">{t("profile.verseLabel")} <span className="note-form-optional">{t("profile.verseOptional")}</span></label>
          <input
            className="note-form-select"
            type="number"
            min={1}
            max={200}
            placeholder="—"
            value={verse}
            onChange={e => setVerse(e.target.value)}
          />
        </div>
      </div>
      <textarea
        className="note-form-textarea"
        placeholder={t("profile.notePlaceholder")}
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        required
      />
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
          <textarea
            className="post-composer-input"
            placeholder={t("posts.placeholder")}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={MAX_POST}
            rows={3}
          />
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

// ── Notification preferences ──────────────────────────────
function NotificationPrefs({ profile, userId, t }) {
  const update = useUpdateProfile(userId);
  const emailBlog = profile?.email_notifications_blog ?? false;

  return (
    <div className="pf-notif-prefs">
      <label className="pf-toggle-row">
        <div className="pf-toggle-info">
          <span className="pf-toggle-label">{t("profile.notifBlogLabel")}</span>
          <span className="pf-toggle-desc">{t("profile.notifBlogDesc")}</span>
        </div>
        <button
          role="switch"
          aria-checked={emailBlog}
          className={`pf-toggle${emailBlog ? " pf-toggle--on" : ""}`}
          onClick={() => update.mutate({ email_notifications_blog: !emailBlog })}
          disabled={update.isPending}
        >
          <span className="pf-toggle-thumb" />
        </button>
      </label>
    </div>
  );
}

// ── Main ProfilePage ──────────────────────────────────────
export default function ProfilePage({ user, viewedUserId, isOwner = true, onBack, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const profileId = viewedUserId ?? user.id;
  const { data: profile } = useFullProfile(profileId);
  const { data: notes = [], isLoading: notesLoading } = useNotes(isOwner ? profileId : null);
  const { data: readingProgress = {} } = useProgress(profileId);
  const { data: quizProgress = [] } = useQuizProgress(profileId);
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

  return (
    <div className="pf-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />
      {/* Header */}
      <header className="pf-header">
        <div className="pf-header-inner">
          <button className="pf-back-btn" onClick={onBack}>{t("common.back")}</button>
          <h1 className="pf-header-title">{isOwner ? t("profile.title") : (profile?.display_name || profile?.email?.split("@")[0] || t("profile.title"))}</h1>
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
            {isOwner && (
              <div className="pf-stats-row">
                <div className="pf-stat"><strong>{notes.length}</strong> {t("profile.notesCount", { count: notes.length }).split(" ")[1]}</div>
                <div className="pf-stat-divider" />
                <div className="pf-stat"><strong>{booksWithNotes.length}</strong> {t("profile.booksAnnotated", { count: booksWithNotes.length }).replace(/^\d+ /, "")}</div>
              </div>
            )}
          </div>
        </div>

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

        {/* Notification preferences — owner only */}
        {isOwner && (
          <div className="pf-section">
            <div className="pf-section-header">
              <h2>🔔 {t("profile.notificationsTitle")}</h2>
            </div>
            <NotificationPrefs profile={profile} userId={user.id} t={t} />
          </div>
        )}

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
