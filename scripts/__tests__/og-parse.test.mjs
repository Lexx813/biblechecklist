import { describe, it, expect } from 'vitest';
import { parseOg, isDefaultOg } from '../audit-og.mjs';

const HTML = `<html><head>
  <meta property="og:title" content="Per-page title" />
  <meta property="og:description" content="Per-page desc" />
  <meta property="og:image" content="https://jwstudy.org/blog/x.png" />
</head></html>`;

describe('parseOg', () => {
  it('extracts og:title, og:description, og:image', () => {
    const og = parseOg(HTML);
    expect(og.title).toBe('Per-page title');
    expect(og.description).toBe('Per-page desc');
    expect(og.image).toBe('https://jwstudy.org/blog/x.png');
  });

  it('returns nulls when missing', () => {
    const og = parseOg('<html><head></head></html>');
    expect(og.title).toBeNull();
  });
});

describe('isDefaultOg', () => {
  const DEFAULT = {
    title: 'Bible Reading Tracker for New World Translation | JW Study',
    image: 'https://jwstudy.org/og-image.jpg',
  };

  it('flags exact-default OG', () => {
    expect(isDefaultOg({ title: DEFAULT.title, image: DEFAULT.image }, DEFAULT)).toBe(true);
  });

  it('does not flag a per-page OG', () => {
    expect(isDefaultOg({ title: 'Custom', image: 'https://jwstudy.org/blog/x.png' }, DEFAULT)).toBe(false);
  });
});
