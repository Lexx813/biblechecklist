import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useUpdateProfile } from "../hooks/useAdmin";
import { usePushNotifications } from "../hooks/usePushNotifications";
import "../styles/onboarding.css";

const CHOICES = [
  {
    key: "track",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    titleKey: "onboarding.choiceTrack",
    subKey: "onboarding.choiceTrackSub",
    page: "main",
  },
  {
    key: "plan",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    titleKey: "onboarding.choicePlan",
    subKey: "onboarding.choicePlanSub",
    page: "readingPlans",
  },
  {
    key: "quiz",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    titleKey: "onboarding.choiceQuiz",
    subKey: "onboarding.choiceQuizSub",
    page: "quiz",
  },
];

export default function OnboardingModal({ onClose, onUpgrade, navigate, user }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0=intent, 1=goal, 2=notif
  const [selectedPage, setSelectedPage] = useState(null);
  const [goalInput, setGoalInput] = useState(3);
  const updateProfile = useUpdateProfile(user?.id);
  const { subscribe: requestPushPermission } = usePushNotifications();

  function complete(destination) {
    localStorage.setItem("nwt-onboarded", "1");
    onClose();
    if (destination) navigate?.(destination);
  }

  function handleChoiceSelect(page) {
    setSelectedPage(page);
    setStep(1);
  }

  function handleGoalSave() {
    const g = Math.min(30, Math.max(1, parseInt(goalInput) || 1));
    updateProfile.mutate({ daily_chapter_goal: g });
    setStep(2);
  }

  function handleEnableNotif() {
    requestPushPermission?.();
    complete(selectedPage);
  }

  function handleSkipNotif() {
    complete(selectedPage);
  }

  return createPortal(
    <div className="onboard-overlay" role="dialog" aria-modal="true">
      <div className="onboard-modal onboard-modal--v2">
        {step === 0 && (
          <>
            <h2 className="onboard-title">
              {t("onboarding.welcomeTitle", { name: user?.user_metadata?.full_name?.split(" ")[0] ?? "" })}
            </h2>
            <p className="onboard-body">{t("onboarding.welcomeSub")}</p>
            <div className="onboard-choices">
              {CHOICES.map(c => (
                <button
                  key={c.key}
                  className="onboard-choice"
                  onClick={() => handleChoiceSelect(c.page)}
                >
                  <span className="onboard-choice-icon">{c.icon}</span>
                  <div className="onboard-choice-text">
                    <strong>{t(c.titleKey)}</strong>
                    <span>{t(c.subKey)}</span>
                  </div>
                  <span className="onboard-choice-arrow">›</span>
                </button>
              ))}
            </div>
            <p className="onboard-choice-note">{t("onboarding.choiceNote")}</p>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="onboard-title">{t("onboarding.goalTitle")}</h2>
            <p className="onboard-body">{t("onboarding.goalSub")}</p>
            <div className="onboard-goal-row">
              <button className="onboard-goal-btn" onClick={() => setGoalInput(v => Math.max(1, v - 1))}>−</button>
              <span className="onboard-goal-value">{goalInput}</span>
              <button className="onboard-goal-btn" onClick={() => setGoalInput(v => Math.min(30, v + 1))}>+</button>
            </div>
            <button className="onboard-next" onClick={handleGoalSave} disabled={updateProfile.isPending}>
              {t("onboarding.goalSet")}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="onboard-title">{t("onboarding.notifTitle")}</h2>
            <p className="onboard-body">{t("onboarding.notifSub")}</p>
            <button className="onboard-next" onClick={handleEnableNotif}>
              {t("onboarding.notifEnable")}
            </button>
            <button className="onboard-skip-inline" onClick={handleSkipNotif}>
              {t("onboarding.notifLater")}
            </button>
          </>
        )}

        <div className="onboard-dots">
          {[0, 1, 2].map(i => (
            <span key={i} className={`onboard-dot${i === step ? " onboard-dot--active" : ""}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function useOnboarding(userCreatedAt) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("nwt-onboarded")) return;
    if (userCreatedAt === undefined) return;
    if (userCreatedAt) {
      const ageMs = Date.now() - new Date(userCreatedAt).getTime();
      if (ageMs > 2 * 24 * 60 * 60 * 1000) {
        localStorage.setItem("nwt-onboarded", "1");
        return;
      }
    }
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, [userCreatedAt]);
  return [show, () => setShow(false)];
}
