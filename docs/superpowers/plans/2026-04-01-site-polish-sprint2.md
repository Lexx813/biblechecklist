# Site Polish Sprint 2 — Per-Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add skeleton loading screens to 8 pages, 5 targeted micro-interactions, and mobile touch polish via pure CSS — no new npm packages, no layout shifts.

**Architecture:** Shared shimmer keyframe in `app.css`. Each skeleton component lives in its own page file (no shared registry). Micro-interactions are CSS-first with minimal JSX hooks. Mobile touch uses a single media query block. All animations respect `prefers-reduced-motion`.

**Tech Stack:** React 19, vanilla CSS custom properties, `@keyframes`, `useEffect` for class-toggling, `setTimeout` for cleanup.

---

### Task 1: Shimmer animation — shared CSS foundation

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add shimmer keyframe and skeleton class to app.css**

  Open `src/styles/app.css`. After the `.card-hover` block added in Sprint 1 (or after the page-transition block if Sprint 1 hasn't landed yet), add:

  ```css
  /* ── Skeleton shimmer ── */
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

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/app.css
  git commit -m "feat: add skeleton shimmer animation to app.css"
  ```

---

### Task 2: Quiz page skeleton

**Files:**
- Modify: `src/views/quiz/QuizPage.jsx`

- [ ] **Step 1: Read the loading guard**

  Open `src/views/quiz/QuizPage.jsx`. Find the loading guard around line 140:

  ```jsx
  isLoading ? <LoadingSpinner /> : ...
  ```

- [ ] **Step 2: Add QuizHubSkeleton component and swap in loading guard**

  In `src/views/quiz/QuizPage.jsx`, add the skeleton component before the main component function (or as a local function inside — either works). Then replace `<LoadingSpinner />` in the loading guard:

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

  In the loading guard, replace:
  ```jsx
  isLoading ? <LoadingSpinner /> : ...
  ```
  with:
  ```jsx
  isLoading ? <QuizHubSkeleton /> : ...
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/quiz/QuizPage.jsx
  git commit -m "feat: quiz page skeleton screen"
  ```

---

### Task 3: Meeting Prep page skeleton

**Files:**
- Modify: `src/views/meetingprep/MeetingPrepPage.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/meetingprep/MeetingPrepPage.jsx`. Find the loading guard around line 305:

  ```jsx
  if (isLoading) return <LoadingSpinner />;
  ```

- [ ] **Step 2: Add MeetingPrepSkeleton and replace guard**

  Add the skeleton component to the file:

  ```jsx
  function MeetingPrepSkeleton() {
    return (
      <div className="mp-container">
        <div className="skeleton" style={{ height: 38, width: '55%', marginBottom: 24 }} />
        {Array.from({ length: 4 }, (_, section) => (
          <div key={section} style={{ marginBottom: 20 }}>
            <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 10 }} />
            {Array.from({ length: 3 }, (_, row) => (
              <div key={row} className="skeleton" style={{ height: 16, width: `${75 - row * 10}%`, marginBottom: 8 }} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  ```

  Replace:
  ```jsx
  if (isLoading) return <LoadingSpinner />;
  ```
  with:
  ```jsx
  if (isLoading) return <MeetingPrepSkeleton />;
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/meetingprep/MeetingPrepPage.jsx
  git commit -m "feat: meeting prep page skeleton screen"
  ```

---

### Task 4: Reading History skeleton

**Files:**
- Modify: `src/views/reading/ReadingHistory.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/reading/ReadingHistory.jsx`. Find the loading guard around line 86:

  ```jsx
  isLoading ? <LoadingSpinner /> : ...
  ```

- [ ] **Step 2: Add ReadingHistorySkeleton and replace guard**

  ```jsx
  function ReadingHistorySkeleton() {
    return (
      <div className="reading-history">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 13, width: '35%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 15, width: '60%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

  Replace `<LoadingSpinner />` in the loading guard with `<ReadingHistorySkeleton />`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/reading/ReadingHistory.jsx
  git commit -m "feat: reading history skeleton screen"
  ```

---

### Task 5: Study Topics skeleton

**Files:**
- Modify: `src/views/studytopics/StudyTopicsPage.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/studytopics/StudyTopicsPage.jsx`. Find the `<LoadingSpinner />` usage (search for `LoadingSpinner` in the file).

- [ ] **Step 2: Add StudyTopicsSkeleton and replace guard**

  ```jsx
  function StudyTopicsSkeleton() {
    return (
      <div className="study-topics">
        <div className="skeleton" style={{ height: 38, width: '45%', marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ padding: 16, background: 'var(--card-bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '90%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 14, width: '65%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  ```

  Replace the `<LoadingSpinner />` with `<StudyTopicsSkeleton />` in the loading guard.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/studytopics/StudyTopicsPage.jsx
  git commit -m "feat: study topics skeleton screen"
  ```

---

### Task 6: Search page skeleton

**Files:**
- Modify: `src/views/search/SearchPage.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/search/SearchPage.jsx`. Find the loading guard around line 85:

  ```jsx
  isLoading ? <LoadingSpinner /> : ...
  ```

- [ ] **Step 2: Add SearchSkeleton and replace guard**

  ```jsx
  function SearchSkeleton() {
    return (
      <div className="search-results">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ height: 18, width: `${60 + i * 5}%`, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 14, width: `${40 + i * 3}%` }} />
          </div>
        ))}
      </div>
    );
  }
  ```

  Replace `<LoadingSpinner />` with `<SearchSkeleton />` in the loading guard.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/search/SearchPage.jsx
  git commit -m "feat: search page skeleton screen"
  ```

