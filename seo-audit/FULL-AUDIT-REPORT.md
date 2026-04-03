# Full SEO Audit Report — nwtprogress.com

**Date:** 2026-04-03
**Site:** https://nwtprogress.com
**Stack:** Next.js 15, React 19, Supabase, Vercel
**Indexed pages:** 122 (per sitemap)

---

## SEO Health Score: 73 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|----------|
| Technical SEO | 22% | 82 | 18.0 |
| Content Quality | 23% | 74 | 17.0 |
| On-Page SEO | 20% | 78 | 15.6 |
| Schema / Structured Data | 10% | 80 | 8.0 |
| Performance (CWV) | 10% | 65 | 6.5 |
| AI Search Readiness (GEO) | 10% | 71 | 7.1 |
| Images | 5% | 50 | 2.5 |
| **Total** | **100%** | | **74.7 -> 73** |

---

## Executive Summary

NWT Progress has a **strong technical SEO foundation** — SSR on all public pages, comprehensive structured data (14+ JSON-LD schemas), excellent security headers, and proper AI crawler access. The site is well ahead of most SPA-to-Next.js migrations.

### Top 5 Critical Issues

1. **Soft 404s** — catch-all route returns HTTP 200 for non-existent URLs, wasting crawl budget
2. **Landing page has zero SSR content** — Googlebot sees an empty body for the homepage
3. **Conflicting structured data** — old `index.html` has different pricing ($4.99) vs Next.js layout ($3.00)
4. **Render-blocking Google Fonts CSS** — adds 200-500ms to LCP on every page
5. **~20 `<img>` tags without width/height** — causing CLS across the app

### Top 5 Quick Wins

1. **Add SearchAction to WebSite schema** — enables sitelinks search box (5 min)
2. **Remove empty `sameAs` arrays** from Organization schema (1 min)
3. **Add 3 missing pages to sitemap** — /quiz, /checklist, /leaderboard (5 min)
4. **Delete stale `public/sitemap.xml`** — superseded by dynamic `app/sitemap.ts` (1 min)
5. **Add meta descriptions to Privacy/Terms pages** (5 min)

---

## Technical SEO — 82/100

### Strengths
- Excellent security headers (HSTS with preload, CSP, X-Frame-Options DENY)
- SSR correctly applied to all public pages (blog, forum, study-topics, books)
- Clean URL structure (lowercase, kebab-case, no query params)
- robots.txt well-configured with explicit AI crawler allowlists
- HTTPS enforced with single redirect hop
- PWA manifest, viewport meta, apple-mobile-web-app tags all present

### Issues
| Priority | Issue | Impact |
|----------|-------|--------|
| CRITICAL | Catch-all `[[...slug]]` returns 200 for unknown paths (soft 404) | Crawl budget waste, junk indexing |
| HIGH | Missing `og:url` on /blog and /forum pages | Degraded social sharing |
| HIGH | No IndexNow implementation | Slower Bing/Yandex indexing |
| MEDIUM | Forum thread URLs missing from sitemap | Thread discovery gap |
| MEDIUM | Blog pages lack hreflang despite 6-language support | Intl SEO gap |
| MEDIUM | All blog posts share generic `og-image.webp` | Poor social CTR |

---

## Content Quality — 74/100

### Strengths
- Blog post SSR is excellent: `generateMetadata()`, BlogPosting schema, dynamic OG images, RSS feed
- 66 Bible book pages with unique per-book summaries, key verses, and Article schema
- 8 study topic pages with scripture-backed content (90/100 AI citation readiness)
- FAQ schema with 8 Q&A pairs on homepage

### Issues
| Priority | Issue | Impact |
|----------|-------|--------|
| CRITICAL | Landing page has 0 SSR content (100% client-rendered) | Invisible to crawlers |
| CRITICAL | `index.html` (Vite-era) conflicts with `app/layout.tsx` schemas | Contradictory pricing signals |
| HIGH | Privacy/Terms pages have no meta descriptions | Misleading SERP snippets |
| HIGH | About page SSR content is thin (~250 words vs 500 minimum) | Weak E-E-A-T |
| MEDIUM | No author bios on blog posts | Weak expertise signals |
| MEDIUM | Study topic `dateModified` hardcoded to past dates | Stale freshness signals |

### E-E-A-T: 68/100
- Experience: 72 (creator bio, testimonials — but initials only)
- Expertise: 70 (good scripture knowledge, but UGC blog quality varies)
- Authoritativeness: 60 (no social profiles, empty `sameAs`, no external citations)
- Trustworthiness: 75 (contact email, privacy policy, Stripe, subscription transparency)

---

## Schema / Structured Data — 80/100

