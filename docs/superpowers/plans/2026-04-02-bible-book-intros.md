# Bible Book Introductions — Premium Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium gate to the existing Bible book info panel in BookCard, add `notablePassages` content to the 66-entry `bookInfo.js` data file, and add a "Bible Books" category tab to Study Topics.

**Architecture:** `src/data/bookInfo.js` already exists with all 66 entries (`author`, `date`, `theme`, `keyVerses`, `summary`, `questions`). `BookCard.jsx` already renders an info panel. The work is: (1) add `notablePassages: [{ref, note}]` to each entry (content work), (2) premium-gate the panel display in `BookCard.jsx` — free users see a blurred preview with an upgrade CTA, (3) add a "Bible Books" tab to `StudyTopicsPage.jsx` that lists each book as a card. No DB changes needed.

**Tech Stack:** Next.js 15, React 19, vanilla CSS, `useSubscription` hook (covers active/trialing/gifted ✅)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/bookInfo.js` | Modify | Add `notablePassages: [{ref, note}]` array to all 66 entries |
| `src/components/BookCard.jsx` | Modify | Premium gate info panel; render notablePassages section |
| `src/views/studytopics/StudyTopicsPage.jsx` | Modify | Add "Bible Books" tab that lists 66 book cards |
| `src/styles/book-card.css` (or `src/styles/reading.css`) | Modify | Blur/gate styles for locked info panel |

---

## Task 1: Add notablePassages to bookInfo.js

**Files:**
- Modify: `src/data/bookInfo.js`

The existing `keyVerses` field is an array of verse reference strings. The spec requires `notablePassages` with `{ref, note}` pairs. We add `notablePassages` alongside the existing `keyVerses` (keeping `keyVerses` for the links that BookCard already renders).

This is **content work** — 66 entries each needing 3 passage objects.

- [ ] **Step 1: Add notablePassages to first 10 entries as a template**

For each entry in `bookInfo.js`, add a `notablePassages` array after `keyVerses`. Example structure for Genesis (index 0):

```js
{
  author: "Moses",
  date: "c. 1440 BC",
  theme: "Origins & Jehovah's Purpose",
  keyVerses: ["Gen 1:1", "Gen 12:1–3", "Gen 50:20"],
  notablePassages: [
    { ref: "Genesis 1:1", note: "The opening declaration of God as Creator of the heavens and earth." },
    { ref: "Genesis 3:15", note: "The first prophecy — the seed that would crush the serpent." },
    { ref: "Genesis 22:18", note: "Abraham's faith and the promise of blessing through his seed." },
  ],
  summary: "Genesis records...",
  questions: [...],
},
```

- [ ] **Step 2: Complete all 66 entries**

Add `notablePassages` to every entry. Suggested refs derive from the existing `keyVerses` array (already populated for all 66 books). For each `keyVerse`, add a one-sentence `note` describing its significance.

Here are entries 1-10 as a concrete starting point. Complete entries 11-66 following the same pattern:

```js
// Index 0: Genesis (keyVerses: ["Gen 1:1", "Gen 12:1–3", "Gen 50:20"])
notablePassages: [
  { ref: "Genesis 1:1", note: "The opening declaration establishing Jehovah as Creator." },
  { ref: "Genesis 12:1–3", note: "Jehovah's covenant with Abraham — the foundation of the promised seed." },
  { ref: "Genesis 50:20", note: "Joseph's declaration that Jehovah turns adversity into good." },
],

// Index 1: Exodus (keyVerses: ["Ex 3:14", "Ex 6:3", "Ex 20:2–3"])
notablePassages: [
  { ref: "Exodus 3:14", note: "Jehovah reveals his name — 'I Will Become What I Choose to Become.'" },
  { ref: "Exodus 6:3", note: "Jehovah confirms his personal name to Moses." },
  { ref: "Exodus 20:2–3", note: "The first commandment: exclusive devotion to Jehovah." },
],

// Index 2: Leviticus (keyVerses: ["Lev 19:2", "Lev 17:11"])
notablePassages: [
  { ref: "Leviticus 19:2", note: "Jehovah's call to holiness: 'Be holy, for I am holy.'" },
  { ref: "Leviticus 17:11", note: "The life is in the blood — basis for the blood atonement laws." },
  { ref: "Leviticus 16:29–30", note: "The annual Day of Atonement foreshadowing Christ's sacrifice." },
],
```

Continue this pattern for all remaining 63 books. Each `note` should be 1–2 short sentences directly tied to the verse's theological significance.

- [ ] **Step 3: Build to verify no JS syntax errors**

```bash
npm run build
# Expected: no errors. If errors appear, find the malformed entry by process of elimination.
```

- [ ] **Step 4: Commit**

```bash
git add src/data/bookInfo.js
git commit -m "feat: add notablePassages to all 66 Bible book info entries"
```

---

## Task 2: Premium Gate BookCard Info Panel

**Files:**
- Modify: `src/components/BookCard.jsx`
- Modify: existing book-card / reading CSS file (find with: `grep -r "book-info-panel" src/styles`)

- [ ] **Step 1: Find the CSS file for book-info-panel**

```bash
grep -r "book-info-panel" src/styles --include="*.css" -l
```

Note the filename. It's likely `src/styles/reading.css` or `src/styles/book-card.css`.

- [ ] **Step 2: Add premium gate styles to that CSS file**

```css
/* Book info panel — premium gate */
.book-info-panel--locked {
  position: relative;
  overflow: hidden;
}

