# Core Web Vitals & Performance Audit

**Site:** https://nwtprogress.com
**Stack:** Next.js 15, React 19, Vercel, Supabase
**Date:** 2026-04-03
**Auditor:** Claude (codebase-level analysis; PSI API quota exceeded)

---

## Executive Summary

The site has strong performance foundations: self-hosted variable font with `font-display: swap`, aggressive lazy loading via `React.lazy()` for all routes, deferred Sentry/analytics loading, AVIF/WebP image optimization, and proper Vercel caching headers. The main risks are: (1) a render-blocking Google Fonts stylesheet for Cormorant Garamond loaded on every page, (2) ~668 KB of raw CSS with no CSS Modules or tree-shaking, (3) `<img>` tags without `width`/`height` causing CLS, and (4) the landing page importing Supabase client (heavy SDK) just for community stats.

**Estimated scores (mobile):**
- Performance: 70-80 (bottlenecked by render-blocking font CSS and JS bundle size)
- LCP: Likely "Needs Improvement" (2.5-3.5s on mobile due to render chain)
- INP: Likely "Good" (<200ms -- SVG-based UI, lazy-loaded routes)
- CLS: At risk (>0.1 due to images without dimensions, dynamic content injection)

---

## 1. LCP (Largest Contentful Paint)

### What the LCP element likely is
- **Landing page (unauthenticated):** The `<h1>` text ("Track Your Bible Reading...") or the hero CTA button. No hero image, so LCP is text-dependent.
- **Home page (authenticated):** The main dashboard content, which depends on Supabase queries resolving.

### Issues Found

#### CRITICAL: Render-blocking Google Fonts stylesheet
**File:** `app/layout.tsx`, line 120
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&display=swap" />
```
This is a **render-blocking `<link rel="stylesheet">`** in `<head>`. The browser must download and parse this CSS before rendering any content. It requires:
1. DNS lookup for `fonts.googleapis.com`
2. TCP + TLS handshake
3. Download the CSS file
4. Parse it, discover font URLs on `fonts.gstatic.com`
5. Download the actual font files (only when text using the font is encountered)

**Impact:** Adds 200-500ms to LCP on mobile networks.

**Fix:** Self-host Cormorant Garamond alongside Plus Jakarta Sans. The font is only used decoratively in ~10 CSS rules across a few pages. Download the WOFF2 files, add an `@font-face` declaration to the inline `<style>` block, and remove the Google Fonts `<link>` entirely.

#### HIGH: Supabase SDK loaded on landing page
**File:** `src/views/LandingPage.tsx`, line 6
```tsx
import { supabase } from "../lib/supabase";
```
The landing page imports the full Supabase client just for `useCommunityStats()` (3 RPC calls). The `@supabase/supabase-js` package is ~40-60 KB gzipped. This means the landing page critical bundle includes the Supabase SDK even though the page is purely marketing content.

**Fix:** Move the community stats fetch to a Next.js Server Component or a lightweight API route (`/api/stats`). The landing page should have zero backend SDK in its client bundle.

#### MODERATE: No `fetchPriority="high"` on LCP candidates
No usage of `fetchPriority` found anywhere in the codebase. While the landing page LCP is text (not an image), authenticated pages with avatar images or hero content should mark the LCP candidate with `fetchPriority="high"`.

#### MODERATE: SPA architecture means LCP depends on full JS execution
The `ClientShell` component (`app/_components/ClientShell.tsx`) uses `dynamic(() => import("../../src/App"), { ssr: false })`. This means:
1. Browser downloads HTML (near-empty shell + SSR fallback)
2. Downloads and parses the JS bundle
3. React hydrates
4. `App.tsx` mounts, checks localStorage for session
5. Lazy-loads `AuthedApp` or renders `LandingPage`
6. LCP element finally paints

This is mitigated by the inline skeleton styles in the `<head>`, but the actual content LCP will be delayed by the full JS waterfall.

**Fix (long-term):** For the landing page specifically, consider rendering it as a Server Component with zero client JS for the initial paint. The `onGetStarted` interactivity can be a client island.

---

## 2. CLS (Cumulative Layout Shift)

### Issues Found

#### HIGH: ~20 `<img>` tags without `width`/`height` attributes
Multiple avatar and cover images across the app use `<img>` without explicit dimensions:

- `src/components/AppLayout.tsx` (line 58)
- `src/components/TopBar.tsx` (line 162)
- `src/components/NotificationDropdown.tsx` (line 83)
- `src/views/HomePage.tsx` (lines 288, 526, 625)
- `src/views/groups/GroupsPage.tsx` (line 234)
- `src/views/groups/GroupDetail.tsx` (lines 696, 795)
- `src/views/profile/SettingsPage.tsx` (line 131)
- `src/views/messages/MessagesPage.tsx` (line 460)
- `src/views/friends/InviteLandingPage.tsx` (line 47)
- `src/components/messages/FloatingChat.tsx` (lines 271, 626)
- Plus several more

When these images load, they shift surrounding content because the browser doesn't know the intrinsic size in advance.

**Fix:** Add `width` and `height` attributes to all `<img>` tags. For avatars (which are all squares), use the CSS-sized dimensions (e.g., `width={40} height={40}`). For cover images, use the aspect ratio container pattern or explicit dimensions. Note: `BlogPage.tsx` and `ForumPage.tsx` already have proper dimensions on their images -- follow that pattern everywhere.

#### MODERATE: Dynamic content injection patterns
- `useCommunityStats()` in `LandingPage.tsx` fetches data after mount, potentially shifting the promo banner and social proof text.
- The SSR fallback hide/show mechanism (`#ssr-fallback`) can cause a flash if timing is off.

