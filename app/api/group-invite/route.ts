/**
 * POST /api/group-invite
 * Body: { groupId: string, email: string }
 * Auth: Bearer <supabase-access-token>
 *
 * Invites someone to a group by email. If the address belongs to an account,
 * they're added and notified (the notifications webhook emails them). If not,
 * we email them the group's invite link; signing up through it joins them.
 *
 * Always answers { ok: true } on success without saying which case happened,
 * so this can't be used to discover which emails have accounts.
 *
 * Env: RESEND_API_KEY (same key the Supabase email functions use).
 */

export const runtime = "nodejs";

import { rateLimit, rateLimitResponse } from "../../../src/lib/ratelimit";
import { withApiHandler } from "../../../src/lib/apiError";
import { buildGroupInviteEmail, isValidEmail } from "../../../src/lib/groupInviteEmail";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const RESEND_KEY = (process.env.RESEND_API_KEY ?? "").trim();
const APP_URL = "https://jwstudy.org";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

interface InviteResult {
  status: "added" | "already_member" | "not_found";
  code?: string;
  group_name?: string;
  inviter_name?: string | null;
}

export const POST = withApiHandler(async (req: Request) => {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
  const { id: userId } = (await userRes.json()) as { id: string };

  const rl = await rateLimit("groupInvite", userId);
  if (!rl.ok) return rateLimitResponse(rl);

  const body = (await req.json().catch(() => null)) as { groupId?: unknown; email?: unknown } | null;
  const groupId = typeof body?.groupId === "string" ? body.groupId : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!UUID_RE.test(groupId) || !isValidEmail(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/invite_to_group_by_email`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_actor: userId, p_group_id: groupId, p_email: email }),
  });
  if (rpcRes.status === 403 || rpcRes.status === 401) {
    return json({ error: "You can't invite people to this group." }, 403);
  }
  if (!rpcRes.ok) {
    const detail = await rpcRes.text();
    if (detail.includes("not allowed to invite")) {
      return json({ error: "You can't invite people to this group." }, 403);
    }
    throw new Error(`invite_to_group_by_email failed: ${rpcRes.status} ${detail}`);
  }
  const result = (await rpcRes.json()) as InviteResult;

  if (result.status === "not_found") {
    if (!RESEND_KEY || !result.code) {
      throw new Error("RESEND_API_KEY is not configured; cannot send group invite email");
    }
    const { subject, html, text } = buildGroupInviteEmail({
      inviterName: result.inviter_name ?? null,
      groupName: result.group_name ?? "a study group",
      joinUrl: `${APP_URL}/groups/${groupId}?join=${result.code}`,
    });
    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "JW Study <notifications@jwstudy.org>", to: email, subject, html, text }),
    });
    if (!sendRes.ok) {
      throw new Error(`Resend failed: ${sendRes.status} ${await sendRes.text()}`);
    }
  }

  return json({ ok: true });
});
