# Content Quality SEO Audit — nwtprogress.com

**Date:** 2026-04-03
**Auditor:** Claude (Content Quality Specialist, Sept 2025 QRG)
**Site:** https://nwtprogress.com
**Stack:** Next.js (App Router) + Supabase + Vite (legacy SPA shell)

---

## Executive Summary

**Overall Content Quality Score: 74 / 100**

NWT Progress has strong technical SEO foundations — SSR with Next.js App Router, comprehensive structured data, dynamic sitemaps, RSS feed, and per-page Open Graph tags. The study topics and Bible book pages provide genuine topical authority. The main gaps are: (1) landing page content is client-rendered with no SSR fallback, (2) several public pages lack meta descriptions, (3) study topic detail pages lack `useMeta` calls, (4) no `article:author` or author schema on blog listing, and (5) the About page SSR content could be richer to strengthen E-E-A-T signals for Google.

---

## 1. E-E-A-T Assessment

### Overall E-E-A-T Score: 68 / 100

| Factor | Weight | Score | Weighted | Notes |
|--------|--------|-------|----------|-------|
| **Experience** | 20% | 72 | 14.4 | Creator bio on About page shows genuine first-hand experience as a Bible student. Testimonials on landing page (M.G., D.K., A.P.) add real-user signals. However, testimonials use initials only — full names or verifiable identities would strengthen this. |
| **Expertise** | 25% | 70 | 17.5 | Study topics demonstrate scriptural knowledge with inline citations. Blog is UGC (user-generated), so quality depends on community. No editorial guidelines visible to crawlers. No author bios on blog posts beyond display name. |
| **Authoritativeness** | 25% | 60 | 15.0 | No external citations, backlink profile unknown from codebase audit. Organization schema present but `sameAs` array is empty (line 87 of `app/layout.tsx`). No social media profiles linked. Disclaimer that site is "not affiliated with" Watch Tower Society is honest but reduces perceived authority. |
| **Trustworthiness** | 30% | 75 | 22.5 | Strong: contact email in schema (`support@nwtprogress.com`), comprehensive Privacy Policy and Terms of Service (both dated March 31, 2026), child safety policy, HTTPS enforced, Stripe for payments, subscription transparency section. Weak: no physical address, no business registration info, Privacy Policy contact is vague ("via the community forum or through nwtprogress.com"). |

### E-E-A-T Recommendations

1. **Add author bios to blog posts.** The blog SSR fallback renders post content and author name but no author credentials or bio. Add an `author` field in the BlogPosting schema with a link to a profile page, or add a short bio paragraph.
2. **Populate the `sameAs` array** in the Organization schema (`app/layout.tsx:87`). Even if there is no Twitter/Facebook, consider adding the blog RSS URL, any directory listings, or a GitHub profile.
3. **Strengthen testimonials.** Replace anonymous initials with first name + last initial at minimum, or add congregation/city if privacy allows. Google's Sept 2025 QRG explicitly looks for verifiable testimonials.
4. **Add an editorial policy** for the blog. A visible page (e.g., `/editorial-policy`) explaining how blog posts are reviewed, what content standards exist, and whether AI-assisted content is disclosed would boost trust signals.
5. **Add a visible contact email** on the About page's client-rendered content (not just in hidden SSR text). Currently the SSR `<address>` tag with the email is visually hidden — Google may discount it.

---

## 2. Page-by-Page Content Analysis

### 2.1 Landing Page (/)

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | **None** — landing page is 100% client-rendered via `LandingPage.tsx` | FAIL |
| Word count (visible) | ~350 words (i18n strings from `translation.json`) | Below 500-word homepage minimum |
| Meta title | "Bible Reading Tracker for New World Translation \| NWT Progress" (from `app/layout.tsx`) | PASS — 62 chars |
| Meta description | "Track your New World Translation Bible reading progress..." | PASS — 142 chars |
| H1 | "Grow Closer to Jehovah" + "One Chapter at a Time" (client-rendered) | WARN — not in SSR HTML |
| Structured data | WebApplication, Organization, WebSite, FAQPage | PASS — excellent |
| OG tags | Full set with image dimensions | PASS |
| Canonical | `https://nwtprogress.com` | PASS |

**Issues:**
- The landing page has NO server-rendered HTML. The `app/[[...slug]]/page.tsx` catch-all renders `<ClientShell />` with no SSR fallback for the root route. Googlebot will see the layout metadata but the `<body>` will be empty until JS executes.
- The `LandingPageStatic.tsx` exists in `app/_components/` but does not appear to be used for the root route's SSR fallback.
- The FAQ schema in `index.html` may be stale (references `$4.99` Premium price while `app/layout.tsx` schema says `$3.00`).