**Fix:** Reserve space for dynamic content with min-height or skeleton placeholders.

#### LOW: Web font FOUT
The self-hosted Plus Jakarta Sans uses `font-display: swap`, which is correct for performance but can cause a layout shift when the font swaps in (different metrics than the fallback). The inline `@font-face` in the `<head>` preloads the font, which minimizes this.

**Fix (optional):** Add `size-adjust`, `ascent-override`, `descent-override` to the `@font-face` fallback to match metrics with the system font. Tools like [Fontaine](https://github.com/unjs/fontaine) can generate these values automatically.

---

## 3. INP (Interaction to Next Paint)

### Assessment: Likely Good

The app architecture is favorable for INP:
- All routes are lazy-loaded, so navigating between pages doesn't block the main thread with unused code
- RichTextEditor (TipTap, ~100 KB+) is lazy-loaded only in BlogDashboard and ForumPage
- Sentry is deferred via `requestIdleCallback`
- React Query persistence is lazy-loaded
- No heavy synchronous operations visible in event handlers
- Google Analytics uses `strategy="afterInteractive"` (Next.js Script component)

### Potential Risks

#### MODERATE: 78 KB English translation JSON bundled inline
**File:** `src/i18n.ts` imports `src/locales/en/translation.json` (78 KB raw, ~15-20 KB gzipped). This is parsed synchronously during module evaluation. Every `t()` call is synchronous (good for INP), but the initial parse adds to TBT (Total Blocking Time).

**Fix:** Consider splitting the translation file into per-route chunks, or loading it asynchronously via the HTTP backend like non-English languages.

#### LOW: Large component files
`HomePage.tsx` is 740 lines. While React handles this efficiently, extremely large render trees can slow INP if re-renders are frequent. Monitor with React DevTools Profiler.

#### LOW: react-day-picker loaded eagerly on ProfilePage
**File:** `src/views/profile/ProfilePage.tsx` imports `react-day-picker/style.css` at the top level. Since ProfilePage is already lazy-loaded, this is acceptable, but the date picker itself could be further lazy-loaded if it's behind a toggle.

---

## 4. Resource Optimization

### JavaScript Bundle

**Good practices already in place:**
- `React.lazy()` for all 30+ route components
- Dynamic import for DevTools (dev only), Sentry, Query Persistence, RichTextEditor
- Next.js automatic code splitting per route
- `sharp` in devDependencies for image optimization

**Concerns:**

| Dependency | Est. Size (gzipped) | Issue |
|---|---|---|
| `@supabase/supabase-js` | ~45 KB | Loaded on landing page unnecessarily |
| `@tiptap/*` (6 packages) | ~80-100 KB | Properly lazy-loaded |
| `i18next` + backends | ~25 KB | Loaded upfront; EN translations bundled inline (78 KB raw) |
| `react-day-picker` | ~15 KB | Only on ProfilePage (OK) |
| `dompurify` | ~12 KB | Only on AboutPage (OK) |
| `@sentry/react` | ~30 KB | Deferred via requestIdleCallback (good) |
| `@vercel/analytics` | ~2 KB | Minimal |

### CSS

**Total raw CSS:** 668 KB across 57 files

Top offenders:
| File | Size |
|---|---|
| `app.css` | 53 KB |
| `messages.css` | 44 KB |
| `floating-chat.css` | 42 KB |
| `groups.css` | 34 KB |
| `forum.css` | 33 KB |
| `family-quiz.css` | 32 KB |
| `reading-plans.css` | 28 KB |
| `profile.css` | 28 KB |
| `blog.css` | 27 KB |
| `admin.css` | 27 KB |

CSS is imported at the component level (`import "../../styles/messages.css"`), which means Next.js will bundle and load it when the component is rendered. Since all views are lazy-loaded, this is reasonably code-split. However, `app.css` (53 KB) is loaded globally on every page.

**Fix:** Audit `app.css` for styles that could be moved to component-specific files. Consider extracting critical CSS (~5 KB) inline and deferring the rest.

### Images

**Good:** `next.config.js` configures AVIF + WebP, 1-year cache TTL, and standard responsive breakpoints.

**Issue:** No `next/image` (`<Image>`) component is used anywhere in the codebase. All images use raw `<img>` tags. This means:
- No automatic responsive `srcset` generation
- No automatic lazy loading (some manual `loading="lazy"` exists)
- No automatic AVIF/WebP conversion for user-uploaded images (e.g., avatars from Supabase storage)
- No automatic blur placeholder

**Fix:** Migrate avatar and cover images to `next/image` for automatic optimization. The `remotePatterns` config already allows Supabase URLs. Priority: cover images and hero-area avatars that appear above the fold.

---

## 5. Third-Party Script Impact

| Script | Strategy | Impact |
|---|---|---|
| Google Analytics (gtag.js) | `afterInteractive` | Low -- loads after hydration |
| Vercel Analytics | React component | Minimal (~2 KB) |
| Sentry | `requestIdleCallback` | Low -- deferred until idle |
| Google Fonts CSS | **Render-blocking** | **HIGH** -- blocks first paint |
| Supabase SDK | Bundled in client JS | Moderate -- adds to bundle size |

**The only problematic third-party resource is the Google Fonts stylesheet.** Everything else is well-deferred.

---

## 6. Font Loading Strategy

### Plus Jakarta Sans Variable (primary font)
- Self-hosted at `/fonts/plus-jakarta-sans-variable.woff2` (27 KB)
- Preloaded via `<link rel="preload">` in `<head>`
- `@font-face` declared inline in `<head>` with `font-display: swap`
- Variable font (200-800 weight) -- single file for all weights
- 1-year immutable cache via `vercel.json`

**Assessment: Excellent.** This is the ideal font loading pattern.

### Cormorant Garamond (decorative/accent font)
- Loaded from Google Fonts CDN via render-blocking `<link rel="stylesheet">`
- Used in ~10 CSS rules across landing, quiz, forum, profile, study notes, about pages
- Loads 4 variants: regular 300/600 + italic 300/600

**Assessment: Poor.** This font causes the single biggest performance bottleneck.

**Fix (recommended approach):**
1. Download Cormorant Garamond WOFF2 files from Google Fonts
2. Place in `/public/fonts/`
3. Add `@font-face` to the inline `<style>` in `layout.tsx` with `font-display: swap`
4. Add a `<link rel="preload">` for the most-used weight (likely 600)
5. Remove the Google Fonts `<link rel="stylesheet">` and both `<link rel="preconnect">` to Google

Expected impact: **200-500ms improvement on LCP** (removes render-blocking CSS + eliminates 2 DNS lookups + 2 TCP connections).

---

## 7. Critical Rendering Path

### Current waterfall (landing page, cold cache, mobile 4G):

```
0ms    HTML request to Vercel edge
~100ms HTML response (small -- mostly empty shell + inline styles)
~100ms Parse HTML, discover resources
       |-- Render-blocking: Google Fonts CSS (fonts.googleapis.com)    [200-400ms]
       |-- Preload: plus-jakarta-sans-variable.woff2                   [parallel]
       |-- JS bundle download                                          [parallel]
       |   |-- next/chunk (framework) ~80 KB gz
       |   |-- App.tsx chunk (includes i18n + en translations)
       |   |-- LandingPage chunk (includes supabase SDK)
~500ms Google Fonts CSS downloaded + parsed
       |-- Discover Cormorant Garamond WOFF2 URLs
       |-- Download font files from fonts.gstatic.com                  [200-300ms]
~600ms JS parsed + executed
       |-- React mounts App component
       |-- LandingPage renders (text-based, no images)
       |-- LCP candidate paints (h1 text)
~800ms Cormorant Garamond fonts arrive, swap triggers minor reflow
~900ms useCommunityStats() fires Supabase RPCs
~1.2s  Stats arrive, promo banner + social proof text injected (CLS)
```

**Estimated LCP: 600-800ms on Vercel edge (fast 4G), 2.0-3.0s on slow 4G.**

### Optimization opportunities in the critical path:

1. **Remove Google Fonts render block** (-200-500ms LCP)
2. **Remove Supabase from landing bundle** (-40-60 KB from critical JS)
3. **Server-render the landing page** (-300-500ms LCP on slow connections)
4. **Inline critical CSS for landing page** (already partially done with skeleton styles)

---

## 8. Caching & CDN

### Assessment: Excellent

The `vercel.json` headers are well-configured:
- `/_next/static/*`: `max-age=31536000, immutable` (1 year, fingerprinted)
- `/fonts/*`: `max-age=31536000, immutable` (1 year)
- `/locales/*`: `max-age=3600, stale-while-revalidate=86400`
- `/sw.js`: `no-cache, no-store, must-revalidate`
- `/og-image.webp`: `max-age=604800, stale-while-revalidate=86400`

Next.js image optimization cache: `minimumCacheTTL: 31536000` (1 year).

**No changes needed.**

---

## 9. Additional Observations

### Service Worker (PWA)
- Registered in production via `providers.tsx`
- Only 159 lines / 5.4 KB -- likely a basic cache strategy
- Registered after `window.load` event (good, doesn't compete with initial load)

### Web Vitals Reporting
- `useReportWebVitals()` sends CWV metrics to Google Analytics 4
- This is good for monitoring real-user performance data (field data)

### Security Headers
- Comprehensive CSP, HSTS, X-Frame-Options, etc.
- No performance impact (these are response headers, not resources)

### SSR Fallback Pattern
- Blog list page pre-renders an HTML list of posts, then hides it once the SPA mounts
- This is good for SEO crawlers but the hide/show can cause CLS for users if timing is off

---

## 10. Prioritized Action Items

| Priority | Action | Expected Impact | Effort |
|---|---|---|---|
| P0 | Self-host Cormorant Garamond, remove Google Fonts render-blocking CSS | LCP -200-500ms | 1 hour |
| P1 | Add `width`/`height` to all `<img>` tags (~20 instances) | CLS improvement (potentially passing 0.1 threshold) | 1-2 hours |
| P1 | Move landing page stats to API route, remove Supabase from landing bundle | -40-60 KB from landing JS | 1 hour |
| P2 | Migrate key images to `next/image` (avatars, covers) | Automatic responsive images, lazy loading, AVIF | 3-4 hours |
| P2 | Audit `app.css` (53 KB) -- extract styles only needed by specific routes | Reduce global CSS payload | 2-3 hours |
| P3 | Split English translation JSON into per-route chunks | -15 KB from initial bundle, faster TBT | 2-3 hours |
| P3 | Add font metric overrides (size-adjust) for Plus Jakarta Sans fallback | Minor CLS reduction | 30 min |
| P4 | Server-render landing page as RSC | Major LCP improvement for first-time visitors | 4-6 hours |

---

## Metric Thresholds Reference (2026)

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | <=2.5s | 2.5s-4.0s | >4.0s |
| INP | <=200ms | 200ms-500ms | >500ms |
| CLS | <=0.1 | 0.1-0.25 | >0.25 |

Google evaluates the 75th percentile of page visits. 75% of visits must meet the "good" threshold.
