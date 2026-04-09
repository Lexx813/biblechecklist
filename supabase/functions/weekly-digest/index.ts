/**
 * weekly-digest Edge Function
 *
 * Called by pg_cron every Monday at 8:00 AM UTC.
 * Sends a digest email to every user with unread notifications from the past 7 days.
 *
 * Required secrets (Supabase dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY      — from resend.com
 *   CRON_SECRET         — same value used in the pg_cron SQL call
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
  mention: "mentioned you",
  comment: "commented on your post",
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("CRON_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all unread notifications from the past 7 days with actor info
  const { data: notifs, error } = await supabase
    .from("notifications")
    .select("user_id, type, body_preview, link_hash, created_at, actor:actor_id(display_name)")
    .eq("read", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("DB error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!notifs?.length) {
    return new Response(JSON.stringify({ sent: 0, reason: "no unread notifications" }), { status: 200 });
  }

  // Group by user_id
  const byUser = new Map<string, typeof notifs>();
  for (const n of notifs) {
    const arr = byUser.get(n.user_id) ?? [];
    arr.push(n);
    byUser.set(n.user_id, arr);
  }

  let sent = 0;
  let skipped = 0;

  for (const [userId, userNotifs] of byUser) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email_notifications_digest")
      .eq("id", userId)
      .single();

    if (profile?.email_notifications_digest === false) { skipped++; continue; }

    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    if (!authUser?.email) { skipped++; continue; }

    const name = profile?.display_name || authUser.email;
    const count = userNotifs.length;
    const preview = userNotifs.slice(0, 8);

    const itemsHtml = preview.map((n) => {
      const actor = (n.actor as { display_name?: string } | null)?.display_name ?? "Someone";
      const action = TYPE_LABEL[n.type] ?? "sent a notification";
      const url = `https://nwtprogress.com/${n.link_hash ?? ""}`;
      return `
        <li style="margin-bottom:12px">
          <strong>${actor}</strong> ${action}
          ${n.body_preview ? `<br><span style="color:#555;font-style:italic">"${n.body_preview}"</span>` : ""}
          <br><a href="${url}" style="color:#6366f1;font-size:13px">View →</a>
        </li>`;
    }).join("\n");

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin-bottom:4px">JW Study — Weekly Digest</h2>
  <hr style="margin-bottom:24px">
  <p>Hi ${name},</p>
  <p>You have <strong>${count}</strong> unread notification${count !== 1 ? "s" : ""} this week:</p>
  <ul style="padding-left:20px">${itemsHtml}</ul>
  ${count > 8 ? `<p style="color:#888">…and ${count - 8} more.</p>` : ""}
  <p>
    <a href="https://nwtprogress.com/" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
      Open JW Study →
    </a>
  </p>
  <hr style="margin-top:32px">
  <p style="font-size:12px;color:#888">
    Sent every Monday for the previous week's activity.<br>
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
        subject: `Your weekly digest — ${count} notification${count !== 1 ? "s" : ""} on JW Study`,
        html,
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      console.error(`Failed for ${authUser.email}:`, await res.text());
    }
  }

  console.log(`Weekly digest: sent=${sent}, skipped=${skipped}`);
  return new Response(JSON.stringify({ sent, skipped }), {
    headers: { "Content-Type": "application/json" },
  });
});
