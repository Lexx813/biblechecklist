# Group Reading Challenge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let study group admins start a shared reading challenge (any existing plan template), show each member's progress since the challenge started, and surface a "Group challenge active" badge on the Reading Plans page.

**Architecture:** A new `group_challenges` table tracks active/ended challenges per group. Progress is derived from the existing `reading_progress` table via a Postgres RPC (`get_group_challenge_progress`). The group detail page gains a "Reading Challenge" section below the member list. One active challenge per group is enforced at the app level. The Reading Plans page gains a small badge on plan cards when the user is in a group with a matching active challenge.

**Tech Stack:** Next.js 15, React 19, Supabase (Postgres RLS + RPC), TanStack Query v5, vanilla CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/add_group_challenges.sql` | Create | `group_challenges` table, RLS, RPC for progress |
| `src/api/groupChallenge.js` | Create | getActiveChallenge, startChallenge, endChallenge, getChallengeProgress |
| `src/hooks/useGroupChallenge.js` | Create | useActiveChallenge, useStartChallenge, useEndChallenge, useChallengeProgress |
| `src/views/groups/GroupDetail.jsx` | Modify | Add "Reading Challenge" section below member list |
| `src/views/readingplans/ReadingPlansPage.jsx` | Modify | Add "Group challenge active" badge on plan cards |
| `src/styles/group-challenge.css` | Create | Challenge section, progress bars, picker modal styles |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/add_group_challenges.sql`

- [ ] **Step 1: Write migration**

First, check the correct name for the study groups table:
```sql
select table_name from information_schema.tables
where table_name like '%group%';
```
Expected: `study_groups`, `study_group_members`. Use these names in the migration.

```sql
-- supabase/migrations/add_group_challenges.sql

-- 1. Group challenges table
create table if not exists group_challenges (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references study_groups(id) on delete cascade,
  plan_key text not null,         -- matches key in readingPlanTemplates.js
  start_date date not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  ended_at timestamptz            -- null = active; set when admin ends the challenge
);

create index if not exists idx_group_challenges_group_created
  on group_challenges(group_id, created_at desc);

alter table group_challenges enable row level security;

-- All group members can read challenges for their group
create policy "Group members read challenges"
  on group_challenges for select
  using (
    exists (
      select 1 from study_group_members
      where study_group_members.group_id = group_challenges.group_id
        and study_group_members.user_id = auth.uid()
    )
  );

-- Only group admins can insert
create policy "Group admins insert challenges"
  on group_challenges for insert
  with check (
    exists (
      select 1 from study_group_members
      where study_group_members.group_id = group_challenges.group_id
        and study_group_members.user_id = auth.uid()
        and study_group_members.role = 'admin'
    )
  );

-- Only group admins can update (to set ended_at)
create policy "Group admins update challenges"
  on group_challenges for update
  using (
    exists (
      select 1 from study_group_members
      where study_group_members.group_id = group_challenges.group_id
        and study_group_members.user_id = auth.uid()
        and study_group_members.role = 'admin'
    )
  );
```

- [ ] **Step 2: Add the progress RPC**

Append to the same migration file:

```sql
-- 2. RPC: get_group_challenge_progress(challenge_id uuid)
-- Returns: user_id, display_name, avatar_url, chapters_done, total_chapters, pct
--
-- NOTE: reading_progress stores chapter completion. We need to know which books+chapters
-- are in the plan. Since plan templates are defined in JS (readingPlanTemplates.js),
-- we pass the plan chapters as a JSON array parameter from the client.
--
-- Signature: get_group_challenge_progress(
--   p_challenge_id uuid,
--   p_plan_chapters jsonb  -- array of {bookIndex, chapter} objects
-- )

create or replace function get_group_challenge_progress(
  p_challenge_id uuid,
  p_plan_chapters jsonb  -- [{bookIndex: int, chapter: int}, ...]
)
returns table(
  user_id uuid,
  display_name text,
  avatar_url text,
  chapters_done int,
  total_chapters int,
  pct numeric
)
language plpgsql
security definer
as $$
declare
  v_group_id uuid;
  v_start_date date;
  v_total int;
begin
  -- Look up the challenge
  select gc.group_id, gc.start_date
  into v_group_id, v_start_date
  from group_challenges gc
  where gc.id = p_challenge_id;

  if v_group_id is null then
    return;
  end if;

  v_total := jsonb_array_length(p_plan_chapters);

  return query
  select
    m.user_id,
    coalesce(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    count(rp.id)::int as chapters_done,
    v_total as total_chapters,
    case when v_total > 0
      then round(count(rp.id)::numeric / v_total * 100, 1)
      else 0
    end as pct
  from study_group_members m
  join profiles p on p.id = m.user_id
  left join reading_progress rp on rp.user_id = m.user_id
    and rp.read_at::date >= v_start_date
    -- Match plan chapters: check if (book_index, chapter) is in the plan
    and exists (
      select 1
      from jsonb_array_elements(p_plan_chapters) as pc
      where (pc->>'bookIndex')::int = rp.book_index
        and (pc->>'chapter')::int = rp.chapter
    )
  where m.group_id = v_group_id
  group by m.user_id, p.display_name, p.avatar_url
  order by chapters_done desc, p.display_name;
end;
$$;
```

