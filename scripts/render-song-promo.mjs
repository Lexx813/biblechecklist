#!/usr/bin/env node
// Render a 60s vertical TikTok promo MP4 for any song in the vault.
//
// Output: <vault>/songs/_audio/<slug>-promo-60.mp4 (1080x1920, h264, aac)
//
// Pipeline:
//   1. sharp → static cover PNG (1080x1920, dark→violet gradient + title/subtitle/scripture)
//   2. ffmpeg → cut audio segment from the source MP3 (start, length)
//   3. ffmpeg → combine PNG + audio into a vertical MP4
//
// Why a static cover instead of motion: the MP4 just needs to look like a
// TikTok cover frame — TikTok's autoplay shows it for the audio and we let
// the audio carry the post. Motion design happens in the Suno/CapCut edit
// downstream if desired. This produces a usable, on-brand draft.
//
// Usage:
//   node scripts/render-song-promo.mjs --slug agua-y-vegetales --start 30
//   node scripts/render-song-promo.mjs --slug agua-y-vegetales --start 0:42 --length 60
//
// Flags:
//   --slug      song slug (required) — controls vault paths + output name
//   --audio     vault subdir for the MP3 ("es" or "en"; default "en")
//   --filename  source MP3 basename without .mp3 (defaults to the slug-titled file)
//   --start     start time in seconds OR "m:ss" / "mm:ss" (default 30)
//   --length    clip length in seconds (default 60)
//   --title     big title text (overrides default)
//   --subtitle  subtitle text under the title (overrides default)
//   --scripture badge text bottom-right (overrides default)
//
// Requires: ffmpeg.exe — auto-detected from common Windows install paths.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const VAULT = "/mnt/c/Users/alexi/OneDrive/jwstudy-vault/songs";

// ---------------- args ----------------
const argv = process.argv.slice(2);
function arg(name, fallback) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
}
const slug = arg("slug");
if (!slug) {
  console.error("usage: --slug <slug> [--start 30] [--length 60] [--audio es|en] [--filename 'Agua y Vegetales']");
  process.exit(1);
}
const audioDir = arg("audio", null);
const filename = arg("filename", null);
const start = parseTime(arg("start", "30"));
const length = Number(arg("length", "60"));
const titleOverride = arg("title", null);
const subtitleOverride = arg("subtitle", null);
const scriptureOverride = arg("scripture", null);

// ---------------- defaults per slug ----------------
const PRESETS = {
  "agua-y-vegetales": {
    audioDir: "es",
    filename: "Agua y Vegetales",
    tag: "CANCIÓN ORIGINAL · DANIEL",
    title: "AGUA Y\nVEGETALES",
    subtitle: "Daniel — fiel hasta el final",
    quote: ["“Mejor pobre con Dios,", "que rico sin verdad.”"],
    scripture: "Daniel 6:22",
    cta: "ESCUCHA COMPLETA EN",
  },
  "jehovahs-breath": {
    audioDir: "en",
    filename: "Jehovah’s Breath",   // vault basename uses curly apostrophe
    tag: "ORIGINAL WORSHIP · PRAISE",
    title: "JEHOVAH’S\nBREATH",
    subtitle: "every breath I take, I owe it back to You",
    quote: ["“Let every breathing thing", "praise Jah. Praise Jah!”"],
    scripture: "Psalm 150:6",
    cta: "LISTEN FREE AT",
  },
};
const preset = PRESETS[slug] || {};

const SRC_AUDIO = path.join(VAULT, audioDir || preset.audioDir || "en", `${(filename || preset.filename || slug)}.mp3`);
const OUT_DIR = path.join(VAULT, "_audio");
// Suffix reflects clip length so a 120s cut doesn't clobber a 60s promo.
const OUT_MP4 = path.join(OUT_DIR, `${slug}-promo-${length}.mp4`);
const TMP_DIR = "/tmp/song-promo";
const TMP_PNG = path.join(TMP_DIR, `${slug}-cover.png`);
const TMP_M4A = path.join(TMP_DIR, `${slug}-clip.m4a`);

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

if (!existsSync(SRC_AUDIO)) {
  console.error(`source audio not found: ${SRC_AUDIO}`);
  process.exit(1);
}

