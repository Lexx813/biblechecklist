/**
 * cancel-subscription Edge Function
 *
 * Lets an authenticated user cancel their own Stripe subscription.
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY         — sk_test_...
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^16.0.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const ALLOWED_ORIGINS = [
  "https://www.nwtprogress.com",
  "http://localhost:5173",
  "http://localhost:4173",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Fetch user's subscription ─────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_subscription_id, subscription_status")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return new Response(JSON.stringify({ error: "No active subscription found" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Cancel in Stripe ─────────────────────────────────────────────────────
    await stripe.subscriptions.cancel(profile.stripe_subscription_id);

    // ── Update profiles table ────────────────────────────────────────────────
    await supabase
      .from("profiles")
      .update({
        subscription_status: "canceled",
        stripe_subscription_id: null,
      })
      .eq("id", user.id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("cancel-subscription error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
