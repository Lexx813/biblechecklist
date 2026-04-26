/**
 * daily-brief-reminder Edge Function
 *
 * Runs once per day via Supabase cron (recommended: 14:00 UTC ≈ 9am EST / 8am CST / 9am Bogota).
 * Finds users who:
 *   1. Have at least one active push_subscription (opted into push)
 *   2. Have been active in the last 14 days (last_active_at)
 *   3. Have NOT dismissed today's brief (daily_briefs.dismissed_until in future)
 *
 * Inserts a `daily_brief` notification per candidate. The existing notifications
 * INSERT webhook fires the push automatically (send-push-notification fn).
 *
 * The brief itself is NOT generated here — it generates lazily on /api/daily-brief
 * when the user actually opens the app. This keeps cost bounded (no AI call for
 * users who never come back).
 *
 * Required secrets:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   CRON_SECRET               — shared secret to prevent unauthorized calls
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Fail closed — reject if env var missing
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return new Response("Misconfigured", { status: 503 });
  if (req.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const todayStart = new Date().toISOString().slice(0, 10) + "T00:00:00Z";

  // Step 1: distinct user_ids with at least one push subscription
  const { data: subRows, error: subErr } = await supabase
    .from("push_subscriptions")
    .select("user_id");
  if (subErr) {
    console.error("daily-brief-reminder: push_subscriptions error", subErr);
    return new Response(JSON.stringify({ error: subErr.message }), { status: 500 });
  }
  const pushUserIds = Array.from(new Set((subRows ?? []).map((r: { user_id: string }) => r.user_id)));
  if (pushUserIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no push subscribers" }), { status: 200 });
  }

  // Step 2: filter to users active in the last 14 days
  const { data: activeProfiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", pushUserIds)
    .gte("last_active_at", fourteenDaysAgo);
  if (profErr) {
    console.error("daily-brief-reminder: profiles error", profErr);
    return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
  }
  const activeIds = (activeProfiles ?? []).map((p: { id: string }) => p.id);
  if (activeIds.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "no active push subscribers" }), { status: 200 });
  }

  // Step 3: exclude users who dismissed today's brief
  const { data: dismissedRows } = await supabase
    .from("daily_briefs")
    .select("user_id, dismissed_until")
    .in("user_id", activeIds)
    .gte("dismissed_until", new Date().toISOString());
  const dismissedSet = new Set((dismissedRows ?? []).map((r: { user_id: string }) => r.user_id));

  // Step 4: exclude users who already received today's notification (idempotent)
  const { data: alreadySentRows } = await supabase
    .from("notifications")
    .select("user_id")
    .eq("type", "daily_brief")
    .gte("created_at", todayStart)
    .in("user_id", activeIds);
  const alreadySentSet = new Set((alreadySentRows ?? []).map((r: { user_id: string }) => r.user_id));

  const recipients = activeIds.filter((id: string) => !dismissedSet.has(id) && !alreadySentSet.has(id));
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ sent: 0, reason: "all dismissed or already notified" }), { status: 200 });
  }

  // Step 5: insert notifications — push + email webhooks fire automatically
  const notifications = recipients.map((id: string) => ({
    user_id: id,
    actor_id: id,
    type: "daily_brief",
    body_preview: "Your day with the Companion is ready. Open the app to see today's brief.",
    link_hash: "ai",
    read: false,
  }));

  const { error: insErr } = await supabase.from("notifications").insert(notifications);
  if (insErr) {
    console.error("daily-brief-reminder: insert error", insErr);
    return new Response(JSON.stringify({ error: insErr.message }), { status: 500 });
  }

  console.log(`daily-brief-reminder: sent ${notifications.length} reminders`);
  return new Response(JSON.stringify({ sent: notifications.length }), { status: 200 });
});
