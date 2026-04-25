import { describe, it, expect } from 'vitest';
import { extractJsonLd, validateBlock } from '../audit-schema.mjs';

const HTML = `<html><head>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Test',
  })}</script>
  <script type="application/ld+json">${JSON.stringify({ broken: true })}</script>
</head></html>`;

describe('extractJsonLd', () => {
  it('returns parsed blocks', () => {
    const blocks = extractJsonLd(HTML);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]['@type']).toBe('Article');
  });

  it('skips invalid JSON gracefully', () => {
    const html = `<script type="application/ld+json">not json</script>`;
    const blocks = extractJsonLd(html);
    expect(blocks).toHaveLength(0);
  });
});

describe('validateBlock', () => {
  it('passes a well-formed Article', () => {
    const result = validateBlock({ '@context': 'https://schema.org', '@type': 'Article', headline: 'x' });
    expect(result.ok).toBe(true);
  });

  it('flags missing @context', () => {
    const result = validateBlock({ '@type': 'Article', headline: 'x' });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/@context/);
  });

  it('flags missing @type', () => {
    const result = validateBlock({ '@context': 'https://schema.org' });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/@type/);
  });
});
