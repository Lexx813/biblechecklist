# Group Reading Challenge

**Date:** 2026-04-02  
**Status:** Approved  
**Premium gate:** Starting a challenge requires premium. Viewing group challenge progress is visible to all group members (including free members of the group, as a social incentive to upgrade).

---

## Overview

A study group admin can start a shared reading challenge — picking any of the existing reading plan templates. The group page shows each member's progress through the plan since the challenge started. No new reading tracking is introduced; progress is derived from the existing `reading_progress` table.

---

## DB Schema

**New table:**
```sql
create table group_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  plan_key text not null,           -- matches existing reading plan template key
  start_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  ended_at timestamptz             -- null = active; set when admin ends the challenge
);
create index on group_challenges (group_id, created_at desc);
```

**One active challenge per group** — enforced at the application level (not a DB constraint, to keep it simple). When a new challenge is started, the previous one is automatically ended (`ended_at = now()`).

**RLS:** All group members can read challenges for their group. Only group admins can insert/update.

---

## Progress Calculation

No new tracking table. Member progress is derived from the **existing `reading_progress` table** by:

1. Looking up the reading plan's book+chapter list for `plan_key`
2. Counting how many of those chapters the user has marked read with `read_at >= challenge.start_date`
3. Dividing by total chapters in the plan

```
progress_pct = chapters_read_since_start / total_chapters_in_plan
```

This is computed in a Supabase RPC function called by the groups page:
```sql
-- get_group_challenge_progress(challenge_id uuid)
-- Returns: user_id, display_name, avatar_url, chapters_done, total_chapters, pct
```

The RPC joins `group_members` → `reading_progress` filtered by plan chapters and date range.

**Stale time:** Progress is refreshed on group page load (React Query, 5-minute stale time).

---

## UI

### Group Detail Page

**New section: "Reading Challenge"** — appears below the group member list.

**When a challenge is active:**
- Plan name + start date
- Member progress list: avatar + display name + progress bar + % complete + "X chapters this week"
- Members who haven't started the plan: show "Not started" with 0%
- Group admin: "End Challenge" button (archived, not deleted)

**When no challenge is active:**
- "Start a Reading Challenge" CTA card (visible to all members)
- Tapping: if user is admin + premium → opens challenge picker
- Tapping: if user is not admin → "Ask your group admin to start a challenge"
- Tapping: if user is admin but not premium → upgrade CTA

**Challenge picker (modal):**
- Heading: "Choose a Reading Plan"
- List of existing plan templates (same 11 templates as in Reading Plans)
- Each shows: plan name, total chapters, estimated duration
- Select → Confirm → Challenge starts immediately from today

### Reading Plans Page (minor addition)

On the Reading Plans page, if the user is in a group with an active challenge using a plan they're also enrolled in, show a small "Group challenge active" badge on that plan card. Taps through to the group page.

---

## Edge Cases

**Member joins group after challenge started:** Their progress counts from the challenge start date, not their join date. They may appear behind at first — this is correct and expected.

**Member not enrolled in the plan:** Show 0% with a "Join Plan →" link that takes them to the Reading Plans page.

**Challenge plan key doesn't match any template:** Defensive — if a plan key becomes invalid, show "Plan unavailable" for that member.

**Multiple groups:** A user in multiple groups with active challenges sees a badge on each respective plan card.

---

## Non-Goals
- No challenge invitations or notifications at launch (group members see it when they visit the group page)
- No milestone alerts within the challenge (e.g., "Maria just hit 50%!")
- No custom plan support — challenges use existing templates only
- No completion rewards specific to challenges (existing badges cover plan completion)