**Action items:**
1. Add an SSR fallback to the landing page route (similar to what blog/forum pages do) with the hero text, feature list, pricing, testimonials, and FAQ in semantic HTML.
2. Remove or update the old `index.html` FAQ schema — it conflicts with the Next.js `app/layout.tsx` schema. The `index.html` file appears to be a Vite-era artifact.
3. Expand landing page content to at least 500 words for homepage minimum.

### 2.2 Blog Index (/blog)

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Post listing with title + excerpt links | PASS |
| Meta title | "Bible Study Blog for Jehovah's Witnesses \| NWT Progress" | PASS — 55 chars |
| Meta description | 140 chars, keyword-rich | PASS |
| Structured data | Blog schema + BreadcrumbList | PASS |
| H1 (SSR) | "NWT Progress Blog" | PASS |
| Canonical | `https://nwtprogress.com/blog` | PASS |
| RSS feed | `/blog/feed.xml` with `<link rel="alternate">` | PASS |

**Issues:**
- No `CollectionPage` or `ItemList` schema for the blog listing (only `Blog` type). Adding `blogPost` references would improve entity linking.
- SSR fallback is a simple `<ul>` of links — no dates, no author names, no reading time. Richer SSR HTML would help.

### 2.3 Blog Posts (/blog/[slug])

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Full article HTML (title, excerpt, body) | PASS |
| Dynamic meta | `generateMetadata()` with title, description, OG, Twitter, canonical | PASS |
| Structured data | BlogPosting with datePublished, dateModified, author, wordCount, publisher | PASS — excellent |
| Dynamic OG image | `opengraph-image.tsx` generates branded images per post | PASS — excellent |
| Breadcrumbs | Home > Blog > Post Title | PASS |
| Internal links | SSR fallback includes links to `/books/*`, `/plans`, `/study-topics`, `/blog` | PASS |

**Issues:**
- `article:published_time` is set via OG `publishedTime` — good.
- No `article:section` or `article:tag` OG properties. Blog posts have no category/tag taxonomy.
- Author in BlogPosting schema falls back to Organization when no display_name — should ideally always have a Person author.
- ISR revalidation is 60 seconds — appropriate for a blog.

### 2.4 Forum Index (/forum)

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Category listing + recent discussions | PASS |
| Meta title | "Community Forum \| NWT Progress" | PASS |
| Meta description | 89 chars | PASS but could be longer (aim for 140-160) |
| Structured data | CollectionPage + BreadcrumbList | PASS |
| H1 (SSR) | "NWT Progress Community Forum" | PASS |

### 2.5 Forum Threads (/forum/[categoryId]/[threadId])

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Thread title, author, body HTML | PASS |
| Dynamic meta | `generateMetadata()` with title, desc, canonical, OG | PASS |
| Structured data | DiscussionForumPosting + BreadcrumbList | PASS — excellent |
| H1 (SSR) | Thread title | PASS |

**Issues:**
- No reply content in SSR fallback — only the opening post. Forum threads with many replies lose that content for crawlers.
- Breadcrumb is only 3 levels (Home > Forum > Thread). Missing the category level.

### 2.6 Study Topics Index (/study-topics)

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Topic list with titles, subtitles, and links | PASS |
| Meta title | "Bible Study Topics \| NWT Progress" | PASS |
| Structured data | BreadcrumbList only | WARN — no ItemList schema |
| H1 (SSR) | "Bible Study Topics for Jehovah's Witnesses" | PASS |

### 2.7 Study Topic Detail (/study-topics/[slug])

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Full article with headings, paragraphs, scripture citations | PASS — excellent |
| Dynamic meta | `generateMetadata()` with title, description, canonical, OG | PASS |
| Structured data | Article + BreadcrumbList | PASS |
| Content depth | 3-5 sections per topic, inline scripture quotes, ~400-800 words each | PASS |
| `useMeta` (client) | **Missing** — `StudyTopicDetail.tsx` has no `useMeta()` call | WARN |
| Hardcoded dates | `datePublished: "2025-11-01"`, `dateModified: "2026-01-01"` | WARN — should be dynamic |

**Issues:**
- SSR content is hidden with `clip: rect(0,0,0,0)` — an acceptable technique for crawler-visible content, but it means users with JS disabled see nothing. Consider using `id="ssr-fallback"` pattern like blog/forum pages.
- 8 study topics is a good start. Expanding to 15-20 topics would significantly strengthen topical authority.
- Client-side `StudyTopicDetail.tsx` never calls `useMeta()`, so if a user navigates to a topic via the SPA, `document.title` stays as the previous page. Not a crawl issue (SSR handles it) but a UX gap.

