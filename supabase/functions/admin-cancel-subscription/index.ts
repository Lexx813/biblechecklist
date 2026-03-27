/**
 * admin-cancel-subscription Edge Function
 *
 * Called by an admin to cancel a user's Stripe subscription.
 * Verifies the caller is an admin, cancels the Stripe subscription,
 * and updates the profiles table.
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY         — sk_test_...
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   SUPABASE_ANON_KEY         — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^16.0.0";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401, cors);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401, cors);

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!callerProfile?.is_admin) return json({ error: "Forbidden" }, 403, cors);

    const { userId } = await req.json() as { userId: string };
    if (!userId) return json({ error: "userId required" }, 400, cors);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_subscription_id) {
      return json({ error: "No active subscription found" }, 400, cors);
    }

    await stripe.subscriptions.cancel(profile.stripe_subscription_id);

    await supabaseAdmin
      .from("profiles")
      .update({ subscription_status: "canceled", stripe_subscription_id: null })
      .eq("id", userId);

    return json({ ok: true }, 200, cors);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("admin-cancel-subscription error:", err);
    return json({ error: message }, 500, cors);
  }
});
