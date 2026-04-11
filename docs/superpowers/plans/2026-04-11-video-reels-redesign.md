# Video Reels Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Videos card list with a full-height vertical snap-scroll reel feed with right-rail social actions, scripture tags, and a half-screen comment drawer.

**Architecture:** `VideosPage` becomes a snap-scroll container where each `ReelItem` fills the viewport. Right-rail buttons (like/comment/share) overlay the video. A `CommentDrawer` slides up on comment tap. `VideoDetailPage` gains a scripture badge and layout polish. `VideoComposerPage` gains optional scripture tag fields.

**Tech Stack:** React 18, TypeScript, React Query (`@tanstack/react-query`), Supabase (postgres + storage), CSS custom properties, scroll-snap CSS

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/20260411_add_scripture_tag.sql` | Create | Add `scripture_tag` column to `videos` |
| `src/api/videos.ts` | Modify | Add `scripture_tag` to `VideoInput`, update `listPublished` SELECT |
| `src/utils/videoEmbed.ts` | Modify | Add `formatScriptureTag` utility |
| `src/utils/__tests__/videoEmbed.test.ts` | Modify | Tests for `formatScriptureTag` |
| `src/styles/videos.css` | Rewrite | New reel layout classes, remove old card classes |
| `src/views/videos/VideosPage.tsx` | Rewrite | Snap-scroll reel feed with `ReelItem` + `CommentDrawer` |
| `src/views/videos/VideoDetailPage.tsx` | Modify | Add scripture badge, polish action row |
| `src/views/videos/VideoComposerPage.tsx` | Modify | Add scripture tag fields |

---

## Task 1: DB Migration — add scripture_tag column

**Files:**
- Create: `supabase/migrations/20260411_add_scripture_tag.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260411_add_scripture_tag.sql
ALTER TABLE videos ADD COLUMN IF NOT EXISTS scripture_tag text;
```

- [ ] **Step 2: Apply the migration in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste the SQL → Run.

Expected: No error, query returns `ALTER TABLE`.

- [ ] **Step 3: Verify the column exists**

In Supabase SQL Editor run:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'videos' AND column_name = 'scripture_tag';
```

Expected: One row: `scripture_tag | text`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260411_add_scripture_tag.sql
git commit -m "feat: add scripture_tag column to videos table"
```

---

## Task 2: Update API types and SELECT

**Files:**
- Modify: `src/api/videos.ts`

- [ ] **Step 1: Add `scripture_tag` to `VideoInput` interface**

In `src/api/videos.ts`, change:

```typescript
export interface VideoInput {
  title: string;
  description?: string;
  embed_url?: string;
  storage_path?: string;
  duration_sec?: number;
  thumbnail_url?: string;
}
```

to:

```typescript
export interface VideoInput {
  title: string;
  description?: string;
  embed_url?: string;
  storage_path?: string;
  duration_sec?: number;
  thumbnail_url?: string;
  scripture_tag?: string | null;
}
```

- [ ] **Step 2: Add `scripture_tag` to the `listPublished` SELECT**

Change the `.select(...)` call in `listPublished` from:

```typescript
.select("id, slug, title, description, creator_id, embed_url, storage_path, thumbnail_url, duration_sec, likes_count, created_at, profiles!creator_id(display_name, avatar_url)")
```

to:

```typescript
.select("id, slug, title, description, creator_id, embed_url, storage_path, thumbnail_url, duration_sec, likes_count, created_at, scripture_tag, profiles!creator_id(display_name, avatar_url)")
```

Note: `getBySlug` uses `select("*", ...)` so it already returns `scripture_tag` — no change needed there.

- [ ] **Step 3: Commit**

```bash
git add src/api/videos.ts
git commit -m "feat: include scripture_tag in VideoInput and listPublished SELECT"
```

---

## Task 3: Add formatScriptureTag utility (TDD)

**Files:**
- Modify: `src/utils/videoEmbed.ts`
- Modify: `src/utils/__tests__/videoEmbed.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `src/utils/__tests__/videoEmbed.test.ts` and add at the bottom (after existing tests):

```typescript
import { formatScriptureTag } from "../videoEmbed";

describe("formatScriptureTag", () => {
  it("returns null when both inputs are empty", () => {
    expect(formatScriptureTag("", "")).toBeNull();
  });

  it("returns null when only chapter is provided (no book)", () => {
    expect(formatScriptureTag("", "3")).toBeNull();
  });

  it("returns book name alone when chapter is empty", () => {
    expect(formatScriptureTag("John", "")).toBe("John");
  });

  it("combines book and chapter with a space", () => {
    expect(formatScriptureTag("John", "3")).toBe("John 3");
  });

  it("trims whitespace from both inputs", () => {
    expect(formatScriptureTag("  John  ", "  3  ")).toBe("John 3");
  });

  it("handles multi-word book names", () => {
    expect(formatScriptureTag("1 John", "4")).toBe("1 John 4");
  });
});
```

