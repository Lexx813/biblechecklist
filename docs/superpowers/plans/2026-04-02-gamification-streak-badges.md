# Gamification — Streak Freeze Tokens + Milestone Badges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add streak freeze tokens (premium, 2/month) and 10 milestone badges (earnable by all users) to protect streaks and celebrate reading milestones.

**Architecture:** DB migration adds three tables (`streak_freeze_uses`, `user_badges`) and a new column (`freeze_tokens` on `profiles`), then updates the `get_reading_streak` RPC to treat freeze dates as read days. Client-side badge checks run in existing hooks after key actions and call a single idempotent `useAwardBadge` mutation. A cron Edge Function resets freeze tokens on the 1st of each month.

**Tech Stack:** Next.js 15, React 19, Supabase (Postgres RLS + Edge Functions + pg_cron), TanStack Query v5, vanilla CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/add_gamification.sql` | Create | Tables, column, updated RPC |
| `supabase/functions/refresh-freeze-tokens/index.ts` | Create | Monthly cron: reset freeze_tokens = 2 for premium users |
| `src/data/badges.js` | Create | Static badge definitions (key, label, emoji, description) |
| `src/api/streakFreeze.js` | Create | applyFreeze, getFreezeStatus API functions |
| `src/hooks/useStreakFreeze.js` | Create | useFreezeStatus, useApplyFreeze hooks |
| `src/api/badges.js` | Create | awardBadge, getUserBadges API functions |
| `src/hooks/useBadges.js` | Create | useBadges, useAwardBadge hooks |
| `src/components/home/TodaysFocusCard.jsx` | Modify | Add freeze token UI (snowflake + button + confirm) |
| `src/views/profile/ProfilePage.jsx` | Modify | Add Achievements section with badge grid |
| `src/styles/gamification.css` | Create | Freeze token badge grid, achievement card styles |

---

## Task 1: DB Migration — Tables + RPC Update

**Files:**
- Create: `supabase/migrations/add_gamification.sql`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/add_gamification.sql

-- 1. Add freeze_tokens column to profiles (default 2 for all, refreshed monthly for premium)
alter table profiles add column if not exists freeze_tokens int not null default 2;

-- 2. Streak freeze usage log
create table if not exists streak_freeze_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  used_date date not null,
  created_at timestamptz default now(),
  unique(user_id, used_date)
);

alter table streak_freeze_uses enable row level security;

create policy "Users manage own freeze uses"
  on streak_freeze_uses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. User badges
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_key)
);

alter table user_badges enable row level security;

-- Users can read their own badges
create policy "Users read own badges"
  on user_badges for select
  using (auth.uid() = user_id);

-- All authenticated users can read others' badges (for public profile)
create policy "Authenticated users read all badges"
  on user_badges for select
  using (auth.role() = 'authenticated');

-- Users can insert their own badges (client-side award; unique constraint prevents duplicates)
create policy "Users insert own badges"
  on user_badges for insert
  with check (auth.uid() = user_id);

-- 4. Update get_reading_streak RPC to treat freeze dates as read
-- Drop and recreate so freeze days count toward the streak
create or replace function get_reading_streak(p_user_id uuid)
returns table(current_streak int, longest_streak int, total_days int)
language plpgsql
security definer
as $$
declare
  today_str date := current_date;
  yest_str  date := current_date - 1;
  cur_streak int := 0;
  lng_streak int := 0;
  tot_days   int := 0;
  d          date;
  anchor     date;
begin
  -- Build a combined set of "active days" = reading_activity UNION streak_freeze_uses
  -- for this user, then count streaks
  create temp table _active_days on commit drop as
  select distinct read_date::date as active_date
  from reading_activity
  where user_id = p_user_id
  union
  select distinct used_date as active_date
  from streak_freeze_uses
  where user_id = p_user_id;

  select count(*) into tot_days from _active_days;

  -- Determine anchor: today if today is active, else yesterday
  if exists (select 1 from _active_days where active_date = today_str) then
    anchor := today_str;
  elsif exists (select 1 from _active_days where active_date = yest_str) then
    anchor := yest_str;
  else
    -- No recent activity
    current_streak := 0;
    goto compute_longest;
  end if;

  -- Walk backwards from anchor counting consecutive days
  d := anchor;
  loop
    if exists (select 1 from _active_days where active_date = d) then
      cur_streak := cur_streak + 1;
      d := d - 1;
    else
      exit;
    end if;
  end loop;

  <<compute_longest>>
  -- Compute longest streak (scan all active days sorted desc)
  declare
    prev_date date := null;
    run_len   int  := 0;
  begin
    for d in (select active_date from _active_days order by active_date desc) loop
      if prev_date is null or prev_date - d = 1 then
        run_len := run_len + 1;
        lng_streak := greatest(lng_streak, run_len);
      else
        run_len := 1;
      end if;
      prev_date := d;
    end loop;
    lng_streak := greatest(lng_streak, run_len);
  end;

  return query select cur_streak, lng_streak, tot_days;
end;
$$;

-- Index for fast freeze lookup
create index if not exists idx_streak_freeze_uses_user_date
  on streak_freeze_uses(user_id, used_date desc);

create index if not exists idx_user_badges_user
  on user_badges(user_id);
```

