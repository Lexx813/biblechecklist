#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { STATIC_ROUTES, BASE } from './lib/routes.mjs';
import { renderHeader, renderTable } from './lib/report.mjs';

export function extractJsonLd(html) {
  const root = parse(html);
  const blocks = [];
  for (const node of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const text = node.text || node.innerHTML;
      blocks.push(JSON.parse(text));
    } catch {
      /* ignore malformed */
    }
  }
  return blocks;
}

export function validateBlock(block) {
  const errors = [];
  if (!block || typeof block !== 'object') {
    return { ok: false, errors: ['not an object'] };
  }
  if (!block['@context']) errors.push('missing @context');
  if (!block['@type']) errors.push('missing @type');
  return { ok: errors.length === 0, errors };
}

async function main() {
  const rows = [];
  for (const route of STATIC_ROUTES) {
    const url = `${BASE}${route === '/' ? '' : route}`;
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'JW-Study-Audit/1.0' } });
      const html = await res.text();
      const blocks = extractJsonLd(html);
      const types = blocks.map((b) => b['@type']).filter(Boolean).join(', ') || '—';
      const errors = blocks.flatMap((b) => validateBlock(b).errors);
      rows.push([route, blocks.length, types, errors.length === 0 ? 'OK' : `ERR(${errors.length})`]);
    } catch (e) {
      rows.push([route, 0, '—', `FETCH_ERR: ${e.message}`]);
    }
  }

  const md =
    renderHeader('Schema (JSON-LD) Audit') +
    renderTable(['Route', 'Blocks', '@type(s)', 'Result'], rows);

  await mkdir(join(process.cwd(), 'audits'), { recursive: true });
  await writeFile(join(process.cwd(), 'audits', 'schema.md'), md);
  console.log(`Wrote audits/schema.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
