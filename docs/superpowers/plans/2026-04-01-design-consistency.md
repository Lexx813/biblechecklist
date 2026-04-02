# Design Consistency — Cormorant Garamond & Gold Accent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Cormorant Garamond italic to 10 page hero/display titles and gold (#f59e0b) to 7 element types across the app, making both design tokens globally available via app.css.

**Architecture:** Global CSS variables (`--gold`, `--gold-dim`, `--gold-text`) and the Cormorant Garamond `@import` are added once to `src/styles/app.css`. Each page's CSS file is updated to reference these globals. Landing.css's duplicate `:root` block is removed and all references updated to the global vars.

**Tech Stack:** React 19 SPA, vanilla CSS per-feature files, Google Fonts via `@import`, CSS custom properties.

---

### Task 1: Global tokens — app.css + cleanup landing.css

**Files:**
- Modify: `src/styles/app.css` (top of file)
- Modify: `src/styles/landing.css` (remove local `:root`, rename vars)

- [ ] **Step 1: Add Cormorant import and gold vars to app.css**

  In `src/styles/app.css`, insert at the very top (before the existing comment on line 3):

  ```css
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&display=swap');
  ```

  Then inside the existing `:root { }` block in app.css (after `--radius-pill: 999px;`), add:

  ```css
  /* ── Gold accent ── */
  --gold: #f59e0b;
  --gold-dim: rgba(245, 158, 11, 0.15);
  --gold-text: #fde68a;
  ```

- [ ] **Step 2: Remove duplicate declarations from landing.css**

  In `src/styles/landing.css`, delete lines 3–9 (the `@import` and local `:root` block):

  ```css
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&display=swap');

  :root {
    --landing-gold: #f59e0b;
    --landing-gold-dim: rgba(245, 158, 11, 0.15);
    --landing-gold-text: #fde68a;
  }
  ```

  Then rename all var references throughout landing.css:
  - `var(--landing-gold)` → `var(--gold)`
  - `var(--landing-gold-dim)` → `var(--gold-dim)`
  - `var(--landing-gold-text)` → `var(--gold-text)`

- [ ] **Step 3: Verify dev build loads correctly**

  Run: `npm run dev` (or `pnpm dev`)
  Navigate to the landing page. Badge should still be gold, hero title still shows Cormorant italic gradient. If the page looks correct, the global tokens are working.

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/app.css src/styles/landing.css
  git commit -m "feat: move Cormorant @import and gold vars to app.css (global tokens)"
  ```

---

### Task 2: Cormorant on Quiz

**Files:**
- Modify: `src/styles/quiz.css` (`.quiz-hub-title`, `.quiz-results-title`)

- [ ] **Step 1: Update `.quiz-hub-title`**

  In `src/styles/quiz.css`, change `.quiz-hub-title` (around line 27):
  ```css
  .quiz-hub-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(32px, 6vw, 52px);
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  ```

- [ ] **Step 2: Update `.quiz-results-title`**

  In `src/styles/quiz.css`, change `.quiz-results-title` (around line 479):
  ```css
  .quiz-results-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(28px, 5vw, 40px);
    color: var(--text-primary);
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/quiz.css
  git commit -m "feat: Cormorant Garamond on quiz hub and results titles"
  ```

---

### Task 3: Cormorant on Reading Plans

**Files:**
- Modify: `src/styles/reading-plans.css` (`.rp-title`)

- [ ] **Step 1: Update `.rp-title`**

  In `src/styles/reading-plans.css`, change `.rp-title` (around line 31):
  ```css
  .rp-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(28px, 5vw, 44px);
    background: linear-gradient(135deg, var(--text-primary) 30%, #7c3aed 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 4px;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/reading-plans.css
  git commit -m "feat: Cormorant Garamond on Reading Plans page title"
  ```

---

### Task 4: Cormorant on Leaderboard

**Files:**
- Modify: `src/styles/leaderboard.css` (`.lb-title`)

- [ ] **Step 1: Update `.lb-title`**

  In `src/styles/leaderboard.css`, change `.lb-title` (line 8):
  ```css
  .lb-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(28px, 5vw, 44px);
    color: var(--text-primary);
    margin: 8px 0 4px;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/leaderboard.css
  git commit -m "feat: Cormorant Garamond on Leaderboard title"
  ```

---

### Task 5: Cormorant on Forum

**Files:**
- Modify: `src/styles/forum.css` (`.forum-hero-title`)

- [ ] **Step 1: Update `.forum-hero-title`**

  In `src/styles/forum.css`, change `.forum-hero-title` (around line 47):
  ```css
  .forum-hero-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(36px, 7vw, 64px);
    color: #fff;
    margin: 0 0 12px;
    line-height: 1.1;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/forum.css
  git commit -m "feat: Cormorant Garamond on Forum hero title"
  ```

---

### Task 6: Cormorant on Blog

**Files:**
- Modify: `src/styles/blog.css` (`.blog-hero-title`, `.blog-post-hero-title`)

- [ ] **Step 1: Update `.blog-hero-title`**

  In `src/styles/blog.css`, change `.blog-hero-title` (around line 92):
  ```css
  .blog-hero-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(44px, 8vw, 80px);
    color: #fff;
    letter-spacing: -0.01em;
    margin-bottom: 14px;
    line-height: 1.05;
  }
  ```

- [ ] **Step 2: Update `.blog-post-hero-title`**

  In `src/styles/blog.css`, change `.blog-post-hero-title` (around line 301):
  ```css
  .blog-post-hero-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(28px, 5vw, 48px);
    color: #fff;
    margin: 0;
    line-height: 1.15;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/blog.css
  git commit -m "feat: Cormorant Garamond on Blog hero and post titles"
  ```

---

### Task 7: Cormorant on Profile

**Files:**
- Modify: `src/styles/profile.css` (`.pf-name`)

- [ ] **Step 1: Update `.pf-name`**

  In `src/styles/profile.css`, change `.pf-name` (around line 157):
  ```css
  .pf-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 26px;
    color: var(--text-primary);
  }
  ```

  Also update the responsive overrides (around lines 888, 911) to keep consistent sizes:
  - `@media` line 888: `.pf-name { font-size: 22px; }`
  - `@media` line 911: `.pf-name { font-size: 20px; }`

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/profile.css
  git commit -m "feat: Cormorant Garamond on Profile display name"
  ```