Note: This assumes `reading_progress` has columns `user_id`, `book_index`, `chapter`, `read_at`. Verify column names:
```sql
select column_name from information_schema.columns
where table_name = 'reading_progress' limit 20;
```
Adjust `rp.book_index`, `rp.chapter`, `rp.read_at` to match actual column names.

- [ ] **Step 3: Apply migration**

Run in Supabase SQL editor or `supabase db push`.

- [ ] **Step 4: Verify**

```sql
-- Verify table
select table_name from information_schema.tables where table_name = 'group_challenges';

-- Verify RPC exists
select proname from pg_proc where proname = 'get_group_challenge_progress';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/add_group_challenges.sql
git commit -m "feat: add group_challenges table and get_group_challenge_progress RPC"
```

---

## Task 2: Group Challenge API

**Files:**
- Create: `src/api/groupChallenge.js`

- [ ] **Step 1: Check plan templates structure**

Open `src/data/readingPlanTemplates.js` and note:
- How plan keys are defined (e.g., `key: "chronological"`)
- How chapters are listed (e.g., `chapters: [{bookIndex: 0, chapter: 1}, ...]` or similar)

The `p_plan_chapters` RPC parameter needs `[{bookIndex, chapter}]` for each chapter in the plan. The client builds this from the template data.

- [ ] **Step 2: Write the API**

```js
// src/api/groupChallenge.js
import { supabase } from "../lib/supabase";
import { READING_PLAN_TEMPLATES } from "../data/readingPlanTemplates";

// Build the flat chapter list for a plan key
function getPlanChapters(planKey) {
  const template = READING_PLAN_TEMPLATES.find((t) => t.key === planKey);
  if (!template) return [];
  // Assumes template.chapters is [{bookIndex, chapter}] or similar
  // Adjust based on actual data structure in readingPlanTemplates.js
  return template.chapters ?? [];
}

export const groupChallengeApi = {
  getActiveChallenge: async (groupId) => {
    const { data, error } = await supabase
      .from("group_challenges")
      .select("id, group_id, plan_key, start_date, created_by, created_at")
      .eq("group_id", groupId)
      .is("ended_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  startChallenge: async (groupId, planKey, userId) => {
    // End any existing active challenge first
    await supabase
      .from("group_challenges")
      .update({ ended_at: new Date().toISOString() })
      .eq("group_id", groupId)
      .is("ended_at", null);

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("group_challenges")
      .insert({
        group_id: groupId,
        plan_key: planKey,
        start_date: today,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  endChallenge: async (challengeId) => {
    const { error } = await supabase
      .from("group_challenges")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", challengeId);

    if (error) throw error;
  },

  getChallengeProgress: async (challengeId, planKey) => {
    const planChapters = getPlanChapters(planKey);
    const { data, error } = await supabase.rpc("get_group_challenge_progress", {
      p_challenge_id: challengeId,
      p_plan_chapters: planChapters,
    });

    if (error) throw error;
    return data ?? [];
  },

  // Used by ReadingPlansPage to find if user's group has a challenge for a given plan
  getUserGroupChallenges: async (userId) => {
    // Get all groups the user belongs to, then find active challenges
    const { data: memberRows, error: memberError } = await supabase
      .from("study_group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (memberError) throw memberError;

    const groupIds = (memberRows ?? []).map((r) => r.group_id);
    if (!groupIds.length) return [];

    const { data, error } = await supabase
      .from("group_challenges")
      .select("id, group_id, plan_key, start_date")
      .in("group_id", groupIds)
      .is("ended_at", null);

    if (error) throw error;
    return data ?? [];
  },
};
```

