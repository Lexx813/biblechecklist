/**
 * refresh-freeze-tokens Edge Function
 *
 * Resets freeze_tokens = 2 for all premium users on the 1st of each month.
 * Scheduled via pg_cron or Supabase Scheduled Functions: "0 0 1 * *"
 *
 * Required secrets (auto-injected by Supabase):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return new Response("Misconfigured", { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

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