---

### Task 8: Cormorant on About

**Files:**
- Modify: `src/styles/about.css` (`.about-hero-title`)

- [ ] **Step 1: Update `.about-hero-title`**

  In `src/styles/about.css`, change `.about-hero-title` (around line 49):
  ```css
  .about-hero-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(36px, 7vw, 60px);
    color: #fff;
    margin: 0 0 14px;
    line-height: 1.1;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/about.css
  git commit -m "feat: Cormorant Garamond on About hero title"
  ```

---

### Task 9: Cormorant on Auth

**Files:**
- Modify: `src/styles/auth.css` (`.auth-title`)

- [ ] **Step 1: Update `.auth-title`**

  In `src/styles/auth.css`, change `.auth-title` (around line 65):
  ```css
  .auth-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 26px;
    color: #fff;
    margin-bottom: 4px;
  }
  ```

  Update the responsive override (around line 336): `.auth-title { font-size: 22px; }`
  And line 349 override: `.auth-title { font-size: 20px; }`

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/auth.css
  git commit -m "feat: Cormorant Garamond on Auth page headline"
  ```

---

### Task 10: Cormorant on Study Notes

**Files:**
- Modify: `src/styles/study-notes.css` (`.sn-title`)

- [ ] **Step 1: Update `.sn-title`**

  In `src/styles/study-notes.css`, change `.sn-title` (around line 54):
  ```css
  .sn-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: clamp(26px, 5vw, 38px);
    color: var(--text-primary);
    margin: 0 0 4px;
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/study-notes.css
  git commit -m "feat: Cormorant Garamond on Study Notes title"
  ```

---

### Task 11: Gold on Upgrade Modal (header + CTA) + Cormorant title

**Files:**
- Modify: `src/styles/upgrade-modal.css` (`.upm-title`, `.upm-badge`, `.upm-cta`)

- [ ] **Step 1: Update `.upm-badge` to gold**

  In `src/styles/upgrade-modal.css`, change `.upm-badge` (around line 46):
  ```css
  .upm-badge {
    display: inline-block;
    background: rgba(245,158,11,0.18);
    border: 1px solid rgba(245,158,11,0.35);
    color: var(--gold-text);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 999px;
    margin-bottom: 16px;
  }
  ```

- [ ] **Step 2: Update `.upm-title` to Cormorant**

  In `src/styles/upgrade-modal.css`, change `.upm-title` (around line 60):
  ```css
  .upm-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 28px;
    color: #fff;
    margin: 0 0 12px;
    line-height: 1.2;
  }
  ```

- [ ] **Step 3: Find the CTA button class and add gold glow**

  Look for the primary CTA button class inside upgrade-modal.css (search for `upm-cta` or similar). Add a gold box-shadow glow to it:
  ```css
  /* Add to existing .upm-cta rule or create if absent: */
  box-shadow: 0 0 0 1px rgba(245,158,11,0.3), 0 4px 16px rgba(245,158,11,0.2);
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/upgrade-modal.css
  git commit -m "feat: gold accent + Cormorant on Upgrade Modal header and CTA"
  ```

---

### Task 12: Gold on Welcome Premium Modal

**Files:**
- Modify: `src/styles/welcome-premium.css` (`.wpm-badge`, `.wpm-title`)

- [ ] **Step 1: Update `.wpm-badge` to gold**

  In `src/styles/welcome-premium.css`, change `.wpm-badge` (around line 60):
  ```css
  .wpm-badge {
    display: inline-block;
    background: rgba(245,158,11,0.2);
    border: 1px solid rgba(245,158,11,0.4);
    color: var(--gold-text);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 999px;
    margin-bottom: 12px;
  }
  ```

- [ ] **Step 2: Update `.wpm-title` to Cormorant + gold tint**

  In `src/styles/welcome-premium.css`, change `.wpm-title` (around line 74):
  ```css
  .wpm-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-weight: 300;
    font-size: 30px;
    color: var(--gold-text);
    margin: 0 0 8px;
    line-height: 1.15;
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/welcome-premium.css
  git commit -m "feat: gold accent + Cormorant on Welcome Premium modal header"
  ```

---

### Task 13: Gold on Streak count

**Files:**
- Modify: `src/styles/home.css` (`.home-streak-text strong`)

- [ ] **Step 1: Update streak count color**

  In `src/styles/home.css`, change `.home-streak-text strong` (around line 368):
  ```css
  .home-streak-text strong { color: var(--gold); font-size: 17px; }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/styles/home.css
  git commit -m "feat: gold streak count number on home page"
  ```

---

### Task 14: Gold on Leaderboard #1 rank

**Files:**
- Modify: `src/styles/leaderboard.css` (add `.lb-row--first`)
- Modify: `src/views/LeaderboardPage.jsx` (apply class when `i === 0`)

- [ ] **Step 1: Add `.lb-row--first` CSS**

  In `src/styles/leaderboard.css`, after `.lb-row--me { ... }` (around line 62), add:
  ```css
  .lb-row--first {
    border-color: rgba(245,158,11,0.4);
    background: rgba(245,158,11,0.05);
  }
  .lb-row--first:hover { border-color: rgba(245,158,11,0.65); }
  ```

- [ ] **Step 2: Apply class in LeaderboardPage.jsx**

  In `src/views/LeaderboardPage.jsx`, inside both `ReadingBoard` and `QuizBoard` (or whatever the quiz list component is named), find the `className` on each `.lb-row` and add the `--first` modifier when `i === 0`:

  Current code (line ~50):
  ```jsx
  className={`lb-row${row.user_id === userId ? " lb-row--me" : ""}`}
  ```

  Change to:
  ```jsx
  className={`lb-row${i === 0 ? " lb-row--first" : ""}${row.user_id === userId ? " lb-row--me" : ""}`}
  ```

  Apply the same change to the quiz leaderboard list (same pattern, likely in a `QuizBoard` function in the same file).

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/leaderboard.css src/views/LeaderboardPage.jsx
  git commit -m "feat: gold highlight on leaderboard #1 rank row"
  ```

