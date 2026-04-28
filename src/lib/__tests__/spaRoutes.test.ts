import { describe, it, expect } from 'vitest';
import { classifySlug, KNOWN_SPA_ROUTES } from '../spaRoutes';

/**
 * These tests are SEO-critical. The audit found that unknown paths were
 * returning soft-200 instead of 404. The fix relies on classifySlug() →
 * 'notfound' → notFound() in the catch-all RSC. If this regresses, every
 * typo URL becomes an indexable thin page.
 */

describe('classifySlug', () => {
  it('returns "root" for empty / undefined / nullish slug (the homepage)', () => {
    expect(classifySlug([])).toBe('root');
    expect(classifySlug(undefined)).toBe('root');
    expect(classifySlug(null)).toBe('root');
  });

  it('returns "spa" for known SPA route prefixes', () => {
    expect(classifySlug(['quiz'])).toBe('spa');
    expect(classifySlug(['feed'])).toBe('spa');
    expect(classifySlug(['messages', 'abc-123'])).toBe('spa');
  });

  it('returns "notfound" for unknown first segments — must produce 404', () => {
    expect(classifySlug(['this-does-not-exist-12345'])).toBe('notfound');
    expect(classifySlug(['random-slug'])).toBe('notfound');
    expect(classifySlug(['💩'])).toBe('notfound');
  });

  it('first-segment match is case-sensitive', () => {
    // Middleware lowercases the path before reaching this code, so an
    // uppercase variant should never reach here. But defense-in-depth: if
    // it does, treat it as not-found rather than soft-200.
    expect(classifySlug(['QUIZ'])).toBe('notfound');
  });

  it('classification is driven only by the first segment', () => {
    expect(classifySlug(['quiz', 'whatever-comes-next'])).toBe('spa');
    expect(classifySlug(['nonsense', 'quiz'])).toBe('notfound');
  });
});

describe('KNOWN_SPA_ROUTES sanity', () => {
  it('contains the auth + tracker entry points', () => {
    expect(KNOWN_SPA_ROUTES.has('login')).toBe(true);
    expect(KNOWN_SPA_ROUTES.has('signup')).toBe(true);
    expect(KNOWN_SPA_ROUTES.has('home')).toBe(true);
    expect(KNOWN_SPA_ROUTES.has('checklist')).toBe(true);
  });

  it('does NOT include public SSR-only routes (those have their own app/ folder)', () => {
    // /blog, /forum, /about, /books, /plans, /messianic-prophecies, /songs are
    // separate Next routes — adding them here would shadow the real route.
    expect(KNOWN_SPA_ROUTES.has('blog')).toBe(false);
    expect(KNOWN_SPA_ROUTES.has('forum')).toBe(false);
    expect(KNOWN_SPA_ROUTES.has('about')).toBe(false);
    expect(KNOWN_SPA_ROUTES.has('books')).toBe(false);
    expect(KNOWN_SPA_ROUTES.has('plans')).toBe(false);
    expect(KNOWN_SPA_ROUTES.has('messianic-prophecies')).toBe(false);
    expect(KNOWN_SPA_ROUTES.has('songs')).toBe(false);
  });
});
