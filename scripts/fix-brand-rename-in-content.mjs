#!/usr/bin/env node
/**
 * fix-brand-rename-in-content.mjs
 *
 * One-shot content fix, found during the 2026-09-15 SEO audit:
 *   1. Leftover "NWT Progress" / "nwtprogress.com" references (pre-rebrand
 *      brand name, retired per project memory) inside stored blog_posts
 *      content — several posts (mostly Spanish) still link the old domain.
 *   2. "New Testament writer" phrasing, which breaks the JW-terminology rule
 *      (should read "Christian Greek Scriptures writer").
 *
 * Usage:
 *   node scripts/fix-brand-rename-in-content.mjs --dry-run   # report only
 *   node scripts/fix-brand-rename-in-content.mjs             # write fixes
 *
 * Required env (auto-loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Load .env.local ──────────────────────────────────────────────────────────
try {
  const envText = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    value = value.replace(/\\n/g, "").replace(/\\r/g, "").trim();
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
} catch {
  /* ignore — env may already be set */
}

const dryRun = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REPLACEMENTS = [
  [/https:\/\/nwtprogress\.com/gi, "https://jwstudy.org"],
  [/nwtprogress\.com/gi, "jwstudy.org"],
  [/NWT Progress/g, "JW Study"],
  [/New Testament writer/g, "Christian Greek Scriptures writer"],
];

function applyReplacements(text) {
  let result = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

async function main() {
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, content")
    .or("content.ilike.%nwtprogress%,content.ilike.%NWT Progress%,content.ilike.%New Testament writer%");

  if (error) throw error;

  if (!posts || posts.length === 0) {
    console.log("No blog posts contain the old brand references.");
    return;
  }

  console.log(`Found ${posts.length} blog post(s) with old brand references:\n`);

  for (const post of posts) {
    const fixed = applyReplacements(post.content);
    const changed = fixed !== post.content;
    const occurrences = (post.content.match(/nwtprogress|NWT Progress|New Testament writer/gi) || []).length;
    console.log(`- ${post.slug} (${occurrences} occurrence${occurrences === 1 ? "" : "s"})`);

    if (!changed) continue;

    if (dryRun) {
      console.log("  [dry-run] would update content");
      continue;
    }

    const { error: updateError } = await supabase
      .from("blog_posts")
      .update({ content: fixed })
      .eq("id", post.id);

    if (updateError) {
      console.error(`  FAILED to update ${post.slug}:`, updateError.message);
    } else {
      console.log("  updated");
    }
  }

  if (dryRun) {
    console.log("\nDry run complete. Re-run without --dry-run to write changes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
