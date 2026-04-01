# NWT Progress — SEO Action Plan
**Generated:** April 2026  
**Current Score: 48 / 100 → Target: 75+ / 100**

Fixes are ordered: Critical → High → Medium → Low. Each entry includes the exact file, the fix, and the expected score impact.

---

## Critical — Fix Immediately (Blocking indexing or causing penalties)

### C1. Remove global canonical from root layout
**File:** `app/layout.jsx` line 12  
**Fix:** Delete `alternates: { canonical: "/" }` from the root `metadata` export.  
**Then:** Add `alternates: { canonical: "https://nwtprogress.com/blog" }` to `app/blog/page.jsx`, `alternates: { canonical: "https://nwtprogress.com/forum" }` to `app/forum/page.jsx`, and per-post/per-thread absolute canonicals in `generateMetadata` in `app/blog/[slug]/page.jsx` and `app/forum/[categoryId]/[threadId]/page.jsx`.  
**Impact:** Removes the instruction telling Google every page is a duplicate of the homepage. Most important single fix on the site.

---

### C2. Fix `useMeta` canonical bug for SPA pages
**File:** `src/hooks/useMeta.js`  
**Fix:** Change the default canonical fallback from `BASE_URL/` to `${BASE_URL}${window.location.pathname}` so pages that don't pass a `path` argument still get a unique canonical URL.  
**Impact:** Every SPA page (`/about`, `/terms`, `/privacy`, `/study-topics/*`) stops canonicalizing to the homepage.

---

### C3. SSR the study topics
**Files:** Create `app/study-topics/[slug]/page.jsx` + `app/study-topics/page.jsx`  
**Fix:** Mirror the `app/blog/[slug]/page.jsx` pattern. Read topic content from `src/data/studyTopics.js` at build time via `generateStaticParams`. Render topic body as server-side HTML — **do not route through ClientShell**. Add `generateMetadata` for per-topic title/description using the topic's title and first sentence of body.  
**Impact:** Activates the site's best AI citation candidates for high-volume theological queries. These pages currently contribute zero organic traffic.

---

### C4. Replace static sitemap with dynamic Next.js sitemap
**File:** Delete `public/sitemap.xml`, create `app/sitemap.js`  
**Fix:**
```js
// app/sitemap.js
import { createClient } from '@supabase/supabase-js';

export default async function sitemap() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: posts } = await supabase.from('blog_posts').select('slug, updated_at').eq('published', true);
  const { data: threads } = await supabase.from('forum_threads').select('id, category_id, updated_at');

  const staticPages = [
    { url: 'https://nwtprogress.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: 'https://nwtprogress.com/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://nwtprogress.com/forum', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://nwtprogress.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://nwtprogress.com/study-topics', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  const blogPages = (posts ?? []).map(p => ({
    url: `https://nwtprogress.com/blog/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const forumPages = (threads ?? []).map(t => ({
    url: `https://nwtprogress.com/forum/${t.category_id}/${t.id}`,
    lastModified: new Date(t.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...forumPages];
}
```
**Impact:** Submits all published blog posts and forum threads to Google Search Console. Critical for getting dynamic content indexed.

---

## High — Fix within 1 week

### H1. Add Article/BlogPosting JSON-LD to blog post pages
**File:** `app/blog/[slug]/page.jsx`  
**Fix:** After the `post` fetch in `generateMetadata` (or in the page component itself), inject:
```jsx
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.title,
  "description": post.excerpt || post.content?.substring(0, 160),
  "author": { "@type": "Person", "name": post.profiles?.display_name },
  "datePublished": post.created_at,
  "dateModified": post.updated_at,
  "publisher": { "@type": "Organization", "name": "NWT Progress", "url": "https://nwtprogress.com" },
  "url": `https://nwtprogress.com/blog/${post.slug}`,
  "image": "https://nwtprogress.com/og-image.webp"
};
```
Add `<script type="application/ld+json">{JSON.stringify(articleSchema)}</script>` in the server-rendered page head.  
**Impact:** Enables AI Overview citations and rich result eligibility for all blog posts.

---

### H2. Add DiscussionForumPosting JSON-LD to forum thread pages
**File:** `app/forum/[categoryId]/[threadId]/page.jsx`  
**Fix:** Similar to H1 — inject after the thread fetch:
```js
{
  "@context": "https://schema.org",
  "@type": "DiscussionForumPosting",
  "headline": thread.title,
  "text": thread.content?.substring(0, 300),
  "author": { "@type": "Person", "name": thread.profiles?.display_name },
  "datePublished": thread.created_at,
  "url": `https://nwtprogress.com/forum/${categoryId}/${threadId}`
}
```
**Impact:** Signals structured UGC to Google; enables forum content in AI search results.

---

### H3. Move FAQPage schema to homepage only
**File:** `app/layout.jsx` (remove FAQPage block) → `app/page.jsx` or `app/[[...slug]]/page.jsx` (add it there)  
**Fix:** Cut the `schemaFAQ` block from `layout.jsx` and inject it only on the homepage route. This saves ~3 KB on every non-homepage page load and prevents Google from seeing duplicate FAQ schema on every URL.  
**Impact:** Better structured data hygiene; 3 KB savings per non-homepage page.

---

### H4. Remove wasted Anthropic preconnect
**File:** `app/layout.jsx` lines 103–104  
**Fix:** Remove the `<link rel="preconnect" href="https://api.anthropic.com">` and `<link rel="dns-prefetch" href="https://api.anthropic.com">` tags. AI is disabled; these waste 20–50 ms per page load.  
**Note:** Restore these lines when AI billing goes live (see `memory/project_ai_lock.md`).  
**Impact:** Minor LCP improvement on every page load.

---

### H5. Fix www → apex redirect to 301
**File:** `vercel.json`  
**Fix:** Change the www redirect from `permanent: false` (307) to `permanent: true` (301):
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.nwtprogress.com" }],
      "destination": "https://nwtprogress.com/:path*",
      "permanent": true
    }
  ]
}
```
**Impact:** Consolidates link equity from www to apex; improves crawl efficiency; removes any ranking split between www and non-www.

