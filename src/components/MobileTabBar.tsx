import { useUnreadMessageCount } from "../hooks/useMessages";
import { useFriendRequests } from "../hooks/useFriends";

const TAB_ITEMS = [
  { key: "home",     label: "Home",     icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { key: "main",     label: "Bible",    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { key: "messages", label: "Messages", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { key: "friends",  label: "Friends",  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key: "profile",  label: "Profile",  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
];

interface Props {
  navigate: (page: string) => void;
  currentPage: string;
  userId?: string;
}

export default function MobileTabBar({ navigate, currentPage, userId }: Props) {
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const { incoming } = useFriendRequests(userId ?? "");
  const pendingRequests = incoming.data?.length ?? 0;

  return (
    <nav className="mobile-tabbar" aria-label="Main navigation">
      {TAB_ITEMS.map(item => {
        const badge = item.key === "messages" ? (unreadMessages > 0 ? unreadMessages : null)
                    : item.key === "friends"  ? (pendingRequests > 0 ? pendingRequests : null)
                    : null;
        const isActive = currentPage === item.key;
        return (
          <button
            key={item.key}
            className={`mobile-tabbar-item${isActive ? " mobile-tabbar-item--active" : ""}`}
            onClick={() => navigate(item.key)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="mobile-tabbar-icon">
              {item.icon}
              {badge != null && <span className="mobile-tabbar-badge">{badge > 99 ? "99+" : badge}</span>}
            </span>
            <span className="mobile-tabbar-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
