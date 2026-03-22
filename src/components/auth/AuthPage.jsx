import { useState } from "react";
import { useLogin, useRegister } from "../../hooks/useAuth";
import "../../styles/auth.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

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

    if (!email || !password) return setFieldError("All fields are required.");

    if (mode === "signup") {
      if (password.length < 8) return setFieldError("Password must be at least 8 characters.");
      if (password !== confirm) return setFieldError("Passwords do not match.");
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
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">We sent a confirmation link to {email}</p>
          </div>
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Click the link in the email to activate your account, then come back here to log in.
            </p>
            <button
              className="auth-switch-btn"
              style={{ marginTop: 16, fontSize: 13 }}
              onClick={() => switchMode("login")}
            >
              Back to log in
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
          <div className="auth-logo">📖</div>
          <h1 className="auth-title">Bible Reading Checklist</h1>
          <p className="auth-subtitle">New World Translation · 66 Books</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${mode === "login" ? " active" : ""}`} onClick={() => switchMode("login")} type="button">Log In</button>
          <button className={`auth-tab${mode === "signup" ? " active" : ""}`} onClick={() => switchMode("signup")} type="button">Sign Up</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input id="email" className="auth-input" type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" disabled={busy} />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input id="password" className="auth-input" type="password"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} disabled={busy} />
          </div>

          {mode === "signup" && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm">Confirm Password</label>
              <input id="confirm" className="auth-input" type="password" placeholder="Repeat your password"
                value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" disabled={busy} />
            </div>
          )}

          {(fieldError || serverError) && (
            <div className="auth-error">{fieldError || serverError}</div>
          )}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="auth-switch-btn" onClick={() => switchMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
