# Gamification — Streak Freeze Tokens + Milestone Badges

**Date:** 2026-04-02  
**Status:** Approved  
**Premium gate:** Both features are premium-only. Free users see lock icons and upgrade CTAs.

---

## Overview

Two linked gamification enhancements that make streaks feel safer and achievements feel visible. Streak Freeze Tokens protect a user's reading streak when they miss a day. Milestone Badges celebrate meaningful accomplishments and display on the profile page.

---

## Feature 1: Streak Freeze Tokens

### Concept
Premium users receive 2 freeze tokens per month. Spending a token on a missed day preserves the reading streak as if the day was completed. Tokens do not roll over — unused tokens expire at month end.

### DB Changes

**`profiles` table — add column:**
```sql
freeze_tokens int not null default 2
```

**New table:**
```sql
create table streak_freeze_uses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  used_date date not null,
  created_at timestamptz default now(),
  unique(user_id, used_date)
);
```

**RLS:** Users can only read/insert their own rows.

### Monthly Token Refresh
A Supabase Edge Function cron job runs on the 1st of each month and resets `freeze_tokens = 2` for all premium users. Uses the existing cron scheduling pattern in the project.

### Logic
- A freeze is spendable when: yesterday was missed AND `freeze_tokens > 0` AND no freeze already used for yesterday
- Applying a freeze: inserts a row in `streak_freeze_uses`, decrements `freeze_tokens` on `profiles`, and the streak calculation treats that date as completed
- Streak calculation (existing RPC): needs to check `streak_freeze_uses` when determining if a day counts — a date in that table counts as read

### UI

**Home page streak card (`TodaysFocusCard.jsx`):**
- Snowflake icon (❄) + "X freezes left" shown when `freeze_tokens > 0`
- "Freeze streak" button appears the day after a missed day (if tokens remain)
- Confirm dialog: "Use 1 freeze token to protect your streak? (X remaining)" with Confirm / Cancel
- On confirm: optimistic update + mutation
- Non-premium: snowflake icon shown but locked; tap opens upgrade modal

**Edge cases:**
- If user already read today, no freeze needed — button is hidden
- If tokens = 0, button shows disabled state: "No freezes left this month"
- Freeze tokens shown on the upgrade modal as a premium benefit bullet

---

## Feature 2: Milestone Badges

### Concept
Badges are earned automatically when users hit defined milestones. They are displayed in a dedicated section on the profile page and trigger a toast notification on first earn.

### DB Changes

**New table:**
```sql
create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_key)
);
```

**RLS:** Users can read their own badges; all authenticated users can read others' badges (for public profile display). No user-initiated inserts — badges are awarded server-side or via trusted client logic.

### Badge Definitions (static JS object in `src/data/badges.js`)

| Key | Label | Trigger |
|---|---|---|
| `full_bible_read` | Read the Whole Bible | All 1,189 chapters checked |
| `streak_30` | 30-Day Streak | Streak reaches 30 |
| `streak_100` | 100-Day Streak | Streak reaches 100 |
| `streak_365` | Year-Long Streak | Streak reaches 365 |
| `quiz_all_levels` | Quiz Champion | All 12 levels completed |
| `first_note` | First Note | First study note saved |
| `first_group` | Group Member | Joined first study group |
| `plan_complete` | Plan Finisher | Completed first reading plan |
| `full_nt_read` | New Testament Complete | All NT chapters checked |
| `full_ot_read` | Old Testament Complete | All OT chapters checked |

### Badge Check Logic
Badge checks run client-side in existing hooks after relevant actions:
- After reading chapter marked: check `full_bible_read`, `full_nt_read`, `full_ot_read`
- After streak update: check `streak_30`, `streak_100`, `streak_365`
- After quiz level completed: check `quiz_all_levels`
- After note saved: check `first_note`
- After group join: check `first_group`
- After plan completed: check `plan_complete`

Each check calls a `useAwardBadge` mutation that inserts into `user_badges` (idempotent due to `unique` constraint — duplicate award is a no-op).

### UI

**Profile page — new Badges section:**
- Grid of badge icons (emoji or SVG) with label below
- Earned badges: full color with earned date on hover
- Unearned badges: grayscale + lock icon (shows what's possible)
- Section header: "Achievements (X / 10)"

**Toast notification on earn:**
- Triggered when `useAwardBadge` mutation succeeds with a new badge
- Content: "[Badge icon] Achievement Unlocked — [Badge Label]"
- Uses existing toast system

**Premium gate:**
- All badges are visible to all users (motivational)
- Earning is not gated — free users can earn `first_note`, `first_group` etc.
- Streak and quiz badges are earnable by free users too
- `full_bible_read` and `plan_complete` are earnable by all (reading tracker is free)

---

## Non-Goals
- No badge trading, gifting, or public leaderboard by badge count in this sprint
- No custom badge images — use emoji icons initially
- No server-side badge verification (trust client checks for now; idempotent inserts are safe)