### 2.8 Bible Book Pages (/books/[book])

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Full study guide: summary, key verses, study guidance, author, date, theme | PASS — excellent |
| Dynamic meta | Per-book title, description, canonical | PASS |
| Structured data | Article + BreadcrumbList | PASS |
| Content depth | Summary + key verses + how-to-study section | PASS |
| Total pages | 66 (one per Bible book) | PASS |

**Issues:**
- All 66 pages use the same `datePublished` / `dateModified` ("2025-11-01" / "2026-01-01"). These should update when content actually changes.
- Good programmatic page quality — each book has unique summary, author, date, theme, and key verses. No thin content issues.

### 2.9 About Page (/about)

| Metric | Value | Status |
|--------|-------|--------|
| SSR content | Creator bio, purpose, JW Library note, subscription transparency, contact | PASS |
| Meta title | "About NWT Progress \| Bible Reading Tracker for Jehovah's Witnesses" | PASS |
| Word count (SSR) | ~250 words | Below 500-word minimum for "About" pages |
| Contact info | `support@nwtprogress.com` in SSR `<address>` tag | PASS |

**Issues:**
- SSR fallback content (~250 words) is thinner than the client-rendered About page. The client version includes feature lists, audience cards, and detailed subscription cost breakdowns that crawlers will not see.
- Consider rendering more of the About page content in the SSR fallback.

### 2.10 Privacy Policy & Terms of Service

| Metric | Privacy | Terms | Status |
|--------|---------|-------|--------|
| SSR content | None (client-only) | None (client-only) | WARN |
| Meta title | "Privacy Policy" | "Terms of Service" | PASS |
| Meta description | **Missing** (no desc in `useMeta`) | **Missing** | FAIL |
| Word count | ~1,200 words | ~1,500 words | PASS |
| Last updated | March 31, 2026 | March 31, 2026 | PASS |

**Issues:**
- Both pages call `useMeta()` with title only — no description. They will fall back to the site-wide default description about Bible reading tracking, which is misleading for legal pages.
- Neither page has an SSR route with `generateMetadata()`. They rely entirely on client-side `useMeta()` for title/description. Crawlers will see the layout-level metadata, not page-specific metadata.

---

## 3. Thin Content Detection

| Page | Word Count (SSR) | Minimum | Verdict |
|------|-----------------|---------|---------|
| Landing page (/) | 0 (no SSR) | 500 | **THIN** |
| About (/about) | ~250 | 500 | **THIN** |
| Blog index (/blog) | Dynamic (post count x ~30 words) | 500 | Borderline |
| Forum index (/forum) | Dynamic | 500 | Borderline |
| Study topic detail | 400-800 per topic | 800 (article) | Acceptable |
| Bible book pages | 200-350 per book | 300 (product-like) | **Acceptable** |
| Privacy page | 0 (no SSR) | N/A | No SSR concern |
| Terms page | 0 (no SSR) | N/A | No SSR concern |

---

## 4. Duplicate Content Analysis

| Issue | Severity | Details |
|-------|----------|---------|
| Dual schema sources | Medium | `index.html` (Vite-era) contains WebApplication/Organization/WebSite/FAQ schemas. `app/layout.tsx` (Next.js) contains different WebApplication/Organization/WebSite schemas. If both are served, crawlers see duplicate, conflicting structured data. The `index.html` says Premium is `$4.99`; the layout says `$3.00`. |
| Blog SSR fallback vs client render | Low | SSR fallback renders full post HTML, then hides it with `display:none` via inline script. This is fine — Google recommends this pattern for hydration. |
| Study topic SSR uses `clip: rect(0,0,0,0)` | Low | Visually hidden but accessible to crawlers. Acceptable but the `ssr-fallback` + `display:none` pattern used on blog/forum pages is more standard. |
| `useMeta` vs `generateMetadata` | Low | Client-side `useMeta` sets meta tags that may conflict with SSR `generateMetadata` values during hydration. In practice this is fine because `useMeta` runs after hydration. |

**Action items:**
1. **Delete or disable** the `index.html` file if Next.js is now the sole build system. If it serves as a Vite fallback, ensure its schemas match the Next.js layout schemas.
2. Standardize the SSR hidden-content approach: use `id="ssr-fallback"` with the inline `display:none` script consistently across all SSR pages.

---

