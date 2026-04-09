/**
 * notify-admin-new-user Edge Function
 *
 * Triggered by a Supabase Database Webhook on profiles INSERT.
 * Sends an admin notification email to the site owner whenever a new user signs up.
 *
 * Required secrets (Supabase dashboard → Edge Functions → Secrets):
 *   RESEND_API_KEY      — from resend.com
 *   WEBHOOK_SECRET      — same secret set in the DB webhook header
 */

const ADMIN_EMAIL = "lexxsolutionz@gmail.com";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const profile = payload.record;

  if (!profile?.id) {
    return new Response(JSON.stringify({ skipped: "missing record" }), { status: 200 });
  }

  const displayName = profile.display_name || "Unknown";
  const email = profile.email || "No email";
  const joinedAt = profile.created_at
    ? new Date(profile.created_at).toLocaleString("en-US", { timeZone: "UTC" }) + " UTC"
    : "Unknown time";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin-bottom:4px">JW Study</h2>
  <hr style="margin-bottom:24px">
  <h3>New User Signed Up</h3>
  <table style="width:100%;border-collapse:collapse;margin-top:16px">
    <tr>
      <td style="padding:8px;font-weight:bold;width:140px">Name</td>
      <td style="padding:8px">${displayName}</td>
    </tr>
    <tr style="background:#f5f5f5">
      <td style="padding:8px;font-weight:bold">Email</td>
      <td style="padding:8px">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px;font-weight:bold">Joined</td>
      <td style="padding:8px">${joinedAt}</td>
    </tr>
  </table>
  <p style="margin-top:24px">
    <a href="https://nwtprogress.com" style="display:inline-block;background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
      View Site →
    </a>
  </p>
  <hr style="margin-top:32px">
  <p style="font-size:12px;color:#888">Automated alert from JW Study</p>
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
      to: ADMIN_EMAIL,
      subject: `New user signed up: ${displayName} (${email})`,
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
