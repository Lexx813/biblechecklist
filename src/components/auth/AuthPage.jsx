import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLogin, useRegister } from "../../hooks/useAuth";
import "../../styles/auth.css";

export default function AuthPage({ onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { t } = useTranslation();

  const login = useLogin();
  const register = useRegister();

  const busy = login.isPending || register.isPending;
  const serverError = login.error?.message || register.error?.message;

  function switchMode(next) {
    setMode(next);
    setFieldError("");
    setConfirmed(false);
    login.reset();
    register.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError("");

    if (!email || !password) return setFieldError(t("auth.errorRequired"));

    if (mode === "signup") {
      if (password.length < 8) return setFieldError(t("auth.errorPasswordShort"));
      if (password !== confirm) return setFieldError(t("auth.errorPasswordMismatch"));
      register.mutate({ email, password }, {
        onSuccess: ({ needsConfirmation }) => {
          if (needsConfirmation) setConfirmed(true);
        },
      });
    } else {
      login.mutate({ email, password });
    }
  }

  if (confirmed) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">📖</div>
            <h1 className="auth-title">{t("auth.checkEmailTitle")}</h1>
            <p className="auth-subtitle">{t("auth.checkEmailSubtitle", { email })}</p>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t("auth.checkEmailBody")}
            </p>
            <button
              className="auth-switch-btn"
              style={{ marginTop: 16, fontSize: 13 }}
              onClick={() => switchMode("login")}
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      {onBack && (
        <button className="auth-back-btn" onClick={onBack}>{t("auth.back")}</button>
      )}
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📖</div>
          <h1 className="auth-title">{t("auth.title")}</h1>
          <p className="auth-subtitle">{t("auth.subtitle")}</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === "login" ? " active" : ""}`} onClick={() => switchMode("login")} type="button">{t("auth.tabLogin")}</button>
          <button className={`auth-tab${mode === "signup" ? " active" : ""}`} onClick={() => switchMode("signup")} type="button">{t("auth.tabSignup")}</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">{t("auth.emailLabel")}</label>
            <input id="email" className="auth-input" type="email" placeholder={t("auth.emailPlaceholder")}
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">{t("auth.passwordLabel")}</label>
            <input id="password" className="auth-input" type="password"
              placeholder={mode === "signup" ? t("auth.passwordPlaceholderSignup") : t("auth.passwordPlaceholderLogin")}
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} disabled={busy} />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm">{t("auth.confirmLabel")}</label>
              <input id="confirm" className="auth-input" type="password" placeholder={t("auth.confirmPlaceholder")}
                value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" disabled={busy} />
            </div>
          )}

          {(fieldError || serverError) && (
            <div className="auth-error">{fieldError || serverError}</div>
          )}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? t("auth.submitLoading") : mode === "login" ? t("auth.submitLogin") : t("auth.submitSignup")}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? t("auth.switchPromptLogin") : t("auth.switchPromptSignup")}{" "}
          <button type="button" className="auth-switch-btn" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? t("auth.switchSignupLink") : t("auth.switchLoginLink")}
          </button>
        </p>
      </div>
    </div>
  );
}
