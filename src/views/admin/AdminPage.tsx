// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import CustomSelect from "../../components/CustomSelect";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  useUsers, useDeleteUser, useSetAdmin, useSetModerator, useSetBlog,
  useCreateUser, useBanUser, useCancelSubscription, useGiftPremium,
  useAllBlogPosts, useAdminDeleteBlogPost,
  useAllForumThreads, useAdminDeleteForumThread, useAdminPinThread, useAdminLockThread,
  useAllComments, useAdminDeleteComment, useAdminQuizStats, useAdminAuditLog,
} from "../../hooks/useAdmin";

const MONTHLY_PRICE = 4.99;
import { useReports, useUpdateReport, useDeleteReport, useDeleteReportedContent } from "../../hooks/useReports";
import { useAllAnnouncements, useCreateAnnouncement, useToggleAnnouncement, useDeleteAnnouncement } from "../../hooks/useAnnouncements";
import { useAllQuizQuestions, useCreateQuizQuestion, useUpdateQuizQuestion, useDeleteQuizQuestion } from "../../hooks/useQuiz";
import { forumApi } from "../../api/forum";
import { useCategories } from "../../hooks/useForum";
import { useQueryClient } from "@tanstack/react-query";
import "../../styles/admin.css";
import { formatDate } from "../../utils/formatters";

