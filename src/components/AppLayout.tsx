import { useTranslation } from "react-i18next";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";
import { useFullProfile } from "../hooks/useAdmin";
import "../styles/app-layout.css";

const NAV_CORE: { key: string; labelKey: string; bg: string; subLabel?: string; icon: React.ReactNode }[] = [
  { key: "home", labelKey: "nav.home", bg: "#5b21b6",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-home" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#5b21b6"/></linearGradient></defs><path d="M12 3L2 12h3v9h5v-5h4v5h5v-9h3L12 3z" fill="url(#g-home)"/></svg> },
  { key: "main", labelKey: "nav.bibleTracker", bg: "#7c3aed",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-bible" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#0d9488"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V20H3V5z" fill="url(#g-bible)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V20h9V5z" fill="url(#g-bible)" opacity=".8"/><polyline points="6.5 11.5 9.5 14.5 16 8" fill="none" stroke="#f5f3ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { key: "studyTopics", labelKey: "nav.study", bg: "#059669", subLabel: "Topics · Books · Notes · Plans",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-study" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#065f46"/></linearGradient></defs><path d="M3 5h7.5a1.5 1.5 0 0 1 1.5 1.5V19a2.5 2.5 0 0 0-4.5-1.5H3V5z" fill="url(#g-study)"/><path d="M21 5h-7.5A1.5 1.5 0 0 0 12 6.5V19a2.5 2.5 0 0 1 4.5-1.5H21V5z" fill="url(#g-study)" opacity=".8"/></svg> },
  { key: "quiz", labelKey: "nav.practice", bg: "#4338ca", subLabel: "Quiz · Advanced · Meeting Prep",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-practice" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8"/><stop offset="100%" stopColor="#3730a3"/></linearGradient></defs><path d="M14.5 2L5.5 14h7l-3 8L20.5 10h-7L14.5 2z" fill="url(#g-practice)"/></svg> },
];

const NAV_COMMUNITY: { key: string; labelKey: string; bg: string; subLabel?: string; icon: React.ReactNode }[] = [
  { key: "forum", labelKey: "nav.forum", bg: "#ea580c",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-forum" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#c2410c"/></linearGradient></defs><path d="M21 3H3a1 1 0 0 0-1 1v14l5-4h14a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z" fill="url(#g-forum)"/><rect x="7" y="8" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/><rect x="7" y="11.5" width="6" height="1.5" rx=".75" fill="rgba(255,255,255,.45)"/></svg> },
  { key: "friends", labelKey: "nav.friends", bg: "#1d4ed8",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-friends" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#60a5fa"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient></defs><circle cx="9" cy="7" r="4" fill="url(#g-friends)"/><path d="M2 21a7 7 0 0 1 14 0z" fill="url(#g-friends)"/><circle cx="17.5" cy="8" r="3" fill="url(#g-friends)" opacity=".65"/><path d="M14 21a5.5 5.5 0 0 1 9 0z" fill="url(#g-friends)" opacity=".65"/></svg> },
  { key: "messages", labelKey: "nav.messages", bg: "#6d28d9",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-msgs" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#6d28d9"/></linearGradient></defs><rect x="2" y="4" width="20" height="16" rx="3" fill="url(#g-msgs)"/><path d="M2 8l10 7 10-7" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

const NAV_EXPLORE: { key: string; labelKey: string; bg: string; subLabel?: string; icon: React.ReactNode }[] = [
  { key: "blog", labelKey: "nav.blogVideos", bg: "#7c3aed",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-blog" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f0abfc"/><stop offset="100%" stopColor="#7c3aed"/></linearGradient></defs><rect x="4" y="2" width="13" height="20" rx="2" fill="url(#g-blog)"/><rect x="7" y="7" width="7" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="10.5" width="10" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/><rect x="7" y="14" width="5" height="1.5" rx=".75" fill="rgba(255,255,255,.55)"/></svg> },
  { key: "leaderboard", labelKey: "nav.leaderboard", bg: "#d97706",
    icon: <svg width="25" height="25" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="g-lb" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#fde68a"/></linearGradient></defs><rect x="3" y="13" width="5" height="9" rx="1.5" fill="url(#g-lb)" opacity=".75"/><rect x="9.5" y="8" width="5" height="14" rx="1.5" fill="url(#g-lb)"/><rect x="16" y="4" width="5" height="18" rx="1.5" fill="url(#g-lb)" opacity=".85"/></svg> },
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
            <span className="al-icon" style={{ color: item.bg }}>{item.icon}</span>
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
            <span className="al-icon">{item.icon}</span>
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
            <span className="al-icon">{item.icon}</span>
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
