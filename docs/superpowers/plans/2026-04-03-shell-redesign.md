# Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the horizontal PageNav with a slim TopBar (logo + search + utility icons only), add the right panel column (visible at ≥1300px), wire content-enter animation to navigation, and update AuthedApp to use the new TopBar.

**Architecture:** `TopBar.tsx` is a new component replacing `PageNav` for all authed pages. `RightPanel.tsx` is a new context-aware right column. `AppLayout.tsx` gains a `key` prop for CSS transitions and a `rightPanel` prop for the right column. `AuthedApp.tsx` swaps `PageNav` → `TopBar` at the render level (PageNav stays for the marketing/public views).

**Tech Stack:** React 18, TypeScript (files are `@ts-nocheck` so no type errors to worry about), CSS custom properties, existing Supabase hooks

---

### Task 1: Add content-enter animation to `app-layout.css`

**Files:**
- Modify: `src/styles/app-layout.css`

- [ ] **Step 1: Add the content-enter keyframe and animation rule**

Add at the bottom of `src/styles/app-layout.css`:

```css
/* ── Content-enter animation (SPA page transition) ── */
@keyframes content-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.al-content {
  animation: content-enter 150ms cubic-bezier(0, 0, 0.2, 1) both;
}
@media (prefers-reduced-motion: reduce) {
  .al-content { animation: none; }
}
```

- [ ] **Step 2: Verify animation fires on page load in the browser**

Open app, navigate between sidebar pages. Expected: content fades in from slightly below, sidebar stays pinned.

- [ ] **Step 3: Commit**

```bash
git add src/styles/app-layout.css
git commit -m "feat: add content-enter SPA transition animation to .al-content"
```

---

### Task 2: Add `key` prop to `AppLayout` for re-mount on navigation

**Files:**
- Modify: `src/components/AppLayout.tsx`
- Modify: `src/AuthedApp.tsx`

The animation in Task 1 only re-fires when React re-mounts the element. Adding `key={currentPage}` to `.al-content` makes React unmount+remount it on every page change, triggering the CSS animation.

- [ ] **Step 1: In `AppLayout.tsx`, add `key={currentPage}` to the `.al-content` div**

Current code at line 108:
```tsx
      <div className="al-content">
        {children}
      </div>
```

Replace with:
```tsx
      <div key={currentPage} className="al-content">
        {children}
      </div>
```

The `currentPage` prop is already passed to `AppLayout` — no interface change needed.

- [ ] **Step 2: Verify navigation triggers the animation**

In the browser: click sidebar links. Expected: content fades in with 150ms slide-up animation on every navigation. Sidebar stays pinned without animation.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat: add key={currentPage} to .al-content for CSS re-animation on navigation"
```

---

### Task 3: Add 3-column layout (right panel slot) to `app-layout.css` and `AppLayout.tsx`

**Files:**
- Modify: `src/styles/app-layout.css`
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Add right panel CSS to `app-layout.css`**

Add these rules at the bottom of `app-layout.css`:

```css
/* ── Right panel column (visible ≥ 1300px) ── */
.al-wrap--with-rp {
  grid-template-columns: 260px 1fr 240px;
  max-width: 1600px;
}

.al-right {
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 16px 12px 80px;
  border-left: 1px solid rgba(138, 75, 255, 0.1);
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.al-right::-webkit-scrollbar { display: none; }

/* Hide right panel below 1300px */
@media (max-width: 1299px) {
  .al-wrap--with-rp { grid-template-columns: 260px 1fr; }
  .al-right { display: none; }
}

/* Light theme */
[data-theme="light"] .al-right { border-color: rgba(124, 58, 237, 0.12); }
```

- [ ] **Step 2: Add optional `rightPanel` prop to `AppLayout.tsx`**

Update the Props interface (line 27):

```tsx
interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  user: { id?: string; email?: string } | null | undefined;
  currentPage: string;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}
