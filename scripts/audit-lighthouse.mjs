#!/usr/bin/env node
// Runs Lighthouse via the PageSpeed Insights API — no local Chrome required.
// PSI runs Lighthouse on Google's infra and returns the full LHR JSON.
// Free for low volume; set PSI_API_KEY env to raise the per-day quota.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { STATIC_ROUTES, BASE } from './lib/routes.mjs';
import { renderHeader, renderTable } from './lib/report.mjs';

const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const STRATEGY = 'mobile';
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

function slugify(route) {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
}

function pct(score) {
  return score == null ? '—' : Math.round(score * 100);
}

export function extractSummary(lhr) {
  const c = lhr?.categories ?? {};
  const a = lhr?.audits ?? {};
  return {
    perf: pct(c.performance?.score),
    a11y: pct(c.accessibility?.score),
    bp: pct(c['best-practices']?.score),
    seo: pct(c.seo?.score),
    lcp: a['largest-contentful-paint']?.displayValue ?? '—',
    cls: a['cumulative-layout-shift']?.displayValue ?? '—',
    inp: a['interaction-to-next-paint']?.displayValue ?? '—',
  };
}

async function runPsi(url, attempt = 1) {
  const params = new URLSearchParams({ url, strategy: STRATEGY });
  for (const cat of CATEGORIES) params.append('category', cat);
  if (process.env.PSI_API_KEY) params.set('key', process.env.PSI_API_KEY);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) {
    // Retry transient PSI 500s (Lighthouse internal flakes) up to 3 times.
    if (res.status === 500 && attempt < 3) {
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      return runPsi(url, attempt + 1);
    }
    const text = await res.text();
    throw new Error(`PSI ${res.status}: ${text.slice(0, 200)}`);
  }
  const body = await res.json();
  return body.lighthouseResult;
}

async function main() {
  const outDir = join(process.cwd(), 'audits', 'lighthouse');
  await mkdir(outDir, { recursive: true });
  const rows = [];

  for (const route of STATIC_ROUTES) {
    const url = `${BASE}${route === '/' ? '' : route}`;
    process.stdout.write(`Auditing ${url} … `);
    try {
      const lhr = await runPsi(url);
      const s = extractSummary(lhr);
      rows.push([route, s.perf, s.a11y, s.bp, s.seo, s.lcp, s.cls, s.inp]);
      await writeFile(join(outDir, `${slugify(route)}.json`), JSON.stringify(lhr, null, 2));
      console.log('ok');
    } catch (e) {
      const oneLine = e.message.replace(/\s+/g, ' ').slice(0, 80);
      rows.push([route, 'ERR', 'ERR', 'ERR', 'ERR', oneLine, '—', '—']);
      console.log(`FAILED: ${e.message}`);
    }
    // Be polite — PSI throttles aggressive callers.
    await new Promise((r) => setTimeout(r, 1500));
  }

  const md =
    renderHeader('Lighthouse Audit (mobile, via PageSpeed Insights API)') +
    `Base URL: ${BASE}\n` +
    `Strategy: ${STRATEGY}\n\n` +
    renderTable(['Route', 'Perf', 'A11y', 'BP', 'SEO', 'LCP', 'CLS', 'INP'], rows);

  await writeFile(join(process.cwd(), 'audits', 'lighthouse.md'), md);
  console.log('Wrote audits/lighthouse.md');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
