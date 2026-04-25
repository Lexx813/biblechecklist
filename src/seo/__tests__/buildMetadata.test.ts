import { describe, it, expect } from 'vitest';
import { buildMetadata } from '../metadata';

describe('buildMetadata', () => {
  it('emits canonical pointing to the route', () => {
    const m = buildMetadata({ route: '/about', title: 'About', description: 'd' });
    expect(m.alternates?.canonical).toBe('https://jwstudy.org/about');
  });

  it('omits hreflang languages by default (single-URL i18n)', () => {
    const m = buildMetadata({ route: '/about', title: 'About', description: 'd' });
    expect(m.alternates?.languages).toBeUndefined();
  });

  it('emits hreflang languages when localizedPaths provided', () => {
    const m = buildMetadata({
      route: '/blog/x',
      title: 'X',
      description: 'd',
      localizedPaths: { en: 'https://jwstudy.org/blog/x', es: 'https://jwstudy.org/blog/x-es' },
    });
    const langs = m.alternates?.languages as Record<string, string>;
    expect(langs.en).toBe('https://jwstudy.org/blog/x');
    expect(langs.es).toBe('https://jwstudy.org/blog/x-es');
    expect(langs['x-default']).toBe('https://jwstudy.org/blog/x');
  });

  it('respects an ogImage override', () => {
    const m = buildMetadata({
      route: '/blog/post', title: 'Post', description: 'd', ogImage: '/blog/post-og.png',
    });
    const og = m.openGraph?.images;
    const first = Array.isArray(og) ? og[0] : og;
    expect(first).toMatchObject({ url: '/blog/post-og.png' });
  });

  it('marks article type when type=article', () => {
    const m = buildMetadata({ route: '/blog/x', title: 't', description: 'd', type: 'article' });
    expect((m.openGraph as { type?: string } | undefined)?.type).toBe('article');
  });

  it('falls back to global default OG image when none provided', () => {
    const m = buildMetadata({ route: '/about', title: 'About', description: 'd' });
    const og = m.openGraph?.images;
    const first = Array.isArray(og) ? og[0] : og;
    expect(first).toMatchObject({ url: '/og-image.jpg' });
  });
});
