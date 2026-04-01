/**
 * stripe-webhook Edge Function
 *
 * Receives Stripe events and keeps profiles.subscription_status in sync.
 * Register this URL in the Stripe Dashboard → Developers → Webhooks.
 *
 * Required secrets (Supabase dashboard → Edge Functions → Secrets):
 *   STRIPE_SECRET_KEY       — sk_test_...
 *   STRIPE_WEBHOOK_SECRET   — whsec_... (from Stripe webhook settings)
 *   SUPABASE_URL            — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *
 * Events to enable in Stripe Dashboard:
 *   checkout.session.completed
 *   checkout.session.expired
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   invoice.payment_failed
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@^16.0.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

async function updateByCustomer(
  customerId: string,
  updates: Record<string, string | null>,
) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("stripe_customer_id", customerId);
  if (error) console.error("DB update error:", error.message);
}

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }
  const body = await req.text();

  // ── Verify Stripe signature ─────────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ── Handle events ───────────────────────────────────────────────────────────
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const customerId = session.customer as string;

      await updateByCustomer(customerId, {
        stripe_subscription_id: session.subscription as string,
        subscription_status: "active",
      });

      // ── Send confirmation email ─────────────────────────────────────────────
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile?.id) {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
          if (authUser?.email) {
            const name = profile.display_name || authUser.email;
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "NWT Progress <notifications@nwtprogress.com>",
                to: authUser.email,
                subject: "Welcome to Premium — NWT Progress 🎉",
                html: `<!DOCTYPE html>
<html>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0514;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0514;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14082a;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.25)">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#2e0b6e 0%,#5b21b6 55%,#7c3aed 100%);padding:36px 40px;text-align:center">
          <p style="margin:0 0 12px;font-size:32px">🎉</p>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.02em">You're now Premium!</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7)">Welcome to the full NWT Progress experience, ${name}.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px">
          <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
            Your subscription is active. Here's everything you now have access to:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${[
              ["📅", "Reading Plans", "Structured multi-week reading plans through any book"],
              ["📝", "Study Notes", "Rich-text notes tied to any passage or chapter"],
              ["✨", "AI Companion", "Ask AI about any verse, quiz question, or passage"],
              ["💬", "Direct Messages", "Private conversations with other members"],
              ["👥", "Study Groups", "Group chat and shared progress tracking"],
            ].map(([icon, title, desc]) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:42px;height:42px;background:rgba(124,58,237,0.15);border-radius:10px;text-align:center;vertical-align:middle;font-size:20px">${icon}</td>
                  <td style="padding-left:14px;vertical-align:middle">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#fff">${title}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.5)">${desc}</p>
                  </td>
                </tr></table>
              </td>
            </tr>`).join("")}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:12px">
            <tr><td style="padding:16px 20px">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.5)">Billing</p>
              <p style="margin:4px 0 0;font-size:18px;font-weight:800;color:#fff">$3.00 / month</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4)">Recurring — cancel anytime from your Settings page</p>
            </td></tr>
          </table>

          <div style="margin-top:28px;text-align:center">
            <a href="https://www.nwtprogress.com" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 36px;border-radius:999px">
              Open NWT Progress →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25)">
            NWT Progress · <a href="https://www.nwtprogress.com/settings" style="color:rgba(139,92,246,0.6)">Manage subscription</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
              }),
            });
          }
        }
      } catch (emailErr) {
        console.error("Subscription confirmation email failed:", emailErr);
        // Don't fail the webhook over email errors
      }

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      // Map Stripe statuses → our statuses
      const status = (
        sub.status === "active" || sub.status === "trialing"
          ? sub.status
          : sub.status === "past_due"
          ? "past_due"
          : "canceled"
      );
      await updateByCustomer(sub.customer as string, {
        stripe_subscription_id: sub.id,
        subscription_status: status,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await updateByCustomer(customerId, {
        subscription_status: "canceled",
        stripe_subscription_id: null,
      });

      // ── Send cancellation email ─────────────────────────────────────────────
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile?.id) {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
          if (authUser?.email) {
            const name = profile.display_name || authUser.email;
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "NWT Progress <notifications@nwtprogress.com>",
                to: authUser.email,
                subject: "Your Premium subscription has been cancelled",
                html: `<!DOCTYPE html>
<html>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0514;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0514;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14082a;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1a0a2e 0%,#2d1060 100%);padding:36px 40px;text-align:center">
          <p style="margin:0 0 12px;font-size:32px">👋</p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.02em">Subscription Cancelled</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6)">We're sorry to see you go, ${name}.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 40px">
          <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.7);line-height:1.65">
            Your Premium subscription has been cancelled and your account has been moved back to the free plan. You'll still have full access to:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            ${[
              ["📖", "Bible reading tracker (all 66 books)"],
              ["🧠", "Quiz with 1,000+ questions"],
              ["✍️", "Community blog & forum"],
              ["🔖", "Bookmarks & activity feed"],
            ].map(([icon, label]) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                <table cellpadding="0" cellspacing="0"><tr>
                  <td style="width:36px;height:36px;background:rgba(255,255,255,0.05);border-radius:8px;text-align:center;vertical-align:middle;font-size:18px">${icon}</td>
                  <td style="padding-left:12px;font-size:14px;color:rgba(255,255,255,0.65)">${label}</td>
                </tr></table>
              </td>
            </tr>`).join("")}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.18);border-radius:12px;margin-bottom:24px">
            <tr><td style="padding:16px 20px">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.45)">Want to come back?</p>
              <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5">
                Premium is still just <strong style="color:#c084fc">$3/month</strong>. You can resubscribe anytime from your Settings page — no new account needed.
              </p>
            </td></tr>
          </table>

          <div style="text-align:center">
            <a href="https://www.nwtprogress.com/settings" style="display:inline-block;background:rgba(124,58,237,0.2);border:1px solid rgba(124,58,237,0.4);color:#c084fc;text-decoration:none;font-size:14px;font-weight:700;padding:12px 30px;border-radius:999px">
              Resubscribe →
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25)">
            NWT Progress · <a href="https://www.nwtprogress.com" style="color:rgba(139,92,246,0.5)">nwtprogress.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
              }),
            });
          }
        }
      } catch (emailErr) {
        console.error("Cancellation email failed:", emailErr);
      }

      break;
    }

    case "checkout.session.expired": {
      // Abandoned checkout — send recovery email
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      const expiredCustomerId = expiredSession.customer as string;
      if (!expiredCustomerId) break;

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("stripe_customer_id", expiredCustomerId)
          .single();

        if (profile?.id) {
          const { data: { user: authUser } } = await supabase.auth.admin.getUserById(profile.id);
          if (authUser?.email) {
            const name = profile.display_name || authUser.email.split("@")[0];
            const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
            if (RESEND_KEY) {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${RESEND_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "NWT Progress <notifications@nwtprogress.com>",
                  to: authUser.email,
                  subject: "You're almost there! Complete your Premium signup",
                  html: `<!DOCTYPE html>
<html>
<body style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#0a0514;margin:0;padding:0">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0514;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#14082a;border-radius:20px;overflow:hidden;border:1px solid rgba(124,58,237,0.25)">
        <tr><td style="background:linear-gradient(135deg,#2e0b6e 0%,#5b21b6 55%,#7c3aed 100%);padding:36px 40px;text-align:center">
          <p style="margin:0 0 12px;font-size:32px">💫</p>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#fff">You were so close, ${name}!</h1>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.7)">Your Premium checkout didn't go through</p>
        </td></tr>
        <tr><td style="padding:32px 40px">
          <p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
            It looks like your checkout session expired before completing. No worries — your 7-day free trial is still available.
          </p>
          <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.6">
            Premium gives you reading plans, study notes, direct messages, study groups, and the AI study companion — all for just <strong style="color:#c084fc">$3/month</strong> after the trial.
          </p>
          <div style="text-align:center;margin-bottom:12px">
            <a href="https://nwtprogress.com/settings" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5b21b6);color:#fff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 36px;border-radius:999px">Try Premium Free →</a>
          </div>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25)">NWT Progress · <a href="https://nwtprogress.com/settings" style="color:rgba(139,92,246,0.6)">Manage preferences</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
                }),
              });
            }
          }
        }
      } catch (err) {
        console.error("Abandoned checkout email failed:", err);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      await updateByCustomer(invoice.customer as string, {
        subscription_status: "past_due",
      });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
