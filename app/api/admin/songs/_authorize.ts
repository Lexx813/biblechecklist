/**
 * Shared auth helper for /api/admin/songs/*.
 * Verifies the bearer token is a real Supabase user AND that user is an admin.
 * Returns the caller's userId on success, or a Response on failure (which the
 * caller should return directly).
 */

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const SUPABASE_SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

export const SERVICE_HEADERS = {
  Authorization: `Bearer ${SUPABASE_SERVICE}`,
  apikey: SUPABASE_SERVICE,
};

export const SUPABASE = { url: SUPABASE_URL, service: SUPABASE_SERVICE, anon: SUPABASE_ANON };

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function authorizeAdmin(req: Request): Promise<{ userId: string } | Response> {
  if (!SUPABASE_SERVICE || !SUPABASE_URL) {
    return jsonResponse({ error: "Server misconfigured" }, 503);
  }

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return jsonResponse({ error: "Unauthorized" }, 401);
  const token = auth.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) return jsonResponse({ error: "Unauthorized" }, 401);
  const { id: userId } = (await userRes.json()) as { id?: string };
  if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=is_admin&id=eq.${userId}&limit=1`,
    { headers: SERVICE_HEADERS },
  );
  if (!profileRes.ok) return jsonResponse({ error: "Unauthorized" }, 401);
  const rows = (await profileRes.json()) as Array<{ is_admin: boolean }>;
  if (!rows[0]?.is_admin) return jsonResponse({ error: "Forbidden: admin access required" }, 403);

  return { userId };
}
