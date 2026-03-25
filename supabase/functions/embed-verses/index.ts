/**
 * embed-verses Edge Function  (one-time setup)
 *
 * Call this once to populate verse_embeddings for all 66 Bible books.
 * Run via the seed script: node scripts/seed-embeddings.js
 *
 * Accepts POST body:
 *   { verses: Array<{ id, book_name, book_theme, verse_ref, verse_text, embed_text }> }
 *
 * Required secrets:
 *   OPENAI_API_KEY            — from platform.openai.com
 *   WEBHOOK_SECRET            — shared secret validated in x-webhook-secret header
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function embed(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text, model: "text-embedding-3-small" }),
  });
  if (!res.ok) throw new Error(`OpenAI embed failed: ${await res.text()}`);
  const json = await res.json();
  return json.data[0].embedding;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { verses } = await req.json();
  if (!Array.isArray(verses) || verses.length === 0) {
    return new Response(JSON.stringify({ error: "verses array required" }), { status: 400 });
  }

  const results = { ok: 0, failed: 0 };

  for (const v of verses) {
    try {
      const embedding = await embed(v.embed_text);
      const { error } = await supabase.from("verse_embeddings").upsert({
        id: v.id,
        book_name: v.book_name,
        book_theme: v.book_theme,
        verse_ref: v.verse_ref,
        verse_text: v.verse_text,
        embed_text: v.embed_text,
        embedding,
      });
      if (error) throw new Error(error.message);
      results.ok++;
    } catch (err) {
      console.error(`Failed verse ${v.id}:`, err);
      results.failed++;
    }
  }

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
});
