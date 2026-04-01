# Full-Site Improvement Sprint — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship landing page conversion improvements, action-first onboarding, a "Today's Focus" daily habit widget, and contextual premium upgrade prompts across the app.

**Architecture:** Four independent areas in implementation order: (1) shared UpgradePrompt infrastructure → (2) contextual feature-gate prompts in AuthedApp + event triggers → (3) TodaysFocusCard home widget → (4) onboarding overhaul → (5) landing page copy updates.

**Tech Stack:** React 19, Next.js 15 App Router, vanilla CSS (one file per feature), TanStack Query v5, react-i18next, Supabase, no test runner (verify manually in `next dev`).

---

## File Map

**Create:**
- `src/components/UpgradePrompt.jsx` — reusable bottom-sheet upgrade modal with dismiss persistence
- `src/styles/upgrade-prompt.css` — styles for UpgradePrompt
- `src/components/home/TodaysFocusCard.jsx` — today's plan assignment + continue reading row
- `src/styles/todays-focus.css` — styles for TodaysFocusCard

**Modify:**
- `src/AuthedApp.jsx` — replace generic `openUpgrade()` on gated routes with contextual UpgradePrompt
- `src/views/ChecklistPage.jsx` — book completion trigger
- `src/views/HomePage.jsx` — streak milestone trigger + rotating banner + wire TodaysFocusCard
- `src/views/quiz/QuizPage.jsx` — quiz level badge trigger
- `src/components/OnboardingModal.jsx` — 3-step action-first flow
- `src/styles/onboarding.css` — updated styles for intent picker
- `src/locales/en/translation.json` — new onboarding copy keys
- `src/views/LandingPage.jsx` — hero, feature pills, social proof, how-it-works, testimonials
- `src/styles/landing.css` — styles for new landing sections

---

## Task 1: UpgradePrompt Component

**Files:**
- Create: `src/components/UpgradePrompt.jsx`
- Create: `src/styles/upgrade-prompt.css`

- [ ] **Step 1: Create `src/styles/upgrade-prompt.css`**

```css
.up-overlay {
  position: fixed; inset: 0; z-index: 1200;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 0 0 32px;
  animation: up-fade-in 0.2s ease;
}
@keyframes up-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.up-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px 20px 20px;
  max-width: 380px; width: calc(100% - 32px);
  text-align: center;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
  animation: up-slide-up 0.25s ease;
}
@keyframes up-slide-up {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
.up-icon { font-size: 22px; color: #a78bfa; margin-bottom: 10px; }
.up-title { font-size: 16px; font-weight: 700; margin: 0 0 8px; color: var(--text-primary); }
.up-message {
  font-size: 13px; color: var(--text-muted);
  line-height: 1.65; margin: 0 0 20px;
}
.up-actions { display: flex; flex-direction: column; gap: 8px; }
.up-cta {
  background: #7c3aed; color: #fff; border: none;
  padding: 11px 20px; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.up-cta:hover { background: #6d28d9; }
.up-dismiss {
  background: none; border: none;
  color: var(--text-muted); font-size: 13px;
  cursor: pointer; padding: 6px;
  transition: color 0.15s;
}
.up-dismiss:hover { color: var(--text-primary); }
```

- [ ] **Step 2: Create `src/components/UpgradePrompt.jsx`**

```jsx
import { createPortal } from "react-dom";
import "../styles/upgrade-prompt.css";

const DISMISS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isDismissed(triggerKey) {
  const val = localStorage.getItem(`nwt-prompt-dismissed-${triggerKey}`);
  if (!val) return false;
  return Date.now() - parseInt(val, 10) < DISMISS_MS;
}

export function dismissPrompt(triggerKey) {
  localStorage.setItem(`nwt-prompt-dismissed-${triggerKey}`, String(Date.now()));
}

export default function UpgradePrompt({ icon = "✦", title, message, ctaLabel, onCta, onDismiss }) {
  return createPortal(
    <div className="up-overlay" onClick={onDismiss}>
      <div className="up-card" onClick={e => e.stopPropagation()}>
        <div className="up-icon">{icon}</div>
        <h3 className="up-title">{title}</h3>
        <p className="up-message">{message}</p>
        <div className="up-actions">
          <button className="up-cta" onClick={onCta}>{ctaLabel}</button>
          <button className="up-dismiss" onClick={onDismiss}>Not now</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 3: Verify**

Run `npm run dev`. Open the app. Temporarily render `<UpgradePrompt icon="✦" title="Test" message="Test message" ctaLabel="Go" onCta={() => {}} onDismiss={() => {}} />` in `HomePage.jsx`. Confirm the bottom-sheet appears over content with backdrop blur, CTA button is purple, "Not now" is muted. Remove the temporary render.

- [ ] **Step 4: Commit**

```bash
git add src/components/UpgradePrompt.jsx src/styles/upgrade-prompt.css
git commit -m "feat: add reusable UpgradePrompt component with 7-day dismiss persistence"
```

---

## Task 2: Contextual Feature-Gate Prompts (AuthedApp)

Replace the generic `openUpgrade()` call when a free user hits a premium-gated route with a feature-specific UpgradePrompt.

**Files:**
- Modify: `src/AuthedApp.jsx`

- [ ] **Step 1: Add state and the FEATURE_PROMPTS map**

At the top of the `AuthedApp` function body (after existing state declarations), add:

```jsx
import UpgradePrompt, { isDismissed, dismissPrompt } from "./components/UpgradePrompt";

