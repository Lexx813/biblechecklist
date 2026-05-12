import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";
import MobileMoreSheet from "./MobileMoreSheet";

const tabBarClassName =
  "fixed inset-x-0 bottom-0 z-[200] hidden min-h-[var(--mobile-tabbar-h)] items-center gap-1 border-t border-[rgba(138,75,255,0.15)] bg-[var(--bg-elevated)] px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.24)] max-[1100px]:flex";

const tabItemBaseClassName =
  "relative flex min-h-[54px] min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-[3px] rounded-lg border-0 bg-transparent px-0.5 py-1 font-[inherit] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]";

const tabItemActiveClassName = "text-[var(--accent)]";

const tabIconBaseClassName =
  "relative flex h-7 w-[30px] items-center justify-center rounded-md";

const tabIconActiveClassName = "bg-[rgba(124,58,237,0.18)]";

const tabLabelClassName =
  "max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold leading-none";

const tabBadgeClassName =
  "absolute -right-2 -top-1 h-4 min-w-4 rounded-[var(--radius-sm)] bg-[#e03c3c] px-[3px] text-center text-[10px] font-bold leading-4 text-white";

const TAB_ITEMS = [
  {
    key: "home",
    labelKey: "nav.today",
    fallbackLabel: "Today",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 15h.01"/><path d="M12 15h.01"/><path d="M16 15h.01"/></svg>,
  },
  {
    key: "main",
    labelKey: "nav.bibleTracker",
    icon: <svg width="22" height="22" viewBox="0 1 24 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v11H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v11h10z"/><polyline points="8 11 11 14.5 17 7.5" stroke="#a78bfa" strokeWidth="2.5" fill="none"/></svg>,
  },
  {
    key: "meetingPrep",
    labelKey: "nav.study",
    fallbackLabel: "Study",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 7h7"/><path d="M9 11h5"/></svg>,
  },
  {
    key: "feed",
    labelKey: "nav.community",
    fallbackLabel: "Community",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    key: "more",
    labelKey: "nav.more",
    fallbackLabel: "More",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  },
];

// Pages that should highlight a given tab
const TAB_ACTIVE_MAP: Record<string, string> = {
  messages:         "feed",
  friends:          "feed",
  groups:           "feed",
  leaderboard:      "feed",
  forum:            "feed",
  forumThread:      "feed",
  trivia:           "feed",
  community:        "feed",
  studyTopics:      "meetingPrep",
  studyTopicDetail: "meetingPrep",
  bookDetail:       "main",
  studyNotes:       "meetingPrep",
  readingPlans:     "meetingPrep",
  readingHistory:   "main",
  bookmarks:        "meetingPrep",
  quiz:             "meetingPrep",
  advancedQuiz:     "meetingPrep",
  familyQuiz:       "meetingPrep",
  meetingPrep:      "meetingPrep",
  blog:             "more",
  blogDash:         "more",
  blogNew:          "more",
  blogEdit:         "more",
  videos:           "more",
  videoDetail:      "more",
  videosDash:       "more",
  creatorRequest:   "more",
  friendRequests:   "more",
  settings:         "more",
  profile:          "more",
  publicProfile:    "more",
  admin:            "more",
  about:            "more",
  terms:            "more",
  privacy:          "more",
};

interface Props {
  navigate: (page: string) => void;
  currentPage: string;
  userId?: string;
  isAdmin?: boolean;
  isModerator?: boolean;
}

export default function MobileTabBar({ navigate, currentPage, userId, isAdmin, isModerator }: Props) {
  const { t } = useTranslation();
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(userId);
  const pendingRequests = incoming.data?.length ?? 0;
  const [moreOpen, setMoreOpen] = useState(false);

  const activeKey = TAB_ACTIVE_MAP[currentPage] ?? currentPage;

  return (
    <>
      <nav className={tabBarClassName} aria-label="Main navigation">
        {TAB_ITEMS.map(item => {
          // Messages badge on Feed tab; pending friend requests badge on More tab
          const badge =
            item.key === "feed" ? (unreadMessages > 0 ? unreadMessages : null) :
            item.key === "more" ? (pendingRequests > 0 ? pendingRequests : null) :
            null;
          const isActive = activeKey === item.key || (item.key === "more" && moreOpen);
          return (
            <button
              key={item.key}
              className={`${tabItemBaseClassName}${isActive ? ` ${tabItemActiveClassName}` : ""}`}
              onClick={() => {
                if (item.key === "more") setMoreOpen(o => !o);
                else { setMoreOpen(false); navigate(item.key); }
              }}
              aria-current={isActive && item.key !== "more" ? "page" : undefined}
              aria-expanded={item.key === "more" ? moreOpen : undefined}
              aria-label={item.key === "more" ? t("mobileMore.dialogLabel", "More navigation") : undefined}
            >
              <span className={`${tabIconBaseClassName}${isActive ? ` ${tabIconActiveClassName}` : ""}`}>
                {item.icon}
                {badge != null && (
                  <span className={tabBadgeClassName} aria-label={`${badge > 99 ? "99+" : badge} unread notifications`}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span className={tabLabelClassName}>{t(item.labelKey, item.fallbackLabel ?? item.key)}</span>
            </button>
          );
        })}
      </nav>

      <MobileMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        navigate={navigate}
        userId={userId}
        isAdmin={isAdmin}
        isModerator={isModerator}
      />
    </>
  );
}
