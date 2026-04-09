# JW Study — Facebook-Style SPA Redesign
**Date:** 2026-04-03  
**Approach:** C — Full Redesign  
**Scope:** All pages except Bible Tracker (ChecklistPage)

---

## 1. Goals

- Feel like a single-page app: shell stays pinned, only content swaps
- One navigation system (sidebar owns all links — top bar stripped of nav links)
- Facebook-style 3-column layout on desktop (sidebar + content + right panel)
- Consistent design tokens across all 50 CSS files
- Command palette (⌘K) and notification dropdown as first-class features
- Light mode fully functional with proper contrast
- Mobile tab bar polished and gap-free

---

## 2. App Shell

### 2.1 Top Bar (52px, always visible)

**Remove:** all horizontal nav links (Home, Tracker, Quiz, Study, Community, More, Logout)  
**Keep/add:**
| Slot | Content |
|------|---------|
| Left | Logo icon (28px, purple gradient) + "JW Study" wordmark |
| Center | Search bar (rounded pill, max-width 360px) — opens command palette on click |
| Right | Theme toggle · Messages icon (unread badge) · Notifications bell (unread badge) · User avatar (opens profile dropdown) |

**CSS:** `background: var(--bg-elevated)`, `border-bottom: 1px solid var(--border)`, `z-index: var(--z-sticky)`

### 2.2 Left Sidebar (220px, sticky)

Owns all page navigation. No changes to nav items — same as current AppLayout. Width stays 220px.  
Hides at ≤1100px (mobile tab bar takes over).

### 2.3 Content Area

- `max-width` constrained per page (most pages: ~740px centered or full al-content width with padding)
- Fades in on navigation (see Section 4)
- No right panel on Type 2/3 pages

### 2.4 Right Panel (240px)

New column, visible at ≥1300px. Hidden 1100–1299px. Hidden ≤1099px.  

**Always present (all Type 1 pages):**
- Daily Verse widget
- Online Friends (active in last 10 min)
- Your Streak (day count + ring)
- Upgrade Banner (free users only)

**Per-page extras:** see Section 7.

---

## 3. Shell Types

| Type | Name | Pages |
|------|------|-------|
| 1 | Full Shell | Home, Forum, Blog, Leaderboard, Study Notes, Reading Plans, Bible Quiz, Friends, Profile, Bookmarks, Activity Feed, Meeting Prep, AI Tools, Family Quiz, Groups, Study Topics |
| 2 | Chat Shell | Messages (full-height, no right panel) |
| 3 | No Right Panel | Search, Reading History, Settings |
| 4 | Auth Shell | Login, Signup, Reset Password (centered card, no nav) |
| 5 | Marketing Shell | Landing, About, Terms, Privacy (full-width, slim top nav) |
| — | Exempt | Bible Tracker (ChecklistPage) — no changes |

---

## 4. Page Transitions & SPA Feel

### 4.1 Content-only fade

Only `.al-content` animates on navigation. Top bar and sidebar never re-render.

