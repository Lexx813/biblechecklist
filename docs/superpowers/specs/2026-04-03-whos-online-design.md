# Who's Online — Design Spec

**Date:** 2026-04-03

## Overview

Add a "Who's Online" widget to the right sidebar of the homepage, and a new `/community` members page. Users can click any member's avatar/row to visit their public profile.

---

## Decisions Made

| Question | Answer |
|---|---|
| Who appears in the widget? | All community members (not friends-only) |
| Full page sort order | Online now first, then recently active (by `last_active_at` desc) |
| Friends widget | Keep as-is — new widget is added below it |
| Full page presentation | New standalone `/community` route (same pattern as Leaderboard) |
| Appear offline toggle | Settings page — users can hide themselves from online visibility |

---

## 1. Who's Online Widget

**Location:** Right sidebar in `HomePage.tsx`, below the existing Friends widget, above the upsell banner.

**Data source:** New hook `useOnlineMembers()` — queries `profiles` table for all users, selects `id`, `display_name`, `avatar_url`, `last_active_at`. Sorted by `last_active_at` desc. Shows up to 6 rows.

**Online threshold:** 10 minutes (`ONLINE_THRESHOLD_MS = 10 * 60 * 1000`) — same constant already used in `HomePage.tsx`.

**Widget layout:**
- Header row: "Who's Online" title (left) + "See all (N) →" link (right)
- Up to 6 user rows, each: avatar (32px circle, initials fallback) + display name + timestamp
  - Online now: green dot on avatar, "Active now" in green
  - Recently active: no dot, "Xm ago" / "Xh ago" in muted color
- Clicking any row → `navigate("publicProfile", { userId: f.id })`
- "See all" link → `navigate("community")`
- Empty state: "No one has been active recently." (plain text, no action needed)

---

## 2. Community Members Page (`/community`)

**Route:** `community` page — new entry in `router.ts`, `AuthedApp.tsx`, and `buildPath`.

**URL:** `/community`

**Wrapped in:** `AppLayout` (same as Leaderboard, Forum, etc.)

**Page layout:**
- Page header: "Community Members" + subtitle showing "N online now · M members total"
- Section label "Online Now" (green) → rows of currently online members
- Section label "Recently Active" (muted) → rows of everyone else with `last_active_at` set, sorted desc
- Members with no `last_active_at` (never logged in after the field was added) shown at the bottom or omitted
- Each row: 36px avatar + display name + timestamp + "View →" link
- Clicking any row → `navigate("publicProfile", { userId })`
- Pagination or "load more" if member count is large (start with a limit of 50, add load-more button if needed)

---

## 3. Data — `useOnlineMembers` Hook

New hook in `src/hooks/useOnlineMembers.ts`:

```ts
// useOnlineMembers(limit?: number)
// Fetches profiles sorted by last_active_at desc up to `limit` rows (default 50)
// Returns { onlineNow: Profile[], recentlyActive: Profile[], totalOnline: number }
// Widget passes limit=50 and slices to 6 client-side; CommunityPage uses default or load-more
```

Supabase query:
```sql
SELECT id, display_name, avatar_url, last_active_at
FROM profiles
WHERE show_online = true
ORDER BY last_active_at DESC NULLS LAST
LIMIT 50
```

Users with `show_online = false` are excluded from both the widget and the community page.

For the widget: filter client-side into online (< 10 min) and recently active.
For the community page: same hook with a higher limit or pagination.

React Query key: `["onlineMembers"]`, stale time: 60 seconds (refresh roughly every minute).

---

## 4. Router Changes

**`src/lib/router.ts`:**
- Add `{ page: "community" }` to `NavState`
- Add `if (h === "community") return { page: "community" }` to `parsePath`
- Add `case "community": return "/community"` to `buildPath`

**`src/AuthedApp.tsx`:**
- Lazy-import `CommunityPage`
- Add route handler: `else if (nav.page === "community") pageContent = <Page><AL page="community"><CommunityPage user={user} navigate={navigate} {...sharedNav} /></AL></Page>`

---

## 5. New Files

| File | Purpose |
|---|---|
| `src/hooks/useOnlineMembers.ts` | Data hook — queries profiles by last_active_at, filters show_online=true |
| `src/views/community/CommunityPage.tsx` | Full members page |
| `src/styles/community.css` | Page + widget styles (widget styles may live in `home.css` instead) |

---

## 6. Existing Files Modified

| File | Change |
|---|---|
| `src/views/HomePage.tsx` | Add Who's Online widget block in right sidebar; import `useOnlineMembers` |
| `src/lib/router.ts` | Add `community` to `NavState`, `parsePath`, `buildPath` |
| `src/AuthedApp.tsx` | Lazy-import + route for `CommunityPage` |
| `src/styles/home.css` | Add `.hwho-*` widget styles |
| `src/api/profile.ts` | Add `show_online` to `Profile` interface and select string |
| `src/views/profile/SettingsPage.tsx` | Add "Show me as online" privacy toggle |

---

## 7. Appear Offline — Database & Settings

**Database:** Add `show_online boolean NOT NULL DEFAULT true` column to the `profiles` table via a Supabase migration.

**Profile type:** Add `show_online: boolean | null` to the `Profile` interface in `src/api/profile.ts` and include it in the `profileApi.get` select string.

**Settings page (`src/views/profile/SettingsPage.tsx`):**
- Add a "Privacy" section (or append to existing privacy/notification settings)
- Toggle: **"Show me as online"** — when off, you appear offline to everyone
- Calls `profileApi.update(userId, { show_online: false/true })`
- Label copy: "Show me as online" / sub: "When off, you won't appear in the Who's Online list."

**Effect:** `useOnlineMembers` filters `WHERE show_online = true`. The current user's own `last_active_at` is still updated normally — they just won't appear to others.

---

## Out of Scope

- Real-time presence (Supabase Realtime / WebSockets) — polling via React Query is sufficient for v1
- Filtering/searching the community page
- Following/unfollowing from the community page
- Showing member count in nav or mobile tab bar
