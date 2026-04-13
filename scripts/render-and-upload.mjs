/**
 * Render a Remotion composition and upload the MP4 to Supabase storage.
 *
 * Usage:
 *   node scripts/render-and-upload.mjs             # renders AIPromoVideo (default)
 *   node scripts/render-and-upload.mjs uploader    # renders VideoUploaderPromo
 */

import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, renderStill } from "@remotion/renderer";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { readFile, unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Env ───────────────────────────────────────────────────────────────────────
function readEnvLocal() {
  const raw = readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const vars = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1).replace(/^["']|["']$/g, "").replace(/\\n$/, "").trim();
    vars[key] = val;
  }
  return vars;
}

const env = readEnvLocal();
const SUPABASE_URL = "https://yudyhigvqaodnoqwwtns.supabase.co";
const SERVICE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  process.exit(1);
}

// ── Config by composition ─────────────────────────────────────────────────────
const mode = process.argv[2] ?? "ai";

const CONFIGS = {
  ai: {
    compositionId: "AIPromoVideo",
    outFile: "ai-promo.mp4",
    thumbnailFile: "ai-promo-thumb.jpg",
    thumbnailFrame: 600,   // mid-video — chat panel visible
    slug: "ai-study-companion-promo",
    storageName: "ai-study-companion-promo.mp4",
    thumbnailName: "ai-study-companion-promo-thumb.jpg",
    title: "AI Study Companion — See How It Works",
    description:
      "Meet your AI Bible Study Companion. Ask any Bible question and get answers drawn exclusively from Watch Tower publications, the NWT, and wol.jw.org — 20+ publications indexed, with direct links to every source.",
    durationSec: 40,
  },
  uploader: {
    compositionId: "VideoUploaderPromo",
    outFile: "video-uploader-promo.mp4",
    thumbnailFile: "video-uploader-promo-thumb.jpg",
    thumbnailFrame: 480,   // YouTube URL typed with valid badge
    slug: "how-to-share-videos",
    storageName: "video-uploader-promo.mp4",
    thumbnailName: "video-uploader-promo-thumb.jpg",
    title: "How to Share Videos — YouTube, TikTok & Upload",
    description:
      "Post inspiring videos to the JW Study community reel. Paste a YouTube or TikTok link, or upload your own MP4/MOV/WebM file (up to 50 MB). Videos are auto-compressed and appear instantly in the community reel.",
    durationSec: 40,
  },
  quiz: {
    compositionId: "QuizPromo",
    outFile: "quiz-promo.mp4",
    thumbnailFile: "quiz-promo-thumb.jpg",
    thumbnailFrame: 540,   // badge earned screen — most visually striking
    slug: "bible-knowledge-quiz-promo",
    storageName: "quiz-promo.mp4",
    thumbnailName: "quiz-promo-thumb.jpg",
    title: "Bible Knowledge Quiz — Test Your Scripture Knowledge",
    description:
      "Challenge yourself with 12 themed Bible knowledge levels. Answer questions drawn from the NWT and Watch Tower publications, earn badges as you pass each level, and track your best scores. Free for all JW Study members.",
    durationSec: 40,
  },
  tracker: {
    compositionId: "BibleTrackerPromo",
    outFile: "bible-tracker-promo.mp4",
    thumbnailFile: "bible-tracker-promo-thumb.jpg",
    thumbnailFrame: 800,   // stats card — progress + streak visible
    slug: "nwt-bible-reading-tracker-promo",
    storageName: "bible-tracker-promo.mp4",
    thumbnailName: "bible-tracker-promo-thumb.jpg",
    title: "NWT Bible Reading Tracker — Track Every Chapter",
    description:
      "Track your progress through all 66 books and 1,189 chapters of the New World Translation. Mark chapters as you read, build daily reading streaks, and share a beautiful progress card with friends and family.",
    durationSec: 40,
  },
};

const cfg = CONFIGS[mode];
if (!cfg) {
  console.error(`Unknown mode "${mode}". Use: ai | uploader | quiz | tracker`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const OUT_PATH = path.join(ROOT, "out", cfg.outFile);

// ── Step 1: Bundle ────────────────────────────────────────────────────────────
console.log(`Rendering composition: ${cfg.compositionId}`);
console.log("Bundling…");
const entryPoint = path.join(ROOT, "src", "remotion", "index.ts");

const bundleLocation = await bundle({
  entryPoint,
  publicDir: path.join(ROOT, "public"),
  webpackOverride: (config) => config,
});
console.log("Bundle ready.");

// ── Step 2: Select composition ────────────────────────────────────────────────
const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: cfg.compositionId,
  inputProps: {},
});
console.log(`Composition: ${composition.width}×${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames`);