---

### Task 15: Gold on Quiz badge earned state

**Files:**
- Modify: `src/styles/quiz.css` (`.quiz-level-card--completed`, `.quiz-badge-reveal`, `.quiz-badge-emoji`)

- [ ] **Step 1: Update `.quiz-level-card--completed` to gold glow**

  In `src/styles/quiz.css`, change `.quiz-level-card--completed` (around line 87):
  ```css
  .quiz-level-card--completed {
    cursor: pointer;
    border-color: rgba(245,158,11,0.4);
    box-shadow: 0 0 0 2px rgba(245,158,11,0.18), var(--shadow-md);
  }
  .quiz-level-card--completed:hover {
    transform: translateY(-3px);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.35), var(--shadow-md);
  }
  .quiz-level-card--completed::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(245,158,11,0.07) 0%, transparent 60%);
    pointer-events: none;
  }
  ```

- [ ] **Step 2: Update `.quiz-badge-reveal` and `.quiz-badge-emoji`**

  In `src/styles/quiz.css`, find `.quiz-badge-reveal` (around line 516) and `.quiz-badge-emoji` (around line 540). Add gold glow to the badge emoji:
  ```css
  .quiz-badge-emoji {
    font-size: 56px;
    display: block;
    margin-bottom: 8px;
    filter: drop-shadow(0 0 12px rgba(245,158,11,0.5));
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/quiz.css
  git commit -m "feat: gold glow on quiz badge earned state"
  ```

---

### Task 16: Gold on premium badges everywhere

**Files:**
- Modify: `src/styles/leaderboard.css` (`.lb-premium-badge`)
- Modify: `src/styles/upgrade-prompt.css` (`.up-icon`)
- Modify: `src/styles/reading-plans.css` (`.rp-premium-tag` and `.rp-template-card--premium` — use vars)

