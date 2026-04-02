// @ts-nocheck
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUpdatePassword } from "../../hooks/useAuth";
import "../../styles/auth.css";

export default function ResetPasswordPage({ onDone }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [done, setDone] = useState(false);
  const updatePassword = useUpdatePassword();

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError("");
    if (password.length < 8) return setFieldError(t("auth.errorPasswordShort"));
    if (password !== confirm) return setFieldError(t("auth.errorPasswordMismatch"));
    updatePassword.mutate(password, {
      onSuccess: () => setDone(true),
      onError: (err) => setFieldError(err.message),
    });
  }

  if (done) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">✅</div>
            <h1 className="auth-title">{t("auth.resetDoneTitle")}</h1>
            <p className="auth-subtitle">{t("auth.resetDoneSubtitle")}</p>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <button className="auth-submit" onClick={onDone}>
              {t("auth.resetDoneCta")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🔑</div>
          <h1 className="auth-title">{t("auth.resetNewTitle")}</h1>
          <p className="auth-subtitle">{t("auth.resetNewSubtitle")}</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="new-password">{t("auth.newPasswordLabel")}</label>
            <input
              id="new-password"
              name="new-password"
              className="auth-input"
              type="password"
              placeholder={t("auth.passwordPlaceholderSignup")}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              disabled={updatePassword.isPending}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-password">{t("auth.confirmLabel")}</label>
            <input
              id="confirm-password"
              name="confirm-password"
              className="auth-input"
              type="password"
              placeholder={t("auth.confirmPlaceholder")}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={updatePassword.isPending}
            />
          </div>
          {fieldError && <div className="auth-error">{fieldError}</div>}
          <button className="auth-submit" type="submit" disabled={updatePassword.isPending}>
            {updatePassword.isPending ? t("auth.submitLoading") : t("auth.resetSetBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}
