import { describe, it, expect } from 'vitest';
import { extractSummary } from '../audit-lighthouse.mjs';

const FAKE_LHR = {
  categories: {
    performance: { score: 0.92 },
    accessibility: { score: 0.97 },
    'best-practices': { score: 1 },
    seo: { score: 1 },
  },
  audits: {
    'largest-contentful-paint': { displayValue: '2.1 s', numericValue: 2100 },
    'cumulative-layout-shift': { displayValue: '0.05', numericValue: 0.05 },
    'interaction-to-next-paint': { displayValue: '180 ms', numericValue: 180 },
  },
};

describe('extractSummary', () => {
  it('returns a row of percent scores and CWV displayValues', () => {
    const row = extractSummary(FAKE_LHR);
    expect(row.perf).toBe(92);
    expect(row.a11y).toBe(97);
    expect(row.bp).toBe(100);
    expect(row.seo).toBe(100);
    expect(row.lcp).toBe('2.1 s');
    expect(row.cls).toBe('0.05');
    expect(row.inp).toBe('180 ms');
  });

  it('handles missing categories gracefully', () => {
    const row = extractSummary({ categories: {}, audits: {} });
    expect(row.perf).toBe('—');
    expect(row.lcp).toBe('—');
  });
});
