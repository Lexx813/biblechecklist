# UI Refresh — Full Design Spec
**Date:** 2026-04-17  
**Scope:** Navigation restructure + Home dashboard + Community Hub + Core study improvements  
**Approach:** Full Refresh (Approach 2) — all changes shipped together

---

## 1. Goals

- Make daily study habits (Bible reading, meeting prep) immediately visible on open
- Surface community features (forum, messages, friends) as a first-class destination instead of scattered across Profile
- Give the Bible tab a progress-oriented header so users see momentum at a glance
- Remove the rotating feature banners and "everything inline" home page pattern in favour of a focused dashboard

---

## 2. Navigation — New Tab Bar

### New tabs (replaces current Home · Bible · Study · Quiz · Me)

| Tab | Key | What it covers |
|-----|-----|---------------|
| Home | `home` | Dashboard (see §3) |
| Bible | `main` | Checklist + progress header + study tools strip |
| Prep | `meetingPrep` | Meeting Prep page directly |
| Community | `community` | New Community Hub page (see §4) |
| Me | `profile` | Profile / Settings |

### Badge logic changes

| Badge | Old location | New location |
|-------|-------------|-------------|
| Unread messages | Profile tab | Community tab (via Community Hub Messages tile) |
| Friend requests | Profile tab (combined) | Me tab only |
| Combined unread | Profile tab | Split: messages → Community, requests → Me |

### TAB_ACTIVE_MAP updates

```ts
const TAB_ACTIVE_MAP: Record<string, string> = {
  // Community tab lights up for all social/messaging pages
  messages:         "community",
  friends:          "community",
  friendRequests:   "profile",   // friend requests stay on Me/profile tab
  groups:           "community",
  leaderboard:      "community",
  feed:             "community",
  forum:            "community",
  forumThread:      "community",
  trivia:           "community",
  // Bible tab lights up for all study content
  studyTopics:      "main",
  studyTopicDetail: "main",
  bookDetail:       "main",
  studyNotes:       "main",
  readingPlans:     "main",
  readingHistory:   "main",
  bookmarks:        "main",
  quiz:             "main",
  advancedQuiz:     "main",
  familyQuiz:       "main",
  // Prep tab
  meetingPrep:      "meetingPrep",
  // Me/profile tab
  settings:         "profile",
  publicProfile:    "profile",
};
```

### Files to change
- `src/components/MobileTabBar.tsx` — new TAB_ITEMS array, new TAB_ACTIVE_MAP, split badge logic

---

## 3. Home Page — Focused Dashboard

The current home page renders almost all features inline (quiz, leaderboard, blog, forum, reading plans, etc.). The new home page is a focused daily driver. All inline panel rendering moves to its respective tab.

### Layout (top to bottom)

1. **Greeting header** — "Good morning, [name]" + date. Streak badge (flame gradient) top-right if streak > 0.

2. **Daily Verse** — compact left-bordered callout (3 lines max). Not a full hero card. Tap to expand.

3. **Two-up cards** (side by side, equal width)
   - **Your Study card** — current book name, chapter range, OT/NT progress bar (single book), chapter count + %, "Continue →" button navigating to `main` (checklist, scrolled to current book).
   - **This Week card** — Meeting Prep week label (e.g. "Apr 20–26"), CLAM/WT checkboxes showing current completion state, "Open Prep →" button navigating to `meetingPrep`.

4. **Friend Activity strip** — card showing 2–3 most recent friend activity items (name + action + timestamp). "See all →" navigates to `community`. If no friends yet, shows "Add friends to see their progress →" with a link to `friends`.

5. **Quick Actions grid** — 3×2 grid of icon+label tiles:
   - Quiz · Study Notes · Reading Plans
   - Leaderboard · Videos · Study Topics

### What moves off the home page

| Content | Moves to |
|---------|----------|
| Blog feed | Removed from home page — accessible via quick actions grid (no tile by default; add if desired) |
| Video spotlight | Videos page (accessible from quick actions) |
| Rotating feature banners | Remove — replaced by quick actions grid |
| Inline quiz/leaderboard/forum/etc. | Their respective tabs |
| Online members widget | Community Hub header |
| Full activity feed | Community Hub → "See all" |

### Data requirements
- `useReadingStreak(userId)` — streak count (already exists)
- `usePrepForWeek(userId, currentWeek)` — CLAM/WT completion state for this week (already exists)
- `useMeetingWeek(currentWeek)` — week label (already exists)
- `useFriendPosts(userId, limit=3)` — friend activity strip (already exists)
- Current book/chapter: derive from chapter_reads — use the book_id of the row with the most recent `created_at`. Already available via existing progress query in ChecklistPage.

### Files to change
- `src/views/HomePage.tsx` — major rewrite; remove INLINE_PANELS, NAV_ITEMS, NAV_ITEMS_2, NAV_SHORTCUTS, BANNER_ROTATIONS; add dashboard layout
- `src/styles/home.css` — new dashboard CSS classes

---

## 4. Community Hub — New Page

A new landing page rendered when the user taps the Community tab. Replaces the current pattern where social features are scattered across the sidebar.

### Route
- Key: `community` (new page key)
- File: `src/views/community/CommunityPage.tsx` (already exists — repurpose or replace its current content)

### Layout

1. **Header** — "Community" title + online member count pill ("● 24 online now") using existing `useOnlineMembers` hook.