- [ ] **Step 3: Verify plan template structure**

After checking `readingPlanTemplates.js`, update `getPlanChapters` if the structure differs. The RPC needs `[{bookIndex: number, chapter: number}]`.

- [ ] **Step 4: Build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/api/groupChallenge.js
git commit -m "feat: add group challenge API functions"
```

---

## Task 3: Group Challenge Hooks

**Files:**
- Create: `src/hooks/useGroupChallenge.js`

- [ ] **Step 1: Write hooks**

```js
// src/hooks/useGroupChallenge.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupChallengeApi } from "../api/groupChallenge";

export function useActiveChallenge(groupId) {
  return useQuery({
    queryKey: ["groupChallenge", groupId],
    queryFn: () => groupChallengeApi.getActiveChallenge(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChallengeProgress(challengeId, planKey) {
  return useQuery({
    queryKey: ["challengeProgress", challengeId],
    queryFn: () => groupChallengeApi.getChallengeProgress(challengeId, planKey),
    enabled: !!challengeId && !!planKey,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStartChallenge(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planKey, userId }) =>
      groupChallengeApi.startChallenge(groupId, planKey, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupChallenge", groupId] });
    },
  });
}

export function useEndChallenge(groupId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId) => groupChallengeApi.endChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupChallenge", groupId] });
    },
  });
}

export function useUserGroupChallenges(userId) {
  return useQuery({
    queryKey: ["userGroupChallenges", userId],
    queryFn: () => groupChallengeApi.getUserGroupChallenges(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGroupChallenge.js
git commit -m "feat: add group challenge React hooks"
```

---

## Task 4: Reading Challenge CSS

**Files:**
- Create: `src/styles/group-challenge.css`

- [ ] **Step 1: Write CSS**

```css
/* src/styles/group-challenge.css */

/* ── Section wrapper ───────────────────────────────────────── */
.gc-section {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.gc-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
}

/* ── No active challenge ───────────────────────────────────── */
.gc-start-card {
  background: var(--card-bg);
  border: 1px dashed var(--border);
  border-radius: 14px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
}

.gc-start-card:hover {
  background: var(--surface-hover);
}

.gc-start-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.gc-start-sub {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* ── Active challenge ──────────────────────────────────────── */
.gc-active-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 12px;
}

.gc-plan-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
}

.gc-start-date {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.gc-end-btn {
  padding: 5px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.gc-end-btn:hover {
  background: var(--surface-hover);
}

/* ── Member progress list ──────────────────────────────────── */
.gc-member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gc-member-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gc-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--border);
  object-fit: cover;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  overflow: hidden;
}

.gc-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gc-member-info {
  flex: 1;
  min-width: 0;
}

.gc-member-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.gc-progress-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  overflow: hidden;
}

.gc-progress-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--accent);
  transition: width 0.4s ease;
}

.gc-member-pct {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
}

.gc-not-started {
  font-size: 0.78rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* ── Challenge picker modal ────────────────────────────────── */
.gc-picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
}

@media (min-width: 540px) {
  .gc-picker-overlay { align-items: center; }
}

.gc-picker-sheet {
  background: var(--card-bg);
  border-radius: 22px 22px 0 0;
  padding: 24px 20px 32px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  animation: gc-slide-up 0.2s ease both;
}

@media (min-width: 540px) {
  .gc-picker-sheet { border-radius: 18px; }
}

@keyframes gc-slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .gc-picker-sheet { animation: none; }
}

.gc-picker-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 14px;
  color: var(--text);
}

.gc-picker-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.gc-picker-item {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 2px solid var(--border);
  background: var(--card-bg);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s;
}

.gc-picker-item:hover {
  background: var(--surface-hover);
}

.gc-picker-item--selected {
  border-color: var(--accent);
}

.gc-picker-item-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}

.gc-picker-item-meta {
  font-size: 0.77rem;
  color: var(--text-secondary);
}

