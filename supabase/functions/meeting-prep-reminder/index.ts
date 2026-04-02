/**
 * Meeting Prep Reminder — runs Tuesday evenings at 7pm UTC
 * Inserts a notification row for each premium user who:
 *   1. Has push subscriptions registered
 *   2. Has incomplete prep for the current week
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
  const weekStart = getMondayOfCurrentWeek();
  let notified = 0;
  let skipped = 0;

  // 1. Find all users who have push subscriptions
  const { data: subscribers, error: subError } = await supabase
    .from("push_subscriptions")
    .select("user_id")
    .not("endpoint", "is", null);

  if (subError) {
    console.error("meeting-prep-reminder: fetch subscribers error:", subError);
    return new Response(JSON.stringify({ error: subError.message }), { status: 500 });
  }

  const userIds = [...new Set((subscribers ?? []).map((s: { user_id: string }) => s.user_id))];
  if (!userIds.length) {
    return new Response(JSON.stringify({ notified: 0, reason: "no subscribers" }), { status: 200 });
  }

  // 2. Filter to premium users only
  const { data: premiumProfiles } = await supabase
    .from("profiles")
    .select("id")
    .in("id", userIds)
    .in("subscription_status", ["active", "trialing", "gifted"]);

  const premiumIds = (premiumProfiles ?? []).map((p: { id: string }) => p.id);
  if (!premiumIds.length) {
    return new Response(JSON.stringify({ notified: 0, reason: "no premium subscribers" }), { status: 200 });
  }

  // 3. Get this week's meeting week record to know total parts
  const { data: meetingWeek } = await supabase
    .from("meeting_weeks")
    .select("clam_parts")
    .eq("week_start", weekStart)
    .maybeSingle();

  const clamParts: unknown[] = meetingWeek?.clam_parts ?? [];
  const totalParts = clamParts.length;
  const effectiveTotal = totalParts > 0 ? totalParts : 9;

  // 4. Get existing prep records for this week
  const { data: prepRecords } = await supabase
    .from("user_meeting_prep")
    .select("user_id, clam_checked")
    .eq("week_start", weekStart)
    .in("user_id", premiumIds);

  const prepMap = Object.fromEntries(
    (prepRecords ?? []).map((r: { user_id: string; clam_checked: Record<string, boolean> | null }) => [
      r.user_id,
      r.clam_checked ?? {},
    ])
  );

  // 5. Insert notification rows for users who haven't fully prepared
  for (const userId of premiumIds) {
    const checked = prepMap[userId] ?? {};
    const doneCount = Object.values(checked as Record<string, boolean>).filter(Boolean).length;

    if (doneCount >= effectiveTotal) {
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

  console.log(`meeting-prep-reminder: notified=${notified}, skipped=${skipped}, week=${weekStart}`);
  return new Response(
    JSON.stringify({ notified, skipped, week: weekStart }),
    { status: 200 }
  );
});
