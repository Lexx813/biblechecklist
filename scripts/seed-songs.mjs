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
import { existsSync, readFileSync } from "node:fs";
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
    slug: "lift-your-eyes",
    title: "Lift Your Eyes",
    title_es: null,
    file: "Lift Up Eyes",
    duration_seconds: 360,
    primary_scripture_ref: "Isaiah 40:31",
    primary_scripture_text:
      "But those who hope in Jehovah will regain power. They will soar on wings like eagles. They will run and not grow weary; they will walk and not tire.",
    primary_scripture_text_es: null,
    theme: "hope",
    description:
      "A progressive-house anthem of strength when weary. Opens with Isaiah 40:26 (\"Lift up your eyes to heaven and see who has created these things\"), builds through verses 28-30 about the One who never grows tired, and lands on Isaiah 40:31's promise that those who hope in Jehovah will soar on wings like eagles. Closes with Psalm 19:1 — the heavens declaring Jehovah's glory.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/isaiah/40/", anchor: "Read Isaiah 40, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/19/", anchor: "Read Psalm 19, New World Translation" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/", anchor: "Who are Jehovah's Witnesses?" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/faq/", anchor: "Frequently asked questions about Jehovah's Witnesses" },
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
    slug: "in-the-name-david-vs-goliath",
    title: "In The Name (David vs Goliath)",
    title_es: null,
    file: "In The Name",
    duration_seconds: 186,
    primary_scripture_ref: "1 Samuel 17:45",
    primary_scripture_text:
      "David replied to the Philistine: \"You are coming against me with sword and spear and javelin, but I am coming against you in the name of Jehovah of armies, the God of the battle line of Israel, whom you have taunted.\"",
    primary_scripture_text_es: null,
    theme: "courage",
    description:
      "A trap-style retelling of 1 Samuel 17 — the shepherd boy David facing the Philistine giant Goliath in the Valley of Elah. The chorus pulls straight from David's own answer: \"I come in the name of Jehovah of armies\" (1 Samuel 17:45). Verses walk through the scene faithfully — the eight sons of Jesse, the giant's nine-foot frame and copper armor, the lion and the bear, the five smooth stones from the wadi, the sling — and land on David's confession that the battle belongs to Jehovah, not the sword (verse 47). Closes by drawing the line for today: whatever giant stands in front of you, the same God of David is working for you.",
    description_es: null,
    cover_image_url: "/covers/in-the-name-david-vs-goliath.svg",
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/1-samuel/17/", anchor: "Read 1 Samuel 17, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/144/", anchor: "Read Psalm 144, New World Translation" },
      { url: "https://www.jw.org/en/library/books/draw-close/", anchor: "Draw Close to Jehovah" },
      { url: "https://www.jw.org/en/library/books/bible-teach/", anchor: "What Does the Bible Really Teach? (JW.org book)" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "wash-me-clean",
    title: "Wash Me Clean",
    title_es: null,
    file: "Wash Me Clean",
    duration_seconds: 240,
    primary_scripture_ref: "Psalm 51:1",
    primary_scripture_text:
      "Show me favor, O God, according to your loyal love. According to your great mercy, blot out my transgressions.",
    primary_scripture_text_es: null,
    theme: "mercy",
    description:
      "A contemporary gospel ballad built on Psalm 51 — David's prayer of repentance after the Bath-sheba episode. The song moves through David's confession (\"I am well-aware of my sin\"), the appeal to Jehovah's loyal love and great mercy, and the bridge's plea from verse 10: \"Create in me a clean heart, O God.\" Closes on the promise of 1 John 1:9 — that Jehovah is faithful and righteous to forgive when we confess.",
    description_es: null,
    cover_image_url: "/covers/wash-me-clean.svg",
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/51/", anchor: "Read Psalm 51, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/1-john/1/", anchor: "Read 1 John 1, New World Translation" },
      { url: "https://www.jw.org/en/library/books/draw-close/", anchor: "Draw Close to Jehovah" },
      { url: "https://www.jw.org/en/library/books/bible-teach/", anchor: "What Does the Bible Really Teach? (JW.org book)" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "hear-his-voice-again",
    title: "Hear His Voice Again",
    title_es: null,
    file: "Hear His Voice Again",
    duration_seconds: 240,
    primary_scripture_ref: "John 5:28",
    primary_scripture_text:
      "Do not be amazed at this, for the hour is coming in which all those in the memorial tombs will hear his voice and come out, those who did good things to a resurrection of life, and those who practiced vile things to a resurrection of judgment.",
    primary_scripture_text_es: null,
    theme: "resurrection",
    description:
      "A gospel ballad of resurrection hope, written for anyone grieving a loved one. Verse 1 sets the promise of John 5:28-29 — every memorial tomb will hear his voice. Verse 2 walks through Acts 24:15 (the resurrection of the righteous and the unrighteous) and Revelation 21:3-4 (no more death, mourning, pain). The bridge drops into a Nyabinghi feel and gets personal: \"Your father's not forgotten, he's resting in His hand, safe in the memory of Jehovah's mighty plan.\" The final chorus lifts into a specific image of reunion — a father and son embracing under skies forever blue — the JW promise made tangible.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/john/5/", anchor: "Read John 5, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/acts/24/", anchor: "Read Acts 24, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/revelation/21/", anchor: "Read Revelation 21, New World Translation" },
      { url: "https://www.jw.org/en/bible-teachings/questions/dead-loved-ones/", anchor: "Will the dead live again?" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "even-if-not",
    title: "Even If Not",
    title_es: null,
    file: "Even If Not",
    duration_seconds: 240,
    primary_scripture_ref: "Daniel 3:18",
    primary_scripture_text:
      "But even if he does not, let it be known to you, O king, that we will not serve your gods, nor will we worship the gold image that you have set up.",
    primary_scripture_text_es: null,
    theme: "courage",
    description:
      "A trap-gospel anthem retelling Daniel chapter 3 — Shadrach, Meshach, and Abednego refusing to bow to Nebuchadnezzar's gold image on the plain of Dura. The chorus pulls straight from verses 17 and 18: \"Our God whom we serve is able to rescue us... but even if he does not, we will not bow.\" Verse 1 narrates the king's threat and the three Hebrews' confession; verse 2 walks through the furnace heated seven times hotter, the soldiers killed by the flames, and Nebuchadnezzar's own words that Jehovah \"sent His angel\" (verse 28). The bridge brings the same courage forward to today — refusing to compromise the truth for a paycheck, refusing to bow to a flag, a man, or a throne.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/daniel/3/", anchor: "Read Daniel 3, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/hebrews/11/", anchor: "Read Hebrews 11, New World Translation" },
      { url: "https://www.jw.org/en/jehovahs-witnesses/faq/jehovahs-witnesses-neutral/", anchor: "Why don't Jehovah's Witnesses salute the flag or sing the anthem?" },
      { url: "https://www.jw.org/en/library/books/bible-teach/", anchor: "What Does the Bible Really Teach? (JW.org book)" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "jehovah-that-is-my-name",
    title: "Jehovah, That Is My Name",
    title_es: null,
    file: "Jehovah That Is My Name",
    duration_seconds: 240,
    primary_scripture_ref: "Isaiah 42:8",
    primary_scripture_text:
      "I am Jehovah. That is my name; I give my glory to no one else, nor my praise to graven images.",
    primary_scripture_text_es: null,
    theme: "identity",
    description:
      "A contemporary worship anthem built on the divine name itself. Opens with Moses at the burning bush (Exodus 3:14-15) — \"I will become whatever I choose to become\" — and the answer Jehovah gave Moses to take to the sons of Israel: \"This is my name forever, and this is how I am to be remembered from generation to generation.\" The bridge speaks Isaiah 42:8 back as Jehovah's own words: \"I give my glory to no one else, nor my praise to graven images.\" The final chorus, with a half-step key change and full choir, declares the name from generation to generation, every nation, every tongue.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/exodus/3/", anchor: "Read Exodus 3, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/isaiah/42/", anchor: "Read Isaiah 42, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/83/", anchor: "Read Psalm 83, New World Translation" },
      { url: "https://www.jw.org/en/bible-teachings/questions/gods-name/", anchor: "What is God's name?" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "wait-on-jehovah",
    title: "Wait On Jehovah",
    title_es: null,
    file: "Wait On Jehovah",
    duration_seconds: 240,
    primary_scripture_ref: "Psalm 27:14",
    primary_scripture_text:
      "Hope in Jehovah; Be courageous and let your heart be strong; Yes, hope in Jehovah.",
    primary_scripture_text_es: null,
    theme: "patience",
    description:
      "A gospel-soul ballad built on Psalm 27:14 — \"Hope in Jehovah; be courageous and let your heart be strong; yes, hope in Jehovah.\" Verse 1 sits in the long night of an unanswered prayer; verse 2 turns to David's years of waiting through Saul's pursuit, the throne that came in its time. The bridge widens out into Isaiah 40:31 — those who hope in Jehovah regain power, soar on wings like eagles, and 2 Peter 3:9, the patience of Jehovah with His servants. A song for anyone in a season of waiting that feels longer than they can hold.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/27/", anchor: "Read Psalm 27, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/isaiah/40/", anchor: "Read Isaiah 40, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/2-peter/3/", anchor: "Read 2 Peter 3, New World Translation" },
      { url: "https://www.jw.org/en/library/books/draw-close/", anchor: "Draw Close to Jehovah" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "jehovah-is-my-shepherd",
    title: "Jehovah Is My Shepherd",
    title_es: null,
    file: "Jehovah Is My Shepherd",
    duration_seconds: 240,
    primary_scripture_ref: "Psalm 23:1",
    primary_scripture_text:
      "Jehovah is my Shepherd. I will lack nothing.",
    primary_scripture_text_es: null,
    theme: "trust",
    description:
      "A gospel ballad rooted in Psalm 23 — Jehovah as the Shepherd who restores the soul, leads through the valley of the shadow, and whose loyal love pursues the worshiper every day. The verses widen out into Psalm 19's heavens telling of Jehovah's glory and the law that is sweeter than honey, and the bridge draws on Psalm 103 — the God who forgives every error, heals every disease, and shows a father's mercy. The final chorus lifts into Psalm 148's call for all the angels and all creation to praise Jehovah's holy name.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/23/", anchor: "Read Psalm 23, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/103/", anchor: "Read Psalm 103, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/19/", anchor: "Read Psalm 19, New World Translation" },
      { url: "https://www.jw.org/en/library/books/draw-close/", anchor: "Draw Close to Jehovah" },
      { url: "https://hub.jw.org/request-visit", anchor: "Request a visit from Jehovah's Witnesses" },
    ],
  },
  {
    slug: "jehovahs-breath",
    title: "Jehovah's Breath",
    title_es: null,
    file: "Jehovah’s Breath",      // vault basename uses curly apostrophe
    duration_seconds: 240,
    primary_scripture_ref: "Psalm 150:6",
    primary_scripture_text:
      "Let every breathing thing praise Jah. Praise Jah!",
    primary_scripture_text_es: null,
    theme: "praise",
    description:
      "A contemporary worship anthem built on the title image — every breath as a gift to be given back. Verse 1 lays down the personal confession (\"every breath I take, I owe it back to You\"), the chorus opens up to Jehovah's mercies that roll on like Lamentations 3:22-23 (\"new every morning\"). The bridge strips the song down to its purest line — \"every breath in me, oh Jehovah\" — a direct echo of Psalm 150:6, and the whispered outro lifts \"Holy, worthy, Jehovah\" the way Isaiah 6 and Revelation 4 picture the throne. The song frames Romans 12:1 (\"present your bodies as a sacrifice\") in the language of a single inhale.",
    description_es: null,
    cover_image_url: null,
    jw_org_links: [
      { url: "https://www.jw.org/en/library/bible/nwt/books/psalms/150/", anchor: "Read Psalm 150, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/acts/17/", anchor: "Read Acts 17, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/job/33/", anchor: "Read Job 33, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/genesis/2/", anchor: "Read Genesis 2, New World Translation" },
      { url: "https://www.jw.org/en/library/bible/nwt/books/lamentations/3/", anchor: "Read Lamentations 3, New World Translation" },
      { url: "https://www.jw.org/en/bible-teachings/questions/gods-name/", anchor: "What is God's name?" },
      { url: "https://www.jw.org/en/library/books/draw-close/", anchor: "Draw Close to Jehovah" },
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

// Look for a local PNG/JPG at /tmp/song-promo/<slug>-cover.{png,jpg} and, if
// found, upload to the public `song-covers` bucket and return the public URL.
// Returns null if no local cover exists — callers fall back to meta.cover_image_url.
async function uploadCoverIfPresent(slug) {
  const candidates = [
    [`/tmp/song-promo/${slug}-cover.png`, "image/png", "png"],
    [`/tmp/song-promo/${slug}-cover.jpg`, "image/jpeg", "jpg"],
    [`/tmp/song-promo/${slug}-cover.jpeg`, "image/jpeg", "jpg"],
  ];
  const found = candidates.find(([p]) => existsSync(p));
  if (!found) return null;
  const [localPath, contentType, ext] = found;
  const storagePath = `${slug}/cover.${ext}`;
  const bytes = readFileSync(localPath);

  const { error } = await supabase.storage
    .from("song-covers")
    .upload(storagePath, bytes, { contentType, cacheControl: "3600", upsert: true });
  if (error) throw new Error(`Cover upload failed for ${slug}: ${error.message}`);

  const { data } = supabase.storage.from("song-covers").getPublicUrl(storagePath);
  return data.publicUrl;
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
    const coverUrl = await uploadCoverIfPresent(meta.slug);
    if (coverUrl) {
      meta.cover_image_url = coverUrl;
      console.log(`  cover:     ${coverUrl}`);
    }
    await upsertSong(meta, lyrics, audioPath);
    console.log(`  ✓ upserted`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
