# Block User Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to block each other so that neither side sees the other's content, with block management visible in Settings.

**Architecture:** Client-side filtering using a shared `useBlocks(userId)` React Query hook that fetches a `user_blocks` Supabase table and builds a `Set<string>` of hidden user IDs. Every list component (forum threads, replies, blog posts, comments) filters against this set before render. Block actions appear next to the existing report flag in forum/blog and as a button on profile pages.

**Tech Stack:** React, Supabase (direct client queries), @tanstack/react-query, Vitest

---

## File Map

| File | Change |
|---|---|
| Supabase SQL editor | Create `user_blocks` table |
| `src/api/blocks.ts` | **New** — 4 API functions |
| `src/hooks/useBlocks.ts` | **New** — hooks + exported `buildBlockedSet` helper |
| `src/hooks/__tests__/useBlocks.test.ts` | **New** — unit tests for `buildBlockedSet` |
| `src/views/forum/ForumPage.tsx` | Filter threads/trending/replies; add block button next to report |
| `src/views/blog/BlogPage.tsx` | Filter posts/comments; add block button in PostComments and PostView author card |
| `src/views/profile/ProfilePage.tsx` | Block/Unblock button in `extraAction`; blocked banner |
| `src/views/profile/SettingsPage.tsx` | Blocked Users section above Danger zone |
| `src/styles/profile.css` | `.pf-blocked-banner` style |

---

## Task 1: Database migration

**Files:**
- Run in: Supabase project SQL editor

- [ ] **Step 1: Run the migration SQL**

Open the Supabase dashboard → SQL Editor → New query, paste and run:

```sql
create table if not exists user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);
```

- [ ] **Step 2: Verify**

In the Supabase Table Editor, confirm `user_blocks` exists with columns: `id`, `blocker_id`, `blocked_id`, `created_at`.

---

## Task 2: API layer

**Files:**
- Create: `src/api/blocks.ts`

- [ ] **Step 1: Create the file**

```typescript
import { supabase } from "../lib/supabase";

export const blocksApi = {
  blockUser: async (blockedId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user.id, blocked_id: blockedId });
    // 23505 = unique_violation — already blocked, treat as success
    if (error && error.code !== "23505") throw new Error(error.message);
  },

  unblockUser: async (blockedId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);
    if (error) throw new Error(error.message);
  },

  getBlocks: async (userId: string): Promise<{ blocker_id: string; blocked_id: string }[]> => {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocker_id, blocked_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getMyBlocks: async (userId: string): Promise<{ id: string; display_name: string | null; avatar_url: string | null }[]> => {
    const { data, error } = await supabase
      .from("user_blocks")
      .select("blocked_id, profiles:blocked_id(id, display_name, avatar_url)")
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => row.profiles as { id: string; display_name: string | null; avatar_url: string | null });
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/blocks.ts
git commit -m "feat(blocks): add blocks API layer"
```

---

## Task 3: Hook layer + tests

**Files:**
- Create: `src/hooks/useBlocks.ts`
- Create: `src/hooks/__tests__/useBlocks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useBlocks.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildBlockedSet } from "../useBlocks";

describe("buildBlockedSet", () => {
  it("adds blocked_id when current user is the blocker", () => {
    const rows = [{ blocker_id: "me", blocked_id: "them" }];
    const set = buildBlockedSet(rows, "me");
    expect(set.has("them")).toBe(true);
    expect(set.has("me")).toBe(false);
  });

  it("adds blocker_id when current user is the one blocked", () => {
    const rows = [{ blocker_id: "them", blocked_id: "me" }];
    const set = buildBlockedSet(rows, "me");
    expect(set.has("them")).toBe(true);
    expect(set.has("me")).toBe(false);
  });

  it("handles multiple rows in both directions", () => {
    const rows = [
      { blocker_id: "me", blocked_id: "a" },
      { blocker_id: "b", blocked_id: "me" },
    ];
    const set = buildBlockedSet(rows, "me");
    expect(set.size).toBe(2);
    expect(set.has("a")).toBe(true);
    expect(set.has("b")).toBe(true);
  });

  it("returns an empty set when rows is empty", () => {
    expect(buildBlockedSet([], "me").size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/hooks/__tests__/useBlocks.test.ts
```

