# Video Upload Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/videos` feed to jwstudy.org where approved community members can post YouTube/TikTok/Rumble embeds or direct MP4 uploads (with client-side ffmpeg.wasm compression), with likes, comments, and an admin creator approval system.

**Architecture:** The app uses a custom SPA router (`src/lib/router.ts` parsePath/buildPath) — all new routes are added there and wired in `src/AuthedApp.tsx`. API calls follow the `src/api/*.ts` → `src/hooks/use*.ts` → React Query pattern. Supabase Storage `videos` bucket (private, signed URLs) holds uploaded files. `video_comments` is a separate table — **not** `blog_comments`, because `blog_comments.post_id` is a FK to `blog_posts`.

**Tech Stack:** React 18, TypeScript, React Query (`@tanstack/react-query`), Supabase (DB + Storage), `@ffmpeg/ffmpeg` + `@ffmpeg/util` (browser-side compression via Web Worker), Vitest (unit tests)

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `supabase/migrations/20260411_video_feature.sql` | Create | All DDL: tables, RLS, RPCs |
| `src/types/supabase.ts` | Modify | Add types for new tables + `is_approved_creator` on profiles |
| `src/utils/videoEmbed.ts` | Create | Pure utils: `parseEmbedUrl`, `validateVideoFile`, `generateVideoSlug` |
| `src/utils/__tests__/videoEmbed.test.ts` | Create | Unit tests for the above |
| `src/api/videos.ts` | Create | All Supabase calls for videos feature |
| `src/hooks/useVideos.ts` | Create | React Query hooks wrapping `videosApi` |
| `src/lib/videoCompress.ts` | Create | ffmpeg.wasm compression (lazy-loaded) |
| `src/lib/router.ts` | Modify | Add `videos`, `videoDetail`, `videosDash`, `creatorRequest` nav states |
| `src/AuthedApp.tsx` | Modify | Register new routes and lazy imports |
| `src/App.tsx` | Modify | Add public `/videos` pre-auth route |
| `src/styles/videos.css` | Create | All CSS for feed, player, composer, creator request |
| `src/views/videos/VideosPage.tsx` | Create | Public `/videos` feed (card list) |
| `src/views/videos/VideoDetailPage.tsx` | Create | `/videos/:slug` player with likes + comments |
| `src/views/videos/VideoComposerPage.tsx` | Create | Post composer (link embed tab + file upload tab) |
| `src/views/videos/CreatorRequestPage.tsx` | Create | Apply to become an approved creator |
| `src/views/admin/AdminPage.tsx` | Modify | Add "Creators" tab for request queue |
| `src/components/TopBar.tsx` | Modify | Add "Post a Video" button for approved creators |

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260411_video_feature.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 1. Creator approval flag on profiles
alter table profiles add column if not exists is_approved_creator boolean not null default false;

-- 2. Creator requests
create table if not exists creator_requests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references profiles(id) on delete cascade not null,
  display_name      text not null,
  topic_description text not null,
  sample_url        text,
  status            text not null default 'pending',
  reviewed_by       uuid references profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  constraint creator_requests_user_unique unique (user_id),
  constraint creator_requests_status_check check (status in ('pending','approved','denied'))
);

-- 3. Videos
create table if not exists videos (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  description   text,
  creator_id    uuid references profiles(id) on delete cascade not null,
  embed_url     text,
  storage_path  text,
  duration_sec  int,
  thumbnail_url text,
  published     boolean not null default false,
  likes_count   int not null default 0,
  created_at    timestamptz not null default now(),
  constraint videos_source_check check (
    (embed_url is not null and storage_path is null)
    or (embed_url is null and storage_path is not null)
  )
);

