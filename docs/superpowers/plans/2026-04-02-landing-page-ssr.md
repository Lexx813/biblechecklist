# Landing Page SSR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Server-render the landing page so the LCP element is in the initial HTML, dropping element render delay from ~2,500ms to <200ms and making content crawlable by Google.

**Architecture:** A new pure server component (`LandingPageStatic`) renders the full landing page HTML with hardcoded English strings. It sits inside `<div id="ssr-fallback">` in the root route. A small inline script hides it immediately for authenticated users. `App.tsx` removes it via `useLayoutEffect` once React mounts, so the interactive React version takes over seamlessly.

**Tech Stack:** Next.js 14 App Router, React Server Components, TypeScript, inline CSS-in-HTML

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/_components/LandingPageStatic.tsx` | **Create** | Pure server component — full landing page HTML, English strings, no hooks |
| `app/[[...slug]]/page.tsx` | **Modify** | Wrap static shell in `#ssr-fallback`, remove old hidden SEO div |
| `app/layout.tsx` | **Modify** | Add auth-detection inline script + CSS rule to hide `#ssr-fallback` for authed users |
| `src/App.tsx` | **Modify** | Change `useEffect` → `useLayoutEffect` for `#ssr-fallback` removal to avoid one-frame flash |

---

## Task 1: Add auth-hide rule to layout.tsx inline styles

**Files:**
- Modify: `app/layout.tsx:110`

The inline `<style>` block ends with `@keyframes sk-pulse{...}`. Append one rule so that when `data-authed` is on `<html>`, the SSR fallback is hidden immediately — before any JS runs.

- [ ] **Step 1: Extend the inline style string**

In `app/layout.tsx`, find the `<style dangerouslySetInnerHTML=...>` tag (line 110). It currently ends with:
```
...@keyframes sk-pulse{0%,100%{opacity:.6}50%{opacity:1}}`
```

Change it to:
```
...@keyframes sk-pulse{0%,100%{opacity:.6}50%{opacity:1}}[data-authed] #ssr-fallback{display:none!important}`
```

(Append the selector to the end of the same template literal string — one character change.)

- [ ] **Step 2: Add the auth-detection inline script**

In `app/layout.tsx`, after the existing theme-detection `<script>` block (lines 105–109), add a new `<script>` block:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `!function(){try{var u="${process.env.NEXT_PUBLIC_SUPABASE_URL||""}";var r=(u.match(/\\/\\/([^.]+)/)||[])[1]||"";var raw=r&&localStorage.getItem("sb-"+r+"-auth-token");var ok=raw&&JSON.parse(raw).refresh_token;if(!ok)ok=location.search.indexOf("code=")>-1||location.hash.indexOf("access_token=")>-1;if(ok)document.documentElement.setAttribute("data-authed","")}catch{}}()`,
  }}
/>
```

This runs synchronously before first paint. It checks for a Supabase session token using the same logic as `hasStoredSession()` in `src/App.tsx`. If a session exists, it sets `data-authed` on `<html>`, which the CSS rule above uses to hide `#ssr-fallback` immediately.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors. The new script tag has no types to check since it's an `__html` string.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: hide SSR fallback immediately for authenticated users"
```

---

## Task 2: Create LandingPageStatic server component

**Files:**
- Create: `app/_components/LandingPageStatic.tsx`

Pure server component. No hooks, no i18n, no Supabase. All strings hardcoded in English (from `public/locales/en/translation.json`). Community stats use static defaults (500+ users, no promo). CTA buttons are non-functional — React's LandingPage replaces the entire shell within ~1s.

- [ ] **Step 1: Create the file**

Create `app/_components/LandingPageStatic.tsx` with the following content:

```tsx
import "../../src/styles/landing.css";

