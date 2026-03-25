import { useState } from "react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../ConfirmModal";
import PageNav from "../PageNav";
import LoadingSpinner from "../LoadingSpinner";
import { useUsers, useDeleteUser, useSetAdmin, useSetBlog, useCreateUser } from "../../hooks/useAdmin";
import { useReports, useUpdateReport, useDeleteReport } from "../../hooks/useReports";
import { useAllAnnouncements, useCreateAnnouncement, useToggleAnnouncement, useDeleteAnnouncement } from "../../hooks/useAnnouncements";
import { useAllQuizQuestions, useCreateQuizQuestion, useUpdateQuizQuestion, useDeleteQuizQuestion } from "../../hooks/useQuiz";
import "../../styles/admin.css";

function initials(email) {
  return email ? email[0].toUpperCase() : "?";
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ currentUser }) {
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

      {isLoading ? (
        <LoadingSpinner />
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

// ── Reports Tab ───────────────────────────────────────────────────────────────
function ReportsTab() {
  const { t } = useTranslation();
  const { data: reports = [], isLoading } = useReports();
  const updateReport = useUpdateReport();
  const deleteReport = useDeleteReport();

  const pending = reports.filter(r => r.status === "pending");
  const others  = reports.filter(r => r.status !== "pending");
  const sorted  = [...pending, ...others];

  if (isLoading) return <LoadingSpinner />;

  if (sorted.length === 0) {
    return <div className="admin-loading">{t("adminReports.empty")}</div>;
  }

  return (
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

  const levelQuestions = allQuestions.filter(q => q.level === selectedLevel);

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
      correct_index: form.correct_index,
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
        <select
          className="admin-quiz-level-select"
          value={selectedLevel}
          onChange={e => { setSelectedLevel(Number(e.target.value)); setShowForm(false); }}
        >
          {LEVELS.map(l => (
            <option key={l} value={l}>{t("adminQuiz.level")} {l}</option>
          ))}
        </select>
        <button className="admin-add-btn" onClick={openAddForm}>
          {t("adminQuiz.addQuestion")}
        </button>
      </div>

      {/* Question list */}
      {levelQuestions.length === 0 && !showForm ? (
        <div className="admin-loading">{t("adminQuiz.noQuestions")}</div>
      ) : (
        <div className="admin-question-list">
          {levelQuestions.map(q => (
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

      {/* Add/Edit form */}
      {showForm && (
        <div className="admin-question-form">
          <h3>{editingId ? t("adminQuiz.editQuestion") : t("adminQuiz.addQuestion")}</h3>

          <div>
            <label className="admin-form-label">{t("adminQuiz.level")}</label>
            <select
              className="admin-quiz-level-select"
              value={form.level}
              onChange={e => setForm(f => ({ ...f, level: Number(e.target.value) }))}
            >
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="admin-form-label">{t("adminQuiz.questionText")}</label>
            <textarea
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
                  <label className="admin-form-label">{t(`adminQuiz.option${OPTION_LABELS[i]}`)}</label>
                  <input
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
            <label className="admin-form-label">{t("adminQuiz.correctAnswer")}</label>
            <select
              className="admin-correct-select"
              value={form.correct_index}
              onChange={e => setForm(f => ({ ...f, correct_index: Number(e.target.value) }))}
            >
              {OPTION_LABELS.map((label, i) => (
                <option key={i} value={i}>{label}: {form.options[i] || `Option ${label}`}</option>
              ))}
            </select>
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

// ── Main AdminPage ─────────────────────────────────────────────────────────────
export default function AdminPage({ currentUser, onBack, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: reports = [], isLoading: reportsLoading } = useReports();
  const { t } = useTranslation();

  const [tab, setTab] = useState("users");

  if (usersLoading || reportsLoading) {
    return (
      <div className="admin-wrap">
        <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={currentUser} onLogout={onLogout} />
        <LoadingSpinner />
      </div>
    );
  }

  const adminCount   = users.filter(u => u.is_admin).length;
  const blogCount    = users.filter(u => u.can_blog).length;
  const pendingCount = reports.filter(r => r.status === "pending").length;

  return (
    <div className="admin-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={currentUser} onLogout={onLogout} />
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

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab${tab === "users" ? " admin-tab--active" : ""}`} onClick={() => setTab("users")}>
            👥 {t("adminTabs.users")}
          </button>
          <button className={`admin-tab${tab === "reports" ? " admin-tab--active" : ""}`} onClick={() => setTab("reports")}>
            🚩 {t("adminTabs.reports")}
            {pendingCount > 0 && <span className="admin-tab-badge">{pendingCount}</span>}
          </button>
          <button className={`admin-tab${tab === "quiz" ? " admin-tab--active" : ""}`} onClick={() => setTab("quiz")}>
            📝 {t("adminTabs.quiz")}
          </button>
          <button className={`admin-tab${tab === "announcements" ? " admin-tab--active" : ""}`} onClick={() => setTab("announcements")}>
            📢 {t("adminTabs.announcements")}
          </button>
        </div>

        {/* Tab content */}
        {tab === "users" && <UsersTab currentUser={currentUser} />}
        {tab === "reports" && <ReportsTab />}
        {tab === "quiz" && <QuizTab />}
        {tab === "announcements" && <AnnouncementsTab currentUser={currentUser} />}
      </div>
    </div>
  );
}
