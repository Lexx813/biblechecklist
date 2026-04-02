# Site Polish Sprint 1 — Global CSS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply three global polish improvements — page transitions, card depth, and typography rhythm — across the entire app via CSS and a single JSX change.

**Architecture:** All three areas are global. Page transition is a CSS animation triggered by a React `key` prop on the page wrapper in `AuthedApp.jsx`. Card depth is a shared CSS class `card-hover` in `app.css` added to existing card selectors. Typography rhythm is per-selector CSS updates across 10 CSS files.

**Tech Stack:** React 19, vanilla CSS custom properties, `@keyframes` animations, `prefers-reduced-motion` media query.

---

### Task 1: Page transition animation

**Files:**
- Modify: `src/styles/app.css` (add keyframe + animation class)
- Modify: `src/AuthedApp.jsx` (add `key` to page wrapper)

- [ ] **Step 1: Add keyframe and animation class to app.css**

  In `src/styles/app.css`, after the z-index scale block (after `--z-toast: 1000;`), add:

  ```css
  /* ── Page transition ── */
  @keyframes page-enter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-transition {
    animation: page-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  @media (prefers-reduced-motion: reduce) {
    .page-transition {
      animation: page-enter-reduced 150ms ease both;
    }
    @keyframes page-enter-reduced {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  }
  ```

- [ ] **Step 2: Apply the class in AuthedApp.jsx**

  In `src/AuthedApp.jsx`, find the `<Page>` component definition (around line 61):

  ```jsx
  function Page({ children, noFooter = false }) {
    return (
      <ErrorBoundary>
        <Suspense fallback={pageFallback}>
          <main id="main-content">
            {children}
          </main>
  ```

  Change `<main id="main-content">` to `<main id="main-content" className="page-transition">`:

  ```jsx
  function Page({ children, noFooter = false }) {
    return (
      <ErrorBoundary>
        <Suspense fallback={pageFallback}>
          <main id="main-content" className="page-transition">
            {children}
          </main>
  ```

  React remounts `Page` on every navigation because each page renders a fresh `<Page>` instance (the `if/else if` chain in `BibleApp` returns a new element tree). The animation fires automatically on each mount — no `key` prop needed.

- [ ] **Step 3: Verify visually in dev**

  Run: `npm run dev` (or `pnpm dev`)

  Navigate between Home → Quiz → Forum → Profile. Each page should fade in from 16px below over ~220ms. Motion should be imperceptible on fast navigations (which is correct — the animation completes before the next one starts).

  If the animation re-fires on re-renders within the same page (without navigation), that's wrong — check that `className="page-transition"` is only on `<main>` inside `Page`, not on any child elements.

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/app.css src/AuthedApp.jsx
  git commit -m "feat: fade+rise page transition on navigation (220ms)"
  ```

---

### Task 2: Global card depth — shared hover class

**Files:**
- Modify: `src/styles/app.css` (add `.card-hover` utility)
- Modify: `src/styles/quiz.css` (apply to `.quiz-level-card--unlocked`)
- Modify: `src/styles/study-notes.css` (apply to `.sn-card`)
- Modify: `src/styles/leaderboard.css` (apply to `.lb-row`)
- Modify: `src/styles/forum.css` (apply to `.forum-cat-card`)
- Modify: `src/styles/reading-plans.css` (apply to `.rp-template-card`)

- [ ] **Step 1: Add `.card-hover` to app.css**

  In `src/styles/app.css`, after the page transition block added in Task 1, add:

  ```css
  /* ── Card hover lift ── */
  .card-hover {
    transition: transform var(--dur-fast) var(--ease-spring),
                box-shadow var(--dur-base) var(--ease-out),
                border-color var(--dur-base) var(--ease-out);
  }
  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(124,58,237,0.2);
  }
  .card-hover:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow);
    transition-duration: 80ms;
  }
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

