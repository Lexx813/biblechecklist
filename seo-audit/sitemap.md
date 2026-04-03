# Sitemap Audit -- nwtprogress.com

**Date:** 2026-04-03
**Auditor:** Claude (automated)
**Sitemap URL:** https://nwtprogress.com/sitemap.xml
**Generation:** Dynamic via `app/sitemap.ts` (Next.js App Router convention)

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total URLs in sitemap | 122 |
| HTTP 200 (spot-checked) | 15/15 (100%) |
| XML syntax | Valid (well-formed XML, proper urlset namespace) |
| Content-Type | application/xml |
| File size | 21,095 bytes |
| Sitemap declared in robots.txt | Yes |
| Revalidation interval | 3600s (hourly) |

**Overall grade: B+** -- The sitemap is functional and well-generated, but has several issues that should be cleaned up for best practices.

---

## 2. Validation Results

| Check | Severity | Status | Notes |
|-------|----------|--------|-------|
| Valid XML | Critical | PASS | Well-formed, correct namespace |
| >50k URL limit | Critical | PASS | 122 URLs, well under limit |
| All URLs return 200 | High | PASS | 15/15 spot-checked returned 200 |
| No noindexed URLs in sitemap | High | PASS | No noindex meta detected on checked pages |
| No redirected URLs | Medium | PASS | No 301/302 detected in spot checks |
| Deprecated `<changefreq>` tags | Info | FAIL | All 122 entries include `<changefreq>` -- ignored by Google |
| Deprecated `<priority>` tags | Info | FAIL | All 122 entries include `<priority>` -- ignored by Google |
| lastmod accuracy | Low | WARN | 79 of 122 URLs share identical `2026-01-01` lastmod (see section 5) |
| Missing public pages | High | FAIL | 3 indexable pages missing (see section 4) |
| Stale `public/sitemap.xml` conflict | Medium | WARN | Static fallback file exists but is superseded by dynamic route |
| Phantom sitemap-index.xml / server-sitemap.xml | Low | WARN | Both return 200 but serve HTML (catch-all route), not XML |

---

## 3. Sitemap Sources (Codebase)

There are **two** sitemap files. The dynamic one wins in production.

### 3a. Dynamic (active): `app/sitemap.ts`

- Generates all URLs at runtime with 1-hour revalidation
- Pulls blog posts from Supabase (`blog_posts` table, `published = true`)
- Includes static pages, 66 book pages, 10 reading plan pages, 8 study topic pages, and all published blog posts
- Uses `changeFrequency` and `priority` properties (Next.js outputs them as XML tags)

### 3b. Static (stale/overridden): `public/sitemap.xml`

- Contains only 17 URLs (core pages + study topics)
- Includes `/quiz`, `/checklist`, `/leaderboard` which the dynamic sitemap does NOT
- This file is **not served** in production because `app/sitemap.ts` takes priority
- **Action:** Delete `public/sitemap.xml` to avoid confusion. Add its missing pages to the dynamic generator instead.

---

## 4. Missing Pages

These public, indexable pages return HTTP 200 but are **not** in the live sitemap:

| Page | Status | Should include? |
|------|--------|-----------------|
| `/quiz` | 200 | Yes -- public feature, drives engagement |
| `/checklist` | 200 | Yes -- public feature page |
| `/leaderboard` | 200 | Yes -- public, unique content |
| `/blog/feed.xml` | 200 | No -- RSS feed, not an HTML page |
| `/forum/[id]` (thread pages) | 200 | Consider -- individual threads have unique content; add dynamically if threads are public |

### Correctly excluded (auth-gated, blocked by robots.txt):

- `/admin`, `/profile`, `/bookmarks`, `/feed`, `/history` -- all correctly omitted

---

## 5. lastmod Analysis

