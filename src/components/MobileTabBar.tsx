import { useTranslation } from "react-i18next";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";

const TAB_ITEMS = [
  { key: "home",        labelKey: "nav.home",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: "main",        labelKey: "nav.bibleTracker",
    icon: <svg width="22" height="22" viewBox="0 1 24 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v11H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v11h10z"/><polyline points="8 11 11 14.5 17 7.5" stroke="#a78bfa" strokeWidth="2.5" fill="none"/></svg> },
  { key: "studyTopics", labelKey: "nav.study",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { key: "quiz",        labelKey: "nav.quiz",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
  { key: "profile",     labelKey: "nav.me",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

// Pages that should highlight a given tab
const TAB_ACTIVE_MAP: Record<string, string> = {
  friendRequests:   "profile",
  messages:         "profile",
  publicProfile:    "profile",
  groupDetail:      "profile",
  studyTopicDetail: "studyTopics",
  bookDetail:       "studyTopics",
  studyNotes:       "studyTopics",
  readingPlans:     "studyTopics",
  advancedQuiz:     "quiz",
  meetingPrep:      "quiz",
  trivia:           "quiz",
  familyQuiz:       "quiz",
};

interface Props {
  navigate: (page: string) => void;
  currentPage: string;
  userId?: string;
}

export default function MobileTabBar({ navigate, currentPage, userId }: Props) {
  const { t } = useTranslation();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(userId);
  const pendingRequests = incoming.data?.length ?? 0;
  const combinedBadge = unreadMessages + pendingRequests;

  const activeKey = TAB_ACTIVE_MAP[currentPage] ?? currentPage;

  return (
    <nav className="mobile-tabbar" aria-label="Main navigation">
      {TAB_ITEMS.map(item => {
        const badge = item.key === "profile" ? (combinedBadge > 0 ? combinedBadge : null) : null;
        const isActive = activeKey === item.key;
        return (
          <button
            key={item.key}
            className={`mobile-tabbar-item${isActive ? " mobile-tabbar-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="mobile-tabbar-icon">
              {item.icon}
              {badge != null && (
                <span className="mobile-tabbar-badge" aria-label={`${badge > 99 ? "99+" : badge} unread notifications`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            <span className="mobile-tabbar-label">{t(item.labelKey, item.key)}</span>
          </button>
        );
      })}
    </nav>
  );
}
