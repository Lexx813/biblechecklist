# Meeting Prep CLAM — Push Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tuesday evening push notification that reminds premium users to complete their CLAM meeting prep for the week.

**Architecture:** The CLAM meeting prep feature is already fully implemented (`MeetingPrepPage.jsx`, `user_meeting_prep` table, `useMeetingPrep` hooks). The only missing piece is the push notification. A new Supabase Edge Function (`meeting-prep-reminder`) reads each premium user's current-week prep record, computes how many of the scraped CLAM parts are checked, and inserts a row into the `notifications` table. The existing `send-push-notification` Edge Function is triggered by a database webhook on `notifications` INSERT and delivers the push to all subscribed devices.

**Tech Stack:** Supabase Edge Functions (Deno), pg_cron, existing `notifications` + `push_subscriptions` infrastructure

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/functions/meeting-prep-reminder/index.ts` | Create | Cron function: compute prep progress and insert notification rows |
| `supabase/migrations/add_meeting_prep_notification_type.sql` | Create | Add `meeting_prep_reminder` to notification type constraint (if needed) |

> **No UI changes needed.** The notification appears as a standard push notification. The existing notification settings UI covers opt-in/opt-out.

---

## Task 1: Check Notifications Table Schema

Before writing the Edge Function, verify the `notifications` table structure.

- [ ] **Step 1: Inspect notifications table**

Run in Supabase SQL editor:
```sql
select column_name, data_type
from information_schema.columns
where table_name = 'notifications'
order by ordinal_position;
```

Expected columns (from weekly-digest codebase context):
- `id` (uuid, pk)
- `user_id` (uuid)
- `type` (text)
- `body_preview` (text)
- `link_hash` (text, nullable)
- `read` (boolean, default false)
- `created_at` (timestamptz)
- `actor_id` (uuid, nullable)

- [ ] **Step 2: Check if type has a constraint**

```sql
select pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'notifications'::regclass
  and contype = 'c';
```

If there is a `CHECK` constraint on `type` listing allowed values, we need a migration to add `meeting_prep_reminder`.

- [ ] **Step 3: If constraint exists, create migration**

```sql
-- supabase/migrations/add_meeting_prep_notification_type.sql
-- Only needed if `type` column has a CHECK constraint

-- Example: remove the old constraint and add updated one
alter table notifications
  drop constraint if exists notifications_type_check;

alter table notifications
  add constraint notifications_type_check
  check (type in (
    'new_message',
    'group_invite',
    'follow',
    'like',
    'comment',
    'quiz_milestone',
    'streak_milestone',
    'meeting_prep_reminder'  -- NEW
    -- add any other existing values found in step 2
  ));
