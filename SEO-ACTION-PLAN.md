# SEO Action Plan — jwstudy.org
**Generated:** 2026-04-16  
**Overall Score:** 72/100  
**Target:** 85/100

---

## 🔴 CRITICAL — Fix This Week

### 1. Remove broken global hreflang from layout.tsx
**File:** `app/layout.tsx`  
**Time:** 5 minutes  
**Impact:** Fixes duplicate-content suppression across the entire site

Delete the `languages` block from the root metadata export:
```ts
// REMOVE this entire block:
alternates: {
  canonical: "https://jwstudy.org",
  languages: {
    en: "https://jwstudy.org",
    es: "https://jwstudy.org",
    // ... all 8 pointing to same URL
  },
},

// REPLACE with:
alternates: {
  canonical: "https://jwstudy.org",
},
```
Hreflang only belongs on pages that have real translated equivalents. Blog posts already do this correctly per-post.

---

### 2. Block /share/[userId] from indexing
**Files:** `app/share/[userId]/page.tsx`, `public/robots.txt`  
**Time:** 5 minutes  
**Impact:** Stops personal user data from being indexed; prevents thin-page dilution

Add to `app/share/[userId]/page.tsx` metadata:
```ts
export const metadata = {
  // existing metadata...
  robots: { index: false, follow: false },
};
```
*(robots.txt `Disallow: /share/` already added by sitemap audit)*

---

### 3. Fix FAQPage placeholder answers on /books/[book]
**File:** `app/books/[book]/page.tsx`  
**Time:** 30 minutes  
**Impact:** Removes active schema quality penalty

Either populate real answers from each book's content, or remove the FAQPage schema block entirely. Placeholder answers like "Discover the answer in the book of..." will cause Google to penalize the schema and potentially the page.

Simplest fix — remove the FAQPage block from `schemaFAQ` in this file. The `Article` + `BreadcrumbList` schemas are correctly implemented and should remain.

---

### 4. Add noindex to /promo
**File:** `app/promo/page.tsx`  
**Time:** 2 minutes

```ts
export const metadata = {
  // existing...
  alternates: { canonical: "https://jwstudy.org/promo" },
  robots: { index: false, follow: true },
};
```

---

## 🟠 HIGH — Fix This Month

### 5. Fix font-display:swap → optional (CLS/LCP fix)
**File:** `app/layout.tsx` — the inline `<style>` block  
**Time:** 2 minutes  
**Impact:** Eliminates font-swap layout shift on h1 (LCP candidate)

Find the inline style tag and change:
```css
font-display:swap;   /* BEFORE */
font-display:optional; /* AFTER */
```

---

### 6. Convert GetStartedButton to next/link (INP fix)
**File:** `app/_components/landing/GetStartedButton.tsx`  
**Time:** 10 minutes  
**Impact:** Eliminates full-page reload on primary CTA; enables prefetch on hover

```tsx
import Link from "next/link";

export function GetStartedButton({ label, className }: { label: string; className?: string }) {
  return <Link href="/login" className={className}>{label}</Link>;
}

export function GetStartedLink({ label, className }: { label: string; className?: string }) {
  return <Link href="/login" className={className}>{label}</Link>;
}
```
Remove `"use client"` directive — this is now a Server Component.

---

### 7. Add FAQPage schema to study topic pages
**File:** `app/study-topics/[slug]/page.tsx`  
**Time:** 30 minutes  
**Impact:** Unlocks Google AI Overview eligibility; dramatically improves AI citation rate

Add alongside existing `schemaArticle`:
```ts
const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": topic.sections.map(s => ({
    "@type": "Question",
    "name": s.heading,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": s.paragraphs.join(" ")
    }
  }))
};
```
Then emit it as a second `<script type="application/ld+json">` alongside the existing Article schema.

---

### 8. Add FAQPage schema to homepage
**File:** `app/page.tsx` (or wherever the homepage RSC renders)  
**Time:** 20 minutes  
**Impact:** AI citation for "Is JW Study affiliated with Watch Tower?" type queries

Use the existing `FAQS` array from `LandingPage.tsx`. Emit as a server-side JSON-LD block in the page RSC wrapper (not inside LandingPage itself, which is a client component).

---

### 9. Add Person schema for Lexx on /about
**File:** `app/about/page.tsx`  
**Time:** 15 minutes

