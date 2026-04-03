# Schema.org Structured Data Audit -- nwtprogress.com

**Audit date:** 2026-04-03
**Site:** https://nwtprogress.com
**Framework:** Next.js 15 (App Router, SSR/ISR)
**Format:** All schema uses JSON-LD (correct approach)

---

## 1. Existing Schema Inventory

### Global (app/layout.tsx -- every page)

| # | @type | @id | Status |
|---|-------|-----|--------|
| 1 | WebApplication | -- | PASS with issues |
| 2 | Organization | `/#organization` | PASS with issues |
| 3 | WebSite | `/#website` | PASS with issues |

### Per-Page Schema

| Page | @type(s) | Status |
|------|----------|--------|
| `/` (landing) | FAQPage | INFO |
| `/blog` | Blog, BreadcrumbList | PASS |
| `/blog/[slug]` | BlogPosting, BreadcrumbList | PASS |
| `/forum` | CollectionPage, BreadcrumbList | PASS |
| `/forum/[categoryId]` | BreadcrumbList | PASS |
| `/forum/[categoryId]/[threadId]` | DiscussionForumPosting, BreadcrumbList | PASS |
| `/about` | BreadcrumbList | PASS |
| `/plans` | ItemList, BreadcrumbList | PASS |
| `/plans/[slug]` | Course + CourseInstance, BreadcrumbList | PASS with issues |
| `/study-topics` | BreadcrumbList | PASS |
| `/study-topics/[slug]` | Article, BreadcrumbList | PASS |
| `/books` | ItemList, BreadcrumbList | PASS |
| `/books/[book]` | Article, BreadcrumbList | PASS |

---

## 2. Validation Results (per schema block)

### 2a. WebApplication (layout.tsx, line 41)

**Verdict: PASS with minor issues**

- [PASS] @context is `https://schema.org`
- [PASS] @type `WebApplication` is valid
- [PASS] Required properties present (name, url)
- [PASS] URLs are absolute
- [PASS] No placeholder text
- [WARN] `sameAs` is an empty array -- remove or populate with real social links
- [WARN] `availability` uses full URL `https://schema.org/OnlineOnly` -- this is technically valid but Google prefers short enum values. Not blocking.
- [WARN] `screenshot` and `image` point to the same generic OG image. For SoftwareApplication rich results, Google recommends distinct screenshots of the actual app UI.
- [INFO] `offers` array contains two Offer objects -- both valid. Consider adding `priceValidUntil` for the Premium offer to improve eligibility for rich results.

### 2b. Organization (layout.tsx, line 72)

**Verdict: PASS with minor issues**

- [PASS] @context, @type, @id all correct
- [PASS] `logo` uses ImageObject with width/height
- [PASS] `contactPoint` is valid
- [WARN] `sameAs` is an empty array -- remove it or add real social profiles (Instagram, YouTube, etc.). Empty array is technically valid but signals nothing.
- [WARN] No `foundingDate` property. Recommended for Organization.

### 2c. WebSite (layout.tsx, line 90)

**Verdict: PASS with issues -- missing SearchAction**

- [PASS] @context, @type, @id correct
- [PASS] name and url present
- [ISSUE] **Missing `potentialAction` with SearchAction.** Google uses this to power sitelinks search box in SERPs. Since the site has a `/search` page, this is a missed opportunity.

### 2d. FAQPage (landing page, `[[...slug]]/page.tsx`)

**Verdict: INFO -- no Google rich result benefit, but valid for AI/GEO**

- [PASS] Schema is structurally valid
- [PASS] All Question/Answer pairs are well-formed
- [INFO] Since August 2023, Google restricts FAQ rich results to government and healthcare sites. This is a commercial site, so FAQPage will NOT generate Google rich results.
- [INFO] FAQPage is still beneficial for AI/LLM citation and GEO (Generative Engine Optimization). **Keep it if you value AI discoverability.** Not worth adding to new pages, though.

### 2e. Blog (blog/page.tsx)

**Verdict: PASS**

- [PASS] All properties valid
- [PASS] Publisher references Organization @id correctly
- [PASS] BreadcrumbList is correct

### 2f. BlogPosting (blog/[slug]/page.tsx)

