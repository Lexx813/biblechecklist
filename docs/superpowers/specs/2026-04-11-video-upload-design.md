# Video Upload Feature — Design Spec

**Date:** 2026-04-11  
**Status:** Approved for implementation planning  
**Author:** Alexi (Reductio) via brainstorm session

---

## Overview

Add a video sharing feature to jwstudy.org so approved community members can publish theological video content — either as YouTube/TikTok/Rumble embeds or as direct MP4 file uploads. Videos live in a dedicated `/videos` feed separate from the blog. The feature launches fully (both embeds and file uploads) on day one.

---

## 1. Architecture

### New route
- `/videos` — public-facing video feed (Card List layout, matches blog feed)
- `/videos/[slug]` — individual video player page

### New DB table: `videos`

```sql
create table videos (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  description   text,
  creator_id    uuid references profiles(id) not null,
  embed_url     text,                    -- YouTube/TikTok/Rumble iframe src
  storage_path  text,                    -- Supabase Storage path (uploads only)
  duration_sec  int,
  thumbnail_url text,
  published     boolean default false,   -- admin review gate
  likes_count   int default 0,
  created_at    timestamptz default now()
);
```

One row covers both sources: `embed_url` is set for link embeds, `storage_path` is set for file uploads — never both on the same row. `slug` is auto-generated from the title at insert time (kebab-case, deduped with a short suffix if collision).

### Creator approval flag on profiles

```sql
alter table profiles add column is_approved_creator boolean default false;
```

### New DB table: `creator_requests`

```sql
create table creator_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) unique not null,
  display_name text not null,
  topic_description text not null,
  sample_url  text,
  status      text default 'pending',   -- pending | approved | denied
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_at  timestamptz default now()
);
```

### Supabase Storage

New bucket: `videos` (private, signed URLs for playback)

### RLS policies

- `videos` INSERT: `auth.uid() = creator_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_approved_creator = true)`
- `videos` SELECT: `published = true` for anonymous; all own rows for authenticated
- `creator_requests` INSERT: one per user, when not already approved
- `creator_requests` SELECT/UPDATE: admin only

---

## 2. Upload Flow (file uploads)

Upload happens entirely client-side before any server call:

1. **User selects file** — validates type (MP4, MOV, WebM) and raw size cap (500 MB max)
2. **ffmpeg.wasm compresses in a Web Worker** — targets H.264, 720p, 2 Mbps. A 200 MB phone video becomes ~40–50 MB. Progress shown live. ffmpeg.wasm (~10 MB) is lazy-loaded only when the Upload File tab is opened — no impact on page load
3. **Compressed file uploads to Supabase Storage** — `videos` bucket, `{userId}/{uuid}.mp4`
4. **Row inserted into `videos` table** — `storage_path`, title, description, `creator_id`, `published: false`

**Fallback:** if the browser doesn't support `SharedArrayBuffer` (required by ffmpeg.wasm), show a clear error message: "Your browser doesn't support in-browser compression. Please use Chrome or Firefox, or compress the video manually before uploading."

**Submit button** is disabled during compression and upload. Label changes: "Compressing… please wait" → "Uploading… X%" → "Submit for review"

**Published flag:** all uploaded videos start as `published: false` and go into an admin review queue before appearing in the feed. This matches the existing blog post approval model.

---

## 3. Embed Flow (link embeds)

For YouTube, TikTok, and Rumble links:

1. User pastes URL into the Paste Link tab
2. Client-side parses the URL and extracts a canonical embed `src` (e.g. `https://www.youtube.com/embed/{id}`)
3. Supported domains: `youtube.com`, `youtu.be`, `tiktok.com`, `rumble.com`
4. Row inserted with `embed_url` set, `storage_path` null, `published: false`
5. Admin reviews and publishes

No server-side processing needed for embeds.

---

## 4. Post Composer UI

Accessed via "Post a Video" button in the TopBar (visible to approved creators only).

**Two tabs:**
- **Paste Link** — URL input, detected platform shown as badge (YouTube / TikTok / Rumble)
- **Upload File** — drag-and-drop zone → compression progress panel → upload progress

**Both tabs share:** Title field (required), Description field (optional).

**TopBar button visibility:** conditionally rendered based on `profiles.is_approved_creator`.