.book-info-panel--locked .book-info-summary,
.book-info-panel--locked .book-info-meta-row,
.book-info-panel--locked .book-info-verses,
.book-info-panel--locked .book-info-questions,
.book-info-panel--locked .book-info-notable {
  filter: blur(4px);
  user-select: none;
  pointer-events: none;
}

.book-info-gate {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(var(--card-bg-rgb, 255,255,255), 0.15);
  backdrop-filter: blur(1px);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.book-info-gate-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gold);
  display: flex;
  align-items: center;
  gap: 5px;
}

.book-info-gate-cta {
  padding: 8px 16px;
  border-radius: 10px;
  background: var(--gold);
  color: #000;
  font-size: 0.82rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

/* Notable passages section */
.book-info-notable {
  margin-top: 12px;
}

.book-info-notable-list {
  list-style: none;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.book-info-notable-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.book-info-notable-ref {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent);
}

.book-info-notable-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
```

- [ ] **Step 3: Add useSubscription to BookCard**

In `src/components/BookCard.jsx`, add the import:
```js
import { useSubscription } from "../hooks/useSubscription";
```

Inside the `BookCard` component, add:
```js
// BookCard receives a `userId` prop (add to prop list if not already there)
const { isPremium } = useSubscription(userId);
```

Check whether `userId` is already passed to `BookCard`. If not, it needs to be added as a prop and passed from wherever `BookCard` is rendered (likely `src/views/home/HomePage.jsx` or similar reading tracker page). Pass `user?.id` down.

- [ ] **Step 4: Update the info panel render to add premium gate**

Find the `{showInfo && info && (` block in `BookCard.jsx`. Update it:

```jsx
{showInfo && info && (
  <div className={`book-info-panel${!isPremium ? " book-info-panel--locked" : ""}`}>
    {/* Existing content — summary, meta-row, keyVerses, questions */}
    <p className="book-info-summary">{summary}</p>
    <div className="book-info-meta-row">
      {info.author && (
        <div className="book-info-meta-item">
          <span className="book-info-meta-label">{t("book.infoAuthor")}</span>
          <span className="book-info-meta-value">{info.author}</span>
        </div>
      )}
      {info.date && (
        <div className="book-info-meta-item">
          <span className="book-info-meta-label">{t("book.infoWritten")}</span>
          <span className="book-info-meta-value">{info.date}</span>
        </div>
      )}
      {theme && (
        <div className="book-info-meta-item">
          <span className="book-info-meta-label">{t("book.infoTheme")}</span>
          <span className="book-info-meta-value">{theme}</span>
        </div>
      )}
    </div>

    {/* Notable Passages — new section */}
    {info.notablePassages?.length > 0 && (
      <div className="book-info-notable">
        <span className="book-info-meta-label">{t("book.infoNotablePassages", "Notable Passages")}</span>
        <ul className="book-info-notable-list">
          {info.notablePassages.map((p, i) => (
            <li key={i} className="book-info-notable-item">
              <span className="book-info-notable-ref">{p.ref}</span>
              <span className="book-info-notable-note">{p.note}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {/* Key verse links (existing) */}
    {info.keyVerses?.length > 0 && (
      <div className="book-info-verses">
        <span className="book-info-meta-label">{t("book.infoKeyVerses")}</span>
        <div className="book-info-verse-pills">
          {info.keyVerses.map(v => {
            const url = wolRefUrl(v, lang);
            return url
              ? <a key={v} className="book-info-verse-pill" href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{v} ↗</a>
              : <span key={v} className="book-info-verse-pill">{v}</span>;
          })}
        </div>
      </div>
    )}

    {/* Study questions (existing) */}
    {Array.isArray(questions) && questions.length > 0 && (
      <div className="book-info-questions">
        <span className="book-info-meta-label">{t("book.infoStudyQuestions", "Study Questions")}</span>
        <ol className="book-info-question-list">
          {questions.map((q, i) => (
            <li key={i} className="book-info-question-item">{q}</li>
          ))}
        </ol>
      </div>
    )}

    {/* Premium gate overlay — shown on top of blurred content for free users */}
    {!isPremium && (
      <div className="book-info-gate">
        <span className="book-info-gate-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          ✦ Premium Feature
        </span>
        <button className="book-info-gate-cta" onClick={(e) => { e.stopPropagation(); onUpgrade?.(); }}>
          Unlock with Premium
        </button>
      </div>
    )}
  </div>
)}
```

Note: `BookCard` needs an `onUpgrade` prop. Add it to the prop list and pass it from the parent (same place `userId` is added).

- [ ] **Step 5: Manual verify**

```bash
npm run dev
# Open reading tracker, expand a book
# Click "Book Info" toggle
# Free user: info panel appears with blurred content + "Unlock with Premium" button
# Premium user: full info panel visible including Notable Passages section
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/BookCard.jsx src/styles/<css-file>
git commit -m "feat: premium-gate book info panel and show notable passages"
```

---

## Task 3: Bible Books Tab in Study Topics

**Files:**
- Modify: `src/views/studytopics/StudyTopicsPage.jsx`

- [ ] **Step 1: Add tab state and imports**

In `StudyTopicsPage.jsx`, add:
```js
import { useState } from "react";
import { BOOK_INFO } from "../../data/bookInfo";
import { BOOKS } from "../../data/books";
import { useSubscription } from "../../hooks/useSubscription";
```

Add state in the component:
```js
const { isPremium } = useSubscription(user?.id);
const [tab, setTab] = useState("topics"); // "topics" | "books"
```

- [ ] **Step 2: Add tab bar JSX**

After `<p className="stp-subtitle">`, add a tab bar:
```jsx
<div className="stp-tabs" role="tablist">
  <button
    className={`stp-tab${tab === "topics" ? " stp-tab--active" : ""}`}
    onClick={() => setTab("topics")}
    role="tab"
    aria-selected={tab === "topics"}
  >
    Topics
  </button>
  <button
    className={`stp-tab${tab === "books" ? " stp-tab--active" : ""}`}
    onClick={() => setTab("books")}
    role="tab"
    aria-selected={tab === "books"}
  >
    Bible Books
  </button>
</div>
```

- [ ] **Step 3: Wrap existing grid in tab condition**

Change:
```jsx
<div className="stp-grid">
  {STUDY_TOPICS.map(topic => { ... })}
</div>
```

To:
```jsx
{tab === "topics" && (
  <div className="stp-grid">
    {STUDY_TOPICS.map(topic => { ... existing card code ... })}
  </div>
)}

{tab === "books" && (
  <div className="stp-grid">
    {BOOKS.map((book, bookIndex) => {
      const info = BOOK_INFO[bookIndex];
      const theme = info ? t(`bookThemes.${bookIndex}`, info.theme) : "";
      const bookName = t(`bookNames.${bookIndex}`, book.name);
      return (
        <button
          key={bookIndex}
          className={`stp-card${!isPremium ? " stp-card--locked" : ""}`}
          onClick={() => {
            if (!isPremium) { onUpgrade?.(); return; }
            navigate("bookIntroDetail", { bookIndex });
          }}
          aria-label={`${bookName}${!isPremium ? " (Premium)" : ""}`}
        >
          {!isPremium && (
            <span className="stp-card-lock" aria-hidden="true">✦</span>
          )}
          <h2 className="stp-card-title">{bookName}</h2>
          <p className="stp-card-subtitle">{theme}</p>
          <span className="stp-card-arrow">
            {isPremium ? "Read more →" : "✦ Premium"}
          </span>
        </button>
      );
    })}
  </div>
)}
```

Note: The `navigate("bookIntroDetail", { bookIndex })` route will route to BookCard's expanded info view. If no dedicated detail page exists for this, the simplest approach is to navigate to the reading tracker with the relevant book pre-expanded, or show the info in a modal. The spec says cards tap through — for now, tap behavior for premium users can navigate to the reading tracker page which already shows the info panel. Update the navigate call to match your routing setup (e.g., `navigate("readingTracker")`).

- [ ] **Step 4: Add tab bar CSS to study-topics.css**

Append to `src/styles/study-topics.css`:
```css
/* ── Tabs ──────────────────────────────────────────────────── */
.stp-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.stp-tab {
  padding: 7px 18px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.stp-tab--active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

/* Lock badge on book cards */
.stp-card-lock {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 0.75rem;
  color: var(--gold);
  font-weight: 700;
}

.stp-card {
  position: relative; /* needed for absolute lock badge */
}
```

- [ ] **Step 5: Manual verify**

```bash
npm run dev
# Navigate to Study Topics
# Verify "Topics" and "Bible Books" tabs appear
# Click "Bible Books" — verify 66 book cards render
# Free user: all book cards show ✦ Premium, tapping opens upgrade modal
# Premium user: cards are clickable, showing book theme as subtitle
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/views/studytopics/StudyTopicsPage.jsx src/styles/study-topics.css
git commit -m "feat: add Bible Books tab to Study Topics page"
```

---

## Self-Review Checklist

- [ ] All 66 `bookInfo.js` entries have `notablePassages: [{ref, note}]` (3 items each)
- [ ] `notablePassages` section renders in the info panel (below meta row)
- [ ] Info panel is blurred with overlay CTA for free users
- [ ] Info panel fully visible for premium users (`active`, `trialing`, `gifted`)
- [ ] `onUpgrade` prop passed through to `BookCard` from parent
- [ ] `userId` prop passed to `BookCard` for `useSubscription`
- [ ] "Bible Books" tab renders all 66 books as cards with book name + key theme
- [ ] Free users see ✦ lock on book cards; tap opens upgrade modal
- [ ] `npm run build` passes with no errors
