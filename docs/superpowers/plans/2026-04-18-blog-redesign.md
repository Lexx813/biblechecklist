# Blog Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the JW Study blog into a best-in-class publishing platform with immersive reading, inline verse previews, rich discovery, and a block-based writer experience.

**Architecture:** Four sub-projects implemented in order: Writer Experience → Reading Experience → JW Features → Discovery. Each is self-contained. All data lives in the existing `blog_posts` Supabase table plus four new tables/columns added in a single migration. The SPA router (`src/lib/router.ts`) and `BlogPage.tsx` are the integration points.

**Tech Stack:** React, TypeScript, Supabase (postgres + storage), React Query, `marked` (already imported), plain CSS following existing `blog.css` patterns (CSS variables, no Tailwind on existing code).

---

## File Map

**New files:**
- `supabase/migrations/20260418_blog_redesign.sql` — schema changes
- `src/views/blog/WriterPage.tsx` — full-page writer UI
- `src/views/blog/BlockEditor.tsx` — block editor with slash menu
- `src/views/blog/DiscoveryPage.tsx` — rich /blog listing
- `src/views/blog/PostReadView.tsx` — three-column reading layout
- `src/components/blog/VerseTooltip.tsx` — inline verse preview
- `src/api/verseCache.ts` — verse cache read/write
- `src/hooks/useVerseCache.ts` — React Query hooks for verse cache
- `src/styles/writer.css`
- `src/styles/post-read.css`
- `src/styles/blog-discovery.css`
- `app/blog/new/page.tsx` — Next.js route (renders ClientShell)
- `app/blog/[slug]/edit/page.tsx` — Next.js route (renders ClientShell)

**Modified files:**
- `src/lib/router.ts` — add `blogNew`, `blogEdit` nav states
- `src/api/blog.ts` — add tags, series, search, featured, trending, active-writers APIs
- `src/hooks/useBlog.ts` — add hooks for new API functions
- `src/views/blog/BlogPage.tsx` — wire DiscoveryPage, PostReadView, WriterPage by slug/route
- `src/types/supabase.ts` — add new columns to `blog_posts` Row type

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260418_blog_redesign.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Add new columns to blog_posts
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS read_time_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- verse_cache: stores fetched NWT verse text to avoid re-fetching
CREATE TABLE IF NOT EXISTS verse_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter integer NOT NULL,
  verse_start integer NOT NULL,
  verse_end integer,
  text text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book, chapter, verse_start, verse_end)
);

-- Anyone can read verse cache (public)
ALTER TABLE verse_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verse_cache_public_read" ON verse_cache FOR SELECT USING (true);
CREATE POLICY "verse_cache_service_write" ON verse_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "verse_cache_service_update" ON verse_cache FOR UPDATE USING (true);

-- post_series: named series owned by an author
CREATE TABLE IF NOT EXISTS post_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE post_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_public_read"  ON post_series FOR SELECT USING (true);
CREATE POLICY "series_author_write" ON post_series FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "series_author_update" ON post_series FOR UPDATE USING (auth.uid() = author_id);

-- post_series_items: join table linking posts to series
CREATE TABLE IF NOT EXISTS post_series_items (
  series_id uuid NOT NULL REFERENCES post_series(id) ON DELETE CASCADE,
  post_id   uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  position  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (series_id, post_id)
);
ALTER TABLE post_series_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "series_items_public_read" ON post_series_items FOR SELECT USING (true);
CREATE POLICY "series_items_author_write" ON post_series_items
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT author_id FROM post_series WHERE id = series_id)
  );

-- Seed a handful of common verse texts for immediate use
INSERT INTO verse_cache (book, chapter, verse_start, text) VALUES
  ('John', 3, 16, '"For God loved the world so much that he gave his only-begotten Son, so that everyone exercising faith in him might not be destroyed but have everlasting life."'),
  ('Isaiah', 65, 21, '"They will build houses and live in them, and they will plant vineyards and eat their fruitage."'),
  ('Revelation', 21, 4, '"And he will wipe out every tear from their eyes, and death will be no more, neither will mourning nor outcry nor pain be anymore."'),
  ('Romans', 8, 21, '"that the creation itself will also be set free from enslavement to corruption and have the glorious freedom of the children of God."'),
  ('Psalms', 37, 29, '"The righteous will possess the earth, and they will live forever on it."'),
  ('John', 5, 28, '"Do not be amazed at this, for the hour is coming in which all those in the memorial tombs will hear his voice"'),
  ('Matthew', 6, 9, '"Our Father in the heavens, let your name be sanctified."'),
  ('Proverbs', 3, 5, '"Trust in Jehovah with all your heart, and do not rely on your own understanding."')
ON CONFLICT (book, chapter, verse_start, verse_end) DO NOTHING;
```

- [ ] **Step 2: Apply the migration in Supabase dashboard**

Go to Supabase → SQL Editor → paste the migration → Run.
Expected: no errors, new columns appear on `blog_posts`, three new tables created.

- [ ] **Step 3: Update `src/types/supabase.ts` — add new columns to `blog_posts` Row**

Find the `blog_posts` Row type (around line 175) and add:
```typescript
read_time_minutes: number;
is_featured: boolean;
subtitle: string | null;
tags: string[];
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418_blog_redesign.sql src/types/supabase.ts
git commit -m "feat: blog redesign schema — new columns, verse_cache, post_series tables"
```

---

## Task 2: Router — blogNew and blogEdit Routes

**Files:**
- Modify: `src/lib/router.ts`
- Create: `app/blog/new/page.tsx`
- Create: `app/blog/[slug]/edit/page.tsx`

- [ ] **Step 1: Add nav states to `src/lib/router.ts`**

In the `NavState` union (before `| { page: "notFound" }`), add:
```typescript
| { page: "blogNew" }
| { page: "blogEdit"; slug: string }
```

- [ ] **Step 2: Add parse cases in `parsePath()`**

Add these two lines **before** the existing `if (h.startsWith("blog/"))` line:
```typescript
if (h === "blog/new") return { page: "blogNew" };
if (h.startsWith("blog/") && h.endsWith("/edit")) {
  return { page: "blogEdit", slug: decodeURIComponent(h.slice(5, -5)) };
}
```

- [ ] **Step 3: Add build cases in `buildPath()`**

In the `switch` statement, add:
```typescript
case "blogNew":  return "/blog/new";
case "blogEdit": return `/blog/${encodeURIComponent(params.slug as string)}/edit`;
```

- [ ] **Step 4: Create `app/blog/new/page.tsx`**

```tsx
import ClientShell from "../../_components/ClientShell";

export const metadata = { title: "New Post | JW Study" };

export default function BlogNewPage() {
  return <ClientShell />;
}
```

- [ ] **Step 5: Create `app/blog/[slug]/edit/page.tsx`**

```tsx
import ClientShell from "../../../../_components/ClientShell";

export default function BlogEditPage() {
  return <ClientShell />;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/router.ts app/blog/new/page.tsx "app/blog/[slug]/edit/page.tsx"
git commit -m "feat: add blogNew and blogEdit router states and Next.js routes"
```

---

## Task 3: API Extensions — Tags, Series, Featured, Trending, Active Writers

**Files:**
- Modify: `src/api/blog.ts`

- [ ] **Step 1: Add new types and functions to `src/api/blog.ts`**

Add after the existing `BlogPost` interface:
```typescript
export interface PostSeries {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
}
```

- [ ] **Step 2: Add tag autocomplete function to `blogApi`**

```typescript
getTagSuggestions: async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc("get_distinct_tags");
  if (error) return [];
  return (data as string[]) ?? [];
},
```

Then in Supabase SQL Editor run:
```sql
CREATE OR REPLACE FUNCTION get_distinct_tags()
RETURNS text[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT array_agg(DISTINCT tag ORDER BY tag)
  FROM blog_posts, unnest(tags) AS tag
  WHERE published = true;
$$;
```

- [ ] **Step 3: Add series functions to `blogApi`**

```typescript
listSeries: async (authorId: string): Promise<PostSeries[]> => {
  const { data, error } = await supabase
    .from("post_series")
    .select("id, title, author_id, created_at")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
},

createSeries: async (authorId: string, title: string): Promise<PostSeries> => {
  const { data, error } = await supabase
    .from("post_series")
    .insert({ author_id: authorId, title })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
},

addToSeries: async (seriesId: string, postId: string, position: number): Promise<void> => {
  const { error } = await supabase
    .from("post_series_items")
    .upsert({ series_id: seriesId, post_id: postId, position });
  if (error) throw new Error(error.message);
},
```

- [ ] **Step 4: Add discovery query functions to `blogApi`**

```typescript
getFeaturedPost: async (): Promise<BlogPost | null> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_url, published, created_at, author_id, like_count, translations, lang, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
    .eq("published", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as unknown as BlogPost | null;
},

getTrendingPosts: async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_url, created_at, author_id, like_count, view_count, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
    .eq("published", true)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("like_count", { ascending: false })
    .limit(5);
  if (error) return [];
  return (data ?? []) as unknown as BlogPost[];
},

getActiveWriters: async (): Promise<Array<{ id: string; display_name: string | null; avatar_url: string | null; post_count: number }>> => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("author_id, profiles!author_id(id, display_name, avatar_url)")
    .eq("published", true)
    .gte("created_at", since);
  if (error || !data) return [];
  const counts: Record<string, { id: string; display_name: string | null; avatar_url: string | null; post_count: number }> = {};
  for (const row of data as any[]) {
    const p = row.profiles;
    if (!p?.id) continue;
    if (!counts[p.id]) counts[p.id] = { id: p.id, display_name: p.display_name, avatar_url: p.avatar_url, post_count: 0 };
    counts[p.id].post_count++;
  }
  return Object.values(counts).sort((a, b) => b.post_count - a.post_count).slice(0, 4);
},

