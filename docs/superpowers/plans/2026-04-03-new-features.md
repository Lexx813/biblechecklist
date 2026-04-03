# New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `CommandPalette` (⌘K overlay), the `NotificationDropdown` (bell icon dropdown), and the `useNotifications` data hook.

**Architecture:** `CommandPalette` and `NotificationDropdown` are modal overlays rendered at the app shell level (in `AuthedApp.tsx` `BibleApp` return). They communicate with the parent via callbacks. The notifications hook reads from Supabase — using existing tables, no schema changes.

**Tech Stack:** React 18, TypeScript (`@ts-nocheck`), CSS custom properties, Supabase React Query hooks, keyboard event listeners

---

### Task 1: Create `useNotifications` hook

**Files:**
- Create: `src/hooks/useNotifications.ts`

- [ ] **Step 1: Check what notification tables exist in Supabase**

Run: `grep -rn "notification" src/hooks/ --include="*.ts" -i` to see if any notification queries exist already.

Also check: `grep -rn "notifications" src/lib/supabase.ts` and look at existing hook patterns in `src/hooks/useFriends.ts` for reference on how hooks are structured.

- [ ] **Step 2: Create `src/hooks/useNotifications.ts`**

This hook reads from a `notifications` table (assumed to exist — it's referenced by the existing `NotificationBell` component already imported in `PageNav`). Pattern follows other hooks:

```typescript
// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  type: "message" | "friend_request" | "forum_reply" | "streak_milestone" | string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  actor_display_name?: string;
  actor_avatar_url?: string;
}

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

async function markOneRead(notifId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notifId);
  if (error) throw error;
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount(userId: string | undefined) {
  const { data = [] } = useNotifications(userId);
  return data.filter(n => !n.is_read).length;
}

export function useMarkAllNotificationsRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(userId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", userId] }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notifId: string) => markOneRead(notifId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
```

- [ ] **Step 3: Check if the `notifications` table columns match**

Look at the existing `NotificationBell` component: `grep -n "notifications" src/components/notifications/NotificationBell.tsx` to see what columns it queries. Adjust the `select("*")` fields in `fetchNotifications` if needed.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useNotifications.ts
git commit -m "feat: add useNotifications hook for reading and marking Supabase notifications"
```

---

### Task 2: Create `NotificationDropdown.tsx`

**Files:**
- Create: `src/components/NotificationDropdown.tsx`
- Create: `src/styles/notification-dropdown.css`

- [ ] **Step 1: Create `src/styles/notification-dropdown.css`**

```css
/* ── Notification Dropdown ── */
.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-modal) - 1);
}

.notif-dropdown {
  position: fixed;
  top: 56px;
  right: 12px;
  width: 360px;
  max-height: 480px;
  background: #120d22;
  border: 1px solid rgba(138, 75, 255, 0.25);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  z-index: var(--z-modal);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  animation: notif-enter 150ms cubic-bezier(0, 0, 0.2, 1) both;
}
@keyframes notif-enter {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .notif-dropdown { animation: none; }
}

.notif-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(138, 75, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.notif-title {
  font-size: 15px;
  font-weight: 700;
  color: #f0eaff;
}
.notif-mark-all {
  font-size: 11px;
  font-weight: 600;
  color: #a78bfa;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  transition: background var(--dur-fast) var(--ease-out);
}
.notif-mark-all:hover { background: rgba(124, 58, 237, 0.12); }

.notif-list {
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: rgba(138,75,255,0.2) transparent;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(138, 75, 255, 0.07);
  position: relative;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}
.notif-item:hover { background: rgba(124, 58, 237, 0.08); }
.notif-item.unread { background: rgba(124, 58, 237, 0.07); }
.notif-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #7c3aed;
  border-radius: 0 2px 2px 0;
}

.notif-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f2d85, #7c3aed);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;
}
.notif-avatar img { width: 100%; height: 100%; object-fit: cover; }

.notif-body { flex: 1; min-width: 0; }
.notif-text {
  font-size: 12px;
  color: rgba(240, 234, 255, 0.8);
  line-height: 1.4;
}
.notif-text strong { color: #f0eaff; }
.notif-time {
  font-size: 10px;
  color: rgba(240, 234, 255, 0.35);
  margin-top: 3px;
}
.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7c3aed;
  flex-shrink: 0;
  margin-top: 4px;
  align-self: center;
}

.notif-empty {
  padding: 32px 16px;
  text-align: center;
  color: rgba(240, 234, 255, 0.35);
  font-size: 13px;
}

.notif-footer {
  padding: 10px 16px;
  border-top: 1px solid rgba(138, 75, 255, 0.1);
  flex-shrink: 0;
  text-align: center;
}
.notif-see-all {
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-xs);
  transition: background var(--dur-fast) var(--ease-out);
}
.notif-see-all:hover { background: rgba(124, 58, 237, 0.10); }

