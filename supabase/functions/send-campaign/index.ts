import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE       = "https://jwstudy.org";
const FROM       = "JW Study <notifications@jwstudy.org>";
const BATCH_SIZE = 50;

// ── Unsubscribe token (HMAC-SHA256) ───────────────────────────────────────────

async function makeUnsubToken(userId: string): Promise<string> {
  const secret = Deno.env.get("UNSUB_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET") ?? "fallback";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(userId));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const idB64 = btoa(userId).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  return `${idB64}.${sigB64}`;
}

function wrapHtml(html: string, unsubUrl: string): string {
  return html + `
<p style="text-align:center;font-size:12px;color:rgba(255,255,255,0.3);margin-top:24px">
  <a href="${unsubUrl}" style="color:rgba(139,92,246,0.5)">Unsubscribe</a>
</p>`;
}

// ── Segment resolution ────────────────────────────────────────────────────────

async function resolveSegment(
  config: Record<string, unknown>,
  campaignId: string,
): Promise<Array<{ id: string; email: string; name: string }>> {
  let query = supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("email_marketing_unsubscribed", false)
    .eq("is_banned", false);

  const plan = config.plan as string | undefined;
  if (plan === "premium") query = query.eq("subscription_status", "active");
  else if (plan === "free") query = query.neq("subscription_status", "active");

  const languages = config.languages as string[] | undefined;
  if (languages?.length) query = query.in("preferred_language", languages);

  const inactiveDays = config.inactive_days as number | undefined;
  if (inactiveDays) {
    const cutoff = new Date(Date.now() - inactiveDays * 86400_000).toISOString();
    query = query.lt("last_active_at", cutoff);
  }

  const joinedBefore = config.joined_before as string | undefined;
  if (joinedBefore) query = query.lt("created_at", joinedBefore);

  const joinedAfter = config.joined_after as string | undefined;
  if (joinedAfter) query = query.gt("created_at", joinedAfter);

  const { data: candidates, error } = await query;
  if (error) throw error;

  let users = candidates ?? [];

  // Filter by min_chapters_read (in-memory after initial fetch)
  const minChapters = config.min_chapters_read as number | undefined;
  if (minChapters && users.length > 0) {
    const ids = users.map(u => u.id);
    const { data: chapRows } = await supabase
      .from("chapter_reads")
      .select("user_id")
      .in("user_id", ids);
    const countMap: Record<string, number> = {};
    for (const r of chapRows ?? []) countMap[r.user_id] = (countMap[r.user_id] ?? 0) + 1;
    users = users.filter(u => (countMap[u.id] ?? 0) >= minChapters);
  }

  // Filter by include tags
  const incTags = config.tags as string[] | undefined;
  if (incTags?.length && users.length > 0) {
    const ids = users.map(u => u.id);
    const { data: tagRows } = await supabase
      .from("user_tags")
      .select("user_id")
      .in("user_id", ids)
      .in("tag", incTags);
    const hasTag = new Set((tagRows ?? []).map(r => r.user_id));
    users = users.filter(u => hasTag.has(u.id));
  }

  // Filter by exclude tags
  const excTags = config.exclude_tags as string[] | undefined;
  if (excTags?.length && users.length > 0) {
    const ids = users.map(u => u.id);
    const { data: tagRows } = await supabase
      .from("user_tags")
      .select("user_id")
      .in("user_id", ids)
      .in("tag", excTags);
    const hasExcTag = new Set((tagRows ?? []).map(r => r.user_id));
    users = users.filter(u => !hasExcTag.has(u.id));
  }

  // Exclude users already sent this campaign
  if (users.length > 0) {
    const { data: alreadySent } = await supabase
      .from("campaign_sends")
      .select("user_id")
      .eq("campaign_id", campaignId);
    const sentSet = new Set((alreadySent ?? []).map(r => r.user_id));
    users = users.filter(u => !sentSet.has(u.id));
  }

  return users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.display_name ?? u.email.split("@")[0],
  }));
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const body = await req.json().catch(() => ({}));
  const { campaign_id } = body;
  if (!campaign_id) return new Response("Missing campaign_id", { status: 400 });

  const { data: campaign, error: campErr } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaign_id)
    .single();

  if (campErr || !campaign) return new Response("Campaign not found", { status: 404 });

  // Mark as sending
  await supabase
    .from("email_campaigns")
    .update({ status: "sending" })
    .eq("id", campaign_id);

  const users = await resolveSegment(campaign.segment_config ?? {}, campaign_id);
  let sentCount = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (user) => {
      const unsubToken = await makeUnsubToken(user.id);
      const unsubUrl   = `${SITE}/unsubscribe?token=${unsubToken}`;
      const html       = wrapHtml(campaign.html_body, unsubUrl);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM,
          to: user.email,
          subject: campaign.subject,
          html,
          tags: [{ name: "campaign_id", value: campaign_id }],
        }),
      });

      if (res.ok) {
        const { id: resendEmailId } = await res.json();
        await supabase.from("campaign_sends").insert({
          campaign_id,
          user_id: user.id,
          resend_email_id: resendEmailId,
          status: "sent",
        });
        sentCount++;
      } else {
        console.error(`Failed for ${user.email}:`, await res.text());
      }
    }));
  }

  // Update campaign on completion
  const isRecurring = campaign.recurrence_cron != null;
  await supabase.from("email_campaigns").update({
    status: isRecurring ? "recurring" : "sent",
    last_sent_at: new Date().toISOString(),
    sent_count: (campaign.sent_count ?? 0) + sentCount,
    // next_run_at for recurring: 1 hour from now as safe default
    next_run_at: isRecurring
      ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
      : null,
  }).eq("id", campaign_id);

  return new Response(JSON.stringify({ ok: true, sent: sentCount }), {
    headers: { "Content-Type": "application/json" },
  });
});