searchPosts: async (query: string, tag: string | null = null): Promise<BlogPost[]> => {
  let q = supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_url, created_at, author_id, like_count, tags, read_time_minutes, profiles!author_id(display_name, avatar_url)")
    .eq("published", true);
  if (query) {
    q = q.textSearch("search_vector", query, { type: "websearch" });
  }
  if (tag && tag !== "All") {
    q = q.contains("tags", [tag]);
  }
  const { data, error } = await q.order("created_at", { ascending: false }).limit(20);
  if (error) return [];
  return (data ?? []) as unknown as BlogPost[];
},

getRelatedPosts: async (postId: string, tags: string[]): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, cover_url, created_at, author_id, like_count, read_time_minutes, profiles!author_id(display_name, avatar_url)")
    .eq("published", true)
    .neq("id", postId)
    .overlaps("tags", tags.length ? tags : [""])
    .order("like_count", { ascending: false })
    .limit(3);
  if (error || !data?.length) {
    const { data: fallback } = await supabase
      .from("blog_posts")
      .select("id, title, slug, cover_url, created_at, author_id, like_count, read_time_minutes, profiles!author_id(display_name, avatar_url)")
      .eq("published", true)
      .neq("id", postId)
      .order("like_count", { ascending: false })
      .limit(3);
    return (fallback ?? []) as unknown as BlogPost[];
  }
  return data as unknown as BlogPost[];
},
```

- [ ] **Step 5: Update `create` and `update` in `blogApi` to include new fields**

In `create`, update the insert object to include new fields:
```typescript
tags: (post as Record<string, unknown>).tags ?? [],
subtitle: (post as Record<string, unknown>).subtitle ?? null,
read_time_minutes: (post as Record<string, unknown>).read_time_minutes ?? 0,
```

In `update`, add to the spread:
```typescript
...((updates as Record<string, unknown>).tags !== undefined && { tags: (updates as Record<string, unknown>).tags }),
...((updates as Record<string, unknown>).subtitle !== undefined && { subtitle: (updates as Record<string, unknown>).subtitle }),
...((updates as Record<string, unknown>).read_time_minutes !== undefined && { read_time_minutes: (updates as Record<string, unknown>).read_time_minutes }),
```

- [ ] **Step 6: Update `BlogPost` interface to include new fields**

```typescript
export interface BlogPost {
  // ... existing fields ...
  tags: string[];
  subtitle: string | null;
  read_time_minutes: number;
  view_count?: number;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/api/blog.ts
git commit -m "feat: blog API — tags, series, search, trending, featured, related posts"
```

---

## Task 4: Hooks — New useBlog hooks

**Files:**
- Modify: `src/hooks/useBlog.ts`

- [ ] **Step 1: Add new hooks at the end of `src/hooks/useBlog.ts`**

```typescript
export function useFeaturedPost() {
  return useQuery({
    queryKey: ["blog", "featured"],
    queryFn: () => blogApi.getFeaturedPost(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrendingPosts() {
  return useQuery({
    queryKey: ["blog", "trending"],
    queryFn: () => blogApi.getTrendingPosts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveWriters() {
  return useQuery({
    queryKey: ["blog", "activeWriters"],
    queryFn: () => blogApi.getActiveWriters(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchPosts(query: string, tag: string | null) {
  return useQuery({
    queryKey: ["blog", "search", query, tag],
    queryFn: () => blogApi.searchPosts(query, tag),
    staleTime: 60 * 1000,
    enabled: true,
  });
}

export function useRelatedPosts(postId: string | undefined, tags: string[]) {
  return useQuery({
    queryKey: ["blog", "related", postId],
    queryFn: () => blogApi.getRelatedPosts(postId!, tags),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSeriesList(authorId: string | undefined) {
  return useQuery({
    queryKey: ["blog", "series", authorId],
    queryFn: () => blogApi.listSeries(authorId!),
    enabled: !!authorId,
  });
}

export function useCreateSeries(authorId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => blogApi.createSeries(authorId!, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["blog", "series", authorId] }),
  });
}

export function useTagSuggestions() {
  return useQuery({
    queryKey: ["blog", "tagSuggestions"],
    queryFn: () => blogApi.getTagSuggestions(),
    staleTime: 10 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useBlog.ts
git commit -m "feat: blog hooks — featured, trending, activeWriters, search, related, series, tags"
```

---

## Task 5: BlockEditor Component

**Files:**
- Create: `src/views/blog/BlockEditor.tsx`

- [ ] **Step 1: Create `src/views/blog/BlockEditor.tsx`**

```tsx
import { useState, useRef, useCallback, KeyboardEvent } from "react";

export type BlockType = "paragraph" | "h2" | "h3" | "pull-quote" | "bible-verse" | "bullet";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const SLASH_OPTIONS: Array<{ type: BlockType; icon: string; label: string; desc: string }> = [
  { type: "bible-verse",  icon: "📖", label: "Bible Verse",  desc: "Insert verse reference" },
  { type: "pull-quote",   icon: "❝",  label: "Pull Quote",   desc: "Highlight a key thought" },
  { type: "h2",           icon: "H2", label: "Heading",      desc: "Section heading" },
  { type: "bullet",       icon: "•",  label: "Bullet List",  desc: "Bulleted item" },
];

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

export default function BlockEditor({ blocks, onChange }: Props) {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string } | null>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const updateBlock = useCallback((id: string, content: string) => {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
    if (content === "/" && !slashMenu) setSlashMenu({ blockId: id });
    if (!content.startsWith("/") && slashMenu?.blockId === id) setSlashMenu(null);
  }, [blocks, onChange, slashMenu]);

  const convertBlock = useCallback((id: string, type: BlockType) => {
    onChange(blocks.map(b => b.id === id ? { ...b, type, content: b.content === "/" ? "" : b.content } : b));
    setSlashMenu(null);
    setTimeout(() => refs.current[id]?.focus(), 0);
  }, [blocks, onChange]);

  const addBlockAfter = useCallback((id: string, type: BlockType = "paragraph") => {
    const idx = blocks.findIndex(b => b.id === id);
    const newBlock: Block = { id: uid(), type, content: "" };
    const next = [...blocks];
    next.splice(idx + 1, 0, newBlock);
    onChange(next);
    setTimeout(() => refs.current[newBlock.id]?.focus(), 0);
  }, [blocks, onChange]);

  const removeBlock = useCallback((id: string) => {
    if (blocks.length === 1) return;
    const idx = blocks.findIndex(b => b.id === id);
    const prev = blocks[idx - 1];
    onChange(blocks.filter(b => b.id !== id));
    if (prev) setTimeout(() => refs.current[prev.id]?.focus(), 0);
  }, [blocks, onChange]);

  const handleKey = useCallback((e: KeyboardEvent, block: Block) => {
    if (slashMenu) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx(i => Math.min(i + 1, SLASH_OPTIONS.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); convertBlock(block.id, SLASH_OPTIONS[slashIdx].type); return; }
      if (e.key === "Escape")    { setSlashMenu(null); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlockAfter(block.id);
    }
    if (e.key === "Backspace" && !block.content) {
      e.preventDefault();
      removeBlock(block.id);
    }
  }, [slashMenu, slashIdx, convertBlock, addBlockAfter, removeBlock]);

  return (
    <div className="be-root">
      {blocks.map((block) => (
        <div key={block.id} className="be-block">
          <div className="be-handle">
            <span className="be-handle-grip" title="Drag to reorder">⠿</span>
          </div>

          {block.type === "h2" && (
            <h2
              className="be-h2"
              contentEditable
              suppressContentEditableWarning
              ref={el => { refs.current[block.id] = el; }}
              onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
              onKeyDown={e => handleKey(e, block)}
              data-placeholder="Heading…"
            >{block.content}</h2>
          )}

          {block.type === "h3" && (
            <h3
              className="be-h3"
              contentEditable
              suppressContentEditableWarning
              ref={el => { refs.current[block.id] = el; }}
              onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
              onKeyDown={e => handleKey(e, block)}
              data-placeholder="Subheading…"
            >{block.content}</h3>
          )}

          {block.type === "pull-quote" && (
            <blockquote
              className="be-pullquote"
              contentEditable
              suppressContentEditableWarning
              ref={el => { refs.current[block.id] = el; }}
              onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
              onKeyDown={e => handleKey(e, block)}
              data-placeholder="A memorable thought…"
            >{block.content}</blockquote>
          )}

          {block.type === "bible-verse" && (
            <div className="be-verse-block">
              <div className="be-verse-label">📖 Bible Reference</div>
              <div
                className="be-verse-ref"
                contentEditable
                suppressContentEditableWarning
                ref={el => { refs.current[block.id] = el; }}
                onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
                onKeyDown={e => handleKey(e, block)}
                data-placeholder="e.g. John 3:16"
              >{block.content}</div>
            </div>
          )}

          {(block.type === "paragraph" || block.type === "bullet") && (
            <div className="be-row">
              {block.type === "bullet" && <span className="be-bullet">•</span>}
              <div
                className="be-para"
                contentEditable
                suppressContentEditableWarning
                ref={el => { refs.current[block.id] = el; }}
                onInput={e => updateBlock(block.id, (e.target as HTMLElement).innerText)}
                onKeyDown={e => handleKey(e, block)}
                data-placeholder={block.type === "bullet" ? "List item…" : "Write something… or type / for commands"}
              >{block.content}</div>
            </div>
          )}

          {slashMenu?.blockId === block.id && (
            <div className="be-slash-menu">
              {SLASH_OPTIONS.map((opt, i) => (
                <div
                  key={opt.type}
                  className={`be-slash-item${i === slashIdx ? " be-slash-item--active" : ""}`}
                  onMouseDown={e => { e.preventDefault(); convertBlock(block.id, opt.type); }}
                >
                  <span className="be-slash-icon">{opt.icon}</span>
                  <span>
                    <span className="be-slash-label">{opt.label}</span>
                    <span className="be-slash-desc">{opt.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        className="be-add-btn"
        onClick={() => addBlockAfter(blocks[blocks.length - 1].id)}
      >+ Add block</button>
    </div>
  );
}

export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(b => {
    if (b.type === "h2") return `## ${b.content}`;
    if (b.type === "h3") return `### ${b.content}`;
    if (b.type === "pull-quote") return `> ${b.content}`;
    if (b.type === "bible-verse") return `[${b.content}]`;
    if (b.type === "bullet") return `- ${b.content}`;
    return b.content;
  }).join("\n\n");
}

export function markdownToBlocks(md: string): Block[] {
  if (!md.trim()) return [{ id: uid(), type: "paragraph", content: "" }];
  return md.split(/\n\n+/).map(line => {
    const id = uid();
    if (line.startsWith("## ")) return { id, type: "h2" as BlockType, content: line.slice(3) };
    if (line.startsWith("### ")) return { id, type: "h3" as BlockType, content: line.slice(4) };
    if (line.startsWith("> ")) return { id, type: "pull-quote" as BlockType, content: line.slice(2) };
    if (/^\[.+\]$/.test(line.trim())) return { id, type: "bible-verse" as BlockType, content: line.trim().slice(1, -1) };
    if (line.startsWith("- ")) return { id, type: "bullet" as BlockType, content: line.slice(2) };
    return { id, type: "paragraph" as BlockType, content: line };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/blog/BlockEditor.tsx
git commit -m "feat: BlockEditor component with slash menu and markdown serialization"
```

---

## Task 6: WriterPage

**Files:**
- Create: `src/views/blog/WriterPage.tsx`
- Create: `src/styles/writer.css`

- [ ] **Step 1: Create `src/styles/writer.css`**

```css
.writer-wrap { display: flex; flex-direction: column; min-height: 100dvh; background: var(--bg); }

/* Top bar */
.writer-topbar {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 52px;
  background: var(--card-bg); border-bottom: 1px solid var(--border);
}
.writer-topbar-left { display: flex; align-items: center; gap: 12px; }
.writer-logo { font-weight: 800; font-size: 15px; color: var(--accent); }
.writer-save-status { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 5px; }
.writer-save-dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: writer-pulse 2s infinite; }
@keyframes writer-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
.writer-topbar-right { display: flex; gap: 8px; }

/* Layout */
.writer-body { display: flex; flex: 1; }

/* Format bar */
.writer-format-bar {
  width: 52px; position: sticky; top: 52px; height: calc(100dvh - 52px);
  background: var(--card-bg); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; padding: 14px 0; gap: 2px; flex-shrink: 0;
}
.writer-fmt-btn {
  width: 34px; height: 34px; border-radius: 8px; border: none;
  background: transparent; cursor: pointer; font-size: 13px; font-weight: 700;
  color: var(--text-muted); display: flex; align-items: center; justify-content: center;
}
.writer-fmt-btn:hover { background: var(--hover); color: var(--accent); }
.writer-fmt-sep { width: 24px; height: 1px; background: var(--border); margin: 4px 0; }

/* Editor area */
.writer-editor { flex: 1; padding: 40px 24px 120px; display: flex; justify-content: center; overflow-y: auto; }
.writer-editor-inner { width: 100%; max-width: 720px; }

/* Cover zone */
.writer-cover-zone {
  width: 100%; aspect-ratio: 16/6; border-radius: 14px;
  border: 2px dashed var(--border); background: var(--hover);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; cursor: pointer; margin-bottom: 32px; transition: border-color 0.2s;
  overflow: hidden; position: relative;
}
.writer-cover-zone:hover { border-color: var(--accent); }
.writer-cover-zone img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.writer-cover-hint { font-size: 13px; color: var(--text-muted); z-index: 1; }

/* Title / subtitle */
.writer-title {
  font-size: 34px; font-weight: 800; color: var(--text);
  border: none; outline: none; width: 100%; background: transparent;
  line-height: 1.2; margin-bottom: 8px; letter-spacing: -0.5px; resize: none;
}
.writer-title::placeholder { color: #c4b8e8; }
.writer-subtitle {
  font-size: 19px; color: var(--text-muted);
  border: none; outline: none; width: 100%; background: transparent;
  line-height: 1.5; margin-bottom: 24px; resize: none;
}
.writer-subtitle::placeholder { color: #d4c8f0; }

/* Mode toggle */
.writer-mode-toggle { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
.writer-mode-btn { padding: 5px 14px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: var(--card-bg); color: var(--text-muted); }
.writer-mode-btn.active { background: var(--accent); color: white; }

/* Markdown textarea */
.writer-markdown { width: 100%; min-height: 400px; font-family: monospace; font-size: 15px; line-height: 1.8; border: 1px solid var(--border); border-radius: 10px; padding: 16px; background: var(--card-bg); color: var(--text); resize: vertical; }

/* Sidebar */
.writer-sidebar {
  width: 260px; position: sticky; top: 52px; height: calc(100dvh - 52px);
  background: var(--card-bg); border-left: 1px solid var(--border);
  padding: 20px 16px; display: flex; flex-direction: column; gap: 20px;
  overflow-y: auto; flex-shrink: 0;
}
.writer-sidebar-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
.writer-readtime { background: var(--hover); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; }
.writer-readtime-num { font-size: 26px; font-weight: 800; color: var(--accent); }
.writer-readtime-label { font-size: 11px; color: var(--text-muted); }

/* Tags input */
.writer-tags-wrap { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border: 1px solid var(--border); border-radius: 8px; min-height: 38px; cursor: text; }
.writer-tag-chip { background: var(--hover); color: var(--accent); font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }
.writer-tag-x { cursor: pointer; opacity: 0.6; font-size: 11px; line-height: 1; }
.writer-tag-x:hover { opacity: 1; }
.writer-tags-input { border: none; outline: none; font-size: 13px; color: var(--text); flex: 1; min-width: 80px; background: transparent; }
.writer-tags-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
.writer-tag-suggestions { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-top: 4px; background: var(--card-bg); }
.writer-tag-opt { padding: 7px 10px; font-size: 13px; cursor: pointer; color: var(--text); }
.writer-tag-opt:hover { background: var(--hover); }

/* Series select */
.writer-select { width: 100%; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; font-size: 13px; color: var(--text); background: var(--card-bg); }
.writer-series-hint { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

/* Pre-publish checklist */
.writer-checklist { display: flex; flex-direction: column; gap: 7px; }
.writer-check-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
.writer-check-icon { width: 16px; height: 16px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; }
.writer-check-icon--done { background: #22c55e; color: white; }
.writer-check-icon--todo { border: 1px solid var(--border); }

/* Publish modal */
.writer-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; }
.writer-modal { background: var(--card-bg); border-radius: 16px; padding: 28px; width: 380px; max-width: 90vw; }
.writer-modal h2 { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
.writer-modal-row { margin-bottom: 10px; font-size: 14px; color: var(--text-muted); }
.writer-modal-row strong { color: var(--text); }
.writer-modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }

/* Block editor within writer */
.be-root { outline: none; }
.be-block { position: relative; padding-left: 28px; margin-bottom: 2px; }
.be-handle { position: absolute; left: 0; top: 4px; opacity: 0; transition: opacity 0.15s; display: flex; }
.be-block:hover .be-handle { opacity: 1; }
.be-handle-grip { font-size: 14px; color: var(--text-muted); cursor: grab; padding: 2px; }
.be-para, .be-h2, .be-h3, .be-pullquote, .be-verse-ref {
  outline: none; min-height: 28px; width: 100%;
  display: block; color: var(--text); line-height: 1.8;
}
.be-para[data-placeholder]:empty::before,
.be-h2[data-placeholder]:empty::before,
.be-h3[data-placeholder]:empty::before,
.be-pullquote[data-placeholder]:empty::before,
.be-verse-ref[data-placeholder]:empty::before { content: attr(data-placeholder); color: #c4b8e8; pointer-events: none; }
.be-h2 { font-size: 22px; font-weight: 700; padding: 10px 0 4px; }
.be-h3 { font-size: 18px; font-weight: 600; padding: 8px 0 4px; }
.be-pullquote { border-left: 4px solid var(--accent); background: var(--hover); padding: 14px 18px; border-radius: 0 10px 10px 0; font-size: 18px; font-style: italic; }
.be-verse-block { border-left: 4px solid var(--accent); background: var(--hover); padding: 12px 16px; border-radius: 0 10px 10px 0; margin: 12px 0; }
.be-verse-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 4px; }
.be-row { display: flex; align-items: baseline; gap: 8px; }
.be-bullet { flex-shrink: 0; color: var(--accent); font-size: 18px; }
.be-slash-menu { position: absolute; top: 100%; left: 28px; background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 50; width: 240px; }
.be-slash-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 8px; cursor: pointer; }
.be-slash-item--active, .be-slash-item:hover { background: var(--hover); }
.be-slash-icon { width: 28px; height: 28px; border-radius: 6px; background: var(--hover); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.be-slash-label { font-size: 13px; font-weight: 600; color: var(--text); display: block; }
.be-slash-desc { font-size: 11px; color: var(--text-muted); display: block; }
.be-add-btn { margin-top: 12px; margin-left: 28px; font-size: 13px; color: var(--text-muted); background: none; border: 1px dashed var(--border); border-radius: 8px; padding: 6px 14px; cursor: pointer; }
.be-add-btn:hover { color: var(--accent); border-color: var(--accent); }

@media (max-width: 900px) {
  .writer-sidebar { display: none; }
  .writer-format-bar { display: none; }
  .writer-editor { padding: 20px 16px 80px; }
}
```

- [ ] **Step 2: Create `src/views/blog/WriterPage.tsx`**

```tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import BlockEditor, { Block, blocksToMarkdown, markdownToBlocks } from "./BlockEditor";
import { blogApi } from "../../api/blog";
import { useCreatePost, useUpdatePost, useSeriesList, useCreateSeries, useTagSuggestions } from "../../hooks/useBlog";
import { toast } from "../../lib/toast";
import "../../styles/writer.css";

const MAX_TAGS = 5;

function computeReadTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface Props {
  user: { id: string };
  navigate: (page: string, params?: Record<string, unknown>) => void;
  editPost?: {
    id: string; title: string; subtitle?: string; content: string;
    cover_url?: string | null; tags?: string[]; published: boolean;
  } | null;
}

export default function WriterPage({ user, navigate, editPost }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(editPost?.title ?? "");
  const [subtitle, setSubtitle] = useState(editPost?.subtitle ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(editPost?.cover_url ?? null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [tags, setTags] = useState<string[]>(editPost?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [showTagSugg, setShowTagSugg] = useState(false);
  const [mode, setMode] = useState<"block" | "md">("block");
  const [blocks, setBlocks] = useState<Block[]>(() => markdownToBlocks(editPost?.content ?? ""));
  const [markdown, setMarkdown] = useState(editPost?.content ?? "");
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const postIdRef = useRef<string | null>(editPost?.id ?? null);

  const createPost = useCreatePost(user.id);
  const updatePost = useUpdatePost(user.id);
  const { data: seriesList = [] } = useSeriesList(user.id);
  const createSeries = useCreateSeries(user.id);
  const { data: tagSuggestions = [] } = useTagSuggestions();

  const currentMarkdown = mode === "block" ? blocksToMarkdown(blocks) : markdown;
  const readTime = computeReadTime(title + " " + currentMarkdown);
  const wordCount = (title + " " + currentMarkdown).trim().split(/\s+/).filter(Boolean).length;

  const hasCover = !!coverUrl;
  const hasTag = tags.length > 0;
  const has300Words = wordCount >= 300;
  const hasPullQuote = currentMarkdown.includes("\n> ") || currentMarkdown.startsWith("> ");
  const hasVerseRef = /\[[A-Z][a-z]+ \d+:\d+\]/.test(currentMarkdown);

  const doSave = useCallback(async (publish = false) => {
    if (!title.trim()) return;
    setSaveStatus("saving");
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      content: currentMarkdown,
      cover_url: coverUrl,
      tags,
      published: publish,
      read_time_minutes: readTime,
    };
    try {
      if (postIdRef.current) {
        await updatePost.mutateAsync({ postId: postIdRef.current, updates: payload });
      } else {
        const created = await createPost.mutateAsync(payload);
        postIdRef.current = created.id;
        if (!publish) window.history.replaceState(null, "", `/blog/${created.slug}/edit`);
      }
      if (selectedSeries && postIdRef.current) {
        await blogApi.addToSeries(selectedSeries, postIdRef.current, 0);
      }
      setSaveStatus("saved");
    } catch (err: unknown) {
      setSaveStatus("unsaved");
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }, [title, subtitle, currentMarkdown, coverUrl, tags, readTime, selectedSeries, createPost, updatePost]);

  // Auto-save debounce
  useEffect(() => {
    if (!title.trim()) return;
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(false), 3000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, subtitle, currentMarkdown, coverUrl, tags]);

  const handleModeSwitch = (next: "block" | "md") => {
    if (next === "md" && mode === "block") setMarkdown(blocksToMarkdown(blocks));
    if (next === "block" && mode === "md") setBlocks(markdownToBlocks(markdown));
    setMode(next);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const url = await blogApi.uploadCover(user.id, file);
      setCoverUrl(url);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverUploading(false);
    }
  };

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (!clean || tags.includes(clean) || tags.length >= MAX_TAGS) return;
    setTags([...tags, clean]);
    setTagInput("");
    setShowTagSugg(false);
  };

  const handleTagKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    if (e.key === "Backspace" && !tagInput) setTags(tags.slice(0, -1));
  };

  const handleCreateSeries = async () => {
    const name = window.prompt("Series name:");
    if (!name?.trim()) return;
    const series = await createSeries.mutateAsync(name.trim());
    setSelectedSeries(series.id);
  };

  const filteredSugg = tagSuggestions.filter(s => s.includes(tagInput) && !tags.includes(s));

  return (
    <div className="writer-wrap">
      {/* Top bar */}
      <div className="writer-topbar">
        <div className="writer-topbar-left">
          <span className="writer-logo">✍️ JW Study</span>
          <div className="writer-save-status">
            {saveStatus === "saved" && <><div className="writer-save-dot" />Saved</>}
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "unsaved" && "Unsaved changes"}
          </div>
        </div>
        <div className="writer-topbar-right">
          <button className="btn-ghost-sm" onClick={() => navigate("blog", { slug: postIdRef.current ? undefined : null })}>Cancel</button>
          <button className="btn-ghost-sm" onClick={() => doSave(false)}>Save Draft</button>
          <button className="btn-primary-sm" onClick={() => setShowPublishModal(true)}>Publish →</button>
        </div>
      </div>

      <div className="writer-body">
        {/* Format bar */}
        <div className="writer-format-bar">
          {[["¶","paragraph"],["H","h2"],["B","bold"],["I","italic"]].map(([icon]) => (
            <button key={icon} className="writer-fmt-btn" title={icon}>{icon}</button>
          ))}
          <div className="writer-fmt-sep" />
          {[["📖","bible-verse"],["❝","pull-quote"],["•","bullet"]].map(([icon]) => (
            <button key={icon} className="writer-fmt-btn" title={icon}>{icon}</button>
          ))}
          <div className="writer-fmt-sep" />
          {[["🖼","image"],["🔗","link"]].map(([icon]) => (
            <button key={icon} className="writer-fmt-btn" title={icon}>{icon}</button>
          ))}
        </div>

        {/* Editor */}
        <div className="writer-editor">
          <div className="writer-editor-inner">
            {/* Cover zone */}
            <label className="writer-cover-zone">
              {coverUrl && <img src={coverUrl} alt="cover" />}
              {!coverUrl && (
                <span className="writer-cover-hint">
                  {coverUploading ? "Uploading…" : "🖼️ Click to add cover image"}
                </span>
              )}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            </label>

            {/* Title */}
            <textarea
              className="writer-title"
              placeholder="Your title here…"
              value={title}
              rows={1}
              onChange={e => setTitle(e.target.value)}
            />

            {/* Subtitle */}
            <textarea
              className="writer-subtitle"
              placeholder="Add a subtitle (optional)…"
              value={subtitle}
              rows={1}
              onChange={e => setSubtitle(e.target.value)}
            />

            {/* Mode toggle */}
            <div className="writer-mode-toggle">
              <button className={`writer-mode-btn${mode === "block" ? " active" : ""}`} onClick={() => handleModeSwitch("block")}>✦ Block Editor</button>
              <button className={`writer-mode-btn${mode === "md" ? " active" : ""}`} onClick={() => handleModeSwitch("md")}>⌨ Markdown</button>
            </div>

            {mode === "block"
              ? <BlockEditor blocks={blocks} onChange={setBlocks} />
              : <textarea
                  className="writer-markdown"
                  value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                  placeholder="Write in Markdown. Use [John 3:16] for verse references, > for pull quotes."
                />
            }
          </div>
        </div>

        {/* Sidebar */}
        <div className="writer-sidebar">
          <div>
            <div className="writer-sidebar-label">Reading Time</div>
            <div className="writer-readtime">
              <div>
                <div className="writer-readtime-num">{readTime}</div>
                <div className="writer-readtime-label">min read</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>~{wordCount} words</div>
            </div>
          </div>

          <div>
            <div className="writer-sidebar-label">Tags (up to {MAX_TAGS})</div>
            <div className="writer-tags-wrap" onClick={() => document.querySelector<HTMLInputElement>(".writer-tags-input")?.focus()}>
              {tags.map(tag => (
                <span key={tag} className="writer-tag-chip">
                  {tag}
                  <span className="writer-tag-x" onClick={() => setTags(tags.filter(t => t !== tag))}>×</span>
                </span>
              ))}
              {tags.length < MAX_TAGS && (
                <input
                  className="writer-tags-input"
                  value={tagInput}
                  onChange={e => { setTagInput(e.target.value); setShowTagSugg(true); }}
                  onKeyDown={handleTagKey}
                  onBlur={() => setTimeout(() => setShowTagSugg(false), 150)}
                  placeholder={tags.length ? "" : "Add tag…"}
                />
              )}
            </div>
            {showTagSugg && filteredSugg.length > 0 && (
              <div className="writer-tag-suggestions">
                {filteredSugg.slice(0, 6).map(s => (
                  <div key={s} className="writer-tag-opt" onMouseDown={() => addTag(s)}>{s}</div>
                ))}
              </div>
            )}
            <div className="writer-tags-hint">Press Enter or comma to add</div>
          </div>

          <div>
            <div className="writer-sidebar-label">Series</div>
            <select className="writer-select" value={selectedSeries} onChange={e => {
              if (e.target.value === "__new__") handleCreateSeries();
              else setSelectedSeries(e.target.value);
            }}>
              <option value="">— No series —</option>
              {seriesList.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              <option value="__new__">+ Create new series…</option>
            </select>
          </div>

          <div>
            <div className="writer-sidebar-label">Pre-publish checklist</div>
            <div className="writer-checklist">
              {[
                { done: hasCover, label: "Cover image added" },
                { done: hasTag, label: "At least 1 tag" },
                { done: has300Words, label: "300+ words" },
                { done: hasPullQuote, label: "Pull quote added" },
                { done: hasVerseRef, label: "Bible reference" },
              ].map(({ done, label }) => (
                <div key={label} className="writer-check-row">
                  <div className={`writer-check-icon${done ? " writer-check-icon--done" : " writer-check-icon--todo"}`}>
                    {done ? "✓" : ""}
                  </div>
                  <span style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Publish modal */}
      {showPublishModal && (
        <div className="writer-modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="writer-modal" onClick={e => e.stopPropagation()}>
            <h2>Ready to publish?</h2>
            <div className="writer-modal-row"><strong>{title || "(No title)"}</strong></div>
            <div className="writer-modal-row">Read time: {readTime} min · {wordCount} words</div>
            {tags.length > 0 && <div className="writer-modal-row">Tags: {tags.join(", ")}</div>}
            {selectedSeries && <div className="writer-modal-row">Series: {seriesList.find(s => s.id === selectedSeries)?.title}</div>}
            <div className="writer-modal-actions">
              <button className="btn-ghost-sm" onClick={() => setShowPublishModal(false)}>Cancel</button>
              <button className="btn-primary-sm" onClick={async () => {
                await doSave(true);
                setShowPublishModal(false);
                navigate("blog");
                toast.success("Published!");
              }}>Publish now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/blog/WriterPage.tsx src/styles/writer.css
git commit -m "feat: WriterPage with block editor, auto-save, tag/series sidebar, publish modal"
```

---

## Task 7: Wire WriterPage into BlogPage and App

**Files:**
- Modify: `src/views/blog/BlogPage.tsx`
- Modify: `src/App.tsx` (or wherever `blogNew`/`blogEdit` states are rendered)

- [ ] **Step 1: Find where pages are rendered in App.tsx**

Search `src/App.tsx` (or the main routing component) for `blogDash` to find where to add the new cases.

- [ ] **Step 2: Import WriterPage and add cases**

At the top of the file rendering page cases, add:
```tsx
import WriterPage from "./views/blog/WriterPage";
```

Then in the page switch/conditional (where `blogDash` renders `<BlogDashboard ...>`), add:
```tsx
{nav.page === "blogNew" && user && (
  <WriterPage user={user} navigate={navigate} />
)}
{nav.page === "blogEdit" && user && (
  <WriterPage user={user} navigate={navigate} editPost={/* load from query cache by nav.slug */null} />
)}
```

For `blogEdit` to pre-load the post, wrap it in a loader component or pass slug to WriterPage and let it fetch:

Add to `WriterPage`'s Props:
```tsx
slug?: string;
```

Add fetch at the top of WriterPage when `slug` is provided and `editPost` is null:
```tsx
const { data: loadedPost } = usePostBySlug(props.slug && !editPost ? props.slug : undefined);
const post = editPost ?? loadedPost ?? null;
// Use post instead of editPost throughout (or just initialize state in useEffect when post loads)
```

- [ ] **Step 3: Add "Write" / "New Post" button to BlogPage header**

In the blog list view section of `BlogPage.tsx`, find the existing nav/header and add:
```tsx
{user && (
  <button className="btn-primary-sm" onClick={() => navigate("blogNew")}>
    ✍️ Write
  </button>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/views/blog/BlogPage.tsx
git commit -m "feat: wire WriterPage into app routing for blogNew and blogEdit"
```

---

## Task 8: PostReadView — Reading Experience

**Files:**
- Create: `src/views/blog/PostReadView.tsx`
- Create: `src/styles/post-read.css`

- [ ] **Step 1: Create `src/styles/post-read.css`**

```css
/* ── Progress bar ─────────────────────────────────────────── */
.pr-progress-bar {
  position: fixed; top: 0; left: 0; height: 3px; z-index: 200;
  background: linear-gradient(90deg, var(--accent), #c084fc);
  transition: width 0.1s linear;
  box-shadow: 0 0 8px rgba(124,58,237,0.4);
}
.pr-back-top {
  position: fixed; bottom: 28px; right: 24px; z-index: 150;
  background: var(--accent); color: white; border: none;
  border-radius: 50px; padding: 9px 18px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  box-shadow: 0 4px 20px rgba(124,58,237,0.35);
  display: flex; align-items: center; gap: 6px;
  opacity: 0; pointer-events: none; transition: opacity 0.2s;
}
.pr-back-top.visible { opacity: 1; pointer-events: auto; }
.pr-back-top-pct { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 2px 7px; font-size: 11px; }

/* ── Layout ──────────────────────────────────────────────── */
.pr-wrap { background: var(--bg); min-height: 100dvh; padding-top: 3px; }
.pr-layout {
  display: grid;
  grid-template-columns: 200px 1fr 220px;
  max-width: 1140px; margin: 0 auto;
  padding: 40px 24px; gap: 48px;
}

/* ── ToC (left) ──────────────────────────────────────────── */
.pr-toc { position: sticky; top: 60px; height: fit-content; }
.pr-toc-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; }
.pr-toc-item {
  display: block; font-size: 13px; color: var(--text-muted);
  padding: 5px 0 5px 10px; border-left: 2px solid transparent;
  cursor: pointer; line-height: 1.4; text-decoration: none; margin-bottom: 2px;
}
.pr-toc-item:hover { color: var(--accent); }
.pr-toc-item.active { border-left-color: var(--accent); color: var(--accent); font-weight: 600; }
.pr-toc-accordion { display: none; }

/* ── Article (center) ────────────────────────────────────── */
.pr-article { max-width: 700px; min-width: 0; }
.pr-tag-pill {
  display: inline-block; background: var(--hover); color: var(--accent);
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 20px; margin-bottom: 14px;
}
.pr-title { font-size: 34px; font-weight: 800; line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 16px; }
.pr-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.pr-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 14px; flex-shrink: 0; overflow: hidden; }
.pr-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pr-meta-text { font-size: 13px; color: var(--text-muted); }
.pr-meta-text strong { color: var(--text); font-weight: 600; }
.pr-read-time { margin-left: auto; font-size: 12px; color: var(--text-muted); background: var(--hover); padding: 3px 10px; border-radius: 20px; }
.pr-cover { width: 100%; aspect-ratio: 16/7; border-radius: 14px; object-fit: cover; margin-bottom: 32px; background: linear-gradient(135deg, #1a1035, #7c3aed); }
.pr-body { font-size: 17px; line-height: 1.85; color: var(--text); }
.pr-body h2 { font-size: 22px; font-weight: 700; margin: 36px 0 14px; letter-spacing: -0.3px; scroll-margin-top: 80px; }
.pr-body p { margin-bottom: 20px; }
.pr-body blockquote { border-left: 4px solid var(--accent); background: var(--hover); padding: 16px 20px; border-radius: 0 10px 10px 0; margin: 24px 0; font-size: 18px; font-style: italic; line-height: 1.7; }
.pr-body ul, .pr-body ol { margin: 0 0 20px 24px; }
.pr-body li { margin-bottom: 6px; }
.pr-tags-row { display: flex; gap: 8px; flex-wrap: wrap; margin: 32px 0; }
.pr-tag { background: var(--hover); color: var(--accent); font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }

/* ── Right sidebar ────────────────────────────────────────── */
.pr-sidebar { position: sticky; top: 60px; height: fit-content; display: flex; flex-direction: column; gap: 14px; }
.pr-widget { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
.pr-widget-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
.pr-progress-widget { background: var(--hover); }
.pr-pct { font-size: 28px; font-weight: 800; color: var(--accent); line-height: 1; }
.pr-pct-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.pr-pct-track { height: 4px; background: var(--border); border-radius: 2px; margin-top: 10px; }
.pr-pct-fill { height: 4px; background: linear-gradient(90deg, var(--accent), #c084fc); border-radius: 2px; transition: width 0.2s; }
.pr-action-btn { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); background: var(--card-bg); cursor: pointer; color: var(--text); width: 100%; margin-bottom: 6px; }
.pr-action-btn:hover { background: var(--hover); }
.pr-related-link { display: block; font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 10px; text-decoration: none; cursor: pointer; line-height: 1.4; }
.pr-related-link:hover { color: var(--accent); }
.pr-related-meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 1000px) {
  .pr-layout { grid-template-columns: 1fr 200px; }
  .pr-toc { display: none; }
  .pr-toc-accordion { display: block; margin-bottom: 20px; }
}
@media (max-width: 700px) {
  .pr-layout { grid-template-columns: 1fr; padding: 20px 16px; }
  .pr-sidebar { position: static; flex-direction: row; flex-wrap: wrap; }
  .pr-widget { flex: 1; min-width: 140px; }
  .pr-title { font-size: 26px; }
  .pr-body { font-size: 16px; }
}
```

- [ ] **Step 2: Create `src/views/blog/PostReadView.tsx`**

```tsx
import { useState, useEffect, useRef, useMemo } from "react";
import { marked } from "marked";
import { sanitizeRich } from "../../lib/sanitize";
import { useRelatedPosts, useToggleBlogLike, useUserBlogLikes } from "../../hooks/useBlog";
import { blogApi } from "../../api/blog";
import { formatDate, authorName as authorNameUtil } from "../../utils/formatters";
import VerseTooltip from "../../components/blog/VerseTooltip";
import "../../styles/post-read.css";

function renderContent(raw: string): string {
  if (!raw) return "";
  const html = /<[a-z][\s\S]*>/i.test(raw) ? raw : marked.parse(raw) as string;
  return sanitizeRich(html);
}

function extractHeadings(html: string): Array<{ id: string; text: string }> {
  const matches = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
  return matches.map((m, i) => ({
    id: `section-${i}`,
    text: m[1].replace(/<[^>]*>/g, ""),
  }));
}

function injectHeadingIds(html: string): string {
  let i = 0;
  return html.replace(/<h2([^>]*)>/gi, () => `<h2 id="section-${i++}"$1>`);
}

interface Post {
  id: string; title: string; slug: string; excerpt: string | null; subtitle?: string | null;
  content: string; cover_url: string | null; created_at: string; author_id: string;
  like_count: number; read_time_minutes: number; tags: string[];
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

interface Props {
  post: Post;
  user: { id: string } | null;
  navigate: (page: string, params?: Record<string, unknown>) => void;
}

export default function PostReadView({ post, user, navigate }: Props) {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState("");
  const articleRef = useRef<HTMLDivElement>(null);
  const { data: relatedPosts = [] } = useRelatedPosts(post.id, post.tags ?? []);
  const { data: likedIds = [] } = useUserBlogLikes(user?.id);
  const toggleLike = useToggleBlogLike(user?.id);
  const liked = likedIds.includes(post.id);

  const renderedHtml = useMemo(() => injectHeadingIds(renderContent(post.content)), [post.content]);
  const headings = useMemo(() => extractHeadings(renderedHtml), [renderedHtml]);

  useEffect(() => {
    blogApi.incrementViewCount(post.id);
  }, [post.id]);

  useEffect(() => {
    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const pct = Math.min(100, Math.max(0, Math.round(((viewH - top) / (height + viewH)) * 100)));
      setScrollPct(pct);

      // Active section tracking
      for (const { id } of headings) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) setActiveSection(id);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const authorName = post.profiles?.display_name ?? "Anonymous";
  const authorInitial = authorName[0].toUpperCase();
  const displayDate = formatDate(post.created_at, "long");
  const primaryTag = post.tags?.[0] ?? "";

  return (
    <div className="pr-wrap">
      <div className="pr-progress-bar" style={{ width: `${scrollPct}%` }} />

      <div className="pr-layout">
        {/* Left: ToC */}
        <aside className="pr-toc">
          <div className="pr-toc-label">Contents</div>
          {headings.map(({ id, text }) => (
            <a
              key={id}
              className={`pr-toc-item${activeSection === id ? " active" : ""}`}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            >{text}</a>
          ))}
        </aside>

        {/* Center: Article */}
        <article className="pr-article" ref={articleRef}>
          {primaryTag && <span className="pr-tag-pill">{primaryTag}</span>}
          <h1 className="pr-title">{post.title}</h1>
          <div className="pr-meta">
            <div className="pr-avatar" onClick={() => navigate("publicProfile", { userId: post.author_id })}>
              {post.profiles?.avatar_url
                ? <img src={post.profiles.avatar_url} alt={authorName} />
                : authorInitial
              }
            </div>
            <div className="pr-meta-text">
              <strong>{authorName}</strong><br />
              {displayDate}
            </div>
            {post.read_time_minutes > 0 && (
              <span className="pr-read-time">☕ {post.read_time_minutes} min</span>
            )}
          </div>

          {post.cover_url && (
            <img className="pr-cover" src={post.cover_url} alt={post.title} />
          )}

          <div className="pr-body">
            <VerseTooltip html={renderedHtml} />
          </div>

          {post.tags?.length > 0 && (
            <div className="pr-tags-row">
              {post.tags.map(tag => <span key={tag} className="pr-tag">{tag}</span>)}
            </div>
          )}
        </article>

        {/* Right: Sidebar */}
        <aside className="pr-sidebar">
          <div className="pr-widget pr-progress-widget">
            <div className="pr-widget-label">Progress</div>
            <div className="pr-pct">{scrollPct}%</div>
            <div className="pr-pct-sub">through this article</div>
            <div className="pr-pct-track"><div className="pr-pct-fill" style={{ width: `${scrollPct}%` }} /></div>
          </div>

          <div className="pr-widget">
            <div className="pr-widget-label">Actions</div>
            <button className="pr-action-btn" onClick={() => user && toggleLike.mutate(post.id)}>
              {liked ? "❤️" : "🤍"} Like ({post.like_count})
            </button>
            <button className="pr-action-btn">🔖 Bookmark</button>
            <button className="pr-action-btn">📤 Share</button>
          </div>

          {relatedPosts.length > 0 && (
            <div className="pr-widget">
              <div className="pr-widget-label">Related Posts</div>
              {relatedPosts.map(rp => (
                <a key={rp.id} className="pr-related-link" onClick={() => navigate("blog", { slug: rp.slug })}>
                  {rp.title}
                  {rp.read_time_minutes > 0 && <div className="pr-related-meta">☕ {rp.read_time_minutes} min</div>}
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>

      <button
        className={`pr-back-top${scrollPct > 10 ? " visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑ Top <span className="pr-back-top-pct">{scrollPct}%</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/blog/PostReadView.tsx src/styles/post-read.css
git commit -m "feat: PostReadView — three-column layout, ToC, scroll progress, related posts"
```

---

## Task 9: Verse Cache API + VerseTooltip Component

**Files:**
- Create: `src/api/verseCache.ts`
- Create: `src/hooks/useVerseCache.ts`
- Create: `src/components/blog/VerseTooltip.tsx`

- [ ] **Step 1: Create `src/api/verseCache.ts`**

```typescript
import { supabase } from "../lib/supabase";

export interface CachedVerse {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  text: string;
}

function parseRef(ref: string): { book: string; chapter: number; verseStart: number; verseEnd: number | null } | null {
  // Matches "John 3:16" or "John 3:16-18"
  const m = ref.trim().match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!m) return null;
  return { book: m[1], chapter: parseInt(m[2]), verseStart: parseInt(m[3]), verseEnd: m[4] ? parseInt(m[4]) : null };
}

export const verseCacheApi = {
  getVerse: async (ref: string): Promise<CachedVerse | null> => {
    const parsed = parseRef(ref);
    if (!parsed) return null;
    const { book, chapter, verseStart, verseEnd } = parsed;
    const q = supabase
      .from("verse_cache")
      .select("book, chapter, verse_start, verse_end, text")
      .eq("book", book)
      .eq("chapter", chapter)
      .eq("verse_start", verseStart);
    const { data } = await (verseEnd ? q.eq("verse_end", verseEnd) : q.is("verse_end", null));
    return (data?.[0] as CachedVerse | undefined) ?? null;
  },

  buildJwLibraryUrl: (ref: string): string => {
    const encoded = encodeURIComponent(ref);
    return `https://wol.jw.org/en/wol/b/r1/lp-e/nwtsty?q=${encoded}`;
  },
};
```

- [ ] **Step 2: Create `src/hooks/useVerseCache.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { verseCacheApi } from "../api/verseCache";

export function useCachedVerse(ref: string | null) {
  return useQuery({
    queryKey: ["verse", ref],
    queryFn: () => verseCacheApi.getVerse(ref!),
    enabled: !!ref,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 3: Create `src/components/blog/VerseTooltip.tsx`**

This component takes raw HTML, finds `[Book Chapter:Verse]` patterns, wraps them in interactive spans, and shows tooltips on hover/tap.

```tsx
import { useState, useMemo, useCallback } from "react";
import { verseCacheApi } from "../../api/verseCache";
import { useQuery } from "@tanstack/react-query";

interface TooltipState { ref: string; x: number; y: number; above: boolean }

function useVerseText(ref: string | null) {
  return useQuery({
    queryKey: ["verse", ref],
    queryFn: () => verseCacheApi.getVerse(ref!),
    enabled: !!ref,
    staleTime: Infinity,
  });
}

function injectVerseSpans(html: string): string {
  // Replace [Book Chapter:Verse] and [Book Chapter:Verse-Verse] with <span data-verse-ref="...">
  return html.replace(/\[([A-Z][a-zA-Z\s]+\d+:\d+(?:-\d+)?)\]/g, (_, ref) =>
    `<span class="pr-verse-ref" data-verse-ref="${ref}">${ref}</span>`
  );
}

function TooltipPopup({ verseRef, onClose }: { verseRef: string; onClose: () => void }) {
  const { data: verse, isLoading } = useVerseText(verseRef);
  const jwUrl = verseCacheApi.buildJwLibraryUrl(verseRef);

  return (
    <div className="pr-verse-tooltip" role="tooltip">
      <div className="pr-verse-tooltip-ref">{verseRef} · NWT</div>
      {isLoading && <div className="pr-verse-tooltip-text">Loading…</div>}
      {!isLoading && verse && <div className="pr-verse-tooltip-text">{verse.text}</div>}
      {!isLoading && !verse && <div className="pr-verse-tooltip-text">Tap to open in JW Library →</div>}
      <a className="pr-verse-tooltip-link" href={jwUrl} target="_blank" rel="noopener noreferrer" onClick={onClose}>
        Open in JW Library →
      </a>
    </div>
  );
}

interface Props { html: string }

export default function VerseTooltip({ html }: Props) {
  const [tooltip, setTooltip] = useState<{ ref: string } | null>(null);
  const processedHtml = useMemo(() => injectVerseSpans(html), [html]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("[data-verse-ref]") as HTMLElement | null;
    if (!target) { setTooltip(null); return; }
    const ref = target.dataset.verseRef ?? null;
    if (!ref) return;
    setTooltip(prev => prev?.ref === ref ? null : { ref });
  }, []);

  return (
    <div onClick={handleClick} style={{ position: "relative" }}>
      <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      {tooltip && (
        <div className="pr-verse-tooltip-wrap" onClick={e => e.stopPropagation()}>
          <TooltipPopup verseRef={tooltip.ref} onClose={() => setTooltip(null)} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add verse tooltip CSS to `src/styles/post-read.css`**

Append to the file:
```css
/* ── Verse tooltips ───────────────────────────────────────── */
.pr-verse-ref {
  color: var(--accent); font-weight: 600;
  border-bottom: 2px dotted #c084fc; cursor: pointer;
  display: inline;
}
.pr-verse-ref:hover { opacity: 0.8; }
.pr-verse-tooltip-wrap {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  z-index: 300; width: min(320px, 90vw);
}
.pr-verse-tooltip {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 18px;
  box-shadow: 0 8px 32px rgba(124,58,237,0.18);
}
.pr-verse-tooltip-ref { font-size: 11px; font-weight: 700; color: var(--accent); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.pr-verse-tooltip-text { font-size: 14px; line-height: 1.65; color: var(--text); margin-bottom: 10px; }
.pr-verse-tooltip-link { font-size: 12px; font-weight: 600; color: var(--accent); text-decoration: none; }
.pr-verse-tooltip-link:hover { text-decoration: underline; }
```

- [ ] **Step 5: Commit**

```bash
git add src/api/verseCache.ts src/hooks/useVerseCache.ts src/components/blog/VerseTooltip.tsx src/styles/post-read.css
git commit -m "feat: verse cache API, VerseTooltip component with NWT text + JW Library deep links"
```

---

## Task 10: Discovery Page

**Files:**
- Create: `src/views/blog/DiscoveryPage.tsx`
- Create: `src/styles/blog-discovery.css`

- [ ] **Step 1: Create `src/styles/blog-discovery.css`**

```css
/* ── Discovery wrapper ────────────────────────────────────── */
.disc-wrap { background: var(--bg); min-height: 100dvh; }

/* ── Hero ─────────────────────────────────────────────────── */
.disc-hero {
  background: linear-gradient(135deg, #1a1035 0%, #3b1f6b 55%, #7c3aed 100%);
  padding: 60px 24px 48px; text-align: center;
}
.disc-hero-title { font-size: clamp(28px, 5vw, 44px); font-weight: 800; color: white; letter-spacing: -0.5px; margin-bottom: 8px; }
.disc-hero-sub { font-size: 15px; color: rgba(255,255,255,0.6); margin-bottom: 28px; }
.disc-search-bar {
  display: flex; align-items: center; gap: 10px;
  max-width: 520px; margin: 0 auto;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px; padding: 12px 18px; backdrop-filter: blur(10px);
}
.disc-search-icon { color: rgba(255,255,255,0.5); flex-shrink: 0; font-size: 16px; }
.disc-search-input { flex: 1; background: transparent; border: none; outline: none; color: white; font-size: 15px; }
.disc-search-input::placeholder { color: rgba(255,255,255,0.4); }

/* ── Topic pills ──────────────────────────────────────────── */
.disc-pills-wrap { display: flex; gap: 8px; overflow-x: auto; padding: 20px 24px; scrollbar-width: none; max-width: 1140px; margin: 0 auto; }
.disc-pills-wrap::-webkit-scrollbar { display: none; }
.disc-pill {
  flex-shrink: 0; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;
  cursor: pointer; border: 1.5px solid var(--border); color: var(--text-muted);
  background: var(--card-bg); white-space: nowrap; transition: all 0.15s;
}
.disc-pill:hover { border-color: var(--accent); color: var(--accent); }
.disc-pill.active { background: var(--accent); color: white; border-color: var(--accent); }

/* ── Main layout ──────────────────────────────────────────── */
.disc-layout { display: grid; grid-template-columns: 1fr 260px; max-width: 1140px; margin: 0 auto; padding: 24px; gap: 32px; }

/* ── Featured post ────────────────────────────────────────── */
.disc-featured {
  display: grid; grid-template-columns: 1fr 1fr; border-radius: 16px;
  overflow: hidden; border: 1px solid var(--border); margin-bottom: 28px;
  background: var(--card-bg); min-height: 220px;
}
.disc-featured-img { width: 100%; height: 100%; object-fit: cover; background: linear-gradient(135deg, #1a1035, #7c3aed); }
.disc-featured-body { padding: 28px; display: flex; flex-direction: column; justify-content: center; }
.disc-featured-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
.disc-featured-title { font-size: 22px; font-weight: 800; line-height: 1.3; margin-bottom: 10px; color: var(--text); }
.disc-featured-excerpt { font-size: 14px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.disc-featured-meta { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
.disc-featured-avatar { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.disc-featured-avatar img { width: 100%; height: 100%; object-fit: cover; }

/* ── Post grid ────────────────────────────────────────────── */
.disc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.disc-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
.disc-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.disc-card-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: linear-gradient(135deg, #1a1035, #7c3aed); display: block; }
.disc-card-body { padding: 14px 16px 16px; }
.disc-card-tag { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 6px; }
.disc-card-title { font-size: 16px; font-weight: 700; line-height: 1.35; margin-bottom: 6px; color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.disc-card-excerpt { font-size: 13px; color: var(--text-muted); line-height: 1.55; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.disc-card-foot { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
.disc-card-avatar { width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: white; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.disc-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
.disc-card-dot { opacity: 0.4; }
.disc-load-more { display: block; margin: 24px auto 0; padding: 10px 28px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--card-bg); font-size: 14px; font-weight: 600; color: var(--text); cursor: pointer; }
.disc-load-more:hover { border-color: var(--accent); color: var(--accent); }

/* ── Right sidebar ────────────────────────────────────────── */
.disc-sidebar { display: flex; flex-direction: column; gap: 20px; }
.disc-sidebar-widget { background: var(--card-bg); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
.disc-sidebar-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; }
.disc-trending-item { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; cursor: pointer; }
.disc-trending-item:last-child { margin-bottom: 0; }
.disc-trending-num { font-size: 18px; font-weight: 800; color: var(--accent); opacity: 0.4; flex-shrink: 0; width: 20px; }
.disc-trending-title { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.4; }
.disc-trending-title:hover { color: var(--accent); }
.disc-writer-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.disc-writer-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: white; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
.disc-writer-avatar img { width: 100%; height: 100%; object-fit: cover; }
.disc-writer-name { font-size: 13px; font-weight: 600; color: var(--text); }
.disc-writer-count { font-size: 11px; color: var(--text-muted); }
.disc-writer-follow { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--accent); background: var(--hover); border: none; border-radius: 20px; padding: 4px 12px; cursor: pointer; flex-shrink: 0; }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .disc-layout { grid-template-columns: 1fr; }
  .disc-sidebar { flex-direction: row; }
  .disc-sidebar-widget { flex: 1; }
  .disc-featured { grid-template-columns: 1fr; }
  .disc-featured-img { aspect-ratio: 16/7; }
}
@media (max-width: 600px) {
  .disc-grid { grid-template-columns: 1fr; }
  .disc-sidebar { flex-direction: column; }
}
```

- [ ] **Step 2: Create `src/views/blog/DiscoveryPage.tsx`**

```tsx
import { useState, useDeferredValue } from "react";
import {
  usePublishedPosts, useFeaturedPost, useTrendingPosts, useActiveWriters, useSearchPosts
} from "../../hooks/useBlog";
import { formatDate } from "../../utils/formatters";
import "../../styles/blog-discovery.css";

const TOPICS = [
  "All", "Faith & Trust", "Bible Study", "Family", "New World",
  "Ministry", "Meeting Prep", "Endurance", "Creation",
  "Jehovah's Kingdom", "Comfort & Hope",
];

const PAGE_SIZE = 8;

function authorInitial(post: { profiles?: { display_name?: string | null } | null }) {
  return (post.profiles?.display_name ?? "A")[0].toUpperCase();
}

interface Props {
  navigate: (page: string, params?: Record<string, unknown>) => void;
  user: { id: string } | null;
}

export default function DiscoveryPage({ navigate, user }: Props) {
  const [activeTopic, setActiveTopic] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(searchQuery);

  const { data: featuredPost } = useFeaturedPost();
  const { data: trendingPosts = [] } = useTrendingPosts();
  const { data: activeWriters = [] } = useActiveWriters();
  const isSearching = deferredQuery.length > 1 || activeTopic !== "All";
  const { data: searchResults = [], isLoading: searchLoading } = useSearchPosts(
    deferredQuery.length > 1 ? deferredQuery : "",
    activeTopic !== "All" ? activeTopic : null,
  );
  const { data: allPosts = [], isLoading: allLoading } = usePublishedPosts();

  const displayPosts = isSearching ? searchResults : allPosts;
  const isLoading = isSearching ? searchLoading : allLoading;
  const visiblePosts = displayPosts.slice(0, page * PAGE_SIZE);
  const hasMore = displayPosts.length > visiblePosts.length;

  return (
    <div className="disc-wrap">
      {/* Hero */}
      <div className="disc-hero">
        <h1 className="disc-hero-title">Explore JW Study Articles</h1>
        <p className="disc-hero-sub">Written by the community, for the community</p>
        <div className="disc-search-bar">
          <span className="disc-search-icon">🔍</span>
          <input
            className="disc-search-input"
            placeholder="Search articles, topics, authors…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Topic pills */}
      <div className="disc-pills-wrap">
        {TOPICS.map(topic => (
          <button
            key={topic}
            className={`disc-pill${activeTopic === topic ? " active" : ""}`}
            onClick={() => { setActiveTopic(topic); setPage(1); }}
          >{topic}</button>
        ))}
      </div>

      <div className="disc-layout">
        <div>
          {/* Featured post */}
          {featuredPost && !isSearching && (
            <div className="disc-featured" onClick={() => navigate("blog", { slug: featuredPost.slug })}>
              {featuredPost.cover_url
                ? <img className="disc-featured-img" src={featuredPost.cover_url} alt={featuredPost.title} />
                : <div className="disc-featured-img" />
              }
              <div className="disc-featured-body">
                {featuredPost.tags?.[0] && <div className="disc-featured-tag">{featuredPost.tags[0]}</div>}
                <div className="disc-featured-title">{featuredPost.title}</div>
                {featuredPost.excerpt && <div className="disc-featured-excerpt">{featuredPost.excerpt}</div>}
                <div className="disc-featured-meta">
                  <div className="disc-featured-avatar">
                    {featuredPost.profiles?.avatar_url
                      ? <img src={featuredPost.profiles.avatar_url} alt="" />
                      : authorInitial(featuredPost)
                    }
                  </div>
                  <span>{featuredPost.profiles?.display_name ?? "Anonymous"}</span>
                  <span className="disc-card-dot">·</span>
                  <span>{formatDate(featuredPost.created_at, "short")}</span>
                  {featuredPost.read_time_minutes > 0 && <><span className="disc-card-dot">·</span><span>{featuredPost.read_time_minutes} min</span></>}
                </div>
              </div>
            </div>
          )}

          {/* Post grid */}
          {isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>Loading…</div>
          ) : visiblePosts.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>No articles found.</div>
          ) : (
            <div className="disc-grid">
              {visiblePosts.map(post => (
                <div key={post.id} className="disc-card" onClick={() => navigate("blog", { slug: post.slug })}>
                  {post.cover_url
                    ? <img className="disc-card-img" src={post.cover_url} alt={post.title} />
                    : <div className="disc-card-img" />
                  }
                  <div className="disc-card-body">
                    {post.tags?.[0] && <div className="disc-card-tag">{post.tags[0]}</div>}
                    <div className="disc-card-title">{post.title}</div>
                    {post.excerpt && <div className="disc-card-excerpt">{post.excerpt}</div>}
                    <div className="disc-card-foot">
                      <div className="disc-card-avatar">
                        {post.profiles?.avatar_url
                          ? <img src={post.profiles.avatar_url} alt="" />
                          : authorInitial(post)
                        }
                      </div>
                      <span>{post.profiles?.display_name ?? "Anonymous"}</span>
                      <span className="disc-card-dot">·</span>
                      <span>{formatDate(post.created_at, "short")}</span>
                      {post.read_time_minutes > 0 && <><span className="disc-card-dot">·</span><span>{post.read_time_minutes} min</span></>}
                      <span className="disc-card-dot">·</span>
                      <span>❤️ {post.like_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <button className="disc-load-more" onClick={() => setPage(p => p + 1)}>
              Load more articles
            </button>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="disc-sidebar">
          {trendingPosts.length > 0 && (
            <div className="disc-sidebar-widget">
              <div className="disc-sidebar-label">Trending This Week</div>
              {trendingPosts.map((post, i) => (
                <div key={post.id} className="disc-trending-item" onClick={() => navigate("blog", { slug: post.slug })}>
                  <span className="disc-trending-num">{i + 1}</span>
                  <span className="disc-trending-title">{post.title}</span>
                </div>
              ))}
            </div>
          )}

          {activeWriters.length > 0 && (
            <div className="disc-sidebar-widget">
              <div className="disc-sidebar-label">Active Writers</div>
              {activeWriters.map(writer => (
                <div key={writer.id} className="disc-writer-row">
                  <div className="disc-writer-avatar">
                    {writer.avatar_url ? <img src={writer.avatar_url} alt="" /> : (writer.display_name ?? "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="disc-writer-name">{writer.display_name ?? "Anonymous"}</div>
                    <div className="disc-writer-count">{writer.post_count} post{writer.post_count !== 1 ? "s" : ""} this month</div>
                  </div>
                  <button className="disc-writer-follow" onClick={() => navigate("publicProfile", { userId: writer.id })}>
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/views/blog/DiscoveryPage.tsx src/styles/blog-discovery.css
git commit -m "feat: DiscoveryPage — hero search, topic pills, featured post, grid, trending, active writers"
```

---

## Task 11: Wire PostReadView and DiscoveryPage into BlogPage

**Files:**
- Modify: `src/views/blog/BlogPage.tsx`

- [ ] **Step 1: Import the new components at the top of BlogPage.tsx**

```tsx
import PostReadView from "./PostReadView";
import DiscoveryPage from "./DiscoveryPage";
```

- [ ] **Step 2: Find the existing blog list and post-view rendering logic**

Look for the conditional that shows either the post list or a single post (keyed on whether `slug` is set). It will look like:

```tsx
// existing pattern somewhere in BlogPage's return
{slug ? <PostView post={post} ... /> : <PostList ... />}
```

- [ ] **Step 3: Replace the list view with DiscoveryPage and post view with PostReadView**

```tsx
{slug
  ? post
    ? <PostReadView post={post} user={user} navigate={navigate} />
    : <div style={{padding: "60px 24px", textAlign: "center", color: "var(--text-muted)"}}>Post not found.</div>
  : <DiscoveryPage navigate={navigate} user={user} />
}
```

Remove or keep the old `PostView` and list components — they can stay for reference but the conditional above replaces them in the render path. If they are no longer rendered, delete their imports to keep the bundle clean.

- [ ] **Step 4: Commit**

```bash
git add src/views/blog/BlogPage.tsx
git commit -m "feat: wire DiscoveryPage and PostReadView into BlogPage routing"
```

---

## Task 12: Update app/blog/page.tsx to pre-fetch new query shapes

**Files:**
- Modify: `app/blog/page.tsx`

- [ ] **Step 1: Add featured + trending prefetches**

```tsx
await Promise.allSettled([
  queryClient.prefetchQuery({ queryKey: ["blog", "published", null], queryFn: () => blogApi.listPublished() }),
  queryClient.prefetchQuery({ queryKey: ["blog", "featured"], queryFn: () => blogApi.getFeaturedPost() }),
  queryClient.prefetchQuery({ queryKey: ["blog", "trending"], queryFn: () => blogApi.getTrendingPosts() }),
]);
```

- [ ] **Step 2: Commit**

```bash
git add app/blog/page.tsx
git commit -m "feat: prefetch featured and trending posts on /blog SSR"
```

---

## Task 13: Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Test WriterPage**

Navigate to `http://localhost:3000/blog/new` (must be logged in).
Verify:
- Top bar shows logo + "Saved" status
- Cover image zone is visible; clicking opens file picker
- Title and subtitle inputs work
- Block editor renders; typing `/` shows slash menu; pressing Enter adds block
- Markdown toggle switches to textarea showing markdown
- Right sidebar shows word count, tag input, series dropdown, checklist
- Clicking "Publish →" opens modal with post summary
- Clicking "Publish now" creates the post and navigates to /blog

- [ ] **Step 3: Test PostReadView**

Navigate to an existing blog post (e.g. `http://localhost:3000/blog/[any-slug]`).
Verify:
- Three-column layout renders (ToC on left, article center, sidebar right)
- Scrolling updates the top progress bar and floating back-to-top button percentage
- ToC active link updates as you scroll past headings
- Like button works
- Related posts appear in right sidebar
- On mobile (< 700px): single column, back-to-top still works

- [ ] **Step 4: Test Verse Tooltips**

In a post that contains `[John 3:16]` in its content, verify:
- The text renders as a purple underlined span
- Clicking it shows a tooltip with the NWT verse text
- "Open in JW Library →" link points to `wol.jw.org`
- Clicking elsewhere dismisses the tooltip

- [ ] **Step 5: Test Discovery Page**

Navigate to `http://localhost:3000/blog`.
Verify:
- Hero gradient renders with search bar
- Topic pills scroll horizontally
- Featured post banner appears (if one is flagged `is_featured = true` in DB)
- Post grid shows 8 posts; "Load more" shows 8 more
- Clicking a topic pill filters the grid
- Typing in the search bar filters within ~1 second
- Trending and Active Writers sidebars populate

- [ ] **Step 6: Commit if any fixes made during testing**

```bash
git add -u
git commit -m "fix: smoke test corrections for blog redesign"
```