- [ ] **Step 2: Apply migration**

Run in Supabase SQL editor or via: `supabase db push`

- [ ] **Step 3: Verify**

Run these queries in Supabase SQL editor:
```sql
-- Confirm columns exist
select column_name from information_schema.columns
where table_name = 'profiles' and column_name = 'freeze_tokens';

-- Confirm tables exist
select table_name from information_schema.tables
where table_name in ('streak_freeze_uses', 'user_badges');

-- Test the RPC compiles (should return a row with 0s for a non-existent user)
select * from get_reading_streak('00000000-0000-0000-0000-000000000000'::uuid);
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/add_gamification.sql
git commit -m "feat: add gamification DB schema — freeze tokens, badges, updated streak RPC"
```

---

## Task 2: Monthly Freeze Token Refresh Edge Function

**Files:**
- Create: `supabase/functions/refresh-freeze-tokens/index.ts`

- [ ] **Step 1: Write Edge Function**

```typescript
// supabase/functions/refresh-freeze-tokens/index.ts
/**
 * Resets freeze_tokens = 2 for all premium users on the 1st of each month.
 * Called by pg_cron: "0 0 1 * *"  (midnight UTC on 1st of month)
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async () => {
  const { error, count } = await supabase
    .from("profiles")
    .update({ freeze_tokens: 2 })
    .in("subscription_status", ["active", "trialing", "gifted"])
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("refresh-freeze-tokens error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  console.log(`refresh-freeze-tokens: reset ${count ?? "unknown"} users`);
  return new Response(JSON.stringify({ reset: count ?? 0 }), { status: 200 });
});
```

- [ ] **Step 2: Register pg_cron job**

Run in Supabase SQL editor:
```sql
-- Run on 1st of every month at midnight UTC
select cron.schedule(
  'refresh-freeze-tokens',
  '0 0 1 * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/refresh-freeze-tokens',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Note: If `pg_cron` with `net.http_post` isn't available, schedule this via a Supabase Scheduled Function in the dashboard (Cron expression: `0 0 1 * *`, function: `refresh-freeze-tokens`).

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy refresh-freeze-tokens
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/refresh-freeze-tokens/index.ts
git commit -m "feat: add monthly freeze token refresh cron edge function"
```

---

## Task 3: Badge Definitions + Streak Freeze API

**Files:**
- Create: `src/data/badges.js`
- Create: `src/api/badges.js`
- Create: `src/api/streakFreeze.js`

- [ ] **Step 1: Write badge definitions**

```js
// src/data/badges.js
export const BADGES = [
  {
    key: "full_bible_read",
    label: "Read the Whole Bible",
    emoji: "📖",
    description: "Read all 1,189 chapters of the Bible",
  },
  {
    key: "streak_30",
    label: "30-Day Streak",
    emoji: "🔥",
    description: "Maintained a reading streak for 30 consecutive days",
  },
  {
    key: "streak_100",
    label: "100-Day Streak",
    emoji: "⚡",
    description: "Maintained a reading streak for 100 consecutive days",
  },
  {
    key: "streak_365",
    label: "Year-Long Streak",
    emoji: "🌟",
    description: "Maintained a reading streak for 365 consecutive days",
  },
  {
    key: "quiz_all_levels",
    label: "Quiz Champion",
    emoji: "🏆",
    description: "Completed all 12 quiz levels",
  },
  {
    key: "first_note",
    label: "First Note",
    emoji: "📝",
    description: "Saved your first study note",
  },
  {
    key: "first_group",
    label: "Group Member",
    emoji: "👥",
    description: "Joined your first study group",
  },
  {
    key: "plan_complete",
    label: "Plan Finisher",
    emoji: "✅",
    description: "Completed a reading plan",
  },
  {
    key: "full_nt_read",
    label: "New Testament Complete",
    emoji: "✝️",
    description: "Read all chapters of the Christian Greek Scriptures",
  },
  {
    key: "full_ot_read",
    label: "Hebrew Scriptures Complete",
    emoji: "📜",
    description: "Read all chapters of the Hebrew Scriptures",
  },
];
```

