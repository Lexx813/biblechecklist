# Design Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add missing design tokens to `app.css`, enforce existing radius/hover/transition vars across all CSS files, and create the `.app-card` base class.

**Architecture:** All token additions go in `src/styles/app.css :root`. Enforcement is a find-and-replace pass over the ~50 CSS files in `src/styles/`. No component changes — purely CSS.

**Tech Stack:** CSS custom properties, Vite (dev server hot-reloads CSS instantly)

---

### Task 1: Add spacing, font-weight, and hover tokens to `app.css`

**Files:**
- Modify: `src/styles/app.css:24-87` (the `:root` block)

- [ ] **Step 1: Open `src/styles/app.css` and locate the `:root` block (lines 24–87)**

- [ ] **Step 2: Add new tokens after the `--z-top` line (currently line 86)**

Insert this block immediately after `--z-top: 2000;` and before the closing `}`:

```css
  /* ── Spacing scale ── */
  --sp-1:  4px;
  --sp-2:  8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-10: 40px;
  --sp-12: 48px;

  /* ── Font weight ── */
  --fw-normal: 500;
  --fw-semi:   600;
  --fw-bold:   700;
  --fw-black:  800;

  /* ── Hover / active opacity ── */
  --hover-bg:        rgba(124, 58, 237, 0.10);
  --active-bg:       rgba(124, 58, 237, 0.18);
  --active-hover-bg: rgba(124, 58, 237, 0.22);
```

- [ ] **Step 3: Verify the dev server shows no CSS errors**

Run: `npm run dev` (if not already running), open browser DevTools → Console. Expected: no CSS parsing errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: add spacing, font-weight, and hover tokens to app.css :root"
```

---

### Task 2: Add `.app-card` base class to `app.css`

**Files:**
- Modify: `src/styles/app.css` (after `:root` block, before `.skip-link`)

- [ ] **Step 1: Add `.app-card` after the `:root` closing brace in `app.css`**

Insert after the `:root { ... }` block (before `.skip-link`):

```css
/* ── Base card ── */
.app-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(138, 75, 255, 0.15);
  border-radius: var(--radius);
  box-shadow: var(--shadow-xs);
  transition: border-color var(--dur-base) var(--ease-out);
}
.app-card:hover {
  border-color: rgba(138, 75, 255, 0.28);
}

