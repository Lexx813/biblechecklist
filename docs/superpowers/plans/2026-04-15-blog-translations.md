# Blog Post Translations Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Translations tab to the blog post editor so authors can add AI-generated, human-editable translations (title, excerpt, full HTML content) for any of the 8 supported app languages.

**Architecture:** A new `app/api/translate/route.ts` route handler auth-gates and streams Claude SSE using the same raw Anthropic pipe pattern as `/api/ai-chat`. A pure `parseTranslationStream` utility extracts the three fields from accumulated text using delimiter scanning. The `PostEditor` in `BlogDashboard.tsx` gains a tab bar and an inline `TranslationsTab` component that reads/writes `form.translations`.

**Tech Stack:** Next.js App Router route handler, Anthropic Claude Haiku (raw SSE), React, Vitest (node environment — pure function tests only)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/api/blog.ts` | Modify | Add `content?` to `BlogPostTranslation`; add `translations` to `listMine` select |
| `src/lib/translateStream.ts` | Create | Pure `parseTranslationStream` function — no React, no fetch |
| `src/lib/__tests__/translateStream.test.ts` | Create | Unit tests for the parser |
| `app/api/translate/route.ts` | Create | POST route — auth, Claude call, SSE pipe |
| `src/views/blog/BlogDashboard.tsx` | Modify | `EMPTY_FORM` update; tab bar; `TranslationsTab` component; `userLang` hoisted |
| `src/styles/blog.css` | Modify | Styles for tab bar and translations UI |

---

## Task 1: Type updates and data fetching

**Files:**
- Modify: `src/api/blog.ts`

- [ ] **Step 1: Update `BlogPostTranslation` to include `content`**

In `src/api/blog.ts`, change line 4:

```ts
// before
export interface BlogPostTranslation { title?: string; excerpt?: string }

// after
export interface BlogPostTranslation { title?: string; excerpt?: string; content?: string }
```

- [ ] **Step 2: Add `translations` to `listMine` select**

In `src/api/blog.ts`, change the `listMine` select string (line 74):

```ts
// before
.select("id, title, slug, excerpt, content, cover_url, published, created_at, updated_at")

// after
.select("id, title, slug, excerpt, content, cover_url, published, created_at, updated_at, translations, lang")
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors related to `BlogPostTranslation` or `translations`.

- [ ] **Step 4: Commit**

```bash
git add src/api/blog.ts
git commit -m "feat: add content field to BlogPostTranslation, fetch translations in listMine"
```

---

## Task 2: Stream parser utility + tests

**Files:**
- Create: `src/lib/translateStream.ts`
- Create: `src/lib/__tests__/translateStream.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/translateStream.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseTranslationStream } from "../translateStream";

describe("parseTranslationStream", () => {
  it("returns empty strings when no delimiters present", () => {
    const result = parseTranslationStream("some partial text");
    expect(result).toEqual({ title: "", excerpt: "", content: "" });
  });

  it("parses a complete response correctly", () => {
    const input = `---TITLE---
Hola Mundo
---EXCERPT---
Un resumen breve
---CONTENT---
<p>Contenido completo aquí</p>`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Hola Mundo");
    expect(result.excerpt).toBe("Un resumen breve");
    expect(result.content).toBe("<p>Contenido completo aquí</p>");
  });

  it("parses a partial response mid-stream (only title so far)", () => {
    const input = `---TITLE---
Partially streamed title`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Partially streamed title");
    expect(result.excerpt).toBe("");
    expect(result.content).toBe("");
  });

  it("parses title and excerpt but not yet content", () => {
    const input = `---TITLE---
Full title
---EXCERPT---
Full excerpt`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Full title");
    expect(result.excerpt).toBe("Full excerpt");
    expect(result.content).toBe("");
  });

  it("preserves HTML tags in content", () => {
    const input = `---TITLE---
Title
---EXCERPT---
Excerpt
---CONTENT---
<p>Para one</p><p>Para two</p>`;
    const result = parseTranslationStream(input);
    expect(result.content).toBe("<p>Para one</p><p>Para two</p>");
  });

  it("trims whitespace from title and excerpt but not content", () => {
    const input = `---TITLE---
  Padded Title  
---EXCERPT---
  Padded Excerpt  
