# Study Notes — Method Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a template picker modal before the note editor so users can start with Blank, Verse-by-Verse (free), Inductive OIA, or SOAP (premium) structure pre-filled.

**Architecture:** No DB changes — the chosen template string is pre-filled into the existing `content` field of a new note. A new `NoteTemplatePicker` modal component intercepts the "New Note" flow in `StudyNotesPage.jsx`. The picker shows 4 cards (2×2 grid), with premium templates locked for free users. Selecting a template and tapping "Continue" opens the existing note editor with template content pre-filled.

**Tech Stack:** Next.js 15, React 19, TanStack Query v5 (no new queries), vanilla CSS, `useSubscription` hook (handles active/trialing/gifted ✅)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/data/noteTemplates.js` | Create | 4 template definitions: key, name, preview lines, content string, isPremium |
| `src/components/NoteTemplatePicker.jsx` | Create | Modal with 2×2 template card grid, premium lock, Continue button |
| `src/styles/note-templates.css` | Create | Picker modal styles |
| `src/views/studynotes/StudyNotesPage.jsx` | Modify | Show picker instead of immediately opening editor on "New Note" |

---

## Task 1: Template Definitions

**Files:**
- Create: `src/data/noteTemplates.js`

- [ ] **Step 1: Write template data**

```js
// src/data/noteTemplates.js

export const NOTE_TEMPLATES = [
  {
    key: "blank",
    name: "Blank",
    description: "Start with an empty note",
    previewLines: [],
    isPremium: false,
    content: "",
  },
  {
    key: "verse_by_verse",
    name: "Verse-by-Verse",
    description: "Structured reflection per verse",
    previewLines: ["## [Book Chapter:Verse]", "**Verse:**", "**Reflection:**"],
    isPremium: false,
    content: `## [Book Chapter:Verse]

**Verse:**

**Reflection:**

---

## [Book Chapter:Verse]

**Verse:**

**Reflection:**`,
  },
  {
    key: "inductive",
    name: "Inductive Study",
    description: "Observe · Interpret · Apply",
    previewLines: ["📖 Observe", "🔍 Interpret", "✏️ Apply"],
    isPremium: true,
    content: `# [Title]

## 📖 Observe
*What does the text say? (Facts, repeated words, key figures, context)*



## 🔍 Interpret
*What does the text mean? (Main point, why written, cross-references)*



## ✏️ Apply
*How does this apply to my life? (Specific action or attitude change)*`,
  },
  {
    key: "soap",
    name: "SOAP",
    description: "Scripture · Observation · Application · Prayer",
    previewLines: ["Scripture", "Observation", "Application", "Prayer"],
    isPremium: true,
    content: `# [Title]

## Scripture
*Write out the verse(s) in full*



## Observation
*What stands out? Who, what, when, where, why?*



## Application
*How does this speak to my current situation?*



## Prayer
*Personal prayer based on this passage*`,
  },
];
```

- [ ] **Step 2: Verify**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/data/noteTemplates.js
git commit -m "feat: add study note template definitions"
```

---

## Task 2: NoteTemplatePicker Component

**Files:**
- Create: `src/components/NoteTemplatePicker.jsx`
- Create: `src/styles/note-templates.css`

- [ ] **Step 1: Write NoteTemplatePicker CSS**

