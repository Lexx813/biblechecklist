import { useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../ConfirmModal";
import PageNav from "../PageNav";
import { useUsers, useDeleteUser, useSetAdmin, useSetBlog, useCreateUser } from "../../hooks/useAdmin";
import "../../styles/admin.css";

function initials(email) {
  return email ? email[0].toUpperCase() : "?";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminPage({ currentUser, onBack, navigate, darkMode, setDarkMode, i18n }) {
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const setAdmin = useSetAdmin();
  const setBlog = useSetBlog();
  const createUser = useCreateUser();
  const { t } = useTranslation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const adminCount = users.filter(u => u.is_admin).length;
  const blogCount = users.filter(u => u.can_blog).length;

  function handleDelete(user) {
    if (user.id === currentUser.id) return alert(t("admin.selfDeleteError"));
    setConfirmDelete(user);
  }

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
    <div className="admin-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} />
      <header className="admin-header">
        <div className="admin-header-inner">
          <button className="admin-back-btn" onClick={onBack}>{t("common.back")}</button>
          <div className="admin-header-text">
            <span className="admin-logo">⚙️</span>
            <h1>{t("admin.title")}</h1>
          </div>
        </div>
      </header>

      <div className="admin-content">

        {/* Stats */}
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
        </div>

        {/* Add User */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>{t("admin.usersSection")}</h2>
            <button className="admin-add-btn" onClick={() => { setShowAddForm(v => !v); setAddError(""); setAddSuccess(""); }}>
              {showAddForm ? t("common.cancel") : t("admin.addUser")}
            </button>
          </div>

          {showAddForm && (
            <form className="admin-add-form" onSubmit={handleAddUser}>
              <input
                className="admin-input"
                type="email"
                placeholder={t("admin.emailPlaceholder")}
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                disabled={createUser.isPending}
              />
              <input
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

          {/* User table */}
          {isLoading ? (
            <div className="admin-loading">{t("admin.loadingUsers")}</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t("admin.colUser")}</th>
                    <th>{t("admin.colJoined")}</th>
                    <th>{t("admin.colRole")}</th>
                    <th>{t("admin.colBlog")}</th>
                    <th>{t("admin.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={user.id === currentUser.id ? "admin-table-row--self" : ""}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">{initials(user.email)}</div>
                          <div>
                            <div className="admin-email">{user.email}</div>
                            {user.id === currentUser.id && <div className="admin-you-tag">{t("admin.you")}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="admin-date">{formatDate(user.created_at)}</td>
                      <td>
                        <span className={`admin-role-badge ${user.is_admin ? "admin-role-badge--admin" : "admin-role-badge--member"}`}>
                          {user.is_admin ? t("admin.roleAdmin") : t("admin.roleMember")}
                        </span>
                      </td>
                      <td>
                        {user.id !== currentUser.id && (
                          <button
                            className={`admin-action-btn ${user.can_blog ? "admin-action-btn--active" : ""}`}
                            onClick={() => setBlog.mutate({ userId: user.id, value: !user.can_blog })}
                            disabled={setBlog.isPending}
                            title={user.can_blog ? t("admin.revokeBlog") : t("admin.grantBlog")}
                          >
                            {user.can_blog ? t("admin.writer") : t("admin.allowBlog")}
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="admin-actions">
                          {user.id !== currentUser.id && (
                            <>
                              <button
                                className="admin-action-btn"
                                onClick={() => setAdmin.mutate({ userId: user.id, value: !user.is_admin })}
                                disabled={setAdmin.isPending}
                                title={user.is_admin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                              >
                                {user.is_admin ? t("admin.removeAdmin") : t("admin.makeAdmin")}
                              </button>
                              <button
                                className="admin-action-btn admin-action-btn--danger"
                                onClick={() => handleDelete(user)}
                                disabled={deleteUser.isPending}
                              >
                                {t("common.delete")}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={t("admin.deleteConfirm", { email: confirmDelete.email })}
          onConfirm={() => { deleteUser.mutate(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