.gc-picker-confirm {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.gc-picker-confirm:hover { opacity: 0.9; }
.gc-picker-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Reading Plans page badge ──────────────────────────────── */
.rp-challenge-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--accent) 15%, transparent);
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/group-challenge.css
git commit -m "feat: add group challenge CSS"
```

---

## Task 5: Reading Challenge Section in GroupDetail

**Files:**
- Modify: `src/views/groups/GroupDetail.jsx`

- [ ] **Step 1: Add imports to GroupDetail**

```js
import { useState } from "react";
import { createPortal } from "react-dom";
import { READING_PLAN_TEMPLATES } from "../../data/readingPlanTemplates";
import {
  useActiveChallenge,
  useStartChallenge,
  useEndChallenge,
  useChallengeProgress,
} from "../../hooks/useGroupChallenge";
import { useSubscription } from "../../hooks/useSubscription";
import "../../styles/group-challenge.css";
```

- [ ] **Step 2: Add ChallengePicker modal component (inside GroupDetail.jsx)**

```jsx
// Add before the GroupDetail component

function ChallengePicker({ onConfirm, onClose }) {
  const [selectedKey, setSelectedKey] = useState(READING_PLAN_TEMPLATES[0]?.key ?? "");

  return createPortal(
    <div
      className="gc-picker-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="gc-picker-sheet" role="dialog" aria-modal="true">
        <h2 className="gc-picker-title">Choose a Reading Plan</h2>
        <div className="gc-picker-list">
          {READING_PLAN_TEMPLATES.map((template) => (
            <button
              key={template.key}
              className={`gc-picker-item${selectedKey === template.key ? " gc-picker-item--selected" : ""}`}
              onClick={() => setSelectedKey(template.key)}
            >
              <div className="gc-picker-item-name">{template.name}</div>
              <div className="gc-picker-item-meta">
                {template.totalChapters ?? template.chapters?.length ?? "?"} chapters
                {template.estimatedDays ? ` · ~${template.estimatedDays} days` : ""}
              </div>
            </button>
          ))}
        </div>
        <button
          className="gc-picker-confirm"
          disabled={!selectedKey}
          onClick={() => selectedKey && onConfirm(selectedKey)}
        >
          Start Challenge →
        </button>
      </div>
    </div>,
    document.body
  );
}
```

Note: `template.totalChapters`, `template.estimatedDays`, and `template.name` depend on the actual shape of `READING_PLAN_TEMPLATES`. Adjust property names after checking `src/data/readingPlanTemplates.js`.

- [ ] **Step 3: Add ChallengeSection component (inside GroupDetail.jsx)**

```jsx
function ChallengeSection({ groupId, currentUser, isAdmin, onUpgrade }) {
  const { isPremium } = useSubscription(currentUser?.id);
  const { data: challenge, isLoading: challengeLoading } = useActiveChallenge(groupId);
  const { data: progress = [], isLoading: progressLoading } = useChallengeProgress(
    challenge?.id,
    challenge?.plan_key
  );
  const startChallenge = useStartChallenge(groupId);
  const endChallenge = useEndChallenge(groupId);
  const [showPicker, setShowPicker] = useState(false);

  if (challengeLoading) return null;

  const planName = READING_PLAN_TEMPLATES.find((t) => t.key === challenge?.plan_key)?.name
    ?? challenge?.plan_key;

  function handleStartClick() {
    if (!isAdmin) return; // non-admins see info text, handled below
    if (!isPremium) { onUpgrade?.(); return; }
    setShowPicker(true);
  }

  return (
    <section className="gc-section">
      <h2 className="gc-section-title">Reading Challenge</h2>

      {!challenge ? (
        // No active challenge
        <div
          className="gc-start-card"
          onClick={handleStartClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleStartClick()}
        >
          <p className="gc-start-label">+ Start a Reading Challenge</p>
          <p className="gc-start-sub">
            {isAdmin
              ? (isPremium ? "Pick a plan and track the whole group's progress" : "✦ Requires Premium")
              : "Ask your group admin to start a challenge"}
          </p>
        </div>
      ) : (
        // Active challenge
        <>
          <div className="gc-active-header">
            <div>
              <div className="gc-plan-name">{planName}</div>
              <div className="gc-start-date">
                Started {new Date(challenge.start_date).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </div>
            </div>
            {isAdmin && (
              <button
                className="gc-end-btn"
                onClick={() => endChallenge.mutate(challenge.id)}
                disabled={endChallenge.isPending}
              >
                End Challenge
              </button>
            )}
          </div>

          {progressLoading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ) : (
            <ul className="gc-member-list" style={{ listStyle: "none", padding: 0 }}>
              {progress.map((member) => (
                <li key={member.user_id} className="gc-member-row">
                  <span className="gc-avatar">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.display_name} />
                      : member.display_name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <div className="gc-member-info">
                    <div className="gc-member-name">{member.display_name}</div>
                    {member.chapters_done > 0 ? (
                      <div className="gc-progress-bar">
                        <div
                          className="gc-progress-fill"
                          style={{ width: `${member.pct}%` }}
                        />
                      </div>
                    ) : (
                      <span className="gc-not-started">Not started</span>
                    )}
                  </div>
                  <span className="gc-member-pct">
                    {member.chapters_done > 0 ? `${member.pct}%` : "0%"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {showPicker && (
        <ChallengePicker
          onConfirm={(planKey) => {
            startChallenge.mutate({ planKey, userId: currentUser?.id });
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </section>
  );
}
```

- [ ] **Step 4: Add ChallengeSection to GroupDetail render**

Find where the group member list ends in `GroupDetail.jsx` and add:
```jsx
<ChallengeSection
  groupId={groupId}
  currentUser={user}
  isAdmin={isAdmin}  // determine from existing group member role check
  onUpgrade={onUpgrade}
/>
```

The `isAdmin` value is likely already computed from the group member data in `GroupDetail.jsx`. Use the existing pattern.

- [ ] **Step 5: Manual verify**

```bash
npm run dev
# Navigate to a group detail page
# Verify: "Reading Challenge" section appears below member list
# No active challenge: CTA card shown
# As non-admin: "Ask your group admin to start a challenge"
# As admin (free): "✦ Requires Premium" — tapping opens upgrade modal
# As admin (premium): tap opens plan picker modal
# Select plan → confirm → challenge starts, progress list shows all members at 0%
# Mark some chapters in Reading Plans → return to group, progress updates
# Admin: "End Challenge" button appears, tap ends it
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/views/groups/GroupDetail.jsx
git commit -m "feat: add Reading Challenge section to group detail page"
```

---

## Task 6: Group Challenge Badge on Reading Plans Page

**Files:**
- Modify: `src/views/readingplans/ReadingPlansPage.jsx`

- [ ] **Step 1: Add imports**

```js
import { useUserGroupChallenges } from "../../hooks/useGroupChallenge";
```

- [ ] **Step 2: Fetch user group challenges**

Inside `ReadingPlansPage` component:
```js
const { data: groupChallenges = [] } = useUserGroupChallenges(user?.id);
const activeChallengeKeys = new Set(groupChallenges.map((c) => c.plan_key));
```

- [ ] **Step 3: Add badge to plan cards**

Find where plan cards are rendered. After the plan name/description, add:
```jsx
{activeChallengeKeys.has(plan.key) && (
  <span className="rp-challenge-badge">
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
    Group challenge active
  </span>
)}
```

The `plan.key` must match the `plan_key` stored in `group_challenges`. Verify the plan key naming convention matches between `readingPlanTemplates.js` and what gets stored in the DB.

- [ ] **Step 4: Manual verify**

```bash
npm run dev
# Start a challenge in a group for plan X
# Navigate to Reading Plans page
# Verify plan X card shows "Group challenge active" badge
# For plans with no active challenge, no badge shown
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/views/readingplans/ReadingPlansPage.jsx
git commit -m "feat: show group challenge active badge on reading plan cards"
```

---

## Self-Review Checklist

- [ ] `group_challenges` table created with correct RLS (group members read, admins insert/update)
- [ ] `get_group_challenge_progress` RPC returns progress rows with `user_id, display_name, avatar_url, chapters_done, total_chapters, pct`
- [ ] `reading_progress` column names verified and matching the RPC query
- [ ] Starting a challenge ends any previous active challenge (app-level enforcement)
- [ ] Challenge picker shows all plan templates with name + chapter count
- [ ] Non-admin sees "Ask your group admin" message (not the picker)
- [ ] Admin + free user sees upgrade CTA (not the picker)
- [ ] Admin + premium user can start challenge
- [ ] Member joining after challenge start shows progress from `challenge.start_date` (correct — RPC uses `start_date` filter)
- [ ] Member not enrolled in plan shows 0% with `Not started` state
- [ ] "End Challenge" sets `ended_at` (not deletes)
- [ ] "Group challenge active" badge only shows for plans matching an active challenge
- [ ] `isPremium` uses existing `useSubscription` hook (covers active/trialing/gifted) ✅
- [ ] `npm run build` passes with no errors
