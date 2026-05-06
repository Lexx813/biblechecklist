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
  const tabs = TABS;
  return (
    <div
      role="tablist"
      aria-label="Profile sections"
      className="profile-tabs flex gap-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--card-bg)]"
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          aria-controls="profile-tab-panel"
          id={`profile-tab-${tab.key}`}
          className={`relative shrink-0 flex-1 cursor-pointer border-none bg-transparent px-3 py-3 text-center text-[13px] font-bold whitespace-nowrap transition-colors sm:px-6 ${
            activeTab === tab.key
              ? "text-violet-600 dark:text-violet-300"
              : "text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          {activeTab === tab.key && <span className="pf-tab-indicator" />}
        </button>
      ))}
    </div>
  );
}
