import { useTranslation } from "react-i18next";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";
import { useFullProfile } from "../hooks/useAdmin";
import "../styles/app-layout.css";

const NAV_PRIMARY = [
  { key: "home",         labelKey: "nav.home",         bg: "#5b21b6", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: "main",         labelKey: "nav.bibleTracker", bg: "#7c3aed", icon: <svg width="18" height="18" viewBox="0 1 24 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v11H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v11h10z"/><polyline points="8 11 11 14.5 17 7.5" stroke="#a78bfa" strokeWidth="2.5" fill="none"/></svg> },
  { key: "readingPlans", labelKey: "nav.readingPlans", bg: "#0ea5e9", premium: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { key: "studyNotes",   labelKey: "nav.studyNotes",   bg: "#2e9e6b", premium: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></svg> },
  { key: "forum",        labelKey: "nav.forum",        bg: "#e05c2a", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { key: "blog",         labelKey: "nav.blog",         bg: "#c084fc", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { key: "leaderboard",  labelKey: "nav.leaderboard",  bg: "#f59e0b", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg> },
];

const NAV_SOCIAL = [
  { key: "friends",  labelKey: "nav.friends",  bg: "#1d7ea6", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: "groups",   labelKey: "nav.studyGroups", bg: "#059669", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
  { key: "messages", labelKey: "nav.messages", bg: "#7c3aed", premium: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
];

const NAV_SHORTCUTS = [
  { key: "quiz",        labelKey: "nav.bibleQuiz",   bg: "#374151", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: "advancedQuiz", labelKey: "nav.advancedQuiz", bg: "#374151", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: "meetingPrep", labelKey: "nav.meetingPrep", bg: "#374151", premium: true, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
];


interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  user: { id?: string; email?: string } | null | undefined;
  currentPage: string;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

const BETA_LANGS = ["ja", "ko"];

export default function AppLayout({ navigate, user, currentPage, children, rightPanel }: Props) {
  const { t, i18n } = useTranslation();
  const { data: profile } = useFullProfile(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(user?.id);
  const pendingRequests = incoming.data?.length ?? 0;
  const lang = i18n.language?.split("-")[0] ?? "en";
  const showBetaBanner = BETA_LANGS.includes(lang) && !localStorage.getItem("nwt-beta-lang-dismissed");

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "My Profile";
  const initials = displayName[0].toUpperCase();

  // "friends" and "friendRequests" both highlight the Friends item
  const activeKey = currentPage === "friendRequests" ? "friends"
                  : currentPage === "groupDetail"     ? "groups"
                  : currentPage === "publicProfile"   ? "profile"
                  : currentPage;

  return (
    <div className={`al-wrap${rightPanel ? " al-wrap--with-rp" : ""}`}>
      <aside className="al-sidebar" aria-label="Main navigation">

        {/* Profile row */}
        <button className="al-profile" onClick={() => navigate("profile")}>
          <span className="al-avatar">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={displayName} />
              : initials}
          </span>
          <span className="al-name">{displayName}</span>
        </button>

        {/* Primary nav */}
        {NAV_PRIMARY.map(item => (
          <button
            key={item.key}
            className={`al-item${activeKey === item.key ? " al-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={activeKey === item.key ? "page" : undefined}
          >
            <span className="al-icon" style={{ background: item.bg }}>{item.icon}</span>
            {t(item.labelKey)}
          </button>
        ))}

        <div className="al-divider" />

        {/* Social */}
        {NAV_SOCIAL.map(item => (
          <button
            key={item.key}
            className={`al-item${activeKey === item.key ? " al-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={activeKey === item.key ? "page" : undefined}
          >
            <span className="al-icon" style={{ background: item.bg }}>{item.icon}</span>
            {t(item.labelKey)}
            {item.key === "friends"  && pendingRequests > 0 && <span className="al-badge">{pendingRequests > 99 ? "99+" : pendingRequests}</span>}
            {item.key === "messages" && unreadMessages  > 0 && <span className="al-badge">{unreadMessages  > 99 ? "99+" : unreadMessages}</span>}
          </button>
        ))}

        <div className="al-divider" />
        <div className="al-section-label">{t("nav.shortcuts")}</div>

        {NAV_SHORTCUTS.map(item => (
          <button
            key={item.key}
            className={`al-item${activeKey === item.key ? " al-item--active" : ""}`}
            onClick={() => navigate(item.key)}
          >
            <span className="al-icon" style={{ background: item.bg }}>{item.icon}</span>
            {t(item.labelKey)}
          </button>
        ))}

      </aside>

      <div key={currentPage} className="al-content">
        {showBetaBanner && (
          <div className="al-beta-banner">
            <p>{t("betaLang.notice")}</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.85 }}>{t("betaLang.reason")}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <a href="mailto:support@nwtprogress.com?subject=Translation%20Suggestion" className="al-beta-link">{t("betaLang.suggest")}</a>
              <button className="al-beta-dismiss" onClick={() => { localStorage.setItem("nwt-beta-lang-dismissed", "1"); window.location.reload(); }}>{t("betaLang.dismiss")}</button>
            </div>
          </div>
        )}
        {children}
      </div>

      {rightPanel && (
        <aside className="al-right" aria-label="Contextual widgets">
          {rightPanel}
        </aside>
      )}

    </div>
  );
}