**Verdict: PASS -- strong implementation**

- [PASS] Dynamic headline, description, dates, author
- [PASS] Falls back to Organization as author when no user profile
- [PASS] `mainEntityOfPage`, `publisher`, `image` all present
- [PASS] `wordCount` calculated dynamically
- [PASS] BreadcrumbList includes post title at position 3
- [INFO] `datePublished` comes from `post.created_at` -- verify this is ISO 8601 format from Supabase (it should be, Supabase returns ISO timestamps by default)

### 2g. CollectionPage -- Forum (forum/page.tsx)

**Verdict: PASS**

- [PASS] Valid @type for a listing/index page
- [PASS] Publisher reference correct

### 2h. DiscussionForumPosting (forum/[categoryId]/[threadId]/page.tsx)

**Verdict: PASS -- good implementation**

- [PASS] `DiscussionForumPosting` is the correct @type for forum threads (Google supports this for forum rich results)
- [PASS] Dynamic headline, text, dates, author
- [PASS] BreadcrumbList correct
- [WARN] `author` can be `undefined` if no display_name -- should fall back to Organization or omit the property entirely rather than setting it to undefined (JSON.stringify drops undefined, so this is technically fine but not explicit)

### 2i. Course + CourseInstance (plans/[slug]/page.tsx)

**Verdict: PASS with issues**

- [PASS] @type Course is valid and supported by Google
- [PASS] Provider references Organization
- [WARN] `hasCourseInstance.instructor` is Organization -- Google Course schema expects `instructor` to be a Person. Consider removing instructor since it is the same as provider.
- [WARN] Missing `offers` on CourseInstance. Google recommends offers (even free) for Course rich results.
- [INFO] `courseWorkload` uses ISO 8601 duration format -- correct.

### 2j. Article (study-topics/[slug]/page.tsx and books/[book]/page.tsx)

**Verdict: PASS with minor issues**

- [PASS] Structure is correct
- [PASS] Publisher with logo, author, dates all present
- [WARN] `datePublished: "2025-11-01"` and `dateModified: "2026-01-01"` are hardcoded. These should reflect actual content update dates. Hardcoded dates that never change can look stale to Google over time.
- [WARN] `articleBody` on books pages concatenates a large string. While valid, excessively long articleBody values are unnecessary -- Google reads the page content directly.

### 2k. ItemList (plans/page.tsx and books/page.tsx)

**Verdict: PASS**

- [PASS] `numberOfItems` matches actual count
- [PASS] Each ListItem has position, name, url
- [PASS] BreadcrumbList correct

### 2l. BreadcrumbList (all pages)

**Verdict: PASS -- consistent and correct across all pages**

- [PASS] Every SSR page includes BreadcrumbList
- [PASS] All use absolute URLs
- [PASS] Positions are sequential starting at 1
- [PASS] Home is always position 1

---

## 3. Issues Summary

### Critical (blocks rich results)

None found. All schemas are structurally valid.

### High Priority (improves rich result eligibility)

| # | Page | Issue | Fix |
|---|------|-------|-----|
| H1 | layout.tsx (WebSite) | Missing `potentialAction` SearchAction | Add SearchAction targeting `/search?q={query}` -- enables sitelinks search box |
| H2 | plans/[slug] (Course) | Missing `offers` on CourseInstance | Add `"offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "category": "Free" }` for free plans, or reference the Premium offer for premium plans |
| H3 | plans/[slug] (Course) | `instructor` is Organization | Remove `instructor` from CourseInstance (provider already covers this) |

### Medium Priority (best practices)

| # | Page | Issue | Fix |
|---|------|-------|-----|
| M1 | layout.tsx (Organization) | Empty `sameAs` array | Remove or populate with social media URLs |
| M2 | layout.tsx (WebApplication) | `screenshot` is generic OG image | Replace with actual app UI screenshot |
| M3 | study-topics/[slug], books/[book] | Hardcoded dates | Use actual content creation/modification dates from a data source |
| M4 | landing page | FAQPage on commercial site | No Google rich result benefit -- keep for AI/GEO value only |

### Low Priority (nice to have)

