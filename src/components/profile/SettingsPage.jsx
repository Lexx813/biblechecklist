import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import PageNav from "../PageNav";
import ConfirmModal from "../ConfirmModal";
import { useMeta } from "../../hooks/useMeta";
import { useFullProfile, useUpdateProfile, useUploadAvatar } from "../../hooks/useAdmin";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useUpdatePassword } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { adminApi } from "../../api/admin";
import "../../styles/profile.css";
import "../../styles/settings.css";

export default function SettingsPage({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout }) {
  const { data: profile, isLoading } = useFullProfile(user.id);
  const update = useUpdateProfile(user.id);
  const uploadAvatar = useUploadAvatar(user.id);
  const { t } = useTranslation();
  useMeta({ title: t("settings.title") });

  // ── Display name ──────────────────────────────────────────
  const [nameVal, setNameVal] = useState("");
  const [editingName, setEditingName] = useState(false);

  function startEditName() {
    setNameVal(profile?.display_name ?? "");
    setEditingName(true);
  }
  function saveName() {
    if (nameVal.trim()) update.mutate({ display_name: nameVal.trim() });
    setEditingName(false);
  }

  // ── Avatar ────────────────────────────────────────────────
  const fileRef = useRef(null);

  // ── Notifications ─────────────────────────────────────────
  const { permission, subscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications(user.id);
  const emailBlog   = profile?.email_notifications_blog   ?? false;
  const emailDigest = profile?.email_notifications_digest ?? false;
  const emailStreak = profile?.email_notifications_streak ?? false;
  const pushSupported = "Notification" in window && "serviceWorker" in navigator && permission !== "unsupported";

  const emailToggles = [
    { key: "email_notifications_blog",   value: emailBlog,   labelKey: "notifBlogLabel",   descKey: "notifBlogDesc" },
    { key: "email_notifications_digest", value: emailDigest, labelKey: "notifDigestLabel", descKey: "notifDigestDesc" },
    { key: "email_notifications_streak", value: emailStreak, labelKey: "notifStreakLabel", descKey: "notifStreakDesc" },
  ];

  // ── Change password ───────────────────────────────────────
  const updatePassword = useUpdatePassword();
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (!pwNew) return setPwError(t("settings.pwErrorRequired"));
    if (pwNew.length < 8) return setPwError(t("auth.errorPasswordShort"));
    if (pwNew !== pwConfirm) return setPwError(t("auth.errorPasswordMismatch"));
    updatePassword.mutate(pwNew, {
      onSuccess: () => {
        setPwSuccess(true);
        setPwCurrent("");
        setPwNew("");
        setPwConfirm("");
      },
      onError: (err) => setPwError(err.message),
    });
  }

  // ── Subscription ──────────────────────────────────────────
  const { isPremium, status, subscribe: startCheckout, cancel } = useSubscription(user.id);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ── Delete account ────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      onLogout();
    } catch {
      setDeleting(false);
    }
  }

  if (isLoading) return null;

  const displayName = profile?.display_name || user.email?.split("@")[0] || "";
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="st-wrap">
      <PageNav navigate={navigate} darkMode={darkMode} setDarkMode={setDarkMode} i18n={i18n} user={user} onLogout={onLogout} />

      <header className="st-header">
        <div className="st-header-inner">
          <button className="pf-back-btn" onClick={onBack}>{t("common.back")}</button>
          <h1 className="st-title">{t("settings.title")}</h1>
        </div>
      </header>

      <div className="st-content">

        {/* ── Profile ─────────────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">{t("settings.profileSection")}</h2>

          {/* Avatar */}
          <div className="st-avatar-row">
            <div className="st-avatar-wrap">
              {avatarUrl
                ? <img src={avatarUrl} className="st-avatar-img" alt="avatar" />
                : <div className="st-avatar-placeholder">{displayName[0]?.toUpperCase() ?? "?"}</div>
              }
              {uploadAvatar.isPending && <div className="st-avatar-overlay">⏳</div>}
            </div>
            <div className="st-avatar-info">
              <p className="st-avatar-hint">{t("settings.avatarHint")}</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) uploadAvatar.mutate(e.target.files[0]); }}
              />
              <button className="st-btn st-btn--secondary" onClick={() => fileRef.current?.click()} disabled={uploadAvatar.isPending}>
                {uploadAvatar.isPending ? t("settings.uploading") : t("settings.changeAvatar")}
              </button>
            </div>
          </div>

          {/* Display name */}
          <div className="st-field">
            <label className="st-label" htmlFor="st-display-name">{t("settings.displayName")}</label>
            {editingName ? (
              <div className="st-field-edit-row">
                <input
                  id="st-display-name"
                  name="display_name"
                  className="st-input"
                  value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  autoFocus
                  maxLength={40}
                />
                <button className="st-btn st-btn--primary" onClick={saveName} disabled={!nameVal.trim() || update.isPending}>{update.isPending && <span className="btn-spin" />}{t("common.save")}</button>
                <button className="st-btn st-btn--ghost" onClick={() => setEditingName(false)}>{t("common.cancel")}</button>
              </div>
            ) : (
              <div className="st-field-read-row">
                <span className="st-field-value">{displayName}</span>
                <button className="st-btn st-btn--ghost" onClick={startEditName}>{t("common.edit")}</button>
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="st-field">
            <label className="st-label" htmlFor="st-email">{t("settings.email")}</label>
            <div className="st-field-read-row">
              <span id="st-email" className="st-field-value st-field-value--muted">{user.email}</span>
            </div>
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">{t("profile.notificationsTitle")}</h2>

          {pushSupported && (
            <div className="st-toggle-row">
              <div className="st-toggle-info">
                <span className="st-toggle-label">{t("profile.notifPushLabel")}</span>
                <span className="st-toggle-desc">
                  {permission === "denied" ? t("profile.notifPushDenied") : t("profile.notifPushDesc")}
                </span>
              </div>
              <button
                role="switch"
                aria-checked={subscribed}
                className={`pf-toggle${subscribed ? " pf-toggle--on" : ""}`}
                onClick={subscribed ? unsubscribe : subscribe}
                disabled={pushLoading || permission === "denied"}
              >
                <span className="pf-toggle-thumb" />
              </button>
            </div>
          )}

          {emailToggles.map(({ key, value, labelKey, descKey }) => (
            <div key={key} className="st-toggle-row">
              <div className="st-toggle-info">
                <span className="st-toggle-label">{t(`profile.${labelKey}`)}</span>
                <span className="st-toggle-desc">{t(`profile.${descKey}`)}</span>
              </div>
              <button
                role="switch"
                aria-checked={value}
                className={`pf-toggle${value ? " pf-toggle--on" : ""}`}
                onClick={() => update.mutate({ [key]: !value })}
                disabled={update.isPending}
              >
                <span className="pf-toggle-thumb" />
              </button>
            </div>
          ))}
        </section>

        {/* ── Subscription ─────────────────────────────────── */}
        {!profile?.is_admin && (
          <section className="st-section">
            <h2 className="st-section-title">Subscription</h2>
            {isPremium ? (
              <div className="st-sub-active">
                <div className="st-sub-status">
                  <span className="st-sub-badge st-sub-badge--active">
                    ✦ Premium
                  </span>
                  <span className="st-sub-status-label">
                    {status === "trialing" ? "Free trial active" : "Active — $3 / month"}
                  </span>
                </div>
                <p className="st-sub-desc">
                  You have access to Reading Plans, Study Notes, Messages, Study Groups, and the AI Companion.
                </p>
                <button
                  className="st-btn st-btn--ghost st-sub-cancel-btn"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel subscription
                </button>
              </div>
            ) : (
              <div className="st-sub-inactive">
                <p className="st-sub-desc">
                  Upgrade to Premium for $3/month to unlock Reading Plans, Study Notes, Messages, Study Groups, and the AI Companion.
                </p>
                <button
                  className="st-btn st-btn--primary"
                  onClick={() => startCheckout.mutate()}
                  disabled={startCheckout.isPending}
                >
                  {startCheckout.isPending ? "Redirecting…" : "Upgrade to Premium — $3/mo"}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Change password ──────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">{t("settings.changePasswordSection")}</h2>
          <form onSubmit={handleChangePassword} noValidate>
            <div className="st-field">
              <label className="st-label" htmlFor="st-pw-new">{t("settings.newPassword")}</label>
              <input
                id="st-pw-new"
                name="new_password"
                type="password"
                className="st-input"
                value={pwNew}
                onChange={e => setPwNew(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="st-field">
              <label className="st-label" htmlFor="st-pw-confirm">{t("settings.confirmPassword")}</label>
              <input
                id="st-pw-confirm"
                name="confirm_password"
                type="password"
                className="st-input"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {pwError && <p className="st-error">{pwError}</p>}
            {pwSuccess && <p className="st-success">{t("settings.pwSuccess")}</p>}
            <button
              type="submit"
              className="st-btn st-btn--primary"
              disabled={updatePassword.isPending}
            >
              {updatePassword.isPending && <span className="btn-spin" />}{updatePassword.isPending ? t("common.saving") : t("settings.updatePassword")}
            </button>
          </form>
        </section>

        {/* ── Danger zone ──────────────────────────────────── */}
        <section className="st-section st-section--danger">
          <h2 className="st-section-title st-section-title--danger">{t("settings.dangerZone")}</h2>
          <p className="st-danger-desc">{t("settings.deleteDesc")}</p>
          <button className="st-btn st-btn--danger" onClick={() => setShowDeleteConfirm(true)}>
            {t("settings.deleteAccount")}
          </button>
        </section>

      </div>

      {showCancelConfirm && (
        <ConfirmModal
          message="Cancel your Premium subscription? You'll lose access to all premium features immediately."
          confirmLabel={cancel.isPending ? "Canceling…" : "Yes, cancel"}
          onConfirm={() => { cancel.mutate(); setShowCancelConfirm(false); }}
          onCancel={() => setShowCancelConfirm(false)}
          danger
        />
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          title={t("settings.deleteConfirmTitle")}
          message={t("settings.deleteConfirmMsg")}
          confirmLabel={deleting ? t("settings.deleting") : t("settings.deleteConfirm")}
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
          danger
        />
      )}
    </div>
  );
}