---CONTENT---
<p>Content</p>`;
    const result = parseTranslationStream(input);
    expect(result.title).toBe("Padded Title");
    expect(result.excerpt).toBe("Padded Excerpt");
    expect(result.content).toBe("<p>Content</p>");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/__tests__/translateStream.test.ts 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '../translateStream'"

- [ ] **Step 3: Implement `parseTranslationStream`**

Create `src/lib/translateStream.ts`:

```ts
export interface TranslationFields {
  title: string;
  excerpt: string;
  content: string;
}

/**
 * Parses Claude's streamed translation output into discrete fields.
 * Works at any point mid-stream — call it after each chunk is appended.
 *
 * Expected format from Claude:
 *   ---TITLE---
 *   [title text]
 *   ---EXCERPT---
 *   [excerpt text]
 *   ---CONTENT---
 *   [full HTML content]
 */
export function parseTranslationStream(text: string): TranslationFields {
  const titleMatch   = text.match(/---TITLE---\n?([\s\S]*?)(?=---EXCERPT---|---CONTENT---|$)/);
  const excerptMatch = text.match(/---EXCERPT---\n?([\s\S]*?)(?=---CONTENT---|$)/);
  const contentMatch = text.match(/---CONTENT---\n?([\s\S]*)$/);

  return {
    title:   titleMatch?.[1]?.trim()   ?? "",
    excerpt: excerptMatch?.[1]?.trim() ?? "",
    content: contentMatch?.[1]         ?? "",
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/__tests__/translateStream.test.ts 2>&1 | tail -20
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/translateStream.ts src/lib/__tests__/translateStream.test.ts
git commit -m "feat: add translateStream parser utility with tests"
```

---

## Task 3: Translate API route

**Files:**
- Create: `app/api/translate/route.ts`

- [ ] **Step 1: Create the route handler**

Create `app/api/translate/route.ts`:

```ts
/**
 * POST /api/translate
 * Body: { title: string, excerpt: string, content: string, targetLang: string }
 * Auth: Bearer <supabase-access-token>
 * Response: text/event-stream (Anthropic SSE piped through)
 *
 * Claude is asked to output translations in a delimited format:
 *   ---TITLE---
 *   ---EXCERPT---
 *   ---CONTENT---
 */

export const runtime = "edge";

const SUPABASE_URL  = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "").trim();
const SUPABASE_ANON = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const LANG_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  tl: "Tagalog",
  fr: "French",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
};

