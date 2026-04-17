# Admin Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-featured "Analytics" tab to the admin panel showing KPI cards, growth charts, feature adoption, retention cohorts, and Bible progress visualizations.

**Architecture:** Four touch-points — new `AnalyticsTab.tsx` tab component, `analyticsApi` object appended to `src/api/admin.ts`, `useAnalytics` hook appended to `src/hooks/useAdmin.ts`, and new CSS section in `src/styles/admin.css`. Tab wired into existing `AdminPage.tsx` with the same admin-only guard pattern used by every other tab.

**Tech Stack:** React, Recharts (install), Supabase JS client, React Query, Tailwind (existing), i18next

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/api/admin.ts` | Add `AnalyticsKpis` type + `analyticsApi` object (8 methods) |
| Modify | `src/hooks/useAdmin.ts` | Add `useAnalytics()` hook — parallel fetch, 5 min cache |
| Create | `src/views/admin/tabs/AnalyticsTab.tsx` | All chart sections, skeleton loader |
| Modify | `src/styles/admin.css` | Analytics-specific CSS (KPI cards, heatmap grid, live dot) |
| Modify | `src/views/admin/AdminPage.tsx` | Tab button + conditional render |
| Modify | `src/locales/en/translation.json` | `adminTabs.analytics` + section heading keys |
| Modify | `public/locales/*/translation.json` | Same keys (es, fr, pt, ja, ko, tl, zh) |

---

## Task 1: Install Recharts

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install recharts**

```bash
cd /home/alexi/projects/nwt-progress
npm install recharts
```

Expected output: `added N packages` with recharts in node_modules.

- [ ] **Step 2: Verify TypeScript types are available**

```bash
cat node_modules/recharts/types/index.d.ts | head -5
```

Expected: TypeScript declarations (recharts ships its own types — no @types/recharts needed).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install recharts for admin analytics charts"
```

---

## Task 2: Add `analyticsApi` to `src/api/admin.ts`

**Files:**
- Modify: `src/api/admin.ts`

Append the following after the last method in `adminApi` (before the closing `};`), then add the `analyticsApi` export and the `AnalyticsKpis` type at the end of the file.

- [ ] **Step 1: Add `AnalyticsKpis` type and `analyticsApi` to the end of `src/api/admin.ts`**

Append to the end of `src/api/admin.ts`:

```ts
// ── Analytics ─────────────────────────────────────────────────────────────

export interface AnalyticsKpis {
  totalUsers: number;
  newUsersThisWeek: number;
  dailyActiveToday: number;
  dauChangePct: number;         // % change vs same day last week (can be negative)
  retentionPct30d: number;      // % of users 30–60 days old with activity in last 30d
  retentionPtsDelta: number;    // delta vs previous cohort (informational)
  chaptersToday: number;
  avgStreak: number;
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export const analyticsApi = {
  async getKpis(): Promise<AnalyticsKpis> {
    const now = new Date();
    const todayStr = toDateStr(now);
    const sevenDaysAgo = toDateStr(new Date(now.getTime() - 7 * 86400000));
    const thirtyDaysAgo = toDateStr(new Date(now.getTime() - 30 * 86400000));
    const sixtyDaysAgo = toDateStr(new Date(now.getTime() - 60 * 86400000));
    const lastWeekSameDay = toDateStr(new Date(now.getTime() - 7 * 86400000));

    const [
      { count: totalUsers },
      { count: newUsersThisWeek },
      dauToday,
      dauLastWeek,
      cohort30to60,
      cohortActive30d,
      chaptersToday,
      streakData,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo + "T00:00:00"),
      supabase.from("reading_activity").select("user_id").eq("activity_date", todayStr),
      supabase.from("reading_activity").select("user_id").eq("activity_date", lastWeekSameDay),
      supabase.from("profiles").select("id").gte("created_at", sixtyDaysAgo + "T00:00:00").lt("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("reading_activity").select("user_id").gte("activity_date", thirtyDaysAgo),
      supabase.from("chapter_reads").select("id", { count: "exact", head: true }).gte("created_at", todayStr + "T00:00:00"),
      supabase.from("profiles").select("current_streak").gt("current_streak", 0),
    ]);

    const dauTodayCount = new Set((dauToday.data ?? []).map(r => r.user_id)).size;
    const dauLastWeekCount = new Set((dauLastWeek.data ?? []).map(r => r.user_id)).size;
    const dauChangePct = dauLastWeekCount > 0
      ? Math.round(((dauTodayCount - dauLastWeekCount) / dauLastWeekCount) * 100)
      : 0;

    const cohort30to60Ids = new Set((cohort30to60.data ?? []).map(r => r.id));
    const activeInLast30Ids = new Set((cohortActive30d.data ?? []).map(r => r.user_id));
    const retentionPct30d = cohort30to60Ids.size > 0
      ? Math.round(([...cohort30to60Ids].filter(id => activeInLast30Ids.has(id)).length / cohort30to60Ids.size) * 100)
      : 0;

    const streaks = (streakData.data ?? []).map(r => r.current_streak as number);
    const avgStreak = streaks.length > 0
      ? Math.round(streaks.reduce((a, b) => a + b, 0) / streaks.length)
      : 0;

    return {
      totalUsers: totalUsers ?? 0,
      newUsersThisWeek: newUsersThisWeek ?? 0,
      dailyActiveToday: dauTodayCount,
      dauChangePct,
      retentionPct30d,
      retentionPtsDelta: 0,
      chaptersToday: chaptersToday.count ?? 0,
      avgStreak,
    };
  },

  async getSignupsSeries(days: number): Promise<{ date: string; count: number }[]> {
    const start = toDateStr(new Date(Date.now() - days * 86400000));
    const { data } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", start + "T00:00:00");

    const counts: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = toDateStr(new Date(Date.now() - (days - 1 - i) * 86400000));
      counts[d] = 0;
    }
    for (const row of data ?? []) {
      const d = row.created_at.split("T")[0];
      if (d in counts) counts[d]++;
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  },

  async getDauSeries(days: number): Promise<{ date: string; count: number }[]> {
    const start = toDateStr(new Date(Date.now() - days * 86400000));
    const { data } = await supabase
      .from("reading_activity")
      .select("activity_date, user_id")
      .gte("activity_date", start);

    const counts: Record<string, Set<string>> = {};
    for (let i = 0; i < days; i++) {
      const d = toDateStr(new Date(Date.now() - (days - 1 - i) * 86400000));
      counts[d] = new Set();
    }
    for (const row of data ?? []) {
      if (row.activity_date in counts) counts[row.activity_date].add(row.user_id);
    }
    return Object.entries(counts).map(([date, set]) => ({ date, count: set.size }));
  },

  async getFeatureUsage(): Promise<{ feature: string; pct: number }[]> {
    const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 86400000));

    const [
      { count: totalUsers },
      reading,
      forumThreads,
      forumReplies,
      msgs,
      quiz,
      notes,
      groups,
      videoLikes,
      videoComments,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("reading_activity").select("user_id").gte("activity_date", thirtyDaysAgo),
      supabase.from("forum_threads").select("author_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("forum_replies").select("author_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("messages").select("sender_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("challenge_attempts").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("study_notes").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("study_group_members").select("user_id"),
      supabase.from("video_likes").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
      supabase.from("video_comments").select("user_id").gte("created_at", thirtyDaysAgo + "T00:00:00"),
    ]);

    const total = totalUsers ?? 1;
    const uniq = (rows: { user_id?: string; author_id?: string; sender_id?: string }[]) =>
      new Set(rows.map(r => r.user_id ?? r.author_id ?? r.sender_id)).size;

    const forumUsers = new Set([
      ...(forumThreads.data ?? []).map(r => r.author_id),
      ...(forumReplies.data ?? []).map(r => r.author_id),
    ]).size;
    const videoUsers = new Set([
      ...(videoLikes.data ?? []).map(r => r.user_id),
      ...(videoComments.data ?? []).map(r => r.user_id),
    ]).size;

    const features = [
      { feature: "Reading", count: uniq(reading.data ?? []) },
      { feature: "Forum", count: forumUsers },
      { feature: "Messages", count: uniq(msgs.data ?? []) },
      { feature: "Quiz", count: uniq(quiz.data ?? []) },
      { feature: "Notes", count: uniq(notes.data ?? []) },
      { feature: "Groups", count: uniq(groups.data ?? []) },
      { feature: "Videos", count: videoUsers },
    ];

    return features
      .map(f => ({ feature: f.feature, pct: Math.round((f.count / total) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  },

  async getRetentionCohorts(): Promise<{ label: string; pct: number }[]> {
    const now = Date.now();
    const sevenDaysAgo = toDateStr(new Date(now - 7 * 86400000));
    const { data: recentActivity } = await supabase
      .from("reading_activity")
      .select("user_id")
      .gte("activity_date", sevenDaysAgo);
    const activeIds = new Set((recentActivity ?? []).map(r => r.user_id));

    const cohorts: { label: string; weeksAgo: number; windowDays: number }[] = [
      { label: "Week 1", weeksAgo: 1, windowDays: 7 },
      { label: "Week 2", weeksAgo: 2, windowDays: 7 },
      { label: "Week 4", weeksAgo: 4, windowDays: 7 },
      { label: "Week 8", weeksAgo: 8, windowDays: 7 },
      { label: "Week 12+", weeksAgo: 12, windowDays: 30 },
    ];

    const results = await Promise.all(
      cohorts.map(async ({ label, weeksAgo, windowDays }) => {
        const end = toDateStr(new Date(now - weeksAgo * 7 * 86400000));
        const start = toDateStr(new Date(now - (weeksAgo * 7 + windowDays) * 86400000));
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .gte("created_at", start + "T00:00:00")
          .lt("created_at", end + "T00:00:00");
        const cohortIds = data ?? [];
        const retained = cohortIds.filter(r => activeIds.has(r.id)).length;
        const pct = cohortIds.length > 0 ? Math.round((retained / cohortIds.length) * 100) : 0;
        return { label, pct };
      })
    );
    return results;
  },

  async getReadingAdoption(): Promise<{ bucket: string; count: number }[]> {
    const todayStr = toDateStr(new Date());
    const thirtyDaysAgo = toDateStr(new Date(Date.now() - 30 * 86400000));

    const [hasPlans, activeMonth, activeToday, completed] = await Promise.all([
      supabase.from("user_reading_plans").select("user_id"),
      supabase.from("reading_activity").select("user_id").gte("activity_date", thirtyDaysAgo),
      supabase.from("reading_activity").select("user_id").eq("activity_date", todayStr),
      supabase.from("reading_plan_completions").select("user_id"),
    ]);

    return [
      { bucket: "Has reading plan", count: new Set((hasPlans.data ?? []).map(r => r.user_id)).size },
      { bucket: "Active this month", count: new Set((activeMonth.data ?? []).map(r => r.user_id)).size },
      { bucket: "Read today", count: new Set((activeToday.data ?? []).map(r => r.user_id)).size },
      { bucket: "Completed a plan", count: new Set((completed.data ?? []).map(r => r.user_id)).size },
    ];
  },

  async getCompletionHistogram(): Promise<{ bucket: string; count: number }[]> {
    const { data: users } = await supabase.from("profiles").select("id");
    const { data: reads } = await supabase.from("chapter_reads").select("user_id, book_index, chapter");

    const totalChapters = 1189;
    const chaptersPerUser: Record<string, Set<string>> = {};
    for (const r of reads ?? []) {
      if (!chaptersPerUser[r.user_id]) chaptersPerUser[r.user_id] = new Set();
      chaptersPerUser[r.user_id].add(`${r.book_index}-${r.chapter}`);
    }

    const buckets = [
      { bucket: "0–10%", min: 0, max: 0.1, count: 0 },
      { bucket: "10–25%", min: 0.1, max: 0.25, count: 0 },
      { bucket: "25–50%", min: 0.25, max: 0.5, count: 0 },
      { bucket: "50–75%", min: 0.5, max: 0.75, count: 0 },
      { bucket: "75–99%", min: 0.75, max: 1.0, count: 0 },
      { bucket: "100%", min: 1.0, max: 1.01, count: 0 },
    ];

    for (const user of users ?? []) {
      const pct = (chaptersPerUser[user.id]?.size ?? 0) / totalChapters;
      for (const b of buckets) {
        if (pct >= b.min && pct < b.max) { b.count++; break; }
      }
    }

    return buckets.map(({ bucket, count }) => ({ bucket, count }));
  },

  async getBookHeatmap(): Promise<{ bookIndex: number; pct: number }[]> {
    const [{ count: totalUsers }, { data: reads }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("chapter_reads").select("user_id, book_index"),
    ]);

    const usersPerBook: Record<number, Set<string>> = {};
    for (const r of reads ?? []) {
      if (!usersPerBook[r.book_index]) usersPerBook[r.book_index] = new Set();
      usersPerBook[r.book_index].add(r.user_id);
    }

    const total = totalUsers ?? 1;
    return Array.from({ length: 66 }, (_, i) => ({
      bookIndex: i,
      pct: Math.round(((usersPerBook[i]?.size ?? 0) / total) * 100),
    }));
  },
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /home/alexi/projects/nwt-progress
npx tsc --noEmit 2>&1 | head -30
```

Expected: No new errors related to admin.ts. If `current_streak`, `chapter_reads`, `reading_plan_completions`, or `study_group_members` columns/tables aren't in supabase.ts, you'll see type errors — fix them by using `as any` casts on the specific query or add the table type to `src/types/supabase.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/api/admin.ts
git commit -m "feat: add analyticsApi to admin.ts"
```

---

## Task 3: Add `useAnalytics` hook to `src/hooks/useAdmin.ts`

**Files:**
- Modify: `src/hooks/useAdmin.ts`

- [ ] **Step 1: Add import and hook at the end of `src/hooks/useAdmin.ts`**

First add the import at the top (modify the existing import line for adminApi):

```ts
import { adminApi, analyticsApi } from "../api/admin";
```

Then append at the end of the file:

```ts
export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const [kpis, signups, dau, features, retention, adoption, histogram, heatmap] = await Promise.all([
        analyticsApi.getKpis(),
        analyticsApi.getSignupsSeries(30),
        analyticsApi.getDauSeries(30),
        analyticsApi.getFeatureUsage(),
        analyticsApi.getRetentionCohorts(),
        analyticsApi.getReadingAdoption(),
        analyticsApi.getCompletionHistogram(),
        analyticsApi.getBookHeatmap(),
      ]);
      return { kpis, signups, dau, features, retention, adoption, histogram, heatmap };
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAdmin.ts
git commit -m "feat: add useAnalytics hook"
```

---

## Task 4: Create `AnalyticsTab.tsx` — KPI cards + skeleton

**Files:**
- Create: `src/views/admin/tabs/AnalyticsTab.tsx`

- [ ] **Step 1: Create the file with KPI section and skeleton**

Create `src/views/admin/tabs/AnalyticsTab.tsx`:

```tsx
import { useAnalytics } from "../../../hooks/useAdmin";
import { BOOKS } from "../../../data/books";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

function AnalyticsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="an-kpi-row">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 14 }} />
        ))}
      </div>
      {[0,1,2].map(i => (
        <div key={i} className="skeleton" style={{ height: 220, borderRadius: 14 }} />
      ))}
    </div>
  );
}

function KpiCard({ label, value, delta, deltaLabel }: {
  label: string; value: string | number;
  delta?: string | number; deltaLabel?: string;
}) {
  const isPositive = typeof delta === "number" ? delta >= 0 : (delta ?? "").startsWith("+");
  return (
    <div className="an-kpi-card">
      <div className="an-kpi-accent" />
      <div className="an-kpi-value">{value}</div>
      <div className="an-kpi-label">{label}</div>
      {delta !== undefined && (
        <div className={`an-kpi-delta ${isPositive ? "an-kpi-delta--up" : "an-kpi-delta--down"}`}>
          {typeof delta === "number" ? (delta >= 0 ? `+${delta}%` : `${delta}%`) : delta}
          {deltaLabel && <span className="an-kpi-delta-label"> {deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

const PURPLE = "#7c3aed";
const TEAL   = "#0d9488";
const DARK_BG = "#120b28";

function SectionHeader({ title, live }: { title: string; live?: boolean }) {
  return (
    <div className="an-section-header">
      {live && <span className="an-live-dot" />}
      <h2 className="an-section-title">{title}</h2>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="an-chart-card">
      <div className="an-chart-title">{title}</div>
      {children}
    </div>
  );
}

const dateFormatter = (d: string) => {
  const date = new Date(d);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export function AnalyticsTab() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) return <AnalyticsSkeleton />;
  if (isError || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
      Failed to load analytics
    </div>
  );

  const { kpis, signups, dau, features, retention, adoption, histogram, heatmap } = data;

  const histogramColor = (bucket: string) =>
    bucket === "100%" ? "#16a34a" : PURPLE;

  const heatmapColor = (pct: number) => {
    if (pct === 0) return "#0a0315";
    if (pct < 10) return "#1e0a3c";
    if (pct < 25) return "#3b0764";
    if (pct < 50) return "#5b21b6";
    if (pct < 75) return "#7c3aed";
    return "#a78bfa";
  };

  return (
    <div className="an-wrap">
      {/* ── Section 1: KPI Cards ─────────────────────────────────────────────── */}
      <SectionHeader title="Live Overview" live />
      <div className="an-kpi-row">
        <KpiCard
          label="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          delta={`+${kpis.newUsersThisWeek}`}
          deltaLabel="this week"
        />
        <KpiCard
          label="Daily Active"
          value={kpis.dailyActiveToday.toLocaleString()}
          delta={kpis.dauChangePct}
          deltaLabel="vs last week"
        />
        <KpiCard
          label="30-Day Retention"
          value={`${kpis.retentionPct30d}%`}
          deltaLabel="of 30–60 day users"
        />
        <KpiCard
          label="Chapters Today"
          value={kpis.chaptersToday.toLocaleString()}
          deltaLabel="site-wide"
        />
        <KpiCard
          label="Avg Streak"
          value={`${kpis.avgStreak}d`}
          deltaLabel="active readers"
        />
      </div>

      {/* ── Section 2a: Signups ───────────────────────────────────────────────── */}
      <SectionHeader title="Growth & Activity" />
      <div className="an-chart-grid">
        <ChartCard title="New Signups (30 days)">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={signups} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#a78bfa" }}
                itemStyle={{ color: "#e9d5ff" }}
                labelFormatter={dateFormatter}
              />
              <Area type="monotone" dataKey="count" stroke={PURPLE} strokeWidth={2} fill="url(#signupGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ── Section 2b: DAU ─────────────────────────────────────────────────── */}
        <ChartCard title="Daily Active Users (30 days)">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={dau} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TEAL} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickFormatter={dateFormatter} tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#5eead4" }}
                itemStyle={{ color: "#ccfbf1" }}
                labelFormatter={dateFormatter}
              />
              <Area type="monotone" dataKey="count" stroke={TEAL} strokeWidth={2} fill="url(#dauGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Section 2c: Feature Usage ─────────────────────────────────────────── */}
      <ChartCard title="Feature Adoption (% of users, last 30 days)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={features}
            layout="vertical"
            margin={{ top: 4, right: 40, left: 60, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} unit="%" />
            <YAxis type="category" dataKey="feature" tick={{ fill: "#c4b5fd", fontSize: 12 }} width={56} />
            <Tooltip
              contentStyle={{ background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: "#e9d5ff" }}
              formatter={(v: number) => [`${v}%`, "Users"]}
            />
            <Bar dataKey="pct" fill={PURPLE} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Section 2d: Retention Cohorts ────────────────────────────────────── */}
      <ChartCard title="Retention by Signup Cohort (active in last 7 days)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={retention} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={1} />
                <stop offset="100%" stopColor="#3b0764" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 10 }} unit="%" />
            <Tooltip
              contentStyle={{ background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: "#e9d5ff" }}
              formatter={(v: number) => [`${v}%`, "Retained"]}
            />
            <Bar dataKey="pct" fill="url(#retGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Section 2e: Reading Adoption ─────────────────────────────────────── */}
      <ChartCard title="Reading Engagement">
        <div className="an-adoption-list">
          {adoption.map(({ bucket, count }) => {
            const maxCount = Math.max(...adoption.map(a => a.count), 1);
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={bucket} className="an-adoption-row">
                <div className="an-adoption-label">{bucket}</div>
                <div className="an-adoption-bar-track">
                  <div className="an-adoption-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="an-adoption-count">{count.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* ── Section 3a: Completion Histogram ─────────────────────────────────── */}
      <SectionHeader title="Bible Progress" />
      <ChartCard title="Completion Distribution">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histogram} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="bucket" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#1a0f35", border: "1px solid #2d1f4e", borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: "#e9d5ff" }}
              formatter={(v: number) => [v, "Users"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {histogram.map(entry => (
                <Cell key={entry.bucket} fill={histogramColor(entry.bucket)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Section 3b: Book Heatmap ──────────────────────────────────────────── */}
      <ChartCard title="Bible Book Reach (% of users who read each book)">
        <div className="an-heatmap">
          {heatmap.map(({ bookIndex, pct }) => {
            const book = BOOKS[bookIndex];
            if (!book) return null;
            return (
              <div
                key={bookIndex}
                className="an-heatmap-cell"
                style={{ background: heatmapColor(pct) }}
                title={`${book.name}: ${pct}%`}
              >
                <span className="an-heatmap-abbr">{book.abbr}</span>
              </div>
            );
          })}
        </div>
        <div className="an-heatmap-legend">
          <span>0%</span>
          <div className="an-heatmap-gradient" />
          <span>100%</span>
        </div>
      </ChartCard>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: No errors. If you see "recharts has no exported member 'Cell'" or similar, check the recharts version's actual exports: `grep -r "export" node_modules/recharts/types/index.d.ts | head -20`.

- [ ] **Step 3: Commit**

```bash
git add src/views/admin/tabs/AnalyticsTab.tsx
git commit -m "feat: add AnalyticsTab component"
```

---

## Task 5: Add analytics CSS to `src/styles/admin.css`

**Files:**
- Modify: `src/styles/admin.css`

- [ ] **Step 1: Append analytics CSS to the end of `src/styles/admin.css`**

```css
/* ── Analytics tab ──────────────────────────────────────────────────────── */

.an-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Section header */
.an-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.an-section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

/* Live dot */
.an-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
  animation: an-pulse 2s ease-in-out infinite;
}

@keyframes an-pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
}

/* KPI row */
.an-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.an-kpi-card {
  background: linear-gradient(135deg, #1a0f35, #120b28);
  border: 1px solid #2d1f4e;
  border-radius: 14px;
  padding: 18px 16px 14px;
  position: relative;
  overflow: hidden;
  transition: transform 180ms ease, box-shadow 180ms ease;
  cursor: default;
}

.an-kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(124,58,237,0.25);
}

.an-kpi-accent {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #7c3aed, #0d9488);
}

.an-kpi-value {
  font-size: 28px;
  font-weight: 800;
  color: #a78bfa;
  line-height: 1.1;
  margin-bottom: 4px;
}

.an-kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.an-kpi-delta {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
}
.an-kpi-delta--up { color: #34d399; }
.an-kpi-delta--down { color: #f87171; }
.an-kpi-delta-label { font-weight: 400; opacity: 0.7; }

/* Chart grid (2-col on wide screens) */
.an-chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 700px) {
  .an-chart-grid { grid-template-columns: 1fr; }
}

/* Chart card */
.an-chart-card {
  background: linear-gradient(135deg, #1a0f35, #120b28);
  border: 1px solid #2d1f4e;
  border-radius: 14px;
  padding: 18px 16px 14px;
}

.an-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #c4b5fd;
  margin-bottom: 12px;
}

/* Adoption list */
.an-adoption-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.an-adoption-row {
  display: grid;
  grid-template-columns: 160px 1fr 60px;
  align-items: center;
  gap: 10px;
}

.an-adoption-label {
  font-size: 12px;
  color: #c4b5fd;
  white-space: nowrap;
}

.an-adoption-bar-track {
  height: 8px;
  background: rgba(124,58,237,0.15);
  border-radius: 4px;
  overflow: hidden;
}

.an-adoption-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #7c3aed, #0d9488);
  border-radius: 4px;
  transition: width 600ms ease;
}

.an-adoption-count {
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
  text-align: right;
}

/* Book heatmap */
.an-heatmap {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  gap: 4px;
  margin-bottom: 10px;
}

.an-heatmap-cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.an-heatmap-cell:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 12px rgba(124,58,237,0.5);
  z-index: 1;
  position: relative;
}

.an-heatmap-abbr {
  font-size: 8px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  pointer-events: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding: 0 1px;
}

.an-heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 6px;
}

.an-heatmap-gradient {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(90deg, #0a0315, #3b0764, #7c3aed, #a78bfa);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/admin.css
git commit -m "feat: add analytics CSS to admin.css"
```

---

## Task 6: Wire tab into `AdminPage.tsx` and add i18n keys

**Files:**
- Modify: `src/views/admin/AdminPage.tsx`
- Modify: `src/locales/en/translation.json`
- Modify: `public/locales/es/translation.json`
- Modify: `public/locales/fr/translation.json`
- Modify: `public/locales/pt/translation.json`
- Modify: `public/locales/ja/translation.json`
- Modify: `public/locales/ko/translation.json`
- Modify: `public/locales/tl/translation.json`
- Modify: `public/locales/zh/translation.json`

- [ ] **Step 1: Add import to `AdminPage.tsx`**

At the top of `src/views/admin/AdminPage.tsx`, add:

```ts
import { AnalyticsTab } from "./tabs/AnalyticsTab";
```

- [ ] **Step 2: Add the tab button in `AdminPage.tsx`**

Find the tab buttons section — after the "Videos" tab button block (around line 143, inside the admin-tabs div), add a new block for analytics:

```tsx
          {isCurrentUserAdmin && (
            <button className={`admin-tab${tab === "analytics" ? " admin-tab--active" : ""}`} onClick={() => setTab("analytics")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><polyline points="1 20 1 17 5 17"/><polyline points="23 20 23 15 19 15"/></svg>
              {t("adminTabs.analytics")}
            </button>
          )}
```

- [ ] **Step 3: Add tab content render in `AdminPage.tsx`**

After the last `{tab === "videos" ...}` line (around line 157), add:

```tsx
        {tab === "analytics"     && isCurrentUserAdmin && <AnalyticsTab />}
```

- [ ] **Step 4: Add i18n key to `src/locales/en/translation.json`**

In the `"adminTabs"` object, add after `"announcements"`:

```json
"analytics": "Analytics"
```

- [ ] **Step 5: Add i18n keys to all other locales**

For each locale file at `public/locales/{es,fr,pt,ja,ko,tl,zh}/translation.json`, add `"analytics"` to the `"adminTabs"` object:

- **es:** `"analytics": "Analíticas"`
- **fr:** `"analytics": "Analytiques"`
- **pt:** `"analytics": "Análises"`
- **ja:** `"analytics": "分析"`
- **ko:** `"analytics": "분석"`
- **tl:** `"analytics": "Analytics"`
- **zh:** `"analytics": "分析"`

- [ ] **Step 6: TypeScript check and dev server smoke test**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors.

Start the dev server and navigate to admin panel → Analytics tab. Verify:
- Tab appears in tab bar (admin-only)
- KPI cards render with live data
- Area charts render with 30 days of data
- Feature usage horizontal bars render
- Retention cohort bars render
- Reading adoption list renders
- Completion histogram renders (100% bar is green)
- Book heatmap renders all 66 cells with hover tooltips showing book name + %
- Skeleton shows while loading (hard to test, but can verify by throttling network in DevTools)

- [ ] **Step 7: Commit**

```bash
git add src/views/admin/AdminPage.tsx src/locales/en/translation.json public/locales/es/translation.json public/locales/fr/translation.json public/locales/pt/translation.json public/locales/ja/translation.json public/locales/ko/translation.json public/locales/tl/translation.json public/locales/zh/translation.json
git commit -m "feat: wire analytics tab into admin panel with i18n"
```

---

## Post-Implementation Notes

### Possible type errors to expect

If `src/types/supabase.ts` doesn't include these tables/columns, the Supabase client will type-error:
- `profiles.current_streak` — add `current_streak: number | null` to the profiles Row type
- `reading_plan_completions` — add the table if missing
- `study_group_members` — add if missing
- `video_likes` / `video_comments` — add if missing
- `chapter_reads.book_index` and `chapter_reads.chapter` — verify column names match

For any missing table, either add the minimal type to supabase.ts or use `.from("table_name" as any)` as a temporary fix.

### If recharts Cell import errors

Some recharts versions export `Cell` differently. If you see an import error:

```ts
// Try this import form instead:
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Cell } from "recharts";
```

Or inline the color logic in the Bar's `fill` prop using a render function if needed.

### Performance

The `getCompletionHistogram` and `getBookHeatmap` methods fetch all `chapter_reads` rows. On a large dataset (100k+ rows), this will be slow. For now (small user base) it's fine. If it becomes an issue, create a Supabase view or RPC that pre-aggregates this data.