---

### Task 7: Groups page skeleton

**Files:**
- Modify: `src/views/groups/GroupsPage.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/groups/GroupsPage.jsx`. The loading state uses `loadingMine + loadingPublic` (or similar combined guard). Find where `<LoadingSpinner />` is rendered.

- [ ] **Step 2: Add GroupsSkeleton and replace guard**

  ```jsx
  function GroupsSkeleton() {
    return (
      <div className="groups-page">
        <div className="skeleton" style={{ height: 38, width: '40%', marginBottom: 20 }} />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 17, width: '45%', marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 13, width: '25%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

  Replace `<LoadingSpinner />` with `<GroupsSkeleton />` in the loading guard(s). If there are two loading states (loadingMine and loadingPublic), show the skeleton while either is true.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/groups/GroupsPage.jsx
  git commit -m "feat: groups page skeleton screen"
  ```

---

### Task 8: Messages page skeleton

**Files:**
- Modify: `src/views/messages/MessagesPage.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/messages/MessagesPage.jsx`. Find where `<LoadingSpinner />` is rendered (may be multiple loading states — target the initial/list loading state, not per-message loading).

- [ ] **Step 2: Add MessagesSkeleton and replace guard**

  ```jsx
  function MessagesSkeleton() {
    return (
      <div className="messages-page">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 13, width: '70%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

  Replace `<LoadingSpinner />` with `<MessagesSkeleton />` in the initial loading guard.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/messages/MessagesPage.jsx
  git commit -m "feat: messages page skeleton screen"
  ```

---

### Task 9: Activity Feed skeleton

**Files:**
- Modify: `src/views/social/ActivityFeed.jsx`

- [ ] **Step 1: Find the loading guard**

  Open `src/views/social/ActivityFeed.jsx`. Find the loading guard around line 48:

  ```jsx
  isLoading ? <LoadingSpinner /> : ...
  ```

- [ ] **Step 2: Add ActivityFeedSkeleton and replace guard**

  ```jsx
  function ActivityFeedSkeleton() {
    return (
      <div className="activity-feed">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 15, width: `${55 + i * 4}%`, marginBottom: 7 }} />
              <div className="skeleton" style={{ height: 12, width: '20%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  ```

  Replace `<LoadingSpinner />` with `<ActivityFeedSkeleton />` in the loading guard.

- [ ] **Step 3: Commit**

  ```bash
  git add src/views/social/ActivityFeed.jsx
  git commit -m "feat: activity feed skeleton screen"
  ```

---

### Task 10: Micro-interaction — quiz answer ripple

**Files:**
- Modify: `src/styles/quiz.css`