### Strengths
- 14+ SSR pages with JSON-LD (all using correct format)
- BreadcrumbList on every public page
- BlogPosting, DiscussionForumPosting, Article, Course, ItemList — all appropriate
- No deprecated types, no broken schemas

### Issues
| Priority | Issue | Fix |
|----------|-------|-----|
| HIGH | Missing SearchAction on WebSite | Add `potentialAction` targeting `/search?q={query}` |
| HIGH | Missing `offers` on Course schema | Add free/premium offers for rich result eligibility |
| MEDIUM | Empty `sameAs: []` on Organization + WebApplication | Remove or populate |
| MEDIUM | Hardcoded dates on Article schemas (study-topics, books) | Use real dates |
| LOW | No ItemList on /study-topics index | Add for consistency |

---

## Sitemap — B+

### Strengths
- Dynamic generation via `app/sitemap.ts` with hourly revalidation
- 122 URLs, all returning 200
- Blog posts use real `updated_at` from Supabase
- robots.txt correctly references sitemap

### Issues
| Priority | Issue | Fix |
|----------|-------|-----|
| HIGH | 3 missing public pages: /quiz, /checklist, /leaderboard | Add to `staticPages` in sitemap.ts |
| MEDIUM | Stale `public/sitemap.xml` (17 URLs) superseded by dynamic | Delete the file |
| MEDIUM | 79 URLs share hardcoded `2026-01-01` lastmod | Use real dates or omit |
| LOW | `changefreq` and `priority` tags (ignored by Google) | Remove for cleanup |

---

## Performance (CWV) — 65/100

### Estimated Scores (Mobile)
- **LCP:** 2.5-3.5s (Needs Improvement) — bottlenecked by render-blocking font
- **INP:** <200ms (Good) — SVG-based UI, lazy-loaded routes
- **CLS:** At risk (>0.1) — images without dimensions

### Strengths
- Self-hosted variable font with preload (Plus Jakarta Sans)
- `React.lazy()` for all 30+ routes
- Sentry deferred via `requestIdleCallback`
- Excellent Vercel cache headers (1-year immutable for static assets)
- GA4 and Vercel Analytics non-blocking

### Issues
| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| P0 | Render-blocking Google Fonts CSS (Cormorant Garamond) | LCP +200-500ms | 1 hour |
| P1 | ~20 `<img>` tags without width/height | CLS failures | 1-2 hours |
| P1 | Supabase SDK in landing page bundle (~45KB gz) | Bloated critical JS | 1 hour |
| P2 | No `next/image` used — raw `<img>` everywhere | No auto optimization | 3-4 hours |
| P2 | `app.css` is 53KB loaded globally | Excess CSS | 2-3 hours |
| P3 | 78KB English translation JSON bundled inline | TBT impact | 2-3 hours |

---

## AI Search Readiness (GEO) — 71/100

### Strengths
- All major AI crawlers explicitly allowed (GPTBot, ClaudeBot, PerplexityBot)
- `/llms.txt` present and well-structured (top 2% of sites)
- Study topics highly citable (90/100) — question headings, scripture citations
- FAQ schema provides 8 directly quotable Q&A pairs
- `max-snippet:-1` allows unlimited snippet extraction

### Issues
| Priority | Issue | Impact |
|----------|-------|--------|
| HIGH | Paragraphs too short (60-90 words vs optimal 134-167) | Reduces AI citation probability |
| HIGH | No direct answers in first 40-60 words of study topics | AI skips opening paragraphs |
| MEDIUM | Hidden SSR content (display:none, clip patterns) | May be discounted |
| MEDIUM | No `/llms-full.txt` with complete article text | AI must crawl each page |
| MEDIUM | No YouTube/Reddit presence | Highest correlation with AI citations |
| LOW | No statistics with source citations | Reduces credibility signals |

### Platform Scores
| Platform | Score |
|----------|-------|
| Google AI Overviews | 68/100 |
| ChatGPT / SearchGPT | 72/100 |
| Perplexity | 70/100 |
| Bing Copilot | 74/100 |

---

## Images — 50/100

### Issues
- No `next/image` component used anywhere — all raw `<img>` tags
- ~20 images missing `width`/`height` attributes (CLS risk)
- No automatic responsive `srcset` generation
- No automatic AVIF/WebP conversion for user-uploaded images
- Blog posts share generic OG image instead of unique per-post images
- Study topics have no images at all (multi-modal weakness)

### Strengths
- `next.config.js` properly configured for AVIF/WebP with 1-year cache
- `remotePatterns` allows Supabase and Unsplash URLs
- Dynamic OG image generation exists for individual blog posts (`opengraph-image.tsx`)
