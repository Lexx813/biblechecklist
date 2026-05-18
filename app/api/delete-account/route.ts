/**
 * Self-service account deletion.
 *
 * DELETE /api/delete-account
 * Auth: Bearer <supabase-access-token>
 *
 * The user deletes only themselves; the target is derived from the token, never
 * passed in the body, so a stolen / replayed call cannot target another account.
 *
 * Supabase's auth.users is owned by supabase_auth_admin and cannot be removed
 * from a SECURITY DEFINER function. The only supported path is the Admin API
 * (auth/v1/admin/users/{id}) which requires the service-role key, so it lives
 * server-side.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

export async function DELETE(req: Request): Promise<Response> {
  if (!SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Derive the caller's id from the token. The body is ignored; users can only
  // delete themselves.
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: callerId } = (await userRes.json()) as { id?: string };
  if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceHeaders: Record<string, string> = {
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    apikey: SUPABASE_SERVICE_KEY,
  };

  // Light rate limit: 3 self-deletes per IP per minute. Prevents accidental
  // double-clicks looping and gives the audit log a clean signal.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (ip) {
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const rateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_actions?action=eq.self_delete&ip=eq.${encodeURIComponent(ip)}&created_at=gte.${oneMinAgo}&select=id`,
      { headers: { ...serviceHeaders, Prefer: "count=exact" } },
    );
    if (rateRes.ok) {
      const range = rateRes.headers.get("content-range") ?? "0-0/0";
      const recent = parseInt(range.split("/")[1] ?? "0", 10);
      if (recent >= 3) {
        return NextResponse.json({ error: "Too many deletion attempts. Try again in a minute." }, { status: 429 });
      }
    }
  }

  const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${callerId}`, {
    method: "DELETE",
    headers: serviceHeaders,
  });

  if (!deleteRes.ok) {
    const err = (await deleteRes.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json(
      { error: err.message ?? "Failed to delete account" },
      { status: deleteRes.status },
    );
  }

  // Audit log (best-effort, non-blocking). admin_id is the caller themselves
  // for self-deletes; action=self_delete distinguishes from admin-initiated.
  fetch(`${SUPABASE_URL}/rest/v1/admin_actions`, {
    method: "POST",
    headers: { ...serviceHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      admin_id: callerId,
      action: "self_delete",
      target_id: callerId,
      ip,
      user_agent: req.headers.get("user-agent") ?? null,
    }),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
