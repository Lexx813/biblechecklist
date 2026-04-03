# Technical SEO Audit: nwtprogress.com

**Date:** 2026-04-03
**Auditor:** Claude (automated)
**Stack:** Next.js 15, Vercel, Supabase
**Overall Score: 82/100**

---

## Summary

nwtprogress.com has a strong technical SEO foundation. Security headers are excellent, SSR is working on public pages, structured data is rich, and the robots.txt/sitemap setup is solid. The main issues are: (1) the homepage returns 200 for non-existent URLs instead of 404, (2) missing og:url on blog/forum pages, (3) blog posts lack hreflang tags despite the site supporting 6 languages, (4) the homepage body is entirely JS-rendered for authenticated users (expected for an SPA, but the landing page SSR fallback is well-implemented), and (5) no individual forum thread URLs in the sitemap.

---

## 1. Crawlability -- PASS

### robots.txt
- **Status:** Present and well-configured
- **Location:** https://nwtprogress.com/robots.txt
- Correctly blocks private routes: `/admin`, `/profile`, `/bookmarks`, `/feed`, `/history`
- Explicitly allows all major search engine and AI crawlers (Googlebot, Bingbot, GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Claude-Web, anthropic-ai, OAI-SearchBot, Google-Extended, CCBot)
- Sitemap directive present: `Sitemap: https://nwtprogress.com/sitemap.xml`

### Sitemap
- **Status:** Present, valid XML, 122 URLs
- Includes: homepage, blog (listing + 28 individual posts), forum listing, study-topics (listing + individual topics), /books, /plans, /about, /privacy, /terms
- `lastmod` timestamps are current (most updated 2026-04-03)
- `changefreq` and `priority` values are reasonable

### Robots Meta Tags
- Homepage: `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` -- correct
- Blog: same -- correct
- No `noindex` or `nofollow` found on any public page

---

## 2. Indexability -- PASS (with issues)

### Canonical Tags
| Page | Canonical | Status |
|------|-----------|--------|
| `/` | `https://nwtprogress.com` | PASS |
| `/blog` | `https://nwtprogress.com/blog` | PASS |
| `/forum` | `https://nwtprogress.com/forum` | PASS |
| `/blog/[slug]` | `https://nwtprogress.com/blog/[slug]` | PASS |

### Title Tags
| Page | Title | Length |
|------|-------|--------|
| `/` | Bible Reading Tracker for New World Translation \| NWT Progress | 62 chars -- PASS |
| `/blog` | Bible Study Blog for Jehovah's Witnesses \| NWT Progress | 57 chars -- PASS |
| `/forum` | Community Forum \| NWT Progress | 31 chars -- PASS |
| `/blog/[slug]` | The True Identity of Jesus Christ -- What the Bible Really Reveals \| NWT Progress | 82 chars -- PASS |

### Meta Descriptions
| Page | Description | Length |
|------|-------------|--------|
| `/` | Track your New World Translation Bible reading progress across all 66 books... | 135 chars -- PASS |
| `/blog` | Spiritual insights, Bible study articles, scripture reflections... | 122 chars -- PASS |

### Issues Found

**[CRITICAL] 404 pages return HTTP 200**
- Request to `/nonexistent-page-404-test` returns HTTP 200 instead of 404
- This is a soft 404 problem. Google will crawl and attempt to index garbage URLs
- The catch-all route `[[...slug]]` is serving the SPA shell for every path
- **Fix:** Return a proper 404 status code from the Next.js catch-all route for unknown paths. In your `[[...slug]]/page.tsx`, check if the slug matches a known route and call `notFound()` otherwise.

**[MEDIUM] No forum thread URLs in sitemap**
- The sitemap includes `/forum` but no individual forum thread URLs (`/forum/[id]`)
- If forum threads are public SSR pages, they should be in the sitemap
- **Fix:** Add dynamic forum thread URLs to sitemap generation

---

## 3. Security -- PASS (excellent)

### Headers Present
| Header | Value | Status |
|--------|-------|--------|
| `strict-transport-security` | `max-age=63072000; includeSubDomains; preload` | PASS (2 years, with preload) |
| `content-security-policy` | Comprehensive policy (see below) | PASS |
| `x-frame-options` | `DENY` | PASS |
| `x-content-type-options` | `nosniff` | PASS |
| `x-xss-protection` | `1; mode=block` | PASS |
| `referrer-policy` | `strict-origin-when-cross-origin` | PASS |
| `permissions-policy` | `camera=(), microphone=(), geolocation=()` | PASS |

### CSP Analysis
- `default-src 'self'` -- good baseline
- `script-src` allows `'unsafe-inline'` -- acceptable for Next.js inline scripts, but consider using nonces in the future
- `object-src 'none'` -- good, blocks plugins
- `base-uri 'self'` -- good, prevents base tag injection
- `form-action 'self'` -- good
- Third-party allowlist is tight and specific (Stripe, Supabase, Sentry, GA, Vercel Insights)

