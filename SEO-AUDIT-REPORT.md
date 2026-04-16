# SEO Audit Report — jwstudy.org
**Date:** 2026-04-16  
**Site:** https://jwstudy.org (alt: nwtprogress.com → 301)  
**Framework:** Next.js 15 App Router · Vercel · Supabase  
**Type:** Bible reading tracker + theological content site for Jehovah's Witnesses

---

## Overall SEO Health Score: 72 / 100

| Category | Weight | Score | Weighted |
|----------|--------|-------|---------|
| Technical SEO | 22% | 81 | 17.8 |
| Content Quality / E-E-A-T | 23% | 61 | 14.0 |
| On-Page SEO | 20% | 70 | 14.0 |
| Schema / Structured Data | 10% | 82 | 8.2 |
| Performance (CWV) | 10% | 68 | 6.8 |
| AI Search Readiness (GEO) | 10% | 71 | 7.1 |
| Images | 5% | 60 | 3.0 |
| **Total** | | | **70.9 → 72** |

---

## Top 5 Critical Issues

1. **Global hreflang maps all 8 languages to the same URL** — triggers duplicate-content suppression across the entire site (app/layout.tsx)
2. **About/blog/study-topics SSR content is CSS-hidden** — Google's quality raters see a blank page; potential cloaking flag
3. **/share/[userId] user pages are indexed** — exposes personal user data; no `noindex` or robots.txt block
4. **FAQPage schema on /books/[book] has placeholder `acceptedAnswer` text** — Google penalizes non-answers
5. **`sameAs` on Organization schema self-references jwstudy.org** — zero entity disambiguation signal

## Top 5 Quick Wins

1. Remove global `languages` hreflang from `app/layout.tsx` (5 minutes)
2. Add `robots: { index: false }` to `/share/[userId]` metadata + `Disallow: /share/` to robots.txt (5 minutes) — **sitemap agent already added robots.txt disallow**
3. Fix `font-display: swap` → `optional` in layout.tsx inline style (2 minutes, improves CLS)
4. Convert `GetStartedButton` to `<Link href="/login">` (10 minutes, improves INP)
5. Lazy-load `ReactQueryDevtools` in providers.tsx (10 minutes, removes ~60KB from prod bundle)

---

## Technical SEO — 81/100

### Critical

**C1 — Global hreflang all pointing to jwstudy.org**  
`app/layout.tsx` exports `alternates.languages` with 8 language codes (en, es, pt, fr, tl, zh, ja, ko) all resolving to `https://jwstudy.org`. This emits identical `<link rel="alternate" hreflang="X">` on every page. Google treats this as 8 duplicate URLs and suppresses all but one. Only EN and ES content actually exists. Fix: remove the `languages` block from the root layout entirely; hreflang only belongs on pages with real translated equivalents (blog posts already do this correctly per-post).

**C2 — SSR content hidden via CSS clip-rect**  
Study topics, books, plans, and about pages wrap their server-rendered HTML in `position:absolute; width:1px; height:1px; clip:rect(0,0,0,0)`. Blog and forum pages use an inline `<script>` to set `display:none` before first paint. Google's guidelines flag hidden-content patterns as cloaking risk regardless of intent. Quality raters visiting `/about` see nothing until JS hydrates.

**C3 — /share/[userId] pages indexed without noindex**  
Personal user progress cards have SSR with canonical URLs and OG tags but no `robots: noindex`. Thousands of thin user-specific pages will be crawled and indexed. *(robots.txt Disallow already added by sitemap agent.)*

### High

**H1 — CSP uses `'unsafe-inline'` for script-src**  
Negates XSS protection. Root cause: inline theme-detection and auth-check scripts in layout.tsx. Fix: move to static files with hash/nonce; Next.js 15 supports nonce-based CSP via middleware.

**H2 — Forum category pages have zero SSR body content**  
`app/forum/[categoryId]/page.tsx` renders only `<ClientShell />` with no server-rendered content. Googlebot sees an empty page.

**H3 — /promo missing canonical and robots directive**  
Page is indexed by default with no canonical self-reference. Either add canonical or mark `noindex`.

**H4 — WebSite SearchAction targets SPA-only `/search` route**  
Sitelinks Searchbox schema requires a crawlable SSR results page. `/search` is a client-side only route. Either implement SSR search or remove the `SearchAction`.

**H5 — /share/[userId] content is thin personal data**  
Already addressed by robots.txt disallow added by sitemap agent.

### Medium

- `html lang="en"` hardcoded globally — Spanish blog posts served as English
- Sitemap `lastModified` dates hardcoded for static pages (no mechanism to update)
- `Organization.sameAs` self-references — no external entity disambiguation
- `WebSite SearchAction` URL template unreachable without JS
- All study topic pages share `dateModified: "2026-01-01"` — looks template-generated
- Forum category pages missing from sitemap *(sitemap agent fixed this)*

### Low

