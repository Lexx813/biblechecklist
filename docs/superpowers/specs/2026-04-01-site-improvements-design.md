# NWT Progress — Full-Site Improvement Sprint

**Date:** 2026-04-01  
**Status:** Approved  
**Goal:** Improve all three growth metrics simultaneously — acquisition (landing page), retention (daily habit loop), and monetization (contextual upgrade prompts).

---

## Scope

Four independent improvement areas, each targeting a different part of the funnel:

1. **Landing page** — better conversion for new visitors
2. **Onboarding flow** — faster activation for new signups
3. **"Today's Focus" home widget** — daily habit loop for retained users
4. **Contextual upgrade prompts** — smarter premium conversion

---

## 1. Landing Page

### What changes

**Hero headline** — shift from feature description to emotional outcome:
- Before: "Track Your Bible Reading / New World Translation"
- After: "Grow Closer to Jehovah / One Chapter at a Time"

**Hero subtitle** — make the full feature set visible upfront:
- Before: "Track your progress through the NWT, join a community, take quizzes."
- After: "Bible reading tracker, study notes, meeting prep, AI tools — built for Jehovah's Witnesses."

**Feature pills** — update to reflect all live features:
- Remove: generic "Notes", "Forum", "Blog"
- Add: "📅 Reading Plans", "✨ AI Study Tools", "📋 Meeting Prep"

**Social proof line** — add chapters-read count alongside user count:
- Before: "Join 500+ readers tracking their progress"
- After: "Join 500+ publishers worldwide · {chaptersRead} chapters read"

**"How it works" strip** — new 3-step section below the hero:
1. Sign up free (email or Google)
2. Track chapters (all 66 books)
3. Grow daily (streaks, plans, AI)

**Testimonial block** — 1–2 quotes from real community members. Solicit via forum/DM. Format: blockquote + name + country.

**Pricing section** — update premium feature list to include meeting prep explicitly.

### Files affected
- `src/views/LandingPage.jsx`
- `src/styles/landing.css`

---

## 2. Onboarding Flow

### What changes

Reduce from 5 info slides to 3 action-oriented steps. The core problem with the current flow: users learn about features but don't take an action in session 1. Users who take an action on day 1 retain significantly better.

**Step 1 — Intent picker** (replaces slides 1–4)
- Heading: "Welcome, [firstName]! What do you want to do first?"
- Three tappable options:
  - 📖 Track my reading — navigates to `/main`
  - 📅 Start a reading plan — navigates to `/reading-plans`
  - 🧠 Test my Bible knowledge — navigates to `/quiz`
- Subtext: "You can do all of these — pick a starting point"
- Selecting an option marks onboarding as started and navigates immediately

**Step 2 — Daily reading goal**
- Heading: "How many chapters do you want to read per day?"
- Slider: 1–5 chapters (default: 1)
- Saves to user profile (`daily_chapter_goal`)
- "Set My Goal" button advances to step 3

**Step 3 — Notifications**
- Heading: "Want a daily reminder to read?"
- One-tap "Enable Reminders" button — triggers browser push permission
- "Maybe later" link dismisses and completes onboarding
- Either action marks `nwt-onboarded` in localStorage and closes the modal

**Premium slide removed** — the current step 5 (premium pitch) is cut. Upgrade prompts convert better contextually (see Section 4) than as a cold pitch before the user has done anything.

### Files affected
- `src/components/OnboardingModal.jsx`
- `src/styles/onboarding.css`
- `src/locales/en/translation.json` (and all 5 other language files)

---

## 3. "Today's Focus" Home Widget

### What changes

A new card rendered at the top of the home page main column, above the existing Bible Tracker section. Its content depends on the user's state:

**State A — User has an active reading plan**

Card contents:
- Label: "Today's Reading" (small caps, muted)
- Title: today's assignment (e.g., "Matthew 5–6")
- Subtitle: plan name + progress (e.g., "NWT in 1 Year · Day 42 of 365")
- Progress bar: % of plan complete
- Projected finish date (shown below the bar, muted)
- Streak badge (co-located, top-right of card): 🔥 {n}
- Primary CTA: "✓ Mark Done" — calls `useMarkDay` mutation, updates streak, shows success micro-animation
- Secondary CTA: "Open in JW Library →" — deep links to `wol.jw.org` chapter URL via existing `wolChapterUrl()` util

**State B — User has no active reading plan (free or premium)**