```css
.al-content {
  animation: content-enter 150ms cubic-bezier(0, 0, 0.2, 1) both;
}
@keyframes content-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Apply by adding `key={nav.page}` to the `al-content` div in AppLayout (React re-mounts on key change, triggering the animation).

### 4.2 Skeleton loaders

Replace `<LoadingSpinner />` on all main pages with purple shimmer skeletons shaped like each page's content.

```css
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
.skeleton {
  border-radius: var(--radius-sm);
  background: linear-gradient(
    90deg,
    rgba(138,75,255,0.07) 25%,
    rgba(138,75,255,0.14) 50%,
    rgba(138,75,255,0.07) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease infinite;
}
```

Each page component gets a `<PageSkeleton />` sibling shown while React Query `isLoading`.

---

## 5. Design Tokens

All added to `app.css :root`. Existing components migrate incrementally; new components use vars from day one.

### 5.1 Spacing scale (new)
```css
--sp-1: 4px;   --sp-2: 8px;   --sp-3: 12px;  --sp-4: 16px;
--sp-5: 20px;  --sp-6: 24px;  --sp-8: 32px;  --sp-10: 40px;  --sp-12: 48px;
```

### 5.2 Font weight scale (new)
```css
--fw-normal: 500;  --fw-semi: 600;  --fw-bold: 700;  --fw-black: 800;
```

### 5.3 Border radius (enforce existing vars)
Remove all hardcoded `4px` (→ `--radius-xs`), `10px` (→ `--radius-sm`), `8px` (→ `--radius-sm`) across all CSS files.

### 5.4 Hover/active opacity scale (standardise)
```css
--hover-bg:  rgba(124, 58, 237, 0.10);
--active-bg: rgba(124, 58, 237, 0.18);
--active-hover-bg: rgba(124, 58, 237, 0.22);
```
Replace all `rgba(124,58,237,0.07)`, `rgba(124,58,237,0.08)`, `rgba(124,58,237,0.1)` with `var(--hover-bg)`.

### 5.5 Base card class (new, in app.css)
```css
.app-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(138, 75, 255, 0.15);
  border-radius: var(--radius);
  box-shadow: var(--shadow-xs);
}
.app-card:hover {
  border-color: rgba(138, 75, 255, 0.28);
}
```
Per-page card classes extend `.app-card` rather than redefining base styles.

### 5.6 Transition enforcement
Replace all hardcoded `transition: ... 0.15s`, `0.2s` with `var(--dur-fast)` / `var(--dur-base)`.

---

## 6. Command Palette & Notification Dropdown

### 6.1 Command Palette (`CommandPalette.tsx`)
- **Trigger:** `⌘K` / `Ctrl+K` globally, or clicking the top bar search bar
- **Content:** Page navigation (all sidebar pages), recent study notes, recent reading plans
- **Behavior:** Keyboard navigable (↑↓ arrows, Enter to open, Escape to close), focus trap, backdrop overlay
- **Animation:** fade + scale(0.96→1), 150ms ease-out
- **Data:** Static page list + `useStudyNotes()` + `useMyPlans()` for recents

### 6.2 Notification Dropdown (`NotificationDropdown.tsx`)
- **Trigger:** Bell icon in top bar
- **Content:** Messages, friend requests, forum replies, streak milestones
- **Unread state:** Purple left border + dot indicator per item
- **Actions:** "Mark all read" button, "See all" link to dedicated page
- **Data:** Existing Supabase notification tables via new `useNotifications()` hook
- **Animation:** fade + translateY(-8px→0), 150ms ease-out
- **Behavior:** Close on Escape, outside click, or navigation

---

## 7. Right Panel Widget Content Per Page

| Page | Extra Widgets (beyond always-on set) |
|------|--------------------------------------|
| Forum | Trending topics, most active threads, top contributors |
| Blog | Popular posts this month, tag cloud, featured author |
| Leaderboard | Your rank + movement, points to next tier, weekly challenge |
| Study Notes | Last 3 notes, most-used tags, quick "New Note" button |
| Friends | People you may know, invite link |
| Reading Plans | Progress ring, days remaining |
| Bible Quiz | Personal high score, next challenge |
| Profile | Edit shortcuts, reading stats |
| Home | (right panel already exists — extend with streak leaders) |
| All others (Type 1) | Always-on set only |

**Right panel component:** `RightPanel.tsx` — accepts `page` prop, renders always-on widgets + page-specific extras. Wrapped in `@media (min-width: 1300px)` display guard.

---

## 8. Light Mode Fixes

| Issue | Fix |
|-------|-----|
| Glass cards invisible (`rgba(255,255,255,0.03)`) | Light mode override: `background: #fff; border: 1px solid rgba(124,58,237,0.18); box-shadow: var(--shadow-xs)` |
| Muted text fails 4.5:1 contrast | Audit `--text-muted` in light mode — raise to `rgba(30,16,53,0.55)` minimum |
| Borders invisible on white bg | Light mode border: `rgba(124,58,237,0.18)` (up from 0.10) |
| Mobile tab bar hardcoded dark | Use `var(--bg-elevated)` so it flips with theme |

All light mode fixes go in `[data-theme="light"]` blocks in their respective CSS files.

---

## 9. Mobile Polish

- All tab bar items and sidebar nav items: minimum 44×44px touch target
- `padding-bottom: 70px` on all page content at `≤1100px` so content clears tab bar
- `env(safe-area-inset-bottom)` already on tab bar — verify on all pages
- Mobile tab bar hidden on Messages page (has its own bottom composer)
- Tab bar light mode: uses `var(--bg-elevated)` + `var(--border)` instead of hardcoded dark values

---

## 10. Files Affected

### New files
- `src/components/TopBar.tsx` — replaces PageNav for authed app
- `src/components/RightPanel.tsx` — right column widget container
- `src/components/CommandPalette.tsx` — ⌘K overlay
- `src/components/NotificationDropdown.tsx` — bell dropdown
- `src/components/skeletons/` — per-page skeleton components
- `src/hooks/useNotifications.ts` — notification data hook

### Modified files
- `src/styles/app.css` — new tokens (spacing, fw, hover vars, .app-card)
- `src/styles/app-layout.css` — content-enter animation, right panel column, 1300px breakpoint
- `src/components/AppLayout.tsx` — add key prop for transition, integrate RightPanel
- `src/AuthedApp.tsx` — swap PageNav → TopBar, remove MobileTabBar from messages
- All 50 `src/styles/*.css` — token enforcement (border-radius, hover, transition vars)
- All Type 1–3 page views — light mode card overrides

### Untouched
- `src/views/ChecklistPage.tsx` and all its CSS
- Auth pages structure (only light mode CSS tweaks)
- All Supabase hooks/queries (notification hook is new addition only)

---

## 11. Out of Scope

- Backend changes (no new tables, no schema changes)
- Bible Tracker page
- Landing page redesign
- Admin page
- Font change (Plus Jakarta Sans stays)
- Color palette change (purple DNA stays)