function initials(email) {
  return email ? email[0].toUpperCase() : "?";
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
const USERS_PAGE_SIZE = 20;
const USER_FILTERS = ["all", "admins", "mods", "banned", "premium", "gifted"];

function exportUsersCSV(users) {
  const headers = ["Email", "Display Name", "Joined", "Role", "Subscription", "Banned", "Can Blog"];
  const rows = users.map(u => [
    u.email ?? "",
    u.display_name ?? "",
    new Date(u.created_at).toLocaleDateString(),
    u.is_admin ? "Admin" : u.is_moderator ? "Moderator" : "Member",
    u.subscription_status ?? "inactive",
    u.is_banned ? "Yes" : "No",
    u.can_blog ? "Yes" : "No",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function UserActionsDropdown({ user, currentUser, navigate, setAdmin, setModerator, setBlog, banUser, cancelSub, giftPremium, deleteUser, onToggleError, setConfirmDelete, setConfirmBan, setConfirmCancelSub, t }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (
        ref.current && !ref.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    }
    function handleScroll() { setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  function handleOpen() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(v => !v);
  }

  function action(fn) {
    setOpen(false);
    fn();
  }

  return (
    <div className="admin-dropdown" ref={ref}>
      <button ref={triggerRef} className="admin-dropdown-trigger" onClick={handleOpen} title={t("admin.colActions")}>
        ⋯
      </button>
      {open && createPortal(
        <div ref={menuRef} className="admin-dropdown-menu" style={{ position: "fixed", top: menuPos.top, right: menuPos.right, left: "auto" }}>
          <button className="admin-dropdown-item" onClick={() => action(() => navigate("publicProfile", { userId: user.id }))}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {t("admin.messageUser")}
          </button>
          <div className="admin-dropdown-sep" />
          <button className="admin-dropdown-item" onClick={() => action(() => setAdmin.mutate({ userId: user.id, value: !user.is_admin }, { onError: onToggleError }))} disabled={setAdmin.isPending}>
            {user.is_admin
              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg> {t("admin.removeAdmin")}</>
              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg> {t("admin.makeAdmin")}</>
            }
          </button>
          <button className={`admin-dropdown-item${user.is_moderator ? " admin-dropdown-item--active" : ""}`} onClick={() => action(() => setModerator.mutate({ userId: user.id, value: !user.is_moderator }, { onError: onToggleError }))} disabled={setModerator.isPending}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            {user.is_moderator ? t("admin.removeMod") : t("admin.makeMod")}
          </button>
          <button className={`admin-dropdown-item${user.can_blog ? " admin-dropdown-item--active" : ""}`} onClick={() => action(() => setBlog.mutate({ userId: user.id, value: !user.can_blog }, { onError: onToggleError }))} disabled={setBlog.isPending}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            {user.can_blog ? t("admin.writer") : t("admin.allowBlog")}
          </button>
          <div className="admin-dropdown-sep" />
          <button className={`admin-dropdown-item${user.subscription_status === "gifted" ? " admin-dropdown-item--active" : ""}`} onClick={() => action(() => giftPremium.mutate({ userId: user.id, value: user.subscription_status !== "gifted" }, { onError: onToggleError }))} disabled={giftPremium.isPending}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            {user.subscription_status === "gifted" ? t("admin.revokeGift") : t("admin.giftPremium")}
          </button>
          {(user.subscription_status === "active" || user.subscription_status === "trialing") && (
            <button className="admin-dropdown-item admin-dropdown-item--danger" onClick={() => action(() => setConfirmCancelSub(user))} disabled={cancelSub.isPending}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {t("admin.cancelSub")}
            </button>
          )}
          <div className="admin-dropdown-sep" />
          <button className={`admin-dropdown-item${user.is_banned ? " admin-dropdown-item--active" : " admin-dropdown-item--danger"}`} onClick={() => action(() => setConfirmBan(user))} disabled={banUser.isPending}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            {user.is_banned ? t("admin.unban") : t("admin.ban")}
          </button>
          <div className="admin-dropdown-sep" />
          <button className="admin-dropdown-item admin-dropdown-item--danger" onClick={() => action(() => setConfirmDelete(user))} disabled={deleteUser.isPending}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            {t("common.delete")}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function UsersTab({ currentUser, navigate }) {
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const setAdmin = useSetAdmin();
  const setModerator = useSetModerator();
  const setBlog = useSetBlog();
  const banUser = useBanUser();
  const createUser = useCreateUser();
  const cancelSub = useCancelSubscription();
  const giftPremium = useGiftPremium();
  const { t } = useTranslation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBan, setConfirmBan] = useState(null);
  const [confirmCancelSub, setConfirmCancelSub] = useState(null);
  const [toggleError, setToggleError] = useState("");
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  function onToggleError(err) {
    setToggleError(err.message || "Action failed. Please try again.");
    setTimeout(() => setToggleError(""), 4000);
  }

  function handleFilterChange(f) {
    setRoleFilter(f);
    setPage(0);
  }

  const filtered = users.filter(u => {
    const matchesSearch = !search.trim() ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (roleFilter === "admins")  return u.is_admin;
    if (roleFilter === "mods")    return u.is_moderator;
    if (roleFilter === "banned")  return u.is_banned;
    if (roleFilter === "premium") return u.subscription_status === "active" || u.subscription_status === "trialing";
    if (roleFilter === "gifted")  return u.subscription_status === "gifted";
    return true;
  });

  const totalPages = Math.ceil(filtered.length / USERS_PAGE_SIZE);
  const pageUsers = filtered.slice(page * USERS_PAGE_SIZE, (page + 1) * USERS_PAGE_SIZE);

  async function handleAddUser(e) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    if (!newEmail || !newPassword) return setAddError(t("admin.errorRequired"));
    if (newPassword.length < 8) return setAddError(t("admin.errorPasswordShort"));
    createUser.mutate({ email: newEmail, password: newPassword }, {
      onSuccess: () => {
        setAddSuccess(t("admin.inviteSent", { email: newEmail }));
        setNewEmail("");
        setNewPassword("");
      },
      onError: (err) => setAddError(err.message),
    });
  }

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2>{t("admin.usersSection")}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="admin-action-btn" onClick={() => exportUsersCSV(filtered)} title={t("admin.exportCSV")}>
            ⬇ {t("admin.exportCSV")}
          </button>
          <button className="admin-add-btn" onClick={() => { setShowAddForm(v => !v); setAddError(""); setAddSuccess(""); }}>
            {showAddForm ? t("common.cancel") : t("admin.addUser")}
          </button>
        </div>
      </div>

      {showAddForm && (
        <form className="admin-add-form" onSubmit={handleAddUser}>
          <input
            id="admin-new-email"
            name="email"
            className="admin-input"
            type="email"
            placeholder={t("admin.emailPlaceholder")}
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            disabled={createUser.isPending}
          />
          <input
            id="admin-new-password"
            name="password"
            className="admin-input"
            type="password"
            placeholder={t("admin.passwordPlaceholder")}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            disabled={createUser.isPending}
          />
          {addError && <div className="admin-form-error">{addError}</div>}
          {addSuccess && <div className="admin-form-success">{addSuccess}</div>}
          <button className="admin-submit-btn" type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? t("admin.creating") : t("admin.createUser")}
          </button>
        </form>
      )}

      {/* Search + filter */}
      <div className="admin-user-controls">
        <input
          className="admin-input admin-search-input"
          type="search"
          placeholder={t("admin.searchUsers")}
          aria-label={t("admin.searchUsers")}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <div className="admin-filter-pills">
          {USER_FILTERS.map(f => (
            <button
              key={f}
              className={`admin-filter-pill${roleFilter === f ? " admin-filter-pill--active" : ""}`}
              onClick={() => handleFilterChange(f)}
            >
              {t(`admin.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            </button>
          ))}
        </div>
      </div>

      {toggleError && <div className="admin-form-error" style={{ marginBottom: 12 }}>{toggleError}</div>}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.colUser")}</th>
                <th className="admin-col-name">{t("admin.colName")}</th>
                <th className="admin-col-joined">{t("admin.colJoined")}</th>
                <th className="admin-col-role">{t("admin.colRole")}</th>
                <th className="admin-col-sub">{t("admin.subscribers")}</th>
                <th style={{ width: 52 }}></th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map(user => (
                <tr key={user.id} className={user.id === currentUser.id ? "admin-table-row--self" : ""}>
                  <td>
                    <div
                      className="admin-user-cell"
                      onClick={() => navigate("publicProfile", { userId: user.id })}
                    >
                      <div className="admin-avatar">{initials(user.email)}</div>
                      <div className="admin-user-info">
                        <div className="admin-email">{user.email}</div>
                        <div className="admin-user-tags">
                          {user.id === currentUser.id && <span className="admin-you-tag">{t("admin.you")}</span>}
                          {user.is_admin && <span className="admin-role-badge admin-role-badge--admin">{t("admin.roleAdmin")}</span>}
                          {user.is_moderator && !user.is_admin && <span className="admin-mod-tag"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>{t("admin.filterMods")}</span>}
                          {user.is_banned && <span className="admin-banned-tag"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>{t("admin.banned")}</span>}
                          {user.subscription_status && user.subscription_status !== "inactive" && (
                            <span className={`admin-sub-badge admin-sub-badge--${user.subscription_status}`}>{user.subscription_status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="admin-col-name admin-date">{user.display_name || "—"}</td>
                  <td className="admin-col-joined admin-date">{formatDate(user.created_at)}</td>
                  <td className="admin-col-role">
                    <span className={`admin-role-badge ${user.is_admin ? "admin-role-badge--admin" : "admin-role-badge--member"}`}>
                      {user.is_admin ? t("admin.roleAdmin") : t("admin.roleMember")}
                    </span>
                  </td>
                  <td className="admin-col-sub">
                    {user.subscription_status && user.subscription_status !== "inactive" ? (
                      <span className={`admin-sub-badge admin-sub-badge--${user.subscription_status}`}>
                        {user.subscription_status}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", paddingRight: 8 }}>
                    {user.id !== currentUser.id && (
                      <UserActionsDropdown
                        user={user}
                        currentUser={currentUser}
                        navigate={navigate}
                        setAdmin={setAdmin}
                        setModerator={setModerator}
                        setBlog={setBlog}
                        banUser={banUser}
                        cancelSub={cancelSub}
                        giftPremium={giftPremium}
                        deleteUser={deleteUser}
                        onToggleError={onToggleError}
                        setConfirmDelete={setConfirmDelete}
                        setConfirmBan={setConfirmBan}
                        setConfirmCancelSub={setConfirmCancelSub}
                        t={t}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
          <span className="admin-page-info">{page + 1} / {totalPages}</span>
          <button className="admin-page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next →</button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("admin.deleteConfirm", { email: confirmDelete.email })}
          onConfirm={() => { deleteUser.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmBan && (
        <ConfirmModal
          message={confirmBan.is_banned
            ? `${t("admin.unban")} ${confirmBan.email}? They will be able to post again.`
            : `${t("admin.ban")} ${confirmBan.email}? They will no longer be able to post any content.`}
          onConfirm={() => { banUser.mutate({ userId: confirmBan.id, value: !confirmBan.is_banned }); setConfirmBan(null); }}
          onCancel={() => setConfirmBan(null)}
        />
      )}

      {confirmCancelSub && (
        <ConfirmModal
          message={`${t("admin.cancelSub")} for ${confirmCancelSub.email}? This will immediately end their Premium access.`}
          onConfirm={() => { cancelSub.mutate(confirmCancelSub.id); setConfirmCancelSub(null); }}
          onCancel={() => setConfirmCancelSub(null)}
        />
      )}
    </div>
  );
}

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab({ navigate }) {
  const { t } = useTranslation();
  const { data: reports = [], isLoading } = useReports();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();
  const deleteContent = useDeleteReportedContent();
  const [confirmDeleteContent, setConfirmDeleteContent] = useState(null);
  const [reportFilter, setReportFilter] = useState("pending");

  const sorted = reportFilter === "all"
    ? [...reports].sort((a, b) => (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1))
    : reportFilter === "resolved"
      ? reports.filter(r => r.status !== "pending")
      : reports.filter(r => r.status === "pending");

  function handleViewContent(r) {
    if (r.content_type === "post")    navigate("blog");
    if (r.content_type === "comment") navigate("blog");
    if (r.content_type === "thread")  navigate("forum");
    if (r.content_type === "reply")   navigate("forum");
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="admin-filter-pills" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        {["pending", "resolved", "all"].map(f => (
          <button key={f} className={`admin-filter-pill${reportFilter === f ? " admin-filter-pill--active" : ""}`} onClick={() => setReportFilter(f)}>
            {t(`adminReports.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
            {f === "pending" && reports.filter(r => r.status === "pending").length > 0 &&
              <span style={{ marginLeft: 4 }}>({reports.filter(r => r.status === "pending").length})</span>}
          </button>
        ))}
      </div>

      {sorted.length === 0 && <div className="admin-loading">{t("adminReports.empty")}</div>}

      <div className="admin-report-list">
        {sorted.map(r => (
          <div key={r.id} className={`admin-report-card${r.status !== "pending" ? " admin-report-card--reviewed" : ""}`}>
            <div className="admin-report-meta">
              <span className={`admin-report-type admin-report-type--${r.content_type}`}>{r.content_type}</span>
              <span className={`admin-report-status admin-report-status--${r.status}`}>{r.status}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{formatDate(r.created_at)}</span>
            </div>
            {r.content_preview && (
              <div className="admin-report-preview">"{r.content_preview}"</div>
            )}
            <div className="admin-report-reason">
              {r.reason ? <><strong>{t("adminReports.reason")}</strong> {r.reason}</> : t("adminReports.noReason")}
            </div>
            <div className="admin-report-reporter">
              {t("adminReports.reportedBy")}: {r.profiles?.display_name || r.profiles?.email || "Unknown"}
            </div>
            <div className="admin-report-actions" style={{ marginTop: 10 }}>
              {r.status === "pending" && (
                <>
                  <button
                    className="admin-action-btn"
                    onClick={() => updateReport.mutate({ reportId: r.id, status: "reviewed" })}
                    disabled={updateReport.isPending}
                  >
                    {t("adminReports.markReviewed")}
                  </button>
                  <button
                    className="admin-action-btn"
                    onClick={() => updateReport.mutate({ reportId: r.id, status: "dismissed" })}
                    disabled={updateReport.isPending}
                  >
                    {t("adminReports.dismiss")}
                  </button>
                </>
              )}
              {r.content_id && (
                <>
                  <button
                    className="admin-action-btn"
                    onClick={() => handleViewContent(r)}
                  >
                    {t("adminReports.viewContent")}
                  </button>
                  <button
                    className="admin-action-btn admin-action-btn--danger"
                    onClick={() => setConfirmDeleteContent(r)}
                    disabled={deleteContent.isPending}
                  >
                    {t("adminReports.deleteContent")}
                  </button>
                </>
              )}
              <button
                className="admin-action-btn admin-action-btn--danger"
                onClick={() => deleteReport.mutate(r.id)}
                disabled={deleteReport.isPending}
              >
                {t("adminReports.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmDeleteContent && (
        <ConfirmModal
          message={`${t("adminReports.deleteContent")}? "${confirmDeleteContent.content_preview ?? ""}". This will permanently remove the content and dismiss the report.`}
          onConfirm={() => {
            deleteContent.mutate({
              reportId: confirmDeleteContent.id,
              contentType: confirmDeleteContent.content_type,
              contentId: confirmDeleteContent.content_id,
            });
            setConfirmDeleteContent(null);
          }}
          onCancel={() => setConfirmDeleteContent(null)}
        />
      )}
    </>
  );
}

// ── Blog Tab ──────────────────────────────────────────────────────────────────
function BlogTab({ navigate }) {
  const { t } = useTranslation();
  const { data: posts = [], isLoading } = useAllBlogPosts();
  const deletePost = useAdminDeleteBlogPost();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? posts.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()))
    : posts;

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <input className="admin-input admin-search-input" type="search" placeholder={t("admin.searchUsers")} aria-label={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <div className="admin-loading">{t("adminBlog.noPosts")}</div> : (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Status</th>
              <th>Date</th>
              <th>{t("admin.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(post => (
              <tr key={post.id}>
                <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {post.title}
                </td>
                <td>{post.profiles?.display_name || "—"}</td>
                <td>
                  <span className={`admin-sub-badge admin-sub-badge--${post.published ? "active" : "none"}`}>
                    {post.published ? t("adminBlog.published") : t("adminBlog.draft")}
                  </span>
                </td>
                <td className="admin-date">{formatDate(post.created_at)}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-action-btn" onClick={() => navigate("blog")}>
                      {t("adminReports.viewContent")}
                    </button>
                    <button
                      className="admin-action-btn admin-action-btn--danger"
                      onClick={() => setConfirmDelete(post)}
                      disabled={deletePost.isPending}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("adminBlog.deleteConfirm", { title: confirmDelete.title })}
          onConfirm={() => { deletePost.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Forum Tab ─────────────────────────────────────────────────────────────────
function ForumTab({ navigate }) {
  const { t } = useTranslation();
  const { data: threads = [], isLoading } = useAllForumThreads();
  const deleteThread = useAdminDeleteForumThread();
  const pinThread = useAdminPinThread();
  const lockThread = useAdminLockThread();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? threads.filter(th => th.title?.toLowerCase().includes(search.toLowerCase()) || th.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()))
    : threads;

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <input className="admin-input admin-search-input" type="search" placeholder={t("admin.searchUsers")} aria-label={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <div className="admin-loading">{t("adminForum.noThreads")}</div> : (
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Replies</th>
              <th>Date</th>
              <th>{t("admin.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(thread => (
              <tr key={thread.id}>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {thread.pinned && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title={t("adminForum.pinned")} style={{display:"inline",marginRight:4,flexShrink:0}} aria-hidden="true"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>}
                  {thread.locked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title={t("adminForum.locked")} style={{display:"inline",marginRight:4,flexShrink:0}} aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {thread.title}
                </td>
                <td>{thread.profiles?.display_name || "—"}</td>
                <td>{thread.forum_replies?.[0]?.count ?? 0}</td>
                <td className="admin-date">{formatDate(thread.created_at)}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-action-btn" onClick={() => navigate("forum")}>
                      {t("adminReports.viewContent")}
                    </button>
                    <button
                      className={`admin-action-btn ${thread.pinned ? "admin-action-btn--active" : ""}`}
                      onClick={() => pinThread.mutate({ threadId: thread.id, value: !thread.pinned })}
                      disabled={pinThread.isPending}
                    >
                      {thread.pinned ? t("adminForum.unpin") : t("adminForum.pin")}
                    </button>
                    <button
                      className={`admin-action-btn ${thread.locked ? "admin-action-btn--active" : ""}`}
                      onClick={() => lockThread.mutate({ threadId: thread.id, value: !thread.locked })}
                      disabled={lockThread.isPending}
                    >
                      {thread.locked ? t("adminForum.unlock") : t("adminForum.lock")}
                    </button>
                    <button
                      className="admin-action-btn admin-action-btn--danger"
                      onClick={() => setConfirmDelete(thread)}
                      disabled={deleteThread.isPending}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("adminForum.deleteConfirm", { title: confirmDelete.title })}
          onConfirm={() => { deleteThread.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Forum Categories Tab ──────────────────────────────────────────────────────
function ForumCategoriesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const [form, setForm] = useState({ icon: "", name: "", description: "", sort_order: "" });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  function resetForm() { setForm({ icon: "", name: "", description: "", sort_order: "" }); setEditId(null); setError(""); }

  function startEdit(cat) {
    setEditId(cat.id);
    setForm({ icon: cat.icon ?? "", name: cat.name ?? "", description: cat.description ?? "", sort_order: String(cat.sort_order ?? "") });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    setSaving(true);
    try {
      const payload = { icon: form.icon.trim(), name: form.name.trim(), description: form.description.trim(), sort_order: Number(form.sort_order) || 0 };
      if (editId) await forumApi.updateCategory(editId, payload);
      else await forumApi.createCategory(payload.icon, payload.name, payload.description, payload.sort_order);
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(catId) {
    setSaving(true);
    try {
      await forumApi.deleteCategory(catId);
      queryClient.invalidateQueries({ queryKey: ["forum", "categories"] });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div className="admin-forum-cats">
        <form className="admin-cat-form" onSubmit={handleSave}>
          <h3 className="admin-cat-form-title">{editId ? t("admin.editCategory") : t("admin.createCategory")}</h3>
          <div className="admin-cat-form-row">
            <input className="admin-input" placeholder="Icon (emoji)" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={{ width: 80 }} />
            <input className="admin-input" placeholder={t("admin.categoryName")} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ flex: 1 }} required />
            <input className="admin-input" placeholder={t("admin.categoryOrder")} aria-label={t("admin.categoryOrder")} type="number" inputMode="numeric" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))} style={{ width: 80 }} />
          </div>
          <input className="admin-input" placeholder={t("admin.categoryDescription")} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          {error && <div className="admin-error">{error}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="admin-save-btn" type="submit" disabled={saving}>{saving ? t("common.saving") : editId ? t("common.save") : t("admin.createCategory")}</button>
            {editId && <button type="button" className="admin-cancel-btn" onClick={resetForm}>{t("common.cancel")}</button>}
          </div>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Icon</th><th>Name</th><th>Description</th><th>Order</th><th>Threads</th><th>{t("admin.colActions")}</th></tr></thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontSize: 20 }}>{cat.icon}</td>
                  <td>{cat.name}</td>
                  <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.description}</td>
                  <td>{cat.sort_order}</td>
                  <td>{cat.forum_threads?.[0]?.count ?? 0}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn" onClick={() => startEdit(cat)}>{t("common.edit")}</button>
                      <button className="admin-action-btn admin-action-btn--danger" onClick={() => setConfirmDelete(cat)} disabled={saving}>{t("common.delete")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`Delete category "${confirmDelete.name}"? All threads in it will also be deleted.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Blog Comments Tab ─────────────────────────────────────────────────────────
function BlogCommentsTab() {
  const { t } = useTranslation();
  const { data: comments = [], isLoading } = useAllComments();
  const deleteComment = useAdminDeleteComment();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? comments.filter(c =>
        c.content?.toLowerCase().includes(search.toLowerCase()) ||
        c.profiles?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.blog_posts?.title?.toLowerCase().includes(search.toLowerCase())
      )
    : comments;

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
        <input className="admin-input admin-search-input" type="search" placeholder={t("admin.searchUsers")} aria-label={t("admin.searchUsers")} value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="admin-loading">{t("adminComments.noComments")}</div>
      ) : (
        <div className="admin-report-list">
          {filtered.map(c => (
            <div key={c.id} className="admin-report-card">
              <div className="admin-report-meta">
                <span className="admin-report-type admin-report-type--comment">{t("adminComments.comment")}</span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {c.profiles?.display_name || "Unknown"} {t("adminComments.on")} <em>{c.blog_posts?.title || "—"}</em>
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{formatDate(c.created_at)}</span>
              </div>
              <div className="admin-report-preview">"{c.content?.slice(0, 200)}"</div>
              <div className="admin-report-actions" style={{ marginTop: 8 }}>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => setConfirmDelete(c)}
                  disabled={deleteComment.isPending}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message={t("adminComments.deleteConfirm")}
          onConfirm={() => { deleteComment.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}

// ── Quiz Stats Tab ────────────────────────────────────────────────────────────
function QuizStatsTab() {
  const { t } = useTranslation();
  const { data: rawData = [], isLoading } = useAdminQuizStats();

  const stats = Array.from({ length: 12 }, (_, i) => {
    const level = i + 1;
    const rows = rawData.filter(r => r.level === level);
    const unlocked = rows.filter(r => r.unlocked).length;
    const earned = rows.filter(r => r.badge_earned).length;
    const scores = rows.filter(r => r.best_score > 0).map(r => r.best_score);
    const attempts = rows.reduce((sum, r) => sum + (r.attempts || 0), 0);
    return {
      level,
      unlocked,
      earned,
      passRate: unlocked ? Math.round(earned / unlocked * 100) : 0,
      avgScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      attempts,
    };
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t("adminQuizStats.level")}</th>
            <th>{t("adminQuizStats.unlocked")}</th>
            <th>{t("adminQuizStats.passed")}</th>
            <th>{t("adminQuizStats.passRate")}</th>
            <th>{t("adminQuizStats.avgScore")}</th>
            <th>{t("adminQuizStats.attempts")}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.level}>
              <td><strong>{t("adminQuiz.level")} {s.level}</strong></td>
              <td>{s.unlocked}</td>
              <td>{s.earned}</td>
              <td>
                <span style={{
                  fontWeight: 700,
                  color: s.passRate >= 70 ? "var(--success, #22c55e)" : s.passRate >= 40 ? "var(--warning, #f59e0b)" : "var(--danger, #ef4444)"
                }}>
                  {s.passRate}%
                </span>
              </td>
              <td>{s.avgScore > 0 ? `${s.avgScore}%` : "—"}</td>
              <td>{s.attempts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Quiz Editor Tab ────────────────────────────────────────────────────────────
const LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);
const OPTION_LABELS = ["A", "B", "C", "D"];

function emptyForm(level) {
  return { level, question: "", options: ["", "", "", ""], correct_index: 0 };
}

function QuizTab() {
  const { t } = useTranslation();
  const { data: allQuestions = [], isLoading } = useAllQuizQuestions();
  const createQuestion  = useCreateQuizQuestion();
  const updateQuestion  = useUpdateQuizQuestion();
  const deleteQuestion  = useDeleteQuizQuestion();

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [showForm, setShowForm]           = useState(false);
  const [editingId, setEditingId]         = useState(null);
  const [form, setForm]                   = useState(emptyForm(1));
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [qPage, setQPage] = useState(0);

  const QUIZ_PAGE_SIZE = 5;
  const levelQuestions = allQuestions.filter(q => q.level === selectedLevel);
  const totalQPages = Math.ceil(levelQuestions.length / QUIZ_PAGE_SIZE);
  const pageQuestions = levelQuestions.slice(qPage * QUIZ_PAGE_SIZE, (qPage + 1) * QUIZ_PAGE_SIZE);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm(selectedLevel));
    setShowForm(true);
  }

  function openEditForm(q) {
    setEditingId(q.id);
    setForm({
      level: q.level,
      question: q.question,
      options: Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
      correct_index: q.correct_index ?? 0,
    });
    setShowForm(true);
  }

  function handleSave() {
    const payload = {
      level: form.level,
      question: form.question.trim(),
      options: form.options.map(o => o.trim()),
      correctIndex: form.correct_index,
    };
    if (!payload.question || payload.options.some(o => !o)) return;

    if (editingId) {
      updateQuestion.mutate({ id: editingId, ...payload }, { onSuccess: () => { setShowForm(false); setEditingId(null); } });
    } else {
      createQuestion.mutate(payload, { onSuccess: () => { setShowForm(false); } });
    }
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="admin-quiz-controls">
        <CustomSelect
          value={selectedLevel}
          onChange={val => { setSelectedLevel(val); setShowForm(false); setQPage(0); }}
          options={LEVELS.map(l => ({ value: l, label: `${t("adminQuiz.level")} ${l}` }))}
        />
        <button className="admin-add-btn" onClick={openAddForm}>
          {t("adminQuiz.addQuestion")}
        </button>
      </div>

      {/* Form always at the top */}
      {showForm && (
        <div className="admin-question-form">
          <h3>{editingId ? t("adminQuiz.editQuestion") : t("adminQuiz.addQuestion")}</h3>

          <div>
            <label htmlFor="admin-level" className="admin-form-label">{t("adminQuiz.level")}</label>
            <CustomSelect
              value={form.level}
              onChange={val => setForm(f => ({ ...f, level: val }))}
              options={LEVELS.map(l => ({ value: l, label: String(l) }))}
            />
          </div>

          <div>
            <label htmlFor="admin-question" className="admin-form-label">{t("adminQuiz.questionText")}</label>
            <textarea
              id="admin-question"
              name="question"
              className="admin-textarea"
              rows={2}
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              placeholder={t("adminQuiz.questionText")}
            />
          </div>

          <div>
            <label className="admin-form-label">Options</label>
            <div className="admin-options-grid">
              {form.options.map((opt, i) => (
                <div key={i} className="admin-option-row">
                  <label htmlFor={`admin-option-${i}`} className="admin-form-label">{t(`adminQuiz.option${OPTION_LABELS[i]}`)}</label>
                  <input
                    id={`admin-option-${i}`}
                    name={`option_${i}`}
                    className="admin-input"
                    value={opt}
                    onChange={e => {
                      const opts = [...form.options];
                      opts[i] = e.target.value;
                      setForm(f => ({ ...f, options: opts }));
                    }}
                    placeholder={`Option ${OPTION_LABELS[i]}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="admin-correct" className="admin-form-label">{t("adminQuiz.correctAnswer")}</label>
            <CustomSelect
              value={form.correct_index}
              onChange={val => setForm(f => ({ ...f, correct_index: val }))}
              options={OPTION_LABELS.map((label, i) => ({ value: i, label: `${label}: ${form.options[i] || `Option ${label}`}` }))}
            />
          </div>

          <div className="admin-form-row">
            <button
              className="admin-submit-btn"
              onClick={handleSave}
              disabled={createQuestion.isPending || updateQuestion.isPending}
            >
              {t("adminQuiz.saveQuestion")}
            </button>
            <button className="admin-action-btn" onClick={() => { setShowForm(false); setEditingId(null); }}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Paginated question list below the form */}
      {levelQuestions.length === 0 && !showForm ? (
        <div className="admin-loading">{t("adminQuiz.noQuestions")}</div>
      ) : (
        <div className="admin-question-list">
          {pageQuestions.map(q => (
            <div key={q.id} className="admin-question-card">
              <div className="admin-question-text">{q.question}</div>
              <div className="admin-question-options">
                {(Array.isArray(q.options) ? q.options : []).map((opt, i) => (
                  <div key={i} className={`admin-question-option${i === q.correct_index ? " admin-question-option--correct" : ""}`}>
                    {OPTION_LABELS[i]}. {opt}{i === q.correct_index ? " ✓" : ""}
                  </div>
                ))}
              </div>
              <div className="admin-question-actions">
                <button className="admin-action-btn" onClick={() => openEditForm(q)}>{t("common.edit")}</button>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => setConfirmDeleteId(q.id)}
                  disabled={deleteQuestion.isPending}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalQPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-page-btn" onClick={() => setQPage(p => p - 1)} disabled={qPage === 0}>← Prev</button>
          <span className="admin-page-info">{qPage + 1} / {totalQPages}</span>
          <button className="admin-page-btn" onClick={() => setQPage(p => p + 1)} disabled={qPage >= totalQPages - 1}>Next →</button>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message={t("adminQuiz.deleteConfirm")}
          onConfirm={() => { deleteQuestion.mutate(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab({ currentUser }) {
  const { t } = useTranslation();
  const { data: announcements = [], isLoading } = useAllAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const toggleAnnouncement = useToggleAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [message, setMessage] = useState("");
  const [type, setType]       = useState("info");

  function handlePost() {
    if (!message.trim()) return;
    createAnnouncement.mutate(
      { authorId: currentUser.id, message: message.trim(), type },
      { onSuccess: () => setMessage("") }
    );
  }

  return (
    <div>
      <div className="admin-announcement-form">
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{t("adminAnnouncements.newTitle")}</h3>
        <textarea
          id="admin-announcement-message"
          name="message"
          className="admin-textarea"
          rows={3}
          placeholder={t("adminAnnouncements.messagePlaceholder")}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <div className="admin-type-row">
          {["info", "warning", "success"].map(tp => (
            <button
              key={tp}
              className={`admin-type-btn${type === tp ? ` admin-type-btn--active ${tp}` : ""}`}
              onClick={() => setType(tp)}
            >
              {t(`adminAnnouncements.type${tp.charAt(0).toUpperCase() + tp.slice(1)}`)}
            </button>
          ))}
        </div>
        <button
          className="admin-submit-btn"
          onClick={handlePost}
          disabled={createAnnouncement.isPending || !message.trim()}
        >
          {t("adminAnnouncements.post")}
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : announcements.length === 0 ? (
        <div className="admin-loading">{t("adminAnnouncements.noAnnouncements")}</div>
      ) : (
        <div className="admin-announcement-list">
          {announcements.map(a => (
            <div key={a.id} className="admin-announcement-item">
              <div>
                <div className="admin-announcement-msg">{a.message}</div>
                <div className="admin-announcement-meta">
                  <span className={`admin-report-type admin-report-type--${a.type === "info" ? "thread" : a.type === "warning" ? "reply" : "comment"}`} style={{ marginRight: 6 }}>
                    {a.type}
                  </span>
                  {formatDate(a.created_at)} · {a.active ? t("adminAnnouncements.active") : t("adminAnnouncements.inactive")}
                </div>
              </div>
              <div className="admin-announcement-actions">
                <button
                  className={`admin-toggle-btn${a.active ? " admin-toggle-btn--active" : " admin-toggle-btn--inactive"}`}
                  onClick={() => toggleAnnouncement.mutate({ id: a.id, active: !a.active })}
                  disabled={toggleAnnouncement.isPending}
                >
                  {a.active ? t("adminAnnouncements.deactivate") : t("adminAnnouncements.activate")}
                </button>
                <button
                  className="admin-action-btn admin-action-btn--danger"
                  onClick={() => deleteAnnouncement.mutate(a.id)}
                  disabled={deleteAnnouncement.isPending}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
const ACTION_LABELS = {
  delete_user:      { icon: "🗑️", label: "Deleted user" },
  grant_admin:      { icon: "⬆️", label: "Granted admin" },
  revoke_admin:     { icon: "⬇️", label: "Revoked admin" },
  grant_moderator:  { icon: "🛡️", label: "Granted moderator" },
  revoke_moderator: { icon: "🛡️", label: "Revoked moderator" },
  ban_user:         { icon: "🚫", label: "Banned user" },
  unban_user:       { icon: "✅", label: "Unbanned user" },
  grant_blog:       { icon: "✍️", label: "Granted blog access" },
  revoke_blog:      { icon: "✍️", label: "Revoked blog access" },
  gift_premium:     { icon: "⭐", label: "Gifted premium" },
  revoke_premium:   { icon: "⭐", label: "Revoked premium" },
};

function AuditLogTab() {
  const { data: entries = [], isLoading } = useAdminAuditLog({ limit: 200 });

  if (isLoading) return <LoadingSpinner />;

  if (!entries.length) return (
    <div className="admin-empty">No audit log entries yet. Actions taken by admins will appear here.</div>
  );

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const def = ACTION_LABELS[entry.action] ?? { icon: "🔧", label: entry.action };
            return (
              <tr key={entry.id}>
                <td className="admin-audit-time">
                  {new Date(entry.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td>{entry.actor?.display_name || entry.actor?.email || "—"}</td>
                <td><span className="admin-audit-action">{def.icon} {def.label}</span></td>
                <td className="admin-audit-target">{entry.target_email || entry.target_id || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────────
export default function AdminPage({ currentUser, currentProfile, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
  const isCurrentUserAdmin = currentProfile?.is_admin;
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: reports = [], isLoading: reportsLoading } = useReports();
  const { t } = useTranslation();

  const [tab, setTab] = useState(() => isCurrentUserAdmin ? "users" : "reports");

  if ((isCurrentUserAdmin && usersLoading) || reportsLoading) {
    return (
      <div className="admin-wrap">
        <LoadingSpinner />
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
      <header className="admin-header">
        <div className="admin-header-inner">
          <button className="back-btn" onClick={onBack}>{t("common.back")}</button>
          <div className="admin-header-text">
            <span className="admin-logo">
            {isCurrentUserAdmin
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            }
          </span>
            <h1>{isCurrentUserAdmin ? t("admin.title") : t("admin.moderation")}</h1>
          </div>
        </div>
      </header>

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
      </div>
    </div>
  );
}