## 5. AI Citation Readiness Score: 78 / 100

AI systems (GPTBot, PerplexityBot, ClaudeBot, etc.) are explicitly allowed in `robots.txt` — good.

### Strengths
- **Structured data is excellent.** BlogPosting, DiscussionForumPosting, Article, FAQPage schemas all provide machine-readable content that AI can quote.
- **Study topic pages are highly citable.** Each has a clear question as the heading, scripture citations with exact text, and well-structured paragraphs. These are ideal for AI to extract and cite as passages.
- **FAQ schema on the root page** provides 7 question-answer pairs that AI search engines can directly surface.
- **RSS feed** enables AI crawlers to discover new content efficiently.
- **Breadcrumb schema** on all pages helps AI understand content hierarchy.

### Weaknesses
- **No `speakable` schema.** Adding `speakable` markup to study topic pages would tell AI assistants which passages are most suitable for voice answers.
- **Blog content quality is unpredictable.** Since it is UGC, some posts may lack the structure and factual density that AI needs to cite confidently.
- **No `citation` or `claimReview` schema.** Study topic pages make doctrinal claims with scripture references — adding `Claim` schema could help AI attribute these properly.
- **Missing `dateModified` on study topics** (hardcoded to a past date). AI systems weight freshness; stale dates may reduce citation priority.
- **No `mainEntity` on study topic pages.** Adding `mainEntity: { "@type": "Question" }` would improve AI's ability to surface these as direct answers.

### AI Citation Readiness by Page Type

| Page Type | Score | Notes |
|-----------|-------|-------|
| Study topics | 90 | Near-perfect structure for AI extraction |
| Blog posts | 75 | Good schema, but content quality varies |
| Forum threads | 65 | Good schema, but discussion content is hard to cite |
| Bible book pages | 85 | Well-structured summaries with key facts |
| Landing page | 40 | No SSR content for AI to extract |
| FAQ (schema) | 95 | Directly quotable Q&A pairs |

---

## 6. Content Depth & Topical Authority

### Topical Coverage Map

| Topic Cluster | Pages | Depth | Authority Signal |
|---------------|-------|-------|-----------------|
| Bible reading tracking | 66 book pages + landing + about | Strong | Core product, unique value prop |
| Bible study topics (doctrine) | 8 study topic pages | Moderate | Good scripture-based content, expand to 15-20 |
| Community (forum) | Dynamic threads | Variable | UGC quality varies |
| Blog (spiritual insights) | Dynamic posts | Variable | UGC, no editorial oversight visible |
| Bible reading plans | `/plans` + plan detail pages | Unknown | Sitemap includes them but pages not audited |
| Meeting prep | Premium-only | N/A | Not crawlable |
| AI study tools | Premium-only | N/A | Not crawlable |

### Topical Authority Recommendations

1. **Expand study topics to 15-20.** Current 8 topics cover core JW doctrines well. Add topics like:
   - The Ransom Sacrifice
   - Baptism — What Does the Bible Say?
   - The 144,000 and the Great Crowd
   - Jehovah's Name in the Bible
   - The Last Days — Bible Prophecy
   - Paradise Earth
   - Blood Transfusions — A Bible-Based View
2. **Add a "Bible Reading Tips" content hub.** Static pages like "How to Start Reading the Bible," "Bible Reading Schedule for Beginners," "Family Worship Ideas" would capture informational search intent.
3. **Create topic clusters.** Link study topic pages to related Bible book pages (e.g., "Is Jesus God?" links to John, Colossians, Hebrews book pages). Add `relatedLink` schema.
4. **Surface reading plan content publicly.** The `/plans` routes exist in the sitemap — ensure these have rich SSR content with plan descriptions, duration, and book breakdowns even for non-authenticated users.

---

## 7. Technical SEO Flags

