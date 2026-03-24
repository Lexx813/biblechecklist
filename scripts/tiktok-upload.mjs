/**
 * tiktok-upload.mjs
 *
 * Uploads a rendered video to TikTok using the Content Posting API.
 * Called by the GitHub Actions render-verse workflow.
 *
 * Env vars (provided by GitHub Actions secrets):
 *   VIDEO_PATH           — path to the rendered mp4 (e.g. "out/verse.mp4")
 *   TIKTOK_ACCESS_TOKEN  — OAuth2 access token with video.upload + video.publish scopes
 *   VERSE_REFERENCE      — used as part of the caption (e.g. "John 3:16")
 *
 * Outputs (written to $GITHUB_OUTPUT so the workflow can read them):
 *   publish_id           — TikTok's publish_id for the uploaded video
 */

import { readFileSync, statSync, appendFileSync } from "fs";

const VIDEO_PATH = process.env.VIDEO_PATH;
const ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const REFERENCE = process.env.VERSE_REFERENCE ?? "Daily Verse";

if (!VIDEO_PATH || !ACCESS_TOKEN) {
  console.error("Missing required env vars: VIDEO_PATH, TIKTOK_ACCESS_TOKEN");
  process.exit(1);
}

const VIDEO_SIZE = statSync(VIDEO_PATH).size;

// ── Step 1: Initialize upload ─────────────────────────────────────────────
// https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
const caption = [
  `📖 ${REFERENCE}`,
  "",
  "Track your Bible reading progress at nwtprogress.com",
  "",
  "#BibleVerse #NWTProgress #DailyVerse #BibleReading #Jehovah",
].join("\n");

const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    "Content-Type": "application/json; charset=UTF-8",
  },
  body: JSON.stringify({
    post_info: {
      title: caption,
      privacy_level: "PUBLIC_TO_EVERYONE",
      disable_duet: false,
      disable_comment: false,
      disable_stitch: false,
      video_cover_timestamp_ms: 1000,
    },
    source_info: {
      source: "FILE_UPLOAD",
      video_size: VIDEO_SIZE,
      chunk_size: VIDEO_SIZE,   // single-chunk upload (max 64 MB; videos are ~10 MB)
      total_chunk_count: 1,
    },
  }),
});

if (!initRes.ok) {
  const text = await initRes.text();
  console.error("TikTok init failed:", text);
  process.exit(1);
}

const { data: initData } = await initRes.json();
const { publish_id, upload_url } = initData;
console.log("Upload initialized. publish_id:", publish_id);

// ── Step 2: Upload video bytes ─────────────────────────────────────────────
const videoBytes = readFileSync(VIDEO_PATH);

const uploadRes = await fetch(upload_url, {
  method: "PUT",
  headers: {
    "Content-Type": "video/mp4",
    "Content-Range": `bytes 0-${VIDEO_SIZE - 1}/${VIDEO_SIZE}`,
    "Content-Length": String(VIDEO_SIZE),
  },
  body: videoBytes,
});

if (!uploadRes.ok) {
  const text = await uploadRes.text();
  console.error("TikTok upload failed:", text);
  process.exit(1);
}

console.log("Video uploaded successfully. publish_id:", publish_id);

// ── Step 3: Write outputs for GitHub Actions ──────────────────────────────
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `publish_id=${publish_id}\n`);
}

console.log("Done.");