| # | Page | Issue | Fix |
|---|------|-------|-----|
| L1 | layout.tsx (WebApplication) | No `priceValidUntil` on Premium offer | Add a future date for rich result eligibility |
| L2 | layout.tsx (Organization) | No `foundingDate` | Add if desired |

---

## 4. Missing Schema Opportunities

### 4a. WebSite SearchAction (HIGH -- enables sitelinks search box)

**Page:** layout.tsx (global)
**Why:** Google can display a search box directly in SERPs for your site.

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://nwtprogress.com/#website",
  "name": "NWT Progress",
  "url": "https://nwtprogress.com/",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://nwtprogress.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### 4b. SoftwareApplication (MEDIUM -- replace or supplement WebApplication)

**Page:** layout.tsx (global)
**Why:** Google supports `SoftwareApplication` for rich results (star ratings, pricing in SERPs). `WebApplication` is a subtype and works, but explicitly using `SoftwareApplication` with `@type: ["SoftwareApplication", "WebApplication"]` can broaden matching.

No code change needed unless you want to add `aggregateRating` in the future (requires real user reviews).

### 4c. About Page -- Person schema for creator (LOW)

**Page:** /about
**Why:** The About page describes the creator "Lexx." Adding a Person schema would help Google connect the entity.

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": "https://nwtprogress.com/about",
  "name": "About NWT Progress",
  "url": "https://nwtprogress.com/about",
  "mainEntity": {
    "@type": "Organization",
    "@id": "https://nwtprogress.com/#organization"
  },
  "creator": {
    "@type": "Person",
    "name": "Lexx",
    "description": "Bible student and Jehovah's Witness who built NWT Progress",
    "url": "https://nwtprogress.com/about"
  }
}
```

### 4d. Study Topics listing -- ItemList (LOW)

**Page:** /study-topics
**Why:** The study topics index page only has BreadcrumbList. Adding ItemList (like /books and /plans already have) would give Google a structured list of all topics.

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Bible Study Topics",
  "description": "Key Bible topics from the New World Translation perspective",
  "url": "https://nwtprogress.com/study-topics",
  "numberOfItems": "<STUDY_TOPICS.length>",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "<topic.title>",
      "url": "https://nwtprogress.com/study-topics/<topic.slug>"
    }
  ]
}
```

### 4e. Forum category pages -- CollectionPage (LOW)

**Page:** /forum/[categoryId]
**Why:** Category pages only have BreadcrumbList. Adding CollectionPage (like the forum index) would be consistent.

```json
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": "https://nwtprogress.com/forum/<categoryId>",
  "name": "<categoryName> | NWT Progress Forum",
  "url": "https://nwtprogress.com/forum/<categoryId>",
  "isPartOf": {
    "@type": "WebPage",
    "@id": "https://nwtprogress.com/forum"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://nwtprogress.com/#organization"
  }
}
```

---

## 5. Implementation Priority

Ranked by SEO impact:

1. **Add SearchAction to WebSite schema** (layout.tsx) -- high impact, 5 minutes
2. **Add `offers` to Course schema** (plans/[slug]) -- improves Course rich result eligibility
3. **Remove empty `sameAs` arrays** (layout.tsx) -- cleanup, 1 minute
4. **Add ItemList to /study-topics** -- consistency with /books and /plans
5. **Remove `instructor` from CourseInstance** (plans/[slug]) -- cleanup
6. **Update hardcoded dates** on study-topics and books articles -- ongoing maintenance concern

---

## 6. Overall Assessment

**Score: Strong (8/10)**

The site has comprehensive structured data coverage across all SSR pages. Every public page has at least BreadcrumbList, and content pages have appropriate content-type schemas (BlogPosting, Article, DiscussionForumPosting, Course, ItemList). The JSON-LD format is used consistently and correctly, with `https://schema.org` as the context and absolute URLs throughout.

The main gaps are:
- Missing SearchAction on WebSite (the single highest-impact fix)
- Minor property-level issues on Course and Organization schemas
- One missing ItemList on the study-topics index page

No deprecated or invalid schema types are in use. The FAQPage on the landing page is correctly implemented but will not generate Google rich results on a commercial site -- it remains useful for AI/LLM discoverability.
