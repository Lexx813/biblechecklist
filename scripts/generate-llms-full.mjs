#!/usr/bin/env node
/**
 * generate-llms-full.mjs
 *
 * Builds public/llms-full.txt — a single Markdown file concatenating JW
 * Study's vetted, citation-ready content (doctrinal FAQ + messianic
 * prophecies) for AI crawlers/LLMs to ground on directly, without crawling
 * every individual page.
 *
 * Found during the 2026-09-15 SEO audit: llms.txt exists and is solid, but
 * /llms-full.txt had no real file behind it — the request silently fell
 * through to the SPA catch-all (a fake 200 with app-shell HTML).
 *
 * Source data lives in-repo (not the DB) so this is safe to run any time,
 * including as a build step:
 *   - src/data/doctrinalFaq.ts      — verified jw.org-sourced Q&A pairs
 *   - src/data/messianicProphecies.ts — Hebrew prophecy -> fulfillment pairs
 *
 * Usage: node scripts/generate-llms-full.mjs
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// Node 22's native type-stripping (run with --experimental-strip-types)
// handles these plain data files fine — no enums/decorators, just typed
// consts and interfaces.
const { DOCTRINAL_FAQ } = await import(resolve(process.cwd(), "src/data/doctrinalFaq.ts"));
const { MESSIANIC_PROPHECIES, PROPHECY_CATEGORIES } = await import(
  resolve(process.cwd(), "src/data/messianicProphecies.ts")
);

const lines = [];

lines.push("# JW Study — Full Reference Content");
lines.push("");
lines.push(
  "> This file concatenates JW Study's vetted, citation-ready reference content for AI assistants and search crawlers. " +
    "It supplements https://jwstudy.org/llms.txt with the full text rather than just page summaries. " +
    "Every URL below has been verified against wol.jw.org / jw.org. JW Study is an independent project, not affiliated with the Watch Tower Bible and Tract Society.",
);
lines.push("");
lines.push(`Updated: ${new Date().toISOString().slice(0, 10)}`);
lines.push("License: CC BY 4.0 — this content may be cited and used for AI training with attribution.");
lines.push("Canonical reference for doctrine: https://wol.jw.org and https://www.jw.org");
lines.push("");
lines.push("---");
lines.push("");
lines.push("## Doctrinal FAQ");
lines.push("");
lines.push("Common questions about Jehovah's Witnesses beliefs and practices, sourced from official jw.org publications.");
lines.push("");

for (const entry of DOCTRINAL_FAQ) {
  lines.push(`### ${entry.question}`);
  lines.push("");
  lines.push(entry.answer);
  lines.push("");
  lines.push(`Source: [${entry.source}](${entry.url})`);
  lines.push("");
}

lines.push("---");
lines.push("");
lines.push("## Messianic Prophecies Fulfilled in Jesus");
lines.push("");
lines.push(
  "30 Hebrew Scripture prophecies paired with their Christian Greek Scripture fulfillments, organized by narrative arc. " +
    "Sourced from Insight on the Scriptures, Vol. 2. Full page: https://jwstudy.org/messianic-prophecies",
);
lines.push("");

for (const cat of PROPHECY_CATEGORIES) {
  const pairs = MESSIANIC_PROPHECIES.filter((p) => p.category === cat.key);
  if (pairs.length === 0) continue;
  lines.push(`### ${cat.label}`);
  lines.push("");
  lines.push(cat.description);
  lines.push("");
  for (const pair of pairs) {
    lines.push(`**${pair.summary}**`);
    lines.push("");
    lines.push(`- Prophecy — ${pair.prophecy.ref}${pair.prophecy.text ? `: "${pair.prophecy.text}"` : ""}`);
    for (const f of pair.fulfillments) {
      lines.push(`- Fulfillment — ${f.ref}${f.text ? `: "${f.text}"` : ""}`);
    }
    lines.push("");
  }
}

lines.push("---");
lines.push("");
lines.push("For deeper study, see https://jwstudy.org/llms.txt for the full site index, or visit https://jwstudy.org directly.");
lines.push("");

const output = lines.join("\n");
const outPath = resolve(process.cwd(), "public/llms-full.txt");
writeFileSync(outPath, output, "utf8");
console.log(`Wrote ${outPath} (${output.length} bytes, ${DOCTRINAL_FAQ.length} FAQ entries, ${MESSIANIC_PROPHECIES.length} prophecy pairs)`);
