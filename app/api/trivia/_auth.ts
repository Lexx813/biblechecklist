import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

export async function resolveAuthedUserId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

/**
 * Lazy service-role client. NEVER call createClient at module load with
 * `process.env.X!` — Next.js's "Collecting page data" build pass evaluates
 * each route module without runtime env vars, and the non-null assert
 * crashes the entire build.
 */
export function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env not configured");
  return createClient(url, key);
}
