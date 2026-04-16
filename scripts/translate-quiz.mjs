/**
 * Batch-translates missing quiz question translations using Claude Haiku.
 * Run: node scripts/translate-quiz.mjs
 *
 * Translates to: pt, fr, tl, zh
 * Source: English question text (falls back to ES if available)
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

// Trim whitespace/newlines from env vars; replace custom auth domain with direct Supabase URL
const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_URL = rawUrl.replace(/^https?:\/\/auth\.[^/]+/, "https://yudyhigvqaodnoqwwtns.supabase.co");
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim().replace(/\\n/g, "");
const ANTHROPIC_KEY = (process.env.ANTHROPIC_API_KEY ?? "").trim().replace(/\\n/g, "");

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error("Missing env vars. Load your .env first:\n  source .env.local && node scripts/translate-quiz.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const LANG_NAMES = { pt: "Portuguese (Brazil)", fr: "French", tl: "Tagalog (Filipino)", zh: "Simplified Chinese" };
const BATCH_SIZE = 8; // questions per API call

// ── 1. Fetch all questions missing at least one of pt/fr/tl/zh ───────────────
async function fetchMissingQuestions() {
  const { data, error } = await supabase.rpc("get_untranslated_questions");
  if (error) {
    // Fall back to direct query if RPC doesn't exist
    const { data: rows, error: err2 } = await supabase
      .from("quiz_questions")
      .select(`id, level, question, options, correct_index, explanation,
               quiz_question_translations(lang, question, options, explanation)`)
      .order("level", { ascending: true });
    if (err2) throw err2;
    return rows;
  }
  return data;
}

// ── 2. Determine missing langs per question ───────────────────────────────────
function getMissingLangs(row) {
  const existing = new Set((row.quiz_question_translations || []).map((t) => t.lang));
  return ["pt", "fr", "tl", "zh"].filter((l) => !existing.has(l));
}

// ── 3. Translate a batch of questions to all required langs ───────────────────
async function translateBatch(questions) {
  // Build a compact JSON payload for Claude
  const payload = questions.map((q) => ({
    id: q.id,
    en: q.question,
    options: q.options, // array of 4 strings
    ...(q.explanation ? { explanation: q.explanation } : {}),
    langs: getMissingLangs(q),
  }));

  const allLangs = [...new Set(payload.flatMap((p) => p.langs))];

  const prompt = `You are a Bible study app translator. Translate the following quiz questions about the New World Translation Bible.

Rules:
- Use natural, clear language appropriate for Bible study (JW context)
- Keep proper nouns (Bible book names, people's names) in their standard form for each language
- For Tagalog: use standard Filipino Bible terminology
- For Chinese: use Simplified Chinese with standard Protestant/JW Bible terms
- Keep all 4 answer options as separate strings in the same array order
- Return ONLY valid JSON — no markdown, no explanation

Translate each question to these languages: ${allLangs.map((l) => `${l} (${LANG_NAMES[l]})`).join(", ")}

Input JSON array:
${JSON.stringify(payload, null, 2)}

Return a JSON array in this exact shape:
[
  {
    "id": "<same uuid>",
    "translations": {
      "pt": { "question": "...", "options": ["...", "...", "...", "..."], "explanation": "..." },
      "fr": { "question": "...", "options": ["...", "...", "...", "..."], "explanation": "..." }
      // only include langs that were in this item's "langs" array
    }
  }
]`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 16000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();

  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  return JSON.parse(json);
}

// ── 4. Insert translated rows to DB ──────────────────────────────────────────
async function insertTranslations(results) {
  const rows = [];
  for (const item of results) {
    for (const [lang, t] of Object.entries(item.translations)) {
      if (!t?.question || !Array.isArray(t?.options) || t.options.length !== 4) {
        console.warn(`  ⚠ Skipping malformed translation for ${item.id} / ${lang}`);
        continue;
      }
      rows.push({
        question_id: item.id,
        lang,
        question: t.question,
        options: t.options,
        explanation: t.explanation || null,
      });
    }
  }

  if (rows.length === 0) return 0;

  const { error } = await supabase
    .from("quiz_question_translations")
    .upsert(rows, { onConflict: "question_id,lang" });

  if (error) throw error;
  return rows.length;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching questions...");
  const allQuestions = await fetchMissingQuestions();

  // Only keep questions that actually need work
  const todo = allQuestions.filter((q) => getMissingLangs(q).length > 0);
  console.log(`${todo.length} questions need translations (out of ${allQuestions.length} total)`);

  let totalInserted = 0;
  let batchNum = 0;
  const totalBatches = Math.ceil(todo.length / BATCH_SIZE);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = todo.slice(i, i + BATCH_SIZE);
    const levels = [...new Set(batch.map((q) => q.level))];
    console.log(`\nBatch ${batchNum}/${totalBatches} — levels ${levels.join(",")} (${batch.length} questions)`);

    let attempt = 0;
    while (attempt < 5) {
      try {
        const results = await translateBatch(batch);
        const inserted = await insertTranslations(results);
        totalInserted += inserted;
        console.log(`  ✓ Inserted ${inserted} rows`);
        break;
      } catch (err) {
        attempt++;
        const isRateLimit = err.message?.includes("429") || err.message?.includes("rate_limit");
        const waitMs = isRateLimit ? 65000 : 3000 * attempt;
        console.error(`  ✗ Attempt ${attempt} failed: ${err.message?.slice(0, 120)}`);
        if (attempt >= 5) { console.error("  Giving up on this batch."); break; }
        console.log(`  ⏳ Waiting ${Math.round(waitMs / 1000)}s before retry...`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    // Throttle between batches to stay under 10k output tokens/min
    if (i + BATCH_SIZE < todo.length) {
      await new Promise((r) => setTimeout(r, 65000));
    }
  }

  console.log(`\nDone. Total rows inserted: ${totalInserted}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
