/**
 * GET  /api/ai-conversations         — list authed user's conversations (newest first, max 100)
 * POST /api/ai-conversations         — create a new conversation
 *   Body: { title?: string, context?: object }
 *
 * Auth: Bearer <supabase-access-token>
 *
 * RLS on ai_conversations enforces ownership; we use the user's JWT (not the
 * service role) so RLS applies and we can't accidentally leak rows.
 */

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  context: unknown;
}

function userHeaders(token: string) {
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function getUserId(token: string): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!res.ok) return null;
  const { id } = (await res.json()) as { id: string };
  return id;
}

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);

  const userId = await getUserId(token);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = `${SUPABASE_URL}/rest/v1/ai_conversations?select=id,title,created_at,updated_at,context&order=updated_at.desc&limit=100`;
  const res = await fetch(url, { headers: userHeaders(token) });
  if (!res.ok) return new Response(`Error: ${await res.text()}`, { status: 500 });
  const conversations = (await res.json()) as Conversation[];
  return Response.json({ conversations });
}

export async function POST(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);

  const userId = await getUserId(token);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  let body: { title?: string; context?: object } = {};
  try { body = await req.json(); } catch { /* allow empty */ }

  const title = (body.title ?? "New conversation").slice(0, 200);
  const context = body.context ?? null;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_conversations`, {
    method: "POST",
    headers: { ...userHeaders(token), Prefer: "return=representation" },
    body: JSON.stringify({ user_id: userId, title, context }),
  });
  if (!res.ok) return new Response(`Error: ${await res.text()}`, { status: 500 });
  const rows = (await res.json()) as Conversation[];
  return Response.json({ conversation: rows[0] }, { status: 201 });
}
