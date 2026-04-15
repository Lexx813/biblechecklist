import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import EmojiPickerPopup, { insertEmojiAtCursor } from "../../../components/EmojiPickerPopup";
import { useUpdateProfile } from "../../../hooks/useAdmin";
import { BOOKS } from "../../../data/books";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

const TOTAL_CHAPTERS = BOOKS.reduce((s, b) => s + b.chapters, 0);
const TOTAL_CH = 1189;
const BIO_MAX = 300;

interface Props {
  profile: any;
  userId: string;
  isOwner: boolean;
  readingProgress: Record<string, unknown>;
  streak: { current_streak: number; longest_streak: number; total_days: number };
  forumStats: { threads: number; replies: number };
}

// ── About Me ──────────────────────────────────────────────
function AboutMe({ profile, userId, isOwner }: { profile: any; userId: string; isOwner: boolean }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const update = useUpdateProfile(userId);

  const insertEmoji = useCallback((em: string) => {
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
function ReadingGoal({ profile, chaptersRead, totalDays, isOwner }: {
  profile: any;
  chaptersRead: number;
  totalDays: number;
  isOwner: boolean;
}) {
  const { t } = useTranslation();
  const update = useUpdateProfile(profile?.id);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(undefined);

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
    let dateStr: string | null = null;
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

// ── Main AboutTab ──────────────────────────────────────────
export default function AboutTab({ profile, userId, isOwner, readingProgress, streak, forumStats }: Props) {
  const { t } = useTranslation();

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

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-bg)] p-5">
      {/* About Me */}
      {(isOwner || profile?.bio) && (
        <AboutMe profile={profile} userId={userId} isOwner={isOwner} />
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
    </div>
  );
}
