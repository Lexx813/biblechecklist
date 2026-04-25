import { describe, it, expect } from 'vitest';
import { renderTable, renderHeader } from '../lib/report.mjs';

describe('renderTable', () => {
  it('renders an empty table as just headers', () => {
    expect(renderTable(['A', 'B'], [])).toBe('| A | B |\n|---|---|\n');
  });

  it('renders rows', () => {
    const out = renderTable(['Route', 'Score'], [['/', '92'], ['/about', '88']]);
    expect(out).toContain('| / | 92 |');
    expect(out).toContain('| /about | 88 |');
  });

  it('escapes pipe characters in cells', () => {
    expect(renderTable(['x'], [['a|b']])).toContain('a\\|b');
  });
});

describe('renderHeader', () => {
  it('emits an h1 and a generated-at line', () => {
    const out = renderHeader('Baseline Audit', new Date('2026-04-25T00:00:00Z'));
    expect(out).toContain('# Baseline Audit');
    expect(out).toContain('Generated 2026-04-25');
  });
});
