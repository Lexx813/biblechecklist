import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "../styles/onboarding.css";

const STEPS = [
  { icon: "📖", key: "step1" },
  { icon: "💬", key: "step2" },
  { icon: "🧠", key: "step3" },
  { icon: "🔥", key: "step4" },
];

export default function OnboardingModal({ onClose }) {
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

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="onboard-overlay" role="dialog" aria-modal="true">
      <div className="onboard-modal">
        <button className="onboard-skip" onClick={handleSkip}>{t("onboarding.skip")}</button>

        <div className="onboard-icon">{current.icon}</div>
        <h2 className="onboard-title">{t(`onboarding.${current.key}Title`)}</h2>
        <p className="onboard-body">{t(`onboarding.${current.key}Body`)}</p>

        <div className="onboard-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboard-dot${i === step ? " onboard-dot--active" : ""}`} />
          ))}
        </div>

        <button className="onboard-next" onClick={handleNext}>
          {isLast ? t("onboarding.getStarted") : t("onboarding.next")}
        </button>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("nwt-onboarded")) {
      // Small delay so the app finishes rendering first
      const t = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(t);
    }
  }, []);
  return [show, () => setShow(false)];
}
