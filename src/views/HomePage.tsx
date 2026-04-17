import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useReadingStreak, useProgress, useChapterTimestamps } from "../hooks/useProgress";
import { useFriendPosts } from "../hooks/usePosts";
import { usePrepForWeek, useMeetingWeek, getMondayOfWeek, formatWeekLabel } from "../hooks/useMeetingPrep";
import { useFullProfile } from "../hooks/useAdmin";
import { BOOKS, OT_COUNT } from "../data/books";
import DailyVerse from "../components/home/DailyVerse";
import "../styles/home.css";

const QUICK_ACTIONS = [
  {
    key: "quiz",
    labelKey: "nav.quiz",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  },
  {
    key: "studyNotes",
    labelKey: "nav.studyNotes",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>,
  },
  {
    key: "readingPlans",
    labelKey: "nav.readingPlans",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    key: "leaderboard",
    labelKey: "nav.leaderboard",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    key: "videos",
    labelKey: "nav.videos",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  },
  {
    key: "studyTopics",
    labelKey: "nav.studyTopics",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
];

function getGreeting(name: string, t: (k: string, opts?: Record<string, unknown>) => string): string {
  const h = new Date().getHours();
  if (h < 12) return t("home.greeting", { name });
  if (h < 18) return t("home.greetingAfternoon", { name });
  return t("home.greetingEvening", { name });
}

export default function HomePage({ user, navigate }: {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
  // Legacy props accepted but unused — inline panels removed
  onLogout?: () => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: unknown;
  panelRequest?: unknown;
  onPanelConsumed?: () => void;
}) {
  const { t } = useTranslation();

  const { data: profile } = useFullProfile(user?.id);
  const name = (profile as any)?.display_name ?? "";

  // Streak
  const { data: streak = { current_streak: 0, longest_streak: 0 } } = useReadingStreak(user?.id);

  // Progress data for Study card
  const { data: remoteProgress = {} } = useProgress(user?.id);
  const { data: chapterTimestamps = {} } = useChapterTimestamps(user?.id);

  const { otPct, ntPct, currentBook } = useMemo(() => {
    const progress = remoteProgress as Record<string, Record<string, boolean>>;
    const otTotal = BOOKS.slice(0, OT_COUNT).reduce((s, b) => s + b.chapters, 0);
    const ntTotal = BOOKS.slice(OT_COUNT).reduce((s, b) => s + b.chapters, 0);
    const otRead = BOOKS.slice(0, OT_COUNT).reduce((s, _, i) => {
      const chs = progress[String(i)] ?? {};
      return s + Object.values(chs).filter(Boolean).length;
    }, 0);
    const ntRead = BOOKS.slice(OT_COUNT).reduce((s, _, i) => {
      const chs = progress[String(OT_COUNT + i)] ?? {};
      return s + Object.values(chs).filter(Boolean).length;
    }, 0);

    // Most recently read book from chapterTimestamps
    let maxTs = 0;
    let maxBookIdx = 0;
    const ts = chapterTimestamps as Record<number, Record<number, string>>;
    for (const [biStr, chapters] of Object.entries(ts)) {
      for (const isoStr of Object.values(chapters)) {
        const t2 = new Date(isoStr).getTime();
        if (t2 > maxTs) { maxTs = t2; maxBookIdx = Number(biStr); }
      }
    }

    return {
      otPct: otTotal ? Math.round((otRead / otTotal) * 100) : 0,
      ntPct: ntTotal ? Math.round((ntRead / ntTotal) * 100) : 0,
      currentBook: BOOKS[maxBookIdx] ?? BOOKS[0],
    };
  }, [remoteProgress, chapterTimestamps]);

  // Meeting Prep data for This Week card
  const currentWeek = getMondayOfWeek();
  const { data: week } = useMeetingWeek(currentWeek);
  const { data: prep } = usePrepForWeek(user?.id, currentWeek);
  const weekLabel = (week as any)?.clam_week_title || formatWeekLabel(currentWeek);
  const clamDone = (prep as any)?.clam_completed ?? false;
  const wtDone = (prep as any)?.wt_completed ?? false;

  // Friend activity
  const { data: friendPosts = [] } = useFriendPosts(user?.id);
  const recentActivity = (friendPosts as any[]).slice(0, 3);

  return (
    <div className="hd-wrap">
      {/* ── Greeting ── */}
      <div className="hd-greeting-row">
        <div>
          <h1 className="hd-greeting">{getGreeting(name, t)}</h1>
          <p className="hd-date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        {streak.current_streak > 0 && (
          <div className="hd-streak-badge" title={t("app.longestStreak", { n: streak.longest_streak })}>
            🔥 {streak.current_streak}
          </div>
        )}
      </div>

      {/* ── Daily Verse ── */}
      <DailyVerse />

      {/* ── Two-up cards ── */}
      <div className="hd-cards-row">
        {/* Study card */}
        <div className="hd-card hd-study-card">
          <p className="hd-card-label">{t("home.yourStudy")}</p>
          <p className="hd-card-title">{currentBook.name}</p>
          <div className="hd-mini-prog-row">
            <span className="hd-mini-prog-label">OT</span>
            <div className="hd-mini-track"><div className="hd-mini-fill" style={{ width: otPct + "%" }} /></div>
            <span className="hd-mini-pct">{otPct}%</span>
          </div>
          <div className="hd-mini-prog-row">
            <span className="hd-mini-prog-label">NT</span>
            <div className="hd-mini-track"><div className="hd-mini-fill" style={{ width: ntPct + "%" }} /></div>
            <span className="hd-mini-pct">{ntPct}%</span>
          </div>
          <button className="hd-card-cta" onClick={() => navigate("main")}>{t("home.continueReading")}</button>
        </div>

        {/* This Week card */}
        <div className="hd-card hd-week-card">
          <p className="hd-card-label">{t("home.thisWeek")}</p>
          <p className="hd-card-title">{weekLabel}</p>
          <div className="hd-check-row">
            <span className={`hd-check-dot${clamDone ? " hd-check-dot--done" : ""}`} />
            <span className="hd-check-label">CLAM {clamDone ? "✓" : ""}</span>
          </div>
          <div className="hd-check-row">
            <span className={`hd-check-dot${wtDone ? " hd-check-dot--done" : ""}`} />
            <span className="hd-check-label">Watchtower {wtDone ? "✓" : ""}</span>
          </div>
          <button className="hd-card-cta" onClick={() => navigate("meetingPrep")}>{t("home.openPrep")}</button>
        </div>
      </div>

      {/* ── Friend Activity ── */}
      <div className="hd-section">
        <div className="hd-section-header">
          <span className="hd-section-title">{t("home.friendActivity")}</span>
          <button className="hd-see-all" onClick={() => navigate("community")}>{t("home.seeAll")}</button>
        </div>
        {recentActivity.length === 0 ? (
          <button className="hd-no-friends" onClick={() => navigate("friends")}>
            {t("home.noFriendsYet")}
          </button>
        ) : (
          <div className="hd-activity-list">
            {recentActivity.map((post: any) => (
              <div key={post.id} className="hd-activity-item">
                <span className="hd-activity-av">
                  {post.profiles?.avatar_url
                    ? <img src={post.profiles.avatar_url} alt={post.profiles.display_name ?? ""} width={32} height={32} loading="lazy" />
                    : (post.profiles?.display_name ?? "?")[0].toUpperCase()}
                </span>
                <div className="hd-activity-text">
                  <span className="hd-activity-name">{post.profiles?.display_name ?? "Someone"}</span>
                  <span className="hd-activity-body"> {post.content}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="hd-section">
        <div className="hd-section-header">
          <span className="hd-section-title">{t("home.quickActions")}</span>
        </div>
        <div className="hd-quick-grid">
          {QUICK_ACTIONS.map(action => (
            <button key={action.key} className="hd-quick-tile" onClick={() => navigate(action.key)}>
              <span className="hd-quick-icon">{action.icon}</span>
              <span className="hd-quick-label">{t(action.labelKey, action.key)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
