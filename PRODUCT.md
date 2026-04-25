---
register: product
---

# JW Study (jwstudy.org)

Bible study companion app for Jehovah's Witnesses. Solo-built. **Free for everyone**, with an optional donation path for users who want to support the work. Targeting the 9M+ JW community worldwide.

## Users

- **Primary:** baptized JWs and Bible students who want a daily reading habit, study notes, family quizzes, and a community space — without leaving JW-aligned doctrine.
- **Tone:** familiar, encouraging, JW vernacular ("Jehovah," "pure worship," "God's Kingdom," "Hebrew/Christian Greek Scriptures"). Never trinitarian, never "Old/New Testament," never academic neutrality.
- **Devices:** majority mobile (PWA install path), some desktop. Used in low-light contexts (morning/evening study) and during meetings — must work in both.
- **Languages:** EN/ES are the lead. PT/FR/TL/ZH live too. JP/KR future. Body copy is currently EN-leaning.

## Product Purpose

The app is the daily companion *around* deep study; jw.org and JW Library remain the canonical sources for doctrine. Our CTAs reserve "study journey" framing for jw.org and use tool-utility language for our own features ("track your reading," "save a note," "take the quiz"). When a CTA could route either to our app or to jw.org, jw.org gets top billing.

## Brand & Aesthetic

- **Primary color: violet-600 (`#7C3AED`)** with white text on solid violet for primary CTAs. Soft violet tints (`#F5F3FF`, `#FAF5FF`) for accent surfaces. Light theme is the default; dark mode is supported.
- **Border radius: tight (`--radius` is 6px / `rounded-md`). No pill-radius cards, no hero blobs.
- **Gold (`#f59e0b`) is reserved** for achievement/badge contexts only — streaks, quiz milestones, reading-plan completion. Never on primary CTAs, never on card borders, never as generic chrome.
- **Spacing: 4px grid.** Full-width layouts (`px-4 sm:px-6 lg:px-8`), edge-to-edge — not narrow `max-w-[720px]` cards floating in dark space.
- **Typography:** Plus Jakarta Sans Variable for everything (display + body). Body 16–20px, headings step ≥1.25.
- **Motion:** ease-out, exponential curves. No bounce, no elastic, no parallax.

## Anti-references

What this is **not** allowed to look like:

- **A generic AI SaaS landing.** Gradient hero text, glassmorphism cards, hero-metric stat blocks ("10,000+ users · 500+ verses · ★4.9"), identical 3-up icon-card grids — all banned.
- **A church website.** No stained-glass photo backgrounds, no parchment textures, no script fonts, no italic display type, no crosses (JWs do not use them).
- **An academic tool.** No serif body, no library/research vibe, no neutral grayscale.
- **Duolingo / streak-bait energy.** Streaks exist but are quiet. No mascot, no exclamation-heavy copy, no flame emojis as primary visual.
- **Trinitarian / cross-denominational visuals.** No "Old/New Testament" labels, no trinitarian phrasing, no doctrines from outside JW publications.

## Donation model

The app does not gate features. Every user gets the full product. A small "Support" / "Donate" affordance sits in the footer, settings, and sidebar — never as an interrupting modal, never in primary nav. Donation prompts may appear *after* a meaningful milestone (book completed, plan finished, 30-day streak) and only once, dismissible, never blocking. Tone for donate copy: gratitude and shared purpose, not scarcity or guilt. Never frame donation as "unlocking" anything.

## Strategic Principles

1. **Action over discussion.** The user is solo and ships fast — design output should be specific, opinionated, and ready to apply.
2. **Tailwind for new components, existing CSS for existing components.** Do not create new `.css` files. Migration to Tailwind is in progress, not completed.
3. **Full-width by default.** Edge-to-edge with padding, not centered narrow cards on a dark canvas.
4. **createPortal for fixed overlays.** Modals/drawers/tooltips render to `document.body` to escape ancestor `transform` contexts (Android Chrome breaks otherwise).
5. **JW sources only.** Anything doctrinal must align with wol.jw.org. No outside commentaries.
6. **One brand purple.** Violet-600 only. The five other purples currently in tokens (`#6A3DAA`, `#6D28D9`, `#8B5CF6`, `#A78BFA`, `#5B21B6`) are drift, not intent.
