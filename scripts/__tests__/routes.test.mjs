import { describe, it, expect } from 'vitest';
import { STATIC_ROUTES, isAuditedRoute } from '../lib/routes.mjs';

describe('STATIC_ROUTES', () => {
  it('includes the homepage', () => {
    expect(STATIC_ROUTES).toContain('/');
  });

  it('includes /about, /blog, /forum, /books, /plans, /study-topics, /promo', () => {
    for (const r of ['/about', '/blog', '/forum', '/books', '/plans', '/study-topics', '/promo']) {
      expect(STATIC_ROUTES).toContain(r);
    }
  });

  it('does not include authed routes', () => {
    for (const r of ['/notes', '/quiz', '/notifications', '/messages']) {
      expect(STATIC_ROUTES).not.toContain(r);
    }
  });
});

describe('isAuditedRoute', () => {
  it('returns true for static routes', () => {
    expect(isAuditedRoute('/about')).toBe(true);
  });

  it('returns true for dynamic blog post URLs', () => {
    expect(isAuditedRoute('/blog/some-slug')).toBe(true);
  });

  it('returns false for authed routes', () => {
    expect(isAuditedRoute('/notes')).toBe(false);
  });
});
