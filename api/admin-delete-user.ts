/**
 * Vercel Edge Function — Admin: Delete User
 * DELETE /api/admin-delete-user
 * Body: { userId: string }
 * Auth: Bearer <supabase-access-token>  (caller must be an admin)
 *
 * Supabase's auth.users table is owned by supabase_auth_admin and cannot
 * be deleted from a postgres SECURITY DEFINER function. The only supported
 * path is supabase-js's auth.admin.deleteUser() which requires the service
 * role key — so this must live server-side.
 */

export const config = { runtime: "edge" };

const SUPABASE_URL         = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON        = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const APP_ORIGIN           = (process.env.NEXT_PUBLIC_APP_URL ?? "https://jwstudy.org").replace(/\/$/, "");

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": APP_ORIGIN,
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "DELETE") return json({ error: "Method Not Allowed" }, 405);
  if (!SUPABASE_SERVICE_KEY) return json({ error: "Server misconfigured" }, 503);

  // ── Authenticate caller ────────────────────────────────────────────────────
  const token = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!token) return json({ error: "Unauthorized" }, 401);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return json({ error: "Unauthorized" }, 401);
  const { id: callerId } = (await userRes.json()) as { id?: string };
  if (!callerId) return json({ error: "Unauthorized" }, 401);

  // ── Verify caller is an admin ──────────────────────────────────────────────
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=is_admin&id=eq.${callerId}&limit=1`,
    { headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON } },
  );
  if (!profileRes.ok) return json({ error: "Unauthorized" }, 401);
  const [profile] = (await profileRes.json()) as Array<{ is_admin?: boolean }>;
  if (!profile?.is_admin) return json({ error: "Forbidden: admin access required" }, 403);

  // ── Parse target user ID ───────────────────────────────────────────────────
  let userId: string | undefined;
  try {
    ({ userId } = (await req.json()) as { userId?: string });
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }
  if (!userId || typeof userId !== "string") return json({ error: "userId is required" }, 400);
  if (userId === callerId) return json({ error: "You cannot delete your own account" }, 400);

  // ── Rate limit: max 10 deletes per admin per minute ────────────────────────
  // A stolen admin token shouldn't be able to wipe the user base in one loop.
  const serviceHeaders: Record<string, string> = {
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    apikey: SUPABASE_SERVICE_KEY,
  };
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
  const rateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/deleted_accounts?deleted_by=eq.${callerId}&deletion_type=eq.admin&created_at=gte.${oneMinAgo}&select=id`,
    { headers: { ...serviceHeaders, Prefer: "count=exact" } },
  );
  if (rateRes.ok) {
    const range = rateRes.headers.get("content-range") ?? "0-0/0";
    const recent = parseInt(range.split("/")[1] ?? "0", 10);
    if (recent >= 10) {
      return json({ error: "Too many deletions. Slow down." }, 429);
    }
  }

  // ── Capture email + name BEFORE deletion ───────────────────────────────────
  // The profile row is cascade-deleted with the auth user, so read it while it
  // still exists. Service role bypasses RLS / the revoked grant on `email`.
  let deletedEmail: string | null = null;
  let deletedName: string | null = null;
  const targetRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=email,display_name&id=eq.${userId}&limit=1`,
    { headers: serviceHeaders },
  );
  if (targetRes.ok) {
    const [row] = (await targetRes.json().catch(() => [])) as Array<{ email?: string; display_name?: string }>;
    deletedEmail = row?.email ?? null;
    deletedName = row?.display_name ?? null;
  }

  // ── Delete via Admin API (service role) ────────────────────────────────────
  const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: serviceHeaders,
  });

  if (!deleteRes.ok) {
    const err = (await deleteRes.json().catch(() => ({}))) as { message?: string };
    return json({ error: err.message ?? "Failed to delete user" }, deleteRes.status);
  }

  // ── Record the deletion (best-effort — never blocks the response) ──────────
  // deletion_type=admin; deleted_by is the admin who performed it.
  fetch(`${SUPABASE_URL}/rest/v1/deleted_accounts`, {
    method: "POST",
    headers: { ...serviceHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      email: deletedEmail,
      display_name: deletedName,
      deletion_type: "admin",
      deleted_by: callerId,
      ip: req.headers.get("x-forwarded-for") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    }),
  }).catch(() => {});

  return json({ success: true });
}
