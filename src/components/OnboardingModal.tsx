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
  const [step, setStep] = useState(0); // 0=intent, 1=plan, 2=goal, 3=ai, 4=done
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

  function openAIWithSample(prompt: string) {
    localStorage.setItem("nwt-onboarded", "1");
    onClose();
    window.location.href = `/ai?ask=${encodeURIComponent(prompt)}`;
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

        {/* Step 3: Meet the AI Companion */}
        {step === 3 && (
          <>
            <div className="onboard-ai-icon" aria-hidden>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/>
                <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/>
              </svg>
            </div>
            <h2 className="onboard-title" id="onboard-title">
              Meet your AI Study Companion
            </h2>
            <p className="onboard-body">
              Grounded in the NWT and JW publications. Ask anything, about a verse, this week's meeting, or your own progress, and it responds in seconds.
            </p>
            <div className="onboard-ai-samples">
              <button
                className="onboard-ai-sample"
                onClick={() => openAIWithSample("What does the Bible say about why God allows suffering?")}
              >
                <span aria-hidden>›</span>
                &ldquo;What does the Bible say about why God allows suffering?&rdquo;
              </button>
              <button
                className="onboard-ai-sample"
                onClick={() => openAIWithSample("Walk me through this week's CLAM meeting")}
              >
                <span aria-hidden>›</span>
                &ldquo;Walk me through this week&rsquo;s CLAM meeting&rdquo;
              </button>
              <button
                className="onboard-ai-sample"
                onClick={() => openAIWithSample("Why don't Jehovah's Witnesses celebrate birthdays?")}
              >
                <span aria-hidden>›</span>
                &ldquo;Why don&rsquo;t Jehovah&rsquo;s Witnesses celebrate birthdays?&rdquo;
              </button>
            </div>
            <button className="onboard-skip-inline" onClick={() => setStep(4)}>
              Skip for now
            </button>
          </>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
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
          {[0, 1, 2, 3, 4].map(i => (
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
