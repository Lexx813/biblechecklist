/**
 * create-checkout-session Edge Function
 *
 * Called by the frontend when a user clicks "Subscribe".
 * Gets or creates a Stripe Customer, then returns a Stripe Checkout URL.
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY         — sk_test_...
 *   STRIPE_PRICE_ID           — price_... (the $3/month recurring price)
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

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://nwtprogress.com";

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

    const siteOrigin = SITE_URL;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, display_name, subscription_status")
      .eq("id", user.id)
      .single();

    if (profile?.subscription_status === "active" || profile?.subscription_status === "trialing") {
      return json({ error: "Already subscribed" }, 400, cors);
    }

    let customerId = profile?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile?.display_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: Deno.env.get("STRIPE_PRICE_ID")!, quantity: 1 }],
      success_url: `${siteOrigin}?subscribed=true`,
      cancel_url: `${siteOrigin}?checkout_canceled=true`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    });

    return json({ url: session.url }, 200, cors);

  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("create-checkout-session error:", err);
    return json({ error: message }, 500, cors);
  }
});
