# Admin Analytics Dashboard — Design Spec

**Date:** 2026-04-17
**Status:** Approved

---

## Goal

Add a new "Analytics" tab to the admin panel that gives a full-picture view of site health: user growth, daily activity, feature adoption, retention, and how far users have progressed through the Bible. Built with shadcn/ui charts (Recharts + Tailwind 4).

---

## Architecture

| File | Role |
|---|---|
| `src/views/admin/tabs/AnalyticsTab.tsx` | New tab component — all chart sections live here |
| `src/api/admin.ts` | Add `analyticsApi` object with all data-fetching functions |
| `src/hooks/useAdmin.ts` | Add `useAnalytics` hook (React Query wrapper) |
| `src/styles/admin.css` | Minor additions for heatmap grid and card glow classes |

No new files beyond these four touch-points. The existing admin tab pattern (`AdminPage.tsx` renders `{tab === "analytics" && <AnalyticsTab />}`) is followed exactly.

**Charting library:** `shadcn/ui` charts, installed via `npx shadcn@latest add chart`. This adds Recharts + thin wrapper components. No Tailwind v3 dependency issue since the project is on Tailwind 4.

---

## Section 1 — KPI Cards

Five summary numbers across the top of the tab, each in a card with a top-border gradient accent, hover lift, and delta label.

| Card | Value | Delta |
|---|---|---|
| Total Users | `COUNT(profiles)` | `+N this week` (signups in last 7 days) |
| Daily Active | distinct users in `reading_activity` today | `±N% vs same day last week` |
| 30-day Retention | % of users created 30–60 days ago with activity in last 30 days | `±N pts` |
| Chapters Today | `SUM(reading_log.chapters_read)` WHERE date = today | static label "site-wide" |
| Avg Streak | `AVG(current_streak)` across users with any streak | static label "active readers" |

---

## Section 2 — Growth & Activity Charts

### 2a — New Signups (Area chart, 30 days)

- Query: `profiles` grouped by `DATE(created_at)` for the last 30 days
- Rendered as a shadcn/ui `AreaChart` with purple gradient fill
- X-axis: dates (abbreviated). Y-axis: count. Tooltip on hover.

### 2b — Daily Active Users (Area chart, 30 days)

- Query: `reading_activity` grouped by `activity_date` for the last 30 days, COUNT DISTINCT `user_id`
- Rendered as a shadcn/ui `AreaChart` with teal gradient fill

### 2c — Feature Usage (Horizontal bar chart)

Which features users actually open, measured by distinct users with any record in each table over the last 30 days:

| Feature | Source table |
|---|---|
| Reading | `reading_activity` |
| Forum | `forum_threads` + `forum_replies` |
| Messages | `messages` |
| Quiz | `challenge_attempts` |
| Notes | `study_notes` |
| Groups | `study_group_members` |
| Videos | `video_likes` + `video_comments` |

Rendered as a shadcn/ui `BarChart` horizontal, sorted descending. Each bar shows the % of DAU (30-day active users).

### 2d — Retention Cohort (Vertical bar chart)

Simple cohort: of users who signed up N weeks ago, what % have any `reading_activity` in the last 7 days?

Cohorts: Week 1, Week 2, Week 4, Week 8, Week 12+.

Query: for each cohort window, COUNT users in that window, then COUNT how many also appear in `reading_activity` in the last 7 days. Divide.

Rendered as a shadcn/ui `BarChart` vertical with purple-to-dark gradient bars.

### 2e — Reading Plan Adoption (Horizontal bar list)

Shows how users split across reading engagement levels:

| Bucket | Definition |
|---|---|
| Has reading plan | COUNT users with any row in `user_reading_plans` |
| Active this month | COUNT users in `reading_activity` in last 30 days |
| Read today | COUNT users in `reading_activity` today |
| Completed a plan | COUNT users in `reading_plan_completions` |

Rendered as a simple styled list with gradient fill bars. Shows at a glance how deeply users are engaging with the core reading feature.

---

## Section 3 — Bible Progress