| lastmod date | URL count | Assessment |
|-------------|-----------|------------|
| 2026-01-01 | 79 | Suspicious -- all 66 book pages + 10 plan pages + 3 others share this date |
| 2026-03-01 | 3 | Static pages (homepage, study-topics, plans) |
| 2026-04-03 (today) | 10 | Study topics + books/forum -- uses `new Date()`, updates every revalidation |
| Various March/April dates | 30 | Blog posts -- good, uses real `updated_at` from database |

**Problem:** The 79 URLs with `2026-01-01` are hardcoded in `app/sitemap.ts` (lines 35, 42). Google treats identical lastmod dates as unreliable and may ignore them entirely.

**Recommendation:** Either use real modification dates or omit lastmod for pages that genuinely never change. For book and plan pages, using the deploy date or a real content-update date would be more accurate.

The 10 study topic pages use `new Date()` which means lastmod updates on every hourly revalidation even when content has not changed. This is also misleading.

---

## 6. Deprecated Tags

All 122 URLs include both `<changefreq>` and `<priority>` tags.

Google has officially stated (since 2023) that it ignores both of these fields. They add ~5KB of unnecessary bytes to the sitemap. Removing them is not urgent but is a cleanup opportunity.

**In `app/sitemap.ts`:** The `changeFrequency` and `priority` properties on each entry can be removed. Next.js will stop emitting those XML tags.

---

## 7. robots.txt Cross-Reference

```
Sitemap: https://nwtprogress.com/sitemap.xml   -- CORRECT
Disallow: /admin, /profile, /bookmarks, /feed, /history   -- none of these are in sitemap (GOOD)
```

The robots.txt correctly declares the sitemap location. All disallowed paths are excluded from the sitemap. No conflicts detected.

---

## 8. Phantom Sitemap Endpoints

Both `/sitemap-index.xml` and `/server-sitemap.xml` return HTTP 200, but they serve HTML pages (the Next.js catch-all `[[...slug]]` route), not XML. This is not harmful but could confuse crawlers or SEO tools that probe common sitemap paths.

**Recommendation:** No action needed unless these are showing up in crawl error reports.

---

## 9. Recommended Fixes (Priority Order)

### HIGH

1. **Add missing pages to `app/sitemap.ts`:**
   Add `/quiz`, `/checklist`, and `/leaderboard` to the `staticPages` array.

2. **Delete `public/sitemap.xml`:**
   It is stale, overridden, and causes confusion. All sitemap generation should live in `app/sitemap.ts`.

### MEDIUM

3. **Fix lastmod dates for book/plan pages:**
   Replace the hardcoded `2026-01-01` with either the actual last deploy date or omit lastmod entirely for truly static content.

4. **Fix study topic lastmod:**
   Replace `new Date()` with a real date (e.g., the last time study topic content was actually updated) to avoid signaling false freshness on every revalidation.

### LOW

5. **Remove `changeFrequency` and `priority`:**
   Delete these properties from all entries in `app/sitemap.ts`. Google ignores them.

6. **Consider adding forum thread pages:**
   If individual forum threads (e.g., `/forum/[id]`) are publicly accessible and contain substantial content, add them dynamically to the sitemap by querying Supabase for public threads.

---

## 10. Quality Gate Assessment

| Gate | Result |
|------|--------|
| Location pages (doorway risk) | N/A -- no location-based pages |
| Book pages (66 total) | SAFE -- each book is a unique Bible book with distinct content |
| Study topic pages (8 total) | SAFE -- each topic has unique theological content |
| Blog posts (24 total) | SAFE -- individual articles with unique content |
| Plan pages (10 total) | SAFE -- each plan has a unique reading schedule |

No doorway page or thin content risks detected.

---

## Files Referenced

- `/home/alexi/projects/nwt-progress/app/sitemap.ts` -- dynamic sitemap generator (ACTIVE)
- `/home/alexi/projects/nwt-progress/public/sitemap.xml` -- static sitemap fallback (STALE, should delete)
- `/home/alexi/projects/nwt-progress/public/robots.txt` -- robots.txt source
