/**
 * seed-embeddings.js
 *
 * One-time script to populate verse_embeddings in Supabase.
 * Reads the English translation file, builds rich embed_text for each book,
 * then calls the embed-verses edge function in batches of 10.
 *
 * Usage:
 *   WEBHOOK_SECRET=your-secret node scripts/seed-embeddings.js
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const t = JSON.parse(
  readFileSync(join(__dirname, "../src/locales/en/translation.json"), "utf8")
);

const SUPABASE_URL = "https://yudyhigvqaodnoqwwtns.supabase.co";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const BATCH_SIZE = 10;

if (!WEBHOOK_SECRET) {
  console.error("Error: WEBHOOK_SECRET env var is required");
  process.exit(1);
}

const verses = t.bookNames.map((bookName, i) => {
  const bookTheme   = t.bookThemes[i] ?? "";
  const bookSummary = t.bookSummaries[i] ?? "";
  const verseRef    = t.verses[i]?.ref ?? "";
  const verseText   = t.verses[i]?.text ?? "";
  const embedText   = `${bookName}: ${bookTheme}. ${bookSummary} Key verse: ${verseText}`;
  return { id: i, book_name: bookName, book_theme: bookTheme, verse_ref: verseRef, verse_text: verseText, embed_text: embedText };
});

console.log(`Seeding ${verses.length} verse embeddings in batches of ${BATCH_SIZE}…`);

let totalOk = 0;
let totalFailed = 0;

for (let i = 0; i < verses.length; i += BATCH_SIZE) {
  const batch = verses.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(verses.length / BATCH_SIZE);
  process.stdout.write(`  Batch ${batchNum}/${totalBatches} (books ${i}–${i + batch.length - 1})… `);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/embed-verses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": WEBHOOK_SECRET,
    },
    body: JSON.stringify({ verses: batch }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    console.error(`FAILED (HTTP ${res.status}):`, err);
    process.exit(1);
  }

  const result = await res.json();
  totalOk += result.ok ?? 0;
  totalFailed += result.failed ?? 0;
  console.log(`ok: ${result.ok}, failed: ${result.failed}${result.errors?.length ? " — " + result.errors[0] : ""}`);
}

console.log(`\nDone — ok: ${totalOk}/${verses.length}, failed: ${totalFailed}`);
if (totalFailed > 0) process.exit(1);
