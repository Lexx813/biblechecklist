# Blog Redesign — Design Spec
**Date:** 2026-04-18  
**Status:** Approved  
**Scope:** Four independent sub-projects delivered as one coordinated redesign

---

## Overview

Transform the existing blog into a best-in-class JW study publishing platform — richer than Medium for this community. The redesign covers four areas: Reading Experience, JW-Specific Features, Discovery, and Writer Experience. All four are shipped together as a cohesive upgrade.

---

## Sub-Project 1: Reading Experience

### Goal
Make reading articles immersive and distraction-free, with progress awareness and easy navigation.

### Layout
Three-column layout (max 1100px, centred):
- **Left (200px sticky):** Table of Contents — section links auto-generated from `<h2>` headings, active link highlighted with a purple left-border as the reader scrolls.
- **Centre (max 680px):** Article body.
- **Right (200px sticky):** Sidebar widgets (progress, actions, related posts).

### Progress Bar
Option C: both a top progress bar (3px fixed, purple gradient, `width` driven by scroll %) and a floating "Back to top" button (bottom-right, pill shape) showing the same percentage. Both update via a single `scroll` listener.

### Article Header
- Category tag pill (purple)
- Title (36px, 800 weight)
- Author avatar + name + date
- Read-time badge (computed server-side: `Math.ceil(wordCount / 200)` min)

### Cover Image
Full-width 16:7 aspect ratio, `object-fit: cover`, rounded corners. Fallback: purple gradient with emoji.

### Pull Quotes
`blockquote` elements styled with a 4px purple left border and `#f5f0ff` background. Authors use a `>` blockquote in the editor which renders as a pull quote.

### Read Time
Computed at publish time from word count. Stored in `posts` table as `read_time_minutes`. Shown in article header and on post cards.

### Right Sidebar
- **Progress widget:** percentage + mini progress bar (purple gradient fill).
- **Actions:** Like (with count), Bookmark, Add Study Note, Share.
- **Related Posts:** 3 posts, same tags, ordered by likes.

### Responsive
Below 900px: collapse to single column; ToC becomes a top accordion; right sidebar collapses to an inline action row below the article.

---

## Sub-Project 2: JW-Specific Features

### Inline Verse Previews

Bible references in article body are interactive:
- Rendered as `<span class="verse-ref">` with purple colour + dotted underline.
- On hover (desktop) / tap (mobile): tooltip appears showing NWT verse text.
- Tooltip contains: reference label, NWT verse text, "Open in JW Library →" deep link (`https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty/...`).
- Tooltip positions above the reference; flips to below if near top of viewport.

### Verse Data Source
- NWT verse text is fetched from wol.jw.org (authoritative source). No outside commentaries.
- Verses are cached in a `verse_cache` Supabase table: `(book, chapter, verse, translation, text)`.
- On article save, server parses all `verse-ref` spans and pre-fetches any missing verses into the cache.
- Fallback: if verse not in cache, tooltip shows "Opening in JW Library…" and deep-links immediately.

### Verse Reference Format
Authors type references as `[John 3:16]` in the editor. The block editor renders this as a verse-ref span automatically. In markdown mode, same syntax works. At render time, the span wraps the reference text.

---

## Sub-Project 3: Discovery Page

### Route
`/blog` (replaces the current listing page).

### Hero Section
Dark gradient (`#1a1035 → #3b1f6b → #7c3aed`), full-width. Contains:
- Headline: "Explore JW Study Articles"
- Subtext: "Written by the community, for the community"
- Search bar (searches title + tags + author; powered by Supabase full-text search on `posts.fts_vector`)

### Curated Topic Pills
Horizontal scrollable row of topic tags:
`All · Faith & Trust · Bible Study · Family · New World · Ministry · Meeting Prep · Endurance · Creation · Jehovah's Kingdom · Comfort & Hope`

Clicking a pill filters the post grid. "All" is default. Active pill is filled purple; others are outline.

### Featured Post Banner
One hand-picked post (admin-flagged `is_featured = true`, most recent). Half image, half text card. Shows: cover image, category tag, title, excerpt (120 chars), author avatar + name, read time, like count.