```ts
const schemaPerson = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://jwstudy.org/#creator",
  "name": "Alexi",
  "description": "Bible student and Jehovah's Witness who built JW Study — a free Bible reading tracker and study community for Jehovah's Witnesses.",
  "url": "https://jwstudy.org/about",
  "email": "support@jwstudy.org",
  "knowsAbout": ["Bible reading", "New World Translation", "Jehovah's Witnesses"],
  "worksFor": {
    "@type": "Organization",
    "@id": "https://jwstudy.org/#organization"
  }
};
```

---

### 10. Fix Organization sameAs (remove self-reference)
**File:** `app/layout.tsx`  
**Time:** 5 minutes

```ts
// BEFORE (self-link, no value):
sameAs: ["https://jwstudy.org"],

// AFTER (remove entirely for now, add real URLs when they exist):
// sameAs omitted — add GitHub, ProductHunt, or social URLs here when available
```

---

### 11. Make About page content user-visible
**File:** `app/about/page.tsx`  
**Time:** 1-2 hours  
**Impact:** Largest E-E-A-T improvement on the site

The about page content (creator bio, independence disclaimer, contact info) is in a CSS clip-rect div that renders as invisible to real users before JS hydration. Move this content out of the hidden container and into the normal document flow as the visible page. The SPA shell can still overlay it after hydration.

---

### 12. Wire up Vercel Speed Insights
**File:** `app/layout.tsx` or `app/providers.tsx`  
**Time:** 5 minutes  
**Impact:** Real-user CWV data in Vercel dashboard (currently shows nothing)

```tsx
import { SpeedInsights } from "@vercel/speed-insights/next";

// In layout.tsx:
<SpeedInsights />
```

---

### 13. Lazy-load ReactQueryDevtools (bundle size)
**File:** `app/providers.tsx`  
**Time:** 10 minutes  
**Impact:** Removes ~60KB from production client bundle

```tsx
const ReactQueryDevtools = process.env.NODE_ENV === "development"
  ? dynamic(
      () => import("@tanstack/react-query-devtools").then(m => ({ default: m.ReactQueryDevtools })),
      { ssr: false }
    )
  : () => null;
```

---

## 🟡 MEDIUM — Next Sprint

### 14. Convert FeaturedPosts to next/image
**File:** `app/_components/landing/FeaturedPosts.tsx`  
**Time:** 20 minutes  
**Impact:** AVIF/WebP optimization, Vercel CDN for blog cover images

```tsx
import Image from "next/image";

// In the card:
<div className="relative aspect-video overflow-hidden rounded-t-xl">
  <Image
    src={post.cover_url || getFallbackImage(post.id)}
    alt={post.title}
    fill
    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
    sizes="(max-width: 768px) 100vw, 33vw"
    loading="lazy"
  />
</div>
```

---

### 15. Convert H2 headings in study topics to question format
**File:** `src/data/studyTopics.ts`  
**Time:** 2-4 hours  
**Impact:** High — Google AI Overviews strongly prefer interrogative headings that match query strings

Example conversions:
- "The Soul Is the Person" → "What does 'soul' mean in the Bible?"
- "The Soul Can Die" → "Is the soul immortal according to the Bible?"
- "Death Is Like Sleep" → "What state are the dead in according to Scripture?"
- "The Hope of Resurrection" → "What does the Bible say about resurrection?"

---

### 16. Consolidate near-duplicate study topics
**Time:** 3-5 hours  
**Impact:** Eliminates duplicate-content suppression for 2-3 topic pairs

**Pair 1:** Merge `holy-spirit` + `holy-spirit-not-a-person` into one 1,500-word page at `/study-topics/holy-spirit`. Add 301 redirect for the removed slug.

**Pair 2:** Merge `jesus-and-michael` + `angel-of-the-lord-michael` at `/study-topics/jesus-and-michael`. Add 301 for removed slug.

**Pair 3:** Expand `is-jesus-god` and `trinity-is-false` to clearly distinct 1,200-word treatments, OR consolidate at `is-jesus-god` with 301 redirect.

---

### 17. Expand llms.txt to cover all blog posts
**File:** `public/llms.txt`  
**Time:** 1 hour (or script it from the sitemap)  
**Impact:** AI systems relying on llms.txt gain visibility into 65+ currently-invisible articles

Add to llms.txt:
- All blog post URLs with one-line descriptions (script from Supabase `blog_posts` table)
- `updated: 2026-04-16` at top
- Named author/editor entity
- Publication cadence statement ("new articles published weekly")

Also create `public/llms-full.txt` with the first 150 words of each key article.

---

### 18. Add per-topic and per-book OG images
**Files:** New `app/study-topics/[slug]/opengraph-image.tsx` and `app/books/[book]/opengraph-image.tsx`  
**Time:** 1-2 hours  
**Impact:** Social shares show relevant preview instead of generic og-image.jpg