---

## 5. Video Feed (`/videos`)

**Layout:** Card List — thumbnail (16:9) on the left, title + creator + duration + view count on the right. Matches the existing blog feed card pattern.

**Sorting:** newest first by default. No search or filters in v1.

**Each card links to** `/videos/[slug]`

**Pagination:** standard cursor-based pagination, same as blog feed.

---

## 6. Video Player (`/videos/[slug]`)

**Player area:**
- For uploads: `<video>` element with Supabase signed URL, controls, autoplay off
- For embeds: `<iframe>` with `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`, no `allowfullscreen` to keep layout clean

**Below player:**
- Title, creator name (links to their profile), posted date
- Like button (authenticated users) — optimistic update, persisted to `videos.likes_count` + a `video_likes` junction table to prevent duplicate likes
- Comments section — uses the same comment component/API as blog posts, scoped to `video_id`

---

## 7. Interactions

- **Likes:** authenticated users only. One like per user per video. Button shows filled/outlined heart, count updates optimistically.
- **Comments:** same comment system as blog posts. Check whether the existing `comments` table uses `post_id` as a foreign key or a plain UUID — if it's a plain UUID column, add a nullable `video_id uuid` column and a `content_type text` discriminator; if it's a FK, create a separate `video_comments` table with the same shape. Resolve at implementation time by inspecting `src/types/supabase.ts`. Unauthenticated users see comments but cannot post.
- **No shares in v1.** No download button.

---

## 8. Creator Approval Flow

### Member side (`/settings/creator-request` or modal)

1. Member clicks "Apply to Upload Videos" (shown in settings or via a prompt on the `/videos` page)
2. Fills in: display name, topic description (required), sample video URL (optional)
3. Submits → row in `creator_requests` with `status: 'pending'`
4. Status pill shown in settings: "Pending review — usually 24–48 hrs"
5. On approval/denial: email notification sent via existing email system

### Admin side (`/admin/creators`)

- Table showing pending requests with applicant info and their submitted reason
- Approve button → sets `profiles.is_approved_creator = true` + `creator_requests.status = 'approved'` + sends email
- Deny button → sets `creator_requests.status = 'denied'` + sends email
- Approved creators list (can revoke at any time)

---

## 9. Dark/Light Mode

All new CSS uses the existing CSS variable system:

| Token | Dark value | Light value |
|---|---|---|
| `--bg-primary` | `#100c1e` | `#ffffff` |
| `--bg-elevated` | `#1a1332` | `#f8f5ff` |
| `--card-bg` | `rgba(79,45,133,0.2)` | `#ffffff` |
| `--text-primary` | `#f0eaff` | `#1e1035` |
| `--text-secondary` | `rgba(240,234,255,0.55)` | `#4b5563` |
| `--border` | `rgba(124,58,237,0.2)` | `rgba(124,58,237,0.15)` |

Light-mode overrides in a `videos.css` file using `[data-theme="light"]` selectors — same pattern as `topbar.css` and `blog.css`.

---

## 10. Error Handling

| Scenario | Behavior |
|---|---|
| File too large (>500 MB) | Immediate inline error: "File too large (max 500 MB)" |
| Unsupported file type | Inline error: "Only MP4, MOV, and WebM files are supported" |
| SharedArrayBuffer not available | Inline error with browser recommendation |
| Upload fails mid-way | Retry button; partial upload cleaned up from Storage |
| Unsupported embed URL | Inline error: "Only YouTube, TikTok, and Rumble links are supported" |
| Non-approved creator opens composer | Composer not accessible; "Post a Video" button not rendered |

---

## 11. Out of Scope (v1)

- Server-side transcoding or thumbnail generation
- Search or filters on the video feed
- Video collections / playlists
- View count tracking (likes + comments only)
- Download button
- Share functionality
- Mobile-native video recording

---

## 12. Open Questions (resolved)

| Question | Decision |
|---|---|
| Embed vs upload? | Both on day one |
| Who can post? | Approved creators (gated by admin) |
| Feed layout? | Card List (matches blog) |
| Interactions? | Likes + comments |
| Compression strategy? | ffmpeg.wasm in Web Worker, client-side |
| Theming? | Full dark/light using existing CSS variable pattern |
