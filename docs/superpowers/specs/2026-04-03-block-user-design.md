# Block User Feature — Design Spec

**Date:** 2026-04-03  
**Status:** Approved

## Overview

Users can block other users. Blocking is **mutual**: neither side sees the other's content. Blocked relationships are managed from Settings and can be initiated from forum posts, blog posts/comments, and profile pages.

---

## 1. Database

New table: `user_blocks`

```sql
create table user_blocks (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references profiles(id) on delete cascade,
  blocked_id  uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(blocker_id, blocked_id)
);
```

No RLS needed beyond what Supabase already applies — the client queries by `blocker_id` or `blocked_id` using the authenticated user's ID.

---

## 2. API layer — `src/api/blocks.ts`

| Function | Description |
|---|---|
| `blockUser(blockedId)` | Insert `(me, blockedId)` row |
| `unblockUser(blockedId)` | Delete row where `blocker_id = me AND blocked_id = blockedId` |
| `getBlocks()` | Fetch all rows where `blocker_id = me OR blocked_id = me`. Returns raw rows — caller builds the mutual `Set<string>` of hidden user IDs by unioning both columns, excluding self. |
| `getMyBlocks()` | Fetch rows where `blocker_id = me`, joined with `profiles(id, display_name, avatar_url)` on `blocked_id`. Used for the Settings list. |

---

## 3. Hook layer — `src/hooks/useBlocks.ts`

```
useBlocks()       → { blockedSet: Set<string>, isBlocked(userId): boolean }
useMyBlocks()     → blocked profile list for Settings display
useBlockUser()    → mutation, invalidates ["blocks"]
useUnblockUser()  → mutation, invalidates ["blocks"]
```

`useBlocks()` uses `staleTime: 60_000`. Since React Query caches by key, every component calling `useBlocks()` shares the same in-memory result — no context or prop drilling needed.

The `blockedSet` is built by collecting: for each row, add the ID that is **not** the current user. This gives the full mutual set.

---

## 4. Content filtering

Each list component calls `const { isBlocked } = useBlocks()` and filters before render:

| Location | Filter target |
|---|---|
| Forum thread list | `thread.user_id` |
| Forum trending list | `thread.user_id` |
| Forum replies | `reply.user_id` |
| Blog post list | `post.profiles?.id` |
| Blog comments | `comment.user_id` |

Filter expression: `items.filter(x => !isBlocked(x.user_id))` — one line per list.

**Profile page:** if `isBlocked(viewedUserId)` is true (in either direction), render a simple banner — "You've blocked this user" or "This user has blocked you" — instead of their profile content. The `blockedSet` covers both directions so the same check handles both cases; to distinguish direction, check separately if `me → them` vs `them → me`.

---

## 5. Block action surfaces

### Forum & Blog

Next to the existing flag (report) icon on each post/thread/reply/comment row, add a **block icon button**. Hidden if the content author is the current user.

- Tapping opens a `ConfirmModal`: *"Block [name]? Their posts will be hidden from you, and yours from them."*
- On confirm: calls `useBlockUser()`, which invalidates `["blocks"]` and triggers re-filtering
- If the user is already blocked, the button shows as "Unblock" (no confirm needed)

### Profile page

In the `extraAction` slot (alongside `FriendRequestButton` and `MessageButton`), add a **Block / Unblock button**. No confirm modal — the user is already looking at the profile.

- Blocked state: button reads "Unblock", calls `useUnblockUser()`
- Unblocked state: button reads "Block", calls `useBlockUser()`

---

## 6. Settings page — Blocked Users section

New section in `SettingsPage.tsx` inserted **above** the Danger zone section.

```
Privacy
────────────────────────────
Blocked Users

[empty state]  "You haven't blocked anyone."

[blocked user row]
  Avatar initial | Display name        [Unblock]
  Avatar initial | Display name        [Unblock]
```

- Uses existing CSS: `st-section`, `st-section-title`, `st-toggle-row`, `st-toggle-label`, `st-btn st-btn--ghost`
- Data from `useMyBlocks()` — only shows users *you* blocked (not mutual blocks initiated by others)
- "Unblock" calls `useUnblockUser()`, removes row instantly via React Query invalidation

---

## 7. Files changed

| File | Change |
|---|---|
| `src/api/blocks.ts` | **New** — API functions |
| `src/hooks/useBlocks.ts` | **New** — React Query hooks |
| `src/views/forum/ForumPage.tsx` | Add `isBlocked` filter to thread list, trending, replies; add block button next to flag icon |
| `src/views/blog/BlogPage.tsx` | Add `isBlocked` filter to post list, comments; add block button next to flag icon |
| `src/views/profile/ProfilePage.tsx` | Add Block/Unblock button in `extraAction`; add blocked banner for blocked profiles |
| `src/views/profile/SettingsPage.tsx` | Add Blocked Users section |
| Supabase migration | Create `user_blocks` table |

---

## 8. Out of scope

- Notifications to the blocked user (no "you've been blocked" message)
- Admin visibility into block relationships
- Blocking from the followers/following modal lists