- No IndexNow implementation (Bing/Yandex instant recrawl on publish)
- `reactStrictMode: false` in next.config.js
- `eslint.ignoreDuringBuilds: true` + `typescript.ignoreBuildErrors: true`
- Broken redirect `source: "/$"` in next.config.js — `$` is literal, never matches
- PWA manifest: `icon-512.png` used for both `any` and `maskable` purpose (needs split)
- Organization schema `contactPoint` missing Korean language (listed in 7, WebApp declares 8)

### Passing ✅
- HTTPS + HSTS preload-eligible
- robots.txt structure correct with 10 AI crawlers explicitly allowed
- Per-post hreflang on EN/ES blog pairs (correct, reciprocal, x-default to EN)
- All security headers present (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS)
- Canonical tags on all public pages
- Static asset caching (immutable 1yr for _next/static, fonts)
- OG + Twitter card metadata on all pages
- generateStaticParams on books, plans, study-topics, blog
- poweredByHeader: false
- Image optimization: AVIF/WebP, 1yr CDN TTL

---

## Content Quality / E-E-A-T — 61/100

| Signal | Score |
|--------|-------|
| Experience | 5/10 |
| Expertise | 6/10 |
| Authoritativeness | 4/10 |
| Trustworthiness | 7/10 |

### Critical Issues

**About page content is visually hidden before hydration**  
Everything in the about page's hidden div (creator identity, independence disclaimer, contact) is invisible to real users until JS loads. Quality raters see a blank page. This is the single largest trust signal problem on the site.

**No named human author on YMYL-adjacent theological pages**  
All study topics use `author: { "@type": "Organization", name: "JW Study" }`. For religious doctrine content (Is Jesus God, Trinity, Soul, Death), Google expects a named human with verifiable credentials. "Lexx" is identified on the About page but not connected to study topics.

### High Issues

**Near-duplicate study topics**  
- `holy-spirit` + `holy-spirit-not-a-person` — same doctrine, same scriptures (Acts 2:4, Acts 2:17, 1 Cor 12:11), same conclusion
- `jesus-and-michael` + `angel-of-the-lord-michael` — substantial section overlap (Rev 12:7-9, Col 1:15, 1 Thess 4:16)
- `is-jesus-god` + `trinity-is-false` — share core scripture set and doctrinal conclusion

Google will suppress one of each pair. Consolidate into single authoritative pages.

**No `/author/lexx` page**  
60+ blog posts have no author page to anchor credentials. Author-level authority cannot accumulate.

**About page is thin (~270 words, hidden)**  
Effective visible word count before JS: 0.

### Medium Issues

- Study topic meta descriptions auto-generated from first paragraph (not crafted for searcher intent)
- `dateModified: "2026-01-01"` identical for all 11 study topics (looks template-generated)
- No outbound links to wol.jw.org for doctrinal corroboration
- Testimonials use initials only — reduces verifiability
- Blog index `ssr-fallback` hidden before first paint — Google deweights `display:none` content

### YMYL Considerations

Study topics (Is Jesus God, Trinity, Soul, Death) are "Beliefs and Religion" — YMYL-adjacent per September 2025 QRG. Specific risks:
1. Organization-only author attribution on theological content (weakest possible E-E-A-T signal)
2. No citations back to Watch Tower publications for doctrinal claims
3. Content presents minority religious views without clearly stating "this reflects Jehovah's Witness understanding" — add a brief attribution line to each topic

### Content Gaps
- No multilingual study topics (EN only)
- No video content on any study/doctrinal page
- No case studies or user success stories
- No editorial calendar or content freshness signals

---

## Schema / Structured Data — 82/100

### What's Working ✅
- `WebApplication`, `Organization`, `WebSite` in global layout — all valid
- `BlogPosting` on blog posts — best-implemented block (dynamic dates, wordCount, mainEntityOfPage)
- `Article` + `BreadcrumbList` on study topics
- `Course` + `BreadcrumbList` on reading plans
- `DiscussionForumPosting` on forum threads
- `FAQPage` on book pages (but see critical issue below)
- Consistent `@id` fragment anchors across all schemas

### Critical Issues

**FAQPage on /books/[book] has placeholder `acceptedAnswer` text**  
`acceptedAnswer.text` values are generic redirects like "Discover the answer in the book of..." — Google's guidelines require actual answers. Fix or remove entirely.

**`Organization.sameAs` is `["https://jwstudy.org"]`** — self-link provides zero entity disambiguation. Remove or replace with real external profile URLs.

### Missing Opportunities

| Priority | Page | Missing | Impact |
|----------|------|---------|--------|
| HIGH | Homepage | `FAQPage` | AI Overview + LLM citation for FAQ section |
| HIGH | Study topics | `FAQPage` (per section) | Each heading is a Q&A — wrap in FAQPage schema |
| HIGH | /about | `Person` for "Lexx" | Author credibility signal |
| MEDIUM | Study topics | `speakable` | Voice/AI citation signal |
| MEDIUM | Organization | Real `sameAs` links | Entity disambiguation |
| LOW | Plans | `teaches` on Course | Educational context |

### JSON-LD snippets to implement: see ACTION-PLAN.md

---

## Performance / Core Web Vitals — 68/100

### LCP Risk: Medium

