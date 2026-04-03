# Who's Online Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Who's Online" right-sidebar widget showing all active community members, a `/community` members page, and a Settings toggle to appear offline.

**Architecture:** New `useOnlineMembers` hook queries `profiles` filtered by `show_online = true`, sorted by `last_active_at` desc. The widget lives in `HomePage.tsx`'s right sidebar; clicking "See all" navigates to a new standalone `CommunityPage`. A `show_online` boolean column controls visibility.

**Tech Stack:** React, TypeScript, Supabase (postgres), @tanstack/react-query, Vitest

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/add_show_online.sql` | Add `show_online` column |
| Modify | `src/api/profile.ts` | Add `show_online` to `Profile` type + select |
| Modify | `src/lib/router.ts` | Add `community` route |
| Modify | `src/lib/__tests__/router.test.ts` | Tests for community route |
| Create | `src/hooks/useOnlineMembers.ts` | Data hook + pure `splitByOnlineStatus` fn |
| Create | `src/hooks/__tests__/useOnlineMembers.test.ts` | Unit tests for split logic |
| Create | `src/views/community/CommunityPage.tsx` | Full members page |
| Create | `src/styles/community.css` | Styles for CommunityPage |
| Modify | `src/AuthedApp.tsx` | Lazy-import + route for CommunityPage |
| Modify | `src/views/HomePage.tsx` | Add Who's Online widget to right sidebar |
| Modify | `src/styles/home.css` | Add `.hwho-*` widget skeleton styles |
| Modify | `src/views/profile/SettingsPage.tsx` | Add "Show me as online" Privacy toggle |

---

### Task 1: DB Migration — add `show_online` column

**Files:**
- Create: `supabase/migrations/add_show_online.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/add_show_online.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_online boolean NOT NULL DEFAULT true;
```

- [ ] **Step 2: Apply the migration to your Supabase project**

Run in the Supabase dashboard SQL editor, or via CLI:
```bash
supabase db push
```
Expected: column `show_online` added to `profiles`, existing rows default to `true`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_show_online.sql
git commit -m "feat: add show_online column to profiles"
```

---

### Task 2: Profile API — add `show_online` field

**Files:**
- Modify: `src/api/profile.ts`

- [ ] **Step 1: Add `show_online` to the `Profile` interface**

In `src/api/profile.ts`, add one line to the `Profile` interface after `terms_accepted_at`:

```ts
  terms_accepted_at: string | null;
  show_online: boolean | null;
```

- [ ] **Step 2: Add `show_online` to the select string in `profileApi.get`**

Find the `.select(...)` call in `profileApi.get` and append `show_online` to the end of the column list:

```ts
.select("id, email, is_admin, is_moderator, can_blog, display_name, avatar_url, created_at, reading_goal_date, bio, subscription_status, email_notifications_blog, email_notifications_digest, email_notifications_streak, terms_accepted_at, show_online")
```

- [ ] **Step 3: Commit**

```bash
git add src/api/profile.ts
git commit -m "feat: add show_online to Profile type and select"
```

---

### Task 3: Router — add `community` route (TDD)

**Files:**
- Modify: `src/lib/router.ts`
- Modify: `src/lib/__tests__/router.test.ts`

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/__tests__/router.test.ts` inside the `buildPath` describe block:

```ts
  it("builds /community", () => {
    expect(buildPath("community")).toBe("/community");
  });
