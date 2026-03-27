/**
 * create-checkout-session Edge Function
 *
 * Called by the frontend when a user clicks "Subscribe".
 * Gets or creates a Stripe Customer, then returns a Stripe Checkout URL.
 *
 * Required secrets (Supabase dashboard → Edge Functions → Secrets):
 *   STRIPE_SECRET_KEY   — sk_test_...
 *   STRIPE_PRICE_ID     — price_... (the $3/month recurring price)
 *   SUPABASE_URL            — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^16.0.0";

const supabase = createClient(
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

    // ── Body ──────────────────────────────────────────────────────────────────
    let siteOrigin: string;
    try {
      const body = await req.json();
      siteOrigin = body?.origin;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Validate origin to prevent open redirect abuse
    if (
      !siteOrigin ||
      typeof siteOrigin !== "string" ||
      !(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(siteOrigin) ||
        /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(siteOrigin))
    ) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── Get or create Stripe Customer ─────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, display_name, subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_status === "active" || profile?.subscription_status === "trialing") {
      return new Response(JSON.stringify({ error: "Already subscribed" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.display_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // ── Create Checkout Session ───────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: Deno.env.get("STRIPE_PRICE_ID")!, quantity: 1 }],
      success_url: `${siteOrigin}?subscribed=true`,
      cancel_url:  `${siteOrigin}?checkout_canceled=true`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
