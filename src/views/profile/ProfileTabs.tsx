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
    <div className="profile-tabs flex gap-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--card-bg)]">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`relative shrink-0 flex-1 cursor-pointer border-none bg-transparent px-3 py-3 text-center text-[13px] font-bold whitespace-nowrap transition-colors sm:px-6 ${
            activeTab === tab.key
              ? "text-[#a78bfa]"
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