```css
/* src/styles/note-templates.css */

.ntp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 300;
  padding: 0;
}

@media (min-width: 540px) {
  .ntp-overlay {
    align-items: center;
  }
}

.ntp-sheet {
  background: var(--card-bg);
  border-radius: 22px 22px 0 0;
  padding: 24px 20px 32px;
  width: 100%;
  max-width: 520px;
  animation: ntp-slide-up 0.2s ease both;
}

@media (min-width: 540px) {
  .ntp-sheet {
    border-radius: 18px;
    padding: 28px 24px;
  }
}

@keyframes ntp-slide-up {
  from { transform: translateY(24px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .ntp-sheet { animation: none; }
}

.ntp-title {
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 6px;
  color: var(--text);
}

.ntp-subtitle {
  font-size: 0.83rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 20px;
}

.ntp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

.ntp-card {
  position: relative;
  border: 2px solid var(--border);
  border-radius: 14px;
  padding: 14px 12px;
  cursor: pointer;
  background: var(--card-bg);
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
  min-height: 110px;
}

.ntp-card:hover {
  background: var(--surface-hover);
}

.ntp-card--selected {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--card-bg));
}

.ntp-card--locked {
  cursor: pointer; /* tap to show upgrade CTA */
}

.ntp-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ntp-card-preview {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ntp-card-preview li {
  font-size: 0.72rem;
  color: var(--text-tertiary);
  padding: 1px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ntp-premium-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.7rem;
  color: var(--gold);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 2px;
}

.ntp-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.ntp-continue-btn {
  width: 100%;
  padding: 13px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.ntp-continue-btn:hover {
  opacity: 0.9;
}

.ntp-skip-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
```

- [ ] **Step 2: Write NoteTemplatePicker component**

```jsx
// src/components/NoteTemplatePicker.jsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { NOTE_TEMPLATES } from "../data/noteTemplates";
import { useSubscription } from "../hooks/useSubscription";
import "../styles/note-templates.css";

export default function NoteTemplatePicker({ userId, onSelect, onDismiss, onUpgrade }) {
  const { t } = useTranslation();
  const { isPremium } = useSubscription(userId);
  const [selectedKey, setSelectedKey] = useState("blank");

  function handleCardClick(template) {
    if (template.isPremium && !isPremium) {
      onUpgrade?.();
      return;
    }
    setSelectedKey(template.key);
  }

  function handleContinue() {
    const template = NOTE_TEMPLATES.find((t) => t.key === selectedKey) ?? NOTE_TEMPLATES[0];
    onSelect(template.content);
  }

  return createPortal(
    <div
      className="ntp-overlay"
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div className="ntp-sheet" role="dialog" aria-modal="true" aria-label="Choose a note template">
        <h2 className="ntp-title">
          {t("noteTemplates.title", "Choose a Template")}
        </h2>
        <p className="ntp-subtitle">
          {t("noteTemplates.subtitle", "Pick a structure to get started")}
        </p>

        <div className="ntp-grid">
          {NOTE_TEMPLATES.map((template) => {
            const locked = template.isPremium && !isPremium;
            return (
              <button
                key={template.key}
                className={[
                  "ntp-card",
                  selectedKey === template.key ? "ntp-card--selected" : "",
                  locked ? "ntp-card--locked" : "",
                ].join(" ")}
                onClick={() => handleCardClick(template)}
                aria-pressed={selectedKey === template.key}
                aria-label={`${template.name}${locked ? " (Premium)" : ""}`}
              >
                {template.isPremium && (
                  <span className="ntp-premium-badge" aria-hidden="true">✦</span>
                )}
                <span className="ntp-card-name">
                  {template.name}
                  {locked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </span>
                <ul className="ntp-card-preview" aria-hidden="true">
                  {template.previewLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                  {template.previewLines.length === 0 && (
                    <li style={{ fontStyle: "italic" }}>Empty note</li>
                  )}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="ntp-actions">
          <button className="ntp-continue-btn" onClick={handleContinue}>
            {t("noteTemplates.continue", "Continue →")}
          </button>
          <button className="ntp-skip-btn" onClick={() => onSelect("")}>
            {t("noteTemplates.skip", "Skip — start blank")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/NoteTemplatePicker.jsx src/styles/note-templates.css
git commit -m "feat: add NoteTemplatePicker modal component"
```

---

## Task 3: Wire Template Picker into StudyNotesPage

**Files:**
- Modify: `src/views/studynotes/StudyNotesPage.jsx`

- [ ] **Step 1: Find the "New Note" trigger**

In `StudyNotesPage.jsx`, find where `editing` is set to `"new"`. This is the trigger for opening the note editor. Example pattern:
```jsx
// Existing pattern — something like:
<button onClick={() => setEditing("new")}>+ New Note</button>
```