| Item | Status | File | Line |
|------|--------|------|------|
| Dynamic sitemap with blog posts, books, plans, study topics | PASS | `app/sitemap.ts` | -- |
| RSS feed for blog | PASS | `app/blog/feed.xml/route.ts` | -- |
| Dynamic OG images for blog posts | PASS | `app/blog/[slug]/opengraph-image.tsx` | -- |
| Canonical tags on all pages | PASS | `app/layout.tsx` + per-page | -- |
| `hreflang` tags | PARTIAL | Only `en` and `x-default` in layout | Missing `es`, `pt`, `fr`, `tl`, `zh` |
| AI bot allowlisting | PASS | `public/robots.txt` | -- |
| robots meta directive | PASS | `max-image-preview:large, max-snippet:-1` | -- |
| Google Analytics | PASS | GA4 via `NEXT_PUBLIC_GA_MEASUREMENT_ID` | -- |
| `noindex` on test content | PASS | Test blog post gets `robots: { index: false }` | `app/blog/[slug]/page.tsx:57` |
| Stale `index.html` with conflicting schema | **FAIL** | `index.html` | Lines 74-213 |
| Missing meta descriptions on Privacy/Terms | **FAIL** | `src/views/PrivacyPage.tsx:6`, `TermsPage.tsx:6` | -- |
| Missing `useMeta` on StudyTopicDetail | **WARN** | `src/views/studytopics/StudyTopicDetail.tsx` | -- |
| Empty `sameAs` in Organization schema | **WARN** | `app/layout.tsx` | Line 87 |
| Hardcoded dates on study topic / book schemas | **WARN** | `app/study-topics/[slug]/page.tsx:52-53`, `app/books/[book]/page.tsx:71-72` | -- |

---

## 8. AI-Generated Content Assessment (Sept 2025 QRG)

| Signal | Finding |
|--------|---------|
| Generic phrasing | Study topic content reads naturally with specific scripture references. No red flags. |
| Original insight | Study topics present a clear doctrinal perspective (JW/NWT) with supporting scriptures — this is a specific viewpoint, not generic. |
| First-hand experience | About page and creator bio show genuine experience. Landing testimonials reference specific features. |
| Factual accuracy | Scripture references checked against NWT citations appear accurate. Doctrinal positions align with published JW teachings. |
| Repetitive structure | Study topic pages do follow a consistent template (heading > paragraphs > scriptures), but this is appropriate for educational content, not a quality concern. |
| **Verdict** | Content does NOT appear to be low-quality AI-generated. The study topics show genuine subject expertise. The blog is UGC so individual post quality may vary. |

---

## 9. Priority Action Items (Ranked by Impact)

### Critical (Do First)

1. **Add SSR fallback content to the landing page.** The homepage has zero server-rendered content. Use `LandingPageStatic.tsx` or create a new SSR block in the catch-all page.
2. **Resolve `index.html` vs `app/layout.tsx` schema conflict.** The old Vite `index.html` has a different price ($4.99 vs $3.00) and different schema structure. Delete it or ensure it is never served.
3. **Add meta descriptions to Privacy and Terms pages** in both client-side `useMeta()` calls and ideally in SSR `generateMetadata()` routes.

### High (This Sprint)

4. **Add `hreflang` tags** for all 6 supported languages.
5. **Expand About page SSR content** to at least 500 words — include the feature list, audience cards, and subscription transparency that are currently client-only.
6. **Add `useMeta()` to `StudyTopicDetail.tsx`** for proper client-side title/description when navigating via SPA.
7. **Add `mainEntity: { "@type": "Question" }` to study topic Article schema** to improve AI citation as direct answers.
8. **Add forum category breadcrumb level** to thread pages (Home > Forum > Category > Thread).

### Medium (Next Sprint)

9. **Add author bios** to blog posts (schema and visible UI).
10. **Populate `sameAs` in Organization schema.**
11. **Add `speakable` schema** to study topic pages.
12. **Expand study topics** from 8 to 15+.
13. **Add blog post categories/tags** with `article:section` and `article:tag` OG properties.
14. **Update hardcoded `dateModified`** values on study topic and book schemas to use actual modification timestamps.
15. **Add top forum replies to SSR fallback** for thread pages.

### Low (Backlog)

16. Add editorial policy page for the blog.
17. Add `Claim` / `claimReview` schema to doctrinal study topics.
18. Create "Bible Reading Tips" content hub for informational intent capture.
19. Standardize SSR hidden-content pattern across all pages (use `ssr-fallback` + `display:none` consistently).
20. Consider adding `WebPage` schema with `lastReviewed` dates.

---

## Score Summary

| Category | Score |
|----------|-------|
| **Overall Content Quality** | **74 / 100** |
| E-E-A-T | 68 / 100 |
| Technical SEO (meta, schema, sitemap) | 85 / 100 |
| AI Citation Readiness | 78 / 100 |
| Content Depth / Topical Authority | 72 / 100 |
| Thin Content Risk | 65 / 100 (landing + about are thin) |
| Duplicate Content Risk | 80 / 100 (index.html conflict is the main issue) |

The site is in a strong position overall. The SSR infrastructure, structured data, and study content are well above average for a SPA-to-Next.js migration. The critical gap is the landing page having no SSR content and the `index.html` schema conflict. Fixing those two items alone would raise the overall score to ~82.