// ── Step 3: Render ────────────────────────────────────────────────────────────
console.log("Rendering MP4 (this takes a couple of minutes)…");
const renderStart = Date.now();
let lastPct = 0;

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: "h264",
  outputLocation: OUT_PATH,
  inputProps: {},
  onProgress: ({ progress }) => {
    const pct = Math.round(progress * 100);
    if (pct >= lastPct + 5) {
      process.stdout.write(`  ${pct}%\r`);
      lastPct = pct;
    }
  },
});

const elapsed = ((Date.now() - renderStart) / 1000).toFixed(0);
console.log(`\nRender complete in ${elapsed}s — ${OUT_PATH}`);

// ── Step 3b: Render thumbnail ─────────────────────────────────────────────────
const THUMB_PATH = path.join(ROOT, "out", cfg.thumbnailFile);
console.log(`Rendering thumbnail (frame ${cfg.thumbnailFrame})…`);
await renderStill({
  composition,
  serveUrl: bundleLocation,
  output: THUMB_PATH,
  frame: cfg.thumbnailFrame,
  inputProps: {},
  imageFormat: "jpeg",
  jpegQuality: 88,
});
console.log(`Thumbnail ready — ${THUMB_PATH}`);

// ── Step 4: Find admin user ───────────────────────────────────────────────────
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
console.log(`Creator: ${display_name} (${creatorId})`);

// ── Step 5: Upload to Supabase storage ────────────────────────────────────────
const mp4 = await readFile(OUT_PATH);
const storagePath = `${creatorId}/${cfg.storageName}`;

console.log(`Uploading ${(mp4.length / 1024 / 1024).toFixed(1)} MB…`);
await supabase.storage.from("videos").remove([storagePath]);

const { error: uploadErr } = await supabase.storage
  .from("videos")
  .upload(storagePath, mp4, { contentType: "video/mp4", upsert: true });

if (uploadErr) {
  console.error("Upload failed:", uploadErr.message);
  process.exit(1);
}
console.log(`Uploaded: ${storagePath}`);

// ── Step 5b: Upload thumbnail ─────────────────────────────────────────────────
// Thumbnails go in a separate public bucket ("thumbnails") since the videos
// bucket restricts MIME types to video/*.
// Create it in Supabase Dashboard → Storage → New bucket → name: thumbnails, public: true
const thumbBytes = await readFile(THUMB_PATH);
const thumbStoragePath = `${cfg.thumbnailName}`;

console.log(`Uploading thumbnail to "thumbnails" bucket…`);
await supabase.storage.from("thumbnails").remove([thumbStoragePath]);
const { error: thumbErr } = await supabase.storage
  .from("thumbnails")
  .upload(thumbStoragePath, thumbBytes, { contentType: "image/jpeg", upsert: true });

let thumbPublicUrl = null;
if (thumbErr) {
  console.warn(`⚠ Thumbnail upload failed: ${thumbErr.message}`);
  console.warn(`  → Create a public bucket named "thumbnails" in the Supabase Dashboard`);
  console.warn(`    (Storage → New bucket → name: thumbnails → Public: on)`);
} else {
  thumbPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/thumbnails/${thumbStoragePath}`;
  console.log(`Thumbnail URL: ${thumbPublicUrl}`);
}

// ── Step 6: Upsert videos row ─────────────────────────────────────────────────
const { data: existing } = await supabase
  .from("videos")
  .select("id")
  .eq("slug", cfg.slug)
  .maybeSingle();

const videoRow = {
  creator_id: creatorId,
  slug: cfg.slug,
  title: cfg.title,
  description: cfg.description,
  storage_path: storagePath,
  thumbnail_url: thumbErr ? null : thumbPublicUrl,
  duration_sec: cfg.durationSec,
  published: true,
  scripture_tag: null,
};

let dbResult;
if (existing?.id) {
  console.log(`Updating existing row ${existing.id}…`);
  dbResult = await supabase.from("videos").update(videoRow).eq("id", existing.id).select().single();
} else {
  console.log("Inserting new row…");
  dbResult = await supabase.from("videos").insert(videoRow).select().single();
}

if (dbResult.error) {
  console.error("DB error:", dbResult.error.message);
  process.exit(1);
}

console.log(`\n✓ All done!`);
console.log(`  Video ID : ${dbResult.data.id}`);
console.log(`  Slug     : ${cfg.slug}`);
console.log(`  Storage  : ${storagePath}`);
console.log(`  Live at  : https://jwstudy.org/videos/${cfg.slug}`);