/* ── Light theme ── */
[data-theme="light"] .notif-dropdown {
  background: #fff;
  border-color: rgba(124, 58, 237, 0.15);
}
[data-theme="light"] .notif-title { color: #1e1035; }
[data-theme="light"] .notif-text { color: rgba(30, 16, 53, 0.75); }
[data-theme="light"] .notif-text strong { color: #1e1035; }
[data-theme="light"] .notif-time { color: rgba(30, 16, 53, 0.4); }
[data-theme="light"] .notif-item.unread { background: rgba(124, 58, 237, 0.05); }
[data-theme="light"] .notif-item:hover { background: rgba(124, 58, 237, 0.06); }

/* ── Mobile ── */
@media (max-width: 480px) {
  .notif-dropdown {
    right: 8px;
    left: 8px;
    width: auto;
    top: 56px;
  }
}
```

- [ ] **Step 2: Create `src/components/NotificationDropdown.tsx`**

```tsx
// @ts-nocheck
import { useEffect, useRef } from "react";
import { useNotifications, useMarkAllNotificationsRead } from "../hooks/useNotifications";
import "../styles/notification-dropdown.css";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

interface Props {
  userId: string | undefined;
  onClose: () => void;
}

export default function NotificationDropdown({ userId, onClose }: Props) {
  const { data: notifications = [] } = useNotifications(userId);
  const markAll = useMarkAllNotificationsRead(userId);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Focus trap: focus the panel when it opens
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className="notif-overlay" onClick={onClose} aria-hidden="true" />

      <div
        className="notif-dropdown"
        role="dialog"
        aria-label="Notifications"
        aria-modal="true"
        ref={panelRef}
        tabIndex={-1}
      >
        <div className="notif-header">
          <span className="notif-title">Notifications</span>
          {unreadCount > 0 && (
            <button
              className="notif-mark-all"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item${!n.is_read ? " unread" : ""}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onClose()}
              >
                <div className="notif-avatar">
                  {n.actor_avatar_url
                    ? <img src={n.actor_avatar_url} alt={n.actor_display_name ?? ""} />
                    : (n.actor_display_name?.[0] ?? "🔔").toUpperCase()}
                </div>
                <div className="notif-body">
                  <div className="notif-text">
                    {n.actor_display_name && <strong>{n.actor_display_name} </strong>}
                    {n.body}
                  </div>
                  <div className="notif-time">{timeAgo(n.created_at)}</div>
                </div>
                {!n.is_read && <div className="notif-dot" aria-hidden="true" />}
              </div>
            ))
          )}
        </div>

        <div className="notif-footer">
          <button className="notif-see-all" onClick={onClose}>
            See all notifications →
          </button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/NotificationDropdown.tsx src/styles/notification-dropdown.css
git commit -m "feat: add NotificationDropdown component with unread indicators and mark-all-read"
```

---

### Task 3: Wire `NotificationDropdown` into `TopBar.tsx`

**Files:**
- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Add notification state and dropdown to `TopBar.tsx`**

Add import at top:
```tsx
import NotificationDropdown from "./NotificationDropdown";
import { useUnreadNotificationCount } from "../hooks/useNotifications";
```

Inside the component, add state:
```tsx
  const [showNotifs, setShowNotifs] = useState(false);
  const unreadNotifs = useUnreadNotificationCount(user?.id);
```

Replace the placeholder notifications button in the JSX:
```tsx
        {/* Notifications */}
        <button
          className="topbar-btn"
          onClick={() => setShowNotifs(v => !v)}
          aria-label={`Notifications${unreadNotifs > 0 ? ` (${unreadNotifs} unread)` : ""}`}
          aria-expanded={showNotifs}
        >
          <BellIcon />
          {unreadNotifs > 0 && (
            <span className="topbar-btn-badge" aria-hidden="true">
              {unreadNotifs > 99 ? "99+" : unreadNotifs}
            </span>
          )}
        </button>
```

Add the dropdown rendering after the `</header>` closing tag (TopBar renders as a fragment):
```tsx
  return (
    <>
      <header className="topbar" role="banner">
        {/* ... existing header content ... */}
      </header>
      {showNotifs && (
        <NotificationDropdown
          userId={user?.id}
          onClose={() => setShowNotifs(false)}
        />
      )}
    </>
  );