-- 4. Video likes (composite PK prevents duplicate likes)
create table if not exists video_likes (
  user_id    uuid references profiles(id) on delete cascade not null,
  video_id   uuid references videos(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- 5. Video comments (separate table — blog_comments.post_id is FK to blog_posts)
create table if not exists video_comments (
  id         uuid primary key default gen_random_uuid(),
  video_id   uuid references videos(id) on delete cascade not null,
  author_id  uuid references profiles(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz not null default now()
);

-- 6. RLS: creator_requests
alter table creator_requests enable row level security;
create policy "members can insert own request" on creator_requests
  for insert with check (auth.uid() = user_id);
create policy "members can view own request" on creator_requests
  for select using (auth.uid() = user_id);
create policy "admins can manage all requests" on creator_requests
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- 7. RLS: videos
alter table videos enable row level security;
create policy "public can view published videos" on videos
  for select using (published = true);
create policy "creators can view own videos" on videos
  for select using (auth.uid() = creator_id);
create policy "approved creators can insert" on videos
  for insert with check (
    auth.uid() = creator_id and
    exists (select 1 from profiles where id = auth.uid() and is_approved_creator = true)
  );
create policy "creators can update own videos" on videos
  for update using (auth.uid() = creator_id);
create policy "admins can manage all videos" on videos
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- 8. RLS: video_likes
alter table video_likes enable row level security;
create policy "authenticated can like" on video_likes
  for insert with check (auth.uid() = user_id);
create policy "users can unlike" on video_likes
  for delete using (auth.uid() = user_id);
create policy "anyone can view likes" on video_likes
  for select using (true);

-- 9. RLS: video_comments
alter table video_comments enable row level security;
create policy "anyone can view video comments" on video_comments
  for select using (true);
create policy "authenticated can comment on video" on video_comments
  for insert with check (auth.uid() = author_id);
create policy "authors can delete own video comment" on video_comments
  for delete using (auth.uid() = author_id);
create policy "admins can delete any video comment" on video_comments
  for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- 10. RPC: toggle_video_like → returns {liked: bool, likes_count: int}
create or replace function toggle_video_like(p_video_id uuid)
returns json language plpgsql security definer as $$
declare
  v_user_id uuid := auth.uid();
  v_liked   boolean;
  v_count   int;
begin
  if exists (select 1 from video_likes where user_id = v_user_id and video_id = p_video_id) then
    delete from video_likes where user_id = v_user_id and video_id = p_video_id;
    update videos set likes_count = greatest(0, likes_count - 1) where id = p_video_id;
    v_liked := false;
  else
    insert into video_likes (user_id, video_id) values (v_user_id, p_video_id);
    update videos set likes_count = likes_count + 1 where id = p_video_id;
    v_liked := true;
  end if;
  select likes_count into v_count from videos where id = p_video_id;
  return json_build_object('liked', v_liked, 'likes_count', v_count);
end;
$$;

-- 11. RPC: admin_approve_creator
create or replace function admin_approve_creator(p_user_id uuid, p_approved boolean)
returns void language plpgsql security definer as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin = true) then
    raise exception 'Not authorized';
  end if;
  update profiles set is_approved_creator = p_approved where id = p_user_id;
  update creator_requests
    set status      = case when p_approved then 'approved' else 'denied' end,
        reviewed_by = auth.uid(),
        reviewed_at = now()
  where user_id = p_user_id;
end;
$$;
```

- [ ] **Step 2: Apply the migration**

Run the SQL above in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).

Then create the Storage bucket:
1. Supabase Dashboard → Storage → New bucket
2. Name: `videos`, Public: **off** (private)
3. Click "Create bucket"

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260411_video_feature.sql
git commit -m "feat(db): add videos, video_comments, creator_requests tables with RLS and RPCs"
```

---

## Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/supabase.ts`

- [ ] **Step 1: Add `is_approved_creator` to profiles**

Find the `profiles` table Row (line ~1250). Add after `can_blog: boolean`:
```typescript
          is_approved_creator: boolean
```

In the profiles Insert type (line ~1283), add after `can_blog?: boolean`:
```typescript
          is_approved_creator?: boolean
```

In the profiles Update type (line ~1313), add after `can_blog?: boolean`:
```typescript
          is_approved_creator?: boolean
```

- [ ] **Step 2: Add new table types**

Find the closing `}` of the last table entry before the `Views:` section. After it, add:

```typescript
      creator_requests: {
        Row: {
          id: string
          user_id: string
          display_name: string
          topic_description: string
          sample_url: string | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          display_name: string
          topic_description: string
          sample_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          display_name?: string
          topic_description?: string
          sample_url?: string | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          creator_id: string
          embed_url: string | null
          storage_path: string | null
          duration_sec: number | null
          thumbnail_url: string | null
          published: boolean
          likes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          creator_id: string
          embed_url?: string | null
          storage_path?: string | null
          duration_sec?: number | null
          thumbnail_url?: string | null
          published?: boolean
          likes_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          creator_id?: string
          embed_url?: string | null
          storage_path?: string | null
          duration_sec?: number | null
          thumbnail_url?: string | null
          published?: boolean
          likes_count?: number
          created_at?: string
        }
        Relationships: []
      }
      video_likes: {
        Row: { user_id: string; video_id: string; created_at: string }
        Insert: { user_id: string; video_id: string; created_at?: string }
        Update: { user_id?: string; video_id?: string; created_at?: string }
        Relationships: []
      }
      video_comments: {
        Row: {
          id: string
          video_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          author_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          author_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
```

- [ ] **Step 3: Commit**

```bash
git add src/types/supabase.ts
git commit -m "feat(types): add videos, video_comments, creator_requests, video_likes types + is_approved_creator"
```

---

## Task 3: Embed URL parser utility + tests

**Files:**
- Create: `src/utils/videoEmbed.ts`
- Create: `src/utils/__tests__/videoEmbed.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/utils/__tests__/videoEmbed.test.ts
import { describe, it, expect } from "vitest";
import { parseEmbedUrl, validateVideoFile, generateVideoSlug } from "../videoEmbed.js";

describe("parseEmbedUrl", () => {
  it("parses youtube.com/watch URL", () => {
    expect(parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
  it("parses youtu.be short URL", () => {
    expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ"))
      .toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
  it("parses rumble.com/v URL", () => {
    expect(parseEmbedUrl("https://rumble.com/v4abc123-some-title.html"))
      .toBe("https://rumble.com/embed/v4abc123");
  });
  it("parses tiktok.com video URL", () => {
    expect(parseEmbedUrl("https://www.tiktok.com/@user/video/1234567890"))
      .toBe("https://www.tiktok.com/embed/v2/1234567890");
  });
  it("returns null for unsupported domain", () => {
    expect(parseEmbedUrl("https://vimeo.com/12345")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseEmbedUrl("")).toBeNull();
  });
});

describe("validateVideoFile", () => {
  it("accepts MP4 under 500 MB", () => {
    const f = new File(["x"], "test.mp4", { type: "video/mp4" });
    expect(validateVideoFile(f)).toBeNull();
  });
  it("rejects unsupported type", () => {
    const f = new File(["x"], "test.avi", { type: "video/avi" });
    expect(validateVideoFile(f)).toMatch(/MP4, MOV, WebM/);
  });
  it("rejects file over 500 MB", () => {
    const f = new File(["x"], "big.mp4", { type: "video/mp4" });
    Object.defineProperty(f, "size", { value: 600 * 1024 * 1024 });
    expect(validateVideoFile(f)).toMatch(/500 MB/);
  });
});

describe("generateVideoSlug", () => {
  it("converts title to kebab-case with suffix", () => {
    const slug = generateVideoSlug("Is the Angel of Jehovah God?");
    expect(slug).toMatch(/^is-the-angel-of-jehovah-god-[a-z0-9]+$/);
  });
  it("strips special characters", () => {
    const slug = generateVideoSlug("Hello, World!");
    expect(slug).toMatch(/^hello-world-[a-z0-9]+$/);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/utils/__tests__/videoEmbed.test.ts
```
Expected: FAIL — "Cannot find module '../videoEmbed.js'"

- [ ] **Step 3: Implement the utility**

```typescript
// src/utils/videoEmbed.ts

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

/** Returns the iframe embed src for supported platforms, or null. */
export function parseEmbedUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" && url.pathname === "/watch") {
    const v = url.searchParams.get("v");
    return v ? `https://www.youtube.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (host === "rumble.com") {
    const match = url.pathname.match(/^\/(v[a-z0-9]+)/i);
    return match ? `https://rumble.com/embed/${match[1]}` : null;
  }
  if (host === "tiktok.com") {
    const match = url.pathname.match(/\/video\/(\d+)/);
    return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : null;
  }
  return null;
}

/** Returns an error message, or null if the file is valid. */
export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return "Only MP4, MOV, and WebM files are supported.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "File too large. Maximum size is 500 MB.";
  }
  return null;
}