And in the editor logic, `editing === "new"` means creating a new note.

- [ ] **Step 2: Add template picker state**

Add import and state at the top of the component:
```js
import NoteTemplatePicker from "../../components/NoteTemplatePicker";
```

Inside the component:
```js
const [showTemplatePicker, setShowTemplatePicker] = useState(false);
const [templateContent, setTemplateContent] = useState("");
```

- [ ] **Step 3: Intercept "New Note" to show picker first**

Change the "New Note" button handler from:
```jsx
onClick={() => setEditing("new")}
```

To:
```jsx
onClick={() => setShowTemplatePicker(true)}
```

- [ ] **Step 4: Handle template selection**

After the picker returns a template, open the editor with pre-filled content:
```jsx
function handleTemplateSelect(content) {
  setTemplateContent(content);
  setShowTemplatePicker(false);
  setEditing("new");
}
```

- [ ] **Step 5: Pre-fill editor with template content**

Find where `EMPTY_NOTE` is used to initialize the new note state. The existing code sets initial values when `editing === "new"`. Update it to use `templateContent`:

```js
// Find the note initialization — typically looks like:
// const [note, setNote] = useState(editing === "new" ? EMPTY_NOTE : selectedNote);

// Update to:
const initialNote = editing === "new"
  ? { ...EMPTY_NOTE, content: templateContent }
  : selectedNote;
```

Or wherever the editor's `content` field is initialized for a new note, substitute `templateContent` for the empty string.

- [ ] **Step 6: Clear templateContent after editor opens**

After `setEditing("new")` is confirmed, reset:
```js
function handleTemplateSelect(content) {
  setTemplateContent(content);
  setShowTemplatePicker(false);
  setEditing("new");
  // Reset so next "New Note" starts fresh (not pre-selected)
  // templateContent will be consumed on editor mount
}
```

Add a `useEffect` to clear `templateContent` once the editor has consumed it:
```js
useEffect(() => {
  if (editing === "new" && templateContent !== "") {
    // Content was consumed — clear it so it doesn't re-apply if editor re-renders
    setTemplateContent("");
  }
}, [editing]);
```

- [ ] **Step 7: Render NoteTemplatePicker**

Add to the JSX (anywhere near the root of the return, alongside other modals):
```jsx
{showTemplatePicker && (
  <NoteTemplatePicker
    userId={user?.id}
    onSelect={handleTemplateSelect}
    onDismiss={() => setShowTemplatePicker(false)}
    onUpgrade={onUpgrade}
  />
)}
```

- [ ] **Step 8: Manual verify**

```bash
npm run dev
# Navigate to Study Notes
# Tap "+ New Note"
# Verify: template picker modal opens
# Select "Blank" → Continue → editor opens empty
# Select "Verse-by-Verse" → Continue → editor pre-filled with template
# Select "Inductive Study" (premium template) as free user → upgrade CTA shown
# Select "Inductive Study" as premium user → editor pre-filled with Observe/Interpret/Apply structure
# Tap "Skip — start blank" → editor opens empty
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add src/views/studynotes/StudyNotesPage.jsx
git commit -m "feat: show template picker before note editor on New Note"
```

---

## Self-Review Checklist

- [ ] Template picker appears when tapping "+ New Note"
- [ ] "Blank" is pre-selected by default
- [ ] "Blank" and "Verse-by-Verse" are accessible to free users
- [ ] "Inductive Study" and "SOAP" show ✦ lock for free users; tapping opens upgrade modal
- [ ] Template content pre-fills the editor's `content` field (not title)
- [ ] "Skip — start blank" bypasses picker and opens empty editor
- [ ] Dismissing the picker (backdrop tap or back) returns to notes list without opening editor
- [ ] No DB changes — template is just a string in the existing `content` field
- [ ] `isPremium` uses existing `useSubscription` hook (covers active/trialing/gifted) ✅
- [ ] `createPortal` ensures modal renders above all other content