- [ ] **Step 2: Write badges API**

```js
// src/api/badges.js
import { supabase } from "../lib/supabase";

export const badgesApi = {
  getUserBadges: async (userId) => {
    const { data, error } = await supabase
      .from("user_badges")
      .select("badge_key, earned_at")
      .eq("user_id", userId);
    if (error) throw error;
    return data ?? [];
  },

  awardBadge: async (userId, badgeKey) => {
    const { error } = await supabase
      .from("user_badges")
      .insert({ user_id: userId, badge_key: badgeKey });
    // Ignore unique constraint violations (badge already earned — idempotent)
    if (error && error.code !== "23505") throw error;
    return { alreadyEarned: error?.code === "23505" };
  },
};
```

- [ ] **Step 3: Write streak freeze API**

```js
// src/api/streakFreeze.js
import { supabase } from "../lib/supabase";

export const streakFreezeApi = {
  getFreezeStatus: async (userId) => {
    // Get current token count and whether yesterday was already frozen
    const [profileRes, freezeRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("freeze_tokens")
        .eq("id", userId)
        .single(),
      supabase
        .from("streak_freeze_uses")
        .select("used_date")
        .eq("user_id", userId)
        .gte("used_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
        .order("used_date", { ascending: false }),
    ]);

    if (profileRes.error) throw profileRes.error;

    const tokens = profileRes.data?.freeze_tokens ?? 0;
    const recentFreezes = freezeRes.data?.map((r) => r.used_date) ?? [];
    return { tokens, recentFreezes };
  },

  applyFreeze: async (userId, date) => {
    // date: "YYYY-MM-DD" string for the day to freeze (usually yesterday)
    const { error: insertError } = await supabase
      .from("streak_freeze_uses")
      .insert({ user_id: userId, used_date: date });

    if (insertError && insertError.code !== "23505") throw insertError;
    if (insertError?.code === "23505") return; // Already frozen this day

    // Decrement token count
    const { error: updateError } = await supabase.rpc("decrement_freeze_token", {
      p_user_id: userId,
    });
    if (updateError) throw updateError;
  },
};
```

- [ ] **Step 4: Add decrement_freeze_token RPC to migration**

Append to `supabase/migrations/add_gamification.sql` before the final `create index` lines:

```sql
-- RPC to safely decrement freeze_tokens (min 0)
create or replace function decrement_freeze_token(p_user_id uuid)
returns void
language sql
security definer
as $$
  update profiles
  set freeze_tokens = greatest(0, freeze_tokens - 1)
  where id = p_user_id;
$$;
```

Apply this addition: run the `create or replace function` statement in Supabase SQL editor.

- [ ] **Step 5: Verify**

```bash
npm run build
# Expected: no errors
```

- [ ] **Step 6: Commit**

```bash
git add src/data/badges.js src/api/badges.js src/api/streakFreeze.js
git commit -m "feat: add badge definitions, badges API, and streak freeze API"
```

---

## Task 4: React Hooks for Badges + Streak Freeze

**Files:**
- Create: `src/hooks/useBadges.js`
- Create: `src/hooks/useStreakFreeze.js`

- [ ] **Step 1: Write useBadges hook**

```js
// src/hooks/useBadges.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { badgesApi } from "../api/badges";

export function useBadges(userId) {
  return useQuery({
    queryKey: ["badges", userId],
    queryFn: () => badgesApi.getUserBadges(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useAwardBadge(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (badgeKey) => badgesApi.awardBadge(userId, badgeKey),
    onSuccess: (result) => {
      if (!result.alreadyEarned) {
        queryClient.invalidateQueries({ queryKey: ["badges", userId] });
      }
    },
  });
}
```

