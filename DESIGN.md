# JW Study — Design System

Captured from the live codebase 2026-04-26 after the impeccable audit pass. PRODUCT.md is the brand source of truth; this file documents the implementation choices.

## Color

### Brand violet scale (canonical)

The single brand purple is `--violet-600` (`#7C3AED`). All other purples are derived steps from the same scale, exposed as tokens in [src/styles/app.css](src/styles/app.css):

| Token | Hex | Use |
|---|---|---|
| `--violet-50`  | `#f5f3ff` | Lightest tint, accent surfaces, hover bg |
| `--violet-100` | `#ede9fe` | Soft tint, light-mode card bg |
| `--violet-200` | `#ddd6fe` | Subtle accents, borders |
| `--violet-300` | `#c4b5fd` | Light text on dark bg, light borders |
| `--violet-400` | `#a78bfa` | Dark-mode primary text/icon, light decoration |
| `--violet-500` | `#8b5cf6` | Mid-step, sparingly |
| `--violet-600` | `#7C3AED` | **Canonical brand. Primary CTAs, links, focus rings.** |
| `--violet-700` | `#6d28d9` | Hover/pressed state of 600 |
| `--violet-800` | `#5b21b6` | Deep accent, headings on white |
| `--violet-900` | `#4c1d95` | Deepest brand color |
| `--violet-950` | `#2e1065` | Backgrounds in dark theme |

### Legacy token aliases

These names predate the violet scale; they're kept as aliases so existing code keeps working. New code should reference `--violet-*` directly.

| Legacy alias | Maps to (light/dark) | Notes |
|---|---|---|
| `--teal` | `--violet-600` / `--violet-400` | Misleading name; actually violet. Rename pending. |
| `--teal-dark` | `--violet-700` / `--violet-600` | |
| `--teal-darker` | `--violet-800` | |
| `--teal-light` | `#E5E5EA` / `#3A3260` | **Gray-light, NOT purple.** Misleading name. |
| `--teal-mid` | `#C7C7CC` / `#4a3d7a` | |
| `--teal-soft` | `#F2F2F7` / `#231e38` | Page bg tint |
| `--accent` | `--violet-600` / `--violet-400` | |
| `--accent-light` | `--violet-50` / `#3A3A3C` | |

### Achievement gold

Reserved for streaks, quiz milestones, reading-plan completions. **Never on primary CTAs, card borders, or generic chrome.**

| Token | Hex | Use |
|---|---|---|
| `--gold` | `#f59e0b` | Achievement badges, streak numbers |
| `--gold-dim` | `rgba(245, 158, 11, 0.15)` | Background tint |
| `--gold-text` | `#fde68a` | Text on dark bg |

### Status

| Token | Hex | Use |
|---|---|---|
| `--badge-red` | `#e03c3c` | Unread/error badges only |

### Color rules

- **Never use `#000` or `#fff`** — all neutrals are tinted toward the brand. Use `--text-primary`, `--bg`, `--card-bg` etc.
- **No gradient text** (banned). Solid color + weight contrast for emphasis.
- **No side-stripe borders >1px** (banned). Use background tint, leading icon, or full border.
- **Color strategy: Restrained.** Tinted neutrals + violet-600 as ≤10% of any surface. Drenched / saturated brand color only for hero moments (Auth atmosphere orbs, e.g.).

## Typography

- **Family:** Plus Jakarta Sans Variable (single family, body + display).
- **Body:** 14–16px, line-height 1.55–1.75.
- **Heading scale:** ratio ≥1.25 between steps. Weight contrast carries hierarchy alongside size.
- **Tabular numerals** (`font-variant-numeric: tabular-nums`) on all KPI/streak/count displays.
- **Body line length** capped at 65–75ch for prose (blog, lessons).

## Spacing

4px grid. Tokens live as `--sp-1` (4px) through `--sp-12` (48px).

- Page padding: `px-4 sm:px-6 lg:px-8` on full-width layouts.
- Card padding: usually `--sp-4` to `--sp-5` (16–20px).
- Vary spacing for rhythm — same padding everywhere is monotony.

## Border radius

Tight by default. Centralized in [src/styles/app.css](src/styles/app.css):

| Token | Value | Use |
|---|---|---|
| `--radius-xs` | 3px | Inline pills, tiny chips |
| `--radius-sm` | 4px | Form fields, small buttons |
| `--radius` / `--radius-md` | **6px (default)** | Cards, modals, most surfaces |
| `--radius-lg` | 8px | Larger cards, dialogs |
| `--radius-xl` | 12px | Heroes |
| `--radius-2xl` | 16px | Rare |
| `--radius-pill` | 999px | Pills, fully-round buttons |