Expected: FAIL — `buildBlockedSet` not found.

- [ ] **Step 3: Create `src/hooks/useBlocks.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { blocksApi } from "../api/blocks";

// Pure helper — exported for testing
export function buildBlockedSet(
  rows: { blocker_id: string; blocked_id: string }[],
  myId: string
): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    const other = row.blocker_id === myId ? row.blocked_id : row.blocker_id;
    set.add(other);
  }
  return set;
}

/** Returns a Set of user IDs that are blocked (in either direction). */
export function useBlocks(userId: string | undefined) {
  return useQuery({
    queryKey: ["blocks", userId],
    queryFn: () => blocksApi.getBlocks(userId!),
    enabled: !!userId,
    staleTime: 60_000,
    select: (rows) => buildBlockedSet(rows, userId!),
  });
}

/** Returns only the users that the current user has blocked (with profile info). */
export function useMyBlocks(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-blocks", userId],
    queryFn: () => blocksApi.getMyBlocks(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => blocksApi.blockUser(blockedId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["my-blocks"] });
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (blockedId: string) => blocksApi.unblockUser(blockedId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["my-blocks"] });
    },
  });
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/hooks/__tests__/useBlocks.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useBlocks.ts src/hooks/__tests__/useBlocks.test.ts
git commit -m "feat(blocks): add useBlocks hooks and tests"
```

---

## Task 4: Forum — filter blocked content in ThreadList and CategoryList

**Files:**
- Modify: `src/views/forum/ForumPage.tsx`

Both `ThreadList` (line ~681) and `CategoryList` (line ~926) need to import `useBlocks` and filter their lists.

- [ ] **Step 1: Add import to ForumPage.tsx**

At the top of `src/views/forum/ForumPage.tsx`, after the existing hook imports (near line 27), add:

```typescript
import { useBlocks } from "../../hooks/useBlocks";
```

- [ ] **Step 2: Filter threads in ThreadList**

