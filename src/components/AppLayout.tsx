import { useTranslation } from "react-i18next";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";
import { useFullProfile } from "../hooks/useAdmin";
import "../styles/app-layout.css";

const NAV_CORE: { key: string; labelKey: string; bg: string; subLabel?: string; icon: React.ReactNode }[] = [
  { key: "home",        labelKey: "nav.home",        bg: "#5b21b6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: "main",        labelKey: "nav.bibleTracker", bg: "#7c3aed",
    icon: <svg width="18" height="18" viewBox="0 1 24 20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v11H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v11h10z"/><polyline points="8 11 11 14.5 17 7.5" stroke="#a78bfa" strokeWidth="2.5" fill="none"/></svg> },
  { key: "studyTopics", labelKey: "nav.study",        bg: "#2e9e6b", subLabel: "Topics · Books · Notes · Plans",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { key: "quiz",        labelKey: "nav.practice",     bg: "#374151", subLabel: "Quiz · Advanced · Meeting Prep",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
];

const NAV_COMMUNITY: { key: string; labelKey: string; bg: string; subLabel?: string; icon: React.ReactNode }[] = [
  { key: "forum",    labelKey: "nav.forum",    bg: "#e05c2a",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { key: "friends",  labelKey: "nav.friends",  bg: "#1d7ea6",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: "messages", labelKey: "nav.messages", bg: "#7c3aed",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
];

const NAV_EXPLORE: { key: string; labelKey: string; bg: string; subLabel?: string; icon: React.ReactNode }[] = [
  { key: "blog",        labelKey: "nav.blogVideos",  bg: "#c084fc",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  { key: "leaderboard", labelKey: "nav.leaderboard", bg: "#f59e0b",
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17v4m4-8v8m4-12v12M2 20h20"/></svg> },
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

  const activeKey = currentPage === "friendRequests"   ? "friends"
                  : currentPage === "publicProfile"    ? "profile"
                  : currentPage === "groupDetail"      ? "friends"
                  : currentPage === "studyTopicDetail" ? "studyTopics"
                  : currentPage === "bookDetail"       ? "studyTopics"
                  : currentPage === "studyNotes"       ? "studyTopics"
                  : currentPage === "readingPlans"     ? "studyTopics"
                  : currentPage === "advancedQuiz"     ? "quiz"
                  : currentPage === "meetingPrep"      ? "quiz"
                  : currentPage === "trivia"           ? "quiz"
                  : currentPage === "familyQuiz"       ? "quiz"
                  : currentPage === "videos"           ? "blog"
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

        <div className="al-section-label">{t("nav.core", "Core")}</div>
        {NAV_CORE.map(item => (
          <button
            key={item.key}
            className={`al-item${activeKey === item.key ? " al-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={activeKey === item.key ? "page" : undefined}
          >
            <span className="al-icon" style={{ background: item.bg }}>{item.icon}</span>
            <span className="al-item-label">
              {t(item.labelKey, item.key)}
              {item.subLabel && <span className="al-sublabel">{item.subLabel}</span>}
            </span>
          </button>
        ))}

        <div className="al-divider" />
        <div className="al-section-label">{t("nav.community", "Community")}</div>
        {NAV_COMMUNITY.map(item => (
          <button
            key={item.key}
            className={`al-item${activeKey === item.key ? " al-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={activeKey === item.key ? "page" : undefined}
          >
            <span className="al-icon" style={{ background: item.bg }}>{item.icon}</span>
            <span className="al-item-label">{t(item.labelKey, item.key)}</span>
            {item.key === "friends"  && pendingRequests > 0 && <span className="al-badge">{pendingRequests > 99 ? "99+" : pendingRequests}</span>}
            {item.key === "messages" && unreadMessages  > 0 && <span className="al-badge">{unreadMessages  > 99 ? "99+" : unreadMessages}</span>}
          </button>
        ))}

        <div className="al-divider" />
        <div className="al-section-label">{t("nav.explore", "Explore")}</div>
        {NAV_EXPLORE.map(item => (
          <button
            key={item.key}
            className={`al-item${activeKey === item.key ? " al-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={activeKey === item.key ? "page" : undefined}
          >
            <span className="al-icon" style={{ background: item.bg }}>{item.icon}</span>
            <span className="al-item-label">{t(item.labelKey, item.key)}</span>
          </button>
        ))}

      </aside>

      <div key={currentPage} className="al-content">
        {showBetaBanner && (
          <div className="al-beta-banner">
            <p>{t("betaLang.notice")}</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.85 }}>{t("betaLang.reason")}</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
              <a href="mailto:support@jwstudy.org?subject=Translation%20Suggestion" className="al-beta-link">{t("betaLang.suggest")}</a>
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