/** URL-safe kebab-case slug with a short timestamp suffix to prevent collisions. */
export function generateVideoSlug(title: string): string {
  return (
    title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-") +
    "-" +
    Date.now().toString(36)
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/utils/__tests__/videoEmbed.test.ts
```
Expected: 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/videoEmbed.ts src/utils/__tests__/videoEmbed.test.ts
git commit -m "feat(utils): add parseEmbedUrl, validateVideoFile, generateVideoSlug with tests"
```

---

## Task 4: Video API

**Files:**
- Create: `src/api/videos.ts`

- [ ] **Step 1: Write the API module**

```typescript
// src/api/videos.ts
import { supabase } from "../lib/supabase";
import { generateVideoSlug } from "../utils/videoEmbed";
import { assertNoPII } from "../lib/pii";

export interface VideoInput {
  title: string;
  description?: string;
  embed_url?: string;
  storage_path?: string;
  duration_sec?: number;
  thumbnail_url?: string;
}

export interface VideoComment {
  id: string;
  video_id: string;
  author_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export const videosApi = {
  listPublished: async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("id, slug, title, description, creator_id, embed_url, storage_path, thumbnail_url, duration_sec, likes_count, created_at, profiles!creator_id(display_name, avatar_url)")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from("videos")
      .select("*, profiles!creator_id(display_name, avatar_url)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    // Generate a 1-hour signed URL for private Storage files
    if (data.storage_path) {
      const { data: signed } = await supabase.storage
        .from("videos")
        .createSignedUrl(data.storage_path, 3600);
      return { ...data, playback_url: signed?.signedUrl ?? null };
    }
    return { ...data, playback_url: null };
  },

  create: async (userId: string, input: VideoInput) => {
    const slug = generateVideoSlug(input.title);
    const { data, error } = await supabase
      .from("videos")
      .insert({ creator_id: userId, slug, ...input })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** Upload a compressed video file, returns storage_path. */
  uploadFile: async (userId: string, file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "mp4";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("videos")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    return path;
  },

  listComments: async (videoId: string): Promise<VideoComment[]> => {
    const { data, error } = await supabase
      .from("video_comments")
      .select("*, profiles!author_id(display_name, avatar_url)")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as VideoComment[];
  },

  createComment: async (userId: string, videoId: string, content: string): Promise<VideoComment> => {
    assertNoPII(content);
    const { data, error } = await supabase
      .from("video_comments")
      .insert({ author_id: userId, video_id: videoId, content })
      .select("*, profiles!author_id(display_name, avatar_url)")
      .single();
    if (error) throw new Error(error.message);
    return data as VideoComment;
  },

  deleteComment: async (commentId: string) => {
    const { error } = await supabase.from("video_comments").delete().eq("id", commentId);
    if (error) throw new Error(error.message);
  },

  toggleLike: async (videoId: string): Promise<{ liked: boolean; likes_count: number }> => {
    const { data, error } = await supabase.rpc("toggle_video_like", { p_video_id: videoId });
    if (error) throw new Error(error.message);
    return data as { liked: boolean; likes_count: number };
  },

  getUserLikedVideoIds: async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase
      .from("video_likes")
      .select("video_id")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: { video_id: string }) => r.video_id);
  },

  submitCreatorRequest: async (
    userId: string,
    req: { display_name: string; topic_description: string; sample_url?: string }
  ) => {
    const { data, error } = await supabase
      .from("creator_requests")
      .upsert({ user_id: userId, ...req, status: "pending" }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  getMyCreatorRequest: async (userId: string) => {
    const { data, error } = await supabase
      .from("creator_requests")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  adminListCreatorRequests: async () => {
    const { data, error } = await supabase
      .from("creator_requests")
      .select("*, profiles!user_id(display_name, email, created_at)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  adminSetCreatorApproval: async (userId: string, approved: boolean) => {
    const { error } = await supabase.rpc("admin_approve_creator", { p_user_id: userId, p_approved: approved });
    if (error) throw new Error(error.message);
  },

  adminSetPublished: async (videoId: string, published: boolean) => {
    const { error } = await supabase.from("videos").update({ published }).eq("id", videoId);
    if (error) throw new Error(error.message);
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/api/videos.ts
git commit -m "feat(api): add videosApi with CRUD, likes, comments, creator requests, signed URLs"
```

---

## Task 5: Video hooks

**Files:**
- Create: `src/hooks/useVideos.ts`

- [ ] **Step 1: Write the hooks**

```typescript
// src/hooks/useVideos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videosApi, VideoInput } from "../api/videos";

export function usePublishedVideos() {
  return useQuery({
    queryKey: ["videos", "published"],
    queryFn: videosApi.listPublished,
    staleTime: 2 * 60 * 1000,
  });
}

export function useVideoBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["videos", "detail", slug],
    queryFn: () => videosApi.getBySlug(slug!),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateVideo(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VideoInput) => videosApi.create(userId!, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", "published"] }),
  });
}

export function useVideoComments(videoId: string | undefined) {
  return useQuery({
    queryKey: ["videos", "comments", videoId],
    queryFn: () => videosApi.listComments(videoId!),
    enabled: !!videoId,
    staleTime: 60 * 1000,
  });
}

export function useCreateVideoComment(videoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      videosApi.createComment(userId, videoId!, content),
    onSuccess: (newComment) => {
      qc.setQueryData(["videos", "comments", videoId], (prev: unknown[] = []) => [
        ...prev,
        newComment,
      ]);
    },
  });
}

export function useDeleteVideoComment(videoId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => videosApi.deleteComment(commentId),
    onSuccess: (_, commentId) => {
      qc.setQueryData(
        ["videos", "comments", videoId],
        (prev: Array<{ id: string }> = []) => prev.filter((c) => c.id !== commentId)
      );
    },
  });
}

export function useUserLikedVideoIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["videos", "likes", userId],
    queryFn: () => videosApi.getUserLikedVideoIds(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useToggleVideoLike(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => videosApi.toggleLike(videoId),
    onSuccess: (result: { liked: boolean; likes_count: number }, videoId) => {
      qc.setQueryData(["videos", "likes", userId], (prev: string[] = []) =>
        result.liked ? [...prev, videoId] : prev.filter((id) => id !== videoId)
      );
      qc.setQueryData(
        ["videos", "published"],
        (prev: Array<{ id: string; likes_count: number }> = []) =>
          prev.map((v) => (v.id === videoId ? { ...v, likes_count: result.likes_count } : v))
      );
      qc.setQueriesData(
        { queryKey: ["videos", "detail"] },
        (prev: { id: string; likes_count: number } | undefined) =>
          prev?.id === videoId ? { ...prev, likes_count: result.likes_count } : prev
      );
    },
  });
}

export function useMyCreatorRequest(userId: string | undefined) {
  return useQuery({
    queryKey: ["creator-request", userId],
    queryFn: () => videosApi.getMyCreatorRequest(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitCreatorRequest(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: { display_name: string; topic_description: string; sample_url?: string }) =>
      videosApi.submitCreatorRequest(userId!, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["creator-request", userId] }),
  });
}

export function useAdminCreatorRequests() {
  return useQuery({
    queryKey: ["admin", "creator-requests"],
    queryFn: videosApi.adminListCreatorRequests,
    staleTime: 30 * 1000,
  });
}

export function useAdminSetCreatorApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, approved }: { userId: string; approved: boolean }) =>
      videosApi.adminSetCreatorApproval(userId, approved),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "creator-requests"] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminSetVideoPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ videoId, published }: { videoId: string; published: boolean }) =>
      videosApi.adminSetPublished(videoId, published),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["videos", "published"] }),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useVideos.ts
git commit -m "feat(hooks): add useVideos, useVideoComments, useToggleVideoLike, creator request hooks"
```

---

## Task 6: Router updates

**Files:**
- Modify: `src/lib/router.ts`
- Modify: `src/AuthedApp.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add nav states to `src/lib/router.ts`**

In the `NavState` union, add after `| { page: "community" }`:

```typescript
  | { page: "videos" }
  | { page: "videoDetail"; slug: string }
  | { page: "videosDash" }
  | { page: "creatorRequest" }
```

In `parsePath()`, add before the final `return { page: "notFound" }`:

```typescript
  if (h === "videos") return { page: "videos" };
  if (h.startsWith("videos/")) return { page: "videoDetail", slug: decodeURIComponent(h.slice(7)) };
  if (h === "videos-dash") return { page: "videosDash" };
  if (h === "creator-request") return { page: "creatorRequest" };
```

In `buildPath()`, add to the switch:

```typescript
    case "videos":         return "/videos";
    case "videoDetail":    return `/videos/${encodeURIComponent(params.slug as string)}`;
    case "videosDash":     return "/videos-dash";
    case "creatorRequest": return "/creator-request";
```

- [ ] **Step 2: Wire routes in `src/AuthedApp.tsx`**

Add lazy imports (after the existing block):

```typescript
const VideosPage        = lazy(() => import("./views/videos/VideosPage"));
const VideoDetailPage   = lazy(() => import("./views/videos/VideoDetailPage"));
const VideoComposerPage = lazy(() => import("./views/videos/VideoComposerPage"));
const CreatorRequestPage = lazy(() => import("./views/videos/CreatorRequestPage"));
```

Add `"videos"` to the `HOME_PANELS` set:

```typescript
const HOME_PANELS = new Set(["quiz", "quizLevel", "advancedQuiz", "advancedQuizLevel", "leaderboard", "familyQuiz", "forum", "blog", "readingPlans", "studyNotes", "meetingPrep", "friends", "admin", "profile", "videos"]);
```

In the `navigate()` function URL mapping, add:

```typescript
else if (page === "videos") url = params?.slug ? `/videos/${params.slug}` : "/videos";
```

In the page rendering block, add after the `community` block:

```typescript
  else if (nav.page === "videos") pageContent = (
    <Page>
      <AL page="videos">
        <VideosPage
          user={user}
          profile={profile}
          onSelectVideo={(slug) => navigate("videoDetail", { slug })}
          onBack={() => navigate("home")}
          onPostClick={() => navigate("videosDash")}
          {...sharedNav}
        />
      </AL>
    </Page>
  );
  else if (nav.page === "videoDetail") pageContent = (
    <Page>
      <AL page="videos">
        <VideoDetailPage
          user={user}
          slug={(nav as any).slug}
          onBack={() => navigate("videos")}
          {...sharedNav}
        />
      </AL>
    </Page>
  );
  else if (nav.page === "videosDash") {
    if (!profileLoading && profile && !profile.is_approved_creator && !profile.is_admin) navigate("videos");
    else if (!profile || profile.is_approved_creator || profile.is_admin) pageContent = (
      <Page>
        <VideoComposerPage user={user} onBack={() => navigate("videos")} {...sharedNav} />
      </Page>
    );
  }
  else if (nav.page === "creatorRequest") pageContent = (
    <Page>
      <CreatorRequestPage user={user} onBack={() => navigate("videos")} {...sharedNav} />
    </Page>
  );
```

- [ ] **Step 3: Add public pre-auth route in `src/App.tsx`**

Add lazy import at the top:
```typescript
const VideosPage = lazy(() => import("./views/videos/VideosPage"));
```

After the `isBlogPath` block (around line 105), add:

```typescript
  const isVideosPath = preAuthPath === "videos" || preAuthPath.startsWith("videos/");
  if (isVideosPath) {
    const videoSlug = preAuthPath.startsWith("videos/") ? preAuthPath.slice(7) || null : null;
    const goLanding = () => { history.pushState(null, "", "/"); setPreAuthPath(""); };
    const goVideoList = () => { history.pushState(null, "", "/videos"); setPreAuthPath("videos"); };
    const goVideoDetail = (slug: string) => {
      history.pushState(null, "", `/videos/${slug}`); setPreAuthPath(`videos/${slug}`);
    };
    const videoNav = (page: string, params: any) => {
      if (page === "videos") return params?.slug ? goVideoDetail(params.slug) : goVideoList();
      setShowApp(true);
    };
    return (
      <main id="main-content">
        <Suspense fallback={<LoadingSpinner className="spinner-wrap--fullscreen" />}>
          <VideosPage
            user={null}
            profile={null}
            slug={videoSlug}
            onSelectVideo={goVideoDetail}
            onBack={goLanding}
            onPostClick={() => setShowApp(true)}
            navigate={videoNav}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            i18n={i18n}
            onLogout={null}
            onUpgrade={() => setShowApp(true)}
          />
        </Suspense>
      </main>
    );
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/router.ts src/AuthedApp.tsx src/App.tsx
git commit -m "feat(router): add videos, videoDetail, videosDash, creatorRequest routes"
```

---

## Task 7: videos.css

**Files:**
- Create: `src/styles/videos.css`

- [ ] **Step 1: Write the CSS**

```css
/* src/styles/videos.css */

/* ── Layout ─────────────────────────────────────────────── */
.videos-wrap { min-height: 100vh; background: var(--bg); }

/* ── Nav bar ─────────────────────────────────────────────── */
.videos-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 52px;
  z-index: 40;
}
.videos-nav-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); }