- [ ] **Step 1: Update `.lb-premium-badge` to gold**

  In `src/styles/leaderboard.css`, change `.lb-premium-badge` (around line 84):
  ```css
  .lb-premium-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 900;
    color: var(--gold-text);
    background: var(--gold-dim);
    border: 1px solid rgba(245,158,11,0.3);
    border-radius: 4px;
    padding: 1px 5px;
    margin-left: 6px;
    vertical-align: middle;
    letter-spacing: 0.04em;
    line-height: 1.6;
    flex-shrink: 0;
  }
  ```

- [ ] **Step 2: Update `.up-icon` in upgrade-prompt.css to gold**

  In `src/styles/upgrade-prompt.css`, change line 33:
  ```css
  .up-icon { font-size: 22px; color: var(--gold); margin-bottom: 10px; }
  ```

- [ ] **Step 3: Update reading-plans hardcoded gold to use vars**

  In `src/styles/reading-plans.css`, change `.rp-premium-tag` (around line 606) to use CSS vars:
  ```css
  .rp-premium-tag {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: linear-gradient(135deg, var(--gold), #d97706);
    color: #fff;
    border-radius: 999px;
    padding: 2px 7px;
  }

  .rp-template-card--premium {
    border-left-color: var(--gold) !important;
  }
  .rp-template-card--premium:hover {
    border-color: rgba(245,158,11,0.5);
    border-left-color: var(--gold) !important;
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/leaderboard.css src/styles/upgrade-prompt.css src/styles/reading-plans.css
  git commit -m "feat: gold on premium badges (leaderboard, upgrade prompt, reading plans)"
  ```

---

### Task 17: Gold section labels on Study Notes + Meeting Prep pages

**Files:**
- Modify: `src/styles/study-notes.css` (add `.sn-premium-label`)
- Modify: `src/views/studynotes/StudyNotesPage.jsx` (add label to header)
- Modify: `src/styles/meeting-prep.css` (add `.mp-premium-label`)
- Modify: `src/views/meetingprep/MeetingPrepPage.jsx` (add label to header)

- [ ] **Step 1: Add `.sn-premium-label` CSS**

  In `src/styles/study-notes.css`, after `.sn-subtitle { ... }` (around line 66), add:
  ```css
  .sn-premium-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gold-text);
    background: var(--gold-dim);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 999px;
    padding: 3px 10px;
    align-self: flex-start;
  }
  ```

- [ ] **Step 2: Add the label to StudyNotesPage.jsx header**

  In `src/views/studynotes/StudyNotesPage.jsx`, find the `.sn-header` section. After `.sn-subtitle` (or `.sn-title`), add the label if the user is on a premium feature page (always show it — study notes is premium):

  ```jsx
  <span className="sn-premium-label">✦ Premium</span>
  ```

  Place it inside `.sn-header`, after `.sn-subtitle`.

- [ ] **Step 3: Add `.mp-premium-label` CSS and Meeting Prep label**

  In `src/styles/meeting-prep.css`, after `.mp-title { ... }` (around line 29), add:
  ```css
  .mp-premium-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--gold-text);
    background: var(--gold-dim);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 999px;
    padding: 3px 10px;
  }
  ```

  In `src/views/meetingprep/MeetingPrepPage.jsx`, find the page header area (near `.mp-title`). Add:
  ```jsx
  <span className="mp-premium-label">✦ Premium</span>
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/styles/study-notes.css src/views/studynotes/StudyNotesPage.jsx \
          src/styles/meeting-prep.css src/views/meetingprep/MeetingPrepPage.jsx
  git commit -m "feat: gold premium label pills on Study Notes and Meeting Prep pages"
  ```

---

### Task 18: Final visual check + push

- [ ] **Step 1: Spot-check all 10 pages in dev**

  Run: `npm run dev` (or `pnpm dev`)

  Visit each page and verify:
  - Quiz → hub title and results title use Cormorant italic
  - Reading Plans → page title uses Cormorant italic
  - Leaderboard → page title uses Cormorant, #1 row has gold border/bg
  - Forum → hero title uses Cormorant italic
  - Blog → hero title and post titles use Cormorant italic
  - Profile → display name uses Cormorant italic
  - About → hero title uses Cormorant italic
  - Auth → headline uses Cormorant italic
  - Upgrade Modal → title uses Cormorant, badge is gold, CTA has gold glow
  - Study Notes → title uses Cormorant, gold "✦ Premium" pill in header

  Also verify:
  - Streak count number is gold on home page
  - Quiz completed cards have gold border glow
  - Quiz badge emoji has gold drop-shadow on reveal
  - Premium badges in leaderboard are gold
  - Welcome Premium "You're Premium!" title is gold Cormorant
  - Landing page still looks correct (after var rename)

- [ ] **Step 2: Fix any regressions found**

  If any page looks off, read the relevant CSS file and JSX, identify the issue, fix it.

- [ ] **Step 3: Push**

  ```bash
  git push
  ```
