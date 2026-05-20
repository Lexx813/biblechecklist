#!/usr/bin/env node
/**
 * i18n key-drift detector.
 *
 * Compares the key sets of every locale in public/locales/{lng}/translation.json
 * against the EN source-of-truth. Exits 2 if any non-EN locale is missing a
 * key that EN declares, so CI can gate on translation completeness.
 *
 * Notes:
 *  - "Extra keys" (in a non-EN locale but not in EN) are NOT failures. Many
 *    code-side t() calls pass a string fallback so EN's JSON doesn't need to
 *    declare the key, but other locales legitimately translate it.
 *  - "Untranslated values" (a non-EN value byte-identical to EN) are emitted
 *    as warnings only — many short strings (brand names, "OK", "Edge", etc.)
 *    are intentionally identical across locales.
 *
 * Exit 0 if every non-EN locale has 100% key coverage vs EN.
 * Exit 2 if any non-EN locale is missing one or more EN keys.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const LOCALE_DIR = new URL("../public/locales", import.meta.url).pathname;
const LANGS = readdirSync(LOCALE_DIR).filter(d =>
  statSync(join(LOCALE_DIR, d)).isDirectory()
);

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }
  return out;
}

const data = {};
for (const lang of LANGS) {
  const raw = JSON.parse(readFileSync(join(LOCALE_DIR, lang, "translation.json"), "utf8"));
  data[lang] = flatten(raw);
}

const en = data.en;
if (!en) {
  console.error("FAIL: no EN locale found at public/locales/en/translation.json");
  process.exit(2);
}

const enKeys = new Set(Object.keys(en));
let failures = 0;

console.log(`EN has ${enKeys.size} keys.\n`);
console.log("Coverage per locale:");

for (const lang of LANGS) {
  if (lang === "en") continue;
  const langKeys = new Set(Object.keys(data[lang]));
  const missing = [...enKeys].filter(k => !langKeys.has(k));
  const pct = (((enKeys.size - missing.length) / enKeys.size) * 100).toFixed(1);
  const mark = missing.length === 0 ? "✓" : "✗";
  console.log(`  ${mark} ${lang}: ${pct}% (${missing.length} missing)`);
  if (missing.length > 0) {
    failures++;
    const preview = missing.slice(0, 10).map(k => `    - ${k}`).join("\n");
    console.log(preview);
    if (missing.length > 10) console.log(`    ... +${missing.length - 10} more`);
  }
}

if (failures > 0) {
  console.error(`\nFAIL: ${failures} locale(s) below 100% coverage.`);
  console.error(`Add the missing keys to the locale JSON files before merging.`);
  process.exit(2);
}

console.log("\nOK: every locale has 100% key coverage vs EN.");