- [ ] **Step 2: Write useStreakFreeze hook**

```js
// src/hooks/useStreakFreeze.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { streakFreezeApi } from "../api/streakFreeze";

export function useFreezeStatus(userId) {
  return useQuery({
    queryKey: ["freezeStatus", userId],
    queryFn: () => streakFreezeApi.getFreezeStatus(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyFreeze(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date) => streakFreezeApi.applyFreeze(userId, date),
    onMutate: async (date) => {
      await queryClient.cancelQueries({ queryKey: ["freezeStatus", userId] });
      const prev = queryClient.getQueryData(["freezeStatus", userId]);
      queryClient.setQueryData(["freezeStatus", userId], (old) => ({
        ...old,
        tokens: Math.max(0, (old?.tokens ?? 1) - 1),
        recentFreezes: [...(old?.recentFreezes ?? []), date],
      }));
      return { prev };
    },
    onError: (_err, _date, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["freezeStatus", userId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["freezeStatus", userId] });
      queryClient.invalidateQueries({ queryKey: ["streak", userId] });
    },
  });
}
```

- [ ] **Step 3: Verify**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBadges.js src/hooks/useStreakFreeze.js
git commit -m "feat: add useBadges and useStreakFreeze React hooks"
```

---

## Task 5: Streak Freeze UI in TodaysFocusCard

**Files:**
- Modify: `src/components/home/TodaysFocusCard.jsx`
- Create: `src/styles/gamification.css`

- [ ] **Step 1: Create gamification CSS**

```css
/* src/styles/gamification.css */

/* ── Streak freeze ─────────────────────────────────────────── */
.tf-freeze-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.tf-freeze-token-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tf-freeze-token-count svg {
  color: #60a5fa; /* blue snowflake */
}

.tf-freeze-btn {
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.tf-freeze-btn:hover {
  background: var(--surface-hover);
}

.tf-freeze-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tf-freeze-locked {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  cursor: pointer;
}

/* ── Badge grid (profile page) ─────────────────────────────── */
.achievements-section {
  margin-top: 28px;
}

.achievements-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text);
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.badge-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  text-align: center;
}

.badge-card--earned {
  border-color: var(--accent);
}

.badge-card--locked {
  opacity: 0.45;
  filter: grayscale(1);
}

.badge-emoji {
  font-size: 1.6rem;
  line-height: 1;
}

.badge-label {
  font-size: 0.72rem;
  color: var(--text-secondary);
  line-height: 1.2;
}

.badge-earned-date {
  font-size: 0.65rem;
  color: var(--text-tertiary);
}