- [ ] **Step 1: Add ripple to .quiz-option**

  Open `src/styles/quiz.css`. Find `.quiz-option`. The selector already has `position: relative; overflow: hidden` — verify this. Then add the `::after` ripple:

  ```css
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
  @media (prefers-reduced-motion: no-preference) {
    .quiz-option:active::after {
      inset: 0;
      border-radius: inherit;
      transform: scale(1);
      opacity: 1;
      transition: transform 300ms ease-out, opacity 300ms ease-out;
    }
  }
  ```

  If `.quiz-option` is missing `position: relative` or `overflow: hidden`, add them to the existing `.quiz-option` rule.

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/quiz.css
  git commit -m "feat: quiz answer ripple micro-interaction"
  ```

---

### Task 11: Micro-interaction — reading chapter check pop

**Files:**
- Modify: relevant CSS file for chapter checkboxes (find by searching for `.chapter-check` or the checkbox component in the reading/checklist view)

- [ ] **Step 1: Find the checkbox CSS file**

  Run a search for the chapter checkbox class:

  ```bash
  grep -r "chapter-check" src/styles/ src/views/ --include="*.css" --include="*.jsx" -l
  ```

  Identify the CSS file that styles chapter checkboxes (likely `src/styles/checklist.css` or `src/styles/reading.css`).

- [ ] **Step 2: Add check-pop animation**

  In the identified CSS file, add:

  ```css
  @media (prefers-reduced-motion: no-preference) {
    @keyframes check-pop {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    .chapter-check:checked + label,
    .chapter-check-label--checked {
      animation: check-pop 200ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
  }
  ```

  If the checkbox uses a custom component (not a native checkbox + label pattern), find the checked state class and apply the animation there instead.

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/<identified-css-file>
  git commit -m "feat: chapter checkbox pop animation"
  ```

---

### Task 12: Micro-interaction — streak milestone bounce

**Files:**
- Modify: `src/styles/home.css`
- Modify: the component that renders the streak banner (search for `current_streak` or `streak-text`)

- [ ] **Step 1: Add streak-bounce keyframe and class to home.css**

  Open `src/styles/home.css`. Add:

  ```css
  @media (prefers-reduced-motion: no-preference) {
    @keyframes streak-bounce {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.35); }
      70%  { transform: scale(0.92); }
      100% { transform: scale(1); }
    }
    .streak-pop {
      animation: streak-bounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
  }
  ```

- [ ] **Step 2: Find the streak component**

  Search for the component rendering the streak number:

  ```bash
  grep -r "current_streak\|streak-text\|home-streak" src/views/ src/components/ --include="*.jsx" -l
  ```

  Identify the JSX file (likely `src/views/home/HomePage.jsx` or a component it imports).

- [ ] **Step 3: Wire up the streak-pop class**

  In the identified component, find the element rendering `.home-streak-text strong` (or the streak number element). Add a `useEffect` to trigger the bounce on mount when streak > 0:

  ```jsx
  const [streakPop, setStreakPop] = useState(false);

  useEffect(() => {
    if (streak?.current_streak > 0) {
      setStreakPop(true);
    }
  }, [streak?.current_streak]);

  // In JSX, on the streak number element:
  <strong
    className={streakPop ? 'streak-pop' : undefined}
    onAnimationEnd={() => setStreakPop(false)}
  >
    {streak.current_streak}
  </strong>
  ```

  The `onAnimationEnd` callback removes the class so the animation can fire again (e.g., on next page visit).

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/home.css src/views/<streak-component-file>.jsx
  git commit -m "feat: streak milestone bounce animation"
  ```

---

### Task 13: Micro-interaction — button loading state

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/views/quiz/QuizPage.jsx` (primary submit button)
- Modify: `src/views/readingplans/ReadingPlansPage.jsx` (primary action button)

- [ ] **Step 1: Add .btn--loading to app.css**

  Open `src/styles/app.css`. After the skeleton block, add:

  ```css
  /* ── Button loading state ── */
  .btn--loading {
    pointer-events: none;
    opacity: 0.75;
    position: relative;
  }
  @media (prefers-reduced-motion: no-preference) {
    @keyframes btn-spin {
      to { transform: translateY(-50%) rotate(360deg); }
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
      animation: btn-spin 0.6s linear infinite;
    }
  }
  ```

- [ ] **Step 2: Apply to Quiz submit button**

  Open `src/views/quiz/QuizPage.jsx`. Find the primary submit/check button (the one that triggers an async mutation). Add the loading class while the mutation is in flight:

  ```jsx
  // Find the button — it likely has an onClick that calls a mutation or async function
  // Add className logic:
  <button
    className={`btn-primary ${isSubmitting ? 'btn--loading' : ''}`}
    onClick={handleSubmit}
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Checking…' : 'Check Answer'}
  </button>
  ```

  The exact button text/class will depend on what's in the file — read it first to preserve the existing className and just add the conditional `btn--loading`.

- [ ] **Step 3: Apply to Reading Plans action button**

  Open `src/views/readingplans/ReadingPlansPage.jsx`. Find the primary action button (start plan, mark complete, or similar async action). Apply the same pattern:

  ```jsx
  <button
    className={`btn-primary ${isMutating ? 'btn--loading' : ''}`}
    onClick={handleAction}
    disabled={isMutating}
  >
    {/* existing button content */}
  </button>
  ```

  Read the file to identify the correct button and mutation state variable name.

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/app.css src/views/quiz/QuizPage.jsx src/views/readingplans/ReadingPlansPage.jsx
  git commit -m "feat: button loading state with spinner"
  ```

---

### Task 14: Micro-interaction — reading plan completion confetti

**Files:**
- Modify: `src/styles/reading-plans.css`
- Modify: `src/views/readingplans/ReadingPlansPage.jsx`

- [ ] **Step 1: Add confetti CSS to reading-plans.css**

  Open `src/styles/reading-plans.css`. Add:

  ```css
  @media (prefers-reduced-motion: no-preference) {
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
      pointer-events: none;
    }
  }
  ```

- [ ] **Step 2: Find the completion state in ReadingPlansPage**

  Open `src/views/readingplans/ReadingPlansPage.jsx`. Search for `pct` or `percent` or `progress` — find where 100% completion is detected or displayed (likely in the plan card or completion badge).

- [ ] **Step 3: Add confetti burst on completion**

  In the component that renders the completion badge/progress, add confetti state:

  ```jsx
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (pct === 100) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 700);
      return () => clearTimeout(t);
    }
  }, [pct]);
  ```

  Render confetti dots when `showConfetti` is true. Place the parent container as `position: relative`:

  ```jsx
  const confettiDots = [
    { tx: '30px',  ty: '-40px', color: '#f59e0b' },
    { tx: '-30px', ty: '-40px', color: '#7c3aed' },
    { tx: '45px',  ty: '-20px', color: '#10b981' },
    { tx: '-45px', ty: '-20px', color: '#ef4444' },
    { tx: '20px',  ty: '35px',  color: '#3b82f6' },
    { tx: '-20px', ty: '35px',  color: '#f59e0b' },
    { tx: '40px',  ty: '20px',  color: '#7c3aed' },
    { tx: '-40px', ty: '20px',  color: '#10b981' },
  ];

  // In JSX, inside the completion badge container (must have position: relative):
  {showConfetti && confettiDots.map((dot, i) => (
    <span
      key={i}
      className="confetti-dot"
      style={{
        '--tx': dot.tx,
        '--ty': dot.ty,
        background: dot.color,
        animationDelay: `${i * 12}ms`,
      }}
    />
  ))}
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/reading-plans.css src/views/readingplans/ReadingPlansPage.jsx
  git commit -m "feat: reading plan completion confetti burst"
  ```

---

### Task 15: Mobile touch feel — global :active scale

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add touch-device :active scale block**

  Open `src/styles/app.css`. At the end of the file (after all existing rules), add:

  ```css
  /* ── Mobile touch feel ── */
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

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/app.css
  git commit -m "feat: mobile touch :active scale feedback"
  ```

---

### Task 16: Mobile touch feel — touch target audit

**Files:**
- Modify: `src/styles/pagenav.css` (nav icon buttons)
- Modify: `src/styles/forum.css` (reply/like/share action buttons, if under 44px)
- Modify: `src/styles/reading-plans.css` (action row buttons, if under 44px)

- [ ] **Step 1: Audit nav icon buttons**

  Open `src/styles/pagenav.css`. Find nav icon buttons (the `.nav-icon`, `.nav-btn`, or equivalent selectors). If they don't have explicit `min-height` and `min-width`:

  ```css
  /* In pagenav.css, on the nav icon button selector: */
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ```

- [ ] **Step 2: Audit forum action buttons**

  Open `src/styles/forum.css`. Search for reply, like, share button selectors (likely `.forum-action-btn`, `.forum-reply-btn`, or similar). Add to any that are under 44×44px:

  ```css
  min-height: 44px;
  min-width: 44px;
  ```

- [ ] **Step 3: Audit reading plan action buttons**

  Open `src/styles/reading-plans.css`. Find the action row button selectors. Add `min-height: 44px` to any that are under 44px tall.

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/pagenav.css src/styles/forum.css src/styles/reading-plans.css
  git commit -m "feat: touch target audit — 44px min on nav and action buttons"
  ```