### HTTPS Redirect
- `http://nwtprogress.com` redirects to `https://nwtprogress.com/` with 1 redirect -- PASS

---

## 4. URL Structure -- PASS (with minor issue)

### Clean URLs
- All URLs are lowercase, kebab-case, no query parameters for content pages
- Blog: `/blog/[readable-slug]` -- excellent
- Study topics: `/study-topics/[readable-slug]` -- excellent
- Forum: `/forum` -- good

### Trailing Slash Behavior
- `/blog/` returns 308 redirect to `/blog` -- PASS (consistent, no duplicates)
- Vercel handles this automatically

### Issues Found

**[LOW] Homepage sitemap URL lacks trailing slash consistency**
- Sitemap lists `https://nwtprogress.com` (no trailing slash)
- The canonical is `https://nwtprogress.com` (no trailing slash)
- HTTP redirect lands on `https://nwtprogress.com/` (with trailing slash)
- These are technically the same on Vercel, but for consistency the sitemap and canonical could include the trailing slash to match the actual resolved URL. This is a very minor issue.

---

## 5. Mobile Optimization -- PASS

### Viewport Meta
```
<meta name="viewport" content="width=device-width, initial-scale=1"/>
```
- Present and correct on all pages

### PWA / Mobile App Meta
- `<meta name="mobile-web-app-capable" content="yes"/>` -- PASS
- `<meta name="apple-mobile-web-app-capable" content="yes"/>` -- PASS
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>` -- PASS
- `<meta name="apple-mobile-web-app-title" content="NWT Progress"/>` -- PASS
- `<link rel="apple-touch-icon" href="/icon-192.png"/>` -- PASS
- `<link rel="manifest" href="/manifest.json"/>` -- PASS
- `<meta name="theme-color" content="#1E0D3C"/>` -- PASS

### Responsive Design
- Self-hosted variable font (Plus Jakarta Sans) with `font-display: swap` -- excellent for performance
- CSS includes responsive breakpoints in skeleton styles
- PWA manifest present

---

## 6. Core Web Vitals (Source Inspection) -- PASS (with risks)

### LCP (Largest Contentful Paint)
- **Risk: LOW** for SSR pages (blog, forum, study-topics)
  - Pages are server-rendered with `x-nextjs-prerender: 1`
  - Served from Vercel edge cache (`x-vercel-cache: HIT`)
  - Font is preloaded with `font-display: swap`
  - Supabase connection is preconnected
- **Risk: MEDIUM** for homepage (authenticated)
  - Homepage serves a loading skeleton shell, then hydrates via JS
  - LCP element is likely the skeleton spinner until JS renders real content
  - This is expected for an auth-gated SPA but could delay LCP for the landing page if JS bundles are large

### INP (Interaction to Next Paint)
- **Risk: LOW-MEDIUM**
  - 7 async script chunks loaded on homepage -- moderate JS payload
  - React hydration on SSR pages could cause brief input delay
  - No evidence of heavy client-side computation blocking the main thread

### CLS (Cumulative Layout Shift)
- **Risk: LOW**
  - Skeleton screen with fixed dimensions prevents layout shift during load
  - Font preloaded with `font-display: swap` and self-hosted -- minimal FOIT/FOUT
  - `[data-authed] #ssr-fallback{display:none!important}` prevents flash of unauthenticated content for logged-in users

### Performance Optimizations Detected
- Font preloading (self-hosted woff2 variable font)
- DNS prefetch and preconnect for Supabase
- Preconnect for Google Fonts and gstatic
- Vercel edge caching active on SSR pages
- `async` attribute on all script tags
- Google Tag Manager loaded via `<link rel="preload" as="script">`

---

## 7. Structured Data -- PASS (excellent)

### Homepage (/)
1. **WebApplication** -- name, description, pricing (Free + $3 Premium), features, languages, screenshots
2. **Organization** -- name, logo, email, contact point, languages
3. **WebSite** -- with @id for entity linking
4. **FAQPage** -- 8 questions covering product, pricing, compatibility, languages, affiliation disclaimer

### Blog Post (/blog/[slug])
1. **BlogPosting** -- headline, description, datePublished, dateModified, author (Organization), publisher, wordCount, image, mainEntityOfPage
2. **BreadcrumbList** -- Home > Blog > [Post Title]
3. Plus inherited WebApplication, Organization, WebSite from layout

### Issues Found

**[LOW] Blog posts use generic og:image**
- All blog posts share `https://nwtprogress.com/og-image.webp` instead of post-specific images
- This reduces click-through from social shares and Google Discover
- **Fix:** Generate or assign unique og:image per blog post

**[LOW] Organization.sameAs is empty array**
- `"sameAs":[]` -- should list social profiles when available (if you have any social accounts)

---

## 8. JavaScript Rendering -- PASS (mixed architecture)