/* ── Toast for new badge ───────────────────────────────────── */
.badge-toast {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

- [ ] **Step 2: Import gamification CSS in TodaysFocusCard**

In `src/components/home/TodaysFocusCard.jsx`, add the import near the top alongside other style imports:

```js
import "../../styles/gamification.css";
```

(Check the existing import path convention — if styles are imported at the page level, import it in `src/views/home/HomePage.jsx` instead.)

- [ ] **Step 3: Add freeze UI to TodaysFocusCard**

Find the section that renders `streak?.current_streak` in `TodaysFocusCard.jsx`. After the streak display, add the freeze row.

Add these imports at the top:
```js
import { useState } from "react";
import { useFreezeStatus, useApplyFreeze } from "../../hooks/useStreakFreeze";
import { useSubscription } from "../../hooks/useSubscription";
```

Add freeze logic inside the component (after the existing streak state/refs):
```jsx
// Inside TodaysFocusCard component, after existing hooks:
const { isPremium } = useSubscription(userId);  // userId comes from user prop
const { data: freezeStatus } = useFreezeStatus(userId);
const applyFreeze = useApplyFreeze(userId);
const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);

// Yesterday's date string
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

// Show freeze button if: yesterday was missed AND tokens > 0 AND not already frozen yesterday
const didReadToday = streak?.current_streak > 0 &&
  /* streak active means today OR yesterday was read */
  new Date().toISOString().slice(0, 10) === (streak?.last_read_date ?? "");
  // Note: adjust this check based on how `streak` object looks in practice

const yesterdayFrozen = freezeStatus?.recentFreezes?.includes(yesterdayStr);
const canFreeze = !didReadToday &&
  (freezeStatus?.tokens ?? 0) > 0 &&
  !yesterdayFrozen;
```

Add freeze row JSX after the streak number display (before closing tag):
```jsx
{/* Freeze token row */}
{isPremium ? (
  <div className="tf-freeze-row">
    <span className="tf-freeze-token-count">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        <line x1="19.07" y1="4.93" x2="4.93" y2="19.07"/>
      </svg>
      {freezeStatus?.tokens ?? 2} freezes left
    </span>
    {canFreeze && (
      <button
        className="tf-freeze-btn"
        onClick={() => setShowFreezeConfirm(true)}
        disabled={applyFreeze.isPending}
      >
        Freeze streak
      </button>
    )}
    {(freezeStatus?.tokens ?? 2) === 0 && (
      <span style={{ opacity: 0.5, fontSize: "0.78rem" }}>No freezes left this month</span>
    )}
  </div>
) : (
  <div
    className="tf-freeze-locked"
    onClick={onUpgrade}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onUpgrade?.()}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
    ✦ Streak Freeze (Premium)
  </div>
)}

{/* Freeze confirm dialog */}
{showFreezeConfirm && (
  <div className="freeze-confirm-overlay" onClick={() => setShowFreezeConfirm(false)}>
    <div className="freeze-confirm-dialog" onClick={(e) => e.stopPropagation()}>
      <p>Use 1 freeze token to protect your streak?</p>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
        {freezeStatus?.tokens ?? 0} token{(freezeStatus?.tokens ?? 0) !== 1 ? "s" : ""} remaining after this.
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button className="tf-freeze-btn" onClick={() => setShowFreezeConfirm(false)}>Cancel</button>
        <button
          className="tf-freeze-btn"
          style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}
          onClick={() => {
            applyFreeze.mutate(yesterdayStr);
            setShowFreezeConfirm(false);
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
```

Add `.freeze-confirm-overlay` and `.freeze-confirm-dialog` to `gamification.css`:
```css
.freeze-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.freeze-confirm-dialog {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
  max-width: 300px;
  width: 90%;
}
```

- [ ] **Step 4: Manual verify in dev**

```bash
npm run dev
# Navigate to Home page
# Verify: "X freezes left" appears in streak card for premium users
# Verify: "✦ Streak Freeze (Premium)" appears for free users (tapping opens upgrade modal)
# Verify: "Freeze streak" button appears when streak is at risk (test by temporarily hardcoding canFreeze=true)
```

- [ ] **Step 5: Commit**

```bash
git add src/styles/gamification.css src/components/home/TodaysFocusCard.jsx
git commit -m "feat: add streak freeze token UI to TodaysFocusCard"
```

---

## Task 6: Badges Grid on Profile Page

**Files:**
- Modify: `src/views/profile/ProfilePage.jsx`

- [ ] **Step 1: Add imports to ProfilePage**

Add to the existing imports at the top of `ProfilePage.jsx`:
```js
import { useBadges, useAwardBadge } from "../../hooks/useBadges";
import { BADGES } from "../../data/badges";
import "../../styles/gamification.css";
```

- [ ] **Step 2: Add badges data in ProfilePage component**

Inside the `ProfilePage` component (or the relevant sub-component that renders the profile), add:
```js
const { data: earnedBadges = [] } = useBadges(user?.id);
const earnedKeys = new Set(earnedBadges.map((b) => b.badge_key));
const earnedMap = Object.fromEntries(earnedBadges.map((b) => [b.badge_key, b.earned_at]));
const earnedCount = earnedKeys.size;
```

- [ ] **Step 3: Add Achievements section JSX**

Find where the profile stats are rendered (streak count, quiz badges, etc.) and add after:
```jsx
{/* Achievements / Milestone Badges */}
<div className="achievements-section">
  <h3 className="achievements-title">
    Achievements ({earnedCount} / {BADGES.length})
  </h3>
  <div className="badge-grid">
    {BADGES.map((badge) => {
      const earned = earnedKeys.has(badge.key);
      const earnedAt = earnedMap[badge.key];
      return (
        <div
          key={badge.key}
          className={`badge-card ${earned ? "badge-card--earned" : "badge-card--locked"}`}
          title={badge.description + (earnedAt ? `\nEarned ${new Date(earnedAt).toLocaleDateString()}` : "")}
        >
          <span className="badge-emoji" role="img" aria-label={badge.label}>
            {badge.emoji}
          </span>
          <span className="badge-label">{badge.label}</span>
          {earned && earnedAt && (
            <span className="badge-earned-date">
              {new Date(earnedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      );
    })}
  </div>
</div>
```

- [ ] **Step 4: Manual verify**

```bash
npm run dev
# Navigate to Profile page
# Verify: "Achievements (0 / 10)" section appears
# Verify: all 10 badge cards visible, locked state (grayscale)
npm run build
# Expected: no errors
```

- [ ] **Step 5: Commit**

```bash
git add src/views/profile/ProfilePage.jsx
git commit -m "feat: add milestone badge grid to profile page"
```

---

## Task 7: Badge Check Integration — Award Badges After Key Actions

**Files:**
- Modify: `src/hooks/useProgress.js` (check streak badges after progress update)
- Modify: `src/hooks/useStudyNotes.js` (check first_note badge)
- Modify: `src/hooks/useGroups.js` (check first_group badge)
- Modify: `src/hooks/useReadingPlans.js` (check plan_complete badge) — locate the correct hook
- Modify: `src/hooks/useQuiz.js` (check quiz_all_levels badge after submit)

For each, the pattern is identical — after `onSuccess`, check the relevant condition and call `badgesApi.awardBadge` directly (no need to use the hook, just call the API). The `user_badges` unique constraint prevents duplicate inserts.

- [ ] **Step 1: Add streak badge checks to useProgress**

In `src/hooks/useProgress.js`, find `useUpdateProgress` (or the mutation that updates chapters read). In its `onSuccess`, add:

```js
import { badgesApi } from "../api/badges";
import { BOOKS } from "../data/books";

// Inside onSuccess of the progress update mutation:
onSuccess: async (_, { userId, chapterCount, streakData }) => {
  // Re-fetch streak to check milestones
  // (The streak is already invalidated — read from the updated cache or refetch)
  // Check streak badges
  const streak = queryClient.getQueryData(["streak", userId]);
  if (streak?.current_streak >= 30) badgesApi.awardBadge(userId, "streak_30");
  if (streak?.current_streak >= 100) badgesApi.awardBadge(userId, "streak_100");
  if (streak?.current_streak >= 365) badgesApi.awardBadge(userId, "streak_365");

  // Check reading completion badges
  const progress = queryClient.getQueryData(["progress", userId]);
  if (progress) {
    const OT_CHAPTERS = BOOKS.slice(0, 39).reduce((s, b) => s + b.chapters, 0);
    const totalChapters = BOOKS.reduce((s, b) => s + b.chapters, 0);
    const doneCount = Object.values(progress).flat().filter(Boolean).length;
    // Check if NT (books 39-65) all done
    const ntDone = BOOKS.slice(39).every((b, i) =>
      Object.values(progress[39 + i] ?? {}).filter(Boolean).length === b.chapters
    );
    if (ntDone) badgesApi.awardBadge(userId, "full_nt_read");
    const otDone = BOOKS.slice(0, 39).every((b, i) =>
      Object.values(progress[i] ?? {}).filter(Boolean).length === b.chapters
    );
    if (otDone) badgesApi.awardBadge(userId, "full_ot_read");
    if (doneCount >= totalChapters) badgesApi.awardBadge(userId, "full_bible_read");
  }
},
```

Note: Badge calls are fire-and-forget (no await). Failures are silent — the unique constraint ensures idempotency so retries on next action are harmless.

- [ ] **Step 2: Add first_note badge in useStudyNotes**

In `src/hooks/useStudyNotes.js`, find `useCreateStudyNote`. In its `onSuccess`:
```js
import { badgesApi } from "../api/badges";

// In useCreateStudyNote onSuccess:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["studyNotes", userId] });
  badgesApi.awardBadge(userId, "first_note"); // idempotent — only awards once
},
```

- [ ] **Step 3: Add first_group badge in useGroups**

In `src/hooks/useGroups.js`, find the join group mutation (likely `useJoinGroup` or similar). In its `onSuccess`:
```js
import { badgesApi } from "../api/badges";

// In join group mutation onSuccess:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["groups"] });
  badgesApi.awardBadge(userId, "first_group");
},
```

- [ ] **Step 4: Add plan_complete badge after plan completion**

Find where reading plan completion is triggered (likely a mutation in a reading plans hook). In `onSuccess`:
```js
badgesApi.awardBadge(userId, "plan_complete");
```

- [ ] **Step 5: Add quiz_all_levels badge in useQuiz**

In `src/hooks/useQuiz.js`, find `useSubmitQuiz`. In its `onSuccess`:
```js
import { badgesApi } from "../api/badges";

// In useSubmitQuiz onSuccess, after invalidating quiz progress:
onSuccess: (_, { level, score }) => {
  queryClient.invalidateQueries({ queryKey: ["quizProgress", userId] });
  // Check if all 12 levels now have badge_earned = true
  const progress = queryClient.getQueryData(["quizProgress", userId]) ?? [];
  const allDone = progress.filter(p => p.badge_earned).length === 12;
  if (allDone) badgesApi.awardBadge(userId, "quiz_all_levels");
},
```

- [ ] **Step 6: Build and verify**

```bash
npm run build
# Expected: no errors
```

- [ ] **Step 7: Manual verify**

```bash
npm run dev
# 1. Save a study note → check console/DB that first_note badge row inserted
# 2. Check profile page → "Achievements (1 / 10)" with First Note badge highlighted
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useProgress.js src/hooks/useStudyNotes.js src/hooks/useGroups.js src/hooks/useQuiz.js
git commit -m "feat: award milestone badges after key user actions"
```

---

## Task 8: Toast Notification on Badge Earn

**Files:**
- Modify: `src/hooks/useBadges.js`
- Modify where `useAwardBadge` is called or add a global listener

The simplest approach: update `useAwardBadge` to trigger a toast notification on success using the existing toast system.

- [ ] **Step 1: Find existing toast pattern**

```bash
grep -r "toast\|showToast\|addToast" src --include="*.js" --include="*.jsx" -l
```

- [ ] **Step 2: Add toast trigger in useAwardBadge**

Once you've identified the toast function/hook, update `useAwardBadge` in `src/hooks/useBadges.js`:

```js
import { BADGES } from "../data/badges";

export function useAwardBadge(userId) {
  const queryClient = useQueryClient();
  // Import your project's toast trigger here (e.g., useToast or a toast event emitter)

  return useMutation({
    mutationFn: (badgeKey) => badgesApi.awardBadge(userId, badgeKey),
    onSuccess: (result, badgeKey) => {
      if (!result.alreadyEarned) {
        queryClient.invalidateQueries({ queryKey: ["badges", userId] });
        // Trigger toast
        const badge = BADGES.find((b) => b.key === badgeKey);
        if (badge) {
          // Use existing toast system — replace `showToast` with actual function:
          // showToast(`${badge.emoji} Achievement Unlocked — ${badge.label}`);
          window.dispatchEvent(new CustomEvent("badge-earned", {
            detail: { badge }
          }));
        }
      }
    },
  });
}
```

If the project uses a `CustomEvent` pattern, add a listener in the toast component. Otherwise adapt to match the existing toast API.

- [ ] **Step 3: Verify toast fires**

```bash
npm run dev
# Award a badge manually (save a note if first_note not yet earned)
# Verify toast appears with badge emoji + label
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBadges.js
git commit -m "feat: show toast notification when milestone badge is earned"
```

---

## Self-Review Checklist

Before marking this plan done, verify:
- [ ] `streak_freeze_uses` table exists with correct RLS
- [ ] `user_badges` table exists with correct RLS
- [ ] `freeze_tokens` column on profiles defaults to 2
- [ ] `get_reading_streak` RPC treats freeze dates as active days
- [ ] Monthly cron edge function deployed
- [ ] Freeze UI shows for premium users, locked state for free users
- [ ] `onUpgrade` prop passed to freeze locked state
- [ ] All 10 badges render in profile grid (locked vs earned)
- [ ] Badge checks fire after: note save, group join, quiz complete, chapter mark, plan complete
- [ ] Badge awards are idempotent (duplicate inserts silently ignored)
- [ ] `isPremium` uses existing `useSubscription` hook (covers active/trialing/gifted) ✅
