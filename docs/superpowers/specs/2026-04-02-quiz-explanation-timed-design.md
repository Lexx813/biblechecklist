# Quiz Enhancements — Explanation Mode + Timed Mode

**Date:** 2026-04-02  
**Status:** Approved  
**Premium gate:** Both modes are premium-only. Free users see a locked/blurred state.

---

## Overview

Two additive quiz modes that deepen engagement. Explanation Mode turns the quiz into a learning tool by revealing why an answer is correct. Timed Mode adds competitive pressure with a score multiplier and a separate leaderboard.

Both modes layer on top of the existing 12-level quiz without changing its core flow.

---

## Feature 1: Explanation Mode

### Concept
After a quiz answer is revealed (correct or wrong), a panel slides up showing the scripture reference and a 1–2 sentence explanation of why the answer is correct. Premium users always see it. Free users see a blurred preview with an upgrade CTA.

### DB Changes

**`quiz_questions` table — add column:**
```sql
alter table quiz_questions add column explanation text;
```

**`quiz_question_translations` table — add column:**
```sql
alter table quiz_question_translations add column explanation text;
```

Explanations are authored in the admin quiz CRUD dashboard and translated per language. English is the source language; other languages get translations added over time.

**Initial seed:** Write explanations for all questions in the existing 12 levels. Approximately 120–180 questions total. This is content work, not code.

### Admin Changes
- Quiz CRUD form: add `explanation` textarea field per question
- Existing admin quiz edit route already handles question fields — add one more field

### UI

**`QuizPage.jsx` — after answer reveal:**
- Existing answer reveal: correct/incorrect indicator shown
- New: slide-up panel below the answer options (or as a bottom sheet)
- Panel content: scripture reference (e.g., "Matthew 24:14") + explanation text
- Panel is shown for 2–3 seconds then user taps "Next" as normal

**Premium gate:**
- Premium users: explanation shown clearly
- Free users: explanation text is blurred (`filter: blur(4px)`) with a "✦ Premium" lock icon overlay and "See explanations — Go Premium" CTA link
- The blurred text still takes up space (no layout shift between user types)

**i18n:** Explanation text comes from `quiz_question_translations.explanation` for the user's current language. Falls back to `quiz_questions.explanation` (English) if translation is null.

**`prefers-reduced-motion`:** Slide-up panel uses a CSS transition — already follows existing reduced-motion patterns.

---

## Feature 2: Timed Mode

### Concept
A premium-only quiz mode variant where each question has a 60-second countdown. Answering faster earns a score multiplier. Scores are tracked separately from the standard quiz and have their own leaderboard tab.

### DB Changes

**New table:**
```sql
create table quiz_timed_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  level int not null check (level between 1 and 12),
  score int not null,
  achieved_at timestamptz default now()
);
create index on quiz_timed_scores (level, score desc);
```

One row per run. Best score per level per user is derived at query time (`max(score)`). No need to store individual question timings.

**RLS:** All authenticated users can read scores (for leaderboard). Users can only insert their own.

### Score Multiplier

| Time remaining when answered | Multiplier |
|---|---|
| > 50s | 3× |
| 30–50s | 2× |
| < 30s | 1× |
| Timeout (0s) | 0 (counts as wrong) |

Base score per correct answer: 10 points. Max score per level: 10 questions × 10 pts × 3× = 300 pts.

### UI

**Quiz Hub (`QuizPage.jsx`):**
- "Timed Mode" toggle switch in the quiz hub header (next to the level grid)
- Premium badge (✦) on the toggle
- Non-premium: toggle disabled with lock icon + upgrade CTA on tap

**In-quiz with Timed Mode active:**
- Countdown ring around the timer display (60 → 0)
- Ring color shifts: green → amber (< 30s) → red (< 10s)
- Multiplier badge shown in corner: "3×", "2×", "1×" — updates as time passes
- If timer hits 0: question auto-advances as wrong answer

**After level complete:**
- Score summary shows timed score + breakdown
- "New best!" banner if this beat the previous high score

**Leaderboard page:**
- New "Timed" tab alongside existing tab
- Filter by level (dropdown)
- Shows: rank, avatar, username, best timed score, date achieved
- Uses the existing leaderboard layout and components

---

## Non-Goals
- No timed mode for the Family Quiz feature in this sprint
- No global timed challenge events (where all users compete in a window)
- Explanations are not shown during Timed Mode (would reward slow reading — counter to the mode's intent)
- No partial credit for near-misses
