/**
 * Upload the rendered AIPromoVideo MP4 to Supabase storage
 * and insert a row in the videos table.
 *
 * Usage: node scripts/upload-promo-video.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { readFile } from "fs/promises";

// Project URL extracted from the service key JWT ref
const SUPABASE_URL = "https://yudyhigvqaodnoqwwtns.supabase.co";

// Read service key from .env.local
function readEnvLocal() {
  const raw = readFileSync(".env.local", "utf8");
  const vars = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    let key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    // Strip surrounding quotes
    val = val.replace(/^["']|["']$/g, "");
    // Strip literal \n
    val = val.replace(/\\n$/, "").trim();
    vars[key] = val;
  }
  return vars;
}

const env = readEnvLocal();
const SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── 1. Find admin user to set as creator ─────────────────────────────────────
const { data: admins, error: adminErr } = await supabase
  .from("profiles")
  .select("id, display_name")
  .eq("is_admin", true)
  .limit(1);

if (adminErr || !admins?.length) {
  console.error("Could not find admin user:", adminErr?.message);
  process.exit(1);
}

const { id: creatorId, display_name } = admins[0];
console.log(`Using creator: ${display_name} (${creatorId})`);

// ── 2. Upload MP4 to storage ──────────────────────────────────────────────────
const MP4_PATH = "out/ai-promo.mp4";
let mp4;
try {
  mp4 = await readFile(MP4_PATH);
} catch {
  console.error(`MP4 not found at ${MP4_PATH} — has the render finished?`);
  process.exit(1);
}

const storagePath = `${creatorId}/ai-study-companion-promo.mp4`;

console.log(`Uploading ${(mp4.length / 1024 / 1024).toFixed(1)} MB to storage…`);

// Remove any existing file first
await supabase.storage.from("videos").remove([storagePath]);

const { error: uploadErr } = await supabase.storage
  .from("videos")
  .upload(storagePath, mp4, {
    contentType: "video/mp4",
    upsert: true,
  });

if (uploadErr) {
  console.error("Upload failed:", uploadErr.message);
  process.exit(1);
}

console.log(`Uploaded to: ${storagePath}`);

// ── 3. Upsert videos row ──────────────────────────────────────────────────────
const slug = "ai-study-companion-promo";

const { data: existing } = await supabase
  .from("videos")
  .select("id")
  .eq("slug", slug)
  .maybeSingle();

const videoRow = {
  creator_id: creatorId,
  slug,
  title: "AI Study Companion — See How It Works",
  description:
    "Meet your AI Bible Study Companion on JW Study. Ask any Bible question and get answers drawn exclusively from Watch Tower publications, the NWT, and wol.jw.org — 20+ publications indexed, with direct links to every source.",
  storage_path: storagePath,
  duration_sec: 40,
  published: true,
  scripture_tag: null,
};

let result;
if (existing?.id) {
  console.log(`Updating existing row id=${existing.id}…`);
  result = await supabase
    .from("videos")
    .update(videoRow)
    .eq("id", existing.id)
    .select()
    .single();
} else {
  console.log("Inserting new videos row…");
  result = await supabase.from("videos").insert(videoRow).select().single();
}

if (result.error) {
  console.error("DB insert/update failed:", result.error.message);
  process.exit(1);
}

console.log(`\n✓ Done! Video row id=${result.data.id} slug="${slug}"`);
console.log(`  Storage: ${storagePath}`);
console.log(`  View at: https://jwstudy.org/videos/${slug}`);