Card contents:
- Label: "Start a Reading Plan"
- Brief value prop: "Read the NWT in 1 year with a daily schedule and streak tracking"
- CTA: "Browse Plans →" — navigates to `/reading-plans`
- For free users: CTA opens the premium paywall for plans

**"Continue Reading" row**

Below the Today's Focus card, a compact row showing the last book/chapter the user was in (from `chapterTimestamps`). Tapping navigates to the tracker with that book expanded.

- Label: "Continue — {BookName} {chapter}"
- Subtext: "Last read {relativeDate}"
- Only shown if the user has any reading history

### Data requirements

- Today's plan assignment: already computed in `ReadingPlanWidget` — extract shared logic or reuse hook
- Streak: `useReadingStreak(user.id)` — already used on home page
- Last-read chapter: derive from `chapterTimestamps` (max timestamp across all books)
- `wolChapterUrl()` utility already exists in `src/utils/wol.js`

### Files affected
- `src/views/HomePage.jsx`
- `src/styles/home.css`
- Possibly extract a `TodaysFocusCard` component to `src/components/home/TodaysFocusCard.jsx`

---

## 4. Contextual Upgrade Prompts

### What changes

Replace the permanent generic premium banner with event-driven contextual prompts. Each prompt fires once per trigger event, can be dismissed ("Not now"), and won't re-fire for 7 days after dismissal.

**Trigger 1 — Book completion**
- Fires: after `BookCelebration` modal closes (already exists)
- Message: "{BookName} complete! Keep the momentum going — join a reading plan to work through the whole NWT with a daily schedule."
- CTA: "View Plans" → navigates to reading plans
- Target: pushes reading plan adoption (premium)

**Trigger 2 — 7-day reading streak**
- Fires: when `streak.current_streak` reaches 7, 14, 30 (and multiples of 30)
- Message: "🔥 {n}-day streak! Keep it structured — reading plans give you a daily assignment so you always know exactly what to read next."
- CTA: "View Reading Plans" → navigates to reading plans
- Target: streak-motivated users are high-intent for structured plans (premium)

**Trigger 3 — 3 quiz levels cleared**
- Fires: when user completes their 3rd quiz level (tracked via badge count)
- Message: "Go deeper with AI — ask the study assistant anything about the verses you just answered."
- CTA: "Try AI Tools" → navigates to AI tools (or upgrade if free)
- Target: quiz-engaged users → cross-sell AI

**Trigger 4 — Premium feature gate hit**
- Fires: when free user lands on a paywalled feature (study notes, reading plans, AI, DMs, meeting prep)
- Message: specific to the feature they tried to access — not generic
- Each feature has its own value prop sentence
- CTA: "Unlock — $3/mo" → upgrade flow

**Home sidebar banner — rotating messages**
- The existing `home-premium-banner` rotates through 3–4 value props based on what the user hasn't tried yet (e.g., if they've never opened study notes, lead with notes; if they have, lead with AI)
- Rotation logic: check which premium features the user has engaged with, show the one they haven't

**Prompt persistence**
- Dismissal stored in localStorage: `nwt-prompt-dismissed-{triggerKey}` with timestamp
- Re-fires after 7 days if still unconverted
- Never shown to already-premium users

### Files affected
- `src/views/ChecklistPage.jsx` (book completion trigger)
- `src/views/HomePage.jsx` (streak trigger + rotating banner)
- `src/views/quiz/QuizPage.jsx` (quiz level trigger)
- `src/views/studynotes/StudyNotesPage.jsx`, `src/views/readingplans/ReadingPlansPage.jsx`, `src/views/aitools/AIToolsPage.jsx`, `src/views/messages/MessagesPage.jsx` (inline `isPremium` gates in each view)
- New shared component: `src/components/UpgradePrompt.jsx`
- `src/styles/home.css`

---

## Implementation Order

Each area is independent and can be built separately. Suggested order by impact-to-effort ratio:

1. **Contextual upgrade prompts** — highest revenue impact, mostly additive code
2. **"Today's Focus" widget** — highest retention impact, reuses existing hooks
3. **Onboarding flow** — highest activation impact, contained to one component
4. **Landing page** — acquisition impact, needs real testimonials first

---

## Out of Scope

- A/B testing infrastructure (test manually first, instrument later)
- Streak protection backend logic (the prompt can mention it as a feature even if the mechanic needs a future backend change)
- Soliciting testimonials (manual task — do this in parallel, add to landing page when quotes are in hand)