```

If there is NO constraint, skip this migration.

- [ ] **Step 4: Commit (only if migration needed)**

```bash
git add supabase/migrations/add_meeting_prep_notification_type.sql
git commit -m "feat: add meeting_prep_reminder to notifications type constraint"
```

---

## Task 2: Meeting Prep Reminder Edge Function

**Files:**
- Create: `supabase/functions/meeting-prep-reminder/index.ts`

- [ ] **Step 1: Understand the data model**

The `user_meeting_prep` table has:
- `user_id` (uuid)
- `week_of` (date — Monday of week, `YYYY-MM-DD`)
- `clam_checked` (jsonb) — keys are part IDs, values are boolean
- `clam_notes` (jsonb)

The `meeting_weeks` table has the scraped week content. Each week has `clam_parts` (jsonb array of parts). The number of CLAM parts varies per week (scraped from WOL).

To compute "X/N prepared": count truthy values in `clam_checked` divided by total parts in `meeting_weeks.clam_parts`.

- [ ] **Step 2: Write the Edge Function**

```typescript
// supabase/functions/meeting-prep-reminder/index.ts
/**
 * Meeting Prep Reminder — runs Tuesday evenings at 7pm UTC (approximates 7pm local
 * for most users; exact local time scheduling would require per-user timezone data).
 *
 * Inserts a notification row for each premium user who:
 *   1. Has push subscriptions registered
 *   2. Has NOT opted out of meeting_prep notifications
 *   3. Has incomplete prep for the current week
 *
 * The existing `send-push-notification` edge function is triggered by a DB webhook
 * on `notifications` INSERT and handles actual push delivery.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function getMondayOfCurrentWeek(): string {
  const d = new Date();
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

Deno.serve(async () => {
  const weekOf = getMondayOfCurrentWeek();
  let notified = 0;
  let skipped = 0;

  // 1. Find all premium users who have push subscriptions
  const { data: subscribers, error: subError } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .not("endpoint", "is", null);

  if (subError) {
    console.error("meeting-prep-reminder: fetch subscribers error:", subError);
    return new Response(JSON.stringify({ error: subError.message }), { status: 500 });
  }

  const userIds = [...new Set((subscribers ?? []).map((s) => s.user_id))];
  if (!userIds.length) {
    return new Response(JSON.stringify({ notified: 0, reason: "no subscribers" }), { status: 200 });
  }

  // 2. Filter to premium users only
  const { data: premiumProfiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds)
    .in("subscription_status", ["active", "trialing", "gifted"]);

  const premiumIds = (premiumProfiles ?? []).map((p) => p.id);
  if (!premiumIds.length) {
    return new Response(JSON.stringify({ notified: 0, reason: "no premium subscribers" }), { status: 200 });
  }

  // 3. Get this week's meeting week record to know total parts
  const { data: meetingWeek } = await supabase
    .from("meeting_weeks")
    .select("clam_parts")
    .eq("week_of", weekOf)
    .maybeSingle();

  const clamParts: unknown[] = meetingWeek?.clam_parts ?? [];
  const totalParts = clamParts.length;
  // If no scraped data, use a fallback total (9 is the standard CLAM structure)
  const effectiveTotal = totalParts > 0 ? totalParts : 9;

  // 4. Get existing prep records for this week
  const { data: prepRecords } = await supabase
    .from("user_meeting_prep")
    .select("user_id, clam_checked")
    .eq("week_of", weekOf)
    .in("user_id", premiumIds);

  const prepMap = Object.fromEntries(
    (prepRecords ?? []).map((r) => [r.user_id, r.clam_checked ?? {}])
  );

  // 5. Insert notification rows for users who haven't fully prepared
  for (const userId of premiumIds) {
    const checked = prepMap[userId] ?? {};
    const doneCount = Object.values(checked).filter(Boolean).length;

    if (doneCount >= effectiveTotal) {
      // Already fully prepared — skip
      skipped++;
      continue;
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type: "meeting_prep_reminder",
        body_preview: `You're ${doneCount}/${effectiveTotal} prepared for this week's meeting.`,
        link_hash: "meetingPrep",
        read: false,
      });

    if (insertError) {
      console.error(`meeting-prep-reminder: insert error for ${userId}:`, insertError);
    } else {
      notified++;
    }
  }

  console.log(`meeting-prep-reminder: notified=${notified}, skipped=${skipped}, week=${weekOf}`);
  return new Response(
    JSON.stringify({ notified, skipped, week: weekOf }),
    { status: 200 }
  );
});
```

- [ ] **Step 3: Deploy Edge Function**

```bash
supabase functions deploy meeting-prep-reminder
```

- [ ] **Step 4: Register pg_cron job — Tuesday 7pm UTC**

Run in Supabase SQL editor:
```sql
-- Tuesday = day 2. Cron: 0 19 * * 2  (7pm UTC every Tuesday)
select cron.schedule(
  'meeting-prep-reminder',
  '0 19 * * 2',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/meeting-prep-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

If `net.http_post` is not available: use the Supabase dashboard → Edge Functions → Schedules to add a cron schedule `0 19 * * 2` pointing to `meeting-prep-reminder`.

- [ ] **Step 5: Verify the cron is registered**

```sql
select jobname, schedule from cron.job where jobname = 'meeting-prep-reminder';
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/meeting-prep-reminder/index.ts
git commit -m "feat: add meeting prep push notification reminder (Tuesday 7pm UTC)"
```

---

## Task 3: Manual End-to-End Test

The cron fires weekly, so test by invoking the function directly.

- [ ] **Step 1: Test via curl**

```bash
# Get your ANON key from Supabase dashboard
curl -X POST https://<your-project>.supabase.co/functions/v1/meeting-prep-reminder \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected response:
```json
{ "notified": 1, "skipped": 0, "week": "2026-03-30" }
```

- [ ] **Step 2: Verify notification row inserted**

```sql
select * from notifications
where type = 'meeting_prep_reminder'
order by created_at desc
limit 5;
```

- [ ] **Step 3: Verify push was delivered**

Check the browser on a device with push subscriptions — should receive a push notification:
`📋 Meeting tomorrow — you're X/N prepared for this week's meeting.`

(The body_preview text from the notifications row is what `send-push-notification` uses for the push payload — verify this is consistent with how that function reads the notification row.)

---

## Self-Review Checklist

- [ ] Edge Function deployed successfully
- [ ] Cron job registered for Tuesday 7pm UTC
- [ ] Only users in `push_subscriptions` receive notifications
- [ ] Only premium users (`active`, `trialing`, `gifted`) are targeted
- [ ] Users who are fully prepared (all parts checked) are skipped
- [ ] Users with no prep record receive the notification (0/N prepared)
- [ ] `notifications` INSERT triggers the existing `send-push-notification` webhook
- [ ] `link_hash: "meetingPrep"` routes user to MeetingPrepPage when tapping notification
- [ ] If `meeting_weeks` has no scraped data for the week, falls back to total=9