In the `ThreadList` function (starts at line ~681), add `useBlocks` after the existing hook calls (after line ~689):

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
```

Then in the `useCallback` that computes `threads` (line ~724), add a block filter as the very first operation on `list`, before the search filter:

```typescript
const threads = useCallback(() => {
  let list = [...rawThreads].filter(th => !blockedSet.has(th.author_id)); // ← add this line
  // Search
  if (search.trim()) {
```

Also add `blockedSet` to the `useCallback` dependency array (line ~739):

```typescript
}, [rawThreads, search, sort, blockedSet])();
```

- [ ] **Step 3: Filter trending in CategoryList**

In the `CategoryList` function (starts at line ~926), add `useBlocks` after the existing hook calls (after `useTopThreads`):

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
```

Then replace the `trending.map(...)` call in the JSX (line ~947) with a filtered version. Before the `return` statement, add:

```typescript
const visibleTrending = trending.filter(th => !blockedSet.has(th.author_id));
```

And in the JSX change `{trending.length > 0 && (` to `{visibleTrending.length > 0 && (` and `{trending.map(thread => (` to `{visibleTrending.map(thread => (`.

- [ ] **Step 4: Verify dev server renders without errors**

```bash
npm run dev
```

Open the forum in browser. No console errors. Threads from blocked users (none yet — test after Task 5) disappear from lists.

- [ ] **Step 5: Commit**

```bash
git add src/views/forum/ForumPage.tsx
git commit -m "feat(blocks): filter blocked users from forum thread and trending lists"
```

---

## Task 5: Forum — block button in ThreadView

**Files:**
- Modify: `src/views/forum/ForumPage.tsx`

`ThreadView` (starts at line ~100) shows the thread post and all replies. Add a block/unblock toggle button next to the existing flag (report) button on the thread header and on each reply.

- [ ] **Step 1: Add IconBan SVG icon**

The file already defines icon functions using a shared `IC` spread (line ~40). Add `IconBan` after `IconFlag`:

```typescript
function IconBan() {
  return (
    <svg {...IC} width="13" height="13">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  );
}
```

- [ ] **Step 2: Add import for block hooks in ThreadView**

Add these imports at the top of `ForumPage.tsx` alongside the existing `useBlocks` import added in Task 4:

```typescript
import { useBlocks, useBlockUser, useUnblockUser } from "../../hooks/useBlocks";
```

(If you added `useBlocks` in Task 4 already, just add `useBlockUser, useUnblockUser` to that same import.)

- [ ] **Step 3: Add hook calls inside ThreadView**

In `ThreadView` (starts at line ~100), after the `submitReport` line (~line 146), add:

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
const blockUser = useBlockUser();
const unblockUser = useUnblockUser();
```

- [ ] **Step 4: Add block button on the thread header**

The thread header has a report button inside `thread.author_id !== user.id` guard (line ~377–401). After the `IconFlag` report button, add:

```tsx
<button
  className="forum-report-btn"
  onClick={() => {
    if (blockedSet.has(thread.author_id)) {
      unblockUser.mutate(thread.author_id);
    } else {
      setConfirm({
        message: `Block ${displayName(thread.profiles)}? Their posts will be hidden from you, and yours from them.`,
        onConfirm: () => blockUser.mutate(thread.author_id),
      });
    }
  }}
  title={blockedSet.has(thread.author_id) ? "Unblock user" : "Block user"}
  aria-label={blockedSet.has(thread.author_id) ? "Unblock user" : "Block user"}
>
  <IconBan />
</button>
```

- [ ] **Step 5: Add block button on each reply**

The reply section has a report button inside `reply.author_id !== user.id` guard (line ~530–554). After the `IconFlag` report button on replies, add the same pattern but using `reply.author_id` and `reply.profiles`:

```tsx
<button
  className="forum-report-btn"
  onClick={e => {
    e.stopPropagation();
    if (blockedSet.has(reply.author_id)) {
      unblockUser.mutate(reply.author_id);
    } else {
      setConfirm({
        message: `Block ${displayName(reply.profiles)}? Their posts will be hidden from you, and yours from them.`,
        onConfirm: () => blockUser.mutate(reply.author_id),
      });
    }
  }}
  title={blockedSet.has(reply.author_id) ? "Unblock user" : "Block user"}
  aria-label={blockedSet.has(reply.author_id) ? "Unblock user" : "Block user"}
>
  <IconBan />
</button>
```

- [ ] **Step 6: Verify**

In the dev server, open a forum thread. Next to the flag icon on the thread post and on each reply (that isn't yours), confirm the block button (circle-slash icon) appears. Clicking it on a thread shows a ConfirmModal. Confirm blocks the user and the page re-renders without their content.

- [ ] **Step 7: Commit**

```bash
git add src/views/forum/ForumPage.tsx
git commit -m "feat(blocks): add block/unblock button to forum thread and replies"
```

---

## Task 6: Blog — filter and block buttons

**Files:**
- Modify: `src/views/blog/BlogPage.tsx`

Three places: (1) filter the post list, (2) filter comments + add block button in `PostComments`, (3) add block button in `PostView` author card.

- [ ] **Step 1: Add import**

At the top of `src/views/blog/BlogPage.tsx`, after the existing hook imports, add:

```typescript
import { useBlocks, useBlockUser, useUnblockUser } from "../../hooks/useBlocks";
```

- [ ] **Step 2: Filter post list in BlogPage**

In the `BlogPage` function (line ~456), after the `usePublishedPosts` line, add:

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
```

Then replace the existing line:

```typescript
const visiblePosts = posts.slice(0, visibleCount);
```

with:

```typescript
const visiblePosts = posts.filter(p => !blockedSet.has(p.author_id)).slice(0, visibleCount);
```

- [ ] **Step 3: Filter comments + block button in PostComments**

In the `PostComments` function (line ~71), after `useSubmitReport`, add:

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
const blockUser = useBlockUser();
const unblockUser = useUnblockUser();
```

Then add a filter before rendering comments. Replace the `{comments.map(c => (` line in the JSX with:

```tsx
{comments.filter(c => !blockedSet.has(c.author_id)).map(c => (
```

After the existing flag report button on each comment (line ~134–142), add a block button:

```tsx
{c.author_id !== user?.id && (
  <button
    className="forum-report-btn"
    onClick={() => {
      if (blockedSet.has(c.author_id)) {
        unblockUser.mutate(c.author_id);
      } else {
        blockUser.mutate(c.author_id);
      }
    }}
    title={blockedSet.has(c.author_id) ? "Unblock user" : "Block user"}
    aria-label={blockedSet.has(c.author_id) ? "Unblock user" : "Block user"}
  >
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
  </button>
)}
```

- [ ] **Step 4: Add block button to PostView author card**

In the `PostView` function (line ~179), after `useGetOrCreateDM`, add:

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user?.id);
const blockUser = useBlockUser();
const unblockUser = useUnblockUser();
```

In the `blog-author-card` section (line ~289), after the Message button closing tag (line ~318), add:

```tsx
{user && post.author_id !== user.id && (
  <button
    className="blog-author-msg-btn"
    onClick={() => {
      if (blockedSet.has(post.author_id)) {
        unblockUser.mutate(post.author_id);
      } else {
        blockUser.mutate(post.author_id);
      }
    }}
    disabled={blockUser.isPending || unblockUser.isPending}
  >
    {blockedSet.has(post.author_id) ? "Unblock" : "Block"}
  </button>
)}
```

- [ ] **Step 5: Verify**

In dev server: blog post list no longer shows posts from blocked users. Open a blog post — the author card shows a Block/Unblock button. Comments from blocked users are hidden, and each unblocked comment shows a block icon button.

- [ ] **Step 6: Commit**

```bash
git add src/views/blog/BlogPage.tsx
git commit -m "feat(blocks): filter blocked users from blog posts/comments, add block buttons"
```

---

## Task 7: Profile page — block button + blocked banner

**Files:**
- Modify: `src/views/profile/ProfilePage.tsx`
- Modify: `src/styles/profile.css`

- [ ] **Step 1: Add import**

At the top of `src/views/profile/ProfilePage.tsx`, after existing hook imports, add:

```typescript
import { useBlocks, useMyBlocks, useBlockUser, useUnblockUser } from "../../hooks/useBlocks";
```

- [ ] **Step 2: Add hook calls in ProfilePage**

In the `ProfilePage` function (line ~753), after `useSubscription` and other hook calls (before line ~763), add:

```typescript
const { data: blockedSet = new Set<string>() } = useBlocks(user.id);
const { data: myBlocks = [] } = useMyBlocks(user.id);
const blockUser = useBlockUser();
const unblockUser = useUnblockUser();
```

- [ ] **Step 3: Add computed flag**

After the hook calls, add:

```typescript
const isViewedUserBlocked = !isOwner && blockedSet.has(profileId);
```

- [ ] **Step 4: Add block button in extraAction**

The `extraAction` prop is passed to `FollowSection` (line ~846). Add a Block/Unblock button after `MessageButton`:

```tsx
extraAction={!isOwner ? (
  <>
    <FriendRequestButton
      currentUserId={user.id}
      targetId={viewedUserId ?? user.id}
    />
    <MessageButton
      targetId={profileId}
      otherDisplayName={profile?.display_name || profile?.email?.split("@")[0] || "User"}
      otherAvatarUrl={profile?.avatar_url ?? null}
      navigate={navigate}
      isPremium={isPremium}
      onUpgrade={onUpgrade}
    />
    <button
      className="pf-msg-btn"
      onClick={() => {
        if (blockedSet.has(profileId)) {
          unblockUser.mutate(profileId);
        } else {
          blockUser.mutate(profileId);
        }
      }}
      disabled={blockUser.isPending || unblockUser.isPending}
    >
      {blockedSet.has(profileId) ? "Unblock" : "Block"}
    </button>
  </>
) : null}
```

- [ ] **Step 5: Add blocked banner**

After the `</div>` that closes `pf-card` (line ~870 — after the FollowSection and stats row), add:

```tsx
{isViewedUserBlocked && (
  <div className="pf-blocked-banner">
    {myBlocks.some(b => b.id === profileId)
      ? "You've blocked this user."
      : "This user has blocked you."}
  </div>
)}
```

- [ ] **Step 6: Hide profile content when blocked**

Find the line that renders the tab bar and overview content for non-owners (line ~888):

```tsx
{(!isOwner || activeTab === "overview") && (
```

Change it to:

```tsx
{(!isOwner || activeTab === "overview") && !isViewedUserBlocked && (
```

- [ ] **Step 7: Add CSS for the banner**

In `src/styles/profile.css`, add at the end of the file:

```css
.pf-blocked-banner {
  margin: 16px 20px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--hover-bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}
```

- [ ] **Step 8: Verify**

In dev server, navigate to another user's profile. Confirm "Block" button appears in the action area. Click it — button changes to "Unblock" and the profile content below disappears, replaced by the banner. Click "Unblock" — content reappears.

- [ ] **Step 9: Commit**

```bash
git add src/views/profile/ProfilePage.tsx src/styles/profile.css
git commit -m "feat(blocks): add block/unblock button and blocked banner to profile page"
```

---

## Task 8: Settings — Blocked Users section

**Files:**
- Modify: `src/views/profile/SettingsPage.tsx`

- [ ] **Step 1: Add import**

At the top of `src/views/profile/SettingsPage.tsx`, after existing imports, add:

```typescript
import { useMyBlocks, useUnblockUser } from "../../hooks/useBlocks";
```

- [ ] **Step 2: Add hook calls**

In the `SettingsPage` function, after the existing hook calls (after `useSubscription`, line ~84), add:

```typescript
const { data: blockedUsers = [] } = useMyBlocks(user.id);
const unblockUser = useUnblockUser();
```

- [ ] **Step 3: Add the Blocked Users section**

In the JSX, find the Danger zone section (line ~359):

```tsx
{/* ── Danger zone ──────────────────────────────────── */}
<section className="st-section st-section--danger">
```

Insert a new section **immediately before** it:

```tsx
{/* ── Blocked Users ───────────────────────────────── */}
<section className="st-section">
  <h2 className="st-section-title">Privacy — Blocked Users</h2>
  {blockedUsers.length === 0 ? (
    <p className="st-danger-desc">You haven't blocked anyone.</p>
  ) : (
    blockedUsers.map(u => (
      <div key={u.id} className="st-toggle-row">
        <div className="st-toggle-info">
          <span className="st-toggle-label">{u.display_name || "Unknown user"}</span>
        </div>
        <button
          className="st-btn st-btn--ghost"
          onClick={() => unblockUser.mutate(u.id)}
          disabled={unblockUser.isPending}
        >
          Unblock
        </button>
      </div>
    ))
  )}
</section>
```

- [ ] **Step 4: Verify**

In dev server, go to Settings. Confirm the "Privacy — Blocked Users" section appears above the Danger zone. It shows "You haven't blocked anyone." when empty. After blocking a user via forum/blog/profile, return to Settings and confirm their name appears with an Unblock button. Clicking Unblock removes the row.

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests still pass (31 tests) plus the 4 new `useBlocks` tests = 35 total.

- [ ] **Step 6: Commit**

```bash
git add src/views/profile/SettingsPage.tsx
git commit -m "feat(blocks): add Blocked Users section to Settings"
```