**No pill-radius cards.** No "hero blob" extreme radii. No nested cards.

## Motion

- **Easing:** `--ease-out` (`cubic-bezier(0, 0, 0.2, 1)`), `--ease-spring` (`cubic-bezier(0.22, 1, 0.36, 1)`), `--ease-in-out` (`cubic-bezier(0.4, 0, 0.2, 1)`).
- **No bounce, no elastic** (banned).
- **Don't animate layout properties** (width/height/top/left). Use transform + opacity only.
- **Durations:** `--dur-fast` 120ms, `--dur-base` 150ms, `--dur-slow` 320ms.

## Elevation

Neutral shadows, no purple tint:

| Token | Use |
|---|---|
| `--shadow-xs` | Subtle hover lift |
| `--shadow` | Default card shadow |
| `--shadow-md` | Elevated cards, dropdowns |
| `--shadow-lg` | Modals, popovers |
| `--shadow-xl` | Drawers |

## Components

### Cards

- Default `--card-bg` background, 1px `--border`, `--radius` (6px).
- No gradient text inside.
- No side-stripe borders.
- No nested cards.

### Buttons

- **Primary:** `--violet-600` background, white text, `--radius` (6px). No gradient overlay; depth via subtle inner highlight + shadow only.
- **Secondary:** `--accent-light` background, `--violet-600` text, 1px border.
- **Ghost:** transparent, `--text-muted` text, hover bg.
- **Min touch target:** 44×44px on mobile (WCAG 2.5.5).
- **Danger:** `#dc2626` text on transparent, full red bg only inside confirmation dialogs.

### Inputs

- `--bg` background, 1.5px `--border`, `--radius-sm` (4px).
- Focus: `--violet-600` border + 3px violet/15% glow.
- Mobile font-size **must be ≥16px** to prevent iOS zoom on focus.

### Modals / drawers

- Always use `createPortal(content, document.body)` to escape ancestor `transform` contexts (Android Chrome breaks otherwise).
- Backdrop: `rgba(0,0,0,0.45)` + optional `backdrop-filter: blur(2-6px)`.

### Charts (recharts)

- Tooltip uses `useChartTheme()` hook + `<RichTooltip />` from [src/components/charts](src/components/charts/).
- No gradient text on KPIs — solid violet-300 (dark) / violet-700 (light).
- 2-3 stop area gradients are fine (background fill, not text).

## Theme

Light is the default. Dark mode supported via `[data-theme="dark"]` on `<html>`.

- Theme variable lookups happen via CSS custom properties — never hard-code colors that need to switch.
- Test contrast in both themes. WCAG AA minimum.

## Anti-references (what NOT to look like)

From PRODUCT.md, repeated here so it's enforced:

- ❌ Generic AI SaaS landing — gradient hero text, glassmorphism cards, hero-metric stat blocks, identical 3-up icon-card grids
- ❌ Church website — stained glass, parchment, script fonts, italic display, crosses
- ❌ Academic tool — serif body, library/research vibe, neutral grayscale
- ❌ Duolingo / streak-bait — mascots, exclamation copy, fire emojis as primary chrome
- ❌ Trinitarian / cross-denominational visuals

## Copy

- **No em dashes.** Use commas, colons, semicolons, periods, or parentheses.
- Reserve "study journey" framing for jw.org.
- App CTAs use tool-utility language ("track your reading," "save a note").
- When a CTA could route either way, jw.org gets top billing.

## File layout

- **Tailwind for new components.** Don't create new `.css` files.
- **Existing CSS files** keep using their existing patterns. Migration to Tailwind is in progress, not completed.
- **One purple source.** All components reference `--violet-*` tokens or legacy aliases. Hex literals for purple are drift — fix them as you touch the file.

## Operational

- **Vercel:** project `biblechecklist`, canonical domain `jwstudy.org`. Deploy: `git push origin main` → auto-deploy. Rolling Releases ON (10% → 50% → 100% with auto-rollback).
- **Observability Plus:** ON. Anomaly alerts configured.
- **Supabase:** project `yudyhigvqaodnoqwwtns`. Always check `src/types/supabase.ts` as ground truth.
- **No subscriptions.** Free for everyone, optional donations only.
