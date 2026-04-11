# Video Reels Redesign — Design Spec

## Context

The Videos section was built as a basic card list with a separate detail page and composer. This spec redesigns it into a TikTok/Reels-style vertical snap-scroll feed appropriate for short spiritual clips (under 5 min) targeting both congregation members and Bible students.

## Design Decisions

| Question | Answer |
|---|---|
| Primary audience | Both congregation members & Bible students equally |
| Content type | Short clips & highlights only (under 5 min) |
| Feed layout | Reels — full-height vertical snap-scroll |
| Interactions | Right-rail social (like, comment, share) + tap to open detail page + scripture tag |

## Approach

**Approach 1 — Full Reels Feed** (chosen). The Videos page becomes a full-height vertical snap-scroll container. Each reel fills the viewport. Right-rail buttons overlay the video. Tapping "Full view" navigates to VideoDetailPage. The composer, admin queue, and creator request flow are untouched except for the new scripture tag field.

Rejected: Grid + overlay (overkill for current content volume), Enhanced detail only (doesn't deliver the reels experience).

---

## Architecture

### User Flow

```
Sidebar "Videos" → VideosPage (reel feed) → VideoDetailPage (full view)
                                           ↑
                              VideoComposerPage (upload/embed + scripture tag)
```

### Files Changed

| File | Change | Description |
|---|---|---|
| `src/views/videos/VideosPage.tsx` | Rewrite | Snap-scroll reel feed replacing card list |
| `src/views/videos/VideoDetailPage.tsx` | Enhance | Cinematic player, scripture badge, polished layout |
| `src/views/videos/VideoComposerPage.tsx` | Enhance | Add optional scripture tag fields (book + chapter) |
| `src/styles/videos.css` | Rewrite | New reel layout classes; old card styles removed |
| `src/hooks/useVideos.ts` | Enhance | Include `scripture_tag` in SELECT |
| `supabase/migrations/` | Add | `scripture_tag text` column on `videos` table (nullable) |
| `src/views/videos/CreatorRequestPage.tsx` | Unchanged | No changes needed |
| `src/views/admin/AdminPage.tsx` | Unchanged | Admin review queue already works |

### Component Tree (new VideosPage)

```
VideosPage
├── snap-scroll container (.reel-feed)
│   └── ReelItem × N  (.reel-item)
│       ├── VideoPlayer  (iframe embed OR <video> tag)
│       ├── .reel-gradient  (bottom gradient overlay)
│       ├── .reel-overlay-text  (bottom-left info)
│       │   ├── scripture badge  (optional purple pill)
│       │   ├── title  (max 2 lines)
│       │   ├── creator row  (avatar + name + duration)
│       │   └── description snippet  (~80 chars)
│       ├── .reel-rail  (right-rail action buttons)
│       │   ├── LikeButton  (heart + count, toggle)
│       │   ├── CommentButton  (opens half-screen drawer)
│       │   └── ShareButton  (copy link)
│       ├── expand button  (↗ Full view → VideoDetailPage)
│       └── progress bar  (uploaded videos only)
└── FAB upload button  (→ VideoComposerPage)
```

---

## Reel Player

### Layout

- Feed container: `overflow-y: scroll; scroll-snap-type: y mandatory`
- Each reel: `height: 100dvh; scroll-snap-align: start`
- Desktop: `max-width: 480px; margin: 0 auto` centered within `al-content`
- Mobile: full width

### Video rendering

- **Embed videos** (YouTube/JW.org URLs): rendered as `<iframe>` with `aspect-ratio: 16/9`, centered vertically
- **Uploaded videos** (Supabase Storage): rendered as `<video autoPlay muted loop playsInline>` with signed URL. Progress bar visible.

### Right-rail buttons

Positioned `right: 10px; bottom: 90px`, stacked vertically with counts below each icon.

| Button | Color | Behavior |
|---|---|---|
| Like (heart) | Red `#f87171` | Toggles liked state, optimistic count update |
| Comment (bubble) | Purple `#a78bfa` | Opens half-screen comment drawer without leaving reel |
| Share (upload arrow) | Blue `#7dd3fc` | Copies deep link to clipboard (navigator.clipboard) |

### Bottom overlay text

- **Scripture badge** — purple pill `rgba(124,58,237,0.55)`, shows `"{book} {chapter}"` (e.g. "John 3"). Hidden when `scripture_tag` is null.
- **Title** — white bold, `font-size: 13px`, max 2 lines with `line-clamp: 2`
- **Creator row** — avatar initial circle + display name + duration (e.g. "2 min")
- **Description snippet** — first ~80 chars, `opacity: 0.6`

### Expand button

Top-right corner of reel: `↗ Full view` — navigates to `VideoDetailPage` via `navigate("videoDetail", { slug: video.slug })`.

### Progress bar

`position: absolute; bottom: 0` — 2.5px tall, purple fill, width = `(currentTime / duration) * 100%`. Only rendered for `<video>` elements (not iframes).

---

## VideoDetailPage (enhanced)

### Layout

1. Full-width player (16:9, dark bg) with back button top-left
2. Scripture tag badge (below player, if set)
3. Video title (large, bold)
4. Creator row: avatar + name + upload date + duration
5. Action row: Like button (count) · Comment button (count) · Share button
6. Full description text
7. Comments section: list of existing comments + input box

### Changes from current implementation

- Remove any remaining TopBar (already done)
- Add scripture badge rendering
- Player takes full content width (no card wrapper)
- Action buttons styled consistently (outlined pill style)
- Comment input always visible at bottom of comments section

---

## VideoComposerPage (scripture tag field)

### New fields

Two optional inputs added below the description field:

- **Bible book** — text input, placeholder "e.g. John" 
- **Chapter** — number input, placeholder "3"

On submit: concatenated as `scripture_tag = "{book} {chapter}"` (trimmed). If both empty, `scripture_tag = null`.

### No other composer changes

Tab switching (embed/upload), file validation, submission flow — all unchanged.

---

## Database

### Migration

```sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS scripture_tag text;
```

### Hook update

`useVideos.ts` — add `scripture_tag` to the SELECT in `usePublishedVideos` and any admin query that fetches video records.

---

## CSS classes (new)

```css
/* Feed */
.reel-feed          /* snap-scroll container, height: 100dvh */
.reel-item          /* individual reel, height: 100dvh, snap-align: start */
.reel-gradient      /* gradient overlay, position: absolute, inset: 0 */
.reel-overlay-text  /* bottom-left info block */
.reel-rail          /* right-side action buttons */
.reel-progress      /* bottom progress bar (video only) */
.scripture-badge    /* purple pill tag */
```

Old classes removed: `.video-card`, `.video-card-thumb`, `.video-list`, `.video-card-meta`

---

## Out of Scope

- Scripture-based filtering/browsing (future iteration once enough tagged content exists)
- Video autoplay on desktop (browser policies; mobile autoplay works with `muted`)
- Creator analytics / view counts
- Bookmarking / save-for-later
- Any changes to admin queue or creator request flow
