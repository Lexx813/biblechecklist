# Design Consistency — Cormorant Garamond & Gold Accent

**Date:** 2026-04-01  
**Status:** Approved

## Overview

Apply the two design tokens introduced on the landing page and home page consistently across all pages that matter: Cormorant Garamond italic for display/hero titles, and gold (`#f59e0b`) as the premium accent color.

## Design Tokens

### Cormorant Garamond (serif italic)
- **Purpose:** Display/hero titles only — not body copy, not UI labels
- **Weight:** 300 italic for most titles; 600 italic where emphasis needed
- **Import:** Single `@import` added to `src/styles/app.css` (global, available everywhere)
- **Google Fonts URL:** `https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300;1,600&display=swap`

### Gold Accent
- **Primary:** `--gold: #f59e0b`
- **Dim background:** `--gold-dim: rgba(245,158,11,0.15)`
- **Soft text:** `--gold-text: #fde68a`
- **Source of truth:** Defined in `src/styles/app.css` as global CSS variables (removing duplicates from landing.css and home.css)

## Scope

### Cormorant Garamond — 10 pages

| Page | Element |
|------|---------|
| Quiz | Page hero title + level/book completion heading |
| Reading Plans | Page hero title |
| Leaderboard | Page hero title |
| Forum | Page hero title |
| Blog | Post titles (editorial serif fit) |
| Profile | Display name / page heading |
| About | Hero title + section headings |
| Auth (Login/Signup) | Headline above the sign-in form |
| Upgrade Modal | Modal header title |
| Study Notes | Page hero title |

### Gold (#f59e0b) — 7 element types

| Element | Where |
|---------|-------|
| Premium badges & locked indicators | Everywhere — any "Premium", "Most Popular", "✦ locked" label |
| Upgrade Modal header & CTA | Modal title color + primary button accent/glow |
| Welcome Premium modal | "You're Premium!" celebration header accent |
| Section label pills on premium pages | Reading Plans, Study Notes, Meeting Prep "FEATURE" label pills |
| Streak count number | The numeric count displayed with the fire emoji |
| Leaderboard #1 rank row | First place row highlighted in gold |
| Quiz badge earned state | Badge unlock / earned badge glow in gold |

**Explicitly excluded:** Nav "Upgrade" button (stays purple to maintain primary nav CTA color)

## Implementation Approach

### Step 1 — Global CSS (`src/styles/app.css`)
- Add `@import` for Cormorant Garamond
- Add `--gold`, `--gold-dim`, `--gold-text` CSS variables to `:root`
- Remove these duplicate declarations from `src/styles/landing.css` (use the global vars instead)

### Step 2 — Per-page updates (CSS + JSX where needed)

Each page gets:
- Hero/display title: `font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 300;`
- Gold elements: replace hardcoded amber/orange colors with `var(--gold)`, `var(--gold-dim)`, `var(--gold-text)`

**Files to touch:**
- `src/styles/quiz.css` + `src/views/QuizPage.jsx` (or quiz components)
- `src/styles/reading-plans.css` + reading plans component
- `src/styles/leaderboard.css` + leaderboard component
- `src/styles/forum.css` + forum component
- `src/styles/blog.css` + blog component
- `src/styles/profile.css` + profile component
- `src/styles/about.css` + about component
- `src/styles/auth.css` + auth component
- `src/components/UpgradePrompt.jsx` + its CSS
- `src/styles/study-notes.css` + study notes component
- Streak display component (wherever streak count renders)
- Quiz badge component

### Step 3 — Verify no regressions
- Confirm existing landing.css and home.css still look correct after removing local variable definitions

## Constraints
- Body copy and UI labels stay Plus Jakarta Sans — only hero/display titles get the serif treatment
- Gold replaces orange/amber hardcodes only — purple primary brand color is untouched
- No new dependencies — Google Fonts already loaded via landing.css; moving to app.css just consolidates
