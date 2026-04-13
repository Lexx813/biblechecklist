import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUsers } from "../../hooks/useAdmin";
import { useReports } from "../../hooks/useReports";
import "../../styles/admin.css";
import { AdminSkeleton, UsersTab, MONTHLY_PRICE } from "./tabs/UsersTab";
import { ReportsTab, BlogTab, ForumTab, ForumCategoriesTab, BlogCommentsTab } from "./tabs/ModerationTabs";
import { QuizTab, QuizStatsTab } from "./tabs/QuizTabs";
import { AnnouncementsTab } from "./tabs/AnnouncementsTab";
import { AuditLogTab } from "./tabs/AuditLogTab";
import { VideosTab, CreatorsTab } from "./tabs/VideosAdminTabs";

export default function AdminPage({ currentUser, currentProfile, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const isCurrentUserAdmin = currentProfile?.is_admin;
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: reports = [], isLoading: reportsLoading } = useReports();
  const { t } = useTranslation();

  const [tab, setTab] = useState(() => isCurrentUserAdmin ? "users" : "reports");

  if ((isCurrentUserAdmin && usersLoading) || reportsLoading) {
    return (
      <div className="admin-wrap">
        <AdminSkeleton />
      </div>
    );
  }

  const adminCount   = users.filter(u => u.is_admin).length;
  const blogCount    = users.filter(u => u.can_blog).length;
  const subCount     = users.filter(u => u.subscription_status === "active" || u.subscription_status === "trialing").length;
  const giftedCount  = users.filter(u => u.subscription_status === "gifted").length;
  const bannedCount  = users.filter(u => u.is_banned).length;
  const pendingCount = reports.filter(r => r.status === "pending").length;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentSignups = users.filter(u => new Date(u.created_at) > sevenDaysAgo).length;
  const mrr = (subCount * MONTHLY_PRICE).toFixed(2);

  return (
    <div className="admin-wrap">

      <div className="admin-content">
        {/* Stats — admin only */}
        {isCurrentUserAdmin && (
          <div className="admin-stats">
            <div className="admin-stat-card">
              <div className="admin-stat-value">{users.length}</div>
              <div className="admin-stat-label">{t("admin.totalUsers")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{adminCount}</div>
              <div className="admin-stat-label">{t("admin.admins")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{users.length - adminCount}</div>
              <div className="admin-stat-label">{t("admin.members")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{blogCount}</div>
              <div className="admin-stat-label">{t("admin.blogWriters")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{subCount}</div>
              <div className="admin-stat-label">{t("admin.subscribers")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{giftedCount}</div>
              <div className="admin-stat-label">{t("admin.gifted")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{bannedCount}</div>
              <div className="admin-stat-label">{t("admin.banned")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">+{recentSignups}</div>
              <div className="admin-stat-label">{t("admin.recentSignups")}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">${mrr}</div>
              <div className="admin-stat-label">{t("admin.mrr")}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "users" ? " admin-tab--active" : ""}`} onClick={() => setTab("users")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {t("adminTabs.users")}
            </button>
          )}
          <button className={`admin-tab${tab === "reports" ? " admin-tab--active" : ""}`} onClick={() => setTab("reports")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            {t("adminTabs.reports")}
            {pendingCount > 0 && <span className="admin-tab-badge">{pendingCount}</span>}
          </button>
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "blog" ? " admin-tab--active" : ""}`} onClick={() => setTab("blog")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {t("adminTabs.blog")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "comments" ? " admin-tab--active" : ""}`} onClick={() => setTab("comments")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {t("adminTabs.comments")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "forum" ? " admin-tab--active" : ""}`} onClick={() => setTab("forum")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>
              {t("adminTabs.forum")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "quiz" ? " admin-tab--active" : ""}`} onClick={() => setTab("quiz")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              {t("adminTabs.quiz")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "quizStats" ? " admin-tab--active" : ""}`} onClick={() => setTab("quizStats")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              {t("adminTabs.quizStats")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "forumCats" ? " admin-tab--active" : ""}`} onClick={() => setTab("forumCats")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {t("adminTabs.forumCats")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "announcements" ? " admin-tab--active" : ""}`} onClick={() => setTab("announcements")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {t("adminTabs.announcements")}
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "auditLog" ? " admin-tab--active" : ""}`} onClick={() => setTab("auditLog")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Audit Log
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "creators" ? " admin-tab--active" : ""}`} onClick={() => setTab("creators")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
              Creators
            </button>
          )}
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "videos" ? " admin-tab--active" : ""}`} onClick={() => setTab("videos")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
              Videos
            </button>
          )}
        </div>

        {/* Tab content */}
        {tab === "users"         && isCurrentUserAdmin && <UsersTab currentUser={currentUser} navigate={navigate} />}
        {tab === "reports"       && <div className="admin-section"><ReportsTab navigate={navigate} /></div>}
        {tab === "blog"          && isCurrentUserAdmin && <div className="admin-section"><BlogTab navigate={navigate} /></div>}
        {tab === "comments"      && isCurrentUserAdmin && <div className="admin-section"><BlogCommentsTab /></div>}
        {tab === "forum"         && isCurrentUserAdmin && <div className="admin-section"><ForumTab navigate={navigate} /></div>}
        {tab === "quiz"          && isCurrentUserAdmin && <div className="admin-section" style={{padding: 20}}><QuizTab /></div>}
        {tab === "quizStats"     && isCurrentUserAdmin && <div className="admin-section"><QuizStatsTab /></div>}
        {tab === "forumCats"     && isCurrentUserAdmin && <div className="admin-section"><ForumCategoriesTab /></div>}
        {tab === "announcements" && isCurrentUserAdmin && <div className="admin-section" style={{padding: 20}}><AnnouncementsTab currentUser={currentUser} /></div>}
        {tab === "auditLog"      && isCurrentUserAdmin && <div className="admin-section"><AuditLogTab /></div>}
        {tab === "creators"      && isCurrentUserAdmin && <CreatorsTab />}
        {tab === "videos"        && isCurrentUserAdmin && <div className="admin-section"><VideosTab /></div>}
      </div>
    </div>
  );
}