Follow the existing pattern from `app/blog/[slug]/opengraph-image.tsx`.

---

### 19. Add direct-answer summary block to each study topic
**File:** `src/data/studyTopics.ts` + `app/study-topics/[slug]/page.tsx`  
**Time:** 2-3 hours  
**Impact:** Creates additional AI extraction target; improves featured snippet eligibility

Add a `summary` field to each topic (40-60 words, direct answer to the title question). Render at the top of the page before sections. Example for "What Is the Soul?":
> "According to the Bible, the soul is the living person — not an immortal spirit inside the body. The Hebrew nephesh and Greek psyche both refer to the whole living creature. When a person dies, the soul ceases to exist until the resurrection."

---

### 20. Add per-item dateModified to study topics and books
**Files:** `src/data/studyTopics.ts`, `src/data/bookInfo.ts`  
**Time:** 1 hour  
**Impact:** Fixes "all pages same date" pattern that signals template-generated content

Add `publishedAt` and `updatedAt` fields to each topic/book object and use them in schema output.

---

### 21. Fix html lang attribute for non-English pages
**Time:** 2-3 hours  
**Impact:** Correct language declaration for Spanish blog posts

Requires locale-aware layout segment or dynamic lang injection per page. Minimum fix: blog post pages in `es` should emit `<html lang="es">`.

---

### 22. Add SSR body content to forum category pages
**File:** `app/forum/[categoryId]/page.tsx`  
**Time:** 2-3 hours  
**Impact:** Google currently indexes empty pages for forum categories

Render a server-side thread list (title + excerpt) using the prefetched query client data, similar to the forum index page pattern.

---

## 🟢 LOW — Backlog

### 23. Implement IndexNow for Bing
**Time:** 2-3 hours  
Generate an IndexNow key, add `public/[key].txt`, call the Bing IndexNow endpoint (`https://www.bing.com/indexnow`) from a Next.js Route Handler triggered on blog post publish.

### 24. Fix broken redirect in next.config.js
**File:** `next.config.js`  
Remove the `source: "/$"` redirect — the `$` is literal in Next.js redirects and will never match any real URL.

### 25. Create /author/lexx page
**Time:** 2 hours  
400-word author bio page for "Lexx" covering JW background, why the app was built, how long he's been studying. Update study topic `author` schema to point to this page with a `Person` type.

### 26. Add outbound links to wol.jw.org on study topics
Add "Read more at wol.jw.org →" links referencing specific Watchtower publications for each study topic's main claims. Serves as both a trust signal and doctrinal corroboration.

### 27. Add PWA maskable icon
Create separate `icon-512-maskable.png` with safe-zone padding. Update manifest.json with two separate entries (`purpose: "any"` and `purpose: "maskable"`).

### 28. Add transparency notice to study topics
Add a brief line at the top of each study topic: "This content reflects Jehovah's Witness understanding of Scripture, based on the New World Translation." Satisfies the YMYL "transparency" requirement in Google's quality rater guidelines.

### 29. Add speakable schema to study topic first paragraphs
Mark the first paragraph of each section as `speakable` to signal high-value citation passages to voice and AI interfaces.

### 30. Wire up Sentry to report on SSR errors
Ensure Sentry captures server-side rendering failures so schema or metadata generation errors surface before affecting production.

---

## Priority Matrix

```
EFFORT ↑         │  LOW EFFORT          │  HIGH EFFORT
                 │                      │
HIGH IMPACT      │  1. Hreflang fix     │  11. About page visible
                 │  2. Share noindex    │  16. Consolidate topics
                 │  3. FAQ answers fix  │  22. Forum category SSR
                 │  5. font-display fix │
                 │  7. FAQPage schema   │
                 │  8. Homepage FAQ     │
─────────────────┼──────────────────────┼──────────────────────
                 │  10. sameAs fix      │  21. html lang fix
LOW IMPACT       │  12. SpeedInsights   │  23. IndexNow
                 │  13. DevTools lazy   │  25. Author page
                 │  24. Broken redirect │
```

---

## Expected Score After Full Implementation

| Category | Current | Target |
|----------|---------|--------|
| Technical SEO | 81 | 91 |
| Content / E-E-A-T | 61 | 76 |
| On-Page SEO | 70 | 82 |
| Schema | 82 | 92 |
| Performance (CWV) | 68 | 80 |
| AI Search Readiness | 71 | 84 |
| Images | 60 | 78 |
| **Overall** | **72** | **85** |