---

### H6. Fix Organization.logo format in schema
**File:** `app/layout.jsx`  
**Fix:** Replace the bare URL string in `Organization.logo` with an `ImageObject`:
```js
"logo": {
  "@type": "ImageObject",
  "url": "https://nwtprogress.com/icons/icon-512.png",
  "width": 512,
  "height": 512
}
```
Also add `"@id": "https://nwtprogress.com/#organization"` to the Organization block and `"@id": "https://nwtprogress.com/#website"` to the WebSite block.  
**Impact:** Passes Google Rich Results Test for Organization schema; enables knowledge panel logo eligibility.

---

### H7. SSR the About page
**File:** Create `app/about/page.jsx`  
**Fix:** Create a new SSR route that renders the creator bio, mission statement, and subscription transparency copy as actual HTML. This is the site's primary trust/E-E-A-T page and is currently SPA-only.  
**Impact:** Makes the creator bio, non-affiliation disclaimer, and subscription transparency readable by Google. Moves Trustworthiness score significantly.

---

## Medium — Fix within 1 month

### M1. Add BreadcrumbList schema to SSR pages
**Files:** `app/blog/[slug]/page.jsx`, `app/forum/[categoryId]/[threadId]/page.jsx`  
**Fix:** Add breadcrumb JSON-LD: `Home > Blog > {Post Title}` and `Home > Forum > {Category} > {Thread Title}`.  
**Impact:** Rich result breadcrumbs in SERP; improves site hierarchy signals.

---

### M2. Expand study topics to 800–1,200 words each
**File:** `src/data/studyTopics.js`  
**Priority order for expansion:**
1. "What Happens When We Die" — highest search volume
2. "Why Does God Allow Suffering" — most-searched theological query globally
3. "Is Jesus God" — core JW doctrinal differentiator  

**Impact:** Thin content at 300–415 words cannot rank for competitive theological queries. After C3 (SSR), word count expansion directly improves organic ranking potential.

---

### M3. Add author bio field to blog system
**Files:** `src/views/blog/BlogPage.jsx`, Supabase `profiles` table  
**Fix:** Add a `bio` text column to the `profiles` table. Display it in the `blog-author-card` section below the author email. Even a one-sentence bio ("Bible student and Jehovah's Witness since 2015") is an E-E-A-T signal per the September 2025 QRG.  
**Impact:** Author expertise signals on blog posts; improves E-E-A-T score.

---

### M4. Fix pricing inconsistency
**Files:** `src/locales/en/translation.json` (About page text) and `app/layout.jsx` (schema)  
**Fix:** Reconcile `$3/month` (About page) vs `$4.99/month` (schema FAQ). Update whichever is stale to the current price.  
**Impact:** Removes a trust signal deduction; ensures schema data matches reality.

