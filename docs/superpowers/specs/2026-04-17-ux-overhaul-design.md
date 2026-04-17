# UX Overhaul Design — 2026-04-17

## Scope

Full UX improvement across all six areas: Navigation & IA, Home Feed, Onboarding, Tracker, Study Topics, and Mobile. Delivered as three prioritised sprints.

---

## Sprint 1 — Navigation & Information Architecture

### Problem
- Desktop sidebar has 13+ nav items with flat, confusing groupings
- Study Topics is missing from the sidebar entirely
- Mobile tab bar (5 items: Home, Bible, Messages, Friends, Profile) hides Study, Quiz, and Forum
- Two quiz items buried under a "Shortcuts" section

### Sidebar restructure (desktop — `AppLayout.tsx`)

Reduce from 13 items to 8 visible items, grouped into three sections:

**Core** (always visible, top 4)
- Home
- Bible Tracker
- Study ← single nav item → navigates to `studyTopics` page; a small muted sub-label "Topics · Books · Notes · Plans" sits below the label for discoverability only, not a collapsible group
- Practice ← single nav item → navigates to `quiz` page; sub-label "Quiz · Advanced · Meeting Prep"

**Community**
- Forum
- Friends (with pending badge)
- Messages (with unread badge)

**Explore**
- Blog & Videos (merged)
- Leaderboard

### Mobile tab bar (`MobileTabBar.tsx`)

Replace current 5 tabs (Home / Bible / Messages / Friends / Profile) with:

| Tab | Icon | Notes |
|-----|------|-------|
| Home | house | unchanged |
| Bible | open book | unchanged |
| Study | stacked books | NEW — replaces Messages |
| Quiz | question circle | NEW — replaces Friends |
| Me | profile | replaces Profile; contains Messages, Friends, Forum, Blog |

The "Me" tab navigates to the existing Profile page. Messages and Friends remain reachable via the Profile page's existing nav links. The "Me" tab shows a combined badge count (unread messages + pending friend requests) so users know when attention is needed.

---

## Sprint 2 — Home Feed & Onboarding

### Home Feed (`HomePage.tsx`)

**Current problem:** 8+ competing sections with no hierarchy. New users see an empty feed and rotating promo banners with no clear starting point.

**New layout (top → bottom):**

1. **Today card** (above the fold, always)
   - Daily verse with reference
   - Active reading plan progress bar + % complete
   - Current streak pill (🔥 N-day streak)
   - "Next chapter: [Book] [N] →" link
   - For new users with no plan: shows "Start a reading plan →" CTA instead

2. **Quick actions row** (3 contextual buttons)
   - Continue Reading (primary/highlighted)
   - Today's Quiz
   - Meeting Prep
   - Buttons change based on time of day or completion state (e.g. "Quiz done ✓" becomes greyed)

3. **Community feed** (everything below)
   - Compose box first
   - Friends-first ordering, then public posts
   - Empty state: "Follow some publishers to see their reading updates" with suggested users
   - Existing post cards, likes, replies — unchanged

4. **Right panel** (desktop only, existing)
   - Daily Verse widget → moved into Today card; remove from right panel
   - Spotlight video, Forum threads, Who's online → remain as collapsible widgets

### Onboarding (`OnboardingModal.tsx`)

Replace 3-step flow (intent → chapter goal → notifications) with 4-step flow:

**Step 1 — Intent** (unchanged concept, 3 choices)
- Read the Bible (track all 66 books)
- Study deeper (topics, quizzes, notes)
- Connect with others (community & forum)
- Selection personalises the home screen Quick Actions

**Step 2 — Reading plan picker** (replaces raw chapter-goal number)
- 1-Year plan (3–4 chapters/day) — marked as Popular
- 2-Year plan (1–2 chapters/day)
- Chronological plan
- "No plan — I'll read freely"

**Step 3 — Daily goal with presets** (replaces +/− only stepper)
- Keep +/− stepper
- Add three preset chips: Easy (1) / Balanced (3) / Fast (5)
- Pre-selects Balanced

**Step 4 — First action CTA** (replaces notification prompt)
- "You're all set!" confirmation
- Primary CTA: "Mark Genesis 1 as read →" (navigates into tracker with book 0 open)
- Secondary: "Explore the app first" (dismisses modal)
- Push notification prompt deferred to day 3 (after user is already engaged)

---

## Sprint 3 — Tracker & Study Polish

### Tracker header (`ChecklistPage.tsx`)

Add a new hero section above the existing tabs:

**Progress donut**
- Circular progress ring showing overall % of all 1,189 chapters read
- Center: large % number
- Legend: "N chapters read · N remaining"

**Continue Reading button**
- Always visible below the donut
- Shows: book name + chapter number + plan name
- Tapping opens that chapter directly (existing deep-link mechanism)
- If no active plan: shows "Start a reading plan →"

**Filter chips** (between tabs and book grid)
- In Progress / Not Started / Completed
- Default: All (no filter)
- Completed filter hides finished books to reduce visual noise

**Study → link on each BookCard**
- Small pill button on the right of each book card: "Study →"
- Navigates to `bookDetail` page for that book (the BookDetailPage we built)
- Solves Study Topics discoverability from within the tracker

### Mobile tracker
- Today's chapter sticky card at the very top of the tracker (same as Today card on home, scoped to tracker)
- Chapter pills: minimum 24×24px touch target (up from ~18px)
- Tracker accessible from bottom tab bar (Bible tab)

### Study Topics page
- No structural changes needed — the BookDetailPage is already well-designed
- Discoverability solved by: (a) sidebar top-4 placement, (b) mobile tab, (c) Study → in tracker

---

## Files affected

| Sprint | Files |
|--------|-------|
| 1 | `src/components/AppLayout.tsx`, `src/components/MobileTabBar.tsx`, `src/styles/app-layout.css` |
| 2 | `src/views/HomePage.tsx`, `src/styles/home.css`, `src/components/OnboardingModal.tsx`, `src/styles/onboarding.css` |
| 3 | `src/views/ChecklistPage.tsx`, `src/components/BookCard.tsx`, `src/styles/checklist.css` (or equivalent) |

---

## Out of scope

- Push notification redesign (deferred to post-engagement)
- Right panel widget order on desktop (existing behaviour preserved)
- Study Topics content (already shipped)
- Reading plan templates (existing data unchanged)
