import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "../styles/pagenav.css";
import AnnouncementBanner from "./AnnouncementBanner";
import NotificationBell from "./notifications/NotificationBell";
import { LANGUAGES } from "../i18n";
import { useClickOutside } from "../hooks/useClickOutside";
import { useFullProfile } from "../hooks/useAdmin";
import { useSubscription } from "../hooks/useSubscription";
import { useUnreadMessageCount } from "../hooks/useMessages";

const FLAGS = { en: "🇺🇸", es: "🇪🇸", pt: "🇧🇷", tl: "🇵🇭", fr: "🇫🇷", zh: "🇨🇳" };

export default function PageNav({ navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage, onUpgrade }) {
  const { t } = useTranslation();
  const { data: profile } = useFullProfile(user?.id);
  const isAdmin = profile?.is_admin;
  const canModerate = isAdmin || profile?.is_moderator;
  const { isPremium } = useSubscription(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const communityRef = useRef(null);
  const langRef = useRef(null);

  const currentLangCode = i18n
    ? (LANGUAGES.find(l => i18n.language?.split("-")[0]?.startsWith(l.code))?.code ?? "en")
    : "en";

  const morePages = new Set(["about", "admin"]);
  const moreActive = morePages.has(currentPage);
  const communityPages = new Set(["blog", "forum"]);
  const communityActive = communityPages.has(currentPage);

  function go(page) {
    setMenuOpen(false);
    navigate(page);
  }

  useClickOutside(menuRef,      menuOpen,      () => setMenuOpen(false));
  useClickOutside(moreRef,      moreOpen,      () => setMoreOpen(false));
  useClickOutside(communityRef, communityOpen, () => setCommunityOpen(false));
  useClickOutside(langRef,      langOpen,      () => setLangOpen(false));

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handler() { if (window.innerWidth > 1180) setMenuOpen(false); }
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <>
      <nav className="page-nav" ref={menuRef}>
        <button className="page-nav-brand" onClick={() => go("home")}>
          <span className="page-nav-brand-icon">📖</span>
          <span className="page-nav-brand-name">NWT Progress</span>
        </button>

        {/* Desktop links */}
        <div className="page-nav-links">
          <button className={`page-nav-link${currentPage === "home" ? " page-nav-link--active" : ""}`} onClick={() => go("home")}>{t("app.home")}</button>
          <button className={`page-nav-link${currentPage === "main" ? " page-nav-link--active" : ""}`} onClick={() => go("main")}>{t("home.navTracker")}</button>
          <button className={`page-nav-link${currentPage === "quiz" ? " page-nav-link--active" : ""}`} onClick={() => go("quiz")}>{t("quiz.nav")}</button>
          <button className={`page-nav-link${currentPage === "aiTools" ? " page-nav-link--active" : ""}`} onClick={() => go("aiTools")}>✨ {t("nav.aiTools", "AI Tools")}</button>

          {/* Community dropdown */}
          <div className="page-nav-more" ref={communityRef}>
            <button
              className={`page-nav-link page-nav-more-btn${communityActive ? " page-nav-link--active" : ""}${communityOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setCommunityOpen(o => !o)}
            >
              {t("nav.community")} ▾
            </button>
            {communityOpen && (
              <div className="page-nav-more-menu">
                <button className={`page-nav-more-item${currentPage === "blog" ? " page-nav-more-item--active" : ""}`} onClick={() => { setCommunityOpen(false); go("blog"); }}>{t("app.blog")}</button>
                <button className={`page-nav-more-item${currentPage === "forum" ? " page-nav-more-item--active" : ""}`} onClick={() => { setCommunityOpen(false); go("forum"); }}>{t("app.forum")}</button>
              </div>
            )}
          </div>

          {/* More dropdown */}
          <div className="page-nav-more" ref={moreRef}>
            <button
              className={`page-nav-link page-nav-more-btn${moreActive ? " page-nav-link--active" : ""}${moreOpen ? " page-nav-more-btn--open" : ""}`}
              onClick={() => setMoreOpen(o => !o)}
            >
              {t("nav.more")} ▾
            </button>
            {moreOpen && (
              <div className="page-nav-more-menu">
                <button className={`page-nav-more-item${currentPage === "about" ? " page-nav-more-item--active" : ""}`} onClick={() => { setMoreOpen(false); go("about"); }}>{t("app.about")}</button>
                {canModerate && <button className={`page-nav-more-item${currentPage === "admin" ? " page-nav-more-item--active" : ""}`} onClick={() => { setMoreOpen(false); go("admin"); }}>{isAdmin ? t("app.admin") : "Moderation"}</button>}
              </div>
            )}
          </div>
        </div>

        <div className="page-nav-actions">
          {user && (
            <div className="page-nav-dev-icons">
              <button className={`page-nav-icon-btn${currentPage === "feed" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("feed")} data-tip={t("feed.navLink")}>📰</button>
              <button className={`page-nav-icon-btn${currentPage === "bookmarks" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("bookmarks")} data-tip={t("bookmarks.title")}>🔖</button>
              {isPremium
                ? <button className={`page-nav-icon-btn${currentPage === "readingPlans" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("readingPlans")} data-tip={t("nav.readingPlans")}>📅</button>
                : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip={t("nav.proFeature")} onClick={onUpgrade}>📅</button>}
              {isPremium
                ? <button className={`page-nav-icon-btn${currentPage === "studyNotes" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("studyNotes")} data-tip={t("nav.studyNotes")}>📝</button>
                : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip={t("nav.proFeature")} onClick={onUpgrade}>📝</button>}
            </div>
          )}
          {user && (
            isPremium
              ? <button className={`page-nav-icon-btn${currentPage === "messages" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("messages")} data-tip={t("nav.messages")} style={{ position: "relative" }}>
                  💬
                  {unreadMessages > 0 && <span className="page-nav-msg-badge">{unreadMessages}</span>}
                </button>
              : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn" data-tip={t("nav.proFeature")} style={{ position: "relative" }} onClick={onUpgrade}>
                  💬
                </button>
          )}
          {user && (
            isPremium
              ? <button className={`page-nav-icon-btn page-nav-collapses${currentPage === "groups" || currentPage === "groupDetail" ? " page-nav-icon-btn--active" : ""}`} onClick={() => go("groups")} data-tip={t("nav.studyGroups")}>👥</button>
              : <button className="page-nav-icon-btn page-nav-icon-btn--locked page-nav-pro-btn page-nav-collapses" data-tip={t("nav.proFeature")} onClick={onUpgrade}>👥</button>
          )}
          {user && (
            <button
              className="page-nav-icon-btn"
              onClick={() => go("search")}
              data-tip={t("search.placeholder")}
            >
              🔍
            </button>
          )}
          {user && <NotificationBell userId={user.id} navigate={navigate} />}
          {setDarkMode && (
            <button
              className="page-nav-icon-btn"
              onClick={() => setDarkMode(d => !d)}
              data-tip={darkMode ? t("app.lightMode") : t("app.darkMode")}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          )}
          {i18n && (
            <div className="page-nav-lang-picker" ref={langRef}>
              <button
                className={`page-nav-icon-btn page-nav-lang-btn${langOpen ? " page-nav-icon-btn--active" : ""}`}
                onClick={() => setLangOpen(o => !o)}
                data-tip={t("nav.language")}
              >
                {FLAGS[currentLangCode]}
              </button>
              {langOpen && (
                <div className="page-nav-lang-menu">
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      className={`page-nav-lang-item${l.code === currentLangCode ? " page-nav-lang-item--active" : ""}`}
                      onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                    >
                      <span>{FLAGS[l.code]}</span>
                      <span>{l.label}</span>
                      {l.code === currentLangCode && <span className="page-nav-lang-check">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {user && onLogout && (
            <button
              className="page-nav-icon-btn page-nav-logout-btn page-nav-logout-desktop"
              onClick={onLogout}
              title={t("app.logOut")}
            >
              {t("app.logOut")}
            </button>
          )}
          {user && (
            <button
              className="page-nav-avatar-btn"
              onClick={() => go("profile")}
              title={profile?.display_name || user.email}
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} className="page-nav-avatar-img" alt="avatar" />
                : <span className="page-nav-avatar-initials">
                    {(profile?.display_name || user.email)?.[0]?.toUpperCase()}
                  </span>
              }
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            className={`page-nav-hamburger${menuOpen ? " is-open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="page-nav-mobile-menu">
            <button className={`page-nav-mobile-link${currentPage === "home" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("home")}>{t("app.home")}</button>
            <button className={`page-nav-mobile-link${currentPage === "main" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("main")}>{t("home.navTracker")}</button>
            <button className={`page-nav-mobile-link${currentPage === "quiz" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("quiz")}>{t("quiz.nav")}</button>
            <button className={`page-nav-mobile-link${currentPage === "aiTools" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("aiTools")}>✨ {t("nav.aiTools", "AI Tools")}</button>

            <div className="page-nav-mobile-section-label">{t("nav.community")}</div>
            <button className={`page-nav-mobile-link${currentPage === "blog" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("blog")}>{t("app.blog")}</button>
            <button className={`page-nav-mobile-link${currentPage === "forum" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("forum")}>{t("app.forum")}</button>
            <button className={`page-nav-mobile-link${currentPage === "about" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("about")}>{t("app.about")}</button>
            {canModerate && (
              <button className={`page-nav-mobile-link${currentPage === "admin" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("admin")}>
                {isAdmin ? t("app.admin") : "Moderation"}
              </button>
            )}
            <div className="page-nav-mobile-section-label">{t("nav.tools")}</div>
            <button className={`page-nav-mobile-link${currentPage === "feed" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("feed")}>📰 {t("feed.navLink")}</button>
            <button className={`page-nav-mobile-link${currentPage === "bookmarks" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("bookmarks")}>🔖 {t("bookmarks.title")}</button>
            <button className={`page-nav-mobile-link${currentPage === "leaderboard" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("leaderboard")}>🏆 {t("leaderboard.title")}</button>

            {isPremium ? (
              <>
                <div className="page-nav-mobile-section-label">{t("nav.premium")}</div>
                <button className={`page-nav-mobile-link${currentPage === "messages" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("messages")}>
                  💬 {t("nav.messages")} {unreadMessages > 0 && <span className="page-nav-mobile-badge">{unreadMessages}</span>}
                </button>
                <button className={`page-nav-mobile-link${currentPage === "groups" || currentPage === "groupDetail" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("groups")}>👥 {t("nav.studyGroups")}</button>
                <button className={`page-nav-mobile-link${currentPage === "readingPlans" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("readingPlans")}>📅 {t("nav.readingPlans")}</button>
                <button className={`page-nav-mobile-link${currentPage === "studyNotes" ? " page-nav-mobile-link--active" : ""}`} onClick={() => go("studyNotes")}>📝 {t("nav.studyNotes")}</button>
              </>
            ) : (
              <>
                <div className="page-nav-mobile-section-label page-nav-mobile-section-label--locked">{t("nav.premium")} ✦</div>
                <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}>💬 {t("nav.messages")} <span className="page-nav-mobile-lock">🔒</span></button>
                <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}>👥 {t("nav.studyGroups")} <span className="page-nav-mobile-lock">🔒</span></button>
                <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}>📅 {t("nav.readingPlans")} <span className="page-nav-mobile-lock">🔒</span></button>
                <button className="page-nav-mobile-link page-nav-mobile-link--locked" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}>📝 {t("nav.studyNotes")} <span className="page-nav-mobile-lock">🔒</span></button>
                <button className="page-nav-mobile-upgrade-btn" onClick={() => { setMenuOpen(false); onUpgrade?.(); }}>✦ Upgrade to Premium — $3/mo</button>
              </>
            )}

            <div className="page-nav-mobile-divider" />
            {user && onLogout && (
              <button className="page-nav-mobile-link page-nav-mobile-logout" onClick={() => { setMenuOpen(false); onLogout(); }} style={{ marginTop: 4 }}>
                {t("app.logOut")}
              </button>
            )}
          </div>
        )}
      </nav>
      <AnnouncementBanner />
    </>
  );
}