### Post Card Grid
2-column responsive grid (1 column on mobile). Each card:
- Cover image (16:9, object-fit cover, rounded top)
- Category tag pill
- Title (2-line clamp)
- Excerpt (3-line clamp)
- Author avatar + name + date
- Read time badge
- Like count + comment count

Pagination: "Load more" button (not infinite scroll — preserves scroll position).

### Right Sidebar
- **Trending This Week:** numbered list of 5 posts, ranked by `(likes + comments * 2)` in last 7 days.
- **Active Writers:** 4 writers with most posts this month. Shows avatar, name, post count, Follow button.

### Data
All powered by existing `posts`, `profiles`, and `post_likes` tables. Trending query uses a `WHERE created_at > now() - interval '7 days'` filter. No new tables needed beyond `is_featured` column.

---

## Sub-Project 4: Writer Experience

### Route
`/blog/new` (new post) and `/blog/[slug]/edit` (edit existing).

### Top Bar
- Left: logo + auto-save status ("Draft saved 2s ago" with green pulse dot)
- Right: Preview, Save Draft, Publish buttons

### Left Format Bar (52px fixed)
Icon buttons for: Paragraph, Heading (H2/H3), Bold, Italic, separator, Bible Verse block, Pull Quote block, Bullet List, separator, Image, Link.

Clicking format buttons applies formatting to the current block or selection.

### Editor Modes

**Block Editor (default):**
- Each paragraph/heading/quote is a discrete block.
- Blocks have drag handles on hover (⠿ icon) for reordering.
- `+` icon on hover opens the slash menu inline.
- Slash menu triggered by typing `/` at start of empty block: shows Bible Verse, Pull Quote, Heading, Image, Study Note options.
- Block types: paragraph, h2, h3, pull-quote, bible-verse, bullet-list, image.

**Markdown toggle:**
- Toggle button at top of content area switches between Block Editor and raw Markdown.
- Markdown is the canonical storage format (serialised to/from blocks on toggle).
- `[John 3:16]` syntax creates verse-ref spans.
- `> text` creates pull quotes.
- Standard Markdown for bold, italic, headings, lists.

### Cover Image
Drag-and-drop zone at top of editor. Uploads to Supabase Storage (`post-covers` bucket). On upload: shows preview, stores URL in `posts.cover_url`.

### Title & Subtitle
Plain text inputs above the content area. Title is required. Subtitle is optional (stored as `posts.excerpt` if no explicit excerpt is set).

### Right Sidebar
- **Read Time:** live word count + estimated minutes (recalculated on every keystroke, debounced 500ms).
- **Tags:** tag chip input, up to 5 tags, autocomplete from existing tags in `post_tags` table.
- **Series:** dropdown of existing series + "Create new series" option. Creates a `post_series` join record.
- **Pre-publish checklist:** Cover image added ✓, At least 1 tag ✓, 300+ words ✓, Pull quote added (optional nudge), Bible reference included (optional nudge).

### Auto-save
Debounced 3-second auto-save to Supabase as a draft (`posts.status = 'draft'`). Save indicator in top bar. Manual "Save Draft" button also available.

### Publish Flow
"Publish →" button opens a confirmation modal showing: title, estimated read time, tags, series. User clicks "Publish now" to set `posts.status = 'published'` and `posts.published_at = now()`.

---

## Data Model Changes

| Table | Change |
|-------|--------|
| `posts` | Add `read_time_minutes int`, `is_featured bool default false`, `subtitle text`, `fts_vector tsvector` (generated column for full-text search) |
| `verse_cache` | New table: `id, book text, chapter int, verse int, translation text, text text, fetched_at timestamptz` |
| `post_series` | New table: `id, title text, author_id uuid, created_at timestamptz` |
| `post_series_items` | New table: `series_id, post_id, position int` |

All new columns are additive; no existing columns changed.

---

## Implementation Order

Each sub-project can be implemented independently. Recommended order:

1. **Writer Experience** — unblocks content creation with the new editor
2. **Reading Experience** — improves all existing and new articles immediately
3. **JW Features** — verse cache + tooltips layer on top of reading experience
4. **Discovery** — depends on `is_featured` column and `fts_vector` from data model changes

---

## Out of Scope

- Comment threads on articles (existing comment system unchanged)
- Monetisation / paid content
- Email digest of new posts
- Mobile app / PWA push notifications for new posts
