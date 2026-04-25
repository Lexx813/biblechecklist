#!/usr/bin/env node
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'node-html-parser';
import { STATIC_ROUTES, BASE } from './lib/routes.mjs';
import { renderHeader, renderTable } from './lib/report.mjs';

// Reflects the current global default in app/layout.tsx — update when that
// changes so the audit knows what "default OG" looks like.
const DEFAULT_OG = {
  title: 'Bible Reading Tracker for New World Translation | JW Study',
  image: 'https://jwstudy.org/og-image.jpg',
};

export function parseOg(html) {
  const root = parse(html);
  const meta = (prop) =>
    root.querySelector(`meta[property="og:${prop}"]`)?.getAttribute('content') ?? null;
  return {
    title: meta('title'),
    description: meta('description'),
    image: meta('image'),
  };
}

export function isDefaultOg(og, baseline = DEFAULT_OG) {
  return og.title === baseline.title && og.image === baseline.image;
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'JW-Study-Audit/1.0' } });
  return { status: res.status, html: await res.text() };
}

async function main() {
  const rows = [];
  for (const route of STATIC_ROUTES) {
    const url = `${BASE}${route === '/' ? '' : route}`;
    try {
      const { status, html } = await fetchHtml(url);
      const og = parseOg(html);
      const isDefault = isDefaultOg(og);
      rows.push([route, status, og.title ?? '—', isDefault ? 'DEFAULT' : 'per-page']);
    } catch (e) {
      rows.push([route, 'ERR', e.message, '—']);
    }
  }

  const defaults = rows.filter((r) => r[3] === 'DEFAULT').length;
  const md =
    renderHeader('OG Per-Route Audit') +
    `**Routes audited:** ${rows.length}\n` +
    `**Using default OG:** ${defaults}\n` +
    `**Per-page OG:** ${rows.length - defaults}\n\n` +
    renderTable(['Route', 'Status', 'OG title', 'OG status'], rows);

  await mkdir(join(process.cwd(), 'audits'), { recursive: true });
  await writeFile(join(process.cwd(), 'audits', 'og.md'), md);
  console.log(`Wrote audits/og.md (default OG on ${defaults}/${rows.length} routes)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