---

### Task 17: Mobile touch feel — modal bottom-sheet on small screens

**Files:**
- Modify: `src/styles/upgrade-modal.css`
- Modify: `src/styles/welcome-premium.css`

- [ ] **Step 1: Add bottom-sheet styles to upgrade-modal.css**

  Open `src/styles/upgrade-modal.css`. At the end of the file, add:

  ```css
  @media (max-width: 480px) {
    .upm-overlay {
      align-items: flex-end;
      padding: 0;
    }
    .upm-modal {
      border-radius: 22px 22px 0 0;
      max-width: 100%;
      width: 100%;
    }
    @media (prefers-reduced-motion: no-preference) {
      .upm-modal {
        animation: sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      @keyframes sheet-up {
        from { transform: translateY(100%); opacity: 0.6; }
        to   { transform: translateY(0);    opacity: 1; }
      }
    }
  }
  ```

- [ ] **Step 2: Add bottom-sheet styles to welcome-premium.css**

  Open `src/styles/welcome-premium.css`. At the end of the file, add:

  ```css
  @media (max-width: 480px) {
    .wpm-overlay {
      align-items: flex-end;
      padding: 0;
    }
    .wpm-modal {
      border-radius: 22px 22px 0 0;
      max-width: 100%;
      width: 100%;
    }
    @media (prefers-reduced-motion: no-preference) {
      .wpm-modal {
        animation: sheet-up-wpm 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      @keyframes sheet-up-wpm {
        from { transform: translateY(100%); opacity: 0.6; }
        to   { transform: translateY(0);    opacity: 1; }
      }
    }
  }
  ```

  Note: The keyframe is renamed `sheet-up-wpm` to avoid a name collision with the one in upgrade-modal.css (both files are loaded globally).

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/upgrade-modal.css src/styles/welcome-premium.css
  git commit -m "feat: mobile modal bottom-sheet slide-up on screens ≤480px"
  ```

---

### Task 18: Final check + push

- [ ] **Step 1: Spot-check in dev**

  Run: `npm run dev`

  Test checklist:
  - Navigate to Quiz — shimmer skeleton should appear while loading, then grid of cards fades in
  - Navigate to Meeting Prep, Reading History, Study Topics, Search, Groups, Messages, Activity Feed — each shows skeleton instead of spinner while loading
  - Click a quiz answer — ripple expands from center on active
  - Check off a reading chapter — label pops to 1.2x and back
  - View home page with an active streak — number bounces on mount
  - Trigger an async action on quiz or reading plans — button shows spinner inset right, disables pointer events
  - Complete a 100% reading plan — 8 colored dots scatter outward from badge
  - On a mobile device (or Chrome DevTools mobile emulation): tap cards — they scale to 0.97
  - On mobile: open upgrade modal — it slides up from bottom with rounded top corners
  - Nav icon buttons are at least 44px tall and wide

- [ ] **Step 2: Push**

  ```bash
  git push
  ```
