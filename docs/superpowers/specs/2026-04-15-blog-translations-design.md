# Blog Post Translations Editor

**Date:** 2026-04-15  
**Status:** Approved

## Summary

Add a Translations tab to the blog post editor that lets authors add translated versions of a post (title, excerpt, full content) for any of the 8 supported app languages. AI generates a draft translation via streaming; the author reviews and edits before saving.

## Architecture

### 1. `app/api/translate/route.ts` (new)

- **Method:** POST  
- **Auth:** Bearer token (same Supabase check as `/api/ai-chat`)  
- **Body:** `{ title: string, excerpt: string, content: string, targetLang: string }`  
- **Model:** `claude-haiku-4-5-20251001` (fast, cheap, same as ai-chat)  
- **Response:** `text/event-stream` — raw Anthropic SSE piped straight back

Claude is prompted to output a delimited format so the client can route chunks to the right field while streaming:

```
---TITLE---
Translated title text
---EXCERPT---
Translated excerpt text
---CONTENT---
<p>Full translated HTML content</p>
```

The route does NOT parse or transform Claude's output — it pipes the SSE body directly, matching the existing ai-chat pattern.

### 2. `PostEditor` tab structure (modified)

Add a tab bar at the top of the editor form: **Content** | **Translations**

- The existing form fields (title, excerpt, cover, content) become the Content tab — no changes to their logic
- The Translations tab is a new section rendered conditionally below the tab bar

### 3. Type update

`BlogPostTranslation` in `src/api/blog.ts`:
```ts
// before
export interface BlogPostTranslation { title?: string; excerpt?: string }

// after
export interface BlogPostTranslation { title?: string; excerpt?: string; content?: string }
```

## Translations Tab UI

### Language picker
- Row of pill buttons: all 8 app languages (`LANGUAGES` from `src/i18n.ts`) minus the post's primary `lang`
- Active pill = language currently being edited
- Pill shows a filled indicator dot if a translation already exists for that language

### Per-language editor
Shown when a language pill is selected:

| Field | Component |
|-------|-----------|
| Title | `<input>` (same class as primary title input) |
| Excerpt | `<textarea>` (same class as primary excerpt textarea) |
| Content | Lazy-loaded `RichTextEditor` (same component as primary content) |

- "Generate with AI" button above the fields
- While generating: button disabled and shows "Generating…"; title populates first, then excerpt, then content streams in
- All fields are editable at any point (before, during, after generation)
- "Remove translation" button at the bottom clears that language's entry from `translations`

### Empty state
When no language is selected: prompt text "Select a language above to add a translation."

## Data Flow

### State
`form.translations` type: `Record<string, { title: string; excerpt: string; content: string }>`

`EMPTY_FORM` updated to include `translations: {}`

`initialForm` when editing an existing post pre-populates `translations` from `post.translations`

### Streaming client logic
The client reads the SSE stream from `/api/translate`. The route pipes raw Anthropic SSE, so the client receives `data: {...}` events and must extract `content_block_delta` text from them (same parsing pattern as the existing ai-chat client). The accumulated text is scanned for `---TITLE---`, `---EXCERPT---`, `---CONTENT---` delimiters to route chunks into the correct state key for the active language.

### Save
No changes to the save path. `handleSave` already spreads the full form into the payload. The `update` API already conditionally includes `translations` in the Supabase update. The `create` API already defaults `translations` to `{}`.

## What This Does NOT Change

- `BlogPage.tsx` reader logic — it currently only checks `translations.es` hardcoded. Fixing the reader to dynamically use the user's current language is a separate task.
- `listMine` Supabase query — does not fetch `translations`, so the dashboard post list is unaffected.
- Any admin or moderation views.

## Files Affected

| File | Change |
|------|--------|
| `app/api/translate/route.ts` | New route handler |
| `src/views/blog/BlogDashboard.tsx` | Tab bar + Translations tab component |
| `src/api/blog.ts` | `BlogPostTranslation` type update; `EMPTY_FORM` already fixed |