- [ ] **Step 2: Apply to quiz level cards**

  In `src/styles/quiz.css`, find `.quiz-level-card--unlocked` (around line 70). Add `card-hover` to its **existing selector** by modifying the JSX — but wait, that's a CSS modifier class. Instead, scope the `.card-hover` hover rules to not conflict with the completed gold glow.

  In quiz.css, directly on `.quiz-level-card--unlocked` add the transition and hover override inline (don't use the global `.card-hover` class since quiz cards have special completed state):

  ```css
  .quiz-level-card--unlocked {
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-spring),
                box-shadow var(--dur-base) var(--ease-out),
                border-color var(--dur-base) var(--ease-out);
  }
  .quiz-level-card--unlocked:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(124,58,237,0.2);
  }
  .quiz-level-card--unlocked:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  ```

  Leave `.quiz-level-card--completed` hover unchanged (it already has gold glow from the design consistency sprint).

- [ ] **Step 3: Apply to study notes cards**

  In `src/styles/study-notes.css`, find `.sn-card:hover` (around line 340). Update:

  ```css
  .sn-card {
    position: relative;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-spring),
                box-shadow var(--dur-base) var(--ease-out),
                border-color var(--dur-base) var(--ease-out);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sn-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(124,58,237,0.2);
  }
  .sn-card:hover::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
    pointer-events: none;
    opacity: 1;
  }
  .sn-card:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  ```

- [ ] **Step 4: Apply to leaderboard rows**

  In `src/styles/leaderboard.css`, find `.lb-row` and `.lb-row:hover` (around lines 54–61). Update:

  ```css
  .lb-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px;
    background: var(--card-bg); border: 1px solid var(--border);
    border-radius: 14px; cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-spring),
                box-shadow var(--dur-base) var(--ease-out),
                border-color var(--dur-base) var(--ease-out);
    position: relative;
  }
  .lb-row:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
    border-color: rgba(124,58,237,0.2);
  }
  .lb-row:active { transform: translateY(-1px); }
  ```

- [ ] **Step 5: Apply to forum category cards**

  In `src/styles/forum.css`, find `.forum-cat-card` and `.forum-cat-card:hover` (around line 102). Update the hover:

  ```css
  .forum-cat-card {
    /* keep all existing properties, update transition */
    transition: transform var(--dur-fast) var(--ease-spring),
                box-shadow var(--dur-base) var(--ease-out),
                border-color var(--dur-base) var(--ease-out);
    position: relative;
  }
  .forum-cat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: rgba(124,58,237,0.2);
  }
  .forum-cat-card:active { transform: translateY(-1px); }
  ```

  Read the existing `.forum-cat-card` rule first to preserve all existing properties (background, border-radius, padding, etc.) — only update `transition` and replace the `:hover` block.

- [ ] **Step 6: Apply to reading plan template cards**

  In `src/styles/reading-plans.css`, find `.rp-template-card` (search for it). Add/update transition and hover:

  ```css
  /* On the existing .rp-template-card rule, add: */
  transition: transform var(--dur-fast) var(--ease-spring),
              box-shadow var(--dur-base) var(--ease-out),
              border-color var(--dur-base) var(--ease-out);
  position: relative;

  /* On .rp-template-card:hover, update to: */
  .rp-template-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
  .rp-template-card:active { transform: translateY(-1px); }
  ```

  Preserve `.rp-template-card--premium:hover` box-shadow (the gold one restored in the previous sprint).

- [ ] **Step 7: Commit**

  ```bash
  git add src/styles/app.css src/styles/quiz.css src/styles/study-notes.css \
          src/styles/leaderboard.css src/styles/forum.css src/styles/reading-plans.css
  git commit -m "feat: upgrade card hover depth across quiz, notes, leaderboard, forum, reading plans"
  ```

---

### Task 3: Typography rhythm

**Files:**
- Modify: `src/styles/quiz.css`
- Modify: `src/styles/leaderboard.css`
- Modify: `src/styles/blog.css`
- Modify: `src/styles/auth.css`
- Modify: `src/styles/study-notes.css`
- Modify: `src/styles/upgrade-modal.css`
- Modify: `src/styles/welcome-premium.css`
- Modify: `src/styles/study-notes.css`
- Modify: `src/styles/meeting-prep.css`
- Modify: `src/styles/forum.css`

- [ ] **Step 1: Add letter-spacing to quiz titles**

  In `src/styles/quiz.css`, in `.quiz-hub-title` (around line 27), add `letter-spacing: -0.02em;`.
  In `.quiz-results-title` (around line 479), add `letter-spacing: -0.02em;`.

- [ ] **Step 2: Add letter-spacing to leaderboard title**

  In `src/styles/leaderboard.css`, in `.lb-title` (line 8), add `letter-spacing: -0.02em;`.

- [ ] **Step 3: Add letter-spacing to blog titles**

  In `src/styles/blog.css`:
  - `.blog-hero-title` (around line 92): already has `letter-spacing: -0.01em` — change to `-0.02em`.
  - `.blog-post-hero-title` (around line 301): add `letter-spacing: -0.02em;`.

- [ ] **Step 4: Add letter-spacing to auth title**

  In `src/styles/auth.css`, in `.auth-title` (around line 65), add `letter-spacing: -0.02em;`.

- [ ] **Step 5: Add letter-spacing to study notes title**

  In `src/styles/study-notes.css`, in `.sn-title` (around line 54), add `letter-spacing: -0.02em;`.

- [ ] **Step 6: Add letter-spacing to modal titles**

  In `src/styles/upgrade-modal.css`, in `.upm-title`, add `letter-spacing: -0.02em;`.
  In `src/styles/welcome-premium.css`, in `.wpm-title`, add `letter-spacing: -0.02em;`.

- [ ] **Step 7: Add breathing room to premium label pills**

  In `src/styles/study-notes.css`, in `.sn-premium-label`, add `margin-bottom: 20px;`.
  In `src/styles/meeting-prep.css`, in `.mp-premium-label`, add `margin-bottom: 20px;` and `margin-top: 6px;`.

- [ ] **Step 8: Bump body copy line-height in forum and blog**

  In `src/styles/forum.css`, find the paragraph/body text selector inside thread/post content (search for `line-height: 1.5` or `line-height: 1.6`). Bump any `1.5` body text line-heights to `1.7`.

  In `src/styles/blog.css`, find `.blog-post-para` (around line 365). Ensure `line-height: 1.75` or higher is set for editorial reading comfort.

- [ ] **Step 9: Commit**

  ```bash
  git add src/styles/quiz.css src/styles/leaderboard.css src/styles/blog.css \
          src/styles/auth.css src/styles/study-notes.css src/styles/upgrade-modal.css \
          src/styles/welcome-premium.css src/styles/meeting-prep.css src/styles/forum.css
  git commit -m "feat: typography rhythm — consistent letter-spacing and line-height across all display titles"
  ```

---

### Task 4: Final check + push

- [ ] **Step 1: Spot-check in dev**

  Run: `npm run dev`

  Navigate through: Landing → Home → Quiz → Forum → Blog (post view) → Profile → Auth page.

  Verify:
  - Page transition fires on each navigation (fade + rise)
  - Quiz cards lift cleanly on hover, gold completed cards unchanged
  - Study notes cards lift with stronger shadow
  - Leaderboard rows lift on hover
  - All Cormorant titles have tighter tracking (visually snappier)
  - Blog post body text reads comfortably (line-height)

- [ ] **Step 2: Push**

  ```bash
  git push
  ```
