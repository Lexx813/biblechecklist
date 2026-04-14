import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../../components/EmojiPickerPopup";
import CustomSelect from "../../components/CustomSelect";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import { useMeta } from "../../hooks/useMeta";
import { BOOKS } from "../../data/books";
import { useFullProfile } from "../../hooks/useAdmin";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "../../hooks/useNotes";
import { useProgress, useReadingStreak } from "../../hooks/useProgress";
import { useQuizProgress } from "../../hooks/useQuiz";
import { useUserForumStats } from "../../hooks/useForum";
import { useSubscription } from "../../hooks/useSubscription";
import { useBadges } from "../../hooks/useBadges";
import "../../styles/profile.css";
import "../../styles/social.css";
import "../../styles/gamification.css";
import { formatDate } from "../../utils/formatters";
import ReferralPanel from "../../components/ReferralPanel";
import ProfileFriendsTab from "./ProfileFriendsTab";
import { useBlocks, useMyBlocks } from "../../hooks/useBlocks";
import CoverPhoto from "./CoverPhoto";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import PostsTab from "./tabs/PostsTab";
import AboutTab from "./tabs/AboutTab";
import AchievementsTab from "./tabs/AchievementsTab";

const OT_COUNT = 39;

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

// ── Main ProfilePage ──────────────────────────────────────
export default function ProfilePage({ user, viewedUserId, isOwner = true, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade, defaultTab = "posts" }) {
  const profileId = viewedUserId ?? user.id;
  const { isPremium } = useSubscription(user.id);
  const { data: blockedSet = new Set<string>() } = useBlocks(user.id);
  const { data: myBlocks = [] } = useMyBlocks(user.id);
  const { data: profile, isLoading: profileLoading } = useFullProfile(profileId);
  const { data: notes = [], isLoading: notesLoading } = useNotes(isOwner ? profileId : null);
  const { data: readingProgress = {} } = useProgress(profileId);
  const { data: quizProgress = [] } = useQuizProgress(profileId);
  const { data: streak = { current_streak: 0, longest_streak: 0, total_days: 0 } } = useReadingStreak(profileId);
  const { data: forumStats = { threads: 0, replies: 0 } } = useUserForumStats(profileId);
  const { t } = useTranslation();
  useMeta({ title: profile?.display_name ? `${profile.display_name}'s Profile` : "Profile" });

  // Milestone badges
  const { data: earnedBadges = [] } = useBadges(user?.id);

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
      <div className="min-h-screen bg-[var(--bg)]">
        <div className="mx-auto max-w-[720px]">
          {/* Cover skeleton */}
          <div className="h-[200px] animate-pulse rounded-t-[var(--radius)] bg-[var(--card-bg)] sm:h-[260px]" />
          {/* Header skeleton */}
          <div className="rounded-b-[var(--radius)] border border-t-0 border-[var(--border)] bg-[var(--card-bg)] p-6">
            <div className="-mt-16 flex items-end gap-4">
              <div className="size-28 rounded-full border-4 border-[var(--card-bg)] bg-[var(--border)]" />
              <div className="flex flex-col gap-2">
                <div className="skeleton" style={{ height: 20, width: 160, borderRadius: 6 }} />
                <div className="skeleton" style={{ height: 13, width: 100, borderRadius: 6 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto max-w-[720px]">
        {/* Cover photo */}
        <div className="overflow-hidden rounded-t-[var(--radius)]">
          <CoverPhoto
            coverUrl={profile?.cover_url ?? null}
            userId={profileId}
            isOwner={isOwner}
            onSettingsClick={() => navigate("settings")}
          />
        </div>

        {/* Profile header (avatar overlapping cover) */}
        <ProfileHeader
          profile={profile}
          userId={profileId}
          currentUserId={user.id}
          isOwner={isOwner}
          navigate={navigate}
          isPremium={isPremium}
          onUpgrade={onUpgrade}
          onEditProfile={() => navigate("settings")}
        />

        {/* Blocked banner */}
        {isViewedUserBlocked && (
          <div className="pf-blocked-banner">
            {myBlocks.some(b => b.id === profileId)
              ? "You've blocked this user."
              : "This user has blocked you."}
          </div>
        )}

        {/* Tab bar */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwner={isOwner} />

        {/* Tab content */}
        <div className="flex flex-col gap-4 pb-12 pt-4">
          {activeTab === "posts" && !isViewedUserBlocked && (
            <PostsTab profileId={profileId} isOwner={isOwner} />
          )}

          {activeTab === "about" && !isViewedUserBlocked && (
            <AboutTab
              profile={profile}
              userId={profileId}
              isOwner={isOwner}
              readingProgress={readingProgress}
              streak={streak}
              forumStats={forumStats}
            />
          )}

          {activeTab === "friends" && isOwner && (
            <ProfileFriendsTab user={user} navigate={navigate} isPremium={isPremium} onUpgrade={onUpgrade} />
          )}

          {activeTab === "achievements" && !isViewedUserBlocked && (
            <AchievementsTab userId={profileId} quizProgress={quizProgress} earnedBadges={earnedBadges} />
          )}

          {activeTab === "notes" && isOwner && (
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

          {/* Referral program — owner only, shown on posts tab */}
          {activeTab === "posts" && isOwner && !isViewedUserBlocked && (
            <ReferralPanel userId={profileId} />
          )}
        </div>
      </div>
    </div>
  );
}
