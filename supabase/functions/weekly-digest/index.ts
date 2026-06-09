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
 *
 * Performance note: previously did 3 round-trips per user
 *   (profile fetch + auth.admin.getUserById + reading plans). For 100 users
 *   that was 300 round-trips inside the function's 50s timeout.
 * Now batched: 1 profiles `.in()` query, 1 user_reading_plans `.in()` query,
 * and email pulled from profiles.email (kept in sync with auth.users).
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { escapeHtml } from "../_shared/escape-html.ts";
import { maskEmail } from "../_shared/mask.ts";
import { safeEqual } from "../_shared/safeEqual.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const TYPE_LABEL: Record<string, string> = {
  reply: "replied to your thread",
  mention: "mentioned you",
  comment: "commented on your post",
};

type Notif = {
  user_id: string;
  type: string;
  body_preview: string | null;
  link_hash: string | null;
  created_at: string;
  actor: { display_name?: string } | null;
};

type Profile = {
  id: string;
  display_name: string | null;
  email: string | null;
  email_notifications_digest: boolean | null;
};

type Plan = {
  user_id: string;
  template_key: string | null;
  custom_config: { name?: string; totalDays?: number } | null;
  reading_plan_completions: Array<{ count: number }> | null;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return new Response("Misconfigured", { status: 503 });
  if (!safeEqual(req.headers.get("authorization"), `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1) Fetch all unread notifications from the past 7 days with actor info
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

  const notifList = (notifs ?? []) as unknown as Notif[];
  if (!notifList.length) {
    return new Response(JSON.stringify({ sent: 0, reason: "no unread notifications" }), { status: 200 });
  }

  // Group notifications by user_id
  const byUser = new Map<string, Notif[]>();
  for (const n of notifList) {
    const arr = byUser.get(n.user_id) ?? [];
    arr.push(n);
    byUser.set(n.user_id, arr);
  }

  const userIds = Array.from(byUser.keys());

  // 2) Batch-fetch all profiles in one query
  const { data: profilesData, error: profilesErr } = await supabase
    .from("profiles")
    .select("id, display_name, email, email_notifications_digest")
    .in("id", userIds);

  if (profilesErr) {
    console.error("Profile fetch error:", profilesErr.message);
    return new Response(JSON.stringify({ error: profilesErr.message }), { status: 500 });
  }

  const profileById = new Map<string, Profile>();
  for (const p of (profilesData ?? []) as Profile[]) {
    profileById.set(p.id, p);
  }

  // 3) Batch-fetch reading plans for all users in one query
  const { data: plansData } = await supabase
    .from("user_reading_plans")
    .select("user_id, template_key, custom_config, reading_plan_completions(count)")
    .in("user_id", userIds)
    .eq("is_paused", false);

  const plansByUser = new Map<string, Plan[]>();
  for (const plan of ((plansData ?? []) as unknown as Plan[])) {
    const arr = plansByUser.get(plan.user_id) ?? [];
    if (arr.length < 3) arr.push(plan);
    plansByUser.set(plan.user_id, arr);
  }

  let sent = 0;
  let skipped = 0;

  for (const [userId, userNotifs] of byUser) {
    const profile = profileById.get(userId);

    if (profile?.email_notifications_digest === false) { skipped++; continue; }
    if (!profile?.email) { skipped++; continue; }

    const email = profile.email;
    const name = profile.display_name || email;
    const count = userNotifs.length;
    const preview = userNotifs.slice(0, 8);

    const userPlans = plansByUser.get(userId) ?? [];
    const planProgressHtml = userPlans.map((plan) => {
      const completions = plan.reading_plan_completions?.[0]?.count ?? 0;
      const config = plan.custom_config;
      const planName = config?.name ?? plan.template_key?.replace(/-/g, " ") ?? "Reading Plan";
      const totalDays = config?.totalDays ?? 365;
      const pct = Math.min(100, Math.round((completions / totalDays) * 100));
      const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0">
            <div style="font-size:14px;font-weight:600;text-transform:capitalize">${planName}</div>
            <div style="font-size:13px;color:#888;margin-top:2px;font-family:monospace">${bar} ${pct}%</div>
            <div style="font-size:12px;color:#aaa;margin-top:1px">Day ${completions} of ${totalDays}</div>
          </td>
        </tr>`;
    }).join("");

    const plansSection = planProgressHtml ? `
      <h3 style="margin:24px 0 12px;font-size:16px">📖 Reading Plan Progress</h3>
      <table style="width:100%;border-collapse:collapse">${planProgressHtml}</table>
    ` : "";

    const itemsHtml = preview.map((n) => {
      const actor = n.actor?.display_name ?? "Someone";
      const action = TYPE_LABEL[n.type] ?? "sent a notification";
      const url = `https://jwstudy.org/${encodeURI(n.link_hash ?? "")}`;
      return `
        <li style="margin-bottom:12px">
          <strong>${escapeHtml(actor)}</strong> ${escapeHtml(action)}
          ${n.body_preview ? `<br><span style="color:#555;font-style:italic">"${escapeHtml(n.body_preview)}"</span>` : ""}
          <br><a href="${escapeHtml(url)}" style="color:#6366f1;font-size:13px">View →</a>
        </li>`;
    }).join("\n");

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin-bottom:4px">JW Study — Weekly Digest</h2>
  <hr style="margin-bottom:24px">
  <p>Hi ${escapeHtml(name)},</p>
  ${plansSection}
  <h3 style="margin:24px 0 12px;font-size:16px">🔔 Notifications (${count} unread)</h3>
  <ul style="padding-left:20px">${itemsHtml}</ul>
  ${count > 8 ? `<p style="color:#888">…and ${count - 8} more.</p>` : ""}
  <p>
    <a href="https://jwstudy.org/" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
      Open JW Study →
    </a>
  </p>
  <hr style="margin-top:32px">
  <p style="font-size:12px;color:#888">
    Sent every Monday for the previous week's activity.<br>
    <a href="https://jwstudy.org/profile" style="color:#888">Manage preferences</a>
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
        from: "JW Study <notifications@jwstudy.org>",
        to: email,
        subject: `Your weekly digest — ${count} notification${count !== 1 ? "s" : ""} on JW Study`,
        html,
      }),
    });

    if (res.ok) {
      sent++;
    } else {
      console.error(`Failed for ${maskEmail(email)}:`, await res.text());
    }
  }

  console.log(`Weekly digest: sent=${sent}, skipped=${skipped}`);
  return new Response(JSON.stringify({ sent, skipped }), {
    headers: { "Content-Type": "application/json" },
  });
});
