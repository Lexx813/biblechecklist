#!/usr/bin/env node
/**
 * seed-songs.mjs
 *
 * One-time / idempotent seeder for the `songs` table on jwstudy.org.
 *
 *  - Reads vault MD files at /mnt/c/Users/alexi/OneDrive/jwstudy-vault/songs/en/
 *    Parses frontmatter + section markdown into the JSONB lyrics structure.
 *  - Uploads the MP3 to the private `songs` Supabase Storage bucket as
 *    `<slug>/audio.mp3` (idempotent: upsert mode).
 *  - Upserts the song row by slug — safe to re-run.
 *
 * Usage:
 *   # The script reads from .env.local automatically (Next.js convention);
 *   # if you run from outside the repo, export the vars first.
 *   node scripts/seed-songs.mjs              # seed both songs
 *   node scripts/seed-songs.mjs --dry-run    # parse + print, no DB writes
 *   node scripts/seed-songs.mjs --slug knock-knock-knock   # one song only
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const VAULT_DIR = "/mnt/c/Users/alexi/OneDrive/jwstudy-vault/songs/en";

// --- Load .env.local if present ---
try {
  const envText = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    // Strip surrounding quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Unescape literal \n / \r that .env files sometimes carry from copy-paste
    value = value.replace(/\\n/g, "").replace(/\\r/g, "").trim();
    if (!process.env[m[1]]) process.env[m[1]] = value;
  }
} catch {
  /* ignore — env may already be set */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const slugFilterIdx = process.argv.indexOf("--slug");
const slugFilter = slugFilterIdx >= 0 ? process.argv[slugFilterIdx + 1] : null;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ──────────────────────────────────────────────────────────────────
// Curated metadata per song. Lyrics structure is derived from the vault MD;
// description + jw_org_links live here so they can be edited without touching
// the lyric source. All URLs verified via curl 2026-04-26.
// ──────────────────────────────────────────────────────────────────

