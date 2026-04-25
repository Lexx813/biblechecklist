#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { STATIC_ROUTES, isAuditedRoute } from './lib/routes.mjs';
import { renderHeader, renderTable } from './lib/report.mjs';

const ROUTE_LINE = /^-\s+(\/[^\s—]*)\s+—/;

export function extractRoutes(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    const m = ROUTE_LINE.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}

export function diffRoutes(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  const missing = expected.filter((r) => !actualSet.has(r));
  const stale = actual.filter((r) => !expectedSet.has(r));
  return { missing, stale };
}

async function main() {
  const llmsPath = join(process.cwd(), 'public', 'llms.txt');
  const text = await readFile(llmsPath, 'utf8');
  const actual = extractRoutes(text);

  // Expected: every static route from the canonical list, plus the index pages
  // for dynamic routes (so /blog appears, but not /blog/[slug] which is per-post).
  const expected = STATIC_ROUTES;
  const rawDiff = diffRoutes(expected, actual);
  const missing = rawDiff.missing;
  // Only flag a route as "stale" if it is not a valid public URL pattern at
  // all. Listing dynamic children (e.g. /study-topics/<slug>) in llms.txt is
  // legitimate — the diff is for routes that no longer exist on the site.
  const stale = rawDiff.stale.filter((r) => !isAuditedRoute(r));

  const md =
    renderHeader('llms.txt Route Coverage') +
    `**Expected static routes:** ${expected.length}\n` +
    `**Found in llms.txt:** ${actual.length}\n` +
    `**Missing:** ${missing.length}\n` +
    `**Stale:** ${stale.length}\n\n` +
    `## Missing\n\n${renderTable(['Route'], missing.map((r) => [r]))}\n` +
    `## Stale\n\n${renderTable(['Route'], stale.map((r) => [r]))}\n`;

  const outDir = join(process.cwd(), 'audits');
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'llms-diff.md'), md);
  console.log(`Wrote audits/llms-diff.md (missing: ${missing.length}, stale: ${stale.length})`);

  if (missing.length > 0) process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
