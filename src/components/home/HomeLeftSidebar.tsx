import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

type NavItem = { key: string; labelKey: string; icon: ReactNode; bg?: string };

const NAV_CORE: NavItem[] = [
  {
    key: "home", labelKey: "nav.home",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-home" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs><path d="M12 3L2 12h3v9h5v-5h4v5h5v-9h3L12 3z" fill="url(#g-home)"/></svg>,
  },
  {
    key: "main", labelKey: "nav.bibleTracker",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-bible" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V20H3V5z" fill="url(#g-bible)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V20h9V5z" fill="url(#g-bible)" opacity=".8"/><polyline points="6.5 11.5 9.5 14.5 16 8" fill="none" stroke="#f5f3ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    key: "readingPlans", labelKey: "nav.readingPlans",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-plans" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs><rect x="3" y="4" width="18" height="18" rx="3" fill="url(#g-plans)"/><rect x="8" y="2" width="2" height="5" rx="1" fill="#e0f2fe"/><rect x="14" y="2" width="2" height="5" rx="1" fill="#e0f2fe"/><rect x="3" y="10" width="18" height="1.5" fill="rgba(255,255,255,.25)"/><rect x="6" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/><rect x="10.5" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/><rect x="15" y="14" width="3" height="3" rx=".5" fill="rgba(255,255,255,.55)"/></svg>,
  },
  {
    key: "studyNotes", labelKey: "nav.studyNotes",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-notes" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#047857"/></linearGradient></defs><rect x="4" y="3" width="13" height="18" rx="2" fill="url(#g-notes)"/><path d="M17 3l3 3h-2a1 1 0 0 1-1-1V3z" fill="rgba(255,255,255,.4)"/><rect x="7" y="8" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="11.5" width="9" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="15" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg>,
  },
  {
    key: "studyTopics", labelKey: "nav.studyTopics",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-study" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V19a2.5 2.5 0 0 0-4.5-1.5H3V5z" fill="url(#g-study)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V19a2.5 2.5 0 0 1 4.5-1.5H21V5z" fill="url(#g-study)" opacity=".8"/></svg>,
  },
];

const NAV_COMMUNITY: NavItem[] = [
  {
    key: "forum", labelKey: "nav.forum",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-forum" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#c2410c"/></linearGradient></defs><path d="M21 3H3a1 1 0 0 0-1 1v14l5-4h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" fill="url(#g-forum)"/><rect x="7" y="8" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/><rect x="7" y="11.5" width="6" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/></svg>,
  },
  {
    key: "friends", labelKey: "nav.friends",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-friends" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#g-friends)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#g-friends)"/><circle cx="17.5" cy="8" r="3" fill="url(#g-friends)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#g-friends)" opacity=".65"/></svg>,
  },
  {
    key: "messages", labelKey: "nav.messages",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-msgs" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient></defs><rect x="2" y="4" width="20" height="16" rx="3" fill="url(#g-msgs)"/><path d="M2 8l10 7 10-7" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    key: "groups", labelKey: "nav.studyGroups",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-groups" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#34d399"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><circle cx="8" cy="7" r="4" fill="url(#g-groups)"/><path d="M1 21a7 7 0 0 1 14 0z" fill="url(#g-groups)"/><rect x="17" y="8" width="6" height="2" rx="1" fill="url(#g-groups)"/><rect x="19" y="6" width="2" height="6" rx="1" fill="url(#g-groups)"/></svg>,
  },
  {
    key: "feed", labelKey: "nav.feed",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-feed" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#38bdf8"/></linearGradient></defs><circle cx="5" cy="19" r="3" fill="url(#g-feed)"/><path d="M4 11a9 9 0 0 1 9 9H9a5 5 0 0 0-5-5v-4z" fill="url(#g-feed)"/><path d="M4 4a16 16 0 0 1 16 16h-4A12 12 0 0 0 4 8V4z" fill="url(#g-feed)"/></svg>,
  },
  {
    key: "bookmarks", labelKey: "nav.bookmarks",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-bm" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fbbf24"/><stop offset="100%" stopColor="#b45309"/></linearGradient></defs><path d="M6 2h12a2 2 0 0 1 2 2v17l-7-4.5L6 21V4a2 2 0 0 1 2-2H6z" fill="url(#g-bm)"/></svg>,
  },
];

const NAV_EXPLORE: NavItem[] = [
  {
    key: "blog", labelKey: "nav.blog",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-blog" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f0abfc"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs><rect x="4" y="2" width="13" height="20" rx="2" fill="url(#g-blog)"/><rect x="7" y="7" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="10.5" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="14" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg>,
  },
  {
    key: "leaderboard", labelKey: "nav.leaderboard",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-lb" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#fde68a"/></linearGradient></defs><rect x="3" y="13" width="5" height="9" rx="1.5" fill="url(#g-lb)" opacity=".75"/><rect x="9.5" y="8" width="5" height="14" rx="1.5" fill="url(#g-lb)"/><rect x="16" y="4" width="5" height="18" rx="1.5" fill="url(#g-lb)" opacity=".85"/></svg>,
  },
];

const NAV_SHORTCUTS: NavItem[] = [
  {
    key: "quiz", labelKey: "nav.bibleQuiz", bg: "#4338ca",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-practice" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#3730a3"/></linearGradient></defs><path d="M14.5 2L5.5 14h7l-3 8L20.5 10h-7L14.5 2z" fill="url(#g-practice)"/></svg>,
  },
  {
    key: "trivia", labelKey: "nav.triviaBattle", bg: "#6d28d9",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-trivia" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" fill="url(#g-trivia)"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 3-3 3" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1.2" fill="rgba(255,255,255,.8)"/></svg>,
  },
  {
    key: "familyQuiz", labelKey: "nav.familyChallenge", bg: "#0369a1",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-family" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#g-family)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#g-family)"/><circle cx="17.5" cy="8" r="3" fill="url(#g-family)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#g-family)" opacity=".65"/></svg>,
  },
  {
    key: "meetingPrep", labelKey: "nav.meetingPrep", bg: "#0369a1",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-prep" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#38bdf8"/><stop offset="100%" stopColor="#0369a1"/></linearGradient></defs><rect x="3" y="3" width="18" height="18" rx="3" fill="url(#g-prep)"/><path d="M7 12l3 3 7-7" fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
];

const ADMIN_ICON = (
  <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-admin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f87171"/><stop offset="100%" stopColor="#b91c1c"/></linearGradient></defs><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" fill="url(#g-admin)"/><circle cx="12" cy="12" r="3" fill="rgba(255,255,255,.9)"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="rgba(255,255,255,.35)"/></svg>
);

interface Props {
  profile: { avatar_url?: string | null; display_name?: string | null; is_admin?: boolean | null; is_moderator?: boolean | null } | null | undefined;
  displayName: string;
  initials: string;
  activePanel: string | null;
  pendingRequests: number;
  unreadMessages: number;
  panelNavigate: (page: string, params?: Record<string, any>) => void;
  setActivePanel: (panel: string | null) => void;
  setQuizLevelState: (state: any) => void;
}

export default function HomeLeftSidebar({
  profile, displayName, initials, activePanel,
  pendingRequests, unreadMessages,
  panelNavigate, setActivePanel, setQuizLevelState,
}: Props) {
  const { t } = useTranslation();

  return (
    <aside className="home-left-sidebar">
      <button className="hls-profile" onClick={() => { setActivePanel("profile"); setQuizLevelState(null); }}>
        <span className="hls-avatar">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={displayName} width={40} height={40} />
            : <span className="hls-avatar-initials">{initials}</span>}
        </span>
        <span className="hls-name">{displayName}</span>
      </button>

      <div className="hls-section-label">{t("nav.core", "Core")}</div>
      {NAV_CORE.map(item => (
        <button
          key={item.key}
          className={`hls-item${(activePanel === null && item.key === "home") || activePanel === item.key ? " hls-item--active" : ""}`}
          onClick={() => panelNavigate(item.key)}
        >
          <span className="hls-icon">{item.icon}</span>
          {t(item.labelKey)}
        </button>
      ))}

      <div className="hls-divider" />

      <div className="hls-section-label">{t("nav.community", "Community")}</div>
      {NAV_COMMUNITY.map(item => (
        <button
          key={item.key}
          className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
          onClick={() => panelNavigate(item.key)}
        >
          <span className="hls-icon">{item.icon}</span>
          {t(item.labelKey)}
          {item.key === "friends"  && pendingRequests > 0 && <span className="hls-badge">{pendingRequests}</span>}
          {item.key === "messages" && unreadMessages  > 0 && <span className="hls-badge">{unreadMessages}</span>}
        </button>
      ))}

      <div className="hls-divider" />

      <div className="hls-section-label">{t("nav.explore", "Explore")}</div>
      {NAV_EXPLORE.map(item => (
        <button
          key={item.key}
          className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
          onClick={() => panelNavigate(item.key)}
        >
          <span className="hls-icon">{item.icon}</span>
          {t(item.labelKey)}
        </button>
      ))}

      <div className="hls-divider" />
      <div className="hls-section-label">{t("nav.shortcuts", "Shortcuts")}</div>

      {NAV_SHORTCUTS.map(item => (
        <button
          key={item.key}
          className={`hls-item${activePanel === item.key ? " hls-item--active" : ""}`}
          onClick={() => panelNavigate(item.key)}
        >
          <span className="hls-icon">{item.icon}</span>
          {t(item.labelKey)}
        </button>
      ))}

      {(profile?.is_admin || profile?.is_moderator) && (
        <>
          <div className="hls-divider" />
          <button
            className={`hls-item${activePanel === "admin" ? " hls-item--active" : ""}`}
            onClick={() => { setActivePanel("admin"); setQuizLevelState(null); }}
          >
            <span className="hls-icon">{ADMIN_ICON}</span>
            {profile?.is_admin ? "Admin" : "Moderation"}
          </button>
        </>
      )}

      <div className="hsidebar-footer">
        <a href="/privacy" className="hsidebar-footer-link">Privacy</a>
        <span className="hsidebar-footer-sep">&middot;</span>
        <a href="/terms" className="hsidebar-footer-link">Terms</a>
        <span className="hsidebar-footer-sep">&middot;</span>
        <span className="hsidebar-footer-copy">&copy; {new Date().getFullYear()} JW Study</span>
        <span className="hsidebar-footer-sep">&middot;</span>
        <a href="https://www.jw.org" className="hsidebar-footer-link" target="_blank" rel="noopener noreferrer">JW.org</a>
      </div>
    </aside>
  );
}
