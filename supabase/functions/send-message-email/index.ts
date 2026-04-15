/**
 * send-message-email Edge Function
 *
 * Triggered by a Supabase Database Webhook on notifications INSERT.
 * Sends an email when a user receives a direct message and is offline.
 *
 * Conditions for sending:
 *   1. Notification type is 'message'
 *   2. Recipient has email_notifications enabled (or not explicitly disabled)
 *   3. Recipient is offline (last_active_at > 5 minutes ago or null)
 *   4. No email already sent for this conversation in the last hour (dedup)
 *
 * Required secrets:
 *   RESEND_API_KEY            — from resend.com
 *   MESSAGE_EMAIL_SECRET      — must equal 'msg-email-7f3a9c2d1b8e4f6a' (set in trigger)
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;    // 5 minutes
const DEDUP_WINDOW_MS      = 60 * 60 * 1000;   // 1 hour per conversation

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("MESSAGE_EMAIL_SECRET");
  if (!secret) return new Response("Server misconfigured", { status: 503 });
  if (req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const notif = payload.record;

  // Only handle message notifications
  if (!notif?.id || notif.type !== "message") {
    return new Response(JSON.stringify({ skipped: "not a message notification" }), { status: 200 });
  }

  if (!notif.user_id || !notif.actor_id || !notif.conversation_id) {
    return new Response(JSON.stringify({ skipped: "missing fields" }), { status: 200 });
  }

  // ── 1. Check recipient preferences & online status ────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email_notifications, last_active_at")
    .eq("id", notif.user_id)
    .single();

  if (profile?.email_notifications === false) {
    return new Response(JSON.stringify({ skipped: "email_notifications disabled" }), { status: 200 });
  }

  // Consider the user online if they were active within the last 5 minutes
  const lastActive = profile?.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
  const isOnline = Date.now() - lastActive < OFFLINE_THRESHOLD_MS;
  if (isOnline) {
    return new Response(JSON.stringify({ skipped: "recipient is online" }), { status: 200 });
  }

  // ── 2. Deduplication — one email per conversation per hour ────────────────
  const dedupSince = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", notif.user_id)
    .eq("type", "message")
    .eq("conversation_id", notif.conversation_id)
    .neq("id", notif.id)
    .gte("created_at", dedupSince);

  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ skipped: "email already sent for this conversation recently" }), { status: 200 });
  }

  // ── 3. Fetch auth email ───────────────────────────────────────────────────
  const { data: { user: authUser }, error: authErr } = await supabase.auth.admin.getUserById(notif.user_id);
  if (authErr || !authUser?.email) {
    return new Response(JSON.stringify({ skipped: "no email" }), { status: 200 });
  }

  // ── 4. Fetch sender name ──────────────────────────────────────────────────
  const { data: sender } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", notif.actor_id)
    .single();

  const senderName     = sender?.display_name || "Someone";
  const recipientName  = profile?.display_name || authUser.email.split("@")[0];
  const messagePreview = notif.body_preview ? notif.body_preview.slice(0, 120) : null;
  const conversationUrl = `https://jwstudy.org/messages/${notif.conversation_id}`;

  // ── 5. Send email via Resend ──────────────────────────────────────────────
  const subject = `${senderName} sent you a message — JW Study`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#4f46e5;padding:28px 32px;text-align:center">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px">JW Study</p>
            <p style="margin:6px 0 0;color:#c7d2fe;font-size:13px">jwstudy.org</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px">
            <p style="margin:0 0 8px;font-size:15px;color:#374151">Hi ${recipientName},</p>
            <p style="margin:0 0 24px;font-size:16px;color:#111827;font-weight:500">
              You have a new message from <strong>${senderName}</strong>.
            </p>

            ${messagePreview ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#f9fafb;border-left:3px solid #4f46e5;border-radius:0 8px 8px 0;padding:14px 18px">
                  <p style="margin:0;font-size:14px;color:#6b7280;font-style:italic">"${messagePreview}${notif.body_preview?.length > 120 ? "…" : ""}"</p>
                </td>
              </tr>
            </table>` : ""}

            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#4f46e5;border-radius:8px">
                  <a href="${conversationUrl}"
                     style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.1px">
                    Reply to ${senderName} →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
              You're receiving this because you have email notifications turned on.<br>
              <a href="https://jwstudy.org/settings" style="color:#6b7280;text-decoration:underline">Manage notification preferences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "JW Study <notifications@jwstudy.org>",
      to: authUser.email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Resend error:", detail);
    return new Response(JSON.stringify({ error: detail }), { status: 502 });
  }

  console.log(`send-message-email: sent to ${authUser.email} for conversation ${notif.conversation_id}`);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