const SONGS = [
  {
    slug: "knock-knock-knock",
    title: "Knock Knock Knock",
    title_es: null,
    file: "Knock Knock Knock",       // MD + MP3 basename in vault
    duration_seconds: 240,           // placeholder — real value loads from audio metadata at runtime
    primary_scripture_ref: "Matthew 24:14",
    primary_scripture_text:
      "And this good news of the Kingdom will be preached in all the inhabited earth for a witness to all the nations, and then the end will come.",
    primary_scripture_text_es: null,
    theme: "field-ministry",
    description:
      "A reggae-dancehall anthem celebrating the global preaching work of Jehovah's people. Rooted in Matthew 24:14, the prophecy that the good news of the Kingdom would be preached in all the inhabited earth before the end. The song honors the daily work of going house to house, following the pattern Paul described in Acts 20:20.",
    description_es: null,
    cover_image_url: null,           // can be added later via Canva/uploaded asset
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/matthew/24/", anchor: "Read Matthew 24, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/acts/20/", anchor: "Read Acts 20, New World Translation" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/activities/", anchor: "What do Jehovah's Witnesses do?" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/faq/", anchor: "Frequently asked questions about Jehovah's Witnesses" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "ima-witness",
    title: "Ima Witness",
    title_es: null,
    file: "Ima Witness",
    duration_seconds: 240,
    primary_scripture_ref: "Isaiah 43:10",
    primary_scripture_text:
      "\"You are my witnesses,\" declares Jehovah, \"yes, my servant whom I have chosen, so that you may know and have faith in me and understand that I am the same One. Before me no God was formed, and after me there has been none.\"",
    primary_scripture_text_es: null,
    theme: "identity",
    description:
      "An identity anthem in reggae-dancehall style. The chorus declares \"I am a witness of Jehovah,\" rooted in Isaiah 43:10 where Jehovah himself says, \"You are my witnesses.\" The song celebrates the great crowd of Revelation 7, the meaning of the divine name, and the joy of bearing witness to the only true God.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/isaiah/43/", anchor: "Read Isaiah 43, New World Translation" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/", anchor: "Who are Jehovah's Witnesses?" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/faq/", anchor: "Frequently asked questions about Jehovah's Witnesses" },
      { url: "https://www.jw.org/en/library/bible/", anchor: "Read the Bible online, New World Translation" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "palm-branches",
    title: "Palm Branches",
    title_es: null,
    file: "Palm Branches",
    duration_seconds: 240,
    primary_scripture_ref: "Revelation 7:9",
    primary_scripture_text:
      "After this I saw, and look! a great crowd, which no man was able to number, out of all nations and tribes and peoples and tongues, standing before the throne and before the Lamb, dressed in white robes; and there were palm branches in their hands.",
    primary_scripture_text_es: null,
    theme: "pure-worship",
    description:
      "A genre-fusion anthem of pure worship, drawing on John's vision in Revelation 7:9-10 of the great crowd from every nation, tribe, and tongue, palm branches in hand, lifting up Jehovah's name. The chorus declares \"every nation, every tongue, Jehovah reigns,\" tying the global vision of Revelation to Isaiah 43:10's promise that Jehovah's witnesses come from everywhere.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/revelation/7/", anchor: "Read Revelation 7, New World Translation" },
      { url: "https://www.jw.org/en/library/books/pure-worship/", anchor: "Pure Worship of Jehovah Restored at Last" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/isaiah/43/", anchor: "Read Isaiah 43, New World Translation" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/", anchor: "Who are Jehovah's Witnesses?" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "comforter",
    title: "Comforter",
    title_es: null,
    file: "Comforter",
    duration_seconds: 240,
    primary_scripture_ref: "John 14:16",
    primary_scripture_text:
      "And I will ask the Father and he will give you another helper to be with you forever.",
    primary_scripture_text_es: null,
    theme: "comfort",
    description:
      "An ambient gospel meditation on the holy spirit, framed the way Jehovah's Witnesses understand it: not a third person of a Godhead, but Jehovah's own active force, the breath that hovered over the waters in Genesis 1, fell at Pentecost in Acts 2, and was promised by Jesus in John 14 as another helper. The song moves from \"in the beginning\" through Pentecost to the everyday comfort of leaning on the Father's power when the words won't come.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/john/14/", anchor: "Read John 14, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/genesis/1/", anchor: "Read Genesis 1, New World Translation" },
      { url: "https://www.jw.org/en/bible-teachings/questions/what-is-the-holy-spirit/", anchor: "What is the holy spirit?" },
      { url: "https://www.jw.org/en/library/books/bible-teach/", anchor: "What Does the Bible Really Teach? (JW.org book)" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
];

// ──────────────────────────────────────────────────────────────────
// Lyric markdown parser
// ──────────────────────────────────────────────────────────────────

const SECTION_TYPE_MAP = [
  // [pattern (lowercase, exact) → type]
  ["intro", "intro"],
  ["pre-chorus", "pre-chorus"],
  ["pre chorus", "pre-chorus"],
  ["final chorus", "final-chorus"],
  ["chorus", "chorus"],
  ["bridge", "bridge"],
  ["toast section", "toast"],
  ["toast", "toast"],
  ["breakdown / toast", "breakdown"],
  ["breakdown/toast", "breakdown"],
  ["breakdown", "breakdown"],
  ["outro", "outro"],
  // verse last so it doesn't swallow others
  ["verse", "verse"],
];

function classifySection(label) {
  const l = label.toLowerCase().trim();
  for (const [needle, type] of SECTION_TYPE_MAP) {
    if (l.startsWith(needle)) return type;
  }
  return "verse";
}

function parseLyricsFromMd(mdText) {
  // Strip frontmatter
  const fmEnd = mdText.indexOf("\n---", 4);
  const afterFm = fmEnd >= 0 ? mdText.slice(fmEnd + 4) : mdText;

  // Restrict to the `## Lyrics` block — files may also contain `## Video brief`
  // and other authoring sections after the lyrics that should NOT be parsed
  // as song content.
  const lyricsHeadingMatch = afterFm.match(/^##\s+Lyrics\s*$/m);
  let body;
  if (lyricsHeadingMatch) {
    const start = lyricsHeadingMatch.index + lyricsHeadingMatch[0].length;
    const after = afterFm.slice(start);
    const nextH2 = after.match(/^##\s+(?!#)/m);
    body = nextH2 ? after.slice(0, nextH2.index) : after;
  } else {
    body = afterFm;
  }

  // Split by `### [Section]` headings
  const headingRe = /^###\s+\[([^\]]+)\](?:\s*[—–-]\s*(.+))?$/gm;
  const matches = [...body.matchAll(headingRe)];
  const sections = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const label = m[1].trim();
    const note = m[2]?.trim() ?? null;
    const start = m.index + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const sectionBody = body.slice(start, end);

    const lines = sectionBody
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => {
        // Drop standalone stage direction blockquotes like `> (Riddim bubbles…)`
        if (l.startsWith(">") && /^>\s*\(.+\)$/.test(l)) return false;
        return true;
      })
      .map((l) => (l.startsWith(">") ? l.replace(/^>\s?/, "") : l)); // unblockquote spoken intros

    // Trim leading/trailing blank lines (keep internal blanks for stanza breaks)
    while (lines.length && lines[0] === "") lines.shift();
    while (lines.length && lines[lines.length - 1] === "") lines.pop();

    sections.push({
      type: classifySection(label),
      label,
      note,
      lines,
    });
  }

  return { sections };
}

// ──────────────────────────────────────────────────────────────────
// Storage upload
// ──────────────────────────────────────────────────────────────────

async function uploadAudio(slug, file) {
  const path = `${slug}/audio.mp3`;
  const localPath = `${VAULT_DIR}/${file}.mp3`;
  const bytes = readFileSync(localPath);

  const { error } = await supabase.storage
    .from("songs")
    .upload(path, bytes, {
      contentType: "audio/mpeg",
      cacheControl: "3600",
      upsert: true,
    });
  if (error) throw new Error(`Upload failed for ${slug}: ${error.message}`);
  return path;
}

// ──────────────────────────────────────────────────────────────────
// DB upsert
// ──────────────────────────────────────────────────────────────────

async function upsertSong(meta, lyrics, audioPath) {
  const row = {
    slug: meta.slug,
    title: meta.title,
    title_es: meta.title_es,
    audio_url: audioPath,
    duration_seconds: meta.duration_seconds,
    primary_scripture_ref: meta.primary_scripture_ref,
    primary_scripture_text: meta.primary_scripture_text,
    primary_scripture_text_es: meta.primary_scripture_text_es,
    theme: meta.theme,
    lyrics,
    lyrics_es: null,
    description: meta.description,
    description_es: meta.description_es,
    jw_org_links: meta.jw_org_links,
    cover_image_url: meta.cover_image_url,
    published: true,
  };
  const { error } = await supabase.from("songs").upsert(row, { onConflict: "slug" });
  if (error) throw new Error(`Upsert failed for ${meta.slug}: ${error.message}`);
}

// ──────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────

async function main() {
  const targets = slugFilter ? SONGS.filter((s) => s.slug === slugFilter) : SONGS;
  if (!targets.length) {
    console.error(`No song matches --slug ${slugFilter}`);
    process.exit(1);
  }

  console.log(`${dryRun ? "[DRY RUN] " : ""}Seeding ${targets.length} song(s)...`);

  for (const meta of targets) {
    const mdPath = `${VAULT_DIR}/${meta.file}.md`;
    const md = readFileSync(mdPath, "utf8");
    const lyrics = parseLyricsFromMd(md);
    const sectionSummary = lyrics.sections
      .map((s) => `${s.label} (${s.lines.length} lines)`)
      .join(" · ");
    console.log(`\n— ${meta.slug} —`);
    console.log(`  scripture: ${meta.primary_scripture_ref}`);
    console.log(`  sections:  ${sectionSummary}`);

    if (dryRun) {
      console.log(`  [skipped upload + upsert]`);
      continue;
    }

    const audioPath = await uploadAudio(meta.slug, meta.file);
    console.log(`  uploaded:  ${audioPath}`);
    await upsertSong(meta, lyrics, audioPath);
    console.log(`  ✓ upserted`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
