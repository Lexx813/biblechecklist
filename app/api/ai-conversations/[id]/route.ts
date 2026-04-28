/**
 * GET    /api/ai-conversations/[id]  — fetch one conversation + its messages
 * PATCH  /api/ai-conversations/[id]  — rename ({ title })
 * DELETE /api/ai-conversations/[id]  — delete (cascade removes messages)
 *
 * Auth: Bearer <supabase-access-token>
 * RLS enforces ownership.
 */

import { apiError, withApiHandler } from "../../../../src/lib/apiError";

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

export const GET = withApiHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
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

  if (!convRes.ok) {
    return apiError(new Error(`PostgREST ${convRes.status}: ${await convRes.text()}`),
      "Failed to load conversation", 500, { route: "ai-conversations.[id].GET" });
  }
  if (!msgsRes.ok) {
    return apiError(new Error(`PostgREST ${msgsRes.status}: ${await msgsRes.text()}`),
      "Failed to load messages", 500, { route: "ai-conversations.[id].GET" });
  }

  const convs = await convRes.json() as Array<{ id: string; title: string; created_at: string; updated_at: string; context: unknown }>;
  if (!convs.length) return new Response("Not found", { status: 404 });
  const messages = await msgsRes.json();

  return Response.json({ conversation: convs[0], messages });
}, { route: "ai-conversations.[id].GET" });

export const PATCH = withApiHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
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
  if (!res.ok) {
    return apiError(new Error(`PostgREST ${res.status}: ${await res.text()}`),
      "Failed to update conversation", 500, { route: "ai-conversations.[id].PATCH" });
  }
  const rows = await res.json() as Array<{ id: string }>;
  if (!rows.length) return new Response("Not found", { status: 404 });
  return Response.json({ conversation: rows[0] });
}, { route: "ai-conversations.[id].PATCH" });

export const DELETE = withApiHandler(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
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
  if (!res.ok) {
    return apiError(new Error(`PostgREST ${res.status}: ${await res.text()}`),
      "Failed to delete conversation", 500, { route: "ai-conversations.[id].DELETE" });
  }
  return new Response(null, { status: 204 });
}, { route: "ai-conversations.[id].DELETE" });
