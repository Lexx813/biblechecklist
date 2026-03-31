import { useState } from "react";
import { profileApi } from "../api/profile";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Full-screen consent gate shown to any authenticated user who hasn't yet
 * accepted the Terms of Service (email signup or Google OAuth).
 * Cannot be dismissed without checking both boxes.
 */
export default function ConsentGate({ userId }) {
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();

  async function handleAccept() {
    if (!agreeAge || !agreeTerms) return;
    setBusy(true);
    setError("");
    try {
      await profileApi.acceptTerms(userId);
      await qc.invalidateQueries({ queryKey: ["full-profile", userId] });
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="consent-gate">
      <div className="consent-gate-card">
        <div className="consent-gate-icon">📋</div>
        <h1 className="consent-gate-title">Before you continue</h1>
        <p className="consent-gate-body">
          We've updated our Terms of Service and Privacy Policy. Please review and agree to continue using NWT Progress.
        </p>

        <div className="consent-gate-links">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="consent-gate-link">Terms of Service</a>
          <span className="consent-gate-link-sep">·</span>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="consent-gate-link">Privacy Policy</a>
        </div>

        <div className="consent-gate-checks">
          <label className="consent-gate-label">
            <input
              type="checkbox"
              className="consent-gate-check"
              checked={agreeAge}
              onChange={e => setAgreeAge(e.target.checked)}
              disabled={busy}
            />
            <span>
              I am <strong>13 years of age or older</strong>. If I am under 18, I have my parent or guardian's permission to use this app.
            </span>
          </label>

          <label className="consent-gate-label">
            <input
              type="checkbox"
              className="consent-gate-check"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              disabled={busy}
            />
            <span>
              I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>, including the <strong>Child Safety Policy</strong>. I understand that violations involving child safety will be reported to law enforcement.
            </span>
          </label>
        </div>

        {error && <p className="consent-gate-error">{error}</p>}

        <button
          className="consent-gate-btn"
          onClick={handleAccept}
          disabled={!agreeAge || !agreeTerms || busy}
        >
          {busy ? "Saving…" : "I Agree — Continue"}
        </button>
      </div>
    </div>
  );
}
