/**
 * semantic-search Edge Function
 *
 * Embeds the user's query via OpenAI, then runs cosine similarity search
 * against verse_embeddings and blog_posts using pgvector.
 *
 * Required secrets:
 *   OPENAI_API_KEY            — from platform.openai.com
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

  let query: string;
  try {
    ({ query } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "invalid body" }), { status: 400 });
  }

  if (!query?.trim()) {
    return new Response(JSON.stringify({ verses: [], posts: [] }), { status: 200 });
  }

  let embedding: number[];
  try {
    embedding = await embed(query.trim());
  } catch (err) {
    console.error("Embed error:", err);
    return new Response(JSON.stringify({ error: "embedding failed" }), { status: 502 });
  }

  const { data, error } = await supabase.rpc("semantic_search", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 5,
  });

  if (error) {
    console.error("DB error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data ?? { verses: [], posts: [] }), {
    headers: { "Content-Type": "application/json" },
  });
});
