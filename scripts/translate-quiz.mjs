/**
 * Batch-translates missing quiz question translations using the claude CLI
 * (Claude Max — no API key needed).
 * Run: source .env.local && node scripts/translate-quiz.mjs
 */

import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SUPABASE_URL = rawUrl.replace(/^https?:\/\/auth\.[^/]+/, "https://yudyhigvqaodnoqwwtns.supabase.co");
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim().replace(/\\n/g, "");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing env vars. Run: source .env.local && node scripts/translate-quiz.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LANG_NAMES = { pt: "Portuguese (Brazil)", fr: "French", tl: "Tagalog (Filipino)", zh: "Simplified Chinese" };
const BATCH_SIZE = 8;

async function fetchMissingQuestions() {
  const { data, error } = await supabase
    .from("quiz_questions")
    .select(`id, level, question, options, correct_index, explanation,
             quiz_question_translations(lang, question, options, explanation)`)
    .order("level", { ascending: true });
  if (error) throw error;
  return data;
}

function getMissingLangs(row) {
  const existing = new Set((row.quiz_question_translations || []).map((t) => t.lang));
  return ["pt", "fr", "tl", "zh"].filter((l) => !existing.has(l));
}

function translateBatch(questions) {
  const payload = questions.map((q) => ({
    id: q.id,
    en: q.question,
    options: q.options,
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
      "pt": { "question": "...", "options": ["...", "...", "...", "..."] },
      "fr": { "question": "...", "options": ["...", "...", "...", "..."] }
    }
  }
]
Only include langs listed in each item's "langs" array. No explanation field if the input had none.`;

  // Use claude CLI via stdin (Claude Max — no API key needed)
  const proc = spawnSync("claude", ["--print", "--output-format", "text"], {
    input: prompt,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: 120000,
  });
  if (proc.error) throw proc.error;
  if (proc.status !== 0) throw new Error(proc.stderr || `claude exited with code ${proc.status}`);
  // Debug: print raw response for first batch
  if (process.env.DEBUG_TRANSLATE) {
    console.log("RAW RESPONSE:", JSON.stringify(proc.stdout.slice(0, 500)));
  }
  return parseResult(proc.stdout);
}

function parseResult(result) {
  const text = result.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  // First try clean parse
  try { return JSON.parse(text); } catch {}
  // Extract the outermost [...] array and try again
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch {}
  }
  // Last resort: parse each object individually
  const items = [];
  const objRegex = /\{[^{}]*"id"\s*:\s*"([^"]+)"[^{}]*"translations"\s*:\s*(\{[\s\S]*?\})\s*\}/g;
  let m;
  while ((m = objRegex.exec(text)) !== null) {
    try { items.push({ id: m[1], translations: JSON.parse(m[2]) }); } catch {}
  }
  if (items.length > 0) return items;
  throw new Error("Could not parse JSON from response");
}

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

async function main() {
  console.log("Fetching questions...");
  const allQuestions = await fetchMissingQuestions();
  const todo = allQuestions.filter((q) => getMissingLangs(q).length > 0);
  console.log(`${todo.length} questions need translations (out of ${allQuestions.length} total)`);

  let totalInserted = 0;
  const totalBatches = Math.ceil(todo.length / BATCH_SIZE);

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const batch = todo.slice(i, i + BATCH_SIZE);
    const levels = [...new Set(batch.map((q) => q.level))];
    console.log(`\nBatch ${batchNum}/${totalBatches} — levels ${levels.join(",")} (${batch.length} questions)`);

    let attempt = 0;
    while (attempt < 3) {
      try {
        const results = translateBatch(batch);
        const inserted = await insertTranslations(results);
        totalInserted += inserted;
        console.log(`  ✓ Inserted ${inserted} rows`);
        break;
      } catch (err) {
        attempt++;
        console.error(`  ✗ Attempt ${attempt} failed: ${err.message?.slice(0, 120)}`);
        if (attempt >= 3) { console.error("  Giving up on this batch."); break; }
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
  }

  console.log(`\nDone. Total rows inserted: ${totalInserted}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
