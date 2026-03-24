/**
 * render-and-post Edge Function
 *
 * Called by GitHub Actions daily cron.
 * 1. Fetches today's verse from daily_verses table
 * 2. Triggers a Remotion render via GitHub Actions workflow_dispatch
 * 3. After render, uploads the video to TikTok Content Posting API
 * 4. Marks the row as posted
 *
 * Required secrets (set in Supabase dashboard → Edge Functions → Secrets):
 *   SUPABASE_SERVICE_ROLE_KEY  — auto-injected by Supabase
 *   GITHUB_TOKEN               — fine-grained PAT with Actions: write on this repo
 *   GITHUB_REPO                — "owner/repo" e.g. "alexidev/nwt-progress"
 *   TIKTOK_ACCESS_TOKEN        — long-lived token from TikTok for Developers
 *   TIKTOK_OPEN_ID             — your TikTok account open_id
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // Only allow POST, and optionally verify a shared secret header
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("authorization");
  const expectedToken = Deno.env.get("CRON_SECRET");
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── 1. Fetch today's verse ────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const { data: verse, error } = await supabase
    .from("daily_verses")
    .select("*")
    .eq("scheduled_date", today)
    .is("posted_at", null)
    .single();

  if (error || !verse) {
    console.error("No verse found for today:", error?.message);
    return new Response(JSON.stringify({ error: "No verse scheduled for today" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(`Found verse: ${verse.reference}`);

  // ── 2. Dispatch GitHub Actions render workflow ────────────────────────────
  const githubRepo = Deno.env.get("GITHUB_REPO")!;
  const githubToken = Deno.env.get("GITHUB_TOKEN")!;

  const dispatchRes = await fetch(
    `https://api.github.com/repos/${githubRepo}/actions/workflows/render-verse.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          verse_id: String(verse.id),
          reference: verse.reference,
          verse_text: verse.verse_text,
          reflection: verse.reflection,
          accent_color: verse.accent_color,
        },
      }),
    },
  );

  if (!dispatchRes.ok) {
    const text = await dispatchRes.text();
    console.error("GitHub dispatch failed:", text);
    return new Response(JSON.stringify({ error: "GitHub dispatch failed", detail: text }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log("GitHub Actions render dispatched successfully");

  return new Response(
    JSON.stringify({ ok: true, verse: verse.reference, date: today }),
    { headers: { "Content-Type": "application/json" } },
  );
});