export default function LandingPageStatic() {
  return (
    <div className="landing-wrap" role="main" id="main-content">
      {/* Animated background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-orb landing-orb--1" />
        <div className="landing-orb landing-orb--2" />
        <div className="landing-orb landing-orb--3" />
        <div className="landing-orb landing-orb--4" />
        <div className="landing-orb landing-orb--5" />
        <div className="landing-orb landing-orb--gold" />
        <div className="landing-star landing-star--1" />
        <div className="landing-star landing-star--2" />
        <div className="landing-star landing-star--3" />
        <div className="landing-grid" />
      </div>

      {/* Hero */}
      <div className="landing-hero">
        {/* Pulsing icon */}
        <div className="landing-icon-wrap">
          <div className="landing-icon-ring landing-icon-ring--1" />
          <div className="landing-icon-ring landing-icon-ring--2" />
          <div className="landing-icon-ring landing-icon-ring--3" />
          <span className="landing-icon" style={{ color: "#c084fc" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
        </div>

        <div className="landing-badge">✦ New World Translation · 66 Books</div>

        <h1 className="landing-title">
          Grow Closer to Jehovah
          <span className="landing-title-accent">One Chapter at a Time</span>
        </h1>

        <p className="landing-subtitle">
          Bible reading tracker, study notes, meeting prep, and AI study tools — built for Jehovah&apos;s Witnesses.
        </p>

        <div className="landing-features">
          {[
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>, label: "66 Books" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>, label: "Track Chapters" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label: "Reading Plans" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>, label: "AI Study Tools" },
            { icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>, label: "Meeting Prep" },
          ].map(({ icon, label }) => (
            <div key={label} className="landing-feature">
              {icon}
              <span>{label}</span>
            </div>
          ))}
        </div>

        <button className="landing-cta" type="button">
          <span>Start Your Journey</span>
          <span className="landing-cta-arrow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </button>

        <p className="landing-social-proof" aria-label="Community size">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ opacity: 0.7 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Join 500+ publishers worldwide
        </p>

        {/* HOW IT WORKS — this is the LCP element */}
        <div className="landing-how">
          <p className="landing-how-label">How it works</p>
          <div className="landing-how-steps">
            <div className="landing-how-step">
              <span className="landing-how-num">1</span>
              <strong>Sign up free</strong>
              <span>Email or Google, 30 seconds</span>
            </div>
            <div className="landing-how-divider" aria-hidden="true" />
            <div className="landing-how-step">
              <span className="landing-how-num">2</span>
              <strong>Check off chapters</strong>
              <span>All 66 books, chapter by chapter</span>
            </div>
            <div className="landing-how-divider" aria-hidden="true" />
            <div className="landing-how-step">
              <span className="landing-how-num">3</span>
              <strong>Build the habit</strong>
              <span>Streaks, plans, quiz badges</span>
            </div>
          </div>
        </div>

        <div className="landing-testimonials">
          <blockquote className="landing-testimonial">
            <p>&ldquo;Finally a tool that keeps me consistent with my Bible reading.&rdquo;</p>
            <cite>M.G. · México</cite>
          </blockquote>
          <blockquote className="landing-testimonial">
            <p>&ldquo;The quiz levels and badges make studying feel like a game. I&apos;ve learned so much.&rdquo;</p>
            <cite>D.K. · United Kingdom</cite>
          </blockquote>
          <blockquote className="landing-testimonial">
            <p>&ldquo;Tracking all 66 books with the heatmap keeps me motivated every single day.&rdquo;</p>
            <cite>A.P. · Brasil</cite>
          </blockquote>
        </div>

        <p className="landing-signin">
          Already have an account?{" "}
          <button className="landing-signin-link" type="button">Sign in</button>
        </p>
      </div>

      {/* Pricing */}
      <section className="landing-pricing">
        <div className="landing-pricing-header">
          <h2 className="landing-pricing-title">Simple, transparent pricing</h2>
          <p className="landing-pricing-sub">Start free. Upgrade when you&apos;re ready to go deeper.</p>
        </div>

        <div className="landing-pricing-cards">
          {/* Free plan */}
          <div className="landing-plan">
            <p className="landing-plan-name">Free</p>
            <div className="landing-plan-price">
              <span className="landing-plan-amount">$0</span>
              <span className="landing-plan-period">/ forever</span>
            </div>
            <p className="landing-plan-desc">Everything you need to start tracking your Bible reading.</p>
            <ul className="landing-plan-features">
              {[
                { icon: "📖", label: "Reading Tracker", desc: "Track all 66 books chapter by chapter" },
                { icon: "🧠", label: "Bible Quiz", desc: "1,000+ questions across 12 themes" },
                { icon: "💬", label: "Community Forum", desc: "Discuss and learn together" },
                { icon: "✍️", label: "Blog", desc: "Read and write study articles" },
                { icon: "🔥", label: "Streaks & Heatmap", desc: "Build a daily reading habit" },
              ].map(f => (
                <li key={f.label} className="landing-plan-feature landing-plan-feature--detailed">
                  <span className="landing-plan-feature-icon">{f.icon}</span>
                  <span><strong>{f.label}</strong><span className="landing-plan-feature-desc">{f.desc}</span></span>
                </li>
              ))}
            </ul>
            <button className="landing-plan-cta landing-plan-cta--ghost" type="button">Get Started Free</button>
          </div>

          {/* Premium plan */}
          <div className="landing-plan landing-plan--premium">
            <div className="landing-plan-popular">Most Popular</div>
            <p className="landing-plan-name">Premium</p>
            <div className="landing-plan-price">
              <span className="landing-plan-amount">$3</span>
              <span className="landing-plan-period">/ month</span>
            </div>
            <p className="landing-plan-desc">Go deeper with structured plans, notes, messaging, and AI.</p>
            <ul className="landing-plan-features">
              {[
                { icon: "📅", label: "Reading Plans", desc: "Structured multi-week study plans" },
                { icon: "📝", label: "Study Notes", desc: "Rich-text notes tied to passages" },
                { icon: "📋", label: "Meeting Prep", desc: "CLAM + Watchtower study checklists" },
                { icon: "✨", label: "AI Study Assistant", desc: "Ask anything about any verse" },
                { icon: "💬", label: "Direct Messages", desc: "Private conversations with members" },
                { icon: "👥", label: "Study Groups", desc: "Group chat and progress tracking" },
              ].map(f => (
                <li key={f.label} className="landing-plan-feature landing-plan-feature--detailed">
                  <span className="landing-plan-feature-icon">{f.icon}</span>
                  <span><strong>{f.label}</strong><span className="landing-plan-feature-desc">{f.desc}</span></span>
                </li>
              ))}
            </ul>
            <button className="landing-plan-cta landing-plan-cta--primary" type="button">
              Start 7-Day Free Trial
            </button>
            <p className="landing-plan-note">Cancel anytime · No commitment</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        © {new Date().getFullYear()} JW Study · Lexx Solutionz
        {" · "}
        <a href="/terms" className="landing-footer-link">Terms of Service</a>
        {" · "}
        <a href="/privacy" className="landing-footer-link">Privacy Policy</a>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds. If TypeScript complains about JSX in `.tsx`, verify the file extension is `.tsx` not `.ts`.

- [ ] **Step 3: Commit**

```bash
git add app/_components/LandingPageStatic.tsx
git commit -m "feat: add SSR-rendered landing page static shell"
```

---

## Task 3: Update root route to use LandingPageStatic

**Files:**
- Modify: `app/[[...slug]]/page.tsx`

Replace the existing hidden SEO div with the visible `LandingPageStatic`. Wrap in `<div id="ssr-fallback">` so `App.tsx`'s existing cleanup code removes it automatically on mount. Keep the FAQ schema JSON-LD and `ClientShell`.

- [ ] **Step 1: Update the isRoot branch**

In `app/[[...slug]]/page.tsx`, replace the entire `if (isRoot)` return block with:

```tsx
import LandingPageStatic from "../_components/LandingPageStatic";

// ... (FAQ_ITEMS and SEO_HIDE const can be removed entirely)

export default async function Page({ params }) {
  const { slug } = await params;
  const isRoot = !slug || slug.length === 0;

  if (isRoot) {
    const schemaFAQ = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }}
        />
        <div id="ssr-fallback">
          <LandingPageStatic />
        </div>
        <ClientShell />
      </>
    );
  }

  return <ClientShell />;
}
```

Remove the `SEO_HIDE` constant and the hidden div entirely — that content is now visible in `LandingPageStatic`. Keep `FAQ_ITEMS` (still used for the schema JSON-LD). Keep the `ClientShell` import.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Test SSR output in dev**

```bash
npm run dev
```

In a separate terminal:

```bash
curl -s http://localhost:3000 | grep -o "How it works"
```

Expected output:
```
How it works
```

Also verify:
```bash
curl -s http://localhost:3000 | grep -o "Grow Closer to Jehovah"
```

Expected output:
```
Grow Closer to Jehovah
```

- [ ] **Step 4: Commit**

```bash
git add app/[[...slug]]/page.tsx
git commit -m "feat: render landing page SSR shell in root route"
```

---

## Task 4: Fix App.tsx to use useLayoutEffect for shell removal

**Files:**
- Modify: `src/App.tsx:3,37-39`

`useEffect` fires after the browser paints, causing a single frame where both the static shell and the React landing page are visible simultaneously. `useLayoutEffect` fires synchronously after React's DOM commit but before paint, preventing the flash.

- [ ] **Step 1: Add useLayoutEffect import and update the effect**

In `src/App.tsx`, change line 3 from:
```tsx
import { useState, useEffect, lazy, Suspense } from "react";
```
to:
```tsx
import { useState, useEffect, useLayoutEffect, lazy, Suspense } from "react";
```

Then change the SSR fallback removal effect (lines 37–39) from:
```tsx
  useEffect(() => {
    document.getElementById("ssr-fallback")?.remove();
  }, []);
```
to:
```tsx
  useLayoutEffect(() => {
    document.getElementById("ssr-fallback")?.remove();
  }, []);
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Run existing tests**

```bash
npm test
```

Expected: all tests pass (no tests cover this component directly; this confirms no regressions in utilities).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "fix: use useLayoutEffect for SSR shell removal to prevent one-frame flash"
```

---

## Task 5: Manual verification

**No file changes — validation only.**

- [ ] **Step 1: Start dev server and open the landing page in browser**

```bash
npm run dev
```

Open `http://localhost:3000` in an incognito window (no stored session). Verify:
- Landing page content is visible immediately (no blank screen + spinner)
- The page is fully interactive after ~1s (CTA buttons work, language selector works)
- No double-rendering visible (no flash of two landing pages)

- [ ] **Step 2: Test authenticated user path**

In a regular browser window (with an active login session), open `http://localhost:3000`. Verify:
- The landing page does NOT flash before the authenticated app loads
- You go directly to the app skeleton/spinner as before

- [ ] **Step 3: Verify Google can crawl the content**

```bash
curl -s http://localhost:3000 | grep -c "landing-how-label"
```

Expected output: `1`

```bash
curl -s http://localhost:3000 | grep "Simple, transparent pricing"
```

Expected: the pricing section heading is present in the HTML.

- [ ] **Step 4: Run full test suite one final time**

```bash
npm test
```

Expected: all 31 tests pass.