```

- [ ] **Step 2: Verify bell dropdown opens/closes**

In browser: click the bell icon. Expected: notification dropdown slides in from top-right. Click outside or press Escape to close. If no notifications exist, shows "No notifications yet".

- [ ] **Step 3: Commit**

```bash
git add src/components/TopBar.tsx
git commit -m "feat: wire NotificationDropdown into TopBar bell icon with unread badge"
```

---

### Task 4: Create `CommandPalette.tsx`

**Files:**
- Create: `src/components/CommandPalette.tsx`
- Create: `src/styles/command-palette.css`

- [ ] **Step 1: Create `src/styles/command-palette.css`**

```css
/* ── Command Palette ── */
.cmd-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: calc(var(--z-modal) + 10);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;

  animation: cmd-bg-enter 120ms var(--ease-out) both;
}
@keyframes cmd-bg-enter {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.cmd-palette {
  width: 100%;
  max-width: 560px;
  background: #120d22;
  border: 1px solid rgba(138, 75, 255, 0.3);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  overflow: hidden;

  animation: cmd-enter 150ms cubic-bezier(0, 0, 0.2, 1) both;
}
@keyframes cmd-enter {
  from { opacity: 0; transform: scale(0.96) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .cmd-backdrop, .cmd-palette { animation: none; }
}

.cmd-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(138, 75, 255, 0.12);
}
.cmd-search-icon { color: rgba(240, 234, 255, 0.4); flex-shrink: 0; }
.cmd-input {
  flex: 1;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  color: #f0eaff;
  outline: none;
}
.cmd-input::placeholder { color: rgba(240, 234, 255, 0.3); }
.cmd-kbd {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(240, 234, 255, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  flex-shrink: 0;
}

.cmd-section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(240, 234, 255, 0.3);
  padding: 8px 16px 4px;
}
.cmd-list { max-height: 360px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(138,75,255,0.2) transparent; }

.cmd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}
.cmd-item:hover,
.cmd-item[data-active="true"] { background: rgba(124, 58, 237, 0.15); }
.cmd-item-icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  color: #fff;
}
.cmd-item-label {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: rgba(240, 234, 255, 0.85);
}
.cmd-item-hint {
  font-size: 11px;
  color: rgba(240, 234, 255, 0.3);
}