### SSR Pages (crawlable by search engines without JS)
| Route | Rendering | Cache | Evidence |
|-------|-----------|-------|----------|
| `/blog` | SSR/ISR | Vercel edge cache HIT | `x-nextjs-prerender: 1`, full HTML in response |
| `/blog/[slug]` | SSR/ISR | Vercel edge cache | `x-nextjs-prerender: 1`, full HTML with article content |
| `/forum` | SSR/ISR | Vercel edge cache HIT | `x-nextjs-prerender: 1`, full HTML in response |
| `/study-topics` | SSR/ISR | Vercel PRERENDER | `x-nextjs-prerender: 1` |

### CSR Pages (require JS)
| Route | Rendering | Evidence |
|-------|-----------|----------|
| `/` (authenticated) | CSR | Body contains skeleton + Suspense boundaries, content loaded via JS |
| `/` (unauthenticated) | SSR fallback | Landing page HTML is inlined in `#ssr-fallback` div |

### Analysis
- Public SEO-critical pages (blog, forum, study-topics) are properly server-rendered -- this is correct
- The homepage for unauthenticated users includes a full SSR landing page with rich content, FAQ schema, and feature descriptions -- excellent
- Auth-gated pages are CSR which is appropriate (search engines should not index user-specific content)
- ISR stale time is 300 seconds (5 minutes) -- good balance of freshness and performance

---

## 9. IndexNow Protocol -- FAIL

- No evidence of IndexNow implementation
- No `/.well-known/indexnow` key file detected
- **Fix:** Implement IndexNow to notify Bing, Yandex, and Naver of new/updated content instantly. This is especially valuable for the blog and forum where content changes frequently.
- Implementation: Add an API route that pings `https://api.indexnow.org/IndexNow` with your key when blog posts or forum threads are created/updated

---

## 10. Additional Findings

### RSS Feed -- PASS
- `/blog/feed.xml` is present and valid
- Linked from HTML via `<link rel="alternate" type="application/rss+xml">`
- Contains blog posts with titles, links, descriptions, and dates

### hreflang Tags -- PARTIAL
- Homepage has `hrefLang="en"` and `hrefLang="x-default"` pointing to `https://nwtprogress.com`
- Blog and blog posts have NO hreflang tags
- The site supports 6 languages (en, es, pt, fr, tl, zh) per structured data
- **Fix:** If blog content is available in multiple languages, add hreflang tags. If blog is English-only, this is acceptable but should be documented.

### Caching Strategy
- SSR pages: `cache-control: public, max-age=0, must-revalidate` with Vercel edge cache -- correct for ISR
- Auth pages: `cache-control: private, no-cache, no-store` -- correct for dynamic user content
- Blog and forum served from Vercel edge with ETag -- good

### Preconnect / Resource Hints
- Supabase: preconnect + dns-prefetch -- excellent
- Google Fonts: preconnect (both googleapis.com and gstatic.com) -- correct
- GTM: preloaded as script -- good

---

## Prioritized Action Items

### Critical
1. **Fix soft 404s** -- The catch-all route returns HTTP 200 for non-existent URLs. This will cause Google to waste crawl budget and potentially index junk pages. Add `notFound()` calls in the catch-all for unknown paths.

### High
2. **Implement IndexNow** -- Free and easy win for faster indexing of new blog posts and forum threads on Bing/Yandex.
3. **Add og:url to blog and forum pages** -- Both `/blog` and `/forum` are missing `og:url` meta property. This can cause issues with social sharing and canonical signals for social platforms.

### Medium
4. **Add forum thread URLs to sitemap** -- If forum threads are public, they deserve individual sitemap entries for discovery.
5. **Add hreflang tags to blog pages** -- If blog content exists in multiple languages, hreflang is essential. If English-only, add at minimum `hreflang="en"` + `hreflang="x-default"`.
6. **Generate unique og:image per blog post** -- Improves social sharing CTR and Google Discover appearance.

### Low
7. **Fill Organization.sameAs** -- Add social profile URLs when available.
8. **Consider script-src nonces** -- Replace `'unsafe-inline'` in CSP with nonce-based script loading for stronger security (Next.js supports this).
9. **Trailing slash consistency** -- Minor: ensure sitemap/canonical match the resolved URL form.

---

## Score Breakdown

| Category | Score | Max | Status |
|----------|-------|-----|--------|
| Crawlability | 14 | 15 | PASS |
| Indexability | 10 | 15 | Issues (soft 404) |
| Security | 15 | 15 | PASS |
| URL Structure | 9 | 10 | PASS |
| Mobile | 10 | 10 | PASS |
| Core Web Vitals | 8 | 10 | Minor risks |
| Structured Data | 9 | 10 | PASS |
| JS Rendering | 7 | 10 | Mixed (SSR where needed) |
| IndexNow | 0 | 5 | Not implemented |
| **Total** | **82** | **100** | |