- [ ] **Step 2: Run to confirm they fail**

```bash
npm test -- --run src/utils/__tests__/videoEmbed.test.ts 2>&1 | tail -20
```

Expected: FAIL — `formatScriptureTag is not a function` (or similar import error).

- [ ] **Step 3: Implement formatScriptureTag in videoEmbed.ts**

Open `src/utils/videoEmbed.ts` and add at the bottom:

```typescript
/**
 * Formats a Bible book + chapter into a scripture tag string.
 * Returns null if no book is provided (chapter alone is meaningless).
 * Examples: ("John", "3") → "John 3"  |  ("John", "") → "John"  |  ("", "3") → null
 */
export function formatScriptureTag(book: string, chapter: string): string | null {
  const b = book.trim();
  const c = chapter.trim();
  if (!b) return null;
  return c ? `${b} ${c}` : b;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm test -- --run src/utils/__tests__/videoEmbed.test.ts 2>&1 | tail -20
```

Expected: All `formatScriptureTag` tests PASS.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm test -- --run 2>&1 | tail -10
```

Expected: All tests pass (31 previously passing + 6 new = 37 passing).

- [ ] **Step 6: Commit**

```bash
git add src/utils/videoEmbed.ts src/utils/__tests__/videoEmbed.test.ts
git commit -m "feat: add formatScriptureTag utility with tests"
```

---

## Task 4: Rewrite videos.css

**Files:**
- Modify: `src/styles/videos.css`

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `src/styles/videos.css` with:

```css
/* src/styles/videos.css */

/* ── Base wrap ─────────────────────────────────────────────── */
.videos-wrap { background: var(--bg); }

/* ── Reel feed container ───────────────────────────────────── */
/*
   .al-content does not set overflow, so we make the reel-feed its own
   scroll context. :has() hides the al-content overflow to prevent
   double-scroll on desktop.
*/
.al-content:has(.reel-feed) {
  overflow: hidden;
}

.reel-feed {
  height: calc(100svh - 52px); /* 52px = TopBar */
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  position: relative;
}
.reel-feed::-webkit-scrollbar { display: none; }

/* ── Individual reel ───────────────────────────────────────── */
.reel-item {
  height: calc(100svh - 52px);
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
  background: #0a0a14;
  display: flex;
  align-items: center;
  justify-content: center;
  /* Center on wide desktop screens */
}

/* ── Video / iframe inside reel ────────────────────────────── */
.reel-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.reel-bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reel-bg-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(155deg, #12122a, #1e1040 50%, #0e1e30);
  display: flex;
  align-items: center;
  justify-content: center;
}
.reel-bg-placeholder svg {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}

/* ── Gradient overlay ──────────────────────────────────────── */
.reel-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.88) 0%,
    rgba(0, 0, 0, 0.25) 42%,
    transparent 65%
  );
  pointer-events: none;
}

/* ── Expand button ─────────────────────────────────────────── */
.reel-expand-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(124, 58, 237, 0.55);
  border: 1px solid rgba(167, 139, 250, 0.35);
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #f0eaff;
  cursor: pointer;
  font-family: inherit;
  backdrop-filter: blur(6px);
  transition: background 150ms;
}
.reel-expand-btn:hover { background: rgba(124, 58, 237, 0.75); }

/* ── Right action rail ─────────────────────────────────────── */
.reel-rail {
  position: absolute;
  right: 12px;
  bottom: 100px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.rail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rail-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
  transition: transform 120ms, background 150ms;
  backdrop-filter: blur(8px);
}
.rail-btn:active { transform: scale(0.9); }

.rail-btn.like {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}
.rail-btn.like.liked {
  background: rgba(239, 68, 68, 0.35);
  color: #f87171;
}
.rail-btn.like svg { width: 18px; height: 18px; }

.rail-btn.comment {
  background: rgba(124, 58, 237, 0.2);
  border: 1px solid rgba(124, 58, 237, 0.35);
  color: #a78bfa;
}
.rail-btn.comment svg { width: 18px; height: 18px; }

.rail-btn.share {
  background: rgba(14, 165, 233, 0.2);
  border: 1px solid rgba(14, 165, 233, 0.3);
  color: #7dd3fc;
}
.rail-btn.share svg { width: 18px; height: 18px; }

.rail-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1;
}

/* ── Bottom overlay text ───────────────────────────────────── */
.reel-overlay-text {
  position: absolute;
  bottom: 18px;
  left: 14px;
  right: 68px; /* clear the rail */
  z-index: 10;
}

