# Site Polish — Sprint 1 (Global) Design Spec

**Date:** 2026-04-01  
**Status:** Approved

## Overview

Global CSS-focused changes that affect every page at once. Three areas: page transitions, card depth refinement, and typography rhythm. No new dependencies. No per-page JSX changes.

## 1. Page Transitions

### What
Every page navigation triggers a fade + rise animation on the incoming page. The outgoing page fades away simultaneously.

### How
- Add `@keyframes page-enter` to `src/styles/app.css`:
  ```css
  @keyframes page-enter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  ```
- The main page content wrapper in `src/AuthedApp.jsx` receives a `key` prop tied to the current page state. React unmounts/remounts the wrapper on key change, which replays the animation automatically.
- The animation class `.page-transition` is applied to the outermost content div (below `<PageNav>`):
  ```css
  .page-transition {
    animation: page-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  ```
- `prefers-reduced-motion` fallback: fade only (no translateY), duration 150ms.

### Constraints
- Duration: 220ms — fast enough to feel instant, slow enough to register
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` — decelerate-out (content arrives quickly, settles gently)
- Rise distance: 16px — noticeable but not dramatic
- No exit animation on the old page (React unmounts it instantly; fade-out would require keeping it in the DOM which adds complexity)

## 2. Card & Surface Depth

### What
Upgrade hover states on all major card types to feel more physical and premium. Add inset glow on hover. Tighten the press/active state.

### How

**Global card hover upgrade** — in `src/styles/app.css`, add a global rule for `.card-hover`:
```css
.card-hover {
  transition: transform var(--dur-fast) var(--ease-spring),
              box-shadow var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
}
.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: rgba(124,58,237,0.25);
}
.card-hover:active {
  transform: translateY(-1px);
  box-shadow: var(--shadow);
}
```

**Per-file updates** — add `card-hover` class to existing card elements in:
- `src/styles/quiz.css` — `.quiz-level-card--unlocked` and `.quiz-level-card--completed`
- `src/styles/reading-plans.css` — `.rp-template-card`
- `src/styles/forum.css` — `.forum-thread-row` (or equivalent thread card)
- `src/styles/leaderboard.css` — `.lb-row`
- `src/styles/study-notes.css` — `.sn-note-card` (or equivalent)
- `src/styles/blog.css` — `.blog-card` (list view cards)

**Inset top-edge highlight** on hover — applied via `::before` pseudo on the card wrapper, a 1px gradient line along the top:
```css
.card-hover::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.card-hover:hover::before { opacity: 1; }
```

Affected cards must have `position: relative; overflow: hidden` — verify per file.

## 3. Typography Rhythm

### What
Consistent spacing and tracking across all Cormorant display titles and subtitle pairings. Tighten the gap between hero titles and their supporting text. Boost body copy line-height where it's at 1.5.

### How

**In `src/styles/app.css`**, add global typography rhythm utilities:
```css
/* Cormorant display titles — consistent tracking */
.display-title {
  letter-spacing: -0.02em;
  line-height: 1.08;
}

/* Subtitle below display title */
.display-title + * {
  margin-top: 10px;
}

/* Body copy rhythm */
.body-copy {
  line-height: 1.7;
}
```

**Per-page selector updates** — rather than adding utility classes to JSX, update the specific CSS selectors that control hero title spacing directly:

| Selector | File | Change |
|---|---|---|
| `.quiz-hub-title` | quiz.css | Add `letter-spacing: -0.02em` |
| `.rp-title` | reading-plans.css | Verify `letter-spacing: -0.02em`, tighten subtitle margin |
| `.lb-title` | leaderboard.css | Add `letter-spacing: -0.02em` |
| `.forum-hero-title` | forum.css | Already removed; confirm `line-height: 1.1` |
| `.blog-hero-title` | blog.css | Add `letter-spacing: -0.02em` |
| `.about-hero-title` | about.css | Confirm `line-height: 1.1` |
| `.auth-title` | auth.css | Add `letter-spacing: -0.02em` |
| `.sn-title` | study-notes.css | Add `letter-spacing: -0.02em` |
| `.upm-title` | upgrade-modal.css | Add `letter-spacing: -0.02em` |
| `.wpm-title` | welcome-premium.css | Add `letter-spacing: -0.02em` |

**Section label breathing room** — add `margin-bottom: 20px` to `.sn-premium-label` and `.mp-premium-label` where currently zero.

**Body copy audit** — find `line-height: 1.5` in `forum.css`, `blog.css`, `profile.css` and bump to `1.7` on paragraph/body selectors only (not UI labels).

## Constraints

- No new npm packages
- No JSX changes for typography (CSS selectors only)
- Page transition key must be stable across re-renders — use the current page string from state, not a timestamp
- `prefers-reduced-motion` must be respected for all animations
- Card hover changes must not break the gold `.quiz-level-card--completed` glow already in place
