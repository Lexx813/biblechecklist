import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "../i18n";
import { useFullProfile } from "../hooks/useAdmin";
import { useUnreadMessageCount } from "../hooks/useMessages";
import { useUnreadNotificationCount } from "../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import "../styles/topbar.css";

const FLAGS: Record<string, string> = { en: "🇺🇸", es: "🇪🇸", pt: "🇧🇷", tl: "🇵🇭", fr: "🇫🇷", zh: "🇨🇳", ja: "🇯🇵", ko: "🇰🇷" };

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
const FeedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>
  </svg>
);
const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
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
  onSearchClick?: () => void;
}

export default function TopBar({
  navigate, darkMode, setDarkMode, user, currentPage, onSearchClick, onLogout
}: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const unreadNotifs = useUnreadNotificationCount(user?.id);
  const [showNotifs, setShowNotifs] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();
  const currentLang = LANGUAGES.find(l => i18n.language?.split("-")[0]?.startsWith(l.code))?.code ?? "en";

  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  useEffect(() => {
    if (!langOpen) return;
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [langOpen]);

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
        <button className="topbar-logo" onClick={() => navigate("home")} aria-label="JW Study, Go to home">
          <span className="topbar-logo-icon"><LogoIcon /></span>
          <span className="topbar-wordmark">JW Study</span>
        </button>

        {/* Center: search */}
        <div className="topbar-search">
          <button
            className="topbar-search-btn"
            onClick={handleSearchClick}
            aria-label="Search… (⌘K)"
          >
            <SearchIcon />
            Search…
            <span className="topbar-search-shortcut">⌘K</span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="topbar-actions">
          {/* Admin link, mobile only. Always rendered to prevent CLS; invisible for non-admins. */}
          <button
            className="topbar-btn topbar-btn--admin-mobile"
            onClick={() => navigate("admin")}
            aria-label="Admin panel"
            aria-hidden={!profile?.is_admin || undefined}
            tabIndex={profile?.is_admin ? 0 : -1}
            style={!profile?.is_admin ? { visibility: "hidden", pointerEvents: "none" } : undefined}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </button>

          {/* Post a Video, always rendered to prevent CLS; hidden for non-creators */}
          <button
            className="topbar-btn topbar-btn--nav"
            onClick={() => navigate("videosDash")}
            aria-label="Post a video"
            data-tip="Post a Video"
            aria-hidden={!(profile?.is_approved_creator || profile?.is_admin) || undefined}
            tabIndex={profile?.is_approved_creator || profile?.is_admin ? 0 : -1}
            style={!(profile?.is_approved_creator || profile?.is_admin) ? { visibility: "hidden", pointerEvents: "none" } : undefined}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          </button>

          {/* AI Study Companion, separate Next.js route, not a HOME_PANEL */}
          <a
            href="/ai"
            className="topbar-btn topbar-btn--nav topbar-btn--ai"
            aria-label="AI Study Companion"
            data-tip="AI Study Companion"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/>
              <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/>
            </svg>
            <span className="topbar-btn-ai-badge" aria-hidden="true">NEW</span>
          </a>

          {/* Songs, separate Next.js SSR route, not a HOME_PANEL */}
          <a
            href="/songs"
            className="topbar-btn topbar-btn--nav"
            aria-label="Songs"
            data-tip="Songs"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </a>

          {/* Feed */}
          <button
            className={`topbar-btn topbar-btn--nav${currentPage === "feed" ? " topbar-btn--active" : ""}`}
            onClick={() => navigate("feed")}
            aria-label="Feed"
            data-tip="Feed"
          >
            <FeedIcon />
          </button>

          {/* Bookmarks */}
          <button
            className={`topbar-btn topbar-btn--nav${currentPage === "bookmarks" ? " topbar-btn--active" : ""}`}
            onClick={() => navigate("bookmarks")}
            aria-label="Bookmarks"
            data-tip="Bookmarks"
          >
            <BookmarkIcon />
          </button>

          {/* Messages */}
          <button
            className={`topbar-btn${currentPage === "messages" ? " topbar-btn--active" : ""}`}
            onClick={() => navigate("messages")}
            aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ""}`}
            data-tip="Messages"
          >
            <MessageIcon />
            {unreadMessages > 0 && (
              <span className="topbar-btn-badge" aria-hidden="true">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            )}
          </button>

          {/* Language picker */}
          <div className="topbar-lang" ref={langRef}>
            <button
              className="topbar-btn"
              onClick={() => setLangOpen(o => !o)}
              aria-label="Change language"
              aria-expanded={langOpen}
              data-tip="Language"
            >
              <span style={{ fontSize: 16 }}>{FLAGS[currentLang] ?? "🌐"}</span>
            </button>
            {langOpen && (
              <div className="topbar-lang-menu" role="menu">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`topbar-lang-item${l.code === currentLang ? " topbar-lang-item--active" : ""}`}
                    role="menuitem"
                    onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                  >
                    <span aria-hidden="true">{FLAGS[l.code]}</span>
                    {l.label}
                    {l.code === currentLang && <span className="topbar-lang-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications bell */}
          <button
            className="topbar-btn"
            onClick={() => setShowNotifs(v => !v)}
            aria-label={`Notifications${unreadNotifs > 0 ? ` (${unreadNotifs} unread)` : ""}`}
            aria-expanded={showNotifs}
            data-tip="Notifications"
          >
            <BellIcon />
            {unreadNotifs > 0 && (
              <span className="topbar-btn-badge" aria-hidden="true">
                {unreadNotifs > 99 ? "99+" : unreadNotifs}
              </span>
            )}
          </button>

          {/* User avatar + dropdown */}
          <div className="topbar-avatar-wrap" ref={avatarRef}>
            <button
              className="topbar-avatar"
              onClick={() => setAvatarOpen(o => !o)}
              aria-label={`Account menu for ${displayName}`}
              aria-expanded={avatarOpen}
              style={{ background: "linear-gradient(135deg, #4f2d85, #7c3aed)", border: "2px solid rgba(138,75,255,0.3)" }}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} width={32} height={32} />
                : initials}
            </button>
            {avatarOpen && (
              <div className="topbar-avatar-menu" role="menu">
                <a className="topbar-avatar-item topbar-avatar-item--ai" role="menuitem" href="/ai" onClick={() => setAvatarOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/>
                    <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/>
                  </svg>
                  AI Companion
                  <span className="topbar-avatar-item-badge" aria-hidden="true">NEW</span>
                </a>
                <a className="topbar-avatar-item" role="menuitem" href="/songs" onClick={() => setAvatarOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                  Songs
                </a>
                <div className="topbar-avatar-divider" />
                <button className="topbar-avatar-item" role="menuitem" onClick={() => { setAvatarOpen(false); navigate("profile"); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </button>
                <button className="topbar-avatar-item" role="menuitem" onClick={() => { setAvatarOpen(false); navigate("settings"); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </button>
                <div className="topbar-avatar-divider" />
                {setDarkMode && (
                  <button className="topbar-avatar-item" role="menuitem" onClick={() => { setDarkMode(!darkMode); }}>
                    {darkMode
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    }
                    {darkMode ? "Light mode" : "Dark mode"}
                  </button>
                )}
                <div className="topbar-avatar-divider" />
                <button className="topbar-avatar-item topbar-avatar-item--danger" role="menuitem" onClick={() => { setAvatarOpen(false); onLogout?.(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showNotifs && (
        <NotificationDropdown
          userId={user?.id}
          onClose={() => setShowNotifs(false)}
          navigate={navigate}
        />
      )}
    </>
  );
}