```

Update the function signature (line 34):

```tsx
export default function AppLayout({ navigate, user, currentPage, children, rightPanel }: Props) {
```

Update the return JSX (line 49) — add `al-wrap--with-rp` conditionally and add `al-right` column:

```tsx
  return (
    <div className={`al-wrap${rightPanel ? " al-wrap--with-rp" : ""}`}>
      <aside className="al-sidebar" aria-label="Main navigation">
        {/* ... existing sidebar content unchanged ... */}
      </aside>

      <div key={currentPage} className="al-content">
        {children}
      </div>

      {rightPanel && (
        <aside className="al-right" aria-label="Contextual widgets">
          {rightPanel}
        </aside>
      )}
    </div>
  );
```

> Keep all the existing sidebar content exactly as-is — profile row, NAV_PRIMARY, NAV_SOCIAL, NAV_SHORTCUTS. Only change the outer div className and add the right panel slot.

- [ ] **Step 3: Verify 3-column layout at ≥1300px viewport**

Open app in a wide browser window (≥1300px). Navigate to Home. Right panel column should be empty for now (no `rightPanel` prop passed yet). At <1300px it should hide.

- [ ] **Step 4: Commit**

```bash
git add src/styles/app-layout.css src/components/AppLayout.tsx
git commit -m "feat: add 3-column right panel slot to AppLayout (visible ≥1300px)"
```

---

### Task 4: Create `TopBar.tsx`

**Files:**
- Create: `src/components/TopBar.tsx`
- Create: `src/styles/topbar.css`

The TopBar is 52px tall, always visible, `position: sticky; top: 0`. It replaces the horizontal nav links from PageNav. It keeps the same prop interface as PageNav so it's a drop-in swap.

- [ ] **Step 1: Create `src/styles/topbar.css`**

```css
/* ── TopBar — slim app shell header ── */
.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  height: 52px;
  background: var(--bg-elevated, #100c1e);
  border-bottom: 1px solid rgba(138, 75, 255, 0.12);
  display: grid;
  grid-template-columns: 220px 1fr auto;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}

/* Left: logo area — aligns with sidebar width */
.topbar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease-out);
}
.topbar-logo:hover { background: rgba(124, 58, 237, 0.08); }

.topbar-logo-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-xs);
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.topbar-wordmark {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #f0eaff);
  white-space: nowrap;
}

/* Center: search bar */
.topbar-search {
  display: flex;
  align-items: center;
  justify-content: center;
}
.topbar-search-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 360px;
  height: 36px;
  background: rgba(138, 75, 255, 0.08);
  border: 1px solid rgba(138, 75, 255, 0.15);
  border-radius: var(--radius-pill);
  padding: 0 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  color: rgba(240, 234, 255, 0.45);
  transition: background var(--dur-fast) var(--ease-out),
              border-color var(--dur-fast) var(--ease-out);
}
.topbar-search-btn:hover {
  background: rgba(138, 75, 255, 0.12);
  border-color: rgba(138, 75, 255, 0.25);
  color: rgba(240, 234, 255, 0.7);
}
.topbar-search-shortcut {
  margin-left: auto;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 1px 6px;
  color: rgba(240, 234, 255, 0.35);
  font-family: monospace;
}

