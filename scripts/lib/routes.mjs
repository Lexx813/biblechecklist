// Canonical list of public routes audited by Phase 0 scripts.
// Authed routes (HomePage panels) are intentionally excluded — they are not
// part of this polish phase. Dynamic patterns are matched by isAuditedRoute().

export const STATIC_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/study-topics',
  '/forum',
  '/books',
  '/plans',
  '/promo',
];

const DYNAMIC_PATTERNS = [
  /^\/blog\/[^/]+$/,
  /^\/study-topics\/[^/]+$/,
  /^\/books\/[^/]+$/,
  /^\/plans\/[^/]+$/,
  /^\/forum\/[^/]+$/,
  /^\/forum\/[^/]+\/[^/]+$/,
  /^\/share\/[^/]+$/,
];

const AUTHED_PREFIXES = ['/notes', '/quiz', '/notifications', '/messages', '/settings'];

export function isAuditedRoute(path) {
  if (AUTHED_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) {
    return false;
  }
  if (STATIC_ROUTES.includes(path)) return true;
  return DYNAMIC_PATTERNS.some((re) => re.test(path));
}

export const BASE = process.env.AUDIT_BASE_URL || 'https://jwstudy.org';