```

Add inside the `parsePath` describe block:

```ts
  it("parses /community", () => {
    setLocation("/community");
    expect(parsePath()).toEqual({ page: "community" });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```
Expected: 2 new failures — `buildPath("community")` returns `"/"` and `parsePath()` returns `{ page: "notFound" }`.

- [ ] **Step 3: Add `community` to `NavState`**

In `src/lib/router.ts`, add to the `NavState` union (after `friendRequests`):

```ts
  | { page: "community" }
```

- [ ] **Step 4: Add `community` to `parsePath`**

In `parsePath`, add before the final `return { page: "notFound" }`:

```ts
  if (h === "community") return { page: "community" };
```

- [ ] **Step 5: Add `community` to `buildPath`**

In `buildPath`, add inside the switch (after the `friendRequests` case):

```ts
    case "community":      return "/community";
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test
```
Expected: all tests pass including the 2 new ones.

- [ ] **Step 7: Commit**

```bash
git add src/lib/router.ts src/lib/__tests__/router.test.ts
git commit -m "feat: add community route to router"
```

---

### Task 4: `useOnlineMembers` hook (TDD)

**Files:**
- Create: `src/hooks/useOnlineMembers.ts`
- Create: `src/hooks/__tests__/useOnlineMembers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/__tests__/useOnlineMembers.test.ts`:

```ts
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { splitByOnlineStatus, ONLINE_THRESHOLD_MS } from "../useOnlineMembers";

const NOW = 1_700_000_000_000;

function makeTs(msAgo: number) {
  return new Date(NOW - msAgo).toISOString();
}

describe("splitByOnlineStatus", () => {
  it("puts users active within threshold into onlineNow", () => {
    const members = [
      { id: "1", display_name: "Alice", avatar_url: null, last_active_at: makeTs(5 * 60 * 1000) },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(1);
    expect(recentlyActive).toHaveLength(0);
  });

  it("puts users active past threshold into recentlyActive", () => {
    const members = [
      { id: "2", display_name: "Bob", avatar_url: null, last_active_at: makeTs(ONLINE_THRESHOLD_MS + 1) },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(1);
  });

  it("excludes members with null last_active_at from both lists", () => {
    const members = [
      { id: "3", display_name: "Carol", avatar_url: null, last_active_at: null },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(0);
  });

  it("handles empty input", () => {
    const { onlineNow, recentlyActive } = splitByOnlineStatus([], NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(0);
  });

  it("correctly splits a mixed list, preserving order", () => {
    const members = [
      { id: "1", display_name: "Online", avatar_url: null, last_active_at: makeTs(1 * 60 * 1000) },
      { id: "2", display_name: "Recent", avatar_url: null, last_active_at: makeTs(30 * 60 * 1000) },
      { id: "3", display_name: "Never", avatar_url: null, last_active_at: null },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow.map(m => m.id)).toEqual(["1"]);
    expect(recentlyActive.map(m => m.id)).toEqual(["2"]);
  });

  it("treats a user active exactly at threshold boundary as recently active", () => {
    const members = [
      { id: "4", display_name: "Edge", avatar_url: null, last_active_at: makeTs(ONLINE_THRESHOLD_MS) },
    ];
    const { onlineNow, recentlyActive } = splitByOnlineStatus(members, NOW);
    expect(onlineNow).toHaveLength(0);
    expect(recentlyActive).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```
Expected: 6 failures — module `../useOnlineMembers` not found.

- [ ] **Step 3: Create `src/hooks/useOnlineMembers.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export const ONLINE_THRESHOLD_MS = 10 * 60 * 1000;

export interface OnlineMember {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  last_active_at: string | null;
}

export function splitByOnlineStatus(
  members: OnlineMember[],
  now: number = Date.now()
): { onlineNow: OnlineMember[]; recentlyActive: OnlineMember[] } {
  const onlineNow = members.filter(
    m => m.last_active_at != null &&
      now - new Date(m.last_active_at).getTime() < ONLINE_THRESHOLD_MS
  );
  const onlineSet = new Set(onlineNow.map(m => m.id));
  const recentlyActive = members.filter(
    m => !onlineSet.has(m.id) && m.last_active_at != null
  );
  return { onlineNow, recentlyActive };
}

export function useOnlineMembers(limit = 50) {
  const { data = [], isLoading } = useQuery<OnlineMember[]>({
    queryKey: ["onlineMembers", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, last_active_at")
        .eq("show_online", true)
        .order("last_active_at", { ascending: false, nullsFirst: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as OnlineMember[];
    },
    staleTime: 60_000,
  });

  const { onlineNow, recentlyActive } = splitByOnlineStatus(data);
  return { onlineNow, recentlyActive, totalOnline: onlineNow.length, isLoading };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```
Expected: all tests pass including the 6 new ones.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useOnlineMembers.ts src/hooks/__tests__/useOnlineMembers.test.ts
git commit -m "feat: add useOnlineMembers hook with splitByOnlineStatus"
```

---

### Task 5: CommunityPage component + styles

**Files:**
- Create: `src/views/community/CommunityPage.tsx`
- Create: `src/styles/community.css`

- [ ] **Step 1: Create `src/styles/community.css`**

```css
.cm-wrap {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.cm-header {
  margin-bottom: 24px;
}

.cm-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 4px;
}

.cm-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.cm-section-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  padding: 12px 0 4px;
  border-top: 1px solid var(--color-border);
  margin-top: 8px;
}

.cm-section-label--online {
  color: #22c55e;
  border-top: none;
  margin-top: 0;
}

.cm-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 4px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
  min-height: 44px;
}

.cm-row:hover {
  background: var(--color-surface-hover);
}

.cm-av-wrap {
  position: relative;
  flex-shrink: 0;
}

.cm-av {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6A3DAA 0%, #C084FC 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  overflow: hidden;
}

.cm-av img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cm-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--color-surface);
}

.cm-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cm-when {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.cm-when--online {
  color: #22c55e;
}

.cm-empty {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  text-align: center;
  padding: 32px 0;
}

.cm-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}

.cm-skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
```

- [ ] **Step 2: Create `src/views/community/CommunityPage.tsx`**

```tsx
// @ts-nocheck
import { useMeta } from "../../hooks/useMeta";
import { useOnlineMembers, ONLINE_THRESHOLD_MS, OnlineMember } from "../../hooks/useOnlineMembers";
import "../../styles/community.css";

function timeAgo(lastActiveAt: string | null): string {
  if (!lastActiveAt) return "";
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff < ONLINE_THRESHOLD_MS) return "Active now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function MemberRow({ member, navigate }: { member: OnlineMember; navigate: Function }) {
  const isOnline = member.last_active_at != null &&
    Date.now() - new Date(member.last_active_at).getTime() < ONLINE_THRESHOLD_MS;
  const initials = (member.display_name || "?")[0].toUpperCase();

  return (
    <div
      className="cm-row"
      onClick={() => navigate("publicProfile", { userId: member.id })}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && navigate("publicProfile", { userId: member.id })}
    >
      <span className="cm-av-wrap">
        <span className="cm-av">
          {member.avatar_url
            ? <img src={member.avatar_url} alt={member.display_name ?? ""} loading="lazy" />
            : initials}
        </span>
        {isOnline && <span className="cm-dot" aria-label="Online" />}
      </span>
      <span className="cm-name">{member.display_name || "Anonymous"}</span>
      <span className={`cm-when${isOnline ? " cm-when--online" : ""}`}>
        {timeAgo(member.last_active_at)}
      </span>
    </div>
  );
}

export default function CommunityPage({ navigate }) {
  useMeta({ title: "Community Members", path: "/community" });
  const { onlineNow, recentlyActive, totalOnline, isLoading } = useOnlineMembers(100);
  const totalShown = onlineNow.length + recentlyActive.length;

  return (
    <div className="cm-wrap">
      <header className="cm-header">
        <h1 className="cm-title">Community Members</h1>
        {!isLoading && (
          <p className="cm-subtitle">
            {totalOnline} online now · {totalShown} members shown
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="cm-skeleton">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="cm-skeleton-row">
              <div className="skeleton" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 6 }}>&nbsp;</div>
                <div className="skeleton" style={{ height: 11, width: "25%", borderRadius: 6 }}>&nbsp;</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {onlineNow.length > 0 && (
            <section>
              <div className="cm-section-label cm-section-label--online">Online Now</div>
              {onlineNow.map(m => <MemberRow key={m.id} member={m} navigate={navigate} />)}
            </section>
          )}
          {recentlyActive.length > 0 && (
            <section>
              <div className="cm-section-label">Recently Active</div>
              {recentlyActive.map(m => <MemberRow key={m.id} member={m} navigate={navigate} />)}
            </section>
          )}
          {onlineNow.length === 0 && recentlyActive.length === 0 && (
            <p className="cm-empty">No members have been active recently.</p>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/community/CommunityPage.tsx src/styles/community.css
git commit -m "feat: add CommunityPage component and styles"
```

---

### Task 6: Wire CommunityPage into AuthedApp

**Files:**
- Modify: `src/AuthedApp.tsx`

- [ ] **Step 1: Add the lazy import**

In `src/AuthedApp.tsx`, find the block of lazy imports (around line 61) and add:

```ts
const CommunityPage = lazy(() => import("./views/community/CommunityPage"));
```

- [ ] **Step 2: Add the route handler**

In `src/AuthedApp.tsx`, find the route block (the chain of `else if` statements for `nav.page`). After the `friends` route handler (around line 386) and before the premium-gated pages block, add:

```ts
  else if (nav.page === "community")
    pageContent = <Page><AL page="community"><CommunityPage user={user} navigate={navigate} {...sharedNav} /></AL></Page>;
```

- [ ] **Step 3: Verify the page loads**

Start the dev server and navigate to `/community`. Expected: page renders with "Community Members" heading. No console errors.

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add src/AuthedApp.tsx
git commit -m "feat: wire CommunityPage route into AuthedApp"
```

---

### Task 7: Who's Online widget in HomePage

**Files:**
- Modify: `src/views/HomePage.tsx`
- Modify: `src/styles/home.css`

- [ ] **Step 1: Import `useOnlineMembers` in HomePage**

At the top of `src/views/HomePage.tsx`, after the existing hook imports (around line 27), add:

```ts
import { useOnlineMembers, ONLINE_THRESHOLD_MS as WHO_THRESHOLD_MS } from "../hooks/useOnlineMembers";
```

Note: import `ONLINE_THRESHOLD_MS` aliased as `WHO_THRESHOLD_MS` to avoid collision with the existing `ONLINE_THRESHOLD_MS` const defined at the top of the file (line 57). Alternatively, remove the local const and use the imported one — but aliasing is safer to avoid touching unrelated code.

- [ ] **Step 2: Call the hook in the component body**

In the `HomePage` component, after the existing data hooks (around line 173), add:

```ts
  const { onlineNow: whoOnline, recentlyActive: whoRecent, totalOnline, isLoading: whoLoading } = useOnlineMembers(50);
  const whoMembers = [...whoOnline, ...whoRecent];
```

- [ ] **Step 3: Add the widget to the right sidebar**

In `src/views/HomePage.tsx`, find the right sidebar section (around line 575). Add the widget block **after** the closing `</div>` of the Friends widget and **before** the Upsell block:

```tsx
          {/* Who's Online */}
          <div className="hwidget">
            <div className="hwidget-header">
              <span className="hwidget-title">Who's Online</span>
              <button className="hwidget-link" onClick={() => navigate("community")}>
                {totalOnline > 0 ? `See all (${totalOnline}) →` : "See all →"}
              </button>
            </div>
            {whoLoading ? (
              <div className="hwho-skeleton">
                {[0, 1, 2].map(i => (
                  <div key={i} className="hwho-skeleton-row">
                    <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                      <div className="skeleton" style={{ height: 12, width: "55%", borderRadius: 6 }}>&nbsp;</div>
                      <div className="skeleton" style={{ height: 10, width: "35%", borderRadius: 6 }}>&nbsp;</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : whoMembers.length === 0 ? (
              <div className="hfriend-empty">No one has been active recently.</div>
            ) : (
              <>
                {whoMembers.slice(0, 6).map(m => {
                  const isOnline = m.last_active_at != null &&
                    now - new Date(m.last_active_at).getTime() < WHO_THRESHOLD_MS;
                  const diff = m.last_active_at ? now - new Date(m.last_active_at).getTime() : null;
                  const when = isOnline ? "Active now"
                    : diff == null ? ""
                    : diff < 3_600_000 ? `${Math.floor(diff / 60_000)}m ago`
                    : diff < 86_400_000 ? `${Math.floor(diff / 3_600_000)}h ago`
                    : `${Math.floor(diff / 86_400_000)}d ago`;
                  return (
                    <div
                      key={m.id}
                      className="hfriend-row"
                      onClick={() => navigate("publicProfile", { userId: m.id })}
                    >
                      <span className="hfriend-av-wrap">
                        <span className="hfriend-av">
                          {m.avatar_url
                            ? <img src={m.avatar_url} alt={m.display_name ?? ""} loading="lazy" />
                            : (m.display_name || "?")[0].toUpperCase()}
                        </span>
                        {isOnline && <span className="hfriend-dot" aria-label="Online" />}
                      </span>
                      <span className="hfriend-name">{m.display_name || "Anonymous"}</span>
                      <span className="hfriend-when">{when}</span>
                    </div>
                  );
                })}
                <div style={{ height: 8 }} />
              </>
            )}
          </div>
```

- [ ] **Step 4: Add skeleton styles to `src/styles/home.css`**

Append to `src/styles/home.css`:

```css
/* ── Who's Online widget skeleton ─────────────────────────────────────── */
.hwho-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0 8px;
}

.hwho-skeleton-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
```

- [ ] **Step 5: Verify the widget renders**

In dev, open the homepage. The right sidebar should show "Who's Online" below "Friends". Clicking a user row navigates to their profile. Clicking "See all" navigates to `/community`.

- [ ] **Step 6: Commit**

```bash
git add src/views/HomePage.tsx src/styles/home.css
git commit -m "feat: add Who's Online widget to homepage right sidebar"
```

---

### Task 8: Settings — "Show me as online" Privacy toggle

**Files:**
- Modify: `src/views/profile/SettingsPage.tsx`

- [ ] **Step 1: Add the Privacy section**

In `src/views/profile/SettingsPage.tsx`, find the Notifications section closing tag (`</section>`) around line 276. Add a new Privacy section immediately after it:

```tsx
        {/* ── Privacy ──────────────────────────────────────── */}
        <section className="st-section">
          <h2 className="st-section-title">Privacy</h2>
          <div className="st-toggle-row">
            <div className="st-toggle-info">
              <span className="st-toggle-label">Show me as online</span>
              <span className="st-toggle-desc">When off, you won't appear in the Who's Online list.</span>
            </div>
            <button
              role="switch"
              aria-checked={profile?.show_online ?? true}
              className={`pf-toggle${(profile?.show_online ?? true) ? " pf-toggle--on" : ""}`}
              onClick={() => update.mutate({ show_online: !(profile?.show_online ?? true) })}
              disabled={update.isPending}
            >
              <span className="pf-toggle-thumb" />
            </button>
          </div>
        </section>
```

- [ ] **Step 2: Verify the toggle works**

In dev, open Settings. The Privacy section should appear below Notifications. Toggling "Show me as online" off should call `profileApi.update` with `{ show_online: false }` — verify in the Network tab that the Supabase PATCH request fires.

After toggling off, reload the homepage — the current user should no longer appear in the Who's Online widget.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/views/profile/SettingsPage.tsx
git commit -m "feat: add show online privacy toggle to Settings"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Who's Online widget in right sidebar → Task 7
- [x] Clicking avatar → navigate to publicProfile → Task 7 step 3
- [x] "See all" link → navigate to /community → Task 7 step 3
- [x] Community page: online now first, recently active → Task 5
- [x] Community page route /community → Tasks 3, 5, 6
- [x] show_online DB column → Task 1
- [x] show_online in Profile API → Task 2
- [x] useOnlineMembers filters show_online=true → Task 4 step 3 (Supabase `.eq("show_online", true)`)
- [x] Settings toggle "Show me as online" → Task 8
- [x] Friends widget untouched → widget is added separately, Friends widget code not modified

**Type consistency:**
- `OnlineMember` defined in Task 4, used in Tasks 5 and 7 ✓
- `ONLINE_THRESHOLD_MS` exported from hook, imported in Tasks 5 and 7 ✓
- `splitByOnlineStatus` exported from hook, tested in Task 4 ✓
- `useOnlineMembers(limit)` called with `50` in widget (Task 7) and `100` in CommunityPage (Task 5) ✓
- `whoOnline`, `whoRecent`, `totalOnline`, `whoLoading` destructured consistently in Task 7 ✓

**No placeholders:** All steps contain complete code. ✓