.reel-scripture-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(124, 58, 237, 0.55);
  border: 1px solid rgba(167, 139, 250, 0.4);
  border-radius: 7px;
  padding: 3px 9px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #e9d5ff;
  margin-bottom: 7px;
  backdrop-filter: blur(4px);
}
.reel-scripture-badge svg { flex-shrink: 0; }

.reel-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin-bottom: 5px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}

.reel-creator-row {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 5px;
}

.reel-creator-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #5b21b6);
  border: 1.5px solid rgba(167, 139, 250, 0.5);
  font-size: 0.65rem;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.reel-creator-avatar img { width: 100%; height: 100%; object-fit: cover; }

.reel-creator-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
}

.reel-duration {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
}

.reel-desc-snippet {
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Progress bar (uploaded videos only) ───────────────────── */
.reel-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.12);
  z-index: 10;
}
.reel-progress-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 0 2px 2px 0;
  transition: width 250ms linear;
}

/* ── FAB upload button ─────────────────────────────────────── */
.reel-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  background: #7c3aed;
  color: #fff;
  border: none;
  border-radius: 24px;
  padding: 12px 20px;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.45);
  transition: transform 120ms, box-shadow 150ms;
}
.reel-fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(124, 58, 237, 0.55);
}
@media (max-width: 1100px) {
  .reel-fab { bottom: 84px; } /* clear mobile tab bar */
}

