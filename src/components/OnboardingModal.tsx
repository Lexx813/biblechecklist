import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useUpdateProfile } from "../hooks/useAdmin";
import { useEnrollPlan } from "../hooks/useReadingPlans";
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
  },
  {
    key: "study",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    titleKey: "onboarding.choiceQuiz",
    subKey: "onboarding.choiceQuizSub",
  },
  {
    key: "connect",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    titleKey: "onboarding.choiceConnect",
    subKey: "onboarding.choiceConnectSub",
  },
];

const PLAN_OPTIONS = [
  { key: "nwt-1year",     label: "1 Year",        meta: "3–4 chapters/day · finish Dec 31", popular: true },
  { key: "nwt-2year",     label: "2 Years",        meta: "1–2 chapters/day · low pressure",  popular: false },
  { key: "chronological", label: "Chronological",  meta: "Events in historical order",       popular: false },
  { key: "none",          label: "No plan for now", meta: "Read freely at your own pace",    popular: false },
];

const GOAL_PRESETS = [
  { value: 1, label: "1", sub: "Easy" },
  { value: 3, label: "3", sub: "Balanced" },
  { value: 5, label: "5", sub: "Fast" },
];

interface User {
  id?: string;
  user_metadata?: { full_name?: string };
}

interface Props {
  onClose: () => void;
  navigate?: (page: string, params?: Record<string, unknown>) => void;
  user?: User;
}

export default function OnboardingModal({ onClose, navigate, user }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0); // 0=intent, 1=plan, 2=goal, 3=done
  const [goalInput, setGoalInput] = useState(3);
  const updateProfile = useUpdateProfile(user?.id);
  const enrollPlan = useEnrollPlan();

  function complete(destination?: string, params?: Record<string, unknown>) {
    localStorage.setItem("nwt-onboarded", "1");
    onClose();
    if (destination) navigate?.(destination, params);
  }

  function handleChoiceSelect() {
    setStep(1);
  }

  function handlePlanSelect(planKey: string) {
    if (planKey !== "none") {
      enrollPlan.mutate(planKey);
    }
    setStep(2);
  }

  function handleGoalSave() {
    const g = Math.min(30, Math.max(1, goalInput || 1));
    updateProfile.mutate({ daily_chapter_goal: g });
    setStep(3);
  }

  return createPortal(
    <div className="onboard-overlay" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
      <div className="onboard-modal onboard-modal--v2">

        {/* Step 0: Intent */}
        {step === 0 && (
          <>
            <h2 className="onboard-title" id="onboard-title">
              {t("onboarding.welcomeTitle", { name: user?.user_metadata?.full_name?.split(" ")[0] ?? "" })}
            </h2>
            <p className="onboard-body">{t("onboarding.welcomeSub")}</p>
            <div className="onboard-choices">
              {CHOICES.map(c => (
                <button key={c.key} className="onboard-choice" onClick={handleChoiceSelect}>
                  <span className="onboard-choice-icon">{c.icon}</span>
                  <div className="onboard-choice-text">
                    <strong>{t(c.titleKey, c.key)}</strong>
                    <span>{t(c.subKey, "")}</span>
                  </div>
                  <span className="onboard-choice-arrow">›</span>
                </button>
              ))}
            </div>
            <p className="onboard-choice-note">{t("onboarding.choiceNote", "You can change this anytime.")}</p>
          </>
        )}

        {/* Step 1: Plan picker */}
        {step === 1 && (
          <>
            <h2 className="onboard-title" id="onboard-title">
              {t("onboarding.planTitle", "Pick a reading plan")}
            </h2>
            <p className="onboard-body">
              {t("onboarding.planSub", "You can always change or pause this later.")}
            </p>
            <div className="onboard-plans">
              {PLAN_OPTIONS.map(plan => (
                <button
                  key={plan.key}
                  className={`onboard-plan${plan.popular ? " onboard-plan--popular" : ""}`}
                  onClick={() => handlePlanSelect(plan.key)}
                >
                  <div>
                    <div className="onboard-plan-name">{plan.label}</div>
                    <div className="onboard-plan-meta">{plan.meta}</div>
                  </div>
                  {plan.popular && <span className="onboard-plan-badge">⭐ Popular</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Daily goal */}
        {step === 2 && (
          <>
            <h2 className="onboard-title" id="onboard-title">{t("onboarding.goalTitle")}</h2>
            <p className="onboard-body">{t("onboarding.goalSub")}</p>
            <div className="onboard-goal-row">
              <button className="onboard-goal-btn" onClick={() => setGoalInput(v => Math.max(1, v - 1))}>−</button>
              <span className="onboard-goal-value">{goalInput}</span>
              <button className="onboard-goal-btn" onClick={() => setGoalInput(v => Math.min(30, v + 1))}>+</button>
            </div>
            <div className="onboard-goal-presets">
              {GOAL_PRESETS.map(p => (
                <button
                  key={p.value}
                  className={`onboard-preset${goalInput === p.value ? " onboard-preset--active" : ""}`}
                  onClick={() => setGoalInput(p.value)}
                >
                  <div style={{ fontWeight: 700 }}>{p.label}</div>
                  <div>{p.sub}</div>
                </button>
              ))}
            </div>
            <button className="onboard-next" onClick={handleGoalSave} disabled={updateProfile.isPending}>
              {t("onboarding.goalSet", "Set my goal")}
            </button>
          </>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <>
            <div className="onboard-done-icon">🎉</div>
            <h2 className="onboard-title" id="onboard-title">
              {t("onboarding.doneTitle", "You're all set!")}
            </h2>
            <p className="onboard-body">
              {t("onboarding.doneSub", "Mark your first chapter to start your reading streak.")}
            </p>
            <button className="onboard-next" onClick={() => complete("main", { openBook: 0, openChapter: 1 })}>
              {t("onboarding.doneAction", "Mark Genesis 1 as read →")}
            </button>
            <button className="onboard-skip-inline" onClick={() => complete("home")}>
              {t("onboarding.doneSkip", "Explore the app first")}
            </button>
          </>
        )}

        <div className="onboard-dots">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`onboard-dot${i === step ? " onboard-dot--active" : ""}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function useOnboarding(userCreatedAt: string | undefined | null): [boolean, () => void] {
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
