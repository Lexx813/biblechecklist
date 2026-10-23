import { useTranslation } from "react-i18next";
import { makeTablistKeyHandler } from "../../lib/a11y/useTablistKeys";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOwner: boolean;
}

const TABS = [
  { key: "posts", label: "Posts" },
  { key: "about", label: "About" },
  { key: "friends", label: "Friends" },
  { key: "achievements", label: "Achievements" },
];

export default function ProfileTabs({ activeTab, onTabChange }: Props) {
  const { t } = useTranslation();
  const tabLabels: Record<string, string> = {
    posts: t("profile.tabPosts", "Posts"),
    about: t("profile.tabAbout", "About"),
    friends: t("profile.tabFriends", "Friends"),
    achievements: t("profile.tabAchievements", "Achievements"),
  };
  const tabs = TABS;
  const onKeyDown = makeTablistKeyHandler(tabs.map(tb => tb.key), activeTab, onTabChange);
  return (
    <div
      role="tablist"
      aria-label={t("profile.sectionsAria", "Profile sections")}
      className="profile-tabs flex gap-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--card-bg)]"
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          aria-controls="profile-tab-panel"
          id={`profile-tab-${tab.key}`}
          tabIndex={activeTab === tab.key ? 0 : -1}
          onKeyDown={onKeyDown}
          className={`relative shrink-0 flex-1 cursor-pointer border-none bg-transparent px-3 py-3 text-center text-[13px] font-bold whitespace-nowrap transition-colors sm:px-6 ${
            activeTab === tab.key
              ? "text-violet-600 dark:text-violet-300"
              : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          {tabLabels[tab.key] ?? tab.label}
          {activeTab === tab.key && <span className="pf-tab-indicator" />}
        </button>
      ))}
    </div>
  );
}