const ffmpeg = findFFmpeg();
console.log(`ffmpeg: ${ffmpeg}`);
console.log(`source: ${SRC_AUDIO} (${(statSync(SRC_AUDIO).size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`cut:    start=${start}s length=${length}s → ${OUT_MP4}`);

// ---------------- 1. cover PNG ----------------
const TITLE = (titleOverride || preset.title || slug.toUpperCase().replaceAll("-", " ")).split("\n");
const SUB = subtitleOverride || preset.subtitle || "";
const SCR = scriptureOverride || preset.scripture || "";
const TAG = preset.tag || "ORIGINAL SONG · JWSTUDY.ORG";
const QUOTE = Array.isArray(preset.quote) ? preset.quote : [];
const CTA = preset.cta || "LISTEN ON";

const W = 1080;
const H = 1920;
const svg = buildCoverSvg({ w: W, h: H, slug, tag: TAG, titleLines: TITLE, sub: SUB, quoteLines: QUOTE, scripture: SCR, cta: CTA });
await sharp(Buffer.from(svg)).png().toFile(TMP_PNG);
console.log(`✓ cover  → ${TMP_PNG}`);

// ---------------- 2. audio cut ----------------
runOrDie(ffmpeg, [
  "-y",
  "-ss", String(start),
  "-i", winPath(SRC_AUDIO),
  "-t", String(length),
  "-vn",                  // drop embedded cover image stream
  "-map", "0:a:0",        // explicit: only first audio stream
  "-c:a", "aac",
  "-strict", "-2",      // Mango Recorder ffmpeg flags native aac as experimental
  "-b:a", "192k",
  "-af", "afade=t=in:st=0:d=0.4,afade=t=out:st=" + (length - 0.6) + ":d=0.6",
  winPath(TMP_M4A),
]);
console.log(`✓ clip   → ${TMP_M4A}`);

// ---------------- 3. compose MP4 ----------------
runOrDie(ffmpeg, [
  "-y",
  "-loop", "1",
  "-i", winPath(TMP_PNG),
  "-i", winPath(TMP_M4A),
  "-map", "0:v:0",
  "-map", "1:a:0",
  "-vcodec", "libx264",
  "-tune", "stillimage",
  "-preset", "medium",
  "-crf", "20",
  "-pix_fmt", "yuv420p",
  "-r", "30",
  "-shortest",
  "-c:a", "copy",
  "-movflags", "+faststart",
  winPath(OUT_MP4),
]);
console.log(`\n✓ wrote ${OUT_MP4}`);
console.log(`   ${(statSync(OUT_MP4).size / 1024 / 1024).toFixed(2)} MB`);

// ====================================================================

function parseTime(s) {
  if (!s) return 0;
  const str = String(s).trim();
  if (str.includes(":")) {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return Number(str);
}

function findFFmpeg() {
  const candidates = [
    // Prefer Mango Recorder build — has libx264 software encoder, fewer surprises.
    "/mnt/c/Users/alexi/AppData/Local/MangoApps/Mango Recorder/ffmpeg.exe",
    // CapCut builds are stripped (hardware encoders only, AMD AMF DLL missing) — last resort.
    "/mnt/c/Users/alexi/AppData/Local/CapCut/Apps/8.5.0.3590/ffmpeg.exe",
    "/mnt/c/Users/alexi/AppData/Local/CapCut/Apps/6.7.0.2628/ffmpeg.exe",
    "/mnt/c/Users/alexi/AppData/Local/CapCut/Apps/6.5.0.2562/ffmpeg.exe",
  ];
  for (const c of candidates) if (existsSync(c)) return c;
  // PATH fallback (Linux ffmpeg if installed)
  const r = spawnSync("which", ["ffmpeg"]);
  if (r.status === 0) return r.stdout.toString().trim();
  console.error("ffmpeg.exe not found. Install ffmpeg or update findFFmpeg() with the path.");
  process.exit(1);
}

function winPath(p) {
  // ffmpeg.exe (Windows) accepts WSL /mnt/c/... paths via auto-translation in recent builds,
  // but to be safe, rewrite to C:\... form when invoking the .exe.
  if (!p.startsWith("/mnt/")) return p;
  const m = p.match(/^\/mnt\/([a-z])\/(.*)$/);
  if (!m) return p;
  return `${m[1].toUpperCase()}:\\${m[2].replaceAll("/", "\\")}`;
}

function runOrDie(bin, args) {
  const r = spawnSync(bin, args, { stdio: ["ignore", "inherit", "inherit"] });
  if (r.status !== 0) {
    console.error(`\n${path.basename(bin)} exited ${r.status}`);
    process.exit(r.status || 1);
  }
}

function buildCoverSvg({ w, h, slug, tag, titleLines, sub, quoteLines = [], scripture, cta }) {
  const line1 = titleLines[0] || "";
  const line2 = titleLines[1] || "";
  const titleY1 = 720;
  const titleY2 = 870;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0a0a14"/>
      <stop offset="0.55" stop-color="#1a0a2e"/>
      <stop offset="1" stop-color="#3b0764"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.7">
      <stop offset="0" stop-color="#7c3aed" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <ellipse cx="${w / 2}" cy="${h * 0.42}" rx="600" ry="520" fill="url(#glow)"/>

  <!-- top brand bar -->
  <rect x="60" y="60" width="6" height="64" rx="3" fill="#7c3aed"/>
  <text x="92" y="106" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="700" fill="#f5f3ff" letter-spacing="2">JWSTUDY.ORG</text>

  <!-- decorative tag -->
  <text x="${w / 2}" y="540" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="32" font-weight="600" fill="#c4b5fd" letter-spacing="8">${escapeXml(tag)}</text>

  <!-- title -->
  <text x="${w / 2}" y="${titleY1}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="170" fill="#ffffff" letter-spacing="-2">${escapeXml(line1)}</text>
  <text x="${w / 2}" y="${titleY2}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="170" fill="#ffffff" letter-spacing="-2">${escapeXml(line2)}</text>

  <!-- subtitle -->
  <text x="${w / 2}" y="990" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="46" font-weight="400" fill="#e9d5ff" font-style="italic">${escapeXml(sub)}</text>

  ${quoteLines.length ? `
  <!-- pull quote -->
  <text x="${w / 2}" y="1240" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="#ffffff">${escapeXml(quoteLines[0] || "")}</text>
  ${quoteLines[1] ? `<text x="${w / 2}" y="1320" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="56" font-weight="700" fill="#ffffff">${escapeXml(quoteLines[1])}</text>` : ""}
  ` : ""}

  <!-- scripture badge -->
  <rect x="${w / 2 - 220}" y="1430" width="440" height="100" rx="50" fill="#7c3aed"/>
  <text x="${w / 2}" y="1493" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="700" fill="#ffffff" letter-spacing="2">${escapeXml(scripture)}</text>

  <!-- footer CTA -->
  <text x="${w / 2}" y="1780" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="38" font-weight="600" fill="#a78bfa" letter-spacing="3">${escapeXml(cta)}</text>
  <text x="${w / 2}" y="1840" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="50" font-weight="700" fill="#ffffff">jwstudy.org/songs/${escapeXml(slug)}</text>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}
