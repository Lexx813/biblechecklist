import { useState } from "react";
import { useUsers, useDeleteUser, useSetAdmin, useCreateUser } from "../../hooks/useAdmin";
import "../../styles/admin.css";

function initials(email) {
  return email ? email[0].toUpperCase() : "?";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminPage({ currentUser, onBack }) {
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const setAdmin = useSetAdmin();
  const createUser = useCreateUser();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const adminCount = users.filter(u => u.is_admin).length;

  async function handleDelete(user) {
    if (user.id === currentUser.id) return alert("You cannot delete your own account.");
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return;
    deleteUser.mutate(user.id);
  }

  async function handleAddUser(e) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    if (!newEmail || !newPassword) return setAddError("Email and password are required.");
    if (newPassword.length < 8) return setAddError("Password must be at least 8 characters.");

    createUser.mutate({ email: newEmail, password: newPassword }, {
      onSuccess: () => {
        setAddSuccess(`Invite sent to ${newEmail}. They must confirm their email before logging in.`);
        setNewEmail("");
        setNewPassword("");
      },
      onError: (err) => setAddError(err.message),
    });
  }

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div className="admin-header-inner">
          <button className="admin-back-btn" onClick={onBack}>← Back</button>
          <div className="admin-header-text">
            <span className="admin-logo">⚙️</span>
            <h1>Admin Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="admin-content">

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-value">{users.length}</div>
            <div className="admin-stat-label">Total Users</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{adminCount}</div>
            <div className="admin-stat-label">Admins</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-value">{users.length - adminCount}</div>
            <div className="admin-stat-label">Members</div>
          </div>
        </div>

        {/* Add User */}
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Users</h2>
            <button className="admin-add-btn" onClick={() => { setShowAddForm(v => !v); setAddError(""); setAddSuccess(""); }}>
              {showAddForm ? "Cancel" : "+ Add User"}
            </button>
          </div>

          {showAddForm && (
            <form className="admin-add-form" onSubmit={handleAddUser}>
              <input
                className="admin-input"
                type="email"
                placeholder="Email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                disabled={createUser.isPending}
              />
              <input
                className="admin-input"
                type="password"
                placeholder="Temporary password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={createUser.isPending}
              />
              {addError && <div className="admin-form-error">{addError}</div>}
              {addSuccess && <div className="admin-form-success">{addSuccess}</div>}
              <button className="admin-submit-btn" type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create User"}
              </button>
            </form>
          )}

          {/* User table */}
          {isLoading ? (
            <div className="admin-loading">Loading users…</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Joined</th>
                    <th>Role</th>
                    <th>Actions</th>
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
                            {user.id === currentUser.id && <div className="admin-you-tag">You</div>}
                          </div>
                        </div>
                      </td>
                      <td className="admin-date">{formatDate(user.created_at)}</td>
                      <td>
                        <span className={`admin-role-badge ${user.is_admin ? "admin-role-badge--admin" : "admin-role-badge--member"}`}>
                          {user.is_admin ? "Admin" : "Member"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          {user.id !== currentUser.id && (
                            <>
                              <button
                                className="admin-action-btn"
                                onClick={() => setAdmin.mutate({ userId: user.id, value: !user.is_admin })}
                                disabled={setAdmin.isPending}
                                title={user.is_admin ? "Remove admin" : "Make admin"}
                              >
                                {user.is_admin ? "Remove Admin" : "Make Admin"}
                              </button>
                              <button
                                className="admin-action-btn admin-action-btn--danger"
                                onClick={() => handleDelete(user)}
                                disabled={deleteUser.isPending}
                              >
                                Delete
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
    </div>
  );
}