[data-theme="light"] .app-card {
  background: #fff;
  border-color: rgba(124, 58, 237, 0.18);
}
[data-theme="light"] .app-card:hover {
  border-color: rgba(124, 58, 237, 0.32);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/app.css
git commit -m "feat: add .app-card base class with light mode override"
```

---

### Task 3: Replace hardcoded hover backgrounds in `app-layout.css`

**Files:**
- Modify: `src/styles/app-layout.css`

The file currently uses `rgba(124, 58, 237, 0.1)` and `rgba(124, 58, 237, 0.18)` and `rgba(124, 58, 237, 0.22)` as hardcoded values.

- [ ] **Step 1: Replace hover/active backgrounds in `app-layout.css`**

Find and replace these exact strings:

| Old | New |
|-----|-----|
| `background: rgba(124, 58, 237, 0.1);` | `background: var(--hover-bg);` |
| `background: rgba(124, 58, 237, 0.18);` | `background: var(--active-bg);` |
| `background: rgba(124, 58, 237, 0.22);` | `background: var(--active-hover-bg);` |

Lines affected (check file for exact positions):
- `.al-profile:hover` → `--hover-bg`
- `.al-item:hover` → `--hover-bg`
- `.al-item--active` → `--active-bg`
- `.al-item--active:hover` → `--active-hover-bg`
- Light theme overrides for the same selectors

- [ ] **Step 2: Verify sidebar still looks correct in dark + light mode in the browser**

Expected: no visual change — just using vars now.

- [ ] **Step 3: Commit**

```bash
git add src/styles/app-layout.css
git commit -m "refactor: replace hardcoded hover rgba with --hover-bg/active-bg vars in app-layout.css"
```

---

### Task 4: Replace hardcoded border-radius values across CSS files

**Files:**
- Modify: all `src/styles/*.css` files that use hardcoded `4px`, `8px`, `10px`, `12px`, `16px`, `20px` as border-radius

Token mapping:
- `border-radius: 4px` → `border-radius: var(--radius-xs)` (--radius-xs is 6px — use only for very tight elements; skip if 4px is intentional sizing rather than a design token)
- `border-radius: 6px` → `border-radius: var(--radius-xs)`
- `border-radius: 8px` → `border-radius: var(--radius-sm)`
- `border-radius: 10px` → `border-radius: var(--radius-sm)`
- `border-radius: 12px` → `border-radius: var(--radius)`
- `border-radius: 16px` → `border-radius: var(--radius-md)`
- `border-radius: 20px` → `border-radius: var(--radius-lg)`
- `border-radius: 9999px` or `border-radius: 50%` → leave as-is (these are intentional)

> **Note:** Only replace `border-radius` property values, not `border-top-left-radius` etc. unless the intent is clear. If a file has many instances, use find-and-replace carefully. Do NOT change `border-radius` values inside SVG attributes or inline styles in `.tsx` files — this task is CSS-only.

- [ ] **Step 1: Find all CSS files with hardcoded border-radius**

Run: `grep -rn "border-radius: [0-9]" src/styles/ | grep -v "var(--"` to see what needs changing.

- [ ] **Step 2: For each file listed, replace hardcoded values with tokens**

Do NOT replace values that are clearly not design-token candidates (e.g., `border-radius: 2px` on a progress bar track, `border-radius: 50%` on avatars). Use judgment — the rule is: if it's a card/button/input/panel corner, replace it; if it's a micro-detail like a 2px accent line, leave it.

- [ ] **Step 3: Verify no visual regressions by loading 3-4 pages in the browser**

Check: Forum, Study Notes, Leaderboard, Settings. Expected: identical appearance since the pixel values are close.

- [ ] **Step 4: Commit all changed CSS files together**

```bash
git add src/styles/
git commit -m "refactor: replace hardcoded border-radius px values with --radius-* tokens across CSS files"
```

---

### Task 5: Replace hardcoded transition durations with token vars

**Files:**
- Modify: all `src/styles/*.css` files that use `0.15s`, `0.2s`, `150ms`, `200ms` in `transition` properties

Token mapping:
- `0.15s` or `150ms` → `var(--dur-fast)` (120ms — visually identical)
- `0.2s` or `200ms` → `var(--dur-base)` (200ms — exact match)
- `0.3s` or `300ms` → `var(--dur-slow)` (320ms — visually identical)
- Any `ease` or `ease-out` timing function → `var(--ease-out)`

> **Note:** Do NOT replace transition durations in animation `@keyframes` blocks. Only replace `transition:` property values. If a file has `transition: background 0.15s ease` change it to `transition: background var(--dur-fast) var(--ease-out)`.

- [ ] **Step 1: Find all CSS files with hardcoded transition durations**

Run: `grep -rn "transition:.*0\." src/styles/ | grep -v "var(--"` to see candidates.

- [ ] **Step 2: Replace durations file by file**

For each file, replace patterns like:
- `transition: background 0.15s` → `transition: background var(--dur-fast) var(--ease-out)`
- `transition: color 0.2s ease` → `transition: color var(--dur-base) var(--ease-out)`
- `transition: all 0.15s` → `transition: all var(--dur-fast) var(--ease-out)`

- [ ] **Step 3: Commit**

```bash
git add src/styles/
git commit -m "refactor: replace hardcoded transition durations with --dur-* and --ease-* tokens"
```

---

### Self-Review

**Spec coverage check:**
- Section 5.1 (spacing scale): ✓ Task 1
- Section 5.2 (font weight scale): ✓ Task 1
- Section 5.3 (border radius enforcement): ✓ Task 4
- Section 5.4 (hover/active opacity): ✓ Task 1 + Task 3
- Section 5.5 (base card class): ✓ Task 2
- Section 5.6 (transition enforcement): ✓ Task 5

**Note:** `--fw-*` tokens are defined here but not yet applied to existing text — that's intentional. New components added in Plan B and Plan C will use them from day one. Retroactive application to existing CSS is out of scope to minimize diff size and regression risk.
