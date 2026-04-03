// @ts-nocheck
import { useState } from "react";
import { useFullProfile } from "../hooks/useAdmin";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useUnreadNotificationCount } from "../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import "../styles/topbar.css";

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: { language?: string; changeLanguage: (lang: string) => void };
  user?: { id?: string; email?: string } | null;
  onLogout?: () => void;
  currentPage: string;
  onUpgrade?: () => void;
  onSearchClick?: () => void;
}

export default function TopBar({
  navigate, darkMode, setDarkMode, user, currentPage, onSearchClick, notificationDropdown
}: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const unreadNotifs = useUnreadNotificationCount(user?.id);
  const [showNotifs, setShowNotifs] = useState(false);

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "?";
  const initials = displayName[0]?.toUpperCase() ?? "?";

  function handleSearchClick() {
    if (onSearchClick) {
      onSearchClick();
    } else {
      navigate("search");
    }
  }

  return (
    <>
      <header className="topbar" role="banner">
        {/* Left: logo */}
        <button className="topbar-logo" onClick={() => navigate("home")} aria-label="Go to home">
          <span className="topbar-logo-icon"><LogoIcon /></span>
          <span className="topbar-wordmark">NWT Progress</span>
        </button>

        {/* Center: search */}
        <div className="topbar-search">
          <button
            className="topbar-search-btn"
            onClick={handleSearchClick}
            aria-label="Search or open command palette"
          >
            <SearchIcon />
            Search…
            <span className="topbar-search-shortcut">⌘K</span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="topbar-actions">
          {/* Theme toggle */}
          {setDarkMode && (
            <button
              className="topbar-btn"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          )}

          {/* Messages */}
          <button
            className="topbar-btn"
            onClick={() => navigate("messages")}
            aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ""}`}
          >
            <MessageIcon />
            {unreadMessages > 0 && (
              <span className="topbar-btn-badge" aria-hidden="true">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </button>

          {/* Notifications bell */}
          <button
            className="topbar-btn"
            onClick={() => setShowNotifs(v => !v)}
            aria-label={`Notifications${unreadNotifs > 0 ? ` (${unreadNotifs} unread)` : ""}`}
            aria-expanded={showNotifs}
          >
            <BellIcon />
            {unreadNotifs > 0 && (
              <span className="topbar-btn-badge" aria-hidden="true">
                {unreadNotifs > 99 ? "99+" : unreadNotifs}
              </span>
            )}
          </button>

          {/* User avatar */}
          <button
            className="topbar-avatar"
            onClick={() => navigate("profile")}
            aria-label={`Go to profile: ${displayName}`}
            style={{ background: "linear-gradient(135deg, #4f2d85, #7c3aed)", border: "2px solid rgba(138,75,255,0.3)" }}
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={displayName} />
              : initials}
          </button>
        </div>
      </header>
      {showNotifs && (
        <NotificationDropdown
          userId={user?.id}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </>
  );
}