/* Right: icon cluster */
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.topbar-btn {
  position: relative;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-primary, #f0eaff);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dur-fast) var(--ease-out);
}
.topbar-btn:hover { background: rgba(124, 58, 237, 0.12); }
.topbar-btn-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #e03c3c;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.topbar-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f2d85, #7c3aed);
  border: 2px solid rgba(138, 75, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: border-color var(--dur-fast) var(--ease-out);
}
.topbar-avatar:hover { border-color: rgba(138, 75, 255, 0.6); }
.topbar-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* ── Light theme ── */
[data-theme="light"] .topbar {
  background: #fff;
  border-color: rgba(124, 58, 237, 0.12);
}
[data-theme="light"] .topbar-wordmark { color: #1e1035; }
[data-theme="light"] .topbar-search-btn {
  background: rgba(124, 58, 237, 0.06);
  border-color: rgba(124, 58, 237, 0.15);
  color: rgba(30, 16, 53, 0.45);
}
[data-theme="light"] .topbar-search-btn:hover {
  background: rgba(124, 58, 237, 0.10);
  border-color: rgba(124, 58, 237, 0.25);
  color: rgba(30, 16, 53, 0.7);
}
[data-theme="light"] .topbar-btn { color: #1e1035; }
[data-theme="light"] .topbar-btn:hover { background: rgba(124, 58, 237, 0.08); }

/* ── Mobile: collapse search, stack icons ── */
@media (max-width: 1100px) {
  .topbar {
    grid-template-columns: 1fr auto auto;
    padding: 0 12px;
  }
  .topbar-search { justify-content: flex-start; }
  .topbar-search-btn { max-width: 200px; }
  .topbar-search-shortcut { display: none; }
}
@media (max-width: 640px) {
  .topbar-wordmark { display: none; }
  .topbar-search-btn { max-width: 160px; }
}
```

- [ ] **Step 2: Create `src/components/TopBar.tsx`**

```tsx
// @ts-nocheck
import { useState, useEffect } from "react";
import { useFullProfile } from "../hooks/useAdmin";
import { useUnreadMessageCount } from "../hooks/useMessages";
import "../styles/topbar.css";

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: { language?: string; changeLanguage: (lang: string) => void };
  user?: { id?: string; email?: string } | null;
  onLogout?: () => void;
  currentPage: string;
  onUpgrade?: () => void;
  onSearchClick?: () => void;
}

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const MessageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const LogoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

export default function TopBar({
  navigate, darkMode, setDarkMode, user, onLogout, currentPage, onUpgrade, onSearchClick
}: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: unreadMessages = 0 } = useUnreadMessageCount();

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "?";
  const initials = displayName[0].toUpperCase();

  function handleSearchClick() {
    if (onSearchClick) {
      onSearchClick();
    } else {
      navigate("search");
    }
  }

  return (
    <header className="topbar" role="banner">
      {/* Left: logo */}
      <button className="topbar-logo" onClick={() => navigate("home")} aria-label="Go to home">
        <span className="topbar-logo-icon"><LogoIcon /></span>
        <span className="topbar-wordmark">JW Study</span>
      </button>

      {/* Center: search */}
      <div className="topbar-search">
        <button
          className="topbar-search-btn"
          onClick={handleSearchClick}
          aria-label="Search or open command palette"
        >
          <SearchIcon />
          Search…
          <span className="topbar-search-shortcut">⌘K</span>
        </button>
      </div>

      {/* Right: actions */}
      <div className="topbar-actions">
        {/* Theme toggle */}
        {setDarkMode && (
          <button
            className="topbar-btn"
            onClick={() => setDarkMode(!darkMode)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        )}

        {/* Messages */}
        <button
          className="topbar-btn"
          onClick={() => navigate("messages")}
          aria-label={`Messages${unreadMessages > 0 ? ` (${unreadMessages} unread)` : ""}`}
        >
          <MessageIcon />
          {unreadMessages > 0 && (
            <span className="topbar-btn-badge" aria-hidden="true">
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
        </button>

        {/* Notifications bell — placeholder until NotificationDropdown is built in Plan C */}
        <button className="topbar-btn" aria-label="Notifications">
          <BellIcon />
        </button>

        {/* User avatar */}
        <button
          className="topbar-avatar"
          onClick={() => navigate("profile")}
          aria-label={`Go to profile: ${displayName}`}
        >
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={displayName} />
            : initials}
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar.tsx src/styles/topbar.css
git commit -m "feat: add TopBar component (slim app shell header replacing PageNav nav links)"
```

---

### Task 5: Swap `PageNav` → `TopBar` in `AuthedApp.tsx`

**Files:**
- Modify: `src/AuthedApp.tsx`

The `Page` wrapper in AuthedApp currently renders `<main>` with children inside. The TopBar needs to live outside the `<main>` but inside the `BibleApp` render. Currently PageNav is rendered inside each individual page view — we need to move it to the app shell level.

Look at how pages are currently rendered. The `<Page>` component wraps in `<main id="main-content">`. The TopBar should sit above `<main>`.

- [ ] **Step 1: Add TopBar import to `AuthedApp.tsx`**

Add at the top of the file, after existing imports:

```tsx
import TopBar from "./components/TopBar";
```

- [ ] **Step 2: In `AuthedApp.tsx`, update the `BibleApp` return JSX**

Find the return statement of `BibleApp` (currently around line 371):

```tsx
  return (
    <>
      <div key={nav.page} className="page-fade-in">
        {pageContent}
      </div>
      {nav.page !== "messages" && <MobileTabBar navigate={navigate} currentPage={nav.page} userId={user?.id} />}
```

Replace with:

```tsx
  return (
    <>
      <TopBar {...sharedNav} />
      <div key={nav.page} className="page-fade-in">
        {pageContent}
      </div>
      {nav.page !== "messages" && <MobileTabBar navigate={navigate} currentPage={nav.page} userId={user?.id} />}
```

> **Note:** `sharedNav` already contains `navigate, darkMode, setDarkMode, i18n, user, onLogout, currentPage, onUpgrade` — exactly what TopBar needs. The spread works directly.

- [ ] **Step 3: Verify TopBar renders on all authed pages**

Open the app, navigate to Home, Forum, Study Notes. Expected: TopBar (logo + search pill + icon cluster) appears at top, below it the AppLayout sidebar + content.

- [ ] **Step 4: Commit**

```bash
git add src/AuthedApp.tsx
git commit -m "feat: add TopBar to BibleApp shell — renders above all authed page content"
```

---

### Task 6: Strip nav links from `PageNav` for authed pages (or retire it)

**Files:**
- Modify: `src/styles/pagenav.css` (hide nav link section when inside authed app)
- Review individual page views that still render `<PageNav>`

The spec calls for stripping horizontal nav links from the top bar. PageNav currently renders full nav links. The cleanest approach is: pages that already wrap in AppLayout don't need PageNav at all. Pages that still use PageNav standalone should remain for now (the marketing/public pages still need it).

- [ ] **Step 1: Audit which page views still render `<PageNav>` directly**

Run: `grep -rn "PageNav" src/views/ --include="*.tsx"` to list them.

- [ ] **Step 2: For pages that have AppLayout: check if they render PageNav**

If any AppLayout page also renders PageNav, remove the `<PageNav ... />` from that page view — the TopBar in the shell replaces it.

- [ ] **Step 3: For pages WITHOUT AppLayout (marketing/auth pages)**

Leave PageNav as-is. These are About, Terms, Privacy, Landing (shell Type 5). They still need it.

- [ ] **Step 4: Verify no nav duplication**

After removing PageNav from AppLayout pages, open several pages. Expected: only TopBar at the top, sidebar on left — no second horizontal nav row.

- [ ] **Step 5: Commit**

```bash
git add src/views/
git commit -m "refactor: remove redundant PageNav from pages that use AppLayout (TopBar replaces it)"
```

---

### Task 7: Create `RightPanel.tsx` with always-on widgets

**Files:**
- Create: `src/components/RightPanel.tsx`
- Create: `src/styles/right-panel.css`

- [ ] **Step 1: Create `src/styles/right-panel.css`**

```css
/* ── Right Panel widgets ── */
.rp-widget {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(138, 75, 255, 0.15);
  border-radius: var(--radius);
  padding: 14px;
}
.rp-widget-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #f0eaff);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Daily verse */
.rp-verse {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, rgba(240,234,255,0.7));
  font-style: italic;
}
.rp-verse-ref {
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
  margin-top: 6px;
  font-style: normal;
}

/* Online friends */
.rp-friend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}
.rp-friend-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f2d85, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}
.rp-friend-avatar img { width: 100%; height: 100%; object-fit: cover; }
.rp-online-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  border: 1.5px solid var(--bg-elevated, #100c1e);
}
.rp-friend-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary, #f0eaff);
}

/* Streak */
.rp-streak-count {
  font-size: 28px;
  font-weight: 800;
  color: #f59e0b;
  line-height: 1;
}
.rp-streak-label {
  font-size: 11px;
  color: var(--text-secondary, rgba(240,234,255,0.5));
  margin-top: 2px;
}

/* Upgrade banner */
.rp-upgrade {
  background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(167,139,250,0.10));
  border-color: rgba(124, 58, 237, 0.3);
  text-align: center;
}
.rp-upgrade-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary, #f0eaff);
  margin-bottom: 6px;
}
.rp-upgrade-desc {
  font-size: 11px;
  color: var(--text-secondary, rgba(240,234,255,0.6));
  line-height: 1.5;
  margin-bottom: 10px;
}
.rp-upgrade-btn {
  display: block;
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.rp-upgrade-btn:hover { opacity: 0.9; }

/* Light theme */
[data-theme="light"] .rp-widget {
  background: #fff;
  border-color: rgba(124, 58, 237, 0.18);
}
[data-theme="light"] .rp-friend-name,
[data-theme="light"] .rp-widget-title { color: #1e1035; }
[data-theme="light"] .rp-verse { color: rgba(30,16,53,0.65); }
[data-theme="light"] .rp-online-dot { border-color: #fff; }
```

- [ ] **Step 2: Create `src/components/RightPanel.tsx`**

```tsx
// @ts-nocheck
import { useOnlineFriends } from "../hooks/useFriends";
import { useFullProfile } from "../hooks/useAdmin";
import { useSubscription } from "../hooks/useSubscription";
import "../styles/right-panel.css";

// Daily verse — static rotation by day-of-year
const DAILY_VERSES = [
  { text: "Happy are those conscious of their spiritual need.", ref: "Matthew 5:3" },
  { text: "Trust in Jehovah with all your heart.", ref: "Proverbs 3:5" },
  { text: "The meek will possess the earth.", ref: "Psalm 37:11" },
  { text: "Draw close to God and he will draw close to you.", ref: "James 4:8" },
  { text: "Let your light shine before men.", ref: "Matthew 5:16" },
  { text: "Love your neighbor as yourself.", ref: "Matthew 22:39" },
  { text: "Do not be anxious over anything.", ref: "Philippians 4:6" },
];
function getDailyVerse() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
}

interface Props {
  page: string;
  user: { id?: string; email?: string } | null | undefined;
  navigate: (page: string) => void;
  onUpgrade?: () => void;
}

export default function RightPanel({ page, user, navigate, onUpgrade }: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { isPremium } = useSubscription(user?.id);
  const { data: onlineFriends = [] } = useOnlineFriends(user?.id);
  const verse = getDailyVerse();
  const streak = profile?.current_streak ?? 0;

  return (
    <>
      {/* Daily Verse */}
      <div className="rp-widget">
        <div className="rp-widget-title">📖 Daily Verse</div>
        <div className="rp-verse">"{verse.text}"</div>
        <div className="rp-verse-ref">— {verse.ref}</div>
      </div>

      {/* Online Friends */}
      {onlineFriends.length > 0 && (
        <div className="rp-widget">
          <div className="rp-widget-title">🟢 Online Now</div>
          {onlineFriends.slice(0, 5).map((f) => (
            <div key={f.id} className="rp-friend-row">
              <div className="rp-friend-avatar">
                {f.avatar_url ? <img src={f.avatar_url} alt={f.display_name} /> : (f.display_name?.[0] ?? "?").toUpperCase()}
                <span className="rp-online-dot" />
              </div>
              <span className="rp-friend-name">{f.display_name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Streak */}
      {streak > 0 && (
        <div className="rp-widget">
          <div className="rp-widget-title">🔥 Your Streak</div>
          <div className="rp-streak-count">{streak}</div>
          <div className="rp-streak-label">day{streak !== 1 ? "s" : ""} in a row</div>
        </div>
      )}

      {/* Upgrade banner (free users only) */}
      {!isPremium && (
        <div className="rp-widget rp-upgrade">
          <div className="rp-upgrade-title">✨ Go Premium</div>
          <div className="rp-upgrade-desc">Unlock reading plans, study notes, messages and more.</div>
          <button className="rp-upgrade-btn" onClick={onUpgrade}>Upgrade — $3/mo</button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Check if `useOnlineFriends` hook exists**

Run: `grep -rn "useOnlineFriends" src/hooks/` to check.

If it does NOT exist, replace the `useOnlineFriends` call in `RightPanel.tsx` with:

```tsx
// No useOnlineFriends hook yet — use empty array for now
const onlineFriends = [];
```

And remove the import line for it.

- [ ] **Step 4: Commit**

```bash
git add src/components/RightPanel.tsx src/styles/right-panel.css
git commit -m "feat: add RightPanel component with daily verse, online friends, streak, upgrade widgets"
```

---

### Task 8: Wire `RightPanel` into Type 1 pages via `AppLayout`

**Files:**
- Modify: `src/AuthedApp.tsx`

Type 1 pages (Full Shell) get the RightPanel. Type 2/3 pages do not. See spec Section 3 for the page type map.

Type 1 pages: home, forum, blog, leaderboard, studyNotes, readingPlans, quiz, friends, profile, bookmarks, feed, meetingPrep, aiTools, familyQuiz, groups, studyTopics, publicProfile, friendRequests

Type 2: messages (no right panel)
Type 3: search, history, settings (no right panel)

- [ ] **Step 1: Import RightPanel and useSubscription into relevant page views**

Actually, the cleanest approach is to pass `rightPanel` at the `AppLayout` call site inside each page view. But since all pages receive `{...sharedNav}` with `onUpgrade`, we need `user` and `navigate` available — which they are in the page view's props.

The even cleaner approach: add a `type1Pages` set in `AuthedApp.tsx` and wrap each Type 1 page render to inject the RightPanel prop. Since AppLayout is rendered inside each page view (not in AuthedApp), we need to either:

**Option A:** Pass `rightPanel` as a shared prop via `sharedNav` and have each page view forward it to AppLayout.

**Option B:** Each page view that uses AppLayout creates its own `<RightPanel>` instance and passes it as the `rightPanel` prop.

Use **Option B** — it's more explicit and lets each page add per-page extra widgets later.

For now, add RightPanel to the most important Type 1 pages: Home, Forum, Blog, Leaderboard. The others can be added incrementally.

- [ ] **Step 2: Add RightPanel to `src/views/forum/ForumPage.tsx`**

In the ForumPage component, find where `<AppLayout>` is rendered. Add:

```tsx
import RightPanel from "../../components/RightPanel";
// ...inside the component:
<AppLayout navigate={navigate} user={user} currentPage="forum"
  rightPanel={<RightPanel page="forum" user={user} navigate={navigate} onUpgrade={onUpgrade} />}
>
  {/* existing forum content */}
</AppLayout>
```

- [ ] **Step 3: Add RightPanel to `src/views/LeaderboardPage.tsx`**

Same pattern as Step 2 but with `page="leaderboard"`.

- [ ] **Step 4: Verify 3-column layout renders at ≥1300px on Forum and Leaderboard**

Expected: sidebar (260px) + content + right panel (240px) at wide viewport. Right panel disappears at 1299px.

- [ ] **Step 5: Commit**

```bash
git add src/views/forum/ForumPage.tsx src/views/LeaderboardPage.tsx
git commit -m "feat: wire RightPanel into Forum and Leaderboard pages (3-column layout at ≥1300px)"
```

---

### Self-Review

**Spec coverage check:**
- Section 2.1 (TopBar): ✓ Task 4 + 5
- Section 2.3 (content area fade): ✓ Task 1 + 2
- Section 2.4 (right panel, 240px, ≥1300px): ✓ Task 3 + 7 + 8
- Section 3 (shell types): ✓ Task 6 strips nav from Type 1 pages
- Section 4.1 (content-only fade): ✓ Task 1 + 2
- Section 7 (right panel widgets): ✓ Task 7 (always-on set), Task 8 (per-page wiring)

**Not covered in this plan (out of scope for shell redesign):**
- Skeleton loaders (Section 4.2) — defer to later
- Per-page extra widgets in RightPanel (Section 7 detail) — RightPanel accepts `page` prop, can be extended per-page incrementally
