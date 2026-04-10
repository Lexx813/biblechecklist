/**
 * embed-content Edge Function
 *
 * Triggered by a Supabase Database Webhook on blog_posts INSERT or UPDATE.
 * Generates an OpenAI embedding for the post and stores it in blog_posts.embedding.
 * Skips unpublished posts.
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
  if (!secret) return new Response("Server misconfigured", { status: 503 });
  if (req.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const post = payload.record;

  if (!post?.id || !post?.published) {
    return new Response(JSON.stringify({ skipped: "not published" }), { status: 200 });
  }

  // Build embed text from title + excerpt + stripped content
  const contentText = (post.content ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const embedText = [post.title, post.excerpt, contentText].filter(Boolean).join(" ").slice(0, 8000);

  let embedding: number[];
  try {
    embedding = await embed(embedText);
  } catch (err) {
    console.error("Embed error:", err);
    return new Response(JSON.stringify({ error: "embedding failed" }), { status: 502 });
  }

  const { error } = await supabase
    .from("blog_posts")
    .update({ embedding })
    .eq("id", post.id);

  if (error) {
    console.error("DB update error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, postId: post.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
