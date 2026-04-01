# NWT Progress — Full SEO Audit Report
**Date:** April 2026  
**Site:** nwtprogress.com  
**Audited by:** 6-agent parallel audit (Technical SEO, Content/E-E-A-T, Schema, Sitemap, GEO/AI, Performance)

---

## Executive Summary

**Overall SEO Health Score: 48 / 100**

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Technical SEO | 54/100 | 22% | 11.9 |
| Content Quality (E-E-A-T) | 42/100 | 23% | 9.7 |
| On-Page SEO | 65/100 | 20% | 13.0 |
| Schema / Structured Data | 35/100 | 10% | 3.5 |
| Performance (CWV) | 45/100 | 10% | 4.5 |
| AI Search Readiness (GEO) | 61/100 | 10% | 6.1 |
| Images | 60/100 | 5% | 3.0 |

**Business type detected:** Niche spiritual utility app (Bible reading tracker for Jehovah's Witnesses)

### Top 5 Critical Issues

1. **Global canonical pointing every page to homepage** — `layout.jsx` line 12 sets `alternates: { canonical: "/" }` in root metadata, causing Google to treat every blog post, forum thread, about page, and study topic as a duplicate of the homepage. Catastrophic for indexing.

2. **All page body content rendered client-side (`ssr: false`)** — Googlebot receives only `<head>` meta tags for the homepage, about page, and study topics. Blog/forum shells serve meta-only SSR; body content is in a dehydrated JSON `<script>` blob, not semantic HTML. Effectively zero crawlable body text across the entire site.

3. **Static sitemap missing all dynamic content** — `/public/sitemap.xml` does not include any `/blog/[slug]` or `/forum/[categoryId]/[threadId]` URLs. All published blog posts and forum threads are invisible to Google's sitemap crawler.

4. **Study topics entirely invisible to search engines** — `/study-topics/*` routes target high-volume theological queries ("Is Jesus God", "What happens when we die Bible") but render via `[[...slug]]` SPA with no SSR route. Zero crawlable content exists for these pages.

5. **Zero Article/BlogPosting or DiscussionForumPosting schema** — Blog post SSR shells have `og:type: "article"` but no JSON-LD. Forum thread shells have no structured data at all. Both are invisible to AI citation engines and rich result systems.

### Top 5 Quick Wins

1. Remove `alternates: { canonical: "/" }` from `app/layout.jsx` — prevents global canonicalization to homepage with one line deletion.
2. Remove `preconnect` to `api.anthropic.com` from `layout.jsx` lines 103–104 — AI is disabled; this wastes 20–50 ms per page load.
3. Fix www → apex redirect from 307 to 301 in `vercel.json` — a one-line fix that improves crawl efficiency and consolidates link equity.
4. Move `FAQPage` JSON-LD from root layout to homepage-only — saves ~3 KB on every non-homepage page load and prevents schema duplication.
5. Fix pricing inconsistency: About page says `$3/month`, schema says `$4.99/month` — one number is wrong.

---

## Technical SEO

**Score: 54 / 100**

### Crawlability

| Check | Status | Notes |
|---|---|---|
| robots.txt accessible | Pass | Disallows auth-gated routes correctly |
| AI crawler allowlist | Pass | GPTBot, PerplexityBot, Claude-Web, anthropic-ai, ChatGPT-User all explicitly allowed |
| Sitemap declared in robots.txt | Pass | `Sitemap: https://nwtprogress.com/sitemap.xml` present |
| Render architecture | **FAIL** | `ssr: false` in `ClientShell.jsx` means zero body HTML for all routes |
| Crawl budget efficiency | **FAIL** | Auth-gated routes `/quiz`, `/checklist`, `/settings` in sitemap, consuming crawl budget |

### Indexability

| Check | Status | Notes |
|---|---|---|
| Canonical tags | **CRITICAL FAIL** | `layout.jsx` global `canonical: "/"` — every page canonicalized to homepage |
| SPA canonical bug | **FAIL** | `useMeta` hook sets canonical to `/` when no `path` argument passed |
| robots meta | Pass | `max-snippet:-1, max-image-preview:large` on root layout |
| noindex tags | Pass | No unwanted noindex found |
| Orphan pages | Warn | Auth-gated routes listed in sitemap but not linked from main navigation |

### Security & Headers

| Check | Status | Notes |
|---|---|---|
| HTTPS | Pass | TLS enforced |
| HSTS | Pass | `strict-transport-security` present in Vercel response headers |
| CSP | Pass | Restrictive policy, confirms Sentry integration |
| www → apex redirect | **FAIL** | `vercel.json` uses HTTP 307 (temporary) — should be 301 (permanent) |

### Core Web Vitals (Technical Causes)

| Issue | Root Cause |
|---|---|
| LCP 3.0–4.5s | `ssr: false` defers all content rendering until 627 KB JS executes |
| Homepage cache MISS | `cache-control: private, no-cache` prevents CDN caching |
| 110 KB polyfills chunk | Deployed bundle pre-dates `browserslist` fix |

---

## Content Quality (E-E-A-T)

**Score: 42 / 100**

### Rendering Architecture Map

| URL Pattern | SSR? | What Google Sees |
|---|---|---|
| `/`, `/about`, `/terms`, `/privacy`, `/study-topics/*` | No | `<head>` meta only |
| `/blog`, `/blog/[slug]`, `/forum`, `/forum/*` | Meta-only | Title + description + OG tags; zero body HTML |

### E-E-A-T Breakdown

**Experience: 14 / 20**
- Strong: creator bio in About page (personal origin story, subscription transparency, named vendors)
- Strong: blog post bylines with avatar, date, read time
- Weak: creator bio is SPA-only — Google cannot read it
- Weak: hardcoded "500+" user count in `LandingPage.jsx` — stale/unverifiable claim

**Expertise: 16 / 25**
- Strong: study topics content is theologically accurate with correct NWT scripture citations; non-affiliation disclaimer appropriate
- Weak: no author bio text on blog posts (only display name + email)
- Weak: study topics at 300–415 words per topic are thin for competitive theological queries (competitors: 2,000–5,000 words)

**Authoritativeness: 12 / 25**
- Strong: robots.txt allows all major AI crawlers; llms.txt well-formed; FAQ schema with 7 entries is the site's strongest citation asset
- Weak: static sitemap missing all blog post and forum thread URLs
- Weak: About page (trust anchor) is SPA-rendered
- Weak: no external authority links in crawlable HTML layer

**Trustworthiness: 19 / 30**
- Strong: Privacy policy + ToS present; non-affiliation disclaimer; subscription cost transparency with named vendors
- Weak: Contact email is personal Gmail (`luaq777@gmail.com`) not domain email
- Weak: Creator name is display-name only, no photo (CREATOR_AVATAR_URL = null)
- **FAIL:** Pricing inconsistency — About page text says `$3/month`, schema and FAQ say `$4.99/month`

### Page-by-Page Word Count

| Page | Min Recommended | Crawlable Words | Gap |
|---|---|---|---|
| Homepage | 500 | ~0 (SPA) | -500 |
| About | 500 | ~0 (SPA) | -500 |
| Study Topic (any) | 1,500 | ~0 (SPA) | -1,500 |
| Blog index | 500 | ~0 (ClientShell) | -500 |
| Blog post | 1,500 | ~0 (body in JS blob) | -1,500 |
| Forum thread | 300 | ~0 (body in JS blob) | -300 |

---

## Schema / Structured Data

**Score: 35 / 100**

### Current Implementation

| Schema Type | Location | Present | Valid |
|---|---|---|---|
| WebApplication | `layout.jsx` | Yes | Mostly — `image` field references `.png` but OG uses `.webp` |
| Organization | `layout.jsx` | Yes | Partial — `logo` should be `ImageObject` not bare URL string; missing `@id` |
| WebSite | `layout.jsx` | Yes | Missing `SearchAction` (sitelinks searchbox opportunity); missing `@id` |
| FAQPage | `layout.jsx` (all pages) | Yes | 7 well-written entries; **misplaced** — emitted on every page, not homepage-only |
| Article / BlogPosting | blog post pages | **No** | Missing entirely |
| DiscussionForumPosting | forum thread pages | **No** | Missing entirely |
| BreadcrumbList | all pages | **No** | Missing entirely |

### Critical Schema Fixes

1. **`Organization.logo`** must be `ImageObject` with `url`, `width`, `height` per Google's Rich Results requirements
2. **Add `@id`** to `Organization` and `WebSite` blocks to enable graph-level entity disambiguation
3. **Move FAQPage** from root layout to `app/page.jsx` (homepage only)
4. **Add `Article` schema** to `app/blog/[slug]/page.jsx` with `headline`, `author`, `datePublished`, `publisher`, `description`
5. **Add `DiscussionForumPosting` schema** to `app/forum/[categoryId]/[threadId]/page.jsx`
6. **Add `BreadcrumbList`** to blog post and forum thread SSR pages

---

## Sitemap

**Score: 30 / 100**

### Current State (`/public/sitemap.xml`)

| Issue | Detail |
|---|---|
| Blog posts | **Missing** — zero `/blog/[slug]` URLs |
| Forum threads | **Missing** — zero `/forum/*` thread URLs |
| Auth-gated pages | **Included** — `/quiz`, `/checklist` should be removed |
| lastmod dates | All identical (2026-03-31) — stale/meaningless |
| Format | Static file, manually maintained |

### Recommendation

Replace static `/public/sitemap.xml` with dynamic `/app/sitemap.js` Next.js Route Handler. Query Supabase at build/revalidate time for all published blog slugs and forum thread IDs. Set accurate `lastmod` per record's `updated_at` column. Exclude auth-gated routes. Use `changeFrequency: "weekly"` for blog posts and `"daily"` for forum threads.

---

## Performance (Core Web Vitals)

**Score: 45 / 100**

### Estimated Metrics (cold-path, east-coast Vercel edge)

| Metric | Estimate | Status |
|---|---|---|
| LCP | 3.0 – 4.5 s | Needs Improvement → Poor |
| INP | 100 – 250 ms | Good → Needs Improvement |
| CLS | 0.00 – 0.05 | Good |
| TTFB (homepage) | ~470 ms | Okay |
| TTFB (blog/forum) | ~447 ms | Okay (CDN HIT) |

### Measurement Baseline

| Page | TTFB | HTML size | x-vercel-cache |
|---|---|---|---|
| / | 466 ms | 6.9 KB | MISS |
| /blog | 447 ms | 46 KB | HIT |
| /forum | 446 ms | 38 KB | HIT |

### JavaScript Bundle (deployed production)

```
169.4 KB  vendor chunk A
169.0 KB  vendor chunk B
110.0 KB  polyfills  ← should be <20 KB after browserslist fix deploys
 67.2 KB  vendor/feature chunk
 64.3 KB  vendor/feature chunk
────────────
627 KB total (uncompressed)
```

### Key Findings

- **Root cause of poor LCP:** `ClientShell.jsx` uses `dynamic(() => import('../../src/App'), { ssr: false })` — all content rendering waits for 627 KB JS bundle parse + execute. The `HydrationBoundary` dehydrated state speeds up post-hydration data availability but does not help first paint.
- **Homepage gets `x-vercel-cache: MISS`** on every request (`private, no-cache` headers). Consider whether the shell is truly personalized; if not, enable CDN caching.
- **Polyfills chunk: 110 KB deployed.** The `browserslist` fix in `package.json` may not have been rebuilt/deployed yet. After a clean build + deploy, this should drop to under 20 KB (saving ~90 KB).
- **Wasted `preconnect` to `api.anthropic.com`** on every page while AI is disabled.
- **Font loading: well-implemented.** Variable woff2 at 27 KB, preloaded, `font-display: swap`, immutable cache. No action needed.
- **CLS: good.** Skeleton uses `min-height: 100vh` and matches real nav height. Low shift risk.
- **Brotli concern:** Blog HTML response (46 KB) shows no `content-encoding` header. Verify Vercel is applying Brotli compression to HTML responses.
- **`og-image.webp` cache:** `max-age=0, must-revalidate` on a static asset — should be `max-age=604800` minimum.

---

## AI Search Readiness (GEO)

**Score: 61 / 100**

### Signals Inventory

| Signal | Status | Notes |
|---|---|---|
| `llms.txt` | Yes | Well-formed; describes site purpose; allows all AI crawlers |
| AI crawlers in robots.txt | Yes | GPTBot, Claude-Web, PerplexityBot, anthropic-ai, ChatGPT-User |
| Missing robots.txt entries | Warn | ClaudeBot, OAI-SearchBot, Google-Extended, Bingbot not explicitly listed |
| FAQ schema (server-rendered) | Yes | 7 entries, accurate, in `<head>` — best AI citation asset on site |
| `Article` schema on blog | No | Missing — limits AI citation of blog content |
| `DiscussionForumPosting` | No | Missing on forum threads |
| Quotable content in HTML | Partial | Only FAQ schema answers are reliably crawlable |
| Canonical stability | Partial | SPA pages all canonicalize to `/` (useMeta bug) |
| Named authors | Partial | OG `authors` array on blog/forum but no Author schema |
| `llms.txt` gaps | Warn | Missing: study topics index, license declaration, canonical URL field |
| Study topics visibility | **FAIL** | Best AI-citable content (theological Q&A) is entirely SPA-rendered |

### Highest-Value Content for AI Citations

The FAQ schema block in `layout.jsx` is the site's strongest AI citation asset. The seven entries are specific and accurate. However, this schema is emitted on every page rather than scoped to the homepage, which may cause AI systems to attribute the FAQ to the wrong page.

The study topics content is the single best candidate for AI Overview citations (e.g., "What does the Bible say about death?") but is 100% invisible to AI crawlers in its current SPA form.

---

## Images

**Score: 60 / 100**

| Issue | Status | Notes |
|---|---|---|
| OG image format | Pass | WebP at 1200×630, 23.6 KB — well optimized |
| OG image cache | **Fail** | `max-age=0, must-revalidate` — should be at least 7 days |
| Schema `image` field inconsistency | Warn | `schemaWebApp.image` references `og-image.png`; OG meta uses `og-image.webp` |
| `Organization.logo` format | **Fail** | Should be `ImageObject` with width/height, not a bare URL string |
| App icons | Pass | PWA icon set present |
| Alt text (crawlable layer) | N/A | No `<img>` tags in server-rendered HTML layer |

---

## Appendix: File Reference

| File | Issues |
|---|---|
| `app/layout.jsx` | Global canonical; FAQPage on all pages; wasted Anthropic preconnect (lines 103–104); Organization.logo format; schema image inconsistency |
| `app/_components/ClientShell.jsx` | `ssr: false` — architectural root cause of all content invisibility |
| `app/blog/[slug]/page.jsx` | Missing Article/BlogPosting JSON-LD; no `alternates.canonical` override |
| `app/forum/[categoryId]/[threadId]/page.jsx` | Missing DiscussionForumPosting JSON-LD; no canonical override |
| `public/sitemap.xml` | Missing all blog + forum dynamic URLs; includes auth-gated pages; stale lastmod |
| `public/robots.txt` | Missing ClaudeBot, OAI-SearchBot, Google-Extended, Bingbot |
| `public/llms.txt` | Missing study topics index, license, canonical URL |
| `src/hooks/useMeta.js` | Canonical defaults to `/` for all SPA pages missing `path` argument |
| `src/views/AboutPage.jsx` | Creator photo null; Gmail contact; pricing inconsistency source |
| `src/data/studyTopics.js` | Thin content (300–415 words) + SPA-only — worst content/visibility gap |
| `vercel.json` | www→apex redirect is HTTP 307 not 301 |
