# Bible Book Introductions

**Date:** 2026-04-02  
**Status:** Approved  
**Premium gate:** Full content is premium-only. Free users see a blurred preview + upgrade CTA.

---

## Overview

66 short premium articles — one per Bible book — covering writer, time period, key theme, notable passages, and a brief summary. Accessed from the reading tracker when opening a book. Adds encyclopedic depth to the reading experience and strengthens the perceived value of premium.

---

## Data Storage

Static JSON file: `src/data/book-intros.js`

No DB table needed. Content is read-only and never user-generated. Static data loads with the bundle and avoids an extra network request.

**Structure per entry:**
```js
{
  bookId: 1,              // matches existing book ID system
  bookName: 'Genesis',
  writer: 'Moses',
  timePeriod: 'c. 1513 BCE',
  keyTheme: 'The beginning of God\'s purpose for mankind and the earth.',
  notablePassages: [
    { ref: 'Genesis 1:1',   note: 'The opening declaration of God as Creator.' },
    { ref: 'Genesis 3:15',  note: 'The first prophecy — the seed that would crush the serpent.' },
    { ref: 'Genesis 22:18', note: 'Abraham\'s faith and the promise of blessing through his seed.' },
  ],
  summary: 'Genesis covers creation, the fall, the global flood, and the patriarchs — Abraham, Isaac, Jacob, and Joseph. It establishes God\'s sovereignty, his standards for humans, and the beginning of his purpose to restore what was lost.',
}
```

All 66 entries are authored in English at launch. Translations added in a later sprint.

**Target word count per entry:** ~120–160 words (short enough to read in 30 seconds).

---

## Access Points

### 1. Reading Tracker — Book Header

When a user taps to open a book in the reading tracker, the chapter grid is rendered in `src/components/BookCard.jsx`. The book header area inside `BookCard` gains a "Book Info ✦" button.

**Premium users:** Tapping opens a bottom-sheet panel with the full intro content.  
**Free users:** Tapping opens the panel with content blurred + "✦ Unlock with Premium" CTA.

**Panel layout:**
- Book name as heading
- Row: Writer · Time Period
- Key Theme (italic)
- Notable Passages: 3 rows, each with reference (bold) + note
- Summary paragraph
- "Close" button

### 2. Study Topics Page

The Study Topics section (currently 8 static guides) gains a new "Bible Books" category tab. Each of the 66 book intros appears as a topic card. This doubles the content depth of Study Topics without any new infra.

**Card design:** Same as existing study topic cards — book name as title, key theme as subtitle, ✦ lock for free users.

---

## Content Authoring

All 66 entries need to be written. This is content work, not code. Suggested approach:

1. Write a template/style guide for consistency
2. Author all 66 entries in a spreadsheet or JSON directly
3. Commit to `src/data/book-intros.js` in one content commit

The code implementation is minimal — the data file is the bulk of the work.

**Quality bar:** Accurate, concise, and consistent with NWT translation context (e.g., use JW publication dates where available for writer/time period).

---

## Implementation Notes

- No new hooks needed — `book-intros.js` is imported directly where used
- The bottom-sheet panel component can reuse the existing modal/sheet pattern from the upgrade modal
- Premium gate check uses the existing `useIsPremium()` hook pattern
- The "Book Info" button only appears for books that have an intro entry (all 66 at launch)

---

## Non-Goals
- No user comments or ratings on intros
- No per-chapter notes (only per-book in this sprint)
- No translations at launch (English only)
- No DB-backed content management — static file only