---

### M5. Upgrade contact email to domain email
**Files:** `src/views/AboutPage.jsx`, `app/layout.jsx` (schema contactPoint)  
**Fix:** Replace `luaq777@gmail.com` with `support@nwtprogress.com` (or similar domain email).  
**Impact:** Minor QRG trust improvement; looks more professional on the About page.

---

### M6. Remove AI features from schema until billing is live
**File:** `app/layout.jsx`  
**Fix:** Remove `"AI-powered Bible study tools"` from `schemaWebApp.featureList` until the AI companion is re-enabled (see `memory/project_ai_lock.md`). Describing unavailable features in structured data is a soft trust violation.  
**Impact:** Prevents mismatch between described and available functionality.

---

### M7. Add missing AI crawlers to robots.txt
**File:** `public/robots.txt`  
**Fix:** Add explicit `Allow: /` entries for:
```
User-agent: ClaudeBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bingbot
Allow: /
```
**Impact:** Ensures these crawlers are not relying on wildcard allow rules; explicitly signals AI crawler-friendliness.

---

### M8. Expand llms.txt
**File:** `public/llms.txt`  
**Fix:** Add:
- A `# Study Topics` section listing all topic slugs and one-line summaries
- A `# License` section: `© 2026 Lexx Solutionz. Content licensed for AI training and citation with attribution.`
- A `canonical: https://nwtprogress.com` field at the top  
**Impact:** Better AI crawler context; improved passage-level citability.

---

### M9. Fix og-image cache-control
**File:** Vercel `headers` config or `next.config.js`  
**Fix:** Set `Cache-Control: public, max-age=604800, stale-while-revalidate=86400` on `/og-image.webp`.  
**Impact:** Reduces unnecessary CDN revalidation requests.

---

### M10. Consolidate schema `image` field inconsistency
**File:** `app/layout.jsx`  
**Fix:** Change `schemaWebApp.image` from `og-image.png` to `og-image.webp` to match the actual file and OG meta tags.  
**Impact:** Removes minor inconsistency between schema and OG image declarations.

---

## Low — Backlog

### L1. Verify Brotli compression on HTML responses
Confirm that the 46 KB blog HTML is being Brotli-compressed by Vercel. At typical ratios this compresses to ~12 KB, saving 34 KB on blog page loads.

### L2. Confirm polyfills chunk reduction
After the `browserslist` fix in `package.json` is deployed, verify the `polyfills-*.js` chunk drops from 110 KB to under 20 KB. Run `next build` locally and inspect `.next/static/chunks/` if uncertain.

### L3. Audit Sentry Replay configuration
Confirm `replaysSessionSampleRate` is `0` in the Sentry config. Full replay adds ~70 KB and continuous DOM observation — unnecessary at current scale.

### L4. Homepage shell CDN caching
Investigate whether the homepage shell (`/`) can be made publicly cacheable. Currently it gets `x-vercel-cache: MISS` on every request. If the shell does not depend on user-specific cookie data, enabling edge caching would reduce TTFB by 200–400 ms.

### L5. Consolidate four JSON-LD blocks into single `@graph`
Merge `WebApplication`, `Organization`, `WebSite` into a single `@graph` array to reduce HTTP overhead and parser work. Approximately 500 bytes savings per page.

### L6. Add real creator photo
`CREATOR_AVATAR_URL` is `null` in `AboutPage.jsx`. A real headshot is one of the clearest first-party E-E-A-T signals for single-author sites per September 2025 QRG.

### L7. Add blog post minimum word count gate
Add a pre-publish validation that warns authors if body content is under 300 words. Prevents thin UGC from consuming crawl budget.

### L8. Verify nav height consistency
The skeleton nav is hardcoded at `56px`. Confirm the real app nav has the same computed height to prevent a layout shift at React mount time.

---

## Score Projection by Phase

| Phase | Actions | Projected Score |
|---|---|---|
| Current | — | 48 / 100 |
| Critical complete (C1–C4) | Global canonical fix, sitemap, study topics SSR | ~62 / 100 |
| + High complete (H1–H7) | Schema, FAQPage move, About SSR, preconnect, redirect | ~72 / 100 |
| + Medium complete (M1–M10) | BreadcrumbList, content expansion, author bios, pricing fix | ~80 / 100 |
| Full completion | All items | ~85 / 100 |
