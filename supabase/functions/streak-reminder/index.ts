/**
 * streak-reminder Edge Function
 *
 * Runs daily (via Supabase cron) at 7 PM UTC.
 * Finds users who have an active streak but haven't read today,
 * inserts a streak_reminder notification for each — which triggers
 * the existing push-notification and email webhooks automatically.
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
  // Only allow POST from cron or authorized caller
  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Find users who:
  // 1. Have read at least once in the last 7 days (active streak candidate)
  // 2. Have NOT logged reading activity today
  // 3. Have at least one push subscription (opted into push notifications)
  const { data: candidates, error } = await supabase.rpc(
    "get_streak_reminder_candidates",
    { p_today: today },
  );

  if (error) {
    console.error("streak-reminder: RPC error", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Insert a streak_reminder notification for each candidate
  // The existing DB webhooks will fire push + email automatically
  const notifications = candidates.map((c: { user_id: string; streak: number }) => ({
    user_id: c.user_id,
    actor_id: c.user_id,
    type: "streak_reminder",
    body_preview: `Don't break your ${c.streak}-day reading streak! Open the app to log your reading for today.`,
    link_hash: "checklist",
    read: false,
  }));

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    console.error("streak-reminder: insert error", insertError);
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  console.log(`streak-reminder: sent ${notifications.length} reminders for ${today}`);
  return new Response(JSON.stringify({ sent: notifications.length }), { status: 200 });
});
