import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function triggerSend(campaignId: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-campaign`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ campaign_id: campaignId }),
  });
  if (!res.ok) console.error(`Failed to trigger send for ${campaignId}:`, await res.text());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date().toISOString();

  // One-time scheduled campaigns that are due
  const { data: scheduled } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("schedule_at", now);

  // Recurring campaigns whose next_run_at is due
  const { data: recurring } = await supabase
    .from("email_campaigns")
    .select("id")
    .eq("status", "recurring")
    .lte("next_run_at", now);

  const due = [...(scheduled ?? []), ...(recurring ?? [])];

  if (!due.length) {
    return new Response(JSON.stringify({ ok: true, triggered: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Mark as sending before triggering to prevent double-sends
  await supabase
    .from("email_campaigns")
    .update({ status: "sending" })
    .in("id", due.map(c => c.id));

  await Promise.all(due.map(c => triggerSend(c.id)));

  console.log(`process-scheduled-campaigns: triggered ${due.length} campaigns`);
  return new Response(JSON.stringify({ ok: true, triggered: due.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