### 3a — Completion Histogram

Buckets: 0–10%, 10–25%, 25–50%, 50–75%, 75–99%, 100%.

Query: for each user, `COUNT(DISTINCT book_index || '-' || chapter)` from `chapter_reads` divided by 1,189 total chapters. Group into buckets. The 100% bucket gets a green accent color to celebrate completions.

Rendered as a shadcn/ui `BarChart` vertical.

### 3b — Book Heatmap (66 cells)

For each of the 66 Bible books (indexed 0–65 matching `book_index` in `chapter_reads`), compute: `COUNT(DISTINCT user_id) / total_users * 100`.

Rendered as a custom CSS grid (11 columns × 6 rows). Each cell is colored on a purple intensity scale from near-black (0%) to bright purple (100%). Hover shows book name + percentage via a Radix `Tooltip`.

The grid is NOT a Recharts component — pure CSS + Tailwind for the grid, shadcn `Tooltip` for hover. This matches the Messenger heatmap pattern already used in `ReadingHeatmap.tsx`.

---

## Section 4 — Data Fetching

All analytics queries live in `src/api/admin.ts` under an `analyticsApi` object:

```ts
export const analyticsApi = {
  getKpis(): Promise<AnalyticsKpis>,
  getSignupsSeries(days: number): Promise<{ date: string; count: number }[]>,
  getDauSeries(days: number): Promise<{ date: string; count: number }[]>,
  getFeatureUsage(): Promise<{ feature: string; pct: number }[]>,
  getRetentionCohorts(): Promise<{ label: string; pct: number }[]>,
  getReadingAdoption(): Promise<{ bucket: string; count: number }[]>,
  getCompletionHistogram(): Promise<{ bucket: string; count: number }[]>,
  getBookHeatmap(): Promise<{ bookIndex: number; pct: number }[]>,
}
```

All functions use `supabase` directly (no RPC needed — all are simple aggregation queries on existing tables that the admin role can read).

A single `useAnalytics()` hook in `useAdmin.ts` calls all eight endpoints in parallel via `Promise.all`, cached for 5 minutes (`staleTime: 5 * 60 * 1000`). The tab shows a skeleton loader while loading.

---

## Section 5 — Styling

- Cards: `background: linear-gradient(135deg, #1a0f35, #120b28)`, `border: 1px solid #2d1f4e`, `border-radius: 14px`
- Top accent strip on KPI cards: `background: linear-gradient(90deg, #7c3aed, #0d9488)`, height 2px
- Chart colors: purple `#7c3aed` for signups/histogram, teal `#0d9488` for DAU, gradient fills with opacity
- Hover lift on KPI cards: `translateY(-2px)` + purple box-shadow
- Heatmap gradient: `#0a0315` (0%) → `#3b0764` (25%) → `#7c3aed` (100%)
- "Live" dot on KPI section header: green pulse animation

All new CSS goes in `src/styles/admin.css` under an `/* ── Analytics tab ──` section.

---

## What's Not Changing

- No new database tables or migrations — all data comes from existing tables
- No background jobs or scheduled functions
- No per-user drilldown (aggregate view only)
- No date range picker in this pass (always last 30 days)
- No CSV export in this pass
- i18n: tab label and section headings get translation keys; raw numbers and percentages need no translation

---

## Acceptance Criteria

- [ ] "Analytics" tab appears in admin panel (admin-only)
- [ ] KPI row shows 5 cards with correct live values
- [ ] Signups and DAU area charts render with 30-day data and tooltips
- [ ] Feature usage chart shows 7 features sorted by adoption
- [ ] Retention cohort chart shows 5 cohort bars
- [ ] Reading adoption list shows plan/active/today/completed counts
- [ ] Completion histogram shows 6 buckets, 100% bar is green
- [ ] Book heatmap shows all 66 books, hover shows book name + %
- [ ] All data loads in parallel; skeleton shown while loading
- [ ] Dark mode looks correct (all cards use deep purple palette)
- [ ] Tab is not visible to moderators — admin only
