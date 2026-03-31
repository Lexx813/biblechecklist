import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import "../styles/onboarding.css";

const Icons = {
  Book:    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Users:   <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Quiz:    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Flame:   <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  Sparkle: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/><path d="M5 3L5.5 4.5L7 5L5.5 5.5L5 7L4.5 5.5L3 5L4.5 4.5Z"/><path d="M19 17L19.5 18.5L21 19L19.5 19.5L19 21L18.5 19.5L17 19L18.5 18.5Z"/></svg>,
};

const STEPS = [
  { iconKey: "Book",    key: "step1" },
  { iconKey: "Users",   key: "step2" },
  { iconKey: "Quiz",    key: "step3" },
  { iconKey: "Flame",   key: "step4" },
  { iconKey: "Sparkle", key: "step5", isPremium: true },
];

export default function OnboardingModal({ onClose, onUpgrade }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem("nwt-onboarded", "1");
      onClose();
    }
  }

  function handleSkip() {
    localStorage.setItem("nwt-onboarded", "1");
    onClose();
  }

  function handleUpgrade() {
    localStorage.setItem("nwt-onboarded", "1");
    onClose();
    onUpgrade?.();
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isPremiumStep = current.isPremium;

  return createPortal(
    <div className="onboard-overlay" role="dialog" aria-modal="true">
      <div className={`onboard-modal${isPremiumStep ? " onboard-modal--premium" : ""}`}>
        {!isPremiumStep && (
          <button className="onboard-skip" onClick={handleSkip}>{t("onboarding.skip")}</button>
        )}

        <div className={`onboard-icon-wrap${isPremiumStep ? " onboard-icon-wrap--premium" : ""}`}>
          {Icons[current.iconKey]}
        </div>

        <h2 className="onboard-title">{t(`onboarding.${current.key}Title`)}</h2>
        <p className="onboard-body">{t(`onboarding.${current.key}Body`)}</p>

        <div className="onboard-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboard-dot${i === step ? " onboard-dot--active" : ""}${STEPS[i].isPremium ? " onboard-dot--premium" : ""}`} />
          ))}
        </div>

        {isPremiumStep ? (
          <div className="onboard-premium-actions">
            <button className="onboard-upgrade" onClick={handleUpgrade}>
              {t("onboarding.seePremium")}
            </button>
            <button className="onboard-skip-inline" onClick={handleSkip}>
              {t("onboarding.maybeLater")}
            </button>
          </div>
        ) : (
          <button className="onboard-next" onClick={handleNext}>
            {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("nwt-onboarded")) {
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);
  return [show, () => setShow(false)];
}
