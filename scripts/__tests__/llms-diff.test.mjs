import { describe, it, expect } from 'vitest';
import { extractRoutes, diffRoutes } from '../audit-llms.mjs';

describe('extractRoutes', () => {
  it('parses route lines from llms.txt', () => {
    const txt = `# Title\n## Key pages\n\n- / — Homepage\n- /about — About\n- /blog — Blog\n`;
    const routes = extractRoutes(txt);
    expect(routes).toContain('/');
    expect(routes).toContain('/about');
    expect(routes).toContain('/blog');
  });

  it('ignores non-route bullet lines', () => {
    const txt = `- not a route\n- /valid — desc\n`;
    expect(extractRoutes(txt)).toEqual(['/valid']);
  });
});

describe('diffRoutes', () => {
  it('returns missing routes (in expected, not in llms)', () => {
    const { missing } = diffRoutes(['/', '/about'], ['/']);
    expect(missing).toEqual(['/about']);
  });

  it('returns stale routes (in llms, not in expected)', () => {
    const { stale } = diffRoutes(['/'], ['/', '/old']);
    expect(stale).toEqual(['/old']);
  });
});
