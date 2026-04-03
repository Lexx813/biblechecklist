import { useState, useRef } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../../components/ConfirmModal";
import { useMeta } from "../../hooks/useMeta";
import { useFullProfile, useUpdateProfile, useUploadAvatar } from "../../hooks/useAdmin";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useUpdatePassword, useIdentities, useLinkGoogle, useUnlinkGoogle } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { useMyBlocks, useUnblockUser } from "../../hooks/useBlocks";
import { adminApi } from "../../api/admin";
import "../../styles/profile.css";
import AppLayout from "../../components/AppLayout";
import "../../styles/settings.css";

export default function SettingsPage({ user, onBack, navigate, darkMode, setDarkMode, i18n, onLogout, onUpgrade }) {
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
  const { supported: pushSupported, permission, subscribed, loading: pushLoading, error: pushError, subscribe, unsubscribe } = usePushNotifications();
  const emailBlog   = profile?.email_notifications_blog   ?? false;
  const emailDigest = profile?.email_notifications_digest ?? false;
  const emailStreak = profile?.email_notifications_streak ?? false;

  const emailToggles = [
    { key: "email_notifications_blog",   value: emailBlog,   labelKey: "notifBlogLabel",   descKey: "notifBlogDesc" },
    { key: "email_notifications_digest", value: emailDigest, labelKey: "notifDigestLabel", descKey: "notifDigestDesc" },
    { key: "email_notifications_streak", value: emailStreak, labelKey: "notifStreakLabel", descKey: "notifStreakDesc" },
  ];

  // ── Change password ───────────────────────────────────────
  const { data: identities = [] } = useIdentities();
  const linkGoogle   = useLinkGoogle();
  const unlinkGoogle = useUnlinkGoogle();
  const googleIdentity  = identities.find(i => i.provider === "google");
  const hasPasswordLogin = identities.some(i => i.provider === "email");

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

  // ── Blocked users ─────────────────────────────────────────
  const { data: blockedUsers = [] } = useMyBlocks(user.id);
  const unblockUser = useUnblockUser();

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

  if (isLoading) return <LoadingSpinner />;

  const displayName = profile?.display_name || user.email?.split("@")[0] || "";
  const avatarUrl = profile?.avatar_url;

  return (
    <AppLayout navigate={navigate} user={user} currentPage="settings">
    <div className="st-wrap">

      <header className="st-header">
        <div className="st-header-inner">
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

        {/* ── Connected accounts ───────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">{t("settings.connectedAccounts")}</h2>
          <div className="st-connected-row">
            <div className="st-connected-info">
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <div>
                <span className="st-toggle-label">Google</span>
                <span className="st-toggle-desc" style={{ display: "block" }}>
                  {googleIdentity ? t("settings.connected") : t("settings.notConnected")}
                </span>
              </div>
            </div>
            {googleIdentity ? (
              <button
                className="st-btn st-btn--ghost"
                onClick={() => unlinkGoogle.mutate(googleIdentity)}
                disabled={unlinkGoogle.isPending || !hasPasswordLogin}
                title={!hasPasswordLogin ? t("settings.setPasswordFirst") : undefined}
              >
                {unlinkGoogle.isPending ? t("settings.disconnecting") : t("settings.disconnect")}
              </button>
            ) : (
              <button
                className="st-btn st-btn--secondary"
                onClick={() => linkGoogle.mutate()}
                disabled={linkGoogle.isPending}
              >
                {linkGoogle.isPending ? t("settings.redirecting") : t("settings.connect")}
              </button>
            )}
          </div>
          {googleIdentity && !hasPasswordLogin && (
            <p className="st-error" style={{ marginTop: 8, fontSize: 12 }}>
              {t("settings.setPasswordWarning")}
            </p>
          )}
        </section>

        {/* ── Notifications ────────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">{t("profile.notificationsTitle")}</h2>

          {pushSupported && (
            <>
              <div className="st-toggle-row">
                <div className="st-toggle-info">
                  <span className="st-toggle-label">{t("profile.notifPushLabel")}</span>
                  <span className="st-toggle-desc">
                    {permission === "denied"
                      ? t("profile.notifPushDenied")
                      : subscribed
                        ? t("profile.notifPushEnabled", "Enabled — you'll receive message notifications")
                        : t("profile.notifPushDesc")}
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={subscribed}
                  className={`pf-toggle${subscribed ? " pf-toggle--on" : ""}${pushLoading ? " pf-toggle--loading" : ""}`}
                  onClick={subscribed ? unsubscribe : subscribe}
                  disabled={pushLoading || permission === "denied"}
                  title={pushLoading ? "Working…" : permission === "denied" ? "Notifications blocked in browser settings" : undefined}
                >
                  <span className="pf-toggle-thumb" />
                </button>
              </div>
              {pushError && (
                <p className="st-error" style={{ marginTop: 6, fontSize: "0.8rem" }}>{pushError}</p>
              )}
            </>
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

        {/* ── Privacy ──────────────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">Privacy</h2>
          <div className="st-toggle-row">
            <div className="st-toggle-info">
              <span className="st-toggle-label">Show me as online</span>
              <span className="st-toggle-desc">When off, you won't appear in the Who's Online list.</span>
            </div>
            <button
              role="switch"
              aria-checked={profile?.show_online ?? true}
              className={`pf-toggle${(profile?.show_online ?? true) ? " pf-toggle--on" : ""}`}
              onClick={() => update.mutate({ show_online: !(profile?.show_online ?? true) })}
              disabled={update.isPending}
            >
              <span className="pf-toggle-thumb" />
            </button>
          </div>
        </section>

        {/* ── Subscription ─────────────────────────────────── */}
        {true && (
          <section className="st-section">
            <h2 className="st-section-title">{t("settings.subscriptionSection")}</h2>
            {isPremium ? (
              <div className="st-sub-active">
                <div className="st-sub-status">
                  <span className="st-sub-badge st-sub-badge--active">
                    ✦ Premium
                  </span>
                  <span className="st-sub-status-label">
                    {status === "trialing" ? t("settings.trialActive") : t("settings.subscriptionActive")}
                  </span>
                </div>
                <p className="st-sub-desc">
                  {t("settings.subscriptionDesc")}
                </p>
                <button
                  className="st-btn st-btn--ghost st-sub-cancel-btn"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  {t("settings.cancelSubscription")}
                </button>
              </div>
            ) : (
              <div className="st-sub-inactive">
                <p className="st-sub-desc">
                  {t("settings.subscriptionDesc")}
                </p>
                <button
                  className="st-btn st-btn--primary"
                  onClick={() => startCheckout.mutate()}
                  disabled={startCheckout.isPending}
                >
                  {startCheckout.isPending ? t("settings.redirecting") : t("settings.upgradePrompt")}
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

        {/* ── Blocked Users ───────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">Privacy — Blocked Users</h2>
          {blockedUsers.length === 0 ? (
            <p className="st-danger-desc">You haven't blocked anyone.</p>
          ) : (
            blockedUsers.map(u => (
              <div key={u.id} className="st-toggle-row">
                <div className="st-toggle-info">
                  <span className="st-toggle-label">{u.display_name || "Unknown user"}</span>
                </div>
                <button
                  className="st-btn st-btn--ghost"
                  onClick={() => unblockUser.mutate(u.id)}
                  disabled={unblockUser.isPending}
                >
                  Unblock
                </button>
              </div>
            ))
          )}
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
    </AppLayout>
  );
}
