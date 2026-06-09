import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { profileApi } from "../api/profile";
import { useQueryClient } from "@tanstack/react-query";
import "../styles/auth.css";

/**
 * Full-screen consent gate shown to any authenticated user who hasn't yet
 * accepted the Terms of Service (email signup or Google OAuth).
 * Cannot be dismissed without checking both boxes.
 */

interface Props {
  userId: string;
}

export default function ConsentGate({ userId }: Props) {
  const [agreeAge, setAgreeAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const { t } = useTranslation();

  async function handleAccept() {
    if (!agreeAge || !agreeTerms) return;
    setBusy(true);
    setError("");
    try {
      await profileApi.acceptTerms(userId);
      await qc.invalidateQueries({ queryKey: ["fullProfile", userId] });
    } catch {
      setError(t("consent.error"));
      setBusy(false);
    }
  }

  const canContinue = agreeAge && agreeTerms && !busy;

  return (
    <div className="cg-backdrop">
      <div className="cg-card">

        {/* Header accent */}
        <div className="cg-header">
          <div className="cg-icon-ring">
            <svg className="cg-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" fill="currentColor" opacity="0.15"/>
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7l-9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="cg-title">{t("consent.title")}</h1>
          <p className="cg-subtitle">
            {t("consent.subtitle")}
          </p>
        </div>

        {/* Policy links */}
        <div className="cg-policy-links">
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="cg-policy-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("consent.termsLink")}
          </a>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="cg-policy-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("consent.privacyLink")}
          </a>
        </div>

        {/* Checkboxes */}
        <div className="cg-checks">
          <label className={`cg-check-row${agreeAge ? " cg-check-row--checked" : ""}`}>
            <span className="cg-check-box" aria-hidden="true">
              {agreeAge && (
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              className="cg-check-input"
              checked={agreeAge}
              onChange={e => setAgreeAge(e.target.checked)}
              disabled={busy}
            />
            <span className="cg-check-text">
              <Trans i18nKey="consent.ageCheckbox" components={{ strong: <strong /> }} />
            </span>
          </label>

          <label className={`cg-check-row${agreeTerms ? " cg-check-row--checked" : ""}`}>
            <span className="cg-check-box" aria-hidden="true">
              {agreeTerms && (
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              className="cg-check-input"
              checked={agreeTerms}
              onChange={e => setAgreeTerms(e.target.checked)}
              disabled={busy}
            />
            <span className="cg-check-text">
              <Trans i18nKey="consent.agreeCheckbox" components={{ strong: <strong /> }} />
            </span>
          </label>
        </div>

        {error && (
          <div className="cg-error" role="alert">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        <button
          className="cg-btn"
          onClick={handleAccept}
          disabled={!canContinue}
          aria-disabled={!canContinue}
        >
          {busy ? (
            <>
              <span className="cg-btn-spinner" aria-hidden="true" />
              {t("consent.saving")}
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              {t("consent.agreeButton")}
            </>
          )}
        </button>

        <p className="cg-footer">
          {t("consent.footer")}
        </p>
      </div>
    </div>
  );
}