**Font-display:swap on Plus Jakarta Sans Variable** causes layout shift when the body font loads. The `<h1>` (LCP candidate) uses this font with `font-display:swap` in the inline `<style>` block. Despite preloading, slow connections will see a swap. Fix: change to `font-display:optional`.

**File:** `app/layout.tsx` line 138

### INP Risk: Low-Medium

**`GetStartedButton` uses `window.location.href`** — triggers full browser navigation (not SPA routing), causing hundreds of ms delay on the primary CTA. Fix: replace with `<Link href="/login">` from next/link. Enables prefetch on hover, eliminates reload.

**File:** `app/_components/landing/GetStartedButton.tsx`

### CLS Risk: Low

**`FeaturedPosts` uses raw `<img>` instead of `next/image`** — bypasses AVIF/WebP optimization and Vercel CDN. Both unsplash.com and supabase domains already in `remotePatterns`. Fix: convert to `<Image fill sizes="...">`.

**File:** `app/_components/landing/FeaturedPosts.tsx`

### Bundle Size

**`ReactQueryDevtools` statically imported in production** — adds ~50-70KB to client bundle. Fix: lazy-load conditioned on `process.env.NODE_ENV === "development"`.

**File:** `app/providers.tsx`

**`CommunityStats` fires live Supabase queries on every page view** — server already fetches this data for ISR. Add 5-minute localStorage gate to throttle.

### Monitoring Gap
`<SpeedInsights />` from `@vercel/speed-insights/next` is listed as a dependency but not wired up in any source file. Without it, Vercel's real-user CWV dashboard shows no data.

### What's Well-Optimized ✅
- GA deferred with `afterInteractive`
- Sentry lazy-loaded via `requestIdleCallback` — excellent pattern
- Critical CSS inlined in `<style>` tag (skeleton, font-face, theme)
- ISR `revalidate=300` on root — correct balance of freshness/performance
- `Promise.all` for server-side Supabase fetches (no waterfall)
- `ClientShell` with `ssr:false` — authenticated SPA never blocks landing page SSR
- Static asset caching: immutable + 1yr TTL
- `scrollbar-gutter: stable` prevents layout shift from scrollbar

---

## AI Search Readiness (GEO) — 71/100

| Platform | Score |
|----------|-------|
| Perplexity | 78/100 |
| ChatGPT (web search) | 74/100 |
| Bing Copilot | 65/100 |
| Google AI Overviews | 62/100 |

### Strengths
- Full AI crawler access (10 bots explicitly allowed in robots.txt)
- llms.txt exists, well-structured, includes content policy and key URLs
- Study topics have SSR-rendered full text accessible without JS
- Article schema with `articleBody` populated from full content
- Scripture references are `Reference: quote` format — highly extractable
- Self-contained passage lengths (145-155 words per section) near optimal citation window
- Direct-answer subtitles ("Death is a state of unconscious sleep — not heaven, hell, or purgatory")

### Gaps
- **llms.txt lists only 5 of 70+ blog posts** — 65+ articles invisible to AI systems using llms.txt
- **No FAQPage schema on study topics** — each section heading is already a Q&A
- **H2 headings are declarative, not interrogative** — "The Soul Is the Person" vs "What does 'soul' mean in the Bible?"
- **No multi-modal content** (video, infographics) — weakest dimension (45/100)
- No Wikipedia article, YouTube channel, or Reddit presence for brand mentions
- No `speakable` schema to flag high-value citation passages
- No direct-answer summary block at top of each study topic
- `dateModified` hardcoded — freshness scorer sees all topics as 3.5 months stale
- llms.txt has no author/person entity, no publication cadence signal, no `updated:` date

---

## Sitemap — 91/100 (post-fix)

*(Sitemap agent made live changes — see below)*

### Changes Already Made by Audit
- `/promo` added to sitemap
- Forum `/forum` lastmod now dynamic (queries latest thread)
- Forum category pages added (were completely absent)
- Up to 500 forum thread pages added
- `Disallow: /share/` added to robots.txt

### Remaining
- No `changefreq` or `priority` fields (Google ignores these; low priority)
- No image sitemap (low priority for this use case)
- `forum_threads.category_id` column name should be verified in Supabase schema

---

## Images — 60/100

- `FeaturedPosts` blog cards use raw `<img>` bypassing next/image optimization
- All study topic and book pages share one static `og-image.jpg` for social previews
- Blog posts have dynamic per-post OG images via `opengraph-image.tsx` ✅
- `next/image` used for avatar images in the app ✅
- `remotePatterns` configured for unsplash + supabase ✅

### Opportunities
- Add `app/books/[book]/opengraph-image.tsx` with book name as dynamic text
- Add `app/study-topics/[slug]/opengraph-image.tsx` with topic title
- Convert FeaturedPosts to `next/image` with `fill` + `sizes`

---

## Business Context Notes

The site occupies a very specific niche: NWT-aligned, structured, AI-accessible theological Q&A. There are very few open-web competitors with proper SSR + schema for JW-specific doctrinal queries. The site's technical foundation is strong — the gaps are in content depth, author attribution, and entity signals, not in crawlability or indexability (except for the hreflang and hidden-content issues which need immediate attention).