/* ── Empty state ───────────────────────────────────────────── */
.reel-empty {
  height: calc(100svh - 52px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

/* ── Skeleton ──────────────────────────────────────────────── */
.reel-skeleton {
  height: calc(100svh - 52px);
  scroll-snap-align: start;
  background: linear-gradient(155deg, #12122a, #0e1e30);
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Comment drawer (slides up from bottom) ────────────────── */
.reel-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  backdrop-filter: blur(2px);
}

.reel-comment-drawer {
  width: 100%;
  max-height: 65vh;
  background: var(--card-bg, #1a1332);
  border-radius: 18px 18px 0 0;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  animation: drawer-slide-up 220ms cubic-bezier(0, 0, 0.2, 1) both;
}
@keyframes drawer-slide-up {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.reel-drawer-handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.18);
  margin: 10px auto 0;
  flex-shrink: 0;
}

.reel-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.reel-drawer-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-primary);
}

.reel-drawer-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.reel-drawer-comments {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
}

.reel-drawer-empty {
  text-align: center;
  padding: 24px 0;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* ── Scripture badge on detail page ───────────────────────── */
.detail-scripture-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(167, 139, 250, 0.3);
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #c4b5fd;
  margin-bottom: 10px;
}
.detail-scripture-badge svg { flex-shrink: 0; }

/* ── Detail page (VideoDetailPage) ─────────────────────────── */
.video-player-wrap { max-width: 800px; margin: 0 auto; padding: 20px 16px 80px; }
.video-player-frame {
  width: 100%; aspect-ratio: 16/9; border-radius: var(--radius-md, 12px);
  overflow: hidden; background: #000; margin-bottom: 16px;
}
.video-player-frame iframe,
.video-player-frame video { width: 100%; height: 100%; border: none; display: block; }
.video-player-title { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; line-height: 1.3; }
.video-player-meta { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 12px; }
.video-player-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px; }
.video-player-actions {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 24px;
  flex-wrap: wrap;
}
.video-like-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid var(--border); border-radius: 20px;
  padding: 6px 14px; font-family: inherit; font-size: 0.8rem; font-weight: 600;
  color: var(--text-secondary); cursor: pointer; transition: border-color 150ms, color 150ms;
}
.video-like-btn:hover { border-color: rgba(239,68,68,0.5); color: #f87171; }
.video-like-btn.liked { border-color: #ef4444; color: #f87171; }
.video-like-btn svg { width: 16px; height: 16px; }
.video-share-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid var(--border); border-radius: 20px;
  padding: 6px 14px; font-family: inherit; font-size: 0.8rem; font-weight: 600;
  color: var(--text-secondary); cursor: pointer; transition: border-color 150ms, color 150ms;
}
.video-share-btn:hover { border-color: rgba(14,165,233,0.5); color: #7dd3fc; }
.video-share-btn svg { width: 16px; height: 16px; }

/* ── Comments (shared between detail + drawer) ─────────────── */
.video-comments { margin-top: 8px; }
.video-comments-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; }
.video-comment { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.video-comment:last-child { border-bottom: none; }
.video-comment-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #4f2d85, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: #f0eaff; flex-shrink: 0; overflow: hidden;
}
.video-comment-avatar img { width: 100%; height: 100%; object-fit: cover; }
.video-comment-body { flex: 1; }
.video-comment-author { font-size: 0.75rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
.video-comment-text { font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; }
.video-comment-date { font-size: 0.65rem; color: var(--text-secondary); opacity: 0.6; margin-top: 3px; }
.video-comment-form { display: flex; gap: 8px; padding: 12px 0; }
.video-comment-input {
  flex: 1; padding: 8px 12px; border-radius: 20px;
  background: var(--bg-elevated, #1a1332); border: 1px solid var(--border);
  color: var(--text-primary); font-size: 0.82rem; font-family: inherit; outline: none;
}
.video-comment-input:focus { border-color: rgba(124,58,237,0.5); }
.video-comment-submit {
  padding: 8px 14px; border-radius: 20px; background: #7c3aed;
  color: #fff; border: none; font-family: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer;
}
.video-comment-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Composer ───────────────────────────────────────────────── */
.video-composer-wrap {
  display: flex; align-items: flex-start;
  justify-content: center; padding: 40px 16px 80px; background: var(--bg);
}
.video-composer {
  background: var(--bg-elevated, #1a1332);
  border: 1.5px solid rgba(124,58,237,0.25); border-radius: 16px;
  width: 100%; max-width: 480px; overflow: hidden;
}
[data-theme="light"] .video-composer {
  background: #fff;
  border-color: rgba(124,58,237,0.18);
  box-shadow: 0 4px 24px rgba(124,58,237,0.08);
}
.video-composer-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.video-composer-header h2 { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0; }
.video-composer-close {
  margin-left: auto; background: none; border: none;
  color: var(--text-secondary); cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 4px;
}
.video-composer-tabs { display: flex; border-bottom: 1px solid var(--border); }
.video-composer-tab {
  flex: 1; padding: 8px 0; text-align: center; font-size: 0.78rem; font-weight: 600;
  color: var(--text-secondary); background: none; border: none; cursor: pointer; font-family: inherit;
}
.video-composer-tab.active { color: #a78bfa; border-bottom: 2px solid #7c3aed; margin-bottom: -1px; }
.video-composer-body { padding: 16px; }
.video-composer-field { margin-bottom: 12px; }
.video-composer-label { font-size: 0.68rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 4px; }
.video-composer-input {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  color: var(--text-primary); font-size: 0.82rem; font-family: inherit; box-sizing: border-box; outline: none;
}
.video-composer-input:focus { border-color: rgba(124,58,237,0.5); }
.video-composer-textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  color: var(--text-primary); font-size: 0.82rem; font-family: inherit; box-sizing: border-box;
  resize: vertical; min-height: 68px; outline: none;
}
.video-scripture-row {
  display: grid;
  grid-template-columns: 1fr 80px;
  gap: 8px;
}
.video-scripture-hint {
  font-size: 0.65rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-top: 4px;
  line-height: 1.4;
}
.video-dropzone {
  border: 1.5px dashed rgba(124,58,237,0.35); border-radius: 8px;
  padding: 24px; text-align: center; background: rgba(124,58,237,0.04); cursor: pointer; margin-bottom: 12px;
}
.video-dropzone:hover { border-color: rgba(124,58,237,0.6); }
.video-dropzone-text { font-size: 0.78rem; color: var(--text-secondary); }
.video-progress-panel {
  background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.2);
  border-radius: 8px; padding: 12px; margin-bottom: 12px;
}
.video-progress-label { font-size: 0.72rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.video-progress-bar { height: 4px; border-radius: 2px; background: rgba(124,58,237,0.2); overflow: hidden; margin-bottom: 4px; }
.video-progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #6d28d9, #a78bfa); transition: width 200ms; }
.video-progress-stats { display: flex; justify-content: space-between; font-size: 0.62rem; color: var(--text-secondary); }
.video-composer-submit {
  width: 100%; padding: 10px; border-radius: 8px; border: none;
  background: linear-gradient(90deg, #6d28d9, #7c3aed);
  color: #fff; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; transition: opacity 150ms;
}
.video-composer-submit:disabled { opacity: 0.45; cursor: not-allowed; }
.video-embed-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 0.65rem; font-weight: 600; padding: 2px 8px; border-radius: 20px;
  background: rgba(16,185,129,0.12); color: #34d399; margin-top: 4px;
}
.video-error-msg { font-size: 0.72rem; color: #f87171; margin-top: 4px; }

/* ── Creator request ────────────────────────────────────────── */
.creator-request-wrap { max-width: 480px; margin: 40px auto; padding: 0 16px; }
.creator-request-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md, 12px); padding: 24px; }
.creator-request-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.creator-request-sub { font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5; }
.creator-request-status {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 8px;
  background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2);
  font-size: 0.78rem; font-weight: 600; color: #fbbf24; margin-top: 12px;
}
.creator-request-status.approved { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.2); color: #34d399; }
.creator-request-status.denied { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.2); color: #f87171; }
```

- [ ] **Step 2: Verify build still compiles**

```bash
npm run build 2>&1 | tail -15
```

Expected: Build succeeds. CSS class name changes won't break TypeScript — that's expected. JS errors would be a problem.

- [ ] **Step 3: Commit**

```bash
git add src/styles/videos.css
git commit -m "style: rewrite videos.css with reel layout classes"
```

---

## Task 5: Rewrite VideosPage.tsx

**Files:**
- Modify: `src/views/videos/VideosPage.tsx`

- [ ] **Step 1: Replace the entire file**

Replace the full contents of `src/views/videos/VideosPage.tsx` with:

```tsx
import { useState, useRef } from "react";
import { usePublishedVideos } from "../../hooks/useVideos";
import { useFullProfile } from "../../hooks/useAdmin";
import {
  useToggleVideoLike,
  useUserLikedVideoIds,
  useVideoComments,
  useCreateVideoComment,
} from "../../hooks/useVideos";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

// ── Helpers ────────────────────────────────────────────────────

function formatDur(sec: number | null): string {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// ── Icons ──────────────────────────────────────────────────────

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const BookIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const PlayIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

// ── Types ──────────────────────────────────────────────────────

interface Video {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  creator_id: string;
  embed_url: string | null;
  storage_path: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  likes_count: number;
  created_at: string;
  scripture_tag: string | null;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

// ── ReelItem ───────────────────────────────────────────────────

interface ReelItemProps {
  video: Video;
  liked: boolean;
  onLike: () => void;
  onExpand: () => void;
  onComment: () => void;
  onShare: () => void;
}

function ReelItem({ video, liked, onLike, onExpand, onComment, onShare }: ReelItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const isUpload = !video.embed_url && !!video.storage_path;
  const creatorName = video.profiles?.display_name ?? "Creator";
  const initials = (creatorName[0] ?? "?").toUpperCase();

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(v.currentTime / v.duration);
  }

  return (
    <div className="reel-item">
      {/* ── Video layer ── */}
      {video.embed_url ? (
        <iframe
          className="reel-iframe"
          src={video.embed_url}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      ) : isUpload ? (
        /* Uploaded videos show placeholder in feed — tap expand to watch with signed URL */
        <div className="reel-bg-placeholder">
          <PlayIcon />
        </div>
      ) : (
        <div className="reel-bg-placeholder">
          <PlayIcon />
        </div>
      )}

      <div className="reel-gradient" />

      {/* ── Expand button ── */}
      <button className="reel-expand-btn" onClick={onExpand} aria-label="Open full view">
        ↗ Full view
      </button>

      {/* ── Right rail ── */}
      <div className="reel-rail">
        <div className="rail-item">
          <button
            className={`rail-btn like${liked ? " liked" : ""}`}
            onClick={onLike}
            aria-label={liked ? "Unlike" : "Like"}
          >
            <HeartIcon filled={liked} />
          </button>
          <span className="rail-count">{video.likes_count}</span>
        </div>
        <div className="rail-item">
          <button className="rail-btn comment" onClick={onComment} aria-label="Open comments">
            <CommentIcon />
          </button>
        </div>
        <div className="rail-item">
          <button className="rail-btn share" onClick={onShare} aria-label="Share">
            <ShareIcon />
          </button>
        </div>
      </div>

      {/* ── Bottom overlay ── */}
      <div className="reel-overlay-text">
        {video.scripture_tag && (
          <div className="reel-scripture-badge">
            <BookIcon />
            {video.scripture_tag}
          </div>
        )}
        <div className="reel-title">{video.title}</div>
        <div className="reel-creator-row">
          <div className="reel-creator-avatar">
            {video.profiles?.avatar_url
              ? <img src={video.profiles.avatar_url} alt={creatorName} />
              : initials}
          </div>
          <span className="reel-creator-name">{creatorName}</span>
          {video.duration_sec && (
            <span className="reel-duration">{formatDur(video.duration_sec)}</span>
          )}
        </div>
        {video.description && (
          <div className="reel-desc-snippet">
            {video.description.slice(0, 80)}{video.description.length > 80 ? "…" : ""}
          </div>
        )}
      </div>

      {/* ── Progress bar (uploaded videos only — when playing in future) ── */}
      {isUpload && (
        <div className="reel-progress">
          <div className="reel-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}

// ── CommentDrawer ──────────────────────────────────────────────

interface CommentDrawerProps {
  videoId: string;
  user: { id: string } | null;
  onClose: () => void;
}

function CommentDrawer({ videoId, user, onClose }: CommentDrawerProps) {
  const { data: comments = [] } = useVideoComments(videoId);
  const createComment = useCreateVideoComment(videoId);
  const [text, setText] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim()) return;
    try {
      await createComment.mutateAsync({ userId: user.id, content: text.trim() });
      setText("");
    } catch (err: any) {
      toast(err.message ?? "Failed to post comment.");
    }
  }

  return (
    <div className="reel-drawer-backdrop" onClick={onClose}>
      <div className="reel-comment-drawer" onClick={e => e.stopPropagation()}>
        <div className="reel-drawer-handle" />
        <div className="reel-drawer-header">
          <span className="reel-drawer-title">
            {(comments as any[]).length} {(comments as any[]).length === 1 ? "comment" : "comments"}
          </span>
          <button className="reel-drawer-close" onClick={onClose} aria-label="Close comments">✕</button>
        </div>
        <div className="reel-drawer-comments">
          {(comments as any[]).length === 0 && (
            <div className="reel-drawer-empty">No comments yet. Be the first!</div>
          )}
          {(comments as any[]).map(c => (
            <div key={c.id} className="video-comment">
              <div className="video-comment-avatar">
                {c.profiles?.avatar_url
                  ? <img src={c.profiles.avatar_url} alt={c.profiles?.display_name ?? "?"} />
                  : (c.profiles?.display_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="video-comment-body">
                <div className="video-comment-author">{c.profiles?.display_name ?? "Anonymous"}</div>
                <div className="video-comment-text">{c.content}</div>
              </div>
            </div>
          ))}
        </div>
        {user ? (
          <form className="video-comment-form" style={{ padding: "0 16px 16px" }} onSubmit={handleSubmit}>
            <input
              className="video-comment-input"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={1000}
              autoFocus
            />
            <button
              type="submit"
              className="video-comment-submit"
              disabled={!text.trim() || createComment.isPending}
            >
              Post
            </button>
          </form>
        ) : (
          <div style={{ padding: "0 16px 16px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
            Sign in to comment.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────

interface Props {
  user: { id: string } | null;
  profile?: any;
  slug?: string | null;
  onSelectVideo: (slug: string) => void;
  onBack: () => void;
  onPostClick: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: any;
  onLogout?: (() => void) | null;
  onUpgrade?: () => void;
  currentPage?: string;
  onSearchClick?: () => void;
}

// ── Main component ─────────────────────────────────────────────

export default function VideosPage({ user, onSelectVideo, onPostClick, navigate }: Props) {
  const { data: videos = [], isLoading } = usePublishedVideos();
  const { data: profile } = useFullProfile(user?.id);
  const { data: likedIds = [] } = useUserLikedVideoIds(user?.id);
  const toggleLike = useToggleVideoLike(user?.id);
  // All signed-in users can post — no creator approval required
  const canPost = !!user;

  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);

  function handleLike(videoId: string) {
    if (!user) { toast("Sign in to like videos."); return; }
    toggleLike.mutate(videoId);
  }

  function handleShare(slug: string) {
    const url = `${window.location.origin}/videos/${encodeURIComponent(slug)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast("Link copied!"))
      .catch(() => toast("Could not copy link."));
  }

  return (
    <>
      <div className="reel-feed">
        {isLoading && [0, 1, 2].map(i => <div key={i} className="reel-skeleton" />)}
        {!isLoading && (videos as Video[]).length === 0 && (
          <div className="reel-empty">
            No videos yet.
            {canPost ? " Be the first to post one!" : ""}
          </div>
        )}
        {!isLoading && (videos as Video[]).map(video => (
          <ReelItem
            key={video.id}
            video={video}
            liked={(likedIds as string[]).includes(video.id)}
            onLike={() => handleLike(video.id)}
            onExpand={() => onSelectVideo(video.slug)}
            onComment={() => setCommentVideoId(video.id)}
            onShare={() => handleShare(video.slug)}
          />
        ))}
      </div>

      {/* FAB visible to all signed-in users — no approval gate */}
      {canPost && (
        <button className="reel-fab" onClick={onPostClick} aria-label="Post a video">
          + Post
        </button>
      )}

      {commentVideoId && (
        <CommentDrawer
          videoId={commentVideoId}
          user={user}
          onClose={() => setCommentVideoId(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "videos/VideosPage" | head -20
```

Expected: No errors for `VideosPage.tsx`. (Other pre-existing errors in unrelated files are OK.)

- [ ] **Step 3: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -10
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/views/videos/VideosPage.tsx
git commit -m "feat: rewrite VideosPage as snap-scroll reel feed"
```

---

## Task 6: Enhance VideoDetailPage — scripture badge + share button

**Files:**
- Modify: `src/views/videos/VideoDetailPage.tsx`

- [ ] **Step 1: Add scripture badge and share button**

Replace the full contents of `src/views/videos/VideoDetailPage.tsx` with:

```tsx
import { useState } from "react";
import { useVideoBySlug, useVideoComments, useCreateVideoComment, useDeleteVideoComment, useUserLikedVideoIds, useToggleVideoLike } from "../../hooks/useVideos";
import { useFullProfile } from "../../hooks/useAdmin";
import { formatDate } from "../../utils/formatters";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);

const BookIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

interface Props {
  user: { id: string } | null;
  slug: string;
  onBack: () => void;
  navigate: (page: string, params?: Record<string, unknown>) => void;
  darkMode?: boolean;
  setDarkMode?: (v: boolean) => void;
  i18n?: any;
  onLogout?: (() => void) | null;
  onUpgrade?: () => void;
  currentPage?: string;
  onSearchClick?: () => void;
}

export default function VideoDetailPage({ user, slug, onBack, navigate }: Props) {
  const { data: video, isLoading } = useVideoBySlug(slug);
  const { data: comments = [] } = useVideoComments(video?.id);
  const { data: likedIds = [] } = useUserLikedVideoIds(user?.id);
  const { data: profile } = useFullProfile(user?.id);
  const toggleLike = useToggleVideoLike(user?.id);
  const createComment = useCreateVideoComment(video?.id);
  const deleteComment = useDeleteVideoComment(video?.id);
  const [commentText, setCommentText] = useState("");
  const liked = video ? (likedIds as string[]).includes(video.id) : false;

  async function handleLike() {
    if (!user) { toast("Sign in to like videos."); return; }
    if (!video) return;
    await toggleLike.mutateAsync(video.id);
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !commentText.trim() || !video) return;
    try {
      await createComment.mutateAsync({ userId: user.id, content: commentText.trim() });
      setCommentText("");
    } catch (err: any) {
      toast(err.message ?? "Failed to post comment.");
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/videos/${encodeURIComponent(slug)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast("Link copied!"))
      .catch(() => toast("Could not copy link."));
  }

  if (isLoading) {
    return (
      <div className="videos-wrap">
        <div className="video-player-wrap">
          <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="videos-wrap">
        <div className="video-player-wrap">
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-secondary)" }}>Video not found.</div>
          <button onClick={onBack} style={{ marginTop: 12, background: "none", border: "none", color: "#a78bfa", cursor: "pointer" }}>← Back to videos</button>
        </div>
      </div>
    );
  }

  const creatorName = (video.profiles as any)?.display_name ?? "Unknown";

  return (
    <div className="videos-wrap">
      <div className="video-player-wrap">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem", marginBottom: 12 }}>← All videos</button>

        <div className="video-player-frame">
          {video.embed_url ? (
            <iframe src={video.embed_url} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" title={video.title} />
          ) : (video as any).playback_url ? (
            <video controls preload="metadata">
              <source src={(video as any).playback_url} type="video/mp4" />
            </video>
          ) : null}
        </div>

        {(video as any).scripture_tag && (
          <div className="detail-scripture-badge">
            <BookIcon />
            {(video as any).scripture_tag}
          </div>
        )}

        <h1 className="video-player-title">{video.title}</h1>
        <div className="video-player-meta">{creatorName} · {formatDate(video.created_at, "long" as any)}</div>
        {video.description && <div className="video-player-desc">{video.description}</div>}

        <div className="video-player-actions">
          <button className={`video-like-btn${liked ? " liked" : ""}`} onClick={handleLike} aria-label={liked ? "Unlike" : "Like"}>
            <HeartIcon filled={liked} />
            {video.likes_count} {video.likes_count === 1 ? "like" : "likes"}
          </button>
          <button className="video-share-btn" onClick={handleShare} aria-label="Share">
            <ShareIcon />
            Share
          </button>
        </div>

        <div className="video-comments">
          <div className="video-comments-title">{(comments as any[]).length} {(comments as any[]).length === 1 ? "comment" : "comments"}</div>
          {(comments as any[]).map(c => (
            <div key={c.id} className="video-comment">
              <div className="video-comment-avatar">
                {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt={c.profiles?.display_name ?? "?"} /> : (c.profiles?.display_name?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="video-comment-body">
                <div className="video-comment-author">{c.profiles?.display_name ?? "Anonymous"}</div>
                <div className="video-comment-text">{c.content}</div>
                <div className="video-comment-date">{formatDate(c.created_at)}</div>
              </div>
              {(user?.id === c.author_id || (profile as any)?.is_admin) && (
                <button onClick={() => deleteComment.mutate(c.id)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.7rem", alignSelf: "flex-start", marginTop: 2 }} aria-label="Delete comment">✕</button>
              )}
            </div>
          ))}
          {user ? (
            <form className="video-comment-form" onSubmit={handleComment}>
              <input className="video-comment-input" value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment…" maxLength={1000} />
              <button type="submit" className="video-comment-submit" disabled={!commentText.trim() || createComment.isPending}>Post</button>
            </form>
          ) : (
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: 8 }}>
              <button onClick={() => navigate("home")} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: "inherit" }}>Sign in</button> to comment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "VideoDetailPage" | head -20
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/views/videos/VideoDetailPage.tsx
git commit -m "feat: add scripture badge and share button to VideoDetailPage"
```

---

## Task 7: Enhance VideoComposerPage — scripture tag fields

**Files:**
- Modify: `src/views/videos/VideoComposerPage.tsx`

- [ ] **Step 1: Add scripture tag state and import**

In `src/views/videos/VideoComposerPage.tsx`, add `formatScriptureTag` to the import at the top:

```typescript
import { validateVideoFile, parseEmbedUrl, formatScriptureTag } from "../../utils/videoEmbed";
```

- [ ] **Step 2: Add scripture tag state variables**

After the existing `const [uploading, setUploading] = useState(false);` line, add:

```typescript
const [scriptureBook, setScriptureBook] = useState("");
const [scriptureChapter, setScriptureChapter] = useState("");
```

- [ ] **Step 3: Include scripture_tag when submitting**

In the `handleSubmit` function, find the two `createVideo.mutateAsync` calls and add `scripture_tag` to both:

For the link tab call, change:
```typescript
await createVideo.mutateAsync({ title: title.trim(), description: description.trim() || undefined, embed_url: embedUrl });
```
to:
```typescript
await createVideo.mutateAsync({
  title: title.trim(),
  description: description.trim() || undefined,
  embed_url: embedUrl,
  scripture_tag: formatScriptureTag(scriptureBook, scriptureChapter),
});
```

For the upload tab call, change:
```typescript
await createVideo.mutateAsync({ title: title.trim(), description: description.trim() || undefined, storage_path });
```
to:
```typescript
await createVideo.mutateAsync({
  title: title.trim(),
  description: description.trim() || undefined,
  storage_path,
  scripture_tag: formatScriptureTag(scriptureBook, scriptureChapter),
});
```

- [ ] **Step 4: Add scripture tag fields to the form**

In the JSX, after the description `<div className="video-composer-field">` block and before the tab-specific fields, add:

```tsx
<div className="video-composer-field">
  <label className="video-composer-label">Scripture Tag (optional)</label>
  <div className="video-scripture-row">
    <input
      className="video-composer-input"
      value={scriptureBook}
      onChange={e => setScriptureBook(e.target.value)}
      placeholder="Book  e.g. John"
      maxLength={30}
    />
    <input
      className="video-composer-input"
      value={scriptureChapter}
      onChange={e => setScriptureChapter(e.target.value)}
      placeholder="Ch.  e.g. 3"
      maxLength={5}
      type="text"
      inputMode="numeric"
    />
  </div>
  <div className="video-scripture-hint">Shows as a badge on the reel. Leave blank if not applicable.</div>
</div>
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep "VideoComposerPage" | head -20
```

Expected: No errors.

- [ ] **Step 6: Run full test suite**

```bash
npm test -- --run 2>&1 | tail -10
```

Expected: All 37 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/views/videos/VideoComposerPage.tsx
git commit -m "feat: add scripture tag fields to VideoComposerPage"
```

---

## Task 8: Manual smoke test

Before finishing, do a quick visual check in the dev server.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Check the Videos feed**

Navigate to Videos in the sidebar. Verify:
- Feed fills the full content height
- Scroll snaps between reels
- Right-rail buttons (like, comment, share) appear on each reel
- Embed videos show iframe; uploaded videos show placeholder with play icon
- "↗ Full view" button is visible top-right

- [ ] **Step 3: Test the comment drawer**

Tap the comment button on a reel. Verify:
- Drawer slides up from the bottom
- Backdrop is semi-transparent
- Tapping backdrop closes the drawer
- If logged in, can type and post a comment

- [ ] **Step 4: Test the detail page**

Tap "↗ Full view". Verify:
- Player renders at full width
- Scripture badge appears below the player (if the video has one)
- Like button toggles between liked/unliked
- Share button copies a link and shows a toast

- [ ] **Step 5: Test the composer**

Navigate to the composer. Verify:
- Scripture tag fields appear below Description
- Submitting with a book + chapter stored correctly (check Supabase table after)
- Submitting with empty scripture fields works fine (null stored)

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: video reels redesign complete"
```

---

## Design Note: Open Posting + Report Feature

**Decision (post-spec):** Pre-publish creator approval is removed. Any signed-in user may post. The admin review queue becomes a post-publish report queue instead.

**What this changes vs. the spec:**
- `canPost = !!user` (all signed-in users, not just approved creators)
- The "Apply to post" flow (`creatorRequest` page) is no longer surfaced from the video feed
- Admin no longer needs to approve videos before they appear — they review reported videos instead

**Report feature (follow-on task — not in this plan):**
Add a "Report" button to each reel (e.g., `···` menu or a flag icon in the rail). Reports write to a `video_reports` table. Admin sees a reports queue in the Videos tab. Reported videos can be un-published from there. This is a separate implementation cycle with its own spec + plan.
