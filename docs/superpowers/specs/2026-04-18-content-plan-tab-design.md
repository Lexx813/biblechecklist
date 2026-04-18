# Content Plan Admin Tab — Design Spec

**Date:** 2026-04-18  
**Status:** Approved  

---

## Overview

An admin-only tab in the AdminPage that displays the 20-article JW Study editorial content plan as a polished, modern table. Each row shows live published status derived from `blog_posts` and provides a single action button to write, publish, or view the article.

---

## Data Layer

### `src/data/contentPlan.ts`

Exports a typed array of 20 `ContentPlanArticle` objects. This file is static — it never changes at runtime.

```ts
interface ContentPlanArticle {
  id: number;            // 1–20
  title: string;         // The question-format title
  slug: string;          // Expected blog_posts slug (e.g. "john-1-1-jesus-god")
  priority: "High" | "Medium";
  searchIntent: string;
  keywords: string[];    // 2–3 target keywords
  estWords: number;
  wolSources: string[];  // e.g. ["Reasoning book", "Insight (Word, Logos)"]
  internalLinks: number[]; // article IDs this post should link to
  tiktokHook: string;
}
```

All 20 articles from the spreadsheet are included verbatim.

### Status Derivation

The tab queries `blog_posts` (filtered to `author_id = current user` OR admin sees all) and builds a `Map<slug, { id: string; published: boolean }>`.

| Condition | Status |
|---|---|
| Slug not in map | `not_started` |
| Slug in map, `published = false` | `draft` |
| Slug in map, `published = true` | `published` |

No new Supabase table or migration required.

---

## Component Structure

### New file: `src/views/admin/tabs/ContentPlanTab.tsx`

Single component. Responsibilities:
- Fetches all `blog_posts` (uses existing `usePublishedPosts` + a new `useAllAdminPosts` hook that fetches all posts regardless of published state)
- Derives status map
- Renders the table
- Handles publish mutation and navigate actions

### Hook: `useAllAdminPosts`

New hook in `src/hooks/useBlog.ts`. Queries `blog_posts` with no `published` filter, returning `{ id, slug, published }` only. Admin-only — called only from `ContentPlanTab`.

### Publish action

Calls the existing `usePublishPost` mutation (or equivalent) with the post `id`. On success, the status pill updates optimistically to `published`.

---

## Table Design

Full-width table inside the admin panel. Columns:

| Column | Width | Notes |
|---|---|---|
| # | 40px | Article number |
| Title | ~35% | Full question title, bold |
| Priority | 80px | `High` = purple pill, `Medium` = teal pill |
| Keywords | ~20% | Comma-separated, muted text |
| Est. Words | 80px | Right-aligned number |
| Status | 100px | Colored pill (see below) |
| Action | 100px | Single context button |

**Status pills:**
- `Not Started` — gray background
- `Draft` — amber background  
- `Published` — green background

**Row expand:** Clicking anywhere on a row (except the action button) toggles an inline detail section below it showing: Search Intent, WOL Sources, Internal Links (as article #s), TikTok Hook. One row can be open at a time.

---

## Actions per Status

| Status | Button label | Behavior |
|---|---|---|
| Not Started | Write | `navigate("blogNew")` — WriterPage opens with `title` pre-filled via navigate params |
| Draft | Publish | Calls publish mutation with post `id`. Button shows spinner while pending. |
| Published | View | Opens `/blog/${slug}` in a new tab |

---

## Admin Tab Integration

### `src/views/admin/AdminPage.tsx`

Add "Content Plan" tab button (visible only when `isCurrentUserAdmin`) and the corresponding conditional render of `<ContentPlanTab />`. Follows the existing tab button + content pattern used by all other admin tabs.

Tab icon: a document/list SVG consistent with other tab icons.

---

## Progress Summary Bar

Above the table, a single summary row:

```
✓ 3 Published   ✎ 2 Drafts   ○ 15 Not Started   [====----] 25% complete
```

A thin progress bar showing `published / 20` as a percentage. Updates reactively with the status map.

---

## Spec Self-Review

- No placeholders or TODOs remain
- Status derivation is deterministic and uses only existing DB data
- No migration required
- Admin-only guard matches existing pattern (`isCurrentUserAdmin`)
- `useAllAdminPosts` is the only new hook — minimal surface area
- Row expand collapses when another row is opened (no conflicting open states)
- Publish action is idempotent — calling it twice on the same post is safe
