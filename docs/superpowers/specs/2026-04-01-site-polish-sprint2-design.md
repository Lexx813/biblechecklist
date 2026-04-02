# Site Polish — Sprint 2 (Per-Component) Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Overview

Surgical per-component improvements across 3 areas: skeleton loading screens on 8 pages, 5 targeted micro-interactions, and mobile touch feel via pure CSS. Sprint 2 runs after Sprint 1 is shipped.

## 1. Skeleton Loading Screens

### What
Replace the generic `<LoadingSpinner />` on 8 pages with content-aware shimmer skeleton layouts that match the shape of the real content.

### Shimmer animation (shared)

Add once to `src/styles/app.css`:
```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; opacity: 0.5; }
}
```

### Pages and skeleton shapes

| Page | File | Skeleton layout |
|---|---|---|
| **Quiz** | `src/views/quiz/QuizPage.jsx` | 3×4 grid of card-shaped blocks (80px tall each), matching `.quiz-level-grid` |
| **Meeting Prep** | `src/views/meetingprep/MeetingPrepPage.jsx` | Header block + 4 section rows with 3 item lines each |
| **Reading History** | `src/views/reading/ReadingHistory.jsx` | List of 8 rows: circle + two lines (date + book name) |
| **Study Topics** | `src/views/studytopics/StudyTopicsPage.jsx` | Grid of 6 topic cards (title line + 2 body lines) |
| **Search** | `src/views/search/SearchPage.jsx` | 5 result rows: title line + subtitle line |
| **Groups** | `src/views/groups/GroupsPage.jsx` | 4 group cards: avatar circle + name + member count line |
| **Messages** | `src/views/messages/MessagesPage.jsx` | 6 message rows: avatar + name + preview line |
| **Activity Feed** | `src/views/social/ActivityFeed.jsx` | 5 activity rows: avatar + action line + timestamp |

### Implementation pattern

Each page gets a `<PageNameSkeleton />` component defined in the same file (not extracted — avoids over-abstraction for 8 one-off shapes). The skeleton replaces the `<LoadingSpinner />` in the existing `if (isLoading) return <LoadingSpinner />` guard.

Example for Quiz:
```jsx
function QuizHubSkeleton() {
  return (
    <div className="quiz-hub">
      <div className="quiz-hub-header">
        <div className="skeleton" style={{ height: 44, width: '60%', margin: '0 auto 12px' }} />
        <div className="skeleton" style={{ height: 18, width: '40%', margin: '0 auto' }} />
      </div>
      <div className="quiz-level-grid">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}
```

## 2. Micro-Interactions

### 2a. Reading chapter checkbox — scale pop

**Where:** `src/views/ChecklistPage.jsx` (or wherever chapter checkboxes render)  
**What:** When a chapter is checked, the checkbox scales up to 1.2 then back to 1 over 200ms.

Add to the relevant CSS file:
```css
.chapter-check:checked + label,
.chapter-check-label--checked {
  animation: check-pop 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes check-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### 2b. Quiz answer select — ripple

**Where:** `src/styles/quiz.css`, `.quiz-option` (answer choice buttons)  
**What:** CSS-only ripple using `::after` pseudo-element that expands from center on click.

```css
.quiz-option {
  position: relative;
  overflow: hidden;
}
.quiz-option::after {
  content: '';
  position: absolute;
  inset: 50% 50%;
  background: rgba(255,255,255,0.12);
  border-radius: 50%;
  transform: scale(0);
  opacity: 0;
  transition: none;
}
.quiz-option:active::after {
  inset: 0;
  border-radius: inherit;
  transform: scale(1);
  opacity: 1;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}
```

### 2c. Streak milestone — gold bounce

**Where:** `src/styles/home.css`, `.home-streak-text strong`  
**What:** When the streak banner first appears (on mount), the streak number does a quick scale bounce.

Add CSS class `.streak-pop` triggered via `useEffect` on `ChecklistPage`/`HomePage` when `streak.current_streak > 0`:
```css
@keyframes streak-bounce {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  70%  { transform: scale(0.92); }
  100% { transform: scale(1); }
}
.streak-pop {
  animation: streak-bounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
```
Apply the class to `.home-streak-text strong` on mount, remove after animation ends (`onAnimationEnd`).

### 2d. Primary buttons — async loading state

**Where:** `src/styles/app.css` (global), applied to any button with `data-loading="true"` or `.btn--loading`  
**What:** During async operations, the button shows a small spinner and disables interaction.

```css
.btn--loading {
  pointer-events: none;
  opacity: 0.75;
  position: relative;
}
.btn--loading::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: translateY(-50%) rotate(360deg); }
}
```

The primary submit buttons in Quiz (`src/views/quiz/QuizPage.jsx`) and Reading Plans (`src/views/readingplans/ReadingPlansPage.jsx`) add/remove the `.btn--loading` class while their async mutation is in flight.

### 2e. Reading plan completion — CSS confetti burst

**Where:** `src/styles/reading-plans.css` + completion state in `ReadingPlansPage.jsx`  
**What:** When a reading plan reaches 100%, a brief CSS confetti animation plays — 8 colored dots scatter outward from the completion badge.

```css
@keyframes confetti-scatter {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
.confetti-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: confetti-scatter 600ms ease-out both;
}
```
8 dots are rendered via JSX with inline `--tx`/`--ty` CSS vars for scatter direction and staggered `animation-delay` (0–100ms). Rendered only when `pct === 100` and cleared after 700ms via `setTimeout`.

## 3. Mobile Touch Feel

### 3a. Global `:active` scale — pure CSS

Add to `src/styles/app.css` (inside a touch device media query to avoid desktop flicker):
```css
@media (hover: none) and (pointer: coarse) {
  .quiz-level-card,
  .lb-row,
  .rp-template-card,
  .forum-thread-row,
  .sn-note-card,
  .blog-card,
  button:not(:disabled) {
    transition: transform 80ms ease-out;
  }
  .quiz-level-card:active,
  .lb-row:active,
  .rp-template-card:active,
  .forum-thread-row:active,
  .sn-note-card:active,
  .blog-card:active,
  button:not(:disabled):active {
    transform: scale(0.97);
  }
}
```

### 3b. Touch target audit

Any interactive element rendering below 44×44px gets a `min-height: 44px; min-width: 44px` rule. Targets to check:
- Nav icon buttons in `src/styles/pagenav.css`
- Forum action buttons (reply, like, share)
- Reading plan action row buttons
- Notification bell and settings gear icons

### 3c. Modal bottom-sheet on mobile

Modals (upgrade modal, welcome premium modal) on screens ≤ 480px slide up from the bottom instead of centering:

In `src/styles/upgrade-modal.css` and `src/styles/welcome-premium.css`:
```css
@media (max-width: 480px) {
  .upm-overlay,
  .wpm-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .upm-modal,
  .wpm-modal {
    border-radius: 22px 22px 0 0;
    max-width: 100%;
    animation: sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @keyframes sheet-up {
    from { transform: translateY(100%); opacity: 0.6; }
    to   { transform: translateY(0);    opacity: 1; }
  }
}
```

## Constraints

- All skeleton components defined in the same file as the page (no shared skeleton registry)
- Micro-interactions must respect `prefers-reduced-motion` — wrap keyframe animations in `@media (prefers-reduced-motion: no-preference)`
- Mobile `:active` scale uses `@media (hover: none)` to avoid affecting desktop hover states
- Confetti dots removed from DOM after animation completes (no memory leak)
- Button loading state must not cause layout shift (spinner positioned absolute, not inline)
