import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMeta } from "../../hooks/useMeta";
import { useFullProfile } from "../../hooks/useAdmin";
import { useProgress, useReadingStreak } from "../../hooks/useProgress";
import { useQuizProgress } from "../../hooks/useQuiz";
import { useUserForumStats } from "../../hooks/useForum";
import { useSubscription } from "../../hooks/useSubscription";
import { useBadges } from "../../hooks/useBadges";
import "../../styles/profile.css";
import "../../styles/social.css";
import "../../styles/gamification.css";
import ReferralPanel from "../../components/ReferralPanel";
import ProfileFriendsTab from "./ProfileFriendsTab";
import { useBlocks, useMyBlocks } from "../../hooks/useBlocks";
import CoverPhoto from "./CoverPhoto";
import ProfileHeader from "./ProfileHeader";
import ProfileTabs from "./ProfileTabs";
import PostsTab from "./tabs/PostsTab";
import AboutTab from "./tabs/AboutTab";
import AchievementsTab from "./tabs/AchievementsTab";
import NotesTab from "./tabs/NotesTab";

// ── Main ProfilePage ──────────────────────────────────────
export default function ProfilePage({ user, viewedUserId, isOwner = true, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade, defaultTab = "posts" }) {
  const profileId = viewedUserId ?? user.id;
  const { isPremium } = useSubscription(user.id);
  const { data: blockedSet = new Set<string>() } = useBlocks(user.id);
  const { data: myBlocks = [] } = useMyBlocks(user.id);
  const { data: profile, isLoading: profileLoading } = useFullProfile(profileId);
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
        <CoverPhoto
          coverUrl={profile?.cover_url ?? null}
          userId={profileId}
          isOwner={isOwner}
          onSettingsClick={() => navigate("settings")}
        />

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

          {activeTab === "friends" && !isViewedUserBlocked && (
            <ProfileFriendsTab user={{ ...user, id: profileId }} navigate={navigate} isPremium={isPremium} onUpgrade={onUpgrade} isOwner={isOwner} />
          )}

          {activeTab === "achievements" && !isViewedUserBlocked && (
            <AchievementsTab userId={profileId} quizProgress={quizProgress} earnedBadges={earnedBadges} streak={streak} readingProgress={readingProgress} />
          )}

          {activeTab === "notes" && isOwner && (
            <NotesTab userId={profileId} />
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
