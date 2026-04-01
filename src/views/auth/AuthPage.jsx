import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLogin, useRegister, useResetPassword } from "../../hooks/useAuth";
import { authApi } from "../../api/auth";
import "../../styles/auth.css";

export default function AuthPage({ onBack, onRegisterSuccess, confirmedEmail, onConfirmDismiss }) {
  const [mode, setMode] = useState("login"); // "login" | "signup" | "forgot"
  const [darkMode, setDarkMode] = useState(() => document.documentElement.dataset.theme === "dark");

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("nwt-theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { t } = useTranslation();

  const login = useLogin();
  const register = useRegister();
  const resetPassword = useResetPassword();

  const busy = login.isPending || register.isPending || resetPassword.isPending || googleBusy;
  const serverError = login.error?.message || register.error?.message || resetPassword.error?.message;

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    try {
      await authApi.signInWithGoogle();
    } catch (err) {
      setFieldError(err.message);
      setGoogleBusy(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setFieldError("");
    setResetSent(false);
    setAgreeAge(false);
    setAgreeTerms(false);
    login.reset();
    register.reset();
    resetPassword.reset();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError("");

    if (mode === "forgot") {
      if (!email) return setFieldError(t("auth.errorEmailRequired"));
      resetPassword.mutate(email, { onSuccess: () => setResetSent(true) });
      return;
    }

    if (!email || !password) return setFieldError(t("auth.errorRequired"));

    if (mode === "signup") {
      if (!displayName.trim()) return setFieldError(t("auth.errorDisplayNameRequired"));
      if (password.length < 8) return setFieldError(t("auth.errorPasswordShort"));
      if (password !== confirm) return setFieldError(t("auth.errorPasswordMismatch"));
      if (!agreeAge) return setFieldError("Please confirm your age or parental consent.");
      if (!agreeTerms) return setFieldError("Please agree to the Terms of Service and Privacy Policy.");
      register.mutate({ email, password, displayName: displayName.trim() }, {
        onSuccess: () => {
          onRegisterSuccess?.(email);
        },
      });
    } else {
      login.mutate({ email, password }, {
        onError: () => setPassword(""),
      });
    }
  }

  if (resetSent) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">✉️</div>
            <h1 className="auth-title">{t("auth.resetSentTitle")}</h1>
            <p className="auth-subtitle">{t("auth.resetSentSubtitle", { email })}</p>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t("auth.resetSentBody")}
            </p>
            <button className="auth-switch-btn" style={{ marginTop: 16, fontSize: 13 }} onClick={() => switchMode("login")}>
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirmedEmail) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg></div>
            <h1 className="auth-title">{t("auth.checkEmailTitle")}</h1>
            <p className="auth-subtitle">{t("auth.checkEmailSubtitle", { email: confirmedEmail })}</p>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t("auth.checkEmailBody")}
            </p>
            <button
              className="auth-switch-btn"
              style={{ marginTop: 16, fontSize: 13 }}
              onClick={onConfirmDismiss}
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <div className="auth-wrap">
        {onBack && (
          <button className="back-btn" onClick={onBack}>{t("auth.back")}</button>
        )}
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🔑</div>
            <h1 className="auth-title">{t("auth.forgotTitle")}</h1>
            <p className="auth-subtitle">{t("auth.forgotSubtitle")}</p>
          </div>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-email">{t("auth.emailLabel")}</label>
              <input id="reset-email" className="auth-input" type="email" placeholder={t("auth.emailPlaceholder")}
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy} autoFocus />
            </div>

            {(fieldError || serverError) && (
              <div className="auth-error">{fieldError || serverError}</div>
            )}

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? t("auth.submitLoading") : t("auth.resetSendBtn")}
            </button>
          </form>
          <p className="auth-switch">
            <button type="button" className="auth-switch-btn" onClick={() => switchMode("login")}>
              {t("auth.backToLogin")}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-topbar">
        {onBack && (
          <button className="back-btn" onClick={onBack}>{t("auth.back")}</button>
        )}
        <button className="auth-theme-toggle" onClick={() => setDarkMode(d => !d)} title={darkMode ? "Light mode" : "Dark mode"}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg></div>
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
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete={mode === "login" ? "username" : "email"} disabled={busy} />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="displayName">{t("auth.displayNameLabel")}</label>
              <input id="displayName" className="auth-input" type="text"
                placeholder={t("auth.displayNamePlaceholder")}
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                autoComplete="nickname" disabled={busy} maxLength={32} />
              <span className="auth-field-hint">{t("auth.displayNameHint")}</span>
            </div>
          )}

          <div className="auth-field">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="password">{t("auth.passwordLabel")}</label>
              {mode === "login" && (
                <button type="button" className="auth-forgot-btn" onClick={() => switchMode("forgot")}>
                  {t("auth.forgotLink")}
                </button>
              )}
            </div>
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

          {mode === "signup" && (
            <div className="auth-consents">
              <label className="auth-consent-label">
                <input
                  type="checkbox"
                  className="auth-consent-check"
                  checked={agreeAge}
                  onChange={e => setAgreeAge(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  I am <strong>13 years of age or older</strong>. If I am under 18, I have my parent or guardian's permission to use this app and they have read the{" "}
                  <button type="button" className="auth-policy-link" onClick={() => window.open("/terms", "_blank")}>Terms of Service</button>.
                </span>
              </label>
              <label className="auth-consent-label">
                <input
                  type="checkbox"
                  className="auth-consent-check"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                  disabled={busy}
                />
                <span>
                  I agree to the{" "}
                  <button type="button" className="auth-policy-link" onClick={() => window.open("/terms", "_blank")}>Terms of Service</button>
                  {" "}and{" "}
                  <button type="button" className="auth-policy-link" onClick={() => window.open("/privacy", "_blank")}>Privacy Policy</button>
                  , including the <strong>Child Safety Policy</strong>.
                </span>
              </label>
            </div>
          )}

          {(fieldError || serverError) && (
            <div className="auth-error">{fieldError || serverError}</div>
          )}

          <button className="auth-submit" type="submit" disabled={busy || (mode === "signup" && (!agreeAge || !agreeTerms))}>
            {busy && !googleBusy ? t("auth.submitLoading") : mode === "login" ? t("auth.submitLogin") : t("auth.submitSignup")}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-social">
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleSignIn}
            disabled={busy}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleBusy ? "Redirecting…" : "Continue with Google"}
          </button>
        </div>

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