.cmd-footer {
  padding: 8px 16px;
  border-top: 1px solid rgba(138, 75, 255, 0.1);
  display: flex;
  gap: 14px;
}
.cmd-hint {
  font-size: 10px;
  color: rgba(240, 234, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 4px;
}
.cmd-hint kbd {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: monospace;
}

/* ── Light theme ── */
[data-theme="light"] .cmd-palette {
  background: #fff;
  border-color: rgba(124, 58, 237, 0.2);
}
[data-theme="light"] .cmd-input { color: #1e1035; }
[data-theme="light"] .cmd-item-label { color: rgba(30, 16, 53, 0.85); }
[data-theme="light"] .cmd-item:hover,
[data-theme="light"] .cmd-item[data-active="true"] { background: rgba(124, 58, 237, 0.08); }
[data-theme="light"] .cmd-kbd { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.12); color: rgba(30,16,53,0.5); }

@media (max-width: 600px) {
  .cmd-backdrop { padding: 60px 8px 0; }
}
```

- [ ] **Step 2: Create `src/components/CommandPalette.tsx`**

```tsx
// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import "../styles/command-palette.css";

interface PaletteItem {
  key: string;
  label: string;
  hint: string;
  bg: string;
  icon: string;
  action: () => void;
}

const NAV_PAGES: Array<{ key: string; label: string; bg: string; icon: string }> = [
  { key: "home",         label: "Home",          bg: "#5b21b6", icon: "🏠" },
  { key: "forum",        label: "Forum",         bg: "#e05c2a", icon: "💬" },
  { key: "blog",         label: "Blog",          bg: "#c084fc", icon: "📚" },
  { key: "leaderboard",  label: "Leaderboard",   bg: "#f59e0b", icon: "📊" },
  { key: "studyNotes",   label: "Study Notes",   bg: "#2e9e6b", icon: "✏️" },
  { key: "readingPlans", label: "Reading Plans", bg: "#0ea5e9", icon: "📅" },
  { key: "quiz",         label: "Bible Quiz",    bg: "#374151", icon: "❓" },
  { key: "friends",      label: "Friends",       bg: "#1d7ea6", icon: "👥" },
  { key: "messages",     label: "Messages",      bg: "#7c3aed", icon: "✉️" },
  { key: "groups",       label: "Groups",        bg: "#5b21b6", icon: "👥" },
  { key: "meetingPrep",  label: "Meeting Prep",  bg: "#374151", icon: "📝" },
  { key: "familyQuiz",   label: "Family Quiz",   bg: "#7c3aed", icon: "👨‍👩‍👧" },
  { key: "aiTools",      label: "AI Tools",      bg: "#0ea5e9", icon: "🤖" },
  { key: "settings",     label: "Settings",      bg: "#374151", icon: "⚙️" },
  { key: "search",       label: "Search",        bg: "#374151", icon: "🔍" },
];

interface Props {
  navigate: (page: string) => void;
  onClose: () => void;
}

export default function CommandPalette({ navigate, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter pages by query
  const filtered: PaletteItem[] = NAV_PAGES
    .filter(p => query === "" || p.label.toLowerCase().includes(query.toLowerCase()))
    .map(p => ({
      ...p,
      hint: "↵ open",
      action: () => { navigate(p.key); onClose(); },
    }));

  // Reset active index when filter changes
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        filtered[activeIdx]?.action();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [filtered, activeIdx, onClose]);

  return (
    <div
      className="cmd-backdrop"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
    >
      <div className="cmd-palette" onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="cmd-input-row">
          <span className="cmd-search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Go to a page…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search pages"
          />
          <span className="cmd-kbd">ESC</span>
        </div>

        {/* Results */}
        <div className="cmd-list" role="listbox" aria-label="Pages">
          {filtered.length > 0 && (
            <div className="cmd-section-label">Pages</div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.key}
              className="cmd-item"
              data-active={i === activeIdx ? "true" : "false"}
              role="option"
              aria-selected={i === activeIdx}
              onClick={item.action}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span
                className="cmd-item-icon"
                style={{ background: item.bg }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span className="cmd-item-label">{item.label}</span>
              <span className="cmd-item-hint">{item.hint}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "24px 16px", textAlign: "center", color: "rgba(240,234,255,0.3)", fontSize: "13px" }}>
              No results for "{query}"
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="cmd-footer">
          <span className="cmd-hint"><kbd>↑↓</kbd> navigate</span>
          <span className="cmd-hint"><kbd>↵</kbd> open</span>
          <span className="cmd-hint"><kbd>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CommandPalette.tsx src/styles/command-palette.css
git commit -m "feat: add CommandPalette (⌘K) with page navigation and keyboard control"
```

---

### Task 5: Wire `CommandPalette` into the app shell

**Files:**
- Modify: `src/AuthedApp.tsx`
- Modify: `src/components/TopBar.tsx`

The CommandPalette needs to be:
1. Triggered by `⌘K` / `Ctrl+K` globally
2. Triggered by clicking the TopBar search bar
3. Rendered at the app shell level (outside any scroll container)

- [ ] **Step 1: Add CommandPalette import and state to `AuthedApp.tsx` `BibleApp` function**

Add import:
```tsx
import CommandPalette from "./components/CommandPalette";
```

Add state in `BibleApp` (near other modal state like `showUpgradeModal`):
```tsx
  const [showCmdPalette, setShowCmdPalette] = useState(false);
```

Add global keyboard listener in `BibleApp` (with other `useEffect` hooks):
```tsx
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdPalette(v => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
```

Add CommandPalette to the return JSX (after the UpgradeModal):
```tsx
      {showCmdPalette && (
        <CommandPalette
          navigate={navigate}
          onClose={() => setShowCmdPalette(false)}
        />
      )}
```

- [ ] **Step 2: Pass `onSearchClick` to TopBar in `AuthedApp.tsx`**

In the `BibleApp` return, update the TopBar line from:
```tsx
      <TopBar {...sharedNav} />
```
to:
```tsx
      <TopBar {...sharedNav} onSearchClick={() => setShowCmdPalette(true)} />
```

- [ ] **Step 3: Verify CommandPalette opens from both triggers**

In browser:
- Press ⌘K (Mac) or Ctrl+K (Windows/Linux). Expected: palette opens with page list.
- Click the search bar in the TopBar. Expected: palette opens.
- Type a page name — results filter in real-time.
- Arrow keys navigate. Enter navigates to page.
- Escape closes. Clicking outside closes.

- [ ] **Step 4: Commit**

```bash
git add src/AuthedApp.tsx src/components/TopBar.tsx
git commit -m "feat: wire CommandPalette into app shell via ⌘K shortcut and TopBar search click"
```

---

### Self-Review

**Spec coverage check:**
- Section 6.1 (Command Palette — trigger, content, keyboard nav, animation, data): ✓ Tasks 4 + 5
- Section 6.2 (Notification Dropdown — trigger, content, unread state, mark all read, animation, close behavior): ✓ Tasks 1 + 2 + 3
- `useNotifications` hook: ✓ Task 1

**Potential issue:** The `useNotifications` hook assumes a `notifications` table with specific columns. If the table schema differs from what's assumed, the `select("*")` call will still work but the field names in the UI (`.body`, `.actor_display_name`, `.actor_avatar_url`) may need to match actual column names. Check the existing `NotificationBell` component for the authoritative column names before running.

**Not covered in this plan (out of scope):**
- Real-time Supabase subscription for live notification updates (can be added later by subscribing to the notifications channel)
- "See all notifications" dedicated page (route doesn't exist yet)
- Recent study notes and reading plans in command palette (spec section 6.1 mentions these — they can be added to `CommandPalette` once `useStudyNotes` and `useMyPlans` hooks are confirmed available)
