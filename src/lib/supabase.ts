import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Lazy singleton. The throw used to fire at module load, which crashed
 * Vercel's "Collecting page data" build pass for any route that imported
 * this module — preview deploys ran before env vars were available.
 *
 * The Proxy below preserves the original ergonomics (`supabase.from(...)`)
 * but defers the real createClient until the first property access, and
 * only then complains if env vars are missing.
 */

let _client: SupabaseClient | null = null;

function ensureClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — add them to your .env file.",
    );
  }
  _client = createClient(url, key, { auth: { flowType: "implicit" } });
  return _client;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = ensureClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = Reflect.get(client as any, prop, receiver);
    // Re-bind methods so `this` points at the real client, not the Proxy.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
