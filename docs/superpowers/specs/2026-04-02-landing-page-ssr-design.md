# Landing Page SSR Design

**Date:** 2026-04-02  
**Status:** Approved

## Problem

The `/` route currently has a 2,500ms LCP element render delay. Root cause: `ClientShell` uses `dynamic(..., { ssr: false })`, so the server sends empty HTML. All visible content — including the LCP element (`<p class="landing-how-label">How it works</p>`) — is deferred until JavaScript downloads, parses, and executes. This hurts both Core Web Vitals and Google's ability to crawl landing page content.

## Goal

Render the full landing page HTML server-side so the LCP element is in the initial response. Google crawls real content (hero, features, pricing, testimonials, footer) instead of a hidden div. The authenticated SPA remains untouched.

## Scope

Only the `/` route for logged-out users. No changes to routing, auth, Supabase, Stripe, React Query, or the authenticated SPA.

## Architecture

### 1. `app/_components/LandingPageStatic.tsx` — new server component

Pure server component (no hooks, no i18n, no Supabase). Renders the complete landing page HTML using hardcoded English strings sourced from `public/locales/en/translation.json`. Imports `src/styles/landing.css`.

Renders all sections:
- Animated background orbs (aria-hidden)
- Hero: icon, badge, h1 title, subtitle, feature pills, CTA button, social proof placeholder ("500+ publishers worldwide")
- How It Works: 3 steps — this is the LCP element
- Testimonials (hardcoded, they never change)
- Pricing: Free and Premium cards with static default prices (no promo pricing — that requires live Supabase data)
- Footer

The community stats (live user count, chapters read, spots left / promo pricing) render with static defaults. The React client layer replaces them with live values after hydration.

`suppressHydrationWarning` on the root `<div className="landing-wrap">` to prevent React warnings when the client re-renders with i18n strings or live stats that differ from the server-rendered defaults.

### 2. `app/[[...slug]]/page.tsx` — modified root branch

Replace the current structure for `isRoot`:
```
// Before
<hidden SEO div>
<ClientShell />

// After
<schema JSON-LD>
<LandingPageStatic />        ← visible, full SSR content, fast LCP
<div id="app-shell" style={{ display: 'none' }}>
  <ClientShell />            ← hidden until auth check completes
</div>
```

The hidden SEO div is removed. Its content (h1, FAQ, links) is now visible in `LandingPageStatic`, so it is redundant. FAQ schema JSON-LD stays.

### 3. `app/layout.tsx` — auth-detection inline script

Add a small inline `<script>` in `<head>` immediately after the theme-detection script. It checks `localStorage` for a Supabase session (key: `sb-<project-ref>-auth-token`). If a session is found, it immediately adds `data-authed` to `<html>`, which CSS uses to:
- Hide `LandingPageStatic` (`display: none`)
- Show `#app-shell` (`display: block`)

This prevents authenticated users from ever seeing the landing page flash. They see the spinner skeleton exactly as before.

The Supabase project ref is available from `NEXT_PUBLIC_SUPABASE_URL` — extract it at build time.

### 4. `src/App.tsx` — dismiss static shell

In the effect that handles auth state:
- When the user is **not authenticated** and `LandingPage` mounts: hide `LandingPageStatic` (set `display: none` via `document.getElementById('landing-static')`) and show `#app-shell`
- When the user **is authenticated**: same — hide static shell, show app shell (auth check already handled by the inline script for returning users; this covers the JS-confirmed path)

### 5. `src/views/LandingPage.tsx` — dismiss static shell on mount

In a `useEffect` with empty deps, hide `#landing-static` so the React-rendered version is the only visible landing page after hydration.

## Data flow

```
Request /
  → Server: render LandingPageStatic (English, static defaults)
  → Browser: paints landing page immediately — LCP fast ✓
  → Inline script: check localStorage for session
      → If session found: hide static, show skeleton (authed user path)
  → JS downloads and React hydrates
  → App.tsx checks auth (Supabase)
      → Not authed: LandingPage mounts, hides static shell, shows itself
      → Authed: AuthedApp mounts, hides static shell, shows app
```

## i18n tradeoff

The server always renders English. Non-English users see English on first paint, then their language after React hydrates (~1s). This is the same delay they experience today (blank → translated), just from English instead of blank. Crawlers see English, which is correct for SEO. No server-side i18n complexity needed.

## CSS

`landing.css` is already imported by `LandingPage.tsx`. The server component must also import it directly so styles are included in the SSR output.

## What is not changing

- `ClientShell.tsx` — no change
- `src/App.tsx` routing logic — no change beyond the shell-dismissal effect
- Auth flow, Supabase client, Stripe — no change
- All authenticated app views — no change
- Blog, forum, books pages — no change (already SSR'd)

## Files

| File | Action |
|------|--------|
| `app/_components/LandingPageStatic.tsx` | Create |
| `app/[[...slug]]/page.tsx` | Modify (isRoot branch only) |
| `app/layout.tsx` | Modify (add auth-detection script) |
| `src/App.tsx` | Modify (dismiss static shell) |
| `src/views/LandingPage.tsx` | Modify (dismiss static shell on mount) |

## Success criteria

- `curl https://nwtprogress.com/` returns HTML containing "How it works", "Grow Closer to Jehovah", pricing section text
- LCP element render delay drops from ~2,500ms to <200ms (element in initial HTML)
- Authenticated users see no landing page flash (show skeleton as before)
- No hydration warnings in console
- Existing tests pass