2. **2×2 tile grid**

   | Tile | Badge | Navigates to |
   |------|-------|-------------|
   | Forum 📋 | "N new posts" (count from `useTopThreads`) | `forum` |
   | Messages 💬 | Unread count (red badge) from `useUnreadMessageCount` | `messages` |
   | Groups 👥 | Active group count | `groups` |
   | Leaderboard 🏆 | User's current rank ("#{n} this week") | `leaderboard` |

3. **Friends row** — horizontal scroll of friend avatars with online green dots. "+ Add friends" placeholder at end. Tapping avatar navigates to `publicProfile`. "Manage →" link to `friends`.

4. **Recent Activity strip** — 3 most recent items from `useFriendPosts` + `usePublicFeed`. Each item: avatar, name, action text, timestamp. "See all →" navigates to `feed`.

### Files to change
- `src/views/community/CommunityPage.tsx` — full rewrite of this page
- `src/styles/community.css` — new hub layout styles

---

## 5. Bible Tab — Progress Header & Study Tools Strip

Added above the existing 66-book grid. The grid itself is unchanged.

### New header (above book grid)

1. **Progress hero card**
   - Overall Bible completion % (large number, bold)
   - OT progress bar + % 
   - NT progress bar + %
   - Reading streak badge (top-right, consistent with home page styling)
   - Data: derive from existing chapter_reads query

2. **Active reading plan widget** (only shown if user has an active plan)
   - Plan name + today's assignment + day N of M
   - Thin progress bar
   - "Open" button → `readingPlans`
   - Data: `useMyPlans()` (already exists in `src/hooks/useReadingPlans.ts`) — filter for the first plan where `paused_at` is null. No new hook needed.

3. **Study tools strip** — 4 equal tiles in a row:
   - Notes 📝 → `studyNotes`
   - Topics 📚 → `studyTopics`
   - Bookmarks 🔖 → `bookmarks`
   - History 📊 → `readingHistory` (currently `reading` key)

4. **"66 Books" section divider** — subtle rule with OT·NT filter toggle

### Book card micro-improvement
- Add a **3px bottom progress bar** to each collapsed book card (already has `mini-bar` class — use it as a bottom border instead of the current inline bar placement). Completed books show a full-width `#c4b5fd` bar.

### Files to change
- `src/views/ChecklistPage.tsx` — add header section above book grid
- `src/styles/app.css` — progress hero card + study tools strip styles; book card bottom-bar tweak

---

## 6. Meeting Prep — Header Improvements

Current issues: premium label renders as raw i18n key (already fixed in a prior commit); streak and week info are not visually prominent.

### New header card
- Title "Meeting Prep" inline with `✦ Premium` badge (gradient pill)
- Week label as subtitle
- Streak badge (consistent with home/Bible styling)  
- CLAM progress mini-bar + "3/5 parts" label
- WT progress mini-bar + "0/20 paragraphs" label

Both progress indicators are derived from existing `prep` data from `usePrepForWeek`.

### Files to change
- `src/views/meetingprep/MeetingPrepPage.tsx` — replace header section (lines ~422–436)
- `src/styles/meeting-prep.css` — new `.mp-header-card` styles

### Completed part styling
- Parts with `checked[partNum] === true` get: green-tinted background (`#22c55e1a`) + green border + strikethrough text
- Replaces current plain checked state

---

## 7. What Is NOT Changing

- The 66-book grid layout and interaction (expand/collapse, chapter toggles)
- All existing API/hooks — no data model changes
- Forum, Messages, Groups, Leaderboard page internals
- Profile/Settings page
- Quiz pages (accessible from Bible tab study tools or home quick actions)
- Blog page (accessible from home quick actions or standalone URL)
- AI Study Bubble (stays on all pages)
- Premium paywall logic
- i18n keys (new keys will be added for new UI strings only)

---

## 8. New i18n Keys Required

```json
{
  "home": {
    "greeting": "Good morning, {{name}}",
    "greetingAfternoon": "Good afternoon, {{name}}",
    "greetingEvening": "Good evening, {{name}}",
    "yourStudy": "Your Study",
    "thisWeek": "This Week",
    "friendActivity": "Friend Activity",
    "seeAll": "See all →",
    "quickActions": "Quick Actions",
    "noFriendsYet": "Add friends to see their progress →",
    "continueReading": "Continue →",
    "openPrep": "Open Prep →"
  },
  "community": {
    "title": "Community",
    "onlineNow": "{{count}} online now",
    "recentActivity": "Recent Activity",
    "manage": "Manage →",
    "newPosts": "{{count}} new posts"
  },
  "checklist": {
    "bibleProgress": "Bible Progress",
    "oldTestament": "Old Testament",
    "newTestament": "New Testament",
    "studyTools": "Study Tools",
    "66books": "66 Books"
  }
}
```

All keys added to all 8 locale files (en, es, pt, fr, tl, zh, ko, ja).

---

## 9. File Change Summary

| File | Change type |
|------|------------|
| `src/components/MobileTabBar.tsx` | Rewrite TAB_ITEMS + TAB_ACTIVE_MAP + badge logic |
| `src/views/HomePage.tsx` | Major rewrite — remove inline panels, add dashboard layout |
| `src/styles/home.css` | New dashboard CSS |
| `src/views/community/CommunityPage.tsx` | Full rewrite — new hub layout |
| `src/styles/community.css` | New hub CSS |
| `src/views/ChecklistPage.tsx` | Add progress header above book grid |
| `src/styles/app.css` | Progress hero + study tools strip + book card bottom-bar |
| `src/views/meetingprep/MeetingPrepPage.tsx` | New header card + completed part styling |
| `src/styles/meeting-prep.css` | Header card + completed part styles |
| `public/locales/*/translation.json` | New i18n keys (8 files) |