/* ── Feed ───────────────────────────────────────────────── */
.videos-feed {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Card List item ─────────────────────────────────────── */
.video-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 12px);
  cursor: pointer;
  transition: border-color 150ms, transform 150ms;
  text-decoration: none;
}
.video-card:hover { border-color: rgba(124,58,237,0.4); transform: translateY(-1px); }

.video-card-thumb {
  width: 120px;
  height: 68px;
  border-radius: 6px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--bg-elevated, #1a1332), rgba(79,45,133,0.4));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.video-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
.video-card-play {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
}
.video-card-play svg { fill: #fff; width: 12px; height: 12px; margin-left: 2px; }
.video-card-dur {
  position: absolute; bottom: 3px; right: 4px;
  background: rgba(0,0,0,0.75); color: #fff;
  font-size: 0.6rem; padding: 1px 4px; border-radius: 3px;
}
.video-card-body { flex: 1; min-width: 0; }
.video-card-title {
  font-size: 0.9rem; font-weight: 700; color: var(--text-primary);
  margin: 0 0 4px; line-height: 1.35;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.video-card-meta { font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 4px; }
.video-card-desc {
  font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ── Post / Apply buttons ───────────────────────────────── */
.videos-post-btn {
  background: var(--teal, #6d28d9); color: #fff;
  border: none; font-family: inherit; font-size: 12px; font-weight: 700;
  padding: 8px 16px; border-radius: var(--radius-sm, 6px); cursor: pointer;
  transition: filter 150ms, transform 100ms;
}
.videos-post-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }

/* ── Empty / skeleton ───────────────────────────────────── */
.videos-empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); font-size: 0.9rem; }
.video-card-skeleton {
  display: flex; gap: 12px; padding: 12px;
  background: var(--card-bg); border: 1px solid var(--border); border-radius: var(--radius-md, 12px);
}
.video-card-skeleton-thumb { width: 120px; height: 68px; border-radius: 6px; flex-shrink: 0; }
.video-card-skeleton-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }

/* ── Light mode ─────────────────────────────────────────── */
[data-theme="light"] .video-card-thumb { background: linear-gradient(135deg, #f0eaff, #e5d5ff); }

/* ── Player page ─────────────────────────────────────────── */
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
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 24px;
}
.video-like-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid var(--border); border-radius: 20px;
  padding: 6px 14px; font-family: inherit; font-size: 0.8rem; font-weight: 600;
  color: var(--text-secondary); cursor: pointer; transition: border-color 150ms, color 150ms;
}
.video-like-btn:hover { border-color: rgba(124,58,237,0.5); color: #a78bfa; }
.video-like-btn.liked { border-color: #7c3aed; color: #a78bfa; }
.video-like-btn svg { width: 16px; height: 16px; }

/* ── Comments ───────────────────────────────────────────── */
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
.video-comment-form { display: flex; gap: 8px; margin-top: 12px; }
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

/* ── Composer ───────────────────────────────────────────── */
.video-composer {
  background: var(--bg-elevated, #1a1332);
  border: 1.5px solid rgba(124,58,237,0.25); border-radius: 16px;
  width: 100%; max-width: 480px; overflow: hidden;
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

/* ── Creator request ────────────────────────────────────── */
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

- [ ] **Step 2: Commit**

```bash
git add src/styles/videos.css
git commit -m "feat(styles): add videos.css for feed, player, composer, creator request"
```

---

## Task 8: ffmpeg.wasm compression library

**Files:**
- Create: `src/lib/videoCompress.ts`

- [ ] **Step 1: Install packages**

```bash
npm install @ffmpeg/ffmpeg @ffmpeg/util
```

Expected: packages added to `package.json` and `package-lock.json`.

- [ ] **Step 2: Write the compression module**

```typescript
// src/lib/videoCompress.ts
// Lazy-loaded — only imported when the user opens the Upload File tab.
// ffmpeg.wasm runs entirely in the browser; no server round-trip needed.

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface CompressProgress {
  ratio: number;       // 0–1
  originalMB: number;
  compressedMB: number;
}

/**
 * Compresses a video file using ffmpeg.wasm.
 * Targets H.264 at 720p, CRF 28, 2 Mbps max — turns a 200 MB phone video into ~40–50 MB.
 *
 * Requires SharedArrayBuffer (Chrome/Firefox with proper COOP/COEP headers).
 * Throws a descriptive error if the browser doesn't support it.
 */
export async function compressVideo(
  file: File,
  onProgress?: (p: CompressProgress) => void
): Promise<File> {
  if (typeof SharedArrayBuffer === "undefined") {
    throw new Error(
      "Your browser doesn't support in-browser compression. Please use Chrome or Firefox, or compress the video before uploading."
    );
  }

  const originalMB = file.size / (1024 * 1024);
  const ffmpeg = new FFmpeg();

  // Core hosted on jsDelivr CDN (~10 MB), cached after first load.
  const baseURL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  let durationSec = 0;
  ffmpeg.on("log", ({ message }) => {
    const m = message.match(/Duration:\s+(\d+):(\d+):(\d+)/);
    if (m) durationSec = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
  });
  ffmpeg.on("progress", ({ time }) => {
    if (durationSec > 0 && onProgress) {
      const ratio = Math.min(time / durationSec, 0.99);
      onProgress({ ratio, originalMB, compressedMB: originalMB * (1 - ratio * 0.75) });
    }
  });

  const inputName = "input" + file.name.slice(file.name.lastIndexOf("."));
  const outputName = "output.mp4";

  await ffmpeg.writeFile(inputName, await fetchFile(file));
  await ffmpeg.exec([
    "-i", inputName,
    "-vf", "scale=-2:720",
    "-c:v", "libx264",
    "-crf", "28",
    "-preset", "fast",
    "-maxrate", "2000k",
    "-bufsize", "4000k",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data], { type: "video/mp4" });
  onProgress?.({ ratio: 1, originalMB, compressedMB: blob.size / (1024 * 1024) });

  return new File([blob], outputName, { type: "video/mp4" });
}
```

- [ ] **Step 3: Add COOP/COEP headers for SharedArrayBuffer**

ffmpeg.wasm requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. Check if `vercel.json` exists:

```bash
cat vercel.json 2>/dev/null || echo "MISSING"
```

If it exists, add to the `headers` array:
```json
{
  "source": "/(.*)",
  "headers": [
    { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
    { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
  ]
}
```

If it doesn't exist, create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

**Note:** These headers break some third-party iframes (embeds). Test that YouTube/TikTok/Rumble `<iframe>` embeds still load after adding them. If they break, scope the headers only to the `/videos-dash` route and add `crossorigin="anonymous"` to the iframes.

- [ ] **Step 4: Commit**

```bash
git add src/lib/videoCompress.ts vercel.json
git commit -m "feat(lib): add videoCompress.ts (ffmpeg.wasm H.264 720p) + COOP/COEP headers"
```

---

## Task 9: Video composer page

**Files:**
- Create: `src/views/videos/VideoComposerPage.tsx`

- [ ] **Step 1: Write the composer**

```tsx
// src/views/videos/VideoComposerPage.tsx
import { useState, useRef } from "react";
import TopBar from "../../components/TopBar";
import { useCreateVideo } from "../../hooks/useVideos";
import { validateVideoFile, parseEmbedUrl } from "../../utils/videoEmbed";
import { videosApi } from "../../api/videos";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

const VideoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2"/>
  </svg>
);

interface Props {
  user: { id: string } | null;
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

export default function VideoComposerPage({ user, onBack, navigate, ...sharedNav }: Props) {
  const [tab, setTab] = useState<"link" | "upload">("link");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [linkError, setLinkError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [compressProgress, setCompressProgress] = useState<{ ratio: number; originalMB: number; compressedMB: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createVideo = useCreateVideo(user?.id);

  function handleLinkChange(url: string) {
    setLinkUrl(url);
    setLinkError("");
    if (!url.trim()) { setEmbedUrl(null); return; }
    const embed = parseEmbedUrl(url.trim());
    if (embed) {
      setEmbedUrl(embed);
    } else {
      setEmbedUrl(null);
      if (url.length > 10) setLinkError("Only YouTube, TikTok, and Rumble links are supported.");
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }

  function selectFile(f: File) {
    setFileError("");
    const err = validateVideoFile(f);
    if (err) { setFileError(err); return; }
    setFile(f);
  }

  async function handleSubmit() {
    if (!user) return;
    if (!title.trim()) { toast("Title is required."); return; }
    try {
      setUploading(true);
      if (tab === "link") {
        if (!embedUrl) { toast("Enter a valid YouTube, TikTok, or Rumble link."); return; }
        await createVideo.mutateAsync({ title: title.trim(), description: description.trim() || undefined, embed_url: embedUrl });
        toast("Video submitted for review!");
        onBack();
        return;
      }
      if (!file) { toast("Please select a video file."); return; }
      // Lazy-load compression — not in the initial bundle
      const { compressVideo } = await import("../../lib/videoCompress");
      let compressed: File;
      try {
        compressed = await compressVideo(file, setCompressProgress);
      } catch (compressErr: any) {
        if (compressErr.message?.includes("SharedArrayBuffer")) {
          toast("Compression not available — uploading original. Use Chrome for best results.", "warn");
          compressed = file;
        } else {
          throw compressErr;
        }
      }
      const storage_path = await videosApi.uploadFile(user.id, compressed);
      await createVideo.mutateAsync({ title: title.trim(), description: description.trim() || undefined, storage_path });
      toast("Video submitted for review!");
      onBack();
    } catch (err: any) {
      toast(err.message ?? "Failed to submit. Please try again.");
    } finally {
      setUploading(false);
      setCompressProgress(null);
    }
  }

  const isCompressing = compressProgress !== null && compressProgress.ratio < 1;
  const submitLabel = isCompressing
    ? `Compressing… ${Math.round((compressProgress?.ratio ?? 0) * 100)}%`
    : uploading ? "Uploading…"
    : "Submit for review";
  const canSubmit = !isCompressing && !uploading && !!title.trim() && (tab === "link" ? !!embedUrl : !!file);

  return (
    <div className="videos-wrap">
      <TopBar navigate={navigate} currentPage="videos" {...sharedNav} />
      <div style={{ maxWidth: 520, margin: "40px auto", padding: "0 16px" }}>
        <div className="video-composer" style={{ position: "static", maxWidth: "100%" }}>
          <div className="video-composer-header">
            <VideoIcon />
            <h2>Post a Video</h2>
            <button className="video-composer-close" onClick={onBack} aria-label="Back">✕</button>
          </div>
          <div className="video-composer-tabs">
            <button className={`video-composer-tab${tab === "link" ? " active" : ""}`} onClick={() => setTab("link")}>Paste Link</button>
            <button className={`video-composer-tab${tab === "upload" ? " active" : ""}`} onClick={() => setTab("upload")}>Upload File</button>
          </div>
          <div className="video-composer-body">
            <div className="video-composer-field">
              <label className="video-composer-label">Title *</label>
              <input className="video-composer-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Is the Angel of Jehovah God?" maxLength={200} />
            </div>
            <div className="video-composer-field">
              <label className="video-composer-label">Description (optional)</label>
              <textarea className="video-composer-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief description…" maxLength={1000} />
            </div>

            {tab === "link" ? (
              <div className="video-composer-field">
                <label className="video-composer-label">YouTube, TikTok, or Rumble URL</label>
                <input className="video-composer-input" value={linkUrl} onChange={e => handleLinkChange(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
                {embedUrl && <div className="video-embed-badge">✓ Valid link detected</div>}
                {linkError && <div className="video-error-msg">{linkError}</div>}
              </div>
            ) : (
              <>
                {!file ? (
                  <div className="video-dropzone" onClick={() => fileInputRef.current?.click()} onDrop={handleFileDrop} onDragOver={e => e.preventDefault()}>
                    <div className="video-dropzone-text">
                      <strong>Drop video here</strong> or click to browse<br />
                      <span style={{ fontSize: "0.68rem", opacity: 0.6 }}>MP4, MOV, WebM · max 500 MB</span>
                    </div>
                    <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/webm" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) selectFile(f); }} />
                  </div>
                ) : compressProgress ? (
                  <div className="video-progress-panel">
                    <div className="video-progress-label">{compressProgress.ratio < 1 ? `Compressing… ${Math.round(compressProgress.ratio * 100)}%` : "Compression complete"}</div>
                    <div className="video-progress-bar"><div className="video-progress-fill" style={{ width: `${Math.round(compressProgress.ratio * 100)}%` }} /></div>
                    <div className="video-progress-stats">
                      <span>Original: {compressProgress.originalMB.toFixed(0)} MB</span>
                      <span style={{ color: "#34d399" }}>~{compressProgress.compressedMB.toFixed(0)} MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="video-progress-panel" style={{ cursor: "pointer" }} onClick={() => { setFile(null); setFileError(""); }}>
                    <div className="video-progress-label">📁 {file.name}</div>
                    <div style={{ fontSize: "0.65rem", color: "rgba(240,234,255,0.45)", marginTop: 2 }}>{(file.size / (1024 * 1024)).toFixed(0)} MB · Click to remove</div>
                  </div>
                )}
                {fileError && <div className="video-error-msg">{fileError}</div>}
              </>
            )}

            <button className="video-composer-submit" onClick={handleSubmit} disabled={!canSubmit}>{submitLabel}</button>
            <p style={{ fontSize: "0.68rem", color: "rgba(240,234,255,0.35)", textAlign: "center", marginTop: 8 }}>
              All videos are reviewed by an admin before appearing in the feed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/videos/VideoComposerPage.tsx
git commit -m "feat(ui): add VideoComposerPage with link embed and ffmpeg.wasm upload tabs"
```

---

## Task 10: Video feed page

**Files:**
- Create: `src/views/videos/VideosPage.tsx`

- [ ] **Step 1: Write the feed**

```tsx
// src/views/videos/VideosPage.tsx
import { useFullProfile } from "../../hooks/useAdmin";
import { usePublishedVideos } from "../../hooks/useVideos";
import TopBar from "../../components/TopBar";
import "../../styles/videos.css";

function formatDur(sec: number | null): string {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function VideoCardSkeleton() {
  return (
    <div className="video-card-skeleton">
      <div className="video-card-skeleton-thumb skeleton" />
      <div className="video-card-skeleton-body">
        <div className="skeleton" style={{ height: 14, borderRadius: 4, width: "80%" }} />
        <div className="skeleton" style={{ height: 10, borderRadius: 4, width: "50%" }} />
      </div>
    </div>
  );
}

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

export default function VideosPage({ user, onSelectVideo, onBack, onPostClick, navigate, ...sharedNav }: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: videos = [], isLoading } = usePublishedVideos();
  const canPost = profile?.is_approved_creator || profile?.is_admin;

  return (
    <div className="videos-wrap">
      {user && <TopBar navigate={navigate} currentPage="videos" {...sharedNav} />}
      <nav className="videos-nav">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem" }} aria-label="Back">← Back</button>
        <span className="videos-nav-title">Videos</span>
        {canPost
          ? <button className="videos-post-btn" onClick={onPostClick}>+ Post a Video</button>
          : user
            ? <button className="videos-post-btn" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }} onClick={() => navigate("creatorRequest")}>Apply to post</button>
            : <span />
        }
      </nav>
      <div className="videos-feed">
        {isLoading && [0,1,2,3].map(i => <VideoCardSkeleton key={i} />)}
        {!isLoading && videos.length === 0 && (
          <div className="videos-empty">No videos yet.{canPost ? " Be the first to post one!" : ""}</div>
        )}
        {!isLoading && (videos as any[]).map(video => (
          <div
            key={video.id}
            className="video-card"
            onClick={() => onSelectVideo(video.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === "Enter" && onSelectVideo(video.slug)}
          >
            <div className="video-card-thumb">
              {video.thumbnail_url
                ? <img src={video.thumbnail_url} alt={video.title} loading="lazy" />
                : <div className="video-card-play"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" fill="white"/></svg></div>
              }
              {video.duration_sec && <span className="video-card-dur">{formatDur(video.duration_sec)}</span>}
            </div>
            <div className="video-card-body">
              <div className="video-card-title">{video.title}</div>
              <div className="video-card-meta">{video.profiles?.display_name ?? "Unknown"} · {video.likes_count} likes</div>
              {video.description && <div className="video-card-desc">{video.description}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/videos/VideosPage.tsx
git commit -m "feat(ui): add VideosPage card list feed with skeletons"
```

---

## Task 11: Video detail/player page

**Files:**
- Create: `src/views/videos/VideoDetailPage.tsx`

- [ ] **Step 1: Write the player page**

```tsx
// src/views/videos/VideoDetailPage.tsx
import { useState } from "react";
import TopBar from "../../components/TopBar";
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

export default function VideoDetailPage({ user, slug, onBack, navigate, ...sharedNav }: Props) {
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

  if (isLoading) {
    return (
      <div className="videos-wrap">
        {user && <TopBar navigate={navigate} currentPage="videos" {...sharedNav} />}
        <div className="video-player-wrap">
          <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="videos-wrap">
        {user && <TopBar navigate={navigate} currentPage="videos" {...sharedNav} />}
        <div className="video-player-wrap">
          <div className="videos-empty">Video not found.</div>
          <button onClick={onBack} style={{ marginTop: 12, background: "none", border: "none", color: "#a78bfa", cursor: "pointer" }}>← Back to videos</button>
        </div>
      </div>
    );
  }

  const creatorName = (video.profiles as any)?.display_name ?? "Unknown";

  return (
    <div className="videos-wrap">
      {user && <TopBar navigate={navigate} currentPage="videos" {...sharedNav} />}
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

        <h1 className="video-player-title">{video.title}</h1>
        <div className="video-player-meta">{creatorName} · {formatDate(video.created_at, "long")}</div>
        {video.description && <div className="video-player-desc">{video.description}</div>}

        <div className="video-player-actions">
          <button className={`video-like-btn${liked ? " liked" : ""}`} onClick={handleLike} aria-label={liked ? "Unlike" : "Like"}>
            <HeartIcon filled={liked} />
            {video.likes_count} {video.likes_count === 1 ? "like" : "likes"}
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

- [ ] **Step 2: Commit**

```bash
git add src/views/videos/VideoDetailPage.tsx
git commit -m "feat(ui): add VideoDetailPage with iframe/video player, likes, comments"
```

---

## Task 12: Creator request page

**Files:**
- Create: `src/views/videos/CreatorRequestPage.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/views/videos/CreatorRequestPage.tsx
import { useState } from "react";
import TopBar from "../../components/TopBar";
import { useMyCreatorRequest, useSubmitCreatorRequest } from "../../hooks/useVideos";
import { useFullProfile } from "../../hooks/useAdmin";
import { toast } from "../../lib/toast";
import "../../styles/videos.css";

interface Props {
  user: { id: string } | null;
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

const STATUS_LABELS: Record<string, string> = {
  pending:  "⏳ Pending review — usually 24–48 hrs",
  approved: "✓ Approved — you can now post videos!",
  denied:   "✕ Request denied. Contact support for more information.",
};

export default function CreatorRequestPage({ user, onBack, navigate, ...sharedNav }: Props) {
  const { data: profile } = useFullProfile(user?.id);
  const { data: existingRequest, isLoading } = useMyCreatorRequest(user?.id);
  const submitRequest = useSubmitCreatorRequest(user?.id);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [topicDesc, setTopicDesc] = useState("");
  const [sampleUrl, setSampleUrl] = useState("");

  if (!isLoading && (profile as any)?.is_approved_creator) {
    navigate("videos");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !topicDesc.trim()) { toast("Display name and topic description are required."); return; }
    try {
      await submitRequest.mutateAsync({ display_name: displayName.trim(), topic_description: topicDesc.trim(), sample_url: sampleUrl.trim() || undefined });
      toast("Request submitted! We'll review it within 24–48 hours.");
    } catch (err: any) {
      toast(err.message ?? "Failed to submit.");
    }
  }

  return (
    <div className="videos-wrap">
      <TopBar navigate={navigate} currentPage="videos" {...sharedNav} />
      <div className="creator-request-wrap">
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem", marginBottom: 16 }}>← Back</button>
        <div className="creator-request-card">
          <div className="creator-request-title">Apply to Upload Videos</div>
          <div className="creator-request-sub">Approved creators can post YouTube/TikTok/Rumble embeds and MP4 uploads. All videos are reviewed before appearing in the feed.</div>
          {existingRequest ? (
            <div className={`creator-request-status ${(existingRequest as any).status}`}>
              {STATUS_LABELS[(existingRequest as any).status] ?? (existingRequest as any).status}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="video-composer-field">
                <label className="video-composer-label">Your display name *</label>
                <input className="video-composer-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Reductio" maxLength={60} />
              </div>
              <div className="video-composer-field">
                <label className="video-composer-label">What topics will you cover? *</label>
                <textarea className="video-composer-textarea" value={topicDesc} onChange={e => setTopicDesc(e.target.value)} placeholder="Theology, biblical Greek, JW studies…" maxLength={500} />
              </div>
              <div className="video-composer-field">
                <label className="video-composer-label">Sample video URL (optional)</label>
                <input className="video-composer-input" value={sampleUrl} onChange={e => setSampleUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
              </div>
              <button type="submit" className="video-composer-submit" disabled={submitRequest.isPending} style={{ marginTop: 4 }}>
                {submitRequest.isPending ? "Submitting…" : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/videos/CreatorRequestPage.tsx
git commit -m "feat(ui): add CreatorRequestPage with status display and form submission"
```

---

## Task 13: Admin — Creators tab

**Files:**
- Modify: `src/views/admin/AdminPage.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/views/admin/AdminPage.tsx`, add:

```typescript
import { useAdminCreatorRequests, useAdminSetCreatorApproval } from "../../hooks/useVideos";
```

- [ ] **Step 2: Add `CreatorsTab` component**

Before the main `export default function AdminPage` declaration, add:

```tsx
function CreatorsTab() {
  const { data: requests = [], isLoading } = useAdminCreatorRequests();
  const setApproval = useAdminSetCreatorApproval();

  async function handle(userId: string, approved: boolean) {
    try {
      await setApproval.mutateAsync({ userId, approved });
    } catch (err: any) {
      alert(err.message ?? "Failed.");
    }
  }

  if (isLoading) return <AdminSkeleton />;

  const pending = (requests as any[]).filter(r => r.status === "pending");
  const reviewed = (requests as any[]).filter(r => r.status !== "pending");

  return (
    <div style={{ padding: "16px 20px" }}>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: 12 }}>
        Creator Requests
        {pending.length > 0 && (
          <span style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 20, marginLeft: 8 }}>
            {pending.length} pending
          </span>
        )}
      </h3>
      {pending.length === 0 && reviewed.length === 0 && (
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>No requests yet.</p>
      )}
      {pending.map((req: any) => (
        <div key={req.id} style={{ padding: 12, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>{req.profiles?.display_name ?? req.display_name}</div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: 4 }}>{req.profiles?.email} · Member since {formatDate(req.profiles?.created_at)}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 8 }}>"{req.topic_description}"</div>
          {req.sample_url && (
            <div style={{ fontSize: "0.68rem", marginBottom: 8 }}>
              <a href={req.sample_url} target="_blank" rel="noopener noreferrer" style={{ color: "#a78bfa" }}>View sample →</a>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handle(req.user_id, true)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.1)", color: "#34d399", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>✓ Approve</button>
            <button onClick={() => handle(req.user_id, false)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }}>✕ Deny</button>
          </div>
        </div>
      ))}
      {reviewed.length > 0 && (
        <>
          <h4 style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", marginTop: 16, marginBottom: 8 }}>Reviewed</h4>
          {reviewed.map((req: any) => (
            <div key={req.id} style={{ padding: "10px 12px", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 6, display: "flex", alignItems: "center", gap: 10, opacity: 0.7 }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>{req.profiles?.display_name ?? req.display_name}</span>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: req.status === "approved" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", color: req.status === "approved" ? "#34d399" : "#f87171" }}>{req.status}</span>
              {req.status === "approved" && (
                <button onClick={() => handle(req.user_id, false)} style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)", background: "none", color: "var(--text-secondary)", fontSize: "0.65rem", cursor: "pointer" }}>Revoke</button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add "Creators" to the admin tab list**

Find the `TABS` constant or the array of tab names in `AdminPage.tsx` (look for a line like `const TABS = [...]` or similar). Add `"Creators"` to that array.

Then in the tab content rendering (the `{activeTab === "..." && <...Tab />}` block), add:

```tsx
{activeTab === "Creators" && <CreatorsTab />}
```

- [ ] **Step 4: Commit**

```bash
git add src/views/admin/AdminPage.tsx
git commit -m "feat(admin): add Creators tab for reviewing and approving creator requests"
```

---

## Task 14: TopBar "Post a Video" button

**Files:**
- Modify: `src/components/TopBar.tsx`

- [ ] **Step 1: Add the button**

In `src/components/TopBar.tsx`, inside the `<div className="topbar-actions">` block, after the admin button block and before the language picker `<div className="topbar-lang" ref={langRef}>`, add:

```tsx
          {/* Post a Video — approved creators and admins only */}
          {(profile?.is_approved_creator || profile?.is_admin) && (
            <button
              className="topbar-btn"
              onClick={() => navigate("videosDash")}
              aria-label="Post a video"
              title="Post a Video"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
            </button>
          )}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TopBar.tsx
git commit -m "feat(ui): show Post a Video button in TopBar for approved creators and admins"
```

---

## Task 15: Smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: dev server starts without TypeScript errors.

- [ ] **Step 2: Test video feed (unauthenticated)**

Open `http://localhost:5173/videos`. Verify:
- Feed renders with skeleton loading then empty state (or video cards if any exist)
- Back button navigates to landing page
- No "Post a Video" button visible for unauthenticated users

- [ ] **Step 3: Test creator request flow**

1. Log in as a non-admin user
2. Go to `/videos` → click "Apply to post"
3. `/creator-request` page loads
4. Fill in display name + topic description → Submit
5. Status pill shows "Pending review"

- [ ] **Step 4: Test admin approval**

1. Log in as admin
2. Go to `/admin` → "Creators" tab
3. See the pending request from step 3
4. Click "Approve" → row moves to Reviewed section as "approved"

- [ ] **Step 5: Test video posting (link embed)**

1. Log in as the now-approved user
2. Go to `/videos` — "Post a Video" button appears in TopBar and nav bar
3. Click → VideoComposerPage opens
4. Paste Link tab: enter `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
5. "✓ Valid link detected" badge appears
6. Enter a title → click "Submit for review"
7. Toast: "Video submitted for review!"

- [ ] **Step 6: Publish a video and test the player**

1. In Supabase dashboard: `update videos set published = true where title = '...'`
2. Go to `/videos` — card appears
3. Click card → player page loads with YouTube iframe
4. Like button: click → heart fills, count increments
5. Post a comment → appears below player
6. Delete own comment → disappears

- [ ] **Step 7: Run unit tests**

```bash
npx vitest run
```

Expected: all tests PASS (including the 9 new videoEmbed tests).

---

## Spec Coverage Self-Review

| Spec section | Tasks covering it |
|---|---|
| Upload flow (ffmpeg.wasm) | Task 8 (videoCompress.ts), Task 9 (composer upload tab) |
| Embed flow | Task 3 (parseEmbedUrl), Task 9 (composer link tab) |
| Composer UI (two tabs) | Task 9 (VideoComposerPage) |
| Video feed (/videos) | Task 10 (VideosPage) |
| Video player (/videos/:slug) | Task 11 (VideoDetailPage) |
| Likes + comments | Task 11 (VideoDetailPage), Task 4/5 (API + hooks) |
| Creator approval flow | Task 12 (CreatorRequestPage), Task 13 (AdminPage Creators tab) |
| DB tables + RLS + RPCs | Task 1 (migration SQL) |
| Dark/light mode | Task 7 (videos.css uses `var()` tokens + `[data-theme="light"]`) |
| Error handling | Task 3 (validateVideoFile), Task 8 (SharedArrayBuffer fallback), Task 9 (inline error messages) |

**Known gap:** Admin video publish queue UI — admins currently publish videos directly in the Supabase dashboard. A dedicated admin UI for this is a natural follow-up task but was not specified in the spec's v1 scope.