// inside AuthedApp, after existing useState declarations:
const [gatedFeature, setGatedFeature] = useState(null);

const FEATURE_PROMPTS = {
  studyNotes: {
    icon: "📝",
    title: "Study Notes",
    message: "Write rich-text notes for any chapter, organise by folder, and export as Markdown or PDF.",
    ctaLabel: "Unlock Premium — $3/mo",
  },
  readingPlans: {
    icon: "📅",
    title: "Reading Plans",
    message: "Follow structured plans like NWT in 1 Year with daily assignments and progress tracking.",
    ctaLabel: "Unlock Premium — $3/mo",
  },
  aiTools: {
    icon: "✨",
    title: "AI Study Assistant",
    message: "Ask anything about any verse and get grounded, passage-linked answers from Scripture.",
    ctaLabel: "Unlock Premium — $3/mo",
  },
  messages: {
    icon: "💬",
    title: "Direct Messages",
    message: "Private conversations with other publishers in the community.",
    ctaLabel: "Unlock Premium — $3/mo",
  },
  groups: {
    icon: "👥",
    title: "Study Groups",
    message: "Group chat, shared progress tracking, and weekly leaderboards with your study group.",
    ctaLabel: "Unlock Premium — $3/mo",
  },
};
```

- [ ] **Step 2: Replace the generic gate redirect**

Find this block (around line 258):

```jsx
else if (!isPremium && ["messages", "groups", "groupDetail", "readingPlans", "studyNotes", "aiTools"].includes(nav.page)) {
  if (!profileLoading) { navigate("home"); openUpgrade(); }
}
```

Replace with:

```jsx
else if (!isPremium && ["messages", "groups", "groupDetail", "readingPlans", "studyNotes", "aiTools"].includes(nav.page)) {
  if (!profileLoading) {
    const feature = nav.page === "groupDetail" ? "groups" : nav.page;
    navigate("home");
    if (!isDismissed(`gate-${feature}`)) setGatedFeature(feature);
    else openUpgrade();
  }
}
```

- [ ] **Step 3: Render UpgradePrompt for gated feature**

In the return statement, just before the closing `</>`, add:

```jsx
{gatedFeature && FEATURE_PROMPTS[gatedFeature] && (
  <UpgradePrompt
    icon={FEATURE_PROMPTS[gatedFeature].icon}
    title={FEATURE_PROMPTS[gatedFeature].title}
    message={FEATURE_PROMPTS[gatedFeature].message}
    ctaLabel={FEATURE_PROMPTS[gatedFeature].ctaLabel}
    onCta={() => {
      dismissPrompt(`gate-${gatedFeature}`);
      setGatedFeature(null);
      openUpgrade();
    }}
    onDismiss={() => {
      dismissPrompt(`gate-${gatedFeature}`);
      setGatedFeature(null);
    }}
  />
)}
```

- [ ] **Step 4: Verify**

Log in as a free user. Click on Study Notes in the nav. Confirm: page navigates to Home AND a bottom-sheet appears with "📝 Study Notes" title and the reading plans message. Tap "Not now" — sheet closes. Navigate to Study Notes again within 7 days — this time it falls through to `openUpgrade()` (the existing upgrade modal) since the prompt was already dismissed.

- [ ] **Step 5: Commit**

```bash
git add src/AuthedApp.jsx
git commit -m "feat: show contextual feature-specific upgrade prompt on premium gate"
```

---

## Task 3: Book Completion Trigger

Show an UpgradePrompt after a user completes a book (for free users only).

**Files:**
- Modify: `src/views/ChecklistPage.jsx`

- [ ] **Step 1: Add imports and state**

At the top of `ChecklistPage.jsx`, add to the existing imports:

```jsx
import UpgradePrompt, { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
```

Inside the `ChecklistPage` function body, after existing state declarations, add:

```jsx
const [showBookPrompt, setShowBookPrompt] = useState(false);
```

- [ ] **Step 2: Update the BookCelebration onClose**

Find this block:

```jsx
{celebrateBook && (
  <BookCelebration
    bookName={celebrateBook.name}
    bookIcon={celebrateBook.icon}
    chaptersCount={celebrateBook.chapters}
    onClose={() => setCelebrateBook(null)}
  />
)}
```

Replace with:

```jsx
{celebrateBook && (
  <BookCelebration
    bookName={celebrateBook.name}
    bookIcon={celebrateBook.icon}
    chaptersCount={celebrateBook.chapters}
    onClose={() => {
      setCelebrateBook(null);
      if (!isPremium && !isDismissed("book-complete")) setShowBookPrompt(true);
    }}
  />
)}
{showBookPrompt && (
  <UpgradePrompt
    icon="📅"
    title="Keep the momentum going"
    message="Join a reading plan to work through the whole NWT with a daily schedule and streak tracking."
    ctaLabel="View Reading Plans"
    onCta={() => {
      dismissPrompt("book-complete");
      setShowBookPrompt(false);
      navigate("readingPlans");
    }}
    onDismiss={() => {
      dismissPrompt("book-complete");
      setShowBookPrompt(false);
    }}
  />
)}
```

- [ ] **Step 3: Verify**

As a free user, mark all chapters in a short book (e.g., Obadiah — 1 chapter). Confirm: `BookCelebration` fires → after closing it, the UpgradePrompt appears with "Keep the momentum going" and "View Reading Plans" CTA. Tap CTA — navigates to reading plans (which will gate again since free, showing feature prompt). Close and reopen the app; completing another book within 7 days should NOT show the prompt again.

- [ ] **Step 4: Commit**

```bash
git add src/views/ChecklistPage.jsx
git commit -m "feat: show reading plans upgrade prompt after completing a Bible book"
```

---

## Task 4: Streak Milestone Trigger

Show an UpgradePrompt when the user hits a streak milestone (7, 14, 30, 60, ...).

**Files:**
- Modify: `src/views/HomePage.jsx`

- [ ] **Step 1: Add imports and state**

Add to existing imports in `HomePage.jsx`:

```jsx
import UpgradePrompt, { isDismissed, dismissPrompt } from "../components/UpgradePrompt";
```

Add state after the existing `useState` declarations:

```jsx
const [showStreakPrompt, setShowStreakPrompt] = useState(false);
```

- [ ] **Step 2: Add streak milestone useEffect**

After the existing hooks in `HomePage`, add:

```jsx
const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

useEffect(() => {
  if (isPremium || streakLoading) return;
  const n = streak.current_streak;
  if (!STREAK_MILESTONES.includes(n)) return;
  const key = `streak-milestone-${n}`;
  if (!isDismissed(key)) setShowStreakPrompt(true);
}, [streak.current_streak, isPremium, streakLoading]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Render the streak prompt**

Before the closing `</div>` of the home component's return (just before `{showNotifBanner && ...}` block), add:

```jsx
{showStreakPrompt && (
  <UpgradePrompt
    icon="🔥"
    title={`${streak.current_streak}-day streak!`}
    message="Keep it structured — reading plans give you a daily assignment so you always know exactly what to read next."
    ctaLabel="View Reading Plans"
    onCta={() => {
      dismissPrompt(`streak-milestone-${streak.current_streak}`);
      setShowStreakPrompt(false);
      navigate("readingPlans");
    }}
    onDismiss={() => {
      dismissPrompt(`streak-milestone-${streak.current_streak}`);
      setShowStreakPrompt(false);
    }}
  />
)}
```

- [ ] **Step 4: Verify**

Temporarily override the streak value in the useEffect condition to `n === 1` to test without needing a real streak. Confirm the prompt fires on home load with a streak of 1. Restore the condition. Remove the temp override.

- [ ] **Step 5: Commit**

```bash
git add src/views/HomePage.jsx
git commit -m "feat: show reading plans upgrade prompt at streak milestones (7/14/30d)"
```

---

## Task 5: Quiz Badge Trigger

Show an UpgradePrompt when the user earns their 3rd quiz badge.

**Files:**
- Modify: `src/views/quiz/QuizPage.jsx`

- [ ] **Step 1: Add imports and state**

Add to imports in `QuizPage.jsx`:

```jsx
import UpgradePrompt, { isDismissed, dismissPrompt } from "../../components/UpgradePrompt";
```

Inside `QuizPage` (the default export component, not `QuizLevel`), add state after existing hooks:

```jsx
const [showQuizPrompt, setShowQuizPrompt] = useState(false);
const { isPremium } = useSubscription(user.id);
```

Note: `useSubscription` is already imported in the file (used in `QuizLevel`). If the import isn't at the top level yet, verify it is — it already is on line ~7.

- [ ] **Step 2: Add badge count useEffect**

After the `useQuizProgress` hook in `QuizPage`:

```jsx
const badgeCount = progress.filter(p => p.badge_earned).length;

useEffect(() => {
  if (isPremium || isLoading) return;
  if (badgeCount !== 3) return;
  if (!isDismissed("quiz-3-badges")) setShowQuizPrompt(true);
}, [badgeCount, isPremium, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Render the quiz prompt**

At the bottom of `QuizPage`'s return, just before the final closing tag, add:

```jsx
{showQuizPrompt && (
  <UpgradePrompt
    icon="🧠"
    title="Go deeper with AI"
    message="Ask the AI study assistant anything about the verses you just answered. Understand the context, not just the answer."
    ctaLabel="Try AI Study Tools"
    onCta={() => {
      dismissPrompt("quiz-3-badges");
      setShowQuizPrompt(false);
      navigate("aiTools");
    }}
    onDismiss={() => {
      dismissPrompt("quiz-3-badges");
      setShowQuizPrompt(false);
    }}
  />
)}
```

- [ ] **Step 4: Verify**

As a free user with exactly 3 badges earned, navigate to the Quiz page. Confirm the prompt appears. Tap "Not now". Navigate away and back — prompt does not reappear within 7 days.

- [ ] **Step 5: Commit**

```bash
git add src/views/quiz/QuizPage.jsx
git commit -m "feat: show AI tools upgrade prompt after earning 3rd quiz badge"
```

---

## Task 6: Rotating Home Sidebar Banner

Replace the static premium banner copy with a weekly-rotating message.

**Files:**
- Modify: `src/views/HomePage.jsx`

- [ ] **Step 1: Add BANNER_ROTATIONS constant**

Near the top of `HomePage.jsx` (outside the component, after imports), add:

```jsx
const BANNER_ROTATIONS = [
  {
    icon: "📅",
    title: "Reading Plans",
    sub: "Daily assignments. Streaks. Finish the Bible in 1 year.",
    cta: "Explore Plans →",
  },
  {
    icon: "📝",
    title: "Study Notes",
    sub: "Rich-text notes for any chapter. Export to Markdown or PDF.",
    cta: "Try Notes →",
  },
  {
    icon: "✨",
    title: "AI Study Assistant",
    sub: "Ask anything about any verse. Grounded in Scripture.",
    cta: "Try AI Tools →",
  },
  {
    icon: "📋",
    title: "Meeting Prep",
    sub: "CLAM + Watchtower checklists. Never miss an assignment.",
    cta: "Open Meeting Prep →",
  },
];
```

- [ ] **Step 2: Compute the active rotation**

Inside `HomePage`, before the return statement:

```jsx
const bannerRotation = BANNER_ROTATIONS[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % BANNER_ROTATIONS.length];
```

- [ ] **Step 3: Update the premium banner JSX**

Find the existing premium upsell banner:

```jsx
{!isPremium && (
  <section className="home-section home-section--slim">
    <button className="home-premium-banner" onClick={onUpgrade}>
      <span className="home-premium-banner-icon" aria-hidden="true">...</span>
      <div className="home-premium-banner-text">
        <strong>{t("upm.bannerTitle")}</strong>
        <span>{t("upm.bannerSub")}</span>
      </div>
      <span className="home-premium-banner-cta">{t("upm.bannerCta")}</span>
    </button>
  </section>
)}
```

Replace with:

```jsx
{!isPremium && (
  <section className="home-section home-section--slim">
    <button className="home-premium-banner" onClick={onUpgrade}>
      <span className="home-premium-banner-icon" aria-hidden="true">{bannerRotation.icon}</span>
      <div className="home-premium-banner-text">
        <strong>{bannerRotation.title}</strong>
        <span>{bannerRotation.sub}</span>
      </div>
      <span className="home-premium-banner-cta">{bannerRotation.cta}</span>
    </button>
  </section>
)}
```

- [ ] **Step 4: Verify**

As a free user, load the home page. Banner now shows one of the 4 rotating messages. Change the divisor temporarily to a small number (e.g., `1000`) to cycle through all 4 messages and confirm they all render correctly. Restore the divisor.

- [ ] **Step 5: Commit**

```bash
git add src/views/HomePage.jsx
git commit -m "feat: rotate home premium banner weekly across 4 feature value props"
```

---

## Task 7: TodaysFocusCard Component

**Files:**
- Create: `src/components/home/TodaysFocusCard.jsx`
- Create: `src/styles/todays-focus.css`

- [ ] **Step 1: Create `src/styles/todays-focus.css`**

```css
/* ── Today's Focus card ───────────────────────────────────────────────────── */

.tf-card {
  background: linear-gradient(135deg, rgba(109, 40, 217, 0.18), rgba(91, 33, 182, 0.1));
  border: 1px solid rgba(124, 58, 237, 0.3);
  border-radius: 14px;
  padding: 18px;
  cursor: default;
}

.tf-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.tf-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.tf-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.tf-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.tf-streak {
  text-align: right;
  flex-shrink: 0;
}

.tf-streak-label {
  font-size: 9px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tf-streak-value {
  font-size: 20px;
  font-weight: 700;
  color: #fb923c;
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-end;
}

.tf-progress {
  margin-bottom: 14px;
}

.tf-progress-bar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  height: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.tf-progress-bar-fill {
  background: #7c3aed;
  height: 4px;
  border-radius: 4px;
  transition: width 0.4s ease;
}

.tf-progress-meta {
  font-size: 11px;
  color: var(--text-muted);
}

.tf-actions {
  display: flex;
  gap: 8px;
}

.tf-mark-done {
  flex: 1;
  background: #7c3aed;
  color: #fff;
  border: none;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tf-mark-done:hover { background: #6d28d9; }
.tf-mark-done:active { transform: scale(0.98); }

.tf-mark-done--done {
  background: rgba(52, 211, 153, 0.2);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
  cursor: default;
}

.tf-mark-done--done:hover { background: rgba(52, 211, 153, 0.2); }

.tf-wol-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.tf-wol-btn:hover { background: rgba(255, 255, 255, 0.1); }

/* ── No-plan CTA ─────────────────────────────────────────────────────────── */

.tf-no-plan {
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.2);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.tf-no-plan-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.tf-no-plan-text { flex: 1; }
.tf-no-plan-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
.tf-no-plan-sub { font-size: 12px; color: var(--text-muted); }

.tf-no-plan-cta {
  background: #7c3aed; color: #fff; border: none;
  padding: 8px 14px; border-radius: 7px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.tf-no-plan-cta:hover { background: #6d28d9; }

/* ── Continue Reading row ────────────────────────────────────────────────── */

.tf-continue {
  margin-top: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
  text-align: left;
}

.tf-continue:hover { background: rgba(255, 255, 255, 0.06); }

.tf-continue-icon {
  background: rgba(124, 58, 237, 0.15);
  border-radius: 7px;
  padding: 7px;
  display: flex;
  flex-shrink: 0;
}

.tf-continue-body { flex: 1; min-width: 0; }

.tf-continue-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tf-continue-sub {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
}

.tf-continue-arrow { color: var(--text-muted); font-size: 16px; flex-shrink: 0; }
```

- [ ] **Step 2: Create `src/components/home/TodaysFocusCard.jsx`**

```jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useMyPlans,
  usePlanCompletions,
  useMarkDay,
  useUnmarkDay,
} from "../../hooks/useReadingPlans";
import { useReadingStreak } from "../../hooks/useProgress";
import { useChapterTimestamps } from "../../hooks/useProgress";
import { getTemplateOrCustom, generateSchedule } from "../../data/readingPlanTemplates";
import { wolChapterUrl } from "../../utils/wol";
import { BOOKS } from "../../data/books";
import { formatDate } from "../../utils/formatters";
import "../../styles/todays-focus.css";

function effectiveDay(plan) {
  const start = new Date(plan.start_date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const raw = Math.floor((now - start) / 86400000) + 1;
  let pausedDays = plan.paused_days ?? 0;
  if (plan.is_paused && plan.paused_at) {
    const pausedDate = new Date(plan.paused_at);
    pausedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pausedDays += Math.max(0, Math.floor((today - pausedDate) / 86400000));
  }
  return Math.max(1, raw - pausedDays);
}

function useLastReadChapter(userId) {
  const { data: timestamps = {} } = useChapterTimestamps(userId);
  return useMemo(() => {
    let best = null;
    for (const [bi, chapters] of Object.entries(timestamps)) {
      for (const [ch, ts] of Object.entries(chapters)) {
        if (!best || ts > best.ts) {
          best = { bookIndex: parseInt(bi, 10), chapter: parseInt(ch, 10), ts };
        }
      }
    }
    return best;
  }, [timestamps]);
}

function readingsLabel(readings) {
  if (!readings || readings.length === 0) return "—";
  const byBook = {};
  for (const { bookIndex, chapter } of readings) {
    if (!byBook[bookIndex]) byBook[bookIndex] = [];
    byBook[bookIndex].push(chapter);
  }
  return Object.entries(byBook)
    .map(([bi, chs]) => {
      const name = BOOKS[parseInt(bi, 10)]?.name ?? "";
      if (chs.length === 1) return `${name} ${chs[0]}`;
      return `${name} ${chs[0]}–${chs[chs.length - 1]}`;
    })
    .join(", ");
}

export default function TodaysFocusCard({ userId, navigate, isPremium, onUpgrade, lang = "en" }) {
  const { t } = useTranslation();
  const { data: plans = [] } = useMyPlans();
  const activePlan = plans.find(p => !p.is_paused && !p.completed_at) ?? null;

  const { data: completions = [] } = usePlanCompletions(activePlan?.id ?? null);
  const markDay = useMarkDay(activePlan?.id ?? null);
  const unmarkDay = useUnmarkDay(activePlan?.id ?? null);
  const { data: streak = { current_streak: 0 } } = useReadingStreak(userId);
  const lastRead = useLastReadChapter(userId);

  const { template, schedule, currentDay, doneSet, todayReadings, pct } = useMemo(() => {
    if (!activePlan) return { template: null, schedule: [], currentDay: 1, doneSet: new Set(), todayReadings: [], pct: 0 };
    const tpl = getTemplateOrCustom(activePlan);
    const sched = generateSchedule(tpl.bookIndices, tpl.totalDays);
    const day = Math.min(effectiveDay(activePlan), tpl.totalDays);
    const done = new Set(completions.map(c => c.day_number));
    const readings = sched[day - 1]?.readings ?? [];
    const percent = Math.round((done.size / tpl.totalDays) * 100);
    return { template: tpl, schedule: sched, currentDay: day, doneSet: done, todayReadings: readings, pct: percent };
  }, [activePlan, completions]);

  const todayDone = doneSet.has(currentDay);

  function handleMarkDone() {
    if (todayDone) {
      unmarkDay.mutate(currentDay);
    } else {
      markDay.mutate(currentDay);
    }
  }

  const wolUrl = todayReadings.length > 0
    ? wolChapterUrl(todayReadings[0].bookIndex, todayReadings[0].chapter, lang)
    : null;

  if (!activePlan || !template) {
    return (
      <div>
        <div className="tf-no-plan">
          <div className="tf-no-plan-icon">📅</div>
          <div className="tf-no-plan-text">
            <div className="tf-no-plan-title">Start a reading plan</div>
            <div className="tf-no-plan-sub">Daily assignments, streak tracking, finish the NWT in 1 year.</div>
          </div>
          <button
            className="tf-no-plan-cta"
            onClick={() => isPremium ? navigate("readingPlans") : onUpgrade?.()}
          >
            {isPremium ? "Browse Plans" : "Unlock Plans"}
          </button>
        </div>
        {lastRead && (
          <button className="tf-continue" onClick={() => navigate("main")}>
            <span className="tf-continue-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </span>
            <div className="tf-continue-body">
              <div className="tf-continue-title">Continue — {BOOKS[lastRead.bookIndex]?.name} {lastRead.chapter}</div>
              <div className="tf-continue-sub">Last read {formatDate(lastRead.ts)}</div>
            </div>
            <span className="tf-continue-arrow">›</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="tf-card">
        <div className="tf-header">
          <div>
            <div className="tf-label">Today's Reading</div>
            <h3 className="tf-title">{readingsLabel(todayReadings)}</h3>
            <div className="tf-subtitle">{template.name} · Day {currentDay} of {template.totalDays}</div>
          </div>
          {streak.current_streak > 0 && (
            <div className="tf-streak">
              <div className="tf-streak-label">Streak</div>
              <div className="tf-streak-value">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fb923c" aria-hidden="true"><path d="M12 23c-4.97 0-8-3.03-8-7 0-2.44 1.34-4.81 2.5-6.35A1 1 0 0 1 8.18 10c.34 1.14 1.1 2.13 2.05 2.75C10.31 10 12 6 12 2a1 1 0 0 1 1.66-.75c2.24 1.92 5.84 5.63 5.84 10.75 0 5.68-3.55 11-7.5 11z"/></svg>
                {streak.current_streak}
              </div>
            </div>
          )}
        </div>

        <div className="tf-progress">
          <div className="tf-progress-bar-track">
            <div className="tf-progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="tf-progress-meta">{pct}% complete · {template.totalDays - doneSet.size} days remaining</div>
        </div>

        <div className="tf-actions">
          <button
            className={`tf-mark-done${todayDone ? " tf-mark-done--done" : ""}`}
            onClick={handleMarkDone}
            disabled={markDay.isPending || unmarkDay.isPending}
          >
            {todayDone
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Done for today</>
              : "✓ Mark Done"
            }
          </button>
          {wolUrl && (
            <a
              href={wolUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tf-wol-btn"
            >
              Open in WOL →
            </a>
          )}
        </div>
      </div>

      {lastRead && (
        <button className="tf-continue" onClick={() => navigate("main")}>
          <span className="tf-continue-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </span>
          <div className="tf-continue-body">
            <div className="tf-continue-title">Continue — {BOOKS[lastRead.bookIndex]?.name} {lastRead.chapter}</div>
            <div className="tf-continue-sub">Last read {formatDate(lastRead.ts)}</div>
          </div>
          <span className="tf-continue-arrow">›</span>
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify component in isolation**

Run `npm run dev`. Temporarily add `<TodaysFocusCard userId={user.id} navigate={navigate} isPremium={isPremium} onUpgrade={onUpgrade} />` in `HomePage.jsx` just inside the main content div to confirm it renders without errors. Check: active plan user sees assignment + streak + progress bar; user without a plan sees the no-plan CTA; both see the continue reading row if they have any reading history.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/TodaysFocusCard.jsx src/styles/todays-focus.css
git commit -m "feat: add TodaysFocusCard component with plan assignment, streak, and continue reading"
```

---

## Task 8: Wire TodaysFocusCard into HomePage

**Files:**
- Modify: `src/views/HomePage.jsx`

- [ ] **Step 1: Add import**

Add to existing imports in `HomePage.jsx`:

```jsx
import TodaysFocusCard from "../components/home/TodaysFocusCard";
```

- [ ] **Step 2: Add i18n language access**

The `HomePage` already receives `i18n` as a prop. Extract the current language for the WOL link:

Inside the component, after the existing hooks:

```jsx
const lang = i18n?.language?.split("-")[0] ?? "en";
```

- [ ] **Step 3: Insert TodaysFocusCard at top of main column**

In the main column (`home-col-main`), add `TodaysFocusCard` as the first section, before the existing Bible Tracker section:

```jsx
{/* ── Today's Focus ── */}
<section className="home-section">
  <TodaysFocusCard
    userId={user?.id}
    navigate={navigate}
    isPremium={isPremium}
    onUpgrade={onUpgrade}
    lang={lang}
  />
</section>

{/* ── Bible Tracker (existing) ── */}
<section className="home-section">
  ...
```

- [ ] **Step 4: Remove the separate streak banner from the side column**

The streak is now shown inside `TodaysFocusCard`, so the standalone streak banner in the side column is redundant for users with an active plan. Keep it for users without a plan (it's still useful). Make it conditional on not having an active plan.

At the streak banner section in `home-col-side`, wrap it:

```jsx
{/* Show standalone streak banner only when no active plan (plan users see streak in TodaysFocusCard) */}
{!streakLoading && streak.current_streak > 0 && (
  <section className="home-section home-section--slim">
    <button className="home-streak-banner" onClick={() => navigate("profile")}>
      ...existing content...
    </button>
  </section>
)}
```

This is already the condition that existed — no change needed here unless you want to hide it for plan users. Leave as-is for now; duplicate streak display is acceptable.

- [ ] **Step 5: Verify**

As a logged-in user with an active reading plan: home page shows the Today's Focus card at the top of the main column with today's assignment. As a user without a plan: shows the "Start a reading plan" no-plan CTA. The continue reading row appears for users who have read at least one chapter.

- [ ] **Step 6: Commit**

```bash
git add src/views/HomePage.jsx
git commit -m "feat: add Today's Focus card to home page main column"
```

---

## Task 9: Onboarding Flow Overhaul

Replace the 5-slide info onboarding with a 3-step action-first flow.

**Files:**
- Modify: `src/components/OnboardingModal.jsx`
- Modify: `src/styles/onboarding.css`
- Modify: `src/locales/en/translation.json`

- [ ] **Step 1: Add translation keys**

In `src/locales/en/translation.json`, find the `"onboarding"` object and replace its contents:

```json
"onboarding": {
  "skip": "Skip",
  "welcomeTitle": "Welcome, {{name}}!",
  "welcomeSub": "What do you want to do first?",
  "choiceNote": "You can do all of these — pick a starting point",
  "choiceTrack": "Track my reading",
  "choiceTrackSub": "Mark chapters across all 66 books",
  "choicePlan": "Start a reading plan",
  "choicePlanSub": "NWT in 1 Year, Gospels in 30 days…",
  "choiceQuiz": "Test my Bible knowledge",
  "choiceQuizSub": "Start the quiz, earn badges",
  "goalTitle": "Set your daily reading goal",
  "goalSub": "How many chapters do you want to read per day?",
  "goalSet": "Set My Goal",
  "notifTitle": "Want a daily reminder?",
  "notifSub": "We'll remind you to read at the same time each day.",
  "notifEnable": "Enable Reminders",
  "notifLater": "Maybe later",
  "getStarted": "Get Started"
}
```

Note: if any existing translation keys from the old `onboarding` object are referenced elsewhere in the app, check with `grep -r "onboarding\." src/` before removing them. The keys `skip`, `next`, `getStarted`, `seePremium`, `maybeLater` were used in the old modal — `skip`, `getStarted`, and `maybeLater`/`notifLater` are re-used above; `next`, `seePremium` can be removed since the new flow doesn't use them.

- [ ] **Step 2: Rewrite `src/components/OnboardingModal.jsx`**

```jsx
import { useState } from "react";
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
```

Note: add `import { useEffect } from "react";` — it was already imported in the original file. Ensure it remains.

- [ ] **Step 3: Update `OnboardingModal` call site in `HomePage.jsx`**

Find where `OnboardingModal` is rendered in `HomePage.jsx`:

```jsx
{showOnboarding && <OnboardingModal onClose={closeOnboarding} onUpgrade={onUpgrade} />}
```

Replace with:

```jsx
{showOnboarding && (
  <OnboardingModal
    onClose={closeOnboarding}
    onUpgrade={onUpgrade}
    navigate={navigate}
    user={user}
  />
)}
```

- [ ] **Step 4: Add CSS for new onboarding layout in `src/styles/onboarding.css`**

Add to the bottom of `src/styles/onboarding.css` (do not remove existing rules — they apply to `.onboard-modal`, `.onboard-overlay`, etc. that are still used):

```css
/* ── v2 intent-picker layout ─────────────────────────────────────────────── */

.onboard-modal--v2 {
  padding: 28px 24px 20px;
  max-width: 340px;
}

.onboard-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0 12px;
}

.onboard-choice {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: border-color 0.15s, background 0.15s;
  color: var(--text-primary);
}

.onboard-choice:hover {
  border-color: rgba(124, 58, 237, 0.5);
  background: rgba(124, 58, 237, 0.06);
}

.onboard-choice-icon {
  color: #a78bfa;
  flex-shrink: 0;
  display: flex;
}

.onboard-choice-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.onboard-choice-text strong { font-size: 13px; font-weight: 600; }
.onboard-choice-text span  { font-size: 11px; color: var(--text-muted); }

.onboard-choice-arrow { color: var(--text-muted); font-size: 16px; }

.onboard-choice-note {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 16px;
}

.onboard-goal-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 20px 0;
}

.onboard-goal-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  width: 36px; height: 36px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s;
  display: flex; align-items: center; justify-content: center;
}

.onboard-goal-btn:hover { background: rgba(255, 255, 255, 0.14); }

.onboard-goal-value {
  font-size: 32px;
  font-weight: 700;
  color: #a78bfa;
  min-width: 48px;
  text-align: center;
}
```

- [ ] **Step 5: Verify**

Clear `nwt-onboarded` from localStorage (`localStorage.removeItem("nwt-onboarded")`). Refresh the app as a new (< 2 day old) user. Confirm:
- Step 0: Three choice buttons appear. Clicking "Track my reading" moves to step 1.
- Step 1: Goal picker with `−` / `+` buttons. Tapping "Set My Goal" saves and moves to step 2.
- Step 2: Notification prompt. "Maybe later" closes the modal and navigates to the selected page.
- Dot progress indicators update through all 3 steps.

- [ ] **Step 6: Commit**

```bash
git add src/components/OnboardingModal.jsx src/styles/onboarding.css src/locales/en/translation.json
git commit -m "feat: replace 5-slide onboarding with 3-step action-first intent picker flow"
```

---

## Task 10: Landing Page Updates

**Files:**
- Modify: `src/views/LandingPage.jsx`
- Modify: `src/styles/landing.css`

- [ ] **Step 1: Update the hero headline and subtitle**

In `LandingPage.jsx`, find the `<h1>` and the subtitle `<p>`. The content comes from `t("landing.titleLine1")`, `t("landing.titleAccent")`, `t("landing.subtitle")`.

Update `src/locales/en/translation.json` — find the `"landing"` section and update these keys:

```json
"titleLine1": "Grow Closer to Jehovah",
"titleAccent": "One Chapter at a Time",
"subtitle": "Bible reading tracker, study notes, meeting prep, and AI study tools — built for Jehovah's Witnesses."
```

- [ ] **Step 2: Update feature pills**

In `LandingPage.jsx`, find the `FEATURES` array and replace it:

```jsx
const FEATURES = [
  { icon: FEATURE_ICONS.book,  label: t("landing.feature66Books") },
  { icon: FEATURE_ICONS.check, label: t("landing.featureChapters") },
  { icon: FEATURE_ICONS.notes, label: t("landing.featureNotes") },
  { icon: FEATURE_ICONS.forum, label: t("landing.featureForum") },
  { icon: FEATURE_ICONS.blog,  label: t("landing.featureBlog") },
];
```

Replace with:

```jsx
const FEATURE_ICONS_V2 = {
  calendar: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ai: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/>
    </svg>
  ),
  clipboard: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
};

const FEATURES = [
  { icon: FEATURE_ICONS.book,    label: t("landing.feature66Books") },
  { icon: FEATURE_ICONS.check,   label: t("landing.featureChapters") },
  { icon: FEATURE_ICONS_V2.calendar, label: "Reading Plans" },
  { icon: FEATURE_ICONS_V2.ai,       label: "AI Study Tools" },
  { icon: FEATURE_ICONS_V2.clipboard, label: "Meeting Prep" },
];
```

- [ ] **Step 3: Update social proof line**

Find the social proof paragraph:

```jsx
<p className="landing-social-proof" aria-label="Community size">
  ...Join {communityStats.users.toLocaleString()}+ readers...
</p>
```

Replace the text content with:

```jsx
Join {communityStats.users.toLocaleString()}+ publishers worldwide
{communityStats.chaptersRead > 0 && ` · ${communityStats.chaptersRead.toLocaleString()} chapters read`}
```

- [ ] **Step 4: Add "How it works" strip**

After the social proof paragraph and before the `</div>` that closes `landing-hero`, add:

```jsx
<div className="landing-how">
  <p className="landing-how-label">How it works</p>
  <div className="landing-how-steps">
    <div className="landing-how-step">
      <span className="landing-how-num">1</span>
      <strong>Sign up free</strong>
      <span>Email or Google</span>
    </div>
    <div className="landing-how-divider" aria-hidden="true">→</div>
    <div className="landing-how-step">
      <span className="landing-how-num">2</span>
      <strong>Track chapters</strong>
      <span>All 66 books</span>
    </div>
    <div className="landing-how-divider" aria-hidden="true">→</div>
    <div className="landing-how-step">
      <span className="landing-how-num">3</span>
      <strong>Grow daily</strong>
      <span>Streaks, plans, AI</span>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Add testimonial block**

After the "How it works" strip, add:

```jsx
<div className="landing-testimonials">
  <blockquote className="landing-testimonial">
    <p>"Finally a tool that keeps me consistent with my Bible reading."</p>
    <cite>— Publisher from the community</cite>
  </blockquote>
</div>
```

Note: replace the placeholder cite with a real quote from your community when you have one. Solicit via the forum or DM a few active users.

- [ ] **Step 6: Update the premium feature list in PREMIUM_FEATURES**

In `LandingPage.jsx`, find `PREMIUM_FEATURES` and replace:

```jsx
const PREMIUM_FEATURES = [
  { icon: "📅", label: "Reading Plans",       desc: "Structured multi-week study plans" },
  { icon: "📝", label: "Study Notes",         desc: "Rich-text notes tied to passages" },
  { icon: "📋", label: "Meeting Prep",        desc: "CLAM + Watchtower study checklists" },
  { icon: "✨", label: "AI Study Assistant",  desc: "Ask anything about any verse" },
  { icon: "💬", label: "Direct Messages",     desc: "Private conversations with members" },
  { icon: "👥", label: "Study Groups",        desc: "Group chat and progress tracking" },
];
```

- [ ] **Step 7: Add CSS for new landing sections**

Append to `src/styles/landing.css`:

```css
/* ── How it works ─────────────────────────────────────────────────────────── */

.landing-how {
  margin: 28px auto 0;
  max-width: 400px;
  text-align: center;
}

.landing-how-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: rgba(255, 255, 255, 0.35);
  margin: 0 0 14px;
}

.landing-how-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.landing-how-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.landing-how-num {
  width: 28px; height: 28px;
  background: rgba(124, 58, 237, 0.25);
  border: 1px solid rgba(124, 58, 237, 0.4);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #a78bfa;
}

.landing-how-step strong { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.9); }
.landing-how-step span   { font-size: 10px; color: rgba(255, 255, 255, 0.4); }

.landing-how-divider {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.2);
  padding-bottom: 18px;
}

/* ── Testimonials ──────────────────────────────────────────────────────────── */

.landing-testimonials {
  margin: 24px auto 0;
  max-width: 360px;
}

.landing-testimonial {
  background: rgba(255, 255, 255, 0.04);
  border-left: 2px solid rgba(124, 58, 237, 0.5);
  border-radius: 0 8px 8px 0;
  margin: 0;
  padding: 12px 14px;
  text-align: left;
}

.landing-testimonial p {
  font-size: 13px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 6px;
  line-height: 1.55;
}

.landing-testimonial cite {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  font-style: normal;
}
```

- [ ] **Step 8: Verify**

Open the landing page (log out to see it). Confirm: new headline, feature pills include AI + Meeting Prep, "How it works" 3-step strip appears, testimonial block renders, premium feature list includes meeting prep. Check mobile view — steps should wrap cleanly.

- [ ] **Step 9: Commit**

```bash
git add src/views/LandingPage.jsx src/styles/landing.css src/locales/en/translation.json
git commit -m "feat: update landing page hero, feature pills, how-it-works, testimonials"
```

---

## Self-Review Notes

- `useUnmarkDay` is used in Task 7 — verify it's exported from `../../hooks/useReadingPlans`. If not, mark-done button should only toggle once (remove unmark logic from `handleMarkDone`).
- `usePushNotifications` is used in Task 9 — it's imported in `MessagesPage` so it exists. Verify the export in `src/hooks/usePushNotifications.js` before Task 9.
- The `useEffect` import in `OnboardingModal.jsx` (Task 9) — the original file didn't import `useEffect` at the top since `useOnboarding` was a separate export. Ensure `useEffect` is in the import line: `import { useState, useEffect } from "react";`
- Translation keys in Task 9: run `grep -r "onboarding\." src/ --include="*.jsx" --include="*.js"` before removing old keys to avoid broken UI in other languages. The 5 other language JSON files will fall back to English for new keys automatically via i18next fallback.
