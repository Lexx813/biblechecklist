/**
 * send-notification-email Edge Function
 *
 * Triggered by a Supabase Database Webhook on notifications INSERT.
 * Sends a real-time notification email via Resend.
 *
 * Required secrets (Supabase dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY      — from resend.com
 *   WEBHOOK_SECRET      — any random string; set the same in the DB webhook header
 *   SUPABASE_URL        — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TYPE_LABEL: Record<string, string> = {
  reply: "replied to your thread",
  mention: "mentioned you in a reply",
  comment: "commented on your post",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Validate shared secret set in the DB webhook header — fail closed
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret) return new Response("Server misconfigured", { status: 503 });
  if (req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const notif = payload.record; // Supabase DB webhook shape: { type, table, record, old_record }

  if (!notif?.id || !notif?.user_id) {
    return new Response(JSON.stringify({ skipped: "missing record" }), { status: 200 });
  }

  // Check recipient email preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email_notifications, email_notifications_digest")
    .eq("id", notif.user_id)
    .single();

  if (profile?.email_notifications === false && profile?.email_notifications_digest === false) {
    return new Response(JSON.stringify({ skipped: "email_notifications disabled" }), { status: 200 });
  }

  // Get auth email (auth.users is not accessible via normal client — use admin API)
  const { data: { user: authUser }, error: authErr } = await supabase.auth.admin.getUserById(notif.user_id);
  if (authErr || !authUser?.email) {
    return new Response(JSON.stringify({ skipped: "no email" }), { status: 200 });
  }

  // Get actor display name
  const { data: actor } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", notif.actor_id)
    .single();

  const actorName = actor?.display_name || "Someone";
  const recipientName = profile?.display_name || authUser.email;
  const action = TYPE_LABEL[notif.type] || "sent you a notification";
  const pageUrl = `https://nwtprogress.com/${notif.link_hash ?? ""}`;

  const subject = `${actorName} ${action} — JW Study`;
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin-bottom:4px">JW Study</h2>
  <hr style="margin-bottom:24px">
  <p>Hi ${recipientName},</p>
  <p><strong>${actorName}</strong> ${action}.</p>
  ${notif.body_preview
    ? `<blockquote style="border-left:3px solid #6366f1;margin:16px 0;padding:8px 16px;color:#555;font-style:italic">
        ${notif.body_preview}
       </blockquote>`
    : ""}
  <p>
    <a href="${pageUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
      View it on JW Study →
    </a>
  </p>
  <hr style="margin-top:32px">
  <p style="font-size:12px;color:#888">
    You're receiving this because you have email notifications enabled.<br>
    <a href="https://nwtprogress.com/profile" style="color:#888">Manage preferences</a>
  </p>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "JW Study <notifications@nwtprogress.com>",
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

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