export async function POST(req: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = auth.slice(7);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON },
  });
  if (!userRes.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!ANTHROPIC_KEY) {
    return new Response(
      JSON.stringify({ error: "AI service not configured." }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────────
  let title: string, excerpt: string, content: string, targetLang: string;
  try {
    const body = await req.json();
    title      = String(body.title      ?? "").slice(0, 300);
    excerpt    = String(body.excerpt    ?? "").slice(0, 600);
    content    = String(body.content    ?? "").slice(0, 20000);
    targetLang = String(body.targetLang ?? "").slice(0, 10);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (!targetLang || !title) {
    return new Response("Missing title or targetLang", { status: 400 });
  }

  const langLabel = LANG_LABELS[targetLang] ?? targetLang;

  // ── Call Claude with streaming ────────────────────────────────────────────────
  const userPrompt = [
    `Translate the following blog post into ${langLabel}.`,
    `Output ONLY the translation in this exact format — no preamble, no explanation:`,
    ``,
    `---TITLE---`,
    `[translated title]`,
    `---EXCERPT---`,
    `[translated excerpt]`,
    `---CONTENT---`,
    `[translated HTML content — preserve ALL HTML tags exactly]`,
    ``,
    `Title:`,
    title,
    ``,
    `Excerpt:`,
    excerpt,
    ``,
    `Content:`,
    content,
  ].join("\n");

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      stream: true,
      system: "You are a translation assistant. Translate blog posts accurately and naturally, preserving all HTML tags and structure. Output only the requested format.",
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!claudeRes.ok) {
    const detail = await claudeRes.text().catch(() => "");
    console.error("[translate] Claude API error:", claudeRes.status, detail.slice(0, 200));
    return new Response("AI service temporarily unavailable", { status: 502 });
  }

  return new Response(claudeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "translate" | head -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/translate/route.ts
git commit -m "feat: add /api/translate route handler with Claude SSE streaming"
```

---

## Task 4: Translations tab UI + CSS

**Files:**
- Modify: `src/views/blog/BlogDashboard.tsx`
- Modify: `src/styles/blog.css`

- [ ] **Step 1: Add imports to `BlogDashboard.tsx`**

At the top of `src/views/blog/BlogDashboard.tsx`, add two imports after the existing ones:

```ts
import { supabase } from "../../lib/supabase";
import { LANGUAGES } from "../../i18n";
import { parseTranslationStream } from "../../lib/translateStream";
```

- [ ] **Step 2: Update `EMPTY_FORM`**

Change line 12 in `src/views/blog/BlogDashboard.tsx`:

```ts
// before
const EMPTY_FORM = { title: "", excerpt: "", content: "", cover_url: "", published: false };

// after
type Translation = { title: string; excerpt: string; content: string };
const EMPTY_FORM = { title: "", excerpt: "", content: "", cover_url: "", published: false, translations: {} as Record<string, Translation> };
```

- [ ] **Step 3: Add `TranslationsTab` component**

Add this entire component to `BlogDashboard.tsx` just before the `PostEditor` function definition (before line 15):

```tsx
// ── Translations tab ──────────────────────────────────────────────────────────
function TranslationsTab({ translations, onChange, primaryLang, postTitle, postExcerpt, postContent, disabled }: {
  translations: Record<string, Translation>;
  onChange: (t: Record<string, Translation>) => void;
  primaryLang: string;
  postTitle: string;
  postExcerpt: string;
  postContent: string;
  disabled: boolean;
}) {
  const availableLangs = LANGUAGES.filter(l => l.code !== primaryLang);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const current: Translation = activeLang
    ? (translations[activeLang] ?? { title: "", excerpt: "", content: "" })
    : { title: "", excerpt: "", content: "" };

  function setField(field: keyof Translation, value: string) {
    if (!activeLang) return;
    onChange({ ...translations, [activeLang]: { ...current, [field]: value } });
  }

  function removeTranslation() {
    if (!activeLang) return;
    const next = { ...translations };
    delete next[activeLang];
    onChange(next);
    setActiveLang(null);
  }

  async function generate() {
    if (!activeLang) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenerating(true);
    setGenError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sign in required.");

      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: postTitle,
          excerpt: postExcerpt,
          content: postContent,
          targetLang: activeLang,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) throw new Error(await res.text().catch(() => "Translation failed."));

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   accumulated = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw) as { type: string; delta?: { type: string; text: string } };
            if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
              accumulated += evt.delta.text;
              const parsed = parseTranslationStream(accumulated);
              onChange({ ...translations, [activeLang]: parsed });
            }
          } catch { /* skip malformed SSE chunks */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setGenError((err as Error).message || "Translation failed. Please try again.");
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="translations-tab">
      <div className="translations-lang-pills">
        {availableLangs.map(l => (
          <button
            key={l.code}
            type="button"
            className={[
              "translations-pill",
              activeLang === l.code ? "translations-pill--active" : "",
              translations[l.code] ? "translations-pill--done" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => setActiveLang(l.code)}
          >
            {l.label}
            {translations[l.code] && <span className="translations-pill-dot" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {!activeLang && (
        <p className="translations-empty">Select a language above to add or edit a translation.</p>
      )}

      {activeLang && (
        <div className="translations-editor">
          <div className="translations-generate-row">
            <button
              type="button"
              className="translations-generate-btn"
              onClick={generate}
              disabled={generating || disabled || !postTitle.trim()}
            >
              {generating ? "Generating…" : "Generate with AI"}
            </button>
            {generating && <span className="translations-generating-hint">Translating — fields will fill in as it streams…</span>}
          </div>
          {genError && <div className="blog-editor-error">{genError}</div>}

          <label className="blog-editor-label">Title</label>
          <input
            className="blog-editor-input"
            value={current.title}
            onChange={e => setField("title", e.target.value)}
            disabled={disabled}
            maxLength={150}
          />

          <label className="blog-editor-label">Excerpt</label>
          <textarea
            className="blog-editor-textarea blog-editor-textarea--sm"
            value={current.excerpt}
            onChange={e => setField("excerpt", e.target.value)}
            disabled={disabled}
            maxLength={300}
          />

          <label className="blog-editor-label">Content</label>
          <Suspense fallback={<div style={{ height: 200 }} />}>
            <RichTextEditor
              key={activeLang}
              content={current.content}
              onChange={html => setField("content", html)}
              disabled={disabled}
            />
          </Suspense>

          {translations[activeLang] && (
            <button
              type="button"
              className="translations-remove-btn"
              onClick={removeTranslation}
              disabled={disabled}
            >
              Remove {LANGUAGES.find(l => l.code === activeLang)?.label} translation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Hoist `userLang` and update `initialForm` in `PostEditor`**

In `PostEditor`, move `const { t, i18n } = useTranslation();` to the top of the function body (before `useState` calls), then update `initialForm` and add `userLang` + tab state. The first ~25 lines of `PostEditor` should become:

```tsx
function PostEditor({ userId, post, onDone }) {
  const { t, i18n } = useTranslation();
  const userLang = i18n?.language?.split("-")[0] ?? "en";

  const initialForm = post
    ? {
        title: post.title,
        excerpt: post.excerpt ?? "",
        content: post.content ?? "",
        cover_url: post.cover_url ?? "",
        published: post.published,
        translations: (post.translations as Record<string, Translation>) ?? {},
      }
    : EMPTY_FORM;

  const [form, setForm] = useState(initialForm);
  const [activeTab, setActiveTab] = useState<"content" | "translations">("content");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showExcerptEmoji, setShowExcerptEmoji] = useState(false);
  const fileInputRef = useRef(null);
  const excerptRef = useRef(null);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  // ... rest unchanged
```

Also remove the duplicate `const { t, i18n } = useTranslation();` that currently appears at line 52.

Also update `handleSave` to remove the local `userLang` declaration (now hoisted):

```tsx
async function handleSave(publish) {
  setError("");
  if (!form.title.trim()) return setError(t("blogDash.errorTitleRequired"));
  const contentEmpty = !form.content || form.content === "<p></p>";
  if (contentEmpty) return setError(t("blogDash.errorContentRequired"));

  // userLang is now from component scope — no local declaration needed
  const payload = { ...form, published: publish, lang: post?.lang ?? userLang };
  // ... rest unchanged
```

- [ ] **Step 5: Add tab bar + `TranslationsTab` to the `PostEditor` return**

Replace the opening of the form in the `PostEditor` return (currently `<div className="blog-editor-form">`):

```tsx
return (
  <div className="blog-editor">
    <div className="blog-editor-header">
      <button className="back-btn" onClick={handleBack}>{t("blogDash.editorBack")}</button>
      <h2>{post ? t("blogDash.editPostTitle") : t("blogDash.newPostTitle")}</h2>
    </div>

    <div className="blog-editor-tabs-bar">
      <button
        type="button"
        className={`blog-editor-tab${activeTab === "content" ? " blog-editor-tab--active" : ""}`}
        onClick={() => setActiveTab("content")}
      >
        {t("blogDash.tabContent") ?? "Content"}
      </button>
      <button
        type="button"
        className={`blog-editor-tab${activeTab === "translations" ? " blog-editor-tab--active" : ""}`}
        onClick={() => setActiveTab("translations")}
      >
        {t("blogDash.tabTranslations") ?? "Translations"}
        {Object.keys(form.translations ?? {}).length > 0 && (
          <span className="blog-editor-tab-badge">{Object.keys(form.translations).length}</span>
        )}
      </button>
    </div>

    {activeTab === "content" && (
      <div className="blog-editor-form">
        {/* === all existing form fields unchanged === */}
        {/* title, excerpt, cover, content, error, actions */}
      </div>
    )}

    {activeTab === "translations" && (
      <div className="blog-editor-form">
        <TranslationsTab
          translations={form.translations ?? {}}
          onChange={t => set("translations", t)}
          primaryLang={post?.lang ?? userLang}
          postTitle={form.title}
          postExcerpt={form.excerpt}
          postContent={form.content}
          disabled={isPending}
        />
        <div className="blog-editor-actions">
          <button
            className="blog-editor-btn blog-editor-btn--draft"
            onClick={() => handleSave(false)}
            disabled={isPending}
          >
            {isPending ? t("common.saving") : t("blogDash.saveDraft")}
          </button>
          <button
            className="blog-editor-btn blog-editor-btn--publish"
            onClick={() => handleSave(true)}
            disabled={isPending}
          >
            {isPending ? t("common.saving") : post?.published ? t("blogDash.saveKeepPublished") : t("blogDash.savePublish")}
          </button>
        </div>
      </div>
    )}
  </div>
);
```

- [ ] **Step 6: Add CSS to `src/styles/blog.css`**

Append to the end of `src/styles/blog.css`:

```css
/* ── Blog editor tabs ─────────────────────────────────────────── */
.blog-editor-tabs-bar {
  display: flex;
  gap: 2px;
  background: var(--card-bg);
  border-bottom: 1.5px solid var(--border);
  padding: 0 24px;
  max-width: 760px;
  margin: 0 auto;
}
.blog-editor-tab {
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  background: none;
  border: none;
  border-bottom: 2.5px solid transparent;
  padding: 12px 18px 10px;
  cursor: pointer;
  transition: color var(--dur-fast), border-color var(--dur-fast);
  display: flex;
  align-items: center;
  gap: 6px;
}
.blog-editor-tab:hover { color: var(--text-secondary); }
.blog-editor-tab--active { color: var(--teal); border-bottom-color: var(--teal); }
.blog-editor-tab-badge {
  background: var(--teal);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 999px;
}

/* ── Translations tab ─────────────────────────────────────────── */
.translations-tab { display: flex; flex-direction: column; gap: 6px; }

.translations-lang-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}
.translations-pill {
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color var(--dur-fast), color var(--dur-fast), background var(--dur-fast);
}
.translations-pill:hover { border-color: var(--teal); color: var(--teal); }
.translations-pill--active { border-color: var(--teal); background: var(--teal); color: #fff; }
.translations-pill--done { border-color: var(--teal); }
.translations-pill--active .translations-pill-dot { background: rgba(255,255,255,0.7); }
.translations-pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--teal);
  flex-shrink: 0;
}

.translations-empty {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 16px;
  text-align: center;
}

.translations-editor { display: flex; flex-direction: column; gap: 6px; }

.translations-generate-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.translations-generate-btn {
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--teal);
  background: transparent;
  color: var(--teal);
  cursor: pointer;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.translations-generate-btn:hover:not(:disabled) { background: var(--teal); color: #fff; }
.translations-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.translations-generating-hint { font-size: 12px; color: var(--text-muted); }

.translations-remove-btn {
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  border: 1.5px solid #e57373;
  background: transparent;
  color: #e57373;
  cursor: pointer;
  margin-top: 16px;
  align-self: flex-start;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.translations-remove-btn:hover:not(:disabled) { background: #e57373; color: #fff; }
.translations-remove-btn:disabled { opacity: 0.6; cursor: not-allowed; }
```

- [ ] **Step 7: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 8: Run full test suite**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass (31+ tests).

- [ ] **Step 9: Commit**

```bash
git add src/views/blog/BlogDashboard.tsx src/styles/blog.css
git commit -m "feat: add Translations tab to blog post editor with AI streaming generation"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Route handler `app/api/translate/route.ts` — Task 3
- ✅ Streaming SSE piped back — Task 3
- ✅ Claude Haiku model — Task 3
- ✅ `BlogPostTranslation.content` type added — Task 1
- ✅ `translations` fetched in `listMine` — Task 1
- ✅ Tab bar "Content | Translations" — Task 4 Step 5
- ✅ Language pills (all langs minus primary) — Task 4 Step 3
- ✅ Pill dot badge when translation exists — Task 4 Step 3, Step 6
- ✅ Per-language title/excerpt/content editor — Task 4 Step 3
- ✅ RichTextEditor reused with `key={activeLang}` for remount — Task 4 Step 3
- ✅ "Generate with AI" button + streaming into fields — Task 4 Step 3
- ✅ All fields editable at any time — Task 4 Step 3
- ✅ "Remove translation" button — Task 4 Step 3
- ✅ `EMPTY_FORM` gets `translations: {}` — Task 4 Step 2
- ✅ `initialForm` pre-populates translations for existing posts — Task 4 Step 4
- ✅ Save buttons present on Translations tab — Task 4 Step 5
- ✅ No changes to reader logic (deferred per spec) — not in plan
- ✅ `parseTranslationStream` pure function, tested — Task 2
