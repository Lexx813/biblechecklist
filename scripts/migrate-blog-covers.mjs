#!/usr/bin/env node
/**
 * migrate-blog-covers.mjs
 *
 * One-shot migration to move blog post cover images from external CDNs
 * (currently Unsplash) into our own Supabase Storage `blog-covers` bucket.
 *
 * Why: Unsplash photos can be removed without warning (photographer deletes
 * account, gets DMCA'd, etc.) which causes 404s in the Lighthouse audit and
 * breaks the user-facing image. Hosting on our own bucket pins them.
 *
 * What it does:
 *   1. Selects every published blog_posts row with cover_url pointing to an
 *      external host (i.e. NOT already on supabase.co).
 *   2. Downloads the image into memory.
 *   3. Uploads to the public `blog-covers` bucket at `<slug>.<ext>` (upsert).
 *   4. Updates the row's cover_url to the public Supabase URL.
 *
 * Idempotent — running again skips rows already pointing to supabase.co.
 *
 * Usage:
 *   node scripts/migrate-blog-covers.mjs --dry-run   # parse + log, no writes
 *   node scripts/migrate-blog-covers.mjs             # actually migrate
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Mime → extension mapping (matches blog-covers bucket allowlist) ──────────
const EXT_FOR_MIME = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const PUBLIC_BASE = `${SUPABASE_URL.replace(/\/+$/, "")}/storage/v1/object/public/blog-covers`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function isExternal(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return !u.hostname.endsWith("supabase.co") && u.hostname !== "auth.jwstudy.org";
  } catch {
    return false;
  }
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; JWStudy-Migration/1.0; +https://jwstudy.org)",
      Accept: "image/jpeg,image/png,image/webp,image/gif,image/*;q=0.8",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const mime = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  const ext = EXT_FOR_MIME[mime];
  if (!ext) {
    throw new Error(`Unsupported mime ${mime} from ${url}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > 5 * 1024 * 1024) {
    throw new Error(`Image exceeds 5MB cap (${bytes.byteLength} bytes)`);
  }
  return { bytes, mime, ext };
}

async function uploadToStorage(slug, bytes, mime, ext) {
  const path = `${slug}.${ext}`;
  const { error } = await supabase.storage
    .from("blog-covers")
    .upload(path, bytes, {
      contentType: mime,
      cacheControl: "31536000",
      upsert: true,
    });
  if (error) throw new Error(`Upload failed for ${slug}: ${error.message}`);
  return `${PUBLIC_BASE}/${path}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`${dryRun ? "[DRY RUN] " : ""}Scanning blog_posts for external cover_url...\n`);

  const { data: rows, error } = await supabase
    .from("blog_posts")
    .select("id, slug, lang, title, cover_url")
    .not("cover_url", "is", null)
    .order("slug");
  if (error) throw new Error(`Select failed: ${error.message}`);

  const targets = (rows ?? []).filter((r) => isExternal(r.cover_url));
  if (targets.length === 0) {
    console.log("Nothing to migrate. All cover_url values are already in Supabase Storage.");
    return;
  }

  console.log(`Found ${targets.length} row(s) with external cover_url:\n`);
  for (const r of targets) console.log(`  - [${r.lang}] ${r.slug}`);
  console.log("");

  let ok = 0;
  let failed = 0;
  for (const row of targets) {
    process.stdout.write(`— ${row.slug} ... `);
    try {
      const { bytes, mime, ext } = await downloadImage(row.cover_url);
      if (dryRun) {
        console.log(`[DRY] would upload ${bytes.byteLength} bytes (${mime}) → blog-covers/${row.slug}.${ext}`);
        ok++;
        continue;
      }
      const newUrl = await uploadToStorage(row.slug, bytes, mime, ext);
      const { error: updErr } = await supabase
        .from("blog_posts")
        .update({ cover_url: newUrl })
        .eq("id", row.id);
      if (updErr) throw new Error(`Row update failed: ${updErr.message}`);
      console.log(`✓ ${bytes.byteLength} bytes → ${newUrl}`);
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${ok} succeeded, ${failed} failed.`);
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
