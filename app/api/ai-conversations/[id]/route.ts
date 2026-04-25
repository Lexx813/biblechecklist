/**
 * GET    /api/ai-conversations/[id]  — fetch one conversation + its messages
 * PATCH  /api/ai-conversations/[id]  — rename ({ title })
 * DELETE /api/ai-conversations/[id]  — delete (cascade removes messages)
 *
 * Auth: Bearer <supabase-access-token>
 * RLS enforces ownership.
 */

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

function userHeaders(token: string, extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...extra,
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);
  const userId = await getUserId(token);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Bad request", { status: 400 });

  const [convRes, msgsRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${id}&select=id,title,created_at,updated_at,context`,
      { headers: userHeaders(token) },
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/ai_messages?conversation_id=eq.${id}&select=id,role,content,created_at&order=created_at.asc&limit=200`,
      { headers: userHeaders(token) },
    ),
  ]);

  if (!convRes.ok) return new Response(`Error: ${await convRes.text()}`, { status: 500 });
  if (!msgsRes.ok) return new Response(`Error: ${await msgsRes.text()}`, { status: 500 });

  const convs = await convRes.json() as Array<{ id: string; title: string; created_at: string; updated_at: string; context: unknown }>;
  if (!convs.length) return new Response("Not found", { status: 404 });
  const messages = await msgsRes.json();

  return Response.json({ conversation: convs[0], messages });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);
  const userId = await getUserId(token);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Bad request", { status: 400 });

  let body: { title?: string } = {};
  try { body = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (typeof body.title !== "string") return new Response("title is required", { status: 400 });

  const title = body.title.slice(0, 200);
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${id}`,
    {
      method: "PATCH",
      headers: userHeaders(token, { Prefer: "return=representation" }),
      body: JSON.stringify({ title, updated_at: new Date().toISOString() }),
    },
  );
  if (!res.ok) return new Response(`Error: ${await res.text()}`, { status: 500 });
  const rows = await res.json() as Array<{ id: string }>;
  if (!rows.length) return new Response("Not found", { status: 404 });
  return Response.json({ conversation: rows[0] });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
  const token = auth.slice(7);
  const userId = await getUserId(token);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Bad request", { status: 400 });

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${id}`,
    { method: "DELETE", headers: userHeaders(token) },
  );
  if (!res.ok) return new Response(`Error: ${await res.text()}`, { status: 500 });
  return new Response(null, { status: 204 });
}
