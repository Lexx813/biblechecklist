import { describe, it, expect } from 'vitest';
import { getHreflangMap } from '../hreflang';

describe('getHreflangMap', () => {
  it('emits an entry per locale plus x-default', () => {
    const map = getHreflangMap('/about');
    expect(map.en).toBe('https://jwstudy.org/about');
    expect(map.es).toBe('https://jwstudy.org/about?lang=es');
    expect(map['x-default']).toBe('https://jwstudy.org/about');
  });

  it('handles the homepage path correctly', () => {
    const map = getHreflangMap('/');
    expect(map.en).toBe('https://jwstudy.org/');
    expect(map.es).toBe('https://jwstudy.org/?lang=es');
  });

  it('preserves trailing path segments', () => {
    const map = getHreflangMap('/study-topics/jehovahs-name');
    expect(map.en).toBe('https://jwstudy.org/study-topics/jehovahs-name');
    expect(map.fr).toBe('https://jwstudy.org/study-topics/jehovahs-name?lang=fr');
  });
});
