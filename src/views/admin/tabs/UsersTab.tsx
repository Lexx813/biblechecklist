import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import CustomSelect from "../../../components/CustomSelect";
import ConfirmModal from "../../../components/ConfirmModal";
import {
  useUsers, useDeleteUser, useSetAdmin, useSetModerator, useSetBlog,
  useCreateUser, useBanUser,
} from "../../../hooks/useAdmin";
import { formatDate } from "../../../utils/formatters";

export function AdminSkeleton() {
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton" style={{ height: 36, borderRadius: 6 }} />
      ))}
    </div>
  );
}

const USERS_PAGE_SIZE = 20;
const USER_FILTERS = ["all", "admins", "mods", "banned"];

function initials(email: string | null | undefined) {
  return email ? email[0].toUpperCase() : "?";
}

function exportUsersCSV(users: Array<Record<string, unknown>>) {
  const headers = ["Email", "Display Name", "Joined", "Role", "Subscription", "Banned", "Can Blog"];
  const rows = users.map((u: any) => [
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

function UserActionsDropdown({ user, currentUser, navigate, setAdmin, setModerator, setBlog, banUser, deleteUser, onToggleError, setConfirmDelete, setConfirmBan, t }) {
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


export function UsersTab({ currentUser, navigate }) {
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const setAdmin = useSetAdmin();
  const setModerator = useSetModerator();
  const setBlog = useSetBlog();
  const banUser = useBanUser();
  const createUser = useCreateUser();
  const { t } = useTranslation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmBan, setConfirmBan] = useState(null);
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
            aria-label="Email address"
          />
          <input
            id="admin-new-password"
            name="password"
            className="admin-input"
            type="password"
            placeholder={t("admin.passwordPlaceholder")}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            aria-label="Password"
            disabled={createUser.isPending}
          />
          {addError && <div className="admin-form-error">{addError}</div>}
          {addSuccess && <div className="admin-form-success">{addSuccess}</div>}
          <button className="admin-submit-btn" type="submit" disabled={createUser.isPending}>
            {createUser.isPending ? t("admin.creating") : t("admin.createUser")}
          </button>
        </form>
      )}

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
        <AdminSkeleton />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("admin.colUser")}</th>
                <th className="admin-col-name">{t("admin.colName")}</th>
                <th className="admin-col-joined">{t("admin.colJoined")}</th>
                <th className="admin-col-role">{t("admin.colRole")}</th>
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
                        deleteUser={deleteUser}
                        onToggleError={onToggleError}
                        setConfirmDelete={setConfirmDelete}
                        setConfirmBan={setConfirmBan}
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

    </div>
  );
}
